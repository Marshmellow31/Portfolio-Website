import { useEffect } from 'react';
import { SITE_URL, DEFAULT_TITLE, OG_IMAGE } from '../../site.config.mjs';

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
export default function useSEO({ title, description, path = '', image, noindex = false, jsonLd }) {
  const ldString = jsonLd ? JSON.stringify(jsonLd) : null;
  useEffect(() => {
    const fullTitle = title ? `${title} — Harshil Patel` : DEFAULT_TITLE;
    const url = SITE_URL + path;
    const img = SITE_URL + (image || OG_IMAGE);

    document.title = fullTitle;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', fullTitle);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:image', img);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');

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
  }, [title, description, path, image, noindex, ldString]);
}
