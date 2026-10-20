#!/usr/bin/env node
// Converts the Starlight docs (src/content/docs/docs/**) into Fumadocs MDX (docs-app/content/docs/**).
// Repeatable: it wipes and rewrites the output. Run: node docs-app/scripts/convert-starlight.mjs [src] [out]
// The Starlight sources were removed after the migration; to re-run, check them out from commit
// 120e53f (git worktree add /tmp/old 120e53f) and pass /tmp/old/src/content/docs/docs as [src].
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] ?? join(here, '../../src/content/docs/docs');
const OUT = process.argv[3] ?? join(here, '../content/docs');

// Starlight sidebar groups (astro.config.mjs), in order. `...dir` inlines a folder's pages.
const ROOT_PAGES = [
	'---Start here---', 'introduction', 'why-not-logs', '...getting-started',
	'---Concepts---', '...concepts',
	'---Examples---', '...examples',
	'---Adapters---', '...adapters',
	'---Reference---', '...reference',
];

const CALLOUT = { note: 'info', tip: 'idea', caution: 'warn', danger: 'error' };
const warnings = [];

function walk(dir) {
	return readdirSync(dir).flatMap((n) => {
		const p = join(dir, n);
		return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(n) ? [p] : [];
	});
}

// Frontmatter: keep title and description lines verbatim, read sidebar.order, map tableOfContents: false to full.
function splitFrontmatter(src, file) {
	const m = src.match(/^---\n([\s\S]*?)\n---\n/);
	if (!m) throw new Error(`${file}: no frontmatter`);
	const keep = [];
	let order = Infinity;
	let section = null;
	for (const line of m[1].split('\n')) {
		const top = line.match(/^([A-Za-z]+):\s*(.*)$/);
		if (top) {
			section = top[1];
			if (section === 'title' || section === 'description') keep.push(line);
			else if (section === 'tableOfContents' && top[2].trim() === 'false') keep.push('full: true');
			else if (section !== 'sidebar' && section !== 'template' && section !== 'tableOfContents')
				warnings.push(`${file}: dropped frontmatter key ${section}`);
		} else if (section === 'sidebar') {
			const o = line.match(/^\s+order:\s*(-?\d+)/);
			if (o) order = Number(o[1]);
			else if (line.trim()) warnings.push(`${file}: dropped sidebar option ${line.trim()}`);
		} else if (section === 'title' || section === 'description') keep.push(line);
	}
	return { front: keep.join('\n'), order, body: src.slice(m[0].length) };
}

const fenceRe = /^(\s*)(`{3,}|~{3,})(.*)$/;

// Mark which lines sit inside fenced code so tag rewrites never touch code.
function codeMask(lines) {
	const mask = [];
	let open = null;
	for (const l of lines) {
		const f = l.match(fenceRe);
		if (open) {
			mask.push(true);
			if (f && f[2][0] === open[0] && f[2].length >= open.length && !f[3].trim()) open = null;
		} else if (f) {
			mask.push(true);
			open = f[2];
		} else mask.push(false);
	}
	return mask;
}

// <Steps> wrapping an ordered list -> <Steps><Step>### Title ...</Step></Steps>
function convertSteps(lines) {
	const out = [];
	const mask = codeMask(lines);
	for (let i = 0; i < lines.length; i++) {
		const open = !mask[i] && lines[i].match(/^(\s*)<Steps>\s*$/);
		if (!open) { out.push(lines[i]); continue; }
		const ind = open[1];
		let j = i + 1;
		while (j < lines.length && !(lines[j].trim() === '</Steps>' && !mask[j])) j++;
		const items = [];
		for (const l of lines.slice(i + 1, j)) {
			const li = l.match(/^(\s*)(\d+)\.\s+(.*)$/);
			if (li && li[1] === ind) items.push({ first: li[3], pad: li[1].length + li[2].length + 2, body: [] });
			else if (items.length) items.at(-1).body.push(l);
			else if (l.trim()) warnings.push(`<Steps> text before the first item: ${l.trim()}`);
		}
		out.push(`${ind}<Steps>`, '');
		for (const it of items) {
			const bold = it.first.match(/^\*\*(.+?)\*\*\s*$/);
			out.push(`${ind}<Step>`, '');
			out.push(bold ? `${ind}### ${bold[1].replace(/[.:]$/, '')}` : `${ind}${it.first}`);
			for (const b of it.body) out.push(b.trim() ? ind + b.slice(Math.min(it.pad, b.length - b.trimStart().length)) : '');
			while (out.at(-1) === '') out.pop();
			out.push('', `${ind}</Step>`, '');
		}
		out.push(`${ind}</Steps>`);
		i = j;
	}
	return out;
}

