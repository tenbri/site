import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
	blog: defineCollection({
		loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
		schema: z.object({
			title: z.string(),
			date: z.coerce.date(),
			excerpt: z.string(),
			author: z.string().default('Tenbri team'),
			tags: z.array(z.string()).default([]),
		}),
	}),
};
