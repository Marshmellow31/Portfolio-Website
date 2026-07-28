/* Case-study image pipeline.
 *
 * Source PNGs live in assets/<project>/ and are deliberately NOT in public/ —
 * they're 0.6–1.3 MB each and Vite copies everything in public/ into dist
 * whether or not it's referenced. This script emits the only things the site
 * actually loads: AVIF + WebP at a few widths, plus one modest PNG fallback.
 *
 *   npm run images
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');

/* Widths are chosen from how the image is actually laid out:
   - hero renders full-bleed inside the content column (~100vw minus padding)
   - frames render in a 2-up grid on desktop (~46vw), full width on mobile */
const SETS = [
  {
    src: 'assets/paymatrix',
    out: 'public/projects/paymatrix',
    files: {
      /* `og` cuts the 1200x630 social card. Social scrapers are the one place
         WebP/AVIF still aren't safe, so it lands as JPEG. */
      '01-hero.png': { widths: [960, 1440, 1920, 2880], fallback: 1440, og: true },
      '02-scan.png': { widths: [640, 960, 1280, 1920], fallback: 960 },
      '03-split.png': { widths: [640, 960, 1280, 1920], fallback: 960 },
      '04-balances.png': { widths: [640, 960, 1280, 1920], fallback: 960 },
      '05-upi.png': { widths: [640, 960, 1280, 1920], fallback: 960 },
    },
  },
];

/* These frames are near-black with a faint grid and thin hairline callout
   rules. Chroma subsampling smears those, so keep 4:4:4 on both codecs. */
const AVIF = { quality: 58, effort: 6, chromaSubsampling: '4:4:4' };
const WEBP = { quality: 82, effort: 6, smartSubsample: false };

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  const manifest = {};

  for (const set of SETS) {
    const outDir = path.join(ROOT, set.out);
    await mkdir(outDir, { recursive: true });

    // Wipe previously generated derivatives so renamed sources don't linger.
    for (const stale of await readdir(outDir).catch(() => [])) {
      if (/(-\d+\.(avif|webp|png)|-og\.jpg)$/.test(stale)) await rm(path.join(outDir, stale));
    }

    for (const [file, cfg] of Object.entries(set.files)) {
      const base = path.basename(file, path.extname(file));
      const input = path.join(ROOT, set.src, file);
      const meta = await sharp(input).metadata();
      const widths = cfg.widths.filter((w) => w <= meta.width);

      const entry = { width: meta.width, height: meta.height, avif: [], webp: [] };

      for (const w of widths) {
        const resized = () => sharp(input).resize({ width: w, withoutEnlargement: true });

        const avifName = `${base}-${w}.avif`;
        const webpName = `${base}-${w}.webp`;
        const a = await resized().avif(AVIF).toFile(path.join(outDir, avifName));
        const b = await resized().webp(WEBP).toFile(path.join(outDir, webpName));

        entry.avif.push({ w, file: avifName });
        entry.webp.push({ w, file: webpName });
        console.log(`  ${base} @${w}  avif ${kb(a.size)}  webp ${kb(b.size)}`);
      }

      const fallbackName = `${base}-${cfg.fallback}.png`;
      const f = await sharp(input)
        .resize({ width: cfg.fallback, withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true })
        .toFile(path.join(outDir, fallbackName));
      entry.png = fallbackName;
      console.log(`  ${base} @${cfg.fallback} png  ${kb(f.size)}  (fallback)`);

      if (cfg.og) {
        const o = await sharp(input)
          .resize(1200, 630, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 86, chromaSubsampling: '4:4:4' })
          .toFile(path.join(outDir, `${base}-og.jpg`));
        entry.og = `${base}-og.jpg`;
        console.log(`  ${base} og 1200x630 jpg  ${kb(o.size)}`);
      }

      manifest[`${set.out.replace('public', '')}/${base}`] = entry;
    }
  }

  await writeFile(
    path.join(ROOT, 'src/data/case-images.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log('\nwrote src/data/case-images.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
