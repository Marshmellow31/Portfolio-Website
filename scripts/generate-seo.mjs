/* ─── Build-time SEO generator ───
   Runs after `vite build` (see package.json). For every route it:
     1. writes dist/<route>/index.html with route-specific <head> meta
        (title, description, canonical, OG/Twitter, JSON-LD) so crawlers
        and social scrapers get correct tags without executing any JS —
        Vercel serves these static files before the SPA rewrite kicks in;
     2. generates dist/sitemap.xml (with Google Image search support),
        dist/robots.txt, and dist/rss.xml from actual data files
        (src/data/portfolio.js, src/data/blog.js).
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
const PLACEHOLDER_ORIGIN = 'https://www.harshilpatel.co.in';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const person = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  sameAs: [
    'https://github.com/Marshmellow31',
    'https://linkedin.com/in/harshil-patel-5a7373333',
    'https://www.instagram.com/harshil_3105_/',
    'https://www.instagram.com/guywithblack350/',
  ],
};

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
      '@graph': [
        {
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
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE_URL}/projects` },
          ],
        },
      ],
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
          '@type': 'SoftwareApplication',
          name: p.title,
          description: p.description,
          url: `${SITE_URL}/projects/${p.slug}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: p.stack.some(s => s.toLowerCase().includes('android') || s.toLowerCase().includes('kotlin')) ? 'Android, Web Browser' : 'Web Browser',
          author: person,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
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
      '@graph': [
        {
          '@type': 'Blog',
          name: 'Blog — Harshil Patel',
          url: `${SITE_URL}/blog`,
          author: person,
          blogPost: blogPosts.map((b) => ({
            '@type': 'BlogPosting', headline: b.title, url: `${SITE_URL}/blog/${b.slug}`, datePublished: b.date,
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          ],
        },
      ],
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
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: b.title,
          description: b.excerpt,
          datePublished: b.date,
          dateModified: b.date,
          url: `${SITE_URL}/blog/${b.slug}`,
          image: SITE_URL + OG_IMAGE,
          inLanguage: 'en-US',
          author: person,
          publisher: person,
          mainEntityOfPage: `${SITE_URL}/blog/${b.slug}`,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: b.title, item: `${SITE_URL}/blog/${b.slug}` },
          ],
        },
      ],
    },
  })),
  {
    path: '/creative', priority: 0.7,
    title: 'Guy With Black 350',
    description: 'The automotive content side of Harshil Patel — the guy with black 350. Reels, brand collaborations, and 22M+ views as @guywithblack350 on Instagram.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Guy With Black 350', item: `${SITE_URL}/creative` },
      ],
    },
  },
  {
    path: '/contact', priority: 0.8,
    title: 'Contact',
    description: 'Open to select freelance opportunities, full-time roles, and interesting conversations.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      ],
    },
  },
  {
    path: '/playground', priority: 0.5,
    title: 'Playground',
    description: 'Webcam hand-tracking physics playground — pinch, grab, and throw objects with your hands.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Playground', item: `${SITE_URL}/playground` },
      ],
    },
  },
  {
    path: '/drive', priority: 0.5,
    title: 'Drive',
    description: 'A playable arcade racer hidden in the portfolio. The world is gray until you drive.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Drive', item: `${SITE_URL}/drive` },
      ],
    },
  },
  {
    path: '/drift', priority: 0.5,
    title: 'Race',
    description: 'A pocket F1 car flat-out on a banked superspeedway oval. Chase lap times, kiss the wall, light up the tyres.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Race', item: `${SITE_URL}/drift` },
      ],
    },
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

// Generate sitemap with Google Image extension
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${routes
  .map((r) => {
    const imgUrl = `${SITE_URL}${r.image || OG_IMAGE}`;
    return `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${r.lastmod || BUILD_DATE}</lastmod>
    <priority>${r.priority.toFixed(1)}</priority>
    <image:image>
      <image:loc>${imgUrl}</image:loc>
      <image:title>${esc(r.title)}</image:title>
    </image:image>
  </url>`;
  })
  .join('\n')}
</urlset>
`;
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap);

// Generate RSS 2.0 Feed for Blog Posts
const rssItems = blogPosts
  .map(
    (b) => `    <item>
      <title>${esc(b.title)}</title>
      <link>${SITE_URL}/blog/${b.slug}</link>
      <guid>${SITE_URL}/blog/${b.slug}</guid>
      <pubDate>${new Date(b.date).toUTCString()}</pubDate>
      <description>${esc(b.excerpt)}</description>
    </item>`
  )
  .join('\n');

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(DEFAULT_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>Writing on React, AI tooling, and shipping software that leaves the repo by Harshil Patel.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>
`;
await writeFile(path.join(DIST, 'rss.xml'), rssXml);

await writeFile(
  path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n# AI Engine context\n# llms.txt: ${SITE_URL}/llms.txt\n`,
);

console.log(`SEO: ${routes.length} routes prerendered, sitemap.xml + rss.xml + robots.txt written (origin: ${SITE_URL})`);
