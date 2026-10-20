// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

export default defineConfig({
	site: 'https://tenbri.com',
	integrations: [
		starlight({
			title: 'Tenbri',
			description: 'Audit trail for AI agents: every decision signed, chained and provable.',
			logo: { src: './src/assets/mascot.webp', alt: 'Tenbri pangolin' },
			favicon: '/favicon.png',
			customCss: ['@fontsource-variable/fredoka', './src/styles/theme.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tenbri/tenbri' }],
			editLink: { baseUrl: 'https://github.com/tenbri/site/edit/main/' },
			lastUpdated: true,
			plugins: [
				starlightBlog({
					authors: {
						amine: { name: 'Amine', title: 'Tenbri maintainer', url: 'https://github.com/tenbri' },
					},
					metrics: { readingTime: true },
				}),
			],
			sidebar: [
				{ label: 'Start here', items: [{ autogenerate: { directory: 'docs' } }] },
			],
		}),
	],
});
