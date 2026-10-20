#!/usr/bin/env node
// Checks the exported site in dist/: every URL the Starlight docs served still exists, and every
// internal link and fragment in dist/docs/**/index.html resolves. Run after `pnpm build`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '../../dist');

// The routes Starlight served (src/content/docs/docs/** at commit 120e53f), plus /docs/ itself.
const OLD_ROUTES = [
	'docs', 'docs/introduction', 'docs/why-not-logs',
	'docs/getting-started/install', 'docs/getting-started/quickstart',
	'docs/concepts/architecture', 'docs/concepts/integrity', 'docs/concepts/keys', 'docs/concepts/privacy',
	'docs/concepts/streams-and-entries',
	'docs/examples', 'docs/examples/object-storage', 'docs/examples/policy-change-review',
	'docs/examples/record-a-refund', 'docs/examples/rust-writer', 'docs/examples/schemas-in-ci',
	'docs/examples/tenbrid-rest', 'docs/examples/verify-as-an-auditor',
	'docs/adapters', 'docs/adapters/claude-agent-sdk', 'docs/adapters/langgraph', 'docs/adapters/openai-agents',
	'docs/adapters/planned',
	'docs/reference/api', 'docs/reference/cli', 'docs/reference/entry-format', 'docs/reference/errors',
	'docs/reference/schemas', 'docs/reference/sdk', 'docs/reference/storage',
];

const errors = [];
for (const r of OLD_ROUTES) if (!existsSync(join(DIST, r, 'index.html'))) errors.push(`missing route /${r}/`);
for (const f of ['404.html', 'docs/404.html', 'docs/search.json']) if (!existsSync(join(DIST, f))) errors.push(`missing ${f}`);

const walk = (d) => readdirSync(d).flatMap((n) => {
	const p = join(d, n);
	return statSync(p).isDirectory() ? walk(p) : n === 'index.html' ? [p] : [];
});

const idCache = new Map();
const idsOf = (file) => {
	if (!idCache.has(file)) idCache.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
	return idCache.get(file);
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

let links = 0;
for (const page of walk(join(DIST, 'docs'))) {
	const html = readFileSync(page, 'utf8');
	const from = '/' + page.slice(DIST.length + 1).replace(/index\.html$/, '');
	for (const [, raw] of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
		const href = decode(raw);
		if (/^(https?:|mailto:|\/\/)/.test(href)) continue;
		links++;
		const url = new URL(href, `https://tenbri.com${from}`);
		const path = decodeURIComponent(url.pathname);
		if (path.startsWith('/_next/') || path.startsWith('/docs/_next/')) continue;
		let target = join(DIST, path);
		if (path.endsWith('/')) target = join(target, 'index.html');
		else if (existsSync(join(target, 'index.html'))) target = join(target, 'index.html');
		if (!existsSync(target)) { errors.push(`${from}: broken link ${href}`); continue; }
		const frag = url.hash.slice(1);
		if (frag && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(frag)))
			errors.push(`${from}: missing fragment ${href}`);
	}
}

console.log(`checked ${OLD_ROUTES.length} old routes and ${links} internal links`);
if (errors.length) {
	for (const e of errors) console.error(e);
	process.exit(1);
}
