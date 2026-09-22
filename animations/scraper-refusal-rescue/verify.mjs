// Headless verification harness for ads/scraper-refusal-rescue — run: node ads/scraper-refusal-rescue/verify.mjs [base-url]
// Resolves playwright from PLAYWRIGHT_IMPORT, a local node_modules, or the tools install under .tmp.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const PW = process.env.PLAYWRIGHT_IMPORT
  || (existsSync('./node_modules/playwright/index.mjs') ? './node_modules/playwright/index.mjs' : './.tmp/refusal-rescue-tools/node_modules/playwright/index.mjs');
const { chromium } = await import(resolve(PW));

const BASE = process.argv[2] || 'https://singularitystudiosdev.github.io/cloned-xdxdxd/ads/scraper-refusal-rescue/index.html';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('console: ' + m.text()); });

let fails = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`PASS ${name}`);
  else { fails++; console.log(`FAIL ${name} ${detail}`); }
};
const at = async (t) => {
  await page.goto(`${BASE}?t=${t}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
};
const isOn = async (sel) => await page.$eval(sel, (el) => el.classList.contains('on')).catch(() => false);

// 1. frame stroke: black bg + conic gradient border
await at(0);
check('frame bg black', await page.$eval('#frame', (el) => getComputedStyle(el).backgroundColor === 'rgb(0, 0, 0)'));
check('stroke is conic gradient', await page.$eval('#frame', (el) => getComputedStyle(el, '::before').backgroundImage.includes('conic-gradient')));
check('stroke colors pu/bl/pi', await page.$eval('#frame', (el) => {
  const g = getComputedStyle(el, '::before').backgroundImage;
  return g.includes('167, 139, 250') && g.includes('56, 189, 248') && g.includes('244, 114, 182');
}));

// 2. typing: prompt text appears in composer mid-type
await at(1500);
const ctext = await page.textContent('#c-text');
check('prompt typing in composer', /Make a/.test(ctext), `got "${ctext}"`);

// 3. sent: user bubble holds full prompt verbatim
await at(2600);
const ub = await page.textContent('#u-text');
check('user bubble verbatim prompt', ub === 'Make a scraper for reddit', `got "${ub}"`);

// 4. refusal streaming: exact head + growing dramatized body
await at(6000);
const bt = await page.textContent('#b-text');
check('refusal head verbatim', bt.startsWith('❌ I cannot help you with that! That violates'), `got "${bt.slice(0, 60)}"`);
const len6 = bt.length;
await at(9000);
const len9 = await page.textContent('#b-text').then((s) => s.length);
check('refusal keeps generating', len9 > len6, `${len6} -> ${len9}`);
await at(12600);
const len12 = await page.textContent('#b-text').then((s) => s.length);
check('refusal still generating at 12.6s', len12 > len9, `${len9} -> ${len12}`);

// 5. popup: pill text + white bubble below it, gradient pill
await at(10500);
check('popup pill visible', await page.$eval('#popup-zone', (el) => getComputedStyle(el).visibility === 'visible'));
check('pill text', (await page.textContent('#pop-pill')).trim() === 'superbot can do it!');
check('pill gradient', await page.$eval('#pop-pill', (el) => getComputedStyle(el).backgroundImage.includes('linear-gradient')));
check('white bubble below pill', await page.$eval('.popup-zone', (z) => {
  const p = z.querySelector('#pop-pill').getBoundingClientRect();
  const b = z.querySelector('#white-bubble').getBoundingClientRect();
  return getComputedStyle(z.querySelector('#white-bubble')).visibility === 'visible' && b.top > p.bottom;
}));
const wb = await page.textContent('#wb-text');
check('white bubble copy', wb.length > 10, `got "${wb}"`);

// 6. cursor moves in and the pill is pressed to scale .95
await at(13800);
const curOp = await page.$eval('#cursor', (el) => Number(getComputedStyle(el).opacity));
check('cursor visible', curOp > 0.5, String(curOp));
await at(14500);
const pillScale = await page.$eval('#pop-pill', (el) => getComputedStyle(el).transform);
check('pill pressed to ~0.95', /0\.9[45]/.test(pillScale), pillScale);

// 7. dive: chat shrinks into the pill, then source scene on
await at(15350);
const chatTf = await page.$eval('#sc-chat', (el) => getComputedStyle(el).transform);
check('chat dives (scaled)', /matrix\(0\./.test(chatTf), chatTf);
await at(16000);
check('source scene on', await isOn('#sc-src'));
check('load chip visible', await page.$eval('#load-chip', (el) => getComputedStyle(el).opacity === '1'));

// 8. sphere spun and merged; bloom flipped in
await at(19000);
const tileOps = await page.$$eval('.tile3', (els) => els.map((e) => Number(getComputedStyle(e).opacity)));
check('sphere tiles popped', tileOps.filter((o) => o > 0).length >= 10, tileOps.join(',').slice(0, 80));
await at(20900);
const bloomOp = await page.$eval('#src-pad', (pad) => {
  const b = [...pad.children].find((el) => el.tagName === 'DIV' && el.style.zIndex === '5'); // the bloom div
  return b ? Number(getComputedStyle(b).opacity) : -1;
});
check('bloom visible post-flip', bloomOp > 0.9, String(bloomOp));
const hubOp9 = await page.$eval('#src-hub', (el) => Number(getComputedStyle(el).opacity));
check('hub assembling', hubOp9 > 0, String(hubOp9));

// 9. hub landed with superbot message
await at(23400);
const hubOp = await page.$eval('#src-hub', (el) => Number(getComputedStyle(el).opacity));
check('hub fully visible', hubOp === 1, String(hubOp));
const m1 = await page.textContent('#src-msg-1');
check('superbot lands message', m1.includes('reddit scraper ready'), `got "${m1.slice(0, 60)}"`);

// 10. answer scene: prose then code block with working copy
await at(31500);
check('answer scene on', await isOn('#sc-ans'));
const prose = await page.textContent('#sb-prose');
check('prose streamed', prose.includes('working reddit scraper'), `got "${prose.slice(0, 50)}"`);
const code = await page.textContent('#code-pre');
check('code present and complete', code.includes('def scrape_subreddit') && code.includes('https://www.reddit.com') && code.length > 900, `${code.length} chars`);
check('copy button present', (await page.textContent('#copy-label')) === 'Copy');
await page.click('#copy-btn');
await page.waitForTimeout(200);
check('copy label flips', (await page.textContent('#copy-label')) === 'Copied!');
await at(32000); // code typing finished at 31600
const codeFull = await page.textContent('#code-pre');
const clip = await page.evaluate(() => navigator.clipboard.readText());
check('clipboard holds the code', clip.length > 900 && clip === codeFull, `clip ${clip.length} vs pre ${codeFull.length}`);

// 11. cut screen: agents refusing? in rgb(255,0,0)
await at(34500);
check('red scene on', await isOn('#sc-red'));
const lineCol = await page.$eval('#sc-red .line', (el) => getComputedStyle(el).color);
check('refusing line is red 255,0,0', lineCol === 'rgb(255, 0, 0)', lineCol);
check('refusing text', (await page.textContent('#sc-red .line')).trim() === 'agents refusing?');

// 12. gradient slogan
await at(38500);
check('grad scene on', await isOn('#sc-grad'));
check('slogan text', (await page.textContent('#sc-grad .line')).trim() === 'superbot can do it!');
const grad = await page.$eval('#sc-grad .line', (el) => getComputedStyle(el).backgroundImage);
check('slogan is gradient pink/blue/purple', grad.includes('linear-gradient') && grad.includes('244, 114, 182') && grad.includes('56, 189, 248') && grad.includes('167, 139, 250'), grad);

// 13. end card: mascot icon + sliding wordmark
await at(42500);
check('end scene on', await isOn('#sc-end'));
check('mascot tile present', await page.$eval('#sc-end .mark img', (el) => el.getAttribute('src') === 'assets/tile.svg'));
check('wordmark slid in', await page.$eval('#wordmark', (el) => el.classList.contains('slide')));
check('wordmark text', (await page.textContent('#wordmark')).includes('superbot.gg'));
const wmTf = await page.$eval('#wordmark', (el) => getComputedStyle(el).transform);
check('wordmark at rest (slid)', wmTf === 'none' || /^matrix\(1, 0(\.0)?, 0, 1, 0, 0\)$/.test(wmTf), wmTf);

// 14. free-run: loop restarts cleanly. The ad's clock is rAF-driven and throttles
// in headless, so poll: first observe the pass reaching the end card (sc-end on,
// ~3.6s window), then observe the restarted state (sent bubble hidden again,
// ~2.5s window). Seeing both proves a full pass completed AND a clean restart.
await page.goto(BASE, { waitUntil: 'networkidle' });
let sawEnd = false, restarted = false;
for (let i = 0; i < 180 && !restarted; i++) {
  await page.waitForTimeout(1000);
  if (!sawEnd) {
    sawEnd = await page.$eval('#sc-end', (el) => el.classList.contains('on')).catch(() => false)
      || await page.$eval('#replay', (el) => el.classList.contains('show')).catch(() => false);
  } else {
    const uHidden = await page.$eval('#u-msg', (el) => getComputedStyle(el).display === 'none').catch(() => false);
    const chatOn = await page.$eval('#sc-chat', (el) => el.classList.contains('on')).catch(() => false);
    const helloVis = await page.$eval('#c-ph', (el) => getComputedStyle(el).display !== 'none').catch(() => false);
    if (uHidden && chatOn && helloVis) { restarted = true; console.log(`restarted ~${(i + 1)}s after load`); break; }
  }
}
check('first pass reaches end card', sawEnd);
check('loop restarts to chat scene', restarted);
// independent re-read: the sent bubble's own computed display, not the shared flag
const uHiddenNow = await page.$eval('#u-msg', (el) => getComputedStyle(el).display === 'none').catch(() => false);
check('sent bubble hidden after restart', uHiddenNow);

check('no console/page errors', errors.length === 0, errors.join(' | '));
console.log(fails ? `\n${fails} FAIL(S)` : '\nALL CHECKS PASSED');
await browser.close();
process.exit(fails ? 1 : 0);
