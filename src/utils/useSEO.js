import { useEffect } from 'react';

const SITE = 'https://design-lab-portfolio.vercel.app';
const DEFAULT_TITLE = 'Harshil Patel | Full-Stack Developer & Content Creator';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/* Per-route SEO: title, description, canonical, OG/Twitter mirrors.
   SPA-level best effort — crawlers that execute JS (Google) pick these up;
   the index.html defaults cover the rest. */
export default function useSEO({ title, description, path = '' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — Harshil Patel` : DEFAULT_TITLE;
    document.title = fullTitle;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('property', 'twitter:description', description);
    }
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'twitter:title', fullTitle);
    setMeta('property', 'og:url', SITE + path);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', SITE + path);

    return () => { document.title = DEFAULT_TITLE; };
  }, [title, description, path]);
}
