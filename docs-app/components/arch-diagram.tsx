// Tenbri's architecture as a stage-by-status matrix: four step headings across the top, one row per
// status (available, optional, coming soon). Ported from src/components/ArchDiagram.astro, which the
// landing page keeps; change both together. Links are plain anchors with full /docs/ paths.
import { Fragment } from 'react';
import './arch-diagram.css';

interface Item { name: string; detail?: string; href?: string }
interface Stage { title: string; who: string; available: Item[]; optional: Item[]; soon: string[] }

const stages: Stage[] = [
	{
		title: 'Write',
		who: 'Your agents and services',
		available: [
			{ name: '@tenbri.decision', detail: 'Python, TypeScript', href: '/docs/reference/sdk/' },
			{ name: 'Framework adapters', detail: 'Claude, OpenAI, LangGraph', href: '/docs/adapters/' },
			{ name: 'tenbri CLI', detail: 'tenbri append', href: '/docs/reference/cli/' },
		],
		optional: [{ name: 'tenbrid', detail: 'REST and gRPC daemon', href: '/docs/reference/api/' }],
		soon: ['Proxy-observed entries', 'Ingest and Kafka'],
	},
	{
		title: 'Sign and chain',
		who: 'Tenbri core, in Rust',
		available: [
			{ name: 'Intent, then outcome', detail: 'durable before the action', href: '/docs/concepts/streams-and-entries/' },
			{ name: 'Hash chain, Ed25519', detail: 'certified session keys', href: '/docs/concepts/integrity/' },
		],
		optional: [
			{ name: 'Action schemas', detail: 'tenbri.toml', href: '/docs/reference/schemas/' },
			{ name: 'Privacy', detail: 'encrypted bodies, erasure', href: '/docs/concepts/privacy/' },
			{ name: 'OS keychain', detail: 'macOS, Windows', href: '/docs/concepts/keys/' },
		],
		soon: ['PKCS#11, cloud KMS', 'Passkey attestations'],
	},
	{
		title: 'Store',
		who: 'Storage you control',
		available: [
			{ name: 'Local disk', href: '/docs/reference/storage/' },
			{ name: 'Cloudflare R2, MinIO', href: '/docs/examples/object-storage/' },
			{ name: 'AWS S3', detail: 'in progress, real S3 before rc.1', href: '/docs/examples/object-storage/' },
		],
		optional: [{ name: 'Query index', detail: 'SQLite or Parquet', href: '/docs/reference/storage/' }],
		soon: ['GCS, Azure Blob, Postgres', 'Iceberg index, --as-of'],
	},
	{
		title: 'Prove',
		who: 'Anyone with the fingerprint',
		available: [
			{ name: 'Verify offline', detail: 'CLI, Python, Node', href: '/docs/examples/verify-as-an-auditor/' },
			{ name: 'Query and tail', detail: 'by policy version', href: '/docs/examples/policy-change-review/' },
			{ name: 'Checkpoints, receipts', detail: 'proof of one decision', href: '/docs/concepts/integrity/' },
		],
		optional: [
			{ name: 'WASM verifier', detail: 'in the browser', href: '/docs/getting-started/install/' },
			{ name: 'RFC 3161 timestamps', href: '/docs/concepts/integrity/' },
		],
		soon: ['Witnesses, Rekor', 'Silent-stream alerts', 'Viewer, MCP, exports'],
	},
];
const rows = [
	{ key: 'available', label: 'Available' },
	{ key: 'optional', label: 'Optional' },
	{ key: 'soon', label: 'Coming soon' },
] as const;

const itemsOf = (s: Stage, key: (typeof rows)[number]['key']): Item[] =>
	key === 'soon' ? s.soon.map((name) => ({ name })) : s[key];

export function ArchDiagram({ wide = false }: { wide?: boolean }) {
	return (
		<figure className={`arch not-prose${wide ? ' wide' : ''}`} aria-label="Tenbri architecture by stage and status">
			{/* Matrix: wide screens */}
			<div className="matrix" role="table" aria-label="Parts of Tenbri by stage and status">
				<div className="corner" role="rowheader" />
				{stages.map((s, i) => (
					<div key={s.title} className={`hd${i === stages.length - 1 ? ' last' : ''}`} role="columnheader">
						<span className="t">{s.title}</span>
						<span className="w">{s.who}</span>
					</div>
				))}
				{rows.map((r) => (
					<Fragment key={r.key}>
						<div className={`rl ${r.key}`} role="rowheader">
							<span className={`mk ${r.key}`} aria-hidden="true" />
							{r.label}
						</div>
						{stages.map((s) => (
							<div key={s.title} className={`cell ${r.key}`} role="cell">
								{itemsOf(s, r.key).map((it) =>
									it.href ? (
										<a key={it.name} className="it" href={it.href}>
											<span className="nm">{it.name}</span>
											{it.detail && <span className="dt">{it.detail}</span>}
										</a>
									) : (
										<span key={it.name} className="it">
											<span className="nm">{it.name}</span>
										</span>
									),
								)}
							</div>
						))}
					</Fragment>
				))}
			</div>

			{/* Stacked: narrow screens */}
			<ol className="stack">
				{stages.map((s) => (
					<li key={s.title}>
						<p className="sh">
							{s.title}
							<span className="w">{s.who}</span>
						</p>
						{rows.map((r) => {
							const list = itemsOf(s, r.key);
							return (
								list.length > 0 && (
									<div key={r.key} className={`sr ${r.key}`}>
										<p className="rl">
											<span className={`mk ${r.key}`} aria-hidden="true" />
											{r.label}
										</p>
										<ul>
											{list.map((it) => (
												<li key={it.name}>
													{it.href ? <a href={it.href}>{it.name}</a> : it.name}
													{it.detail && <span className="dt"> · {it.detail}</span>}
												</li>
											))}
										</ul>
									</div>
								)
							);
						})}
					</li>
				))}
			</ol>

			<figcaption>
				<p className="take">
					<strong>One Rust core</strong> behind every SDK, the CLI and tenbrid. Entries are signed and chained before
					they reach storage; signing keys never live with the stream.
				</p>
				<p className="src">
					Status as of 0.1.0-beta.3. Source: the <a href="https://github.com/tenbri/tenbri#status">Tenbri roadmap</a>.
				</p>
			</figcaption>
		</figure>
	);
}
