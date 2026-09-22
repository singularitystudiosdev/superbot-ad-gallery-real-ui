// Renders every poster in ads-src/context-storage at every gallery ratio into
// assets/ads/<id>.<ar>.png. Expects the source folder served on :8614
// (`npx http-server ads-src/context-storage -p 8614 -c-1`), run from the repo
// root: `node ads-src/context-storage/render.mjs [id ...]`.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const H = 1080; // native height of the poster art (16:9 = 1920x1080)
const ARS = { '4x5': 4 / 5, '16x9': 16 / 9, '4x3': 4 / 3, '1x1': 1 };
const src = readFileSync('ads-src/context-storage/ads.js', 'utf8');
const ADS = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const PORT = process.env.PORT || 8614;

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
    await p.goto(`http://127.0.0.1:${PORT}/index.html?export=1&id=${ad.id}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.documentElement.dataset.fitted === '1');
    await p.waitForTimeout(250);
    // overflow guard: the poster is the viewport, so any child past its box is a defect
    const over = await p.evaluate(() => {
      const P = document.querySelector('.poster').getBoundingClientRect();
      return [...document.querySelectorAll('.head, .card, .stats')].map(e => {
        const r = e.getBoundingClientRect();
        return [e.className, Math.round(r.top), Math.round(r.bottom), r.top < P.top - 1 || r.bottom > P.bottom + 1 || r.left < P.left - 1 || r.right > P.right + 1];
      });
    });
    const head = await p.locator('.head').evaluate(e => getComputedStyle(e).fontSize);
    await p.locator('.poster').screenshot({ path: `assets/ads/${ad.id}.${key}.png` });
    const bad = over.filter(o => o[3]).map(o => o[0]);
    console.log(ad.id, key, `${w}x${H}`, 'head', head, 'boxes', JSON.stringify(over.map(o => [o[0], o[1], o[2]])), bad.length ? 'OVERFLOW ' + bad.join(',') : '', errs.length ? 'ERRORS ' + JSON.stringify(errs) : '');
    await p.close();
  }
}
await b.close();
