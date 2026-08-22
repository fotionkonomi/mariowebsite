import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One folder per project. One index.md per folder. The folder name is the URL.
//
//   src/content/projects/derveni-krater/index.md   ->   /work/derveni-krater
//
// Images live in the same folder as the index.md that uses them.
const projects = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/projects',
    // The folder name becomes the URL slug: "derveni-krater/index.md" -> "derveni-krater"
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      // Shown as the project heading and in the grid.
      title: z.string(),
      year: z.number(),
      // One or two sentences. Appears under the title in the grid.
      summary: z.string(),
      // The single image that represents this project in the grid.
      hero: image(),
      // Everything else, in the order they should appear on the project page.
      images: z.array(image()).default([]),
      // Animated files (looping turntables, detail loops). These are served
      // exactly as they are, never resized: re-encoding an animated WebP
      // gains nothing and can make the file larger. Stills go in `images`.
      animations: z.array(image()).default([]),
      software: z.array(z.string()).default([]),
      credits: z.string().optional(),
      artstation: z.string().optional(),
      // Lower numbers appear first on the home page. Strongest work first.
      order: z.number().default(99),
      // Set to true to hide a project without deleting it.
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
