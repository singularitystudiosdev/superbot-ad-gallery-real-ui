// Renders every poster in ads-src/agents-pain at every gallery ratio into
// assets/ads/<id>.<ar>.png. Expects the source folder served on :8613.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const H = 1080; // native height of the reference art (16:9 = 1920x1080)
const ARS = { '4x5': 4 / 5, '16x9': 16 / 9, '4x3': 4 / 3, '1x1': 1 };
const src = readFileSync('ads-src/agents-pain/ads.js', 'utf8');
const ADS = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));

const only = process.argv.slice(2);
const b = await chromium.launch();
for (const ad of ADS) {
  if (only.length && !only.includes(ad.id)) continue;
  for (const [key, r] of Object.entries(ARS)) {
    const w = Math.round(H * r);
    const p = await b.newPage({ viewport: { width: w, height: H }, deviceScaleFactor: 1 });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    p.on('requestfailed', q => errs.push('reqfail ' + q.url()));
    await p.goto(`http://127.0.0.1:8613/index.html?export=1&id=${ad.id}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.documentElement.dataset.fitted === '1');
    await p.waitForTimeout(250);
    const [l1, l2] = await p.locator('.line').evaluateAll(els => els.map(e => [Math.round(e.scrollWidth), getComputedStyle(e).fontSize]));
    await p.locator('.poster').screenshot({ path: `assets/ads/${ad.id}.${key}.png` });
    console.log(ad.id, key, `${w}x${H}`, 'rows', JSON.stringify([l1, l2]), errs.length ? 'ERRORS ' + JSON.stringify(errs) : '');
    await p.close();
  }
}
await b.close();
