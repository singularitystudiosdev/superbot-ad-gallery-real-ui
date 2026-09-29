// var89-probe.mjs: measure the site's hero heading, total, rows and y-axis labels in a live frame, to tell a
// real overflow from a sub-pixel artifact. usage: node tools/var89-probe.mjs <port> <id> <t> [ar]
import { chromium } from 'playwright';
const [port, id, t, ar = '4x5'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1350 } })).newPage();
await page.goto(`http://127.0.0.1:${port}/animations/${id}/index.html?ar=${ar}&t=${t}`, { waitUntil: 'load' });
await page.waitForFunction(() => !!(window.__AD && window.__AD.ready), null, { timeout: 30000, polling: 50 });
await page.evaluate(() => document.body.classList.add('freeze'));
await page.waitForTimeout(900);
await page.evaluate((tt) => window.__AD.seek(tt), Number(t));
await page.waitForTimeout(200);
const out = await page.evaluate(() => {
  const m = (n) => n && ({ text: (n.textContent || '').trim().slice(0, 40), cw: n.clientWidth, sw: n.scrollWidth, ch: n.clientHeight, sh: n.scrollHeight, rects: n.getClientRects().length, box: (() => { const b = n.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; })() });
  const hero = document.querySelector('.wn-rev .wn-hero h1') || document.querySelector('.wn-hero h1');
  const page1 = document.querySelector('.wn-rev .wn-page');
  const yls = [...(document.querySelector('.wn-rev').querySelectorAll('.eq-yl') || [])].slice(0, 8).map(m);
  const tags = [...document.querySelector('.wn-rev').querySelectorAll('.eq-tag text')].map(m);
  const rows = [...document.querySelectorAll('.wn-rev .wn-row')].map((r) => ({ what: m(r.querySelector('.wn-what')), amt: m(r.querySelector('.wn-amt')), when: m(r.querySelector('.wn-when')) }));
  return { hero: m(hero), heroParent: m(hero && hero.parentElement), page: m(page1), rowBox: m(document.querySelector('.wn-rev .wn-row')), num: m(document.querySelector('.wn-rev .wn-num')), yls, tags, rows, svg: (() => { const s = document.querySelector('.wn-rev svg.eq'); const b = s && s.getBoundingClientRect(); return b ? { box: [Math.round(b.left), Math.round(b.width)], viewBox: s.getAttribute('viewBox') } : null; })() };
});
await browser.close();
console.log(JSON.stringify(out, null, 1));