/* ─── Build-time SEO generator ───
   Runs after `vite build` (see package.json). For every route it:
     1. writes dist/<route>/index.html with route-specific <head> meta
        (title, description, canonical, OG/Twitter, JSON-LD) so crawlers
        and social scrapers get correct tags without executing any JS —
        Vercel serves these static files before the SPA rewrite kicks in;
     2. generates dist/sitemap.xml and dist/robots.txt from the actual
        data files (src/data/portfolio.js, src/data/blog.js) so they can
        never go stale.
   The live origin comes from site.config.mjs — change SITE_URL there
   when the domain changes and rebuild. */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, OG_IMAGE } from '../site.config.mjs';
import { selectedWork } from '../src/data/portfolio.js';
import { blogPosts } from '../src/data/blog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
// Origin hard-coded in index.html; rewritten to SITE_URL in every emitted file.
const PLACEHOLDER_ORIGIN = 'https://design-lab-portfolio.vercel.app';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const person = { '@type': 'Person', name: SITE_NAME, url: `${SITE_URL}/` };

/* Descriptions mirror the useSEO() calls in src/pages — keep in sync. */
const routes = [
  {
    path: '/', priority: 1.0,
    title: DEFAULT_TITLE,
    description: 'Full-stack developer at IIIT Vadodara shipping production web, mobile, and AI products for real businesses.',
  },
  {
    path: '/projects', priority: 0.9,
    title: 'Projects',
    description: 'Shipped projects — payments, bookings, PWAs, native Android, and AI tools — each with a full case study.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Projects — Harshil Patel',
      url: `${SITE_URL}/projects`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: selectedWork.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.title, url: `${SITE_URL}/projects/${p.slug}`,
        })),
      },
    },
  },
  ...selectedWork.map((p) => ({
    path: `/projects/${p.slug}`, priority: 0.8,
    title: p.title,
    description: p.description,
    image: p.image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CreativeWork',
          name: p.title,
          description: p.description,
          url: `${SITE_URL}/projects/${p.slug}`,
          dateCreated: p.year,
          author: person,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE_URL}/projects` },
            { '@type': 'ListItem', position: 3, name: p.title, item: `${SITE_URL}/projects/${p.slug}` },
          ],
        },
      ],
    },
  })),
  {
    path: '/blog', priority: 0.7,
    title: 'Blog',
    description: 'Writing on React, AI tooling, and shipping software that leaves the repo.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog — Harshil Patel',
      url: `${SITE_URL}/blog`,
      author: person,
      blogPost: blogPosts.map((b) => ({
        '@type': 'BlogPosting', headline: b.title, url: `${SITE_URL}/blog/${b.slug}`, datePublished: b.date,
      })),
    },
  },
  ...blogPosts.map((b) => ({
    path: `/blog/${b.slug}`, priority: 0.6,
    title: b.title,
    description: b.excerpt,
    type: 'article',
    lastmod: b.date,
    published: b.date,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: b.title,
      description: b.excerpt,
      datePublished: b.date,
      url: `${SITE_URL}/blog/${b.slug}`,
      image: SITE_URL + OG_IMAGE,
      author: person,
      mainEntityOfPage: `${SITE_URL}/blog/${b.slug}`,
    },
  })),
  {
    path: '/creative', priority: 0.7,
    title: 'Guy With Black 350',
    description: 'The automotive content side of Harshil Patel — the guy with black 350. Reels, brand collaborations, and 22M+ views as @guywithblack350 on Instagram.',
  },
  {
    path: '/contact', priority: 0.8,
    title: 'Contact',
    description: 'Open to select freelance opportunities, full-time roles, and interesting conversations.',
  },
  {
    path: '/playground', priority: 0.5,
    title: 'Playground',
    description: 'Webcam hand-tracking physics playground — pinch, grab, and throw objects with your hands.',
  },
  {
    path: '/drive', priority: 0.5,
    title: 'Drive',
    description: 'A playable arcade racer hidden in the portfolio. The world is gray until you drive.',
  },
  {
    path: '/drift', priority: 0.5,
    title: 'Race',
    description: 'A pocket F1 car flat-out on a banked superspeedway oval. Chase lap times, kiss the wall, light up the tyres.',
  },
];

const setMeta = (html, attr, key, content) =>
  html.replace(
    new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`),
    `$1${esc(content)}$2`,
  );

function renderRoute(base, r) {
  const fullTitle = r.path === '/' ? DEFAULT_TITLE : `${r.title} — ${SITE_NAME}`;
  const url = SITE_URL + r.path;
  const image = SITE_URL + (r.image || OG_IMAGE);

  let html = base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);

  html = setMeta(html, 'name', 'title', fullTitle);
  html = setMeta(html, 'name', 'description', r.description);
  html = setMeta(html, 'property', 'og:title', fullTitle);
  html = setMeta(html, 'property', 'og:description', r.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:alt', `${r.title || SITE_NAME} — ${SITE_NAME}`);
  html = setMeta(html, 'property', 'og:type', r.type || 'website');
  html = setMeta(html, 'name', 'twitter:title', fullTitle);
  html = setMeta(html, 'name', 'twitter:description', r.description);
  html = setMeta(html, 'name', 'twitter:url', url);
  html = setMeta(html, 'name', 'twitter:image', image);

  // Project screenshots have unknown dimensions — drop the 1200×630 hints.
  if (r.image) html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*" \/>/g, '');

  if (r.published) {
    html = html.replace(
      '</head>',
      `  <meta property="article:published_time" content="${r.published}" />\n  </head>`,
    );
  }
  if (r.jsonLd) {
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">${JSON.stringify(r.jsonLd)}</script>\n  </head>`,
    );
  }
  return html;
}

const base = (await readFile(path.join(DIST, 'index.html'), 'utf8'))
  .replaceAll(PLACEHOLDER_ORIGIN, SITE_URL);

for (const r of routes) {
  const outDir = path.join(DIST, ...r.path.split('/').filter(Boolean));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), renderRoute(base, r));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((r) => `  <url><loc>${SITE_URL}${r.path}</loc><lastmod>${r.lastmod || BUILD_DATE}</lastmod><priority>${r.priority.toFixed(1)}</priority></url>`)
  .join('\n')}
</urlset>
`;
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap);

await writeFile(
  path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
);

console.log(`SEO: ${routes.length} routes prerendered, sitemap.xml + robots.txt written (origin: ${SITE_URL})`);
