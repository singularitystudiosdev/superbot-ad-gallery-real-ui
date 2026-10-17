// Pitch-deck beat (the 'pitchdeck' variant): asked "Make a slide deck for my pitch", Gemini answers in one line, then a
// deck card generates: six filmstrip thumbs shimmer as skeletons and land in order while "Creating slides N/6" counts
// them, the stage lands slide 1 the same way (each image settles in like the climbing variant's results: a fade in
// from a slight zoom on the same clock), then the deck advances slide 1 to 4 (the next chevron presses, the
// outgoing slide leaves left, the incoming one arrives from the right, each builds as it becomes active and the blue
// thumb ring steps to its thumb). Squeezed into the window the Gemini beat leaves (times(r, end)) so every variant
// loops the same length. Its stylesheet (../pitchdeck.fad54971.css) loads with the module. The startup, its numbers and its copy are
// made up. Every slide is authored once at stage size; the filmstrip scales the same markup down.
import { lerp, seg, outCubic, streamCount, pressScale } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
// the bakery variant's Expand button and the sheet that styles it (its .bk-btn / .bk-expand rules)
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries, in front of Expand (chat.css .pd-head .bk-share keeps the push to the right)
import { shareBtn } from './share.29a362ea.js';

// the head's glyph-only Download, a square twin of the Share control beside it (../pitchdeck.fad54971.css .pd-dl); the skydio
// variant's head (beats/skydio.c9774aa7.js) carries the same one
export const DOWNLOAD = '<span class="bk-btn pd-dl" role="img" aria-label="Download"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg></span>';

const SAY = 'Here’s your pitch deck.';
const CSS = new URL('../pitchdeck.fad54971.css?v=7', import.meta.url).href;
// `LAND` is when each slide lands, as a share of the generation window (the climbing variant's schedule)
const LAND = [0.4, 0.52, 0.64, 0.76, 0.88, 1];
const N = LAND.length;
const STEP = 84;        // filmstrip pitch: a 76px thumb plus the 8px gap
const SLIDE = 40;       // how far (px) a slide travels as it leaves or arrives
const MONTHS = [['May', 18], ['Jun', 22], ['Jul', 26], ['Aug', 32], ['Sep', 39], ['Oct', 48]];
const FUNDS = [['Product', 45, 'rgba(31,122,90,1)'], ['Sales', 35, 'rgba(31,122,90,.6)'], ['Ops', 20, 'rgba(31,122,90,.3)']];

// lucide icons (api.iconify.design/lucide/{chevron-left,chevron-right}.svg)
const ICON = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const PREV = ICON('m15 18l-6-6l6-6');
const NEXT = ICON('m9 18l6-6l-6-6');

