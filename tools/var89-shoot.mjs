// var89-shoot.mjs: frame-exact screenshots of any timeline spot page (local http-server or the live
// GitHub Pages URL) at a list of t values, in one browser session.
//
// usage:
//   node tools/var89-shoot.mjs --url <page.html or dir/> --ar 4x5 --ts 1.0,2.0 --out <dir> [--vw 1080 --vh 1350]
//
// Every frame goes to <out>/t<tt>.png. The clock is frozen with ?t= and re-seeked through window.__AD.seek(t)
// so the capture is the timeline's own frame, not a wall-clock sample.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '');
  const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  args[k] = v;
}

const url = args.url;
const ar = args.ar || '4x5';
const ts = String(args.ts || '0').split(',').map((s) => Number(s));
const out = args.out;
const vw = Number(args.vw || 1080);
const vh = Number(args.vh || 1350);
const settle = Number(args.settle || 900);
if (!url || !out) { console.error('need --url and --out'); process.exit(2); }
mkdirSync(out, { recursive: true });

const withQ = (t) => `${url}${url.includes('?') ? '&' : '?'}ar=${ar}&t=${t}`;
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));

await page.goto(withQ(ts[0]), { waitUntil: 'load' });
await page.waitForFunction(() => !!(window.__AD && window.__AD.ready), null, { timeout: 30000, polling: 50 });
await page.evaluate(() => document.body.classList.add('freeze'));
await page.waitForTimeout(settle);

for (const t of ts) {
  await page.evaluate((tt) => window.__AD.seek(tt), t);
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${out}/t${t}.png` });
}
const info = await page.evaluate(() => ({ CYCLE: window.__AD.CYCLE, cards: window.__AD.cardSettle, ar: window.AR }));
await browser.close();
console.log(JSON.stringify({ out, ar, viewport: `${vw}x${vh}`, info, errors: errs }, null, 1));