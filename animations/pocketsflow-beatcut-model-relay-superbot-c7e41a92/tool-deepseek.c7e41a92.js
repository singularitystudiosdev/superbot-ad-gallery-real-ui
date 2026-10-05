// DeepSeek V4 workspace (chat.deepseek.com, DeepThink + Search on): scrapes both pricing pages, gets a 403
// from Reddit, retries in a real browser where most assistants stop, then writes the beat sheet.
// Prices are from gumroad.com/pricing and pocketsflow.com/pricing; threads are real (fetched 2026-10-05).
import { h } from './shell.c7e41a92.js';
import { icon } from './icons.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';
import { D, PANEL, CLIPS } from './plan.c7e41a92.js';

const ASK = 'Scrape Gumroad and Pocketsflow pricing, and the past year of Reddit threads on Gumroad fees. Then write 7 lines for the film, one per bar.';
const LOG = [
  ['GET', 'gumroad.com/pricing', '200', '"10% + 50¢ per sale"', 'ok'],
  ['GET', 'pocketsflow.com/pricing', '200', '"4.7% + 30¢, no monthly fee"', 'ok'],
  ['GET', 'reddit.com/search?q=gumroad+fees', '403', 'blocked', 'bad'],
  ['↻', 'same URL, real headless browser', '200', '40 threads', 'ok'],
];
const THREADS = [
  ['r/passive_income', '62', '75', "What's the best platform to sell digital products without losing a big chunk to fees?"],
  ['r/passive_income', '32', '37', "What's the best platform to sell digital products with no monthly fees?"],
  ['r/DigitalProductEmpir', '5', '8', 'I did the math on what Gumroad fees actually cost at different revenue levels and the numbers are worse than I thought'],
];
const SHEET = [
  ['1', 'Gumroad keeps $10.50', 'T1 text', 'hook1'],
  ['2', 'of every $100 you sell.', 'T1 text', 'hook2'],
  ['3', 'Pocketsflow keeps $5.', 'T1 over 3D · drop', 'keeps'],
  ['4', 'New sale. $29.', 'V1 stills'],
  ['5', 'Checkout in one tap.', 'V2 UI'],
  ['6', '$2,480 this week.', 'V2 UI'],
  ['7', 'Keep $95 of every $100.', 'V1 poster · hit'],
];

const VIEW_H = 500;

