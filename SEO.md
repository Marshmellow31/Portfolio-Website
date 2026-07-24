# SEO — how it works & the domain-launch playbook

## What's in place

- **`site.config.mjs`** — single source of truth for the site URL, identity, and socials.
- **Build-time prerendering** — `scripts/generate-seo.mjs` runs after `vite build` and writes a
  static `dist/<route>/index.html` for all 24 routes with the correct `<title>`, description,
  canonical, Open Graph / Twitter tags, and JSON-LD. Vercel serves these files *before* the SPA
  rewrite, so Google, LinkedIn, WhatsApp, and Discord see correct per-page meta with zero JavaScript.
- **Auto-generated `sitemap.xml` + `robots.txt` + `rss.xml`** — built from `src/data/portfolio.js` and
  `src/data/blog.js` every build. Includes Google Image Search extensions (`<image:image>`) for project screenshots and an RSS 2.0 feed for blog readers.
- **Structured data** — `Person` + `WebSite` + `ProfilePage` graph on homepage, `BlogPosting` on posts (with publish/mod dates and publisher references), `SoftwareApplication` + `BreadcrumbList` on project pages, `CollectionPage` on `/projects`, and `BreadcrumbList` on all subpages.
- **Generative Engine Optimization (GEO)** — `public/llms.txt` standard file for AI search engines (ChatGPT Search, Perplexity, Claude, Gemini) providing a clean markdown knowledge index of Harshil Patel's bio, projects, blog posts, and verified handles.
- **Web App Manifest** — `public/site.webmanifest` defining PWA metadata, theme colors (`#0A0A0B`), and maskable icon declarations.
- **Runtime `useSEO` hook** — keeps title/canonical/OG (`og:type` article vs website)/Twitter
  creator (`@guywithblack350`)/`og:image:alt`/JSON-LD in sync during client-side navigation, and
  sets `noindex` on the 404 page.
- **`<noscript>` fallback** — meaningful HTML content (name, bio, project list, contact links) inside
  `<noscript>` so crawlers that don't execute JS still index core page content.
- **Skip-to-content link** — hidden `<a href="#main-content">` for accessibility (a11y signals
  contribute to search quality).
- **Font deduplication** — JetBrains Mono loaded once via `<link>` in `index.html`; removed duplicate
  `@import` from `index.css` to eliminate a render-blocking network request (improves FCP/LCP).
- **Vercel caching** — `vercel.json` serves SEO assets (`sitemap.xml`, `rss.xml`, `robots.txt`,
  `llms.txt`, `site.webmanifest`) with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
- **Google Search Console** — placeholder `<meta name="google-site-verification">` tag is commented
  in `index.html`; uncomment and replace `YOUR_CODE` after registering the domain in GSC.

## When you buy the domain (do these in order)

1. **Change one line** — `SITE_URL` in [site.config.mjs](site.config.mjs). Rebuild/redeploy.
   Every canonical, OG tag, sitemap entry, and JSON-LD block updates automatically.
2. **Add the domain in Vercel** (Project → Settings → Domains). Keep
   `design-lab-portfolio.vercel.app` attached — Vercel will 308-redirect it to the new domain,
   which transfers any existing indexing signals instead of losing them.
3. **Google Search Console** — https://search.google.com/search-console
   - Add the new domain (Domain property, verified via DNS record).
   - Submit `https://yourdomain.com/sitemap.xml`.
   - Use "URL Inspection → Request Indexing" on the homepage to get crawled within hours.
   - **Uncomment** the `<meta name="google-site-verification">` tag in `index.html` and paste
     your verification code.
4. **Bing Webmaster Tools** — https://www.bing.com/webmasters — import from Search Console
   (one click). Covers Bing, DuckDuckGo, and ChatGPT/Copilot search.
5. **Validate rich results** — https://search.google.com/test/rich-results on the homepage and
   one blog post; https://developers.facebook.com/tools/debug/ and
   https://www.linkedin.com/post-inspector/ for the OG cards.

## What actually gets you to #1 for "Harshil Patel"

The on-site work above is done. Ranking for a name is won mostly **off-site** — Google trusts a
site that other trusted profiles point to:

- **Link the domain from every profile you own**: GitHub profile (website field), LinkedIn
  (website + featured), Instagram bios (@harshil_3105_ and @guywithblack350), YouTube channel
  about page if any. These are high-authority backlinks and they're free.
- **Make the names match**: use "Harshil Patel" consistently as the display name on those
  profiles so Google connects them to the Person schema (`sameAs` already lists them).
- **Publish occasionally** — the blog is already wired for BlogPosting rich results; a post
  every month or two keeps the site "fresh" in Google's eyes and gives people something to link.
- **Expect a ramp** — a brand-new domain typically takes 2–8 weeks to rank for a name query
  and settles at the top once the profile backlinks are in place. "Harshil Patel" is a common
  name (you're competing with cricketers and other developers), so the personalized queries
  ("harshil patel developer", "harshil patel iiit vadodara", "guywithblack350") will hit #1
  first, and the bare-name query improves as the domain accrues clicks and links.

## Maintenance rules

- Descriptions for static pages live in both the page's `useSEO()` call and
  [scripts/generate-seo.mjs](scripts/generate-seo.mjs) — if you change one, change the other.
- Projects/blog posts need no extra work — data files drive everything.
- Never edit `public/sitemap.xml` or `public/robots.txt` — they don't exist anymore; the build
  generates them.
- `public/llms.txt` should be updated when you add new major projects or blog posts so AI
  search engines surface accurate information.
