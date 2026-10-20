import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const posts = (await getCollection('blog')).sort((a, b) => b.data.date - a.data.date);
	return rss({
		title: 'Tenbri blog',
		description: 'Notes on building an audit trail for AI agents.',
		site: context.site,
		items: posts.map((p) => ({ title: p.data.title, pubDate: p.data.date, description: p.data.excerpt, link: `/blog/${p.id}/` })),
	});
}
