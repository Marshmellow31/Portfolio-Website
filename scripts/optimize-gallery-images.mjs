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
import { readdir, rm, stat, writeFile } from 'node:fs/promises';
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
  let built = 0;
  let reused = 0;

  /* Every expected output, so orphans from renamed/removed sources can be
     swept without wiping the ones we're about to reuse. */
  const expected = new Set();

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
      const srcMtime = (await stat(abs)).mtimeMs;

      for (const w of widths) {
        const name = `${base}-${w}.webp`;
        const outPath = path.join(dir, name);
        expected.add(outPath);

        /* This runs on every build, so only re-encode when the source is
           newer than the variant. A clean rebuild with warm outputs costs a
           few header reads instead of ~60 WebP encodes. */
        const fresh = await stat(outPath)
          .then((s) => s.mtimeMs >= srcMtime)
          .catch(() => false);

        if (fresh) {
          reused++;
        } else {
          await sharp(abs).resize({ width: w, withoutEnlargement: true }).webp(WEBP).toFile(outPath);
          built++;
          console.log(`  built ${path.dirname(src)}/${name}  (${kb((await stat(outPath)).size)})`);
        }
        variants.push({ w, file: `${path.dirname(src)}/${name}` });
      }
      if (variants.length) entry.srcset = variants;
    }

    manifest[src] = entry;
  }

  /* Sweep derivatives whose source is gone or was renamed. */
  for (const d of [...new Set(sources.map((s) => path.dirname(s)))]) {
    const absDir = path.join(PUBLIC, d);
    for (const f of await readdir(absDir).catch(() => [])) {
      const full = path.join(absDir, f);
      if (/-(480|768|1200|1600)\.webp$/.test(f) && !expected.has(full)) {
        await rm(full);
        console.log(`  removed orphan ${d}/${f}`);
      }
    }
  }

  await writeFile(
    path.join(ROOT, 'src/data/gallery-images.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    `gallery: ${Object.keys(manifest).length} images — ${built} variant(s) built, ${reused} reused`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