export function buildDeepseek() {
  const el = h(`<div class="tool t-ds">
<aside class="dside"><div class="dbrand"><img src="brand/deepseek-logo.svg" alt=""><b>deepseek</b></div>
  <div class="dnew">${icon('plus')}New chat</div><div class="dsec">Today</div>
  <div class="drow on">Pocketsflow film research</div><div class="drow">Remotion beat sync</div><div class="dsec">Previous 7 days</div>
  <div class="drow">Stripe tax regions</div><div class="drow">Cloudflare 403 retry</div></aside>
<div class="dmain"><div class="dscroll" data-scroll><div class="dcol" data-col>
  <div class="dask" data-i><span>${ASK}</span></div>
  <div class="dresp">
    <div class="dthink" data-i><span class="av"><img src="brand/deepseek-logo.svg" alt=""></span><span class="tl" data-tl><span class="a">Thinking...</span><span class="b">Thought for 7 seconds</span></span>${icon('chevron')}</div>
    <div class="dsearch" data-i><span class="fav g">G</span><span class="fav p">PF</span><span class="fav r"><img src="brand/reddit-logo.svg" alt=""></span>Read 43 web pages</div>
    <div class="dlog" data-i>${LOG.map((r) => `<div class="lr ${r[4]}" data-lr><span class="m">${r[0]}</span><span class="u">${r[1]}</span><span class="c">${r[2]}</span><span class="v">${r[3]}</span></div>`).join('')}</div>
    <div class="drefuse" data-i><s>“I can't help get around a site's bot protection.”</s><span>what most assistants say here</span></div>
    <div class="dfind" data-i><div class="fl">On a $100 sale</div>
      <div class="stat bad"><em>Gumroad keeps</em><b>$10.50</b><span>10% + 50¢</span></div>
      <div class="stat good"><em>Pocketsflow keeps</em><b>$5.00</b><span>4.7% + 30¢</span></div></div>
    <div class="dthreads" data-i><div class="fl">Loudest threads, past year</div>
      ${THREADS.map((r) => `<div class="dth"><img src="brand/reddit-logo.svg" alt=""><span class="sub">${r[0]}</span><span class="tt">${r[3]}</span><span class="n">${r[1]} ↑ · ${r[2]}</span></div>`).join('')}</div>
    <div class="dsheet" data-i><div class="fl">7 lines, one per bar</div>
      ${SHEET.map((r) => `<div class="sr" data-sr${r[3] ? ` data-clip="${r[3]}"` : ''}><span class="bn">${r[0]}</span><span class="ln">${r[1]}</span><span class="tg">${r[2]}</span></div>`).join('')}</div>
  </div></div></div></div>
  <div class="dinput"><span class="ph">Message DeepSeek</span><span class="tog on">${icon('globe')}DeepThink</span><span class="tog on">${icon('search')}Search</span><span class="sb">${icon('arrowUp')}</span></div>
</div></div>`);
  const items = [...el.querySelectorAll('[data-i]')];
  const tIn = [D + 0.35, D + 0.6, D + 1.15, D + 1.3, D + 2.55, D + 2.95, D + 3.35, D + 3.85];
  const logRows = [...el.querySelectorAll('[data-lr]')];
  const logIn = [D + 1.3, D + 1.6, D + 1.9, D + 2.3];
  const sheetRows = [...el.querySelectorAll('[data-sr]')];
  const tl = el.querySelector('[data-tl]'), tla = tl.querySelector('.a'), tlb = tl.querySelector('.b');
  const scroll = el.querySelector('[data-scroll]'), col = el.querySelector('[data-col]');
  let targets = [];

  function scrollAt(t) {
    let s = targets[0] ?? 0;
    for (let i = 1; i < targets.length; i++) s += (targets[i] - targets[i - 1]) * EASE.inOut(clamp01((t - tIn[i]) / 0.5));
    return s;
  }

  return {
    id: 'deepseek', label: 'DeepSeek V4', logo: 'brand/deepseek-logo.svg', tileBg: '#fff', el,
    measure() {
      let prev = 0;
      targets = items.map((it) => (prev = Math.max(prev, it.offsetTop + it.offsetHeight - VIEW_H + 24, 0)));
      // Each sheet line that becomes a text clip flies from where it sits once the column has scrolled.
      const final = targets[targets.length - 1];
      for (const row of el.querySelectorAll('[data-clip]')) {
        const clip = CLIPS.find((c) => c.id === row.dataset.clip);
        const r = row.querySelector('.ln');
        let x = 0, y = 0;
        for (let n = r; n && n !== el; n = n.offsetParent) {
          x += n.offsetLeft;
          y += n.offsetTop;
        }
        clip.src = [x - 6, PANEL.tabsH + y - final - 4, r.offsetWidth + 12, r.offsetHeight + 8];
      }
    },
    update(t) {
      items.forEach((it, i) => {
        const a = prog(t, tIn[i], 0.35, EASE.standard);
        it.style.opacity = a.toFixed(3);
        it.style.transform = `translateY(${((1 - a) * 12).toFixed(2)}px)`;
      });
      const th = prog(t, D + 1.15, 0.25, EASE.standard);
      tla.style.opacity = (1 - th).toFixed(3);
      tlb.style.opacity = th.toFixed(3);
      tla.style.webkitMaskPosition = `${(100 - ((((t - D) % 1.2) + 1.2) % 1.2) / 1.2 * 100).toFixed(1)}% 0`;
      logRows.forEach((r, i) => {
        const a = prog(t, logIn[i], 0.25, EASE.standard);
        r.style.opacity = a.toFixed(3);
        r.style.transform = `translateX(${((1 - a) * -10).toFixed(2)}px)`;
      });
      sheetRows.forEach((r, i) => {
        const a = prog(t, D + 3.95 + i * 0.12, 0.25, EASE.standard);
        r.style.opacity = a.toFixed(3);
        r.style.transform = `translateX(${lerp(-8, 0, a).toFixed(2)}px)`;
      });
      col.style.transform = `translateY(${(-scrollAt(t)).toFixed(2)}px)`;
    },
  };
}
