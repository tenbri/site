// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://tenbri.com',
	integrations: [
		starlight({
			title: 'Tenbri',
			description: 'Audit trail for AI agents: every decision signed, chained and provable.',
			logo: { src: './src/assets/mascot.webp', alt: 'Tenbri pangolin' },
			favicon: '/favicon.png',
			customCss: ['./src/styles/theme.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tenbri/tenbri' }],
			editLink: { baseUrl: 'https://github.com/tenbri/site/edit/main/' },
			lastUpdated: true,
			components: { Header: './src/components/DocsHeader.astro' },
			sidebar: [
				{ label: 'Start here', items: [{ autogenerate: { directory: 'docs' } }] },
			],
		}),
	],
});
