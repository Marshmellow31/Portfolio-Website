import { readFile } from 'node:fs/promises';
import { SITE_URL } from '../site.config.mjs';

// Run after deployment: npm run submit:indexnow. This key is an intentionally
// public ownership-verification file, not an account credential.
const key = (await readFile('public/indexnow-key.txt', 'utf8')).trim();
const keyLocation = `${SITE_URL}/indexnow-key.txt`;
const verification = await fetch(keyLocation, { cache: 'no-store' });
if (!verification.ok || (await verification.text()).trim() !== key) {
  throw new Error('The deployed IndexNow ownership file is missing or stale; deploy before submitting.');
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const current = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const legacy = ['/drive', '/playground', '/projects/no-fly-zone-simulator'].map(route => SITE_URL + route);
const urlList = [...new Set([...current, ...legacy])];
if (!urlList.length || urlList.some(url => new URL(url).origin !== SITE_URL)) throw new Error('Invalid submission URLs.');
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE_URL).host, key, keyLocation, urlList }),
});
if (![200, 202].includes(response.status)) throw new Error(`IndexNow submission failed: HTTP ${response.status}`);
console.log(JSON.stringify({ status: response.status, submittedUrls: urlList.length,
  result: response.status === 200 ? 'received' : 'received; ownership validation pending',
  note: 'Receipt does not confirm crawling, indexing, or ranking.' }, null, 2));
