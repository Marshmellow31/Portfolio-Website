/* Project gallery image pipeline.
 *
 * The designed case-study frames (PayMatrix) go through optimize-case-images.mjs
 * and render via <CaseImage>. Everything else — the `images` array on each
 * project — was being rendered as a bare <img>: no srcset, no intrinsic size.
 * That shipped a 1887px-wide 216 KB screenshot into a 329px slot and shifted
 * the layout on every load.
 *
 * This emits WebP variants next to each source and records natural dimensions
 * so <img> can declare width/height. Sources already produced by the case
 * pipeline (`name-960.webp`) are left alone — they're pre-sized — but their
 * dimensions are still recorded so they get CLS protection too.
 *
 *   npm run images:gallery
 */
import { readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { selectedWork } from '../src/data/portfolio.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

/* Galleries lay out 2-up from the md breakpoint and full-bleed below it, so
   the largest a tile ever needs to be is roughly half a wide desktop viewport.
   Anything past 1600 is never displayed. */
const WIDTHS = [480, 768, 1200, 1600];
const WEBP = { quality: 80, effort: 6 };

/* Files the case pipeline already emitted at a fixed width. */
const IS_DERIVATIVE = /-\d+\.(webp|avif|png)$/;

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  const sources = [...new Set(selectedWork.flatMap((p) => p.images || []))];
  const manifest = {};
  let before = 0;
  let after = 0;

  // Clear derivatives from a previous run so renamed sources don't linger.
  const dirs = [...new Set(sources.map((s) => path.dirname(s)))];
  for (const d of dirs) {
    const abs = path.join(PUBLIC, d);
    for (const f of await readdir(abs).catch(() => [])) {
      if (/-(480|768|1200|1600)\.webp$/.test(f)) await rm(path.join(abs, f));
    }
  }

  for (const src of sources) {
    const abs = path.join(PUBLIC, src);
    let meta;
    try {
      meta = await sharp(abs).metadata();
    } catch {
      console.warn(`  skip (unreadable): ${src}`);
      continue;
    }

    const entry = { w: meta.width, h: meta.height };

    if (!IS_DERIVATIVE.test(src)) {
      const dir = path.dirname(abs);
      const base = path.basename(src, path.extname(src));
      const widths = WIDTHS.filter((w) => w < meta.width);
      const variants = [];

      for (const w of widths) {
        const name = `${base}-${w}.webp`;
        const r = await sharp(abs)
          .resize({ width: w, withoutEnlargement: true })
          .webp(WEBP)
          .toFile(path.join(dir, name));
        variants.push({ w, file: `${path.dirname(src)}/${name}` });
        after += r.size;
      }
      if (variants.length) {
        entry.srcset = variants;
        const orig = (await sharp(abs).toBuffer()).length;
        before += orig;
        console.log(
          `  ${src}  ${meta.width}x${meta.height} ${kb(orig)} -> ${variants.length} variants ` +
            `(${variants.map((v) => v.w).join('/')})`,
        );
      }
    }

    manifest[src] = entry;
  }

  await writeFile(
    path.join(ROOT, 'src/data/gallery-images.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    `\nwrote src/data/gallery-images.json — ${Object.keys(manifest).length} images` +
      (before ? `; largest-variant total ${kb(after)} vs ${kb(before)} of originals` : ''),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
