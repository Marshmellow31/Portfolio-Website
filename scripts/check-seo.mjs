import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, OG_IMAGE, TWITTER_HANDLE, PORTRAIT } from '../site.config.mjs';
import { creativeDescription, projectsDescription, creatorSnapshot, creatorViewsMinimum, creatorViewsLabel, creatorViewsUpdatedAt } from '../src/data/seo.js';

const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length, 'duplicate sitemap URL');
const titles = new Set();
const deployment = JSON.parse(await readFile('vercel.json', 'utf8'));
for (const oldPath of ['/drive', '/playground', '/projects/no-fly-zone-simulator']) {
  const redirect = deployment.redirects.find(rule => rule.source === oldPath);
  assert(redirect?.permanent && urls.includes(SITE_URL + redirect.destination), `legacy redirect: ${oldPath}`);
  assert(!urls.includes(SITE_URL + oldPath), `redirected URL in sitemap: ${oldPath}`);
}
for (const url of urls) {
  const route = new URL(url).pathname;
  const html = await readFile(`dist${route === '/' ? '' : route}/index.html`, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `missing or duplicate title: ${route}`);
  titles.add(title);
  assert(html.includes(`<link rel="canonical" href="${url}"`), `canonical: ${route}`);
  assert.match(html, /<meta name="description" content="[^"]+"/, route);
  assert.match(html, /<noscript id="page-content">[\s\S]*?<h1>/, route);
  assert(!html.includes('noindex'), `indexable route blocked: ${route}`);
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const nodes = scripts.flatMap(match => { const data = JSON.parse(match[1]); return data['@graph'] || [data]; });
  assert.equal((html.match(/id="site-jsonld"/g) || []).length, 1, route);
  assert.equal((html.match(/id="route-jsonld"/g) || []).length, 1, route);
  assert(!nodes.some(node => node.offers), `unsupported commercial offer: ${route}`);
  if (route !== '/creative' && route !== '/') assert(!nodes.some(node => node['@type'] === 'ProfilePage'), `stale profile: ${route}`);
  const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert(image?.startsWith(SITE_URL), `social image URL: ${route}`);
  await access(`dist${new URL(image).pathname}`);
  if (route === '/creative') {
    assert(html.includes(creativeDescription), 'creative description drift');
    assert(!/Guy With Black 350|67\.7M|66\.2M|69\.2M/.test(html), 'creative identity or metrics drift');
    assert(nodes.some(node => node.interactionStatistic?.userInteractionCount === creatorViewsMinimum));
  }
  if (route === '/projects') assert(html.includes(projectsDescription), 'projects description drift');
  if (route === '/') {
    assert(!/<link[^>]+rel="modulepreload"[^>]+vendor-3d/.test(html), '3D on homepage critical path');
    assert(nodes.some(node => node['@type'] === 'WebSite' && node.name === SITE_NAME), 'homepage site identity');
    const identity = nodes.find(node => node['@id'] === `${SITE_URL}/#person`);
    assert(identity?.name === SITE_NAME && !identity.alternateName, 'creator alias attached to homepage identity');
    assert.equal(identity.image, SITE_URL + PORTRAIT.src, 'identity portrait');
    const profile = nodes.find(node => node['@type'] === 'ProfilePage');
    assert.equal(profile.primaryImageOfPage.contentUrl, SITE_URL + PORTRAIT.src, 'profile portrait');
    assert(html.includes(`src="${PORTRAIT.src}"`) && html.includes(`alt="${PORTRAIT.alt}"`), 'no-JS portrait discoverability');
    const homeEntry = sitemap.match(/<url>\s*<loc>[^<]+\/<\/loc>[\s\S]*?<\/url>/)?.[0];
    assert(homeEntry?.includes(`<image:loc>${SITE_URL}${PORTRAIT.src}</image:loc>`), 'homepage portrait sitemap entry');
    await access(`dist${PORTRAIT.src}`);
    await access(`dist${PORTRAIT.thumbnail}`);
  }
}
const notFound = await readFile('dist/404.html', 'utf8');
assert.match(notFound, /name="robots" content="noindex, follow"/);
const robots = await readFile('dist/robots.txt', 'utf8');
assert(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
for (const bot of ['OAI-SearchBot', 'PerplexityBot', 'Bingbot']) assert(robots.includes(`User-agent: ${bot}\nAllow: /`));
const llms = await readFile('dist/llms.txt', 'utf8');
assert(llms.includes(SITE_URL + PORTRAIT.src), 'AI profile portrait link');
assert(llms.includes(creatorViewsLabel) && llms.includes(creatorViewsUpdatedAt) && llms.includes(creatorSnapshot.capturedAt), 'LLM context metric provenance');

// Exercise the actual hook with a minimal head DOM and immediate React effects.
// This catches metadata that survives navigation, without loading 3D scenes.
class Element {
  constructor(tag) { this.tag = tag; this.attributes = {}; this.textContent = ''; }
  setAttribute(key, value) { this.attributes[key] = value; }
  remove() { elements.splice(elements.indexOf(this), 1); }
}
const elements = [];
const meta = (attr, key) => elements.find(el => el.tag === 'meta' && el.attributes[attr] === key);
const initial = new Element('script');
initial.id = 'route-jsonld';
initial.textContent = JSON.stringify({ '@type': 'ProfilePage', url: `${SITE_URL}/creative` });
elements.push(initial);
const document = {
  title: '',
  createElement: tag => new Element(tag),
  getElementById: id => elements.find(el => el.id === id),
  head: {
    appendChild: el => elements.push(el),
    querySelector: selector => {
      if (selector === 'link[rel="canonical"]') return elements.find(el => el.tag === 'link' && el.attributes.rel === 'canonical');
      const match = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
      return match ? meta(match[1], match[2]) : null;
    },
    querySelectorAll: selector => selector.split(', ').map(part => {
      const match = part.match(/meta\[property="([^"]+)"\]/);
      return match && meta('property', match[1]);
    }).filter(Boolean),
  },
};
const source = (await readFile('src/utils/useSEO.js', 'utf8'))
  .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');
const context = vm.createContext({ document, window: { location: { pathname: '/creative' } }, useEffect: fn => fn(), SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, OG_IMAGE, TWITTER_HANDLE, PORTRAIT });
vm.runInContext(source, context);
context.useSEO({ title: 'Creative', path: '/creative', description: creativeDescription, image: '/creative-og.jpg', jsonLd: { '@type': 'ProfilePage', url: `${SITE_URL}/creative` } });
context.useSEO({ title: 'Post', path: '/blog/test', image: '/test.webp', ogType: 'article', jsonLd: { '@graph': [{ '@type': 'BlogPosting', datePublished: '2026-08-15' }] } });
assert.equal(meta('property', 'og:image:type').attributes.content, 'image/webp');
assert(!meta('property', 'og:image:width'));
assert(meta('property', 'article:published_time'));
context.useSEO({ title: 'Contact', path: '/contact', description: 'Contact Harshil' });
assert.equal(JSON.parse(document.getElementById('route-jsonld').textContent)['@type'], 'WebPage');
assert(!meta('property', 'article:published_time'));
assert.equal(meta('name', 'title').attributes.content, 'Contact — Harshil Patel');
context.useSEO({ path: '/', description: DEFAULT_DESCRIPTION });
assert.equal(JSON.parse(document.getElementById('route-jsonld').textContent)['@type'], 'ProfilePage');
assert.equal(JSON.parse(document.getElementById('route-jsonld').textContent).primaryImageOfPage.contentUrl, SITE_URL + PORTRAIT.src, 'portrait survives navigation back home');
assert.equal(meta('name', 'description').attributes.content, DEFAULT_DESCRIPTION);
context.useSEO({ path: '/missing', noindex: true });
assert(!document.getElementById('route-jsonld'));
assert.equal(meta('name', 'robots').attributes.content, 'noindex, follow');
console.log(`SEO checks passed: ${urls.length} generated routes, discovery files, social images, 404, and metadata navigation.`);