// <Tabs syncKey>/<TabItem label> -> code-block tabs when every tab is one code block, else Fumadocs <Tabs>/<Tab>.
function convertTabs(lines) {
	const mask = codeMask(lines);
	const out = [];
	const stack = [];
	const sink = () => (stack.length ? stack.at(-1).items.at(-1)?.body ?? stack.at(-1).pre : out);
	for (let i = 0; i < lines.length; i++) {
		const l = lines[i];
		const code = mask[i];
		let m;
		if (!code && (m = l.match(/^(\s*)<Tabs(?:\s+syncKey="([^"]+)")?\s*>\s*$/))) {
			stack.push({ ind: m[1], key: m[2], items: [], pre: [] });
		} else if (!code && stack.length && (m = l.match(/^\s*<TabItem\s+label="([^"]+)"[^>]*>\s*$/))) {
			stack.at(-1).items.push({ label: m[1], body: [] });
		} else if (!code && stack.length && /^\s*<\/TabItem>\s*$/.test(l)) {
			// body already collected
		} else if (!code && stack.length && /^\s*<\/Tabs>\s*$/.test(l)) {
			const t = stack.pop();
			if (t.pre.some((x) => x.trim())) warnings.push(`text outside <TabItem>: ${t.pre.join(' ').trim()}`);
			sink().push(...renderTabs(t));
		} else {
			if (!code && /<\/?(Tabs|TabItem)\b/.test(l)) warnings.push(`unconverted tab tag: ${l.trim()}`);
			sink().push(l);
		}
	}
	if (stack.length) throw new Error('unclosed <Tabs>');
	return out;
}

function trimBlank(a) {
	let s = 0, e = a.length;
	while (s < e && !a[s].trim()) s++;
	while (e > s && !a[e - 1].trim()) e--;
	return a.slice(s, e);
}

function isSingleFence(body) {
	const b = trimBlank(body);
	if (b.length < 2) return false;
	const f = b[0].match(fenceRe);
	if (!f) return false;
	const mask = codeMask(b);
	return mask.every(Boolean) && b.at(-1).trim() === f[2] && b.slice(1, -1).every((x) => !(x.trim() === f[2]));
}

function renderTabs({ ind, key, items }) {
	if (items.every((it) => isSingleFence(it.body))) {
		const out = [];
		for (const it of items) {
			const b = trimBlank(it.body);
			const f = b[0].match(fenceRe);
			const attrs = ` tab=${JSON.stringify(it.label)}${key ? ` tab-group=${JSON.stringify(key)}` : ''}`;
			out.push(`${f[1]}${f[2]}${f[3].trimEnd()}${attrs}`, ...b.slice(1), '');
		}
		out.pop();
		return out;
	}
	const props = key ? ` groupId=${JSON.stringify(key)} persist` : '';
	const out = [`${ind}<Tabs${props} items={${JSON.stringify(items.map((x) => x.label))}}>`];
	for (const it of items) out.push(`${ind}<Tab value=${JSON.stringify(it.label)}>`, '', ...trimBlank(it.body), '', `${ind}</Tab>`);
	out.push(`${ind}</Tabs>`);
	return out;
}

// Asides, ::: directives, cards, imports.
function convertRest(lines, file) {
	const mask = codeMask(lines);
	const out = [];
	let directive = false;
	for (let i = 0; i < lines.length; i++) {
		let l = lines[i];
		if (mask[i]) { out.push(l); continue; }
		let m;
		if (/^import\s.+from\s+'@astrojs\/starlight\/components';?\s*$/.test(l)) continue;
		if ((m = l.match(/^import\s+(\w+)\s+from\s+'[^']*components\/(\w+)\.astro';?\s*$/))) {
			if (m[2] !== 'ArchDiagram') warnings.push(`${file}: unknown component import ${m[2]}`);
			out.push(`import { ${m[1]} } from '@/components/arch-diagram';`);
			continue;
		}
		if ((m = l.match(/^:::(note|tip|caution|danger)(?:\[(.*)\])?\s*$/))) {
			out.push(`<Callout type="${CALLOUT[m[1]]}"${m[2] ? ` title=${JSON.stringify(m[2])}` : ''}>`, '');
			directive = true;
			continue;
		}
		if (directive && l.trim() === ':::') {
			while (out.at(-1) === '') out.pop();
			out.push('', '</Callout>');
			directive = false;
			continue;
		}
		l = l.replace(/<Aside((?:\s+\w+="[^"]*")*)\s*>/g, (_, attrs) => {
			const type = attrs.match(/type="(\w+)"/)?.[1] ?? 'note';
			const title = attrs.match(/title="([^"]*)"/)?.[1];
			if (!CALLOUT[type]) warnings.push(`${file}: unknown Aside type ${type}`);
			return `<Callout type="${CALLOUT[type] ?? 'info'}"${title ? ` title=${JSON.stringify(title)}` : ''}>`;
		});
		l = l.replace(/<\/Aside>/g, '</Callout>')
			.replace(/<CardGrid>/g, '<Cards>').replace(/<\/CardGrid>/g, '</Cards>')
			.replace(/<LinkCard\b/g, '<Card');
		const left = l.match(/<([A-Z]\w*)/g)?.filter((t) => !/^<(Callout|Cards|Card|Tabs|Tab|Steps|Step|ArchDiagram)$/.test(t));
		if (left?.length && !/`[^`]*<[A-Z]/.test(l)) warnings.push(`${file}: unknown component ${left.join(', ')}`);
		out.push(l);
	}
	if (directive) throw new Error(`${file}: unclosed ::: directive`);
	return out;
}

