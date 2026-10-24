import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Case studies, one Markdown file per locale: `projects/<locale>/<slug>.md`.
 * The entry id is therefore `<locale>/<slug>`.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    summary: z.string(),
    year: z.number().int(),
    role: z.string(),
    badge: z.string().optional(),
    order: z.number().int(),
    /** Visual used on the card and the case-study header. */
    visual: z.enum(['flora', 'rfid', 'snake', 'compiler']),
    stack: z.array(z.string()).min(1),
    repo: z.url(),
    stats: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .max(3)
      .default([]),
  }),
});

export const collections = { projects };
