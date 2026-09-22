// Renders every poster in ads-src/context-cleanup at every gallery ratio into
// assets/ads/<id>.<ar>.png. Expects the source folder served on :8615
// (npx http-server ads-src/context-cleanup -p 8615 -c-1). Run from the repo
// root; pass ids to render a subset; OUT=dir to render elsewhere (previews).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const H = 1080; // native height, as the agents-pain family (16:9 = 1920x1080)
const ARS = { '4x5': 4 / 5, '16x9': 16 / 9, '4x3': 4 / 3, '1x1': 1 };
const src = readFileSync('ads-src/context-cleanup/ads.js', 'utf8');
const ADS = eval(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const out = process.env.OUT || 'assets/ads';
mkdirSync(out, { recursive: true });

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
    await p.goto(`http://127.0.0.1:8615/index.html?export=1&id=${ad.id}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.documentElement.dataset.fitted === '1');
    await p.waitForTimeout(250);
    await p.locator('.poster').screenshot({ path: `${out}/${ad.id}.${key}.png` });
    console.log(ad.id, key, `${w}x${H}`, errs.length ? 'ERRORS ' + JSON.stringify(errs) : 'ok');
    await p.close();
  }
}
await b.close();
