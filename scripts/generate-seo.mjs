/* ─── Build-time SEO generator ───
   Runs after `vite build` (see package.json). For every route it:
     1. writes dist/<route>/index.html with route-specific <head> meta
        (title, description, canonical, OG/Twitter, JSON-LD) so crawlers
        and social scrapers get correct tags without executing any JS —
        Vercel serves these static files before the SPA rewrite kicks in;
     2. writes a route-specific <noscript> body so non-rendering crawlers
        (LLM bots especially) get the real content of *that* page instead
        of 26 copies of the homepage;
     3. generates dist/sitemap.xml (with Google Image search support),
        dist/robots.txt, dist/rss.xml, and a real dist/404.html.
   The live origin comes from site.config.mjs — change SITE_URL there
   when the domain changes and rebuild. */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, OG_IMAGE, AUTHOR } from '../site.config.mjs';
import { selectedWork, workHistory } from '../src/data/portfolio.js';
import { blogPosts } from '../src/data/blog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
// Origin hard-coded in index.html; rewritten to SITE_URL in every emitted file.
const PLACEHOLDER_ORIGIN = 'https://www.harshilpatel.co.in';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/* ── lastmod ──────────────────────────────────────────────────────────
   Stamping every URL with today's date on every build teaches Google to
   ignore the field. Derive it from the last commit that touched the files
   actually backing each route, and fall back to the build date only when
   git can't answer (shallow clone, uncommitted file, no git at all). */
const gitDateCache = new Map();
function gitDate(file) {
  if (gitDateCache.has(file)) return gitDateCache.get(file);
  let out = null;
  try {
    const raw = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (raw) out = raw.slice(0, 10);
  } catch {
    /* git unavailable — fall through to the build date */
  }
  gitDateCache.set(file, out);
  return out;
}
const lastmodOf = (...files) => {
  const dates = files.map(gitDate).filter(Boolean);
  return dates.length ? dates.sort().at(-1) : BUILD_DATE;
};

const DATA = 'src/data/portfolio.js';
const BLOG_DATA = 'src/data/blog.js';

/* ── no-JS body content ───────────────────────────────────────────────
   A faithful text rendering of the same data the React page draws, so
   crawlers that don't execute JS index the real page. */
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

/* Minimal markdown → HTML covering the subset the blog actually uses. */
function mdToHtml(md) {
  return String(md)
    .trim()
    .split(/\n{2,}/)
    .map((raw) => {
      const b = raw.trim();
      if (!b) return '';
      if (b.startsWith('```')) return `<pre>${esc(b.replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, ''))}</pre>`;
      const h = b.match(/^(#{1,4})\s+([\s\S]*)$/);
      if (h && !h[2].includes('\n')) return `<h${Math.max(2, h[1].length)}>${inline(h[2])}</h${Math.max(2, h[1].length)}>`;
      const lines = b.split('\n').map((l) => l.trim());
      if (lines.every((l) => /^[-*]\s+/.test(l)))
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      if (lines.every((l) => /^\d+\.\s+/.test(l)))
        return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
      return `<p>${inline(b)}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

const linkList = (links) =>
  links.filter(([, href]) => href).map(([label, href]) => `<a href="${esc(href)}">${esc(label)}</a>`).join(' · ');

const SOCIALS = linkList([
  ['GitHub', 'https://github.com/Marshmellow31'],
  ['LinkedIn', 'https://linkedin.com/in/harshil-patel-5a7373333'],
  ['Instagram', 'https://www.instagram.com/harshil_3105_/'],
  ['@guywithblack350', 'https://www.instagram.com/guywithblack350/'],
]);

const CONTACT_BLOCK = `<h2>Contact</h2>
<p>Email: <a href="mailto:${AUTHOR.email}">${AUTHOR.email}</a></p>
<p>${SOCIALS}</p>`;

function homeBody() {
  return `<h1>Harshil Patel — Software Engineer at IIIT Vadodara</h1>
<p>Software engineer and B.Tech student at IIIT Vadodara. Builds production web apps, mobile apps, and AI tools. Automotive content creator <a href="https://www.instagram.com/guywithblack350/">@guywithblack350</a> with 22M+ views.</p>
<h2>Selected Work</h2>
<ul>${selectedWork
    .map(
      (p) =>
        `<li><a href="${SITE_URL}/projects/${p.slug}"><strong>${esc(p.title)}</strong></a> — ${esc(p.description)}</li>`,
    )
    .join('')}</ul>
<h2>Experience</h2>
<ul>${workHistory
    .map(
      (w) =>
        `<li><strong>${esc(w.company)}</strong> — ${esc(w.role)}${w.location ? ` (${esc(w.location)})` : ''}${
          w.projects?.length ? `: ${esc(w.projects.map((p) => p.name).join(', '))}` : ''
        }</li>`,
    )
    .join('')}</ul>
${CONTACT_BLOCK}`;
}

function projectsBody() {
  return `<h1>Projects — Harshil Patel</h1>
<p>Shipped projects — payments, bookings, PWAs, native Android, and AI tools — each with a full case study.</p>
<ul>${selectedWork
    .map(
      (p) =>
        `<li><a href="${SITE_URL}/projects/${p.slug}"><strong>${esc(p.title)}</strong></a> (${esc(
          p.year,
        )}) — ${esc(p.description)}<br />Stack: ${esc(p.stack.join(', '))}</li>`,
    )
    .join('')}</ul>`;
}

function projectBody(p) {
  const feat = Array.isArray(p.features)
    ? p.features
        .map((f) => (Array.isArray(f) ? `<li><strong>${esc(f[0])}</strong> — ${esc(f[1] ?? '')}</li>` : `<li>${esc(f)}</li>`))
        .join('')
    : '';
  const links = linkList([
    ['Live site', p.link || (typeof p.live === 'string' ? p.live : null)],
    ['GitHub', p.github],
    ['Paper (PDF)', p.paper],
  ]);
  return `<h1>${esc(p.title)}</h1>
<p><strong>${esc(p.role || '')}</strong>${p.year ? ` · ${esc(p.year)}` : ''}</p>
<p>${esc(p.description)}</p>
${p.problem ? `<h2>Problem</h2><p>${esc(p.problem)}</p>` : ''}
${p.approach ? `<h2>Approach</h2><p>${esc(p.approach)}</p>` : ''}
${feat ? `<h2>Features</h2><ul>${feat}</ul>` : ''}
${p.outcome ? `<h2>Outcome</h2><p>${esc(p.outcome)}</p>` : ''}
<h2>Stack</h2><p>${esc(p.stack.join(', '))}</p>
${links ? `<h2>Links</h2><p>${links}</p>` : ''}
<p><a href="${SITE_URL}/projects">All projects</a> · <a href="${SITE_URL}/">Harshil Patel</a></p>`;
}

function blogIndexBody() {
  return `<h1>Blog — Harshil Patel</h1>
<p>Writing on React, AI tooling, and shipping software that leaves the repo.</p>
<ul>${blogPosts
    .map(
      (b) =>
        `<li><a href="${SITE_URL}/blog/${b.slug}"><strong>${esc(b.title)}</strong></a> — <time datetime="${esc(
          b.date,
        )}">${esc(b.date)}</time> · ${esc(b.readTime || '')}<br />${esc(b.excerpt)}</li>`,
    )
    .join('')}</ul>`;
}

function blogPostBody(b) {
  return `<article>
<h1>${esc(b.title)}</h1>
<p>By <a href="${SITE_URL}/">Harshil Patel</a> · <time datetime="${esc(b.date)}">${esc(b.date)}</time>${
    b.readTime ? ` · ${esc(b.readTime)}` : ''
  }${b.tags?.length ? ` · ${esc(b.tags.join(', '))}` : ''}</p>
<p><em>${esc(b.excerpt)}</em></p>
${mdToHtml(b.content)}
${b.guideContent ? `<h2>${esc(b.guideLabel || 'Guide')}</h2>${mdToHtml(b.guideContent)}` : ''}
</article>
<p><a href="${SITE_URL}/blog">All posts</a> · <a href="${SITE_URL}/">Harshil Patel</a></p>`;
}

const simpleBody = (heading, description, extra = '') =>
  `<h1>${esc(heading)}</h1>\n<p>${esc(description)}</p>\n${extra}
<p><a href="${SITE_URL}/">Harshil Patel</a> · <a href="${SITE_URL}/projects">Projects</a> · <a href="${SITE_URL}/blog">Blog</a> · <a href="${SITE_URL}/contact">Contact</a></p>`;

/* ── structured data ─────────────────────────────────────────────────── */
const person = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  sameAs: AUTHOR.sameAs,
};

/* Descriptions mirror the useSEO() calls in src/pages — keep in sync. */
const routes = [
  {
    path: '/', priority: 1.0,
    title: DEFAULT_TITLE,
    description: 'Software engineer and B.Tech student at IIIT Vadodara shipping production web, mobile, and AI products for real businesses.',
    lastmod: lastmodOf('src/pages/Home.jsx', DATA),
    body: homeBody(),
  },
  {
    path: '/projects', priority: 0.9,
    title: 'Projects',
    description: 'Shipped projects — payments, bookings, PWAs, native Android, and AI tools — each with a full case study.',
    lastmod: lastmodOf('src/pages/Projects.jsx', DATA),
    body: projectsBody(),
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
    lastmod: lastmodOf(DATA, 'src/pages/ProjectDetail.jsx'),
    body: projectBody(p),
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
    lastmod: lastmodOf('src/pages/Blog.jsx', BLOG_DATA),
    body: blogIndexBody(),
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
    body: blogPostBody(b),
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
          keywords: (b.tags || []).join(', '),
          wordCount: String(b.content || '').trim().split(/\s+/).length,
          articleSection: (b.tags || [])[0] || 'Engineering',
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
    lastmod: lastmodOf('src/pages/Creative.jsx'),
    body: simpleBody(
      'Guy With Black 350 — the creator side of Harshil Patel',
      'The automotive content side of Harshil Patel — the guy with black 350. Reels, brand collaborations, and 22M+ views as @guywithblack350 on Instagram.',
      `<p>Follow: <a href="https://www.instagram.com/guywithblack350/">@guywithblack350 on Instagram</a></p>`,
    ),
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
    lastmod: lastmodOf('src/pages/Contact.jsx'),
    body: simpleBody(
      'Contact Harshil Patel',
      'Open to select freelance opportunities, full-time roles, and interesting conversations.',
      CONTACT_BLOCK,
    ),
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
    lastmod: lastmodOf('src/pages/Playground.jsx'),
    body: simpleBody(
      'Playground — webcam hand-tracking physics',
      'Webcam hand-tracking physics playground — pinch, grab, and throw objects with your hands. Runs entirely in the browser with MediaPipe; no video ever leaves your device.',
    ),
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
    lastmod: lastmodOf('src/pages/Drive.jsx'),
    body: simpleBody(
      'Drive — an arcade racer hidden in the portfolio',
      'A playable arcade racer hidden in the portfolio. The world is gray until you drive. Built with React Three Fiber.',
    ),
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
    lastmod: lastmodOf('src/pages/Drift.jsx', 'src/lib/drift-track.js'),
    body: simpleBody(
      'Race — a pocket F1 car on a banked superspeedway',
      'A pocket F1 car flat-out on a banked superspeedway oval. Chase lap times, kiss the wall, light up the tyres. Built with React Three Fiber and Rapier physics.',
    ),
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

const NOSCRIPT_STYLE = 'max-width:720px;margin:80px auto;padding:24px;font-family:system-ui,sans-serif;color:#f2f2f3;background:#0a0a0b';

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
  /* index.html hard-codes the default card's MIME type. Routes are free to
     point at a JPEG or PNG instead, so the type has to follow the file. */
  const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml' };
  html = setMeta(html, 'property', 'og:image:type', MIME[image.split('.').pop().toLowerCase()] || 'image/jpeg');
  html = setMeta(html, 'property', 'og:type', r.type || 'website');
  html = setMeta(html, 'name', 'twitter:title', fullTitle);
  html = setMeta(html, 'name', 'twitter:description', r.description);
  html = setMeta(html, 'name', 'twitter:url', url);
  html = setMeta(html, 'name', 'twitter:image', image);

  /* Project screenshots have unknown dimensions — drop the 1200×630 hints.
     Cards cut by scripts/optimize-case-images.mjs are the exception: they're
     built at exactly 1200×630, so the hints stay and scrapers can reserve the
     card before the image downloads. */
  if (r.image && !image.endsWith('-og.jpg')) {
    html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*" \/>/g, '');
  }

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

  const routeH1 = r.path === '/' ? DEFAULT_TITLE : `${r.title} — ${SITE_NAME}`;
  html = html.replace(
    /<div id="root">.*?<\/div>/s,
    `<div id="root"><h1 class="sr-only">${esc(routeH1)}</h1></div>`,
  );

  /* Replace the homepage no-JS block with this route's own content. Matched
     by id, not by position — there is another <noscript> in <head> holding
     the font stylesheet fallback. */
  if (r.body) {
    const before = html;
    html = html.replace(
      /<noscript id="page-content">[\s\S]*?<\/noscript>/,
      `<noscript id="page-content">\n      <div style="${NOSCRIPT_STYLE}">\n${r.body}\n      </div>\n    </noscript>`,
    );
    if (html === before) {
      console.error(`\nSEO: could not find <noscript id="page-content"> in index.html — no-JS content for ${r.path} was not written.\n`);
      process.exit(1);
    }
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

/* ── coverage guard ───────────────────────────────────────────────────
   vercel.json deliberately has no catch-all rewrite, so a route that the
   router knows about but this file forgot would 404 in production instead
   of falling back to the SPA shell. Fail the build loudly rather than
   shipping a dead page. */
const appSrc = await readFile(path.join(ROOT, 'src/App.jsx'), 'utf8');
const declared = [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const emitted = new Set(routes.map((r) => r.path));
const missing = declared.filter(
  (p) => p !== '*' && !p.includes(':') && !emitted.has(p),
);
if (missing.length) {
  console.error(
    `\nSEO: these routes exist in src/App.jsx but are not prerendered, so they would 404 in production:\n` +
      missing.map((p) => `  ${p}`).join('\n') +
      `\nAdd them to the \`routes\` table in scripts/generate-seo.mjs.\n`,
  );
  process.exit(1);
}
/* Dynamic segments are expanded from the data files; make sure each
   parameterised route produced at least one concrete page. */
for (const p of declared.filter((d) => d.includes(':'))) {
  const prefix = p.slice(0, p.indexOf(':'));
  if (![...emitted].some((e) => e.startsWith(prefix) && e !== prefix.replace(/\/$/, ''))) {
    console.error(`\nSEO: route "${p}" expanded to zero pages — check the data file behind it.\n`);
    process.exit(1);
  }
}

/* ── 404 ──────────────────────────────────────────────────────────────
   Vercel serves this for paths that match no file, with a real 404 status
   (see vercel.json — there is deliberately no catch-all rewrite, which
   would turn every typo into a soft 404 that Google reports as an error). */
const notFound = renderRoute(base, {
  path: '/404',
  title: 'Page not found',
  description: 'That page does not exist. Browse the projects, writing, and contact details instead.',
  body: `<h1>404 — page not found</h1>
<p>That page doesn't exist. Try one of these:</p>
<ul>
  <li><a href="${SITE_URL}/">Home</a></li>
  <li><a href="${SITE_URL}/projects">Projects</a></li>
  <li><a href="${SITE_URL}/blog">Blog</a></li>
  <li><a href="${SITE_URL}/creative">Guy With Black 350</a></li>
  <li><a href="${SITE_URL}/contact">Contact</a></li>
</ul>`,
})
  .replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + SITE_URL + '/$2')
  .replace(/(<meta name="robots" content=")[^"]*(")/, '$1noindex, follow$2');
await writeFile(path.join(DIST, '404.html'), notFound);

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

/* ── llms.txt ─────────────────────────────────────────────────────────
   Knowledge index for answer engines (ChatGPT Search, Perplexity, Claude,
   Gemini). The prose preamble is curated here; the project and post lists
   are generated from the data files so they can never drift out of date —
   they already had, by four projects, when this was a hand-kept file. */
const LLMS_PREAMBLE = `# ${SITE_NAME}

> Software Engineer, Mobile App Developer, AI Tooling Engineer, and Content Creator (@guywithblack350). B.Tech Computer Science student at IIIT Vadodara.

## Bio & Overview
Harshil Patel is a software engineer and computer science student at IIIT Vadodara (Indian Institute of Information Technology, Vadodara). He specializes in React, TypeScript, Node.js, Firebase, Svelte 5, Android (Kotlin), PWA, and AI API integrations (Gemini, Claude, Ollama).

Alongside software engineering, Harshil is an automotive content creator operating under the handle **@guywithblack350** across Instagram and YouTube, generating 22M+ views and collaborating with automotive and lifestyle brands.

- **Website**: ${SITE_URL}/
- **GitHub**: https://github.com/Marshmellow31
- **LinkedIn**: https://linkedin.com/in/harshil-patel-5a7373333
- **Instagram (Personal)**: https://www.instagram.com/harshil_3105_/
- **Instagram (Creator)**: https://www.instagram.com/guywithblack350/
- **Email**: ${AUTHOR.email}
`;

const LLMS_SKILLS = `## Technical Skills & Expertise

- **Languages**: TypeScript, JavaScript, Python, C++, Java, Dart, Kotlin, SQL
- **Frontend**: React 19, Next.js, Svelte 5, Tailwind CSS, Framer Motion, Three.js, HTML5, CSS3
- **Backend & Cloud**: Node.js, Express, Firebase (Firestore, Auth), MySQL, REST APIs, Vercel
- **Mobile & Embedded**: Android Native (Kotlin), Flutter, PWA, Capacitor, ESP32 (C++/Arduino)
- **AI & ML**: Gemini Vision API, Claude API, Ollama (Local LLMs), Whisper Speech-to-Text, Embeddings
- **Tools**: Git, GitHub Actions, Vercel, Docker, Vitest, ESLint, Oxlint
`;

const llmsProjects = selectedWork
  .map((p) => {
    const rows = [
      `- **${p.title}** (${SITE_URL}/projects/${p.slug})`,
      p.type || p.role ? `  - *Type*: ${p.type || p.role}` : '',
      p.year ? `  - *Year*: ${p.year}` : '',
      `  - *Tech Stack*: ${p.stack.join(', ')}`,
      `  - *Summary*: ${p.description}`,
      p.link ? `  - *Live Site*: ${p.link}` : '',
      p.github ? `  - *GitHub*: ${p.github}` : '',
      p.paper ? `  - *Paper*: ${SITE_URL}${p.paper}` : '',
    ];
    return rows.filter(Boolean).join('\n');
  })
  .join('\n\n');

const llmsPosts = blogPosts
  .map(
    (b) =>
      `- **${b.title}**\n  - *URL*: ${SITE_URL}/blog/${b.slug}\n  - *Published*: ${b.date}\n  - *Summary*: ${b.excerpt}`,
  )
  .join('\n\n');

await writeFile(
  path.join(DIST, 'llms.txt'),
  `${LLMS_PREAMBLE}
---

## Featured Software Projects

${llmsProjects}

---

${LLMS_SKILLS}
---

## Technical Blog Posts

${llmsPosts}
`,
);

/* Explicit allow for AI/answer-engine crawlers: these are the bots behind
   ChatGPT Search, Perplexity, Claude, and Gemini citations. Default-allow
   already covers them, but naming them documents the intent and points
   them at llms.txt. */
const AI_AGENTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'DuckDuckBot', 'CCBot'];
await writeFile(
  path.join(DIST, 'robots.txt'),
  `# ${SITE_NAME} — ${SITE_URL}
User-agent: *
Allow: /

${AI_AGENTS.map((a) => `User-agent: ${a}\nAllow: /`).join('\n\n')}

# Structured context for answer engines: ${SITE_URL}/llms.txt
Sitemap: ${SITE_URL}/sitemap.xml
`,
);

console.log(
  `SEO: ${routes.length} routes prerendered + 404.html, sitemap.xml + rss.xml + robots.txt + llms.txt ` +
    `(${selectedWork.length} projects, ${blogPosts.length} posts) written — origin ${SITE_URL}`,
);
