import { useEffect } from 'react';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, OG_IMAGE, TWITTER_HANDLE } from '../../site.config.mjs';

const initialPath = window.location.pathname.replace(/\/$/, '') || '/';
const initialRouteData = document.getElementById('route-jsonld')?.textContent;
const initialSchema = initialRouteData ? JSON.parse(initialRouteData) : null;

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/* Per-route SEO: title, description, canonical, OG/Twitter mirrors,
   optional per-page image, noindex, and JSON-LD.
   SPA-level best effort for JS-executing crawlers; the build-time
   prerender (scripts/generate-seo.mjs) covers everything else. */
export default function useSEO({ title, description, path = '', image, noindex = false, jsonLd, ogType = 'website' }) {
  const routePath = path || '/';
  const fallbackSchema = routePath === '/' ? {
    '@context': 'https://schema.org', '@type': 'ProfilePage',
    '@id': `${SITE_URL}/#profile`, url: `${SITE_URL}/`, name: SITE_NAME,
    mainEntity: { '@id': `${SITE_URL}/#person` },
  } : {
    '@context': 'https://schema.org', '@type': 'WebPage',
    url: SITE_URL + path, name: title || SITE_NAME,
    description: description || DEFAULT_DESCRIPTION,
  };
  const ldString = noindex ? null : JSON.stringify(jsonLd || (routePath === initialPath && initialSchema) || fallbackSchema);
  const published = jsonLd?.['@graph']?.find(node => node['@type'] === 'BlogPosting')?.datePublished;
  useEffect(() => {
    const fullTitle = title ? `${title} — Harshil Patel` : DEFAULT_TITLE;
    const url = SITE_URL + path;
    const img = SITE_URL + (image || OG_IMAGE);

    document.title = fullTitle;
    setMeta('name', 'title', fullTitle);
    setMeta('name', 'description', description || DEFAULT_DESCRIPTION);
    setMeta('property', 'og:description', description || DEFAULT_DESCRIPTION);
    setMeta('name', 'twitter:description', description || DEFAULT_DESCRIPTION);
    setMeta('property', 'og:title', fullTitle);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:image', img);
    setMeta('name', 'twitter:creator', TWITTER_HANDLE);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image:alt', `${title || 'Harshil Patel'} — Harshil Patel`);
    setMeta('name', 'twitter:image:alt', `${title || 'Harshil Patel'} — Harshil Patel`);
    const imageType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml' };
    setMeta('property', 'og:image:type', imageType[img.split('.').pop().toLowerCase()] || 'image/jpeg');
    document.head.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"], meta[property="article:published_time"]').forEach(el => el.remove());
    if (!image || image.endsWith('-og.jpg')) {
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '630');
    }
    if (published) setMeta('property', 'article:published_time', published);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1');

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Route-specific structured data (BlogPosting, CreativeWork, …)
    let ld = document.getElementById('route-jsonld');
    if (ldString) {
      if (!ld) {
        ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.id = 'route-jsonld';
        document.head.appendChild(ld);
      }
      ld.textContent = ldString;
    } else if (ld) {
      ld.remove();
    }

    return () => { document.title = DEFAULT_TITLE; };
  }, [title, description, path, image, noindex, ldString, ogType, published]);
}