// the six slides' inner markup. data-fx marks what builds when the slide becomes active (the filmstrip never builds: it
// shows the final state), data-k its order, data-s / data-d an own start offset and duration in seconds.
const SLIDES = [
  `<div class="pd-sl pd-s1"><div class="pd-rule" data-fx="x" data-k="0"></div><h3 class="pd-h">Fernway</h3><p>Visit scheduling for home-care nurses</p><small>Seed round, 2026</small></div>`,
  `<div class="pd-sl"><h3 class="pd-h">Nurses lose 9 hours a week to scheduling</h3><div class="pd-lines">${['Visits planned by phone and spreadsheet', 'Cancellations leave gaps in the day', 'Drive time goes unpaid'].map((s, i) => `<div class="pd-line" data-fx="row" data-k="${i}">${s}</div>`).join('')}</div></div>`,
  `<div class="pd-sl"><h3 class="pd-h">Fernway plans every visit in one tap</h3>
    <ul class="pd-bul">${['Routes built per nurse', 'Cancelled slots refill', 'Mileage logged for pay'].map((s, i) => `<li data-fx="row" data-k="${i}">${s}</li>`).join('')}</ul>
    <svg class="pd-route" viewBox="0 0 200 150" fill="none">
      <path d="M22 122C36 100 50 88 66 76S108 108 124 96S158 52 172 34" pathLength="1" stroke="rgba(22,24,29,.14)" stroke-width="6" stroke-linecap="round"/>
      <path d="M22 122C36 100 50 88 66 76S108 108 124 96S158 52 172 34" pathLength="1" stroke="#1f7a5a" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1" data-fx="draw" data-s="0.05" data-d="0.42"/>
      ${[[22, 122], [66, 76], [124, 96], [172, 34]].map(([x, y], i) => `<circle class="pd-fx" cx="${x}" cy="${y}" r="6" fill="${i % 3 ? '#f7f5f0' : '#1f7a5a'}" stroke="#1f7a5a" stroke-width="2.5" data-fx="pop" data-s="${(0.05 + i * 0.12).toFixed(2)}"/>`).join('')}
      <g class="pd-fx" data-fx="pop" data-s="0.34"><rect x="92" y="118" width="96" height="26" rx="13" fill="#1f7a5a"/><text x="140" y="135" text-anchor="middle" font-size="12" font-weight="600" fill="#f7f5f0">32 min saved</text></g>
    </svg></div>`,
  `<div class="pd-sl"><h3 class="pd-h">A $14B market still run on paper</h3>
    <div class="pd-nest">${[[176, 'rgba(22,24,29,.09)'], [118, 'rgba(31,122,90,.22)'], [60, '#1f7a5a']].map(([d, c], i) => `<i class="pd-circ" style="width:${d}px;height:${d}px;margin-left:${-d / 2}px;background:${c}" data-fx="circ" data-s="${(i * 0.05).toFixed(2)}" data-d="0.28"></i>`).join('')}</div>
    <div class="pd-lgs">${[['$14B', 'TAM', 'US home-care visits', 'rgba(22,24,29,.14)'], ['$3.2B', 'SAM', 'Agencies with 10 to 200 nurses', 'rgba(31,122,90,.4)'], ['$180M', 'SOM', 'Reachable in three years', '#1f7a5a']].map(([v, k, d, c], i) => `<div class="pd-lg" data-fx="row" data-s="${(0.1 + i * 0.05).toFixed(2)}" data-d="0.22"><i style="background:${c}"></i><div><b>${v}</b><span>${k}, ${d}</span></div></div>`).join('')}</div></div>`,
  `<div class="pd-sl"><h3 class="pd-h">$48K MRR, up 22% a month</h3>
    <div class="pd-chart">${MONTHS.map(([m, v], i) => `<div class="pd-col${i === N - 1 ? ' hi' : ''}"><b>$${v}K</b><u style="height:${(v / 48 * 118).toFixed(1)}px" data-fx="y" data-k="${i}"></u><span>${m}</span></div>`).join('')}</div></div>`,
  `<div class="pd-sl"><h3 class="pd-h">Raising $2.5M to reach 400 agencies</h3>
    <div class="pd-fund"><small>Use of funds</small><div class="pd-seg">${FUNDS.map(([, p, c], i) => `<i style="flex:${p} 1 0;background:${c}" data-fx="x" data-k="${i}"></i>`).join('')}</div><div class="pd-key">${FUNDS.map(([n, p]) => `<div style="flex:${p} 1 0">${n}<span>${p}%</span></div>`).join('')}</div></div></div>`,
];

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`pitchdeck variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// how a built element moves at progress b (0..1): a slide's pieces arrive one after another once it is active
const FX = {
  row: (e, b) => { e.style.opacity = b.toFixed(3); e.style.transform = b >= 1 ? 'none' : `translateY(${((1 - b) * 8).toFixed(2)}px)`; },
  x: (e, b) => { e.style.transform = b >= 1 ? 'none' : `scaleX(${b.toFixed(4)})`; },
  y: (e, b) => { e.style.transform = b >= 1 ? 'none' : `scaleY(${b.toFixed(4)})`; },
  circ: (e, b) => { e.style.opacity = b.toFixed(3); e.style.transform = b >= 1 ? 'none' : `scale(${lerp(0.55, 1, b).toFixed(4)})`; },
  pop: (e, b) => { e.style.opacity = b.toFixed(3); e.style.transform = b >= 1 ? 'none' : `scale(${lerp(0.5, 1, b).toFixed(4)})`; },
  draw: (e, b) => { e.style.strokeDashoffset = (1 - b).toFixed(4); },
};

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.0;
    T.adv = [T.w1 + 0.2, T.w1 + 0.6, T.w1 + 1.0];   // the deck moves on to slides 2, 3 and 4
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    loadFrameSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="pd">
      <div class="pd-head"><b>Fernway pitch deck</b><span>${N} slides</span>${shareBtn('Fernway pitch deck')}${DOWNLOAD}${EXPAND}<span class="pd-exp"><img src="${x.brand('slides-logo.svg')}" alt=""/>Export to Slides</span></div>
      <div class="pd-stage"><div class="pd-shm"><i></i></div>${SLIDES.map((s) => `<div class="pd-sw">${s}</div>`).join('')}
        <div class="pd-nav"><span class="pd-nb pd-prev">${PREV}</span><em></em><span class="pd-nb pd-next">${NEXT}</span></div>
        <span class="qc-genl">${x.tile('gemini')}Creating slides<b class="qc-genn"></b></span>
      </div>
      <div class="pd-strip">${SLIDES.map((s, i) => `<div><div class="pd-th"><div class="pd-shm"><i></i></div><div class="pd-tin">${s}</div></div><div class="pd-n">${i + 1}</div></div>`).join('')}<i class="pd-ring"></i></div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const stage = $('.pd-stage');
    const walls = [...stage.querySelectorAll('.pd-sw')];
    const items = walls.map((w) => [...w.querySelectorAll('[data-fx]')].map((e, i) => ({ e, fx: FX[e.dataset.fx], s: e.dataset.s !== undefined ? +e.dataset.s : 0.08 + (+e.dataset.k || 0) * 0.07, d: +(e.dataset.d || 0.3) })));
    const thumbs = [...block.querySelectorAll('.pd-th')].map((n) => ({ tin: n.querySelector('.pd-tin'), shm: n.querySelector('.pd-shm'), sh: n.querySelector('.pd-shm i') }));
    const labels = [...block.querySelectorAll('.pd-n')];
    const ring = $('.pd-ring'), counter = $('.pd-nav em'), prev = $('.pd-prev'), next = $('.pd-next');
    const stageSh = stage.querySelector(':scope > .pd-shm');
    const genl = $('.qc-genl'), count = $('.qc-genn');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, landed = -1, cur = -1;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // generation: each thumb shimmers as a skeleton until its own landing time, then fades in and settles from a slight zoom
        const span = T.w1 - T.w0;
        const at = LAND.map((s) => T.w0 + span * s);
        let done = 0;
        thumbs.forEach((th, i) => {
          const p = outCubic(seg(t, at[i], at[i] + 0.3));
          if (t >= at[i]) done++;
          th.shm.style.opacity = (1 - p).toFixed(3);
          th.sh.style.transform = `translateX(${lerp(-100, 100, ((t - T.card) * 1.4 + i * 0.17) % 1).toFixed(1)}%)`;
          th.tin.style.opacity = p.toFixed(3);
          th.tin.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.08, 1, p).toFixed(4)})`;
        });
        if (done !== landed) { count.textContent = `${done}/${N}`; landed = done; }
        genl.style.opacity = (1 - seg(t, T.w1, T.w1 + 0.2)).toFixed(3);

        // the stage: its skeleton gives way to slide 1 settling in from a slight zoom as that slide lands
        const land = outCubic(seg(t, at[0], at[0] + 0.3));
        stageSh.style.opacity = (1 - land).toFixed(3);
        stageSh.firstElementChild.style.transform = thumbs[0].sh.style.transform;

        // the deck advances: slide i + 1 arrives (p) as slide i leaves (q); a build starts when a slide becomes active
        const arrive = T.adv.map((a) => outCubic(seg(t, a, a + 0.32)));
        const idx = arrive[0] + arrive[1] + arrive[2];
        walls.forEach((w, i) => {
          const p = i === 0 ? land : (arrive[i - 1] || 0);
          const q = i < arrive.length ? arrive[i] : 0;
          const o = p * (1 - q);
          w.style.visibility = o > 0 ? '' : 'hidden';
          w.style.opacity = o.toFixed(3);
          const dx = (i ? (1 - p) * SLIDE : 0) - q * SLIDE;
          w.style.transform = dx ? `translateX(${dx.toFixed(2)}px)` : i === 0 && land < 1 ? `scale(${lerp(1.08, 1, land).toFixed(4)})` : 'none';
          const a0 = i === 0 ? at[0] : T.adv[i - 1] === undefined ? Infinity : T.adv[i - 1];
          items[i].forEach((it) => it.fx(it.e, outCubic(seg(t, a0 + it.s, a0 + it.s + it.d))));
        });

        // the nav and the filmstrip follow: the counter, the label and the ring all swap halfway through a move
        const now = Math.round(idx);
        if (now !== cur) {
          counter.textContent = `${now + 1} / ${N}`;
          labels.forEach((l, i) => l.classList.toggle('on', i === now));
          cur = now;
        }
        prev.style.opacity = lerp(0.4, 1, Math.min(1, idx)).toFixed(3);
        next.style.transform = `scale(${T.adv.reduce((s, a) => s * pressScale(t, a, 0.18), 1).toFixed(4)})`;
        ring.style.opacity = outCubic(seg(t, at[0], at[0] + 0.3)).toFixed(3);
        ring.style.transform = now ? `translateX(${now * STEP}px)` : 'none';
      },
    };
  },
};
