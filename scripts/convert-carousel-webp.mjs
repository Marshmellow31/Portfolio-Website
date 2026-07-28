import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const carouselDir = 'PayMatrix Carousel';
const publicPaymatrixDir = 'public/projects/paymatrix';

if (fs.existsSync(carouselDir)) {
  const files = fs.readdirSync(carouselDir).filter((f) => f.endsWith('.png'));

  console.log('--- Optimizing PayMatrix Carousel PNGs to WebP ---');
  for (const file of files) {
    const input = path.join(carouselDir, file);
    const baseName = file.replace(/\.png$/, '');
    const outWebpInCarousel = path.join(carouselDir, `${baseName}.webp`);

    const pngSize = fs.statSync(input).size;

    // Save high-quality optimized webp in PayMatrix Carousel folder
    await sharp(input)
      .webp({ quality: 85, effort: 6, smartSubsample: false })
      .toFile(outWebpInCarousel);

    const webpSize = fs.statSync(outWebpInCarousel).size;
    const savings = Math.round((1 - webpSize / pngSize) * 100);
    console.log(`${file} (${Math.round(pngSize / 1024)} KB) -> ${baseName}.webp (${Math.round(webpSize / 1024)} KB) [${savings}% smaller]`);
  }
}

// Also mapping named webp files for public/projects/paymatrix to fulfill deleted references if any
const nameMap = {
  '01 — Hook.png': '01-hook.webp',
  '02 — All in one.png': '02-overview.webp',
  '03 — Scan.png': '03-scan.webp',
  '04 — Split.png': '04-split.webp',
  '05 — Settle.png': '05-settle.webp',
  '06 — Insights.png': '06-insights.webp',
  '07 — CTA.png': '07-cta.webp',
};

if (fs.existsSync(carouselDir) && fs.existsSync(publicPaymatrixDir)) {
  console.log('\n--- Generating mapped webp files in public/projects/paymatrix ---');
  for (const [pngName, targetWebp] of Object.entries(nameMap)) {
    const input = path.join(carouselDir, pngName);
    if (fs.existsSync(input)) {
      const targetPath = path.join(publicPaymatrixDir, targetWebp);
      await sharp(input)
        .webp({ quality: 85, effort: 6, smartSubsample: false })
        .toFile(targetPath);
      console.log(`Created ${targetWebp} (${Math.round(fs.statSync(targetPath).size / 1024)} KB)`);
    }
  }
}