if (!existsSync(SRC)) throw new Error(`no Starlight content at ${SRC}`);
rmSync(OUT, { recursive: true, force: true });
const folders = new Map();
for (const file of walk(SRC).sort()) {
	const rel = relative(SRC, file);
	const { front, order, body } = splitFrontmatter(readFileSync(file, 'utf8'), rel);
	let lines = body.split('\n');
	lines = convertSteps(lines);
	lines = convertTabs(lines);
	lines = convertRest(lines, rel);
	const text = `---\n${front}\n---\n${lines.join('\n').replace(/\n{3,}/g, '\n\n')}`;
	const dest = join(OUT, rel.replace(/\.md$/, '.mdx'));
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, text);
	const dir = dirname(rel);
	if (dir !== '.') {
		if (!folders.has(dir)) folders.set(dir, []);
		folders.get(dir).push({ slug: basename(rel, extname(rel)), order });
	}
}
for (const [dir, pages] of folders) {
	pages.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
	writeFileSync(join(OUT, dir, 'meta.json'), JSON.stringify({ pages: pages.map((p) => p.slug) }, null, 2) + '\n');
}
writeFileSync(join(OUT, 'meta.json'), JSON.stringify({ root: true, pages: ROOT_PAGES }, null, 2) + '\n');

console.log(`converted ${walk(SRC).length} pages into ${relative(process.cwd(), OUT) || OUT}`);
for (const w of warnings) console.warn(`warning: ${w}`);
