// Headless beat check for the ad: seeks (?t=<s>&pause) the installed Chrome to
// each story beat, screenshots it into .tmp/ad-chat-tour/, and fails on any
// console error, a beat that renders blank (mean luma < threshold), or a seam
// frame that is NOT black (the loop must restart through black).
// Run: node ads/ai-aggregator-chat-tour/verify.chat-tour.mjs [base-url]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/adrianagne/Documents/cosmos/projects/cloned-xdxdxd/.tmp/harness/node_modules/playwright-core');

const BASE = process.argv[2] || 'http://localhost:8477/ads/ai-aggregator-chat-tour/';
const OUT = '/Users/adrianagne/Documents/cosmos/projects/cloned-xdxdxd/.tmp/ad-chat-tour';
mkdirSync(OUT, { recursive: true });

// [name, story-seconds, min-bright-pixel-count 0-255] — centered subjects on a
// full-black stage score low on mean luma, so count pixels above luma 60 instead;
// the seam expects (almost) none: it must be the black cut.
const beats = [
  ['01-sphere', 0.9, 2500],  // measured ~3.9k on the real frame; blank is 0
  ['02-flip', 2.6, 8000],
  ['03-glide', 4.0, 15000],
  ['04-extend', 5.6, 15000],
  ['05-click1', 6.5, 15000],
  ['06-last-chat', 9.3, 15000],
  ['07-card', 10.5, 15000],
  ['08-end', 13.5, 15000],
  ['09-seam', 15.0, 500],  // max, not min: the black cut
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

let fail = 0;
for (const [name, when, min] of beats) {
  await page.goto(`${BASE}index.html?t=${when}&pause`, { waitUntil: 'load' });
  await page.waitForTimeout(400); // fonts + images settle
  const shot = `${OUT}/${name}.png`;
  const b64 = (await page.screenshot({ path: shot })).toString('base64');
  const mean = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (l > 60) s++;
    }
    return s;
  }, `data:image/png;base64,${b64}`);
  const ok = min === 500 ? mean <= 500 : mean >= min;
  if (!ok) fail++;
  console.log(name.padEnd(12), 't=' + when + 's', 'bright-px', mean, ok ? 'OK' : 'FAIL');
}

if (errors.length) { fail += errors.length; console.log('console errors:', errors); }
await browser.close();
console.log(fail ? `FAIL (${fail})` : 'ALL BEATS OK');
process.exit(fail ? 1 : 0);
