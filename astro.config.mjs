// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// The docs are a separate Next.js + Fumadocs app in docs-app/, exported into dist/docs/ by `pnpm build`.
export default defineConfig({
	site: 'https://tenbri.com',
	integrations: [mdx()],
});
