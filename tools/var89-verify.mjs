// var89-verify.mjs: headless check of the generated variants. For each <id> and each t it captures a frame and
// reports what the DOM says about that frame: the on-screen text (dash scan), every listed element that clips or
// wraps its own text, and any listed element that leaves the 1080x1350 frame.
//
//   node tools/var89-verify.mjs --port 8941 --ids id1,id2 --ar 4x5 --ts 1.6,3.4 --out /tmp/var89-verify
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '');
  const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  args[k] = v;
}
const port = args.port || '8941';
const ids = String(args.ids || '').split(',').filter(Boolean);
const ar = args.ar || '4x5';
const ts = String(args.ts || '').split(',').filter(Boolean).map(Number);
const out = args.out;
const vw = Number(args.vw || 1080), vh = Number(args.vh || 1350);
mkdirSync(out, { recursive: true });

const SELECTORS = [
  '.card .cl', '.qc-typed', '.qc-say', '.wk-sub', '.wk-stx', '.wk-bd',
  '.wn-url', '.wn-hero h1', '.wn-num', '.wn-sub', '.wn-chhd small', '.wn-lg',
  '.wn-sech small', '.wn-sech h2', '.wn-what', '.wn-amt', '.wn-when',
  '.wn-night small', '.wn-nh b', '.wn-nh span', '.wn-night p', '.wn-foot',
  '.eq-yl', '.eq-xl', '.eq-tag text',
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const consoleErrs = [];
page.on('pageerror', (e) => consoleErrs.push(String(e && e.message ? e.message : e)));

const report = {};
for (const id of ids) {
  const url = `http://127.0.0.1:${port}/animations/${id}/index.html?ar=${ar}&t=${ts[0]}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!(window.__AD && window.__AD.ready), null, { timeout: 30000, polling: 50 });
  await page.evaluate(() => document.body.classList.add('freeze'));
  await page.waitForTimeout(900);
  const idOut = `${out}/${id}`;
  mkdirSync(idOut, { recursive: true });
  const rows = [];
  for (const t of ts) {
    await page.evaluate((tt) => window.__AD.seek(tt), t);
    await page.waitForTimeout(140);
    await page.screenshot({ path: `${idOut}/t${t}.png` });
    const r = await page.evaluate(([tt, sels]) => {
      const stage = document.getElementById('stage');
      const sb = stage.getBoundingClientRect();
      const inFrame = (b) => b.left >= sb.left - 2 && b.right <= sb.right + 2 && b.top >= sb.top - 2 && b.bottom <= sb.bottom + 2;
      const vis = (n) => {
        const cs = getComputedStyle(n);
        const b = n.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02 && b.width > 0 && b.height > 0;
      };
      const clipped = [], outside = [], wrap = [];
      for (const sel of sels) {
        for (const n of document.querySelectorAll(sel)) {
          if (!vis(n)) continue;
          const txt = (n.textContent || '').trim().slice(0, 60);
          const b = n.getBoundingClientRect();
          if (n.scrollWidth > n.clientWidth + 1 && n.clientWidth > 0) clipped.push({ sel, txt, kind: 'x', sw: n.scrollWidth, cw: n.clientWidth });
          if (n.scrollHeight > n.clientHeight + 1 && n.clientHeight > 0) clipped.push({ sel, txt, kind: 'y', sh: n.scrollHeight, ch: n.clientHeight });
          if (n.getClientRects().length > 1 && sel !== '.card .cl' && sel !== '.wn-sub' && sel !== '.wn-night p') wrap.push({ sel, txt, lines: n.getClientRects().length });
          if (!inFrame(b)) outside.push({ sel, txt, box: [Math.round(b.left - sb.left), Math.round(b.top - sb.top), Math.round(b.right - sb.left), Math.round(b.bottom - sb.top)] });
        }
      }
      const text = stage.innerText;
      const dashes = text.split('\n').filter((l) => /[–—]/.test(l)).map((l) => l.trim());
      return { t: tt, clipped, wrap, outside, dashes, textLen: text.length };
    }, [t, SELECTORS]);
    rows.push(r);
  }
  const text = await page.evaluate(() => document.getElementById('stage').innerText);
  const voice = await page.evaluate(() => window.__AD.id);
  report[id] = { adId: voice, frames: rows, text };
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
const bad = [];
for (const [id, r] of Object.entries(report)) {
  for (const f of r.frames) {
    if (f.clipped.length || f.wrap.length || f.outside.length || f.dashes.length) bad.push({ id, t: f.t, clipped: f.clipped, wrap: f.wrap, outside: f.outside, dashes: f.dashes });
  }
}
console.log(JSON.stringify({ errors: consoleErrs, flagged: bad }, null, 1));
console.log(`frames: ${ids.length * ts.length}, ids: ${ids.length}`);