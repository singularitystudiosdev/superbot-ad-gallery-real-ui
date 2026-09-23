// Captures the ad page frame by frame (headless Chromium) through its window.__frame(t) contract.
// usage: node render-ad.mjs <pageUrl> <ar 16x9|4x3|1x1|4x5> <outDir> [t1,t2,...]
//   with a time list: one PNG per time (verification stills); without: every frame of one loop at 30fps.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(path.join(process.env.PW_DIR || '/private/tmp/claude-501/pw', 'index.js'));
const { chromium } = require('playwright-core');
const [url, ar, out, list] = process.argv.slice(2);
const W = { '16x9': 1920, '4x3': 1440, '1x1': 1080, '4x5': 864 }[ar];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--single-process', '--no-zygote', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(`${url}?ar=${ar}&t=0`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const loop = await page.evaluate(() => window.CYCLE);
const times = list ? list.split(',').map(Number) : Array.from({ length: Math.round(loop * 30) }, (_, i) => i / 30);
for (let i = 0; i < times.length; i++) {
  await page.evaluate((t) => window.__frame(t), times[i]);
  const name = list ? `t${times[i].toFixed(2)}.png` : `f${String(i).padStart(4, '0')}.png`;
  await page.screenshot({ path: path.join(out, name) });
}
await browser.close();
console.log('captured', times.length, 'loop', loop);
