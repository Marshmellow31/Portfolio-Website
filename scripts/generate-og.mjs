/* ─── Open Graph card generator ───
   Emits public/og-image.jpg (1200×630) — the size every social scraper
   expects and the size index.html declares. JPEG rather than WebP on
   purpose: LinkedIn and several other scrapers still won't render a WebP
   card. A matching .webp is emitted for the platforms that prefer it.

   Run with `npm run og` after changing the name/tagline. */

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200;
const H = 630;

const BG = '#0A0A0B';
const FG = '#F2F2F3';
const MUTED = '#8A8A8F';
const LINE = 'rgba(255,255,255,0.055)';

const grid = () => {
  const step = 60;
  let d = '';
  for (let x = step; x < W; x += step) d += `M${x} 0V${H}`;
  for (let y = step; y < H; y += step) d += `M0 ${y}H${W}`;
  return `<path d="${d}" stroke="${LINE}" stroke-width="1" fill="none"/>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${grid()}
  <!-- soft monochrome glow, mirroring the site's hero treatment -->
  <defs>
    <radialGradient id="g" cx="0.82" cy="0.5" r="0.55">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>

  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <text x="80" y="268" fill="${FG}" font-size="118" font-weight="700" letter-spacing="-5">HARSHIL</text>
    <text x="80" y="386" fill="${FG}" font-size="118" font-weight="700" letter-spacing="-5">PATEL</text>
    <rect x="82" y="428" width="64" height="3" fill="${FG}"/>
    <text x="80" y="486" fill="${MUTED}" font-size="30" font-weight="500" letter-spacing="-0.4">Software Engineer · IIIT Vadodara</text>
  </g>
  <text x="80" y="560" fill="${MUTED}" font-family="JetBrains Mono, Consolas, monospace" font-size="21" letter-spacing="0.5">harshilpatel.co.in</text>
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(path.join(ROOT, 'public/og-image.jpg'));
await sharp(buf).webp({ quality: 92 }).toFile(path.join(ROOT, 'public/og-image.webp'));

/* Route-specific creator card. It uses a real frame from the highest-viewed
   reel, so the Creative page does not fall back to the generic engineering card. */
const creativeOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.94"/>
      <stop offset="0.64" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  ${grid()}
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <text x="72" y="210" fill="${MUTED}" font-size="27" font-weight="600" letter-spacing="4">AUTOMOTIVE CONTENT CREATOR</text>
    <text x="68" y="332" fill="${FG}" font-size="96" font-weight="700" letter-spacing="-5">GUYWITHBLACK350</text>
    <text x="72" y="434" fill="${FG}" font-size="58" font-weight="700" letter-spacing="-2">≈68M PUBLIC REEL VIEWS</text>
    <text x="72" y="536" fill="${MUTED}" font-size="24" font-weight="500">Harshil Patel · @guywithblack350</text>
  </g>
</svg>`;

await sharp(path.join(ROOT, 'public/instagram/three-generations-xuv.png'))
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(creativeOverlay) }])
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toFile(path.join(ROOT, 'public/creative-og.jpg'));

/* App icons. iOS ignores a WebP apple-touch-icon and the manifest needs PNG
   for the Android install prompt, so cut both from the existing favicon. */
const favicon = path.join(ROOT, 'public/favicon.webp');
/* palette + max compression: the icon is flat artwork, so an indexed PNG is
   visually identical at a fraction of the size (512px went 187 KB -> ~20 KB). */
const png = { compressionLevel: 9, palette: true, quality: 90, effort: 10 };
await sharp(favicon).resize(180, 180).png(png).toFile(path.join(ROOT, 'public/apple-touch-icon.png'));
await sharp(favicon).resize(192, 192).png(png).toFile(path.join(ROOT, 'public/icon-192.png'));
await sharp(favicon).resize(512, 512).png(png).toFile(path.join(ROOT, 'public/icon-512.png'));

console.log('OG: site + Creative social cards (1200×630), apple-touch-icon + icon-192 + icon-512 written');
