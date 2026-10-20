/* Compose portfolio artwork around real, unretouched Android screenshots.
 * Capture provenance: assets/paymatrix/screens/README.md.
 * Run this, then npm.cmd run images, after refreshing the source captures.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'assets/paymatrix');
await mkdir(dir, { recursive: true });
const xml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const text = (x, y, lines, size, color = '#f2f2f3', weight = 400) =>
  lines.map((s, i) => `<text x="${x}" y="${y + i * size * 1.18}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${xml(s)}</text>`).join('');
const svg = (w, h, content) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#0a0a0b"/>${content}</svg>`);

async function screen(file, width) {
  const source = path.join(dir, 'screens', file);
  const meta = await sharp(source).metadata();
  // Exclude the test harness label; preserve all app content and demo values.
  const top = file.startsWith('dark-') ? 94 : 0;
  return sharp(source).extract({ left: 0, top, width: meta.width, height: meta.height - top }).resize({ width }).png().toBuffer();
}

const hero = svg(1920, 1200,
  text(100, 180, ['paymatrix'], 40, '#a8a8b0') +
  text(100, 310, ['Shared expenses.', 'A clearer picture.'], 80, '#f2f2f3', 700) +
  text(100, 570, ['Scan a receipt. Split the bill.', 'See who owes whom.', 'Hand off payment to your UPI app.'], 34, '#a8a8b0') +
  text(100, 1040, ['Mobile web + native Android'], 28, '#a8a8b0') +
  text(100, 1090, ['Actual UI · fictional demo data'], 23, '#a8a8b0') +
  text(1030, 170, ['WEB / PWA'], 26, '#a8a8b0') +
  text(1480, 170, ['ANDROID'], 26, '#a8a8b0'));
await sharp(hero).composite([
  { input: await screen('web-home.png', 350), left: 1030, top: 215 },
  { input: await screen('dark-home.png', 350), left: 1480, top: 215 },
]).png().toFile(path.join(dir, '01-hero.png'));

const frames = [
  { id: '02-scan', file: 'web-scanner.png', title: ['Start with', 'the receipt.'], body: ['Take a photo or choose receipt images.', 'Review extracted details before saving.'], surface: 'Mobile web / PWA' },
  { id: '03-split', file: 'dark-expense-split.png', title: ['A fair share.', 'Down to the paise.'], body: ['Equal, exact, percentage, shares or items.', 'Review each participant’s allocation.'] },
  { id: '04-balances', file: 'dark-members.png', title: ['Who owes whom,', 'in one place.'], body: ['Per-member balances for the group.', 'Shared expenses, with a clearer ledger.'] },
  { id: '05-upi', file: 'upi-light.png', title: ['Pay in your app.', 'Confirm explicitly.'], body: ['UPI app handoff, QR and sharing options.', 'Returning from a payment app is not proof of payment.'] },
];
for (const frame of frames) {
  const w = 1280, h = 1600;
  const source = path.join(dir, 'screens', frame.file);
  const metadata = await sharp(source).metadata();
  const width = Math.min(640, Math.round(1040 * metadata.width / metadata.height));
  const input = await screen(frame.file, width);
  const bg = svg(w, h,
    text(80, 120, frame.title, 64, '#f2f2f3', 700) +
    text(80, 295, frame.body, 27, '#a8a8b0') +
    text(80, 1540, [`paymatrix · ${frame.surface || 'Native Android'} · fictional demo data`], 23, '#a8a8b0'));
  await sharp(bg).composite([{ input, left: Math.round((w - width) / 2), top: 410 }]).png().toFile(path.join(dir, `${frame.id}.png`));
}
await sharp(path.join(dir, '01-hero.png')).resize(960).webp({ quality: 82 }).toFile(path.join(root, 'public/projects/paymatrix.webp'));
console.log('Generated five paymatrix frames and project thumbnail.');
