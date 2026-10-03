// Write beat: Claude Opus 5.5 rewrites the product descriptions, in the base's writing-panel grammar (Cursor's agent
// panel, via bikeride-model-switch's code beat and the GitHub fork's diff panel): a header with "Product
// descriptions", the store chip and an honest clock ("Working 1s", then a check and "Worked for 2s"), the tabs (one per
// product, each with its own photo: Stoneware Mug active, then Soy Candle), and a body where the store's old
// description sits as one muted, struck-through line under "Before" and the new one streams in behind a caret under
// "After". Then the tab switches to Soy Candle and its rewrite streams. The review bar counts the products ("Rewriting
// 1 of 48") and lands on "48 of 48 descriptions rewritten in your store's voice" with the green check, with Review /
// Keep all. In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS).
// Pure function of t: every value on screen is written from t. Each "After" paragraph is laid out whole from the start
// (the streamed part visible, the rest transparent), so nothing reflows while it streams.
import { seg, outCubic } from '../../../lib.js';
import { STORE } from './catalog.js?v=a3b73360';

const SAY = 'Rewrote every description in your voice, keeping each product\'s real specs.';
const TITLE = 'Product descriptions';
// the two products the panel shows (rows 1 and 3 of the store's table, shopify.js): [tab, photo, before, after]
export const REWRITES = [
  ['Stoneware Mug', 'mug.jpg', 'mug 12oz ceramic',
    'Wheel-thrown stoneware with a speckled cream glaze. Holds 12 oz. Microwave and dishwasher safe.'],
  ['Soy Candle', 'candle.jpg', 'candle fig scent',
    'Hand-poured soy wax with ripe fig and cedar. About 50 hours of burn time in a reusable amber jar.'],
];
const TOTAL = 48;
const DONE = '48 of 48 descriptions rewritten in your store\'s voice';

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first rewritten character lands
const WRITE_A = 0.7; /* deliberate */ // the mug's rewrite streaming in
const TAB_AT = 0.2;      // the mug written, then the tab switches to the candle
const TAB_IN = 0.12;     // the candle's body fading up
const WRITE_B = 0.7; /* deliberate */ // the candle's rewrite streaming in (read while the camera holds)
const REST_AT = 0.06;    // the candle written, then the other 46 count through
const REST = 0.34;       // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Keep all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const DOC = '<svg class="wr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16h5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + WRITE_AT;
    T.a1 = T.a0 + WRITE_A;
    T.tab = T.a1 + TAB_AT;
    T.b0 = T.tab + TAB_IN;
    T.b1 = T.b0 + WRITE_B;
    T.n0 = T.b1 + REST_AT;
    T.done = T.n0 + REST;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const body = ([, , before]) => `<div class="wr-bd">
        <div class="wr-sec"><span class="wr-lb">Before</span><s class="wr-old">${x.esc(before)}</s></div>
        <div class="wr-sec"><span class="wr-lb wr-lb-a">After</span><p class="wr-new"><span class="wr-v"></span><i class="wr-caret"></i><span class="wr-h"></span></p></div>
      </div>`;
    const card = x.el(`<div class="wr-x">
      <div class="wr-hd">
        <span class="wr-proj">${DOC}<b>${TITLE}</b></span><span class="wr-br">${x.esc(STORE.name)}</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-tabs">${REWRITES.map(([tab, photo], i) => `<span class="wr-tab${i === 0 ? ' on' : ''}"><img src="${x.img(photo)}" alt=""/>${x.esc(tab)}</span>`).join('')}<span class="wr-more">+46</span></div>
      <div class="wr-bds">${REWRITES.map(body).join('')}</div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}${TICK.replace('wr-tk', 'wr-tk wr-dn')}<b class="wr-nf">Rewriting</b><span class="wr-cnt">1 of ${TOTAL}</span></span>
        <span class="wr-btns"><i class="wr-b">Review</i><i class="wr-b wr-pri">Keep all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.wr-tab')];
    const bodies = [...card.querySelectorAll('.wr-bd')].map((n, i) => ({
      n, v: n.querySelector('.wr-v'), h: n.querySelector('.wr-h'), c: n.querySelector('.wr-caret'), text: REWRITES[i][3], shown: -1, caret: null,
    }));
    const state = $('.wr-state'), stateL = $('.wr-sl'), clk = $('.wr-clk'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), cnt = $('.wr-cnt'), ft = $('.wr-ft'), pri = $('.wr-pri');
    let said = -1, onTab = -1;

    // one rewrite's stream: characters [0, n) visible, the rest laid out but transparent, the caret riding the edge
    const stream = (o, a, b, t) => {
      const n = Math.round(o.text.length * seg(t, a, b));
      if (n !== o.shown) { o.v.textContent = o.text.slice(0, n); o.h.textContent = o.text.slice(n); o.shown = n; }
      const on = t >= a - 0.05 && t < b + 0.25;
      if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the tab: the mug until the switch, then the candle (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((o, i) => { o.n.style.visibility = i === tab ? '' : 'hidden'; });
          onTab = tab;
        }
        bodies[1].n.style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(bodies[0], T.a0, T.a1, t);
        stream(bodies[1], T.b0, T.b1, t);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the product being rewritten (1, 2, then the other 46 count through), then the summary
        const nDone = tab === 0 ? 1 : 2 + Math.floor((TOTAL - 2) * seg(t, T.n0, T.done) + 1e-6);
        setText(nf, d ? DONE : 'Rewriting');
        setText(cnt, d ? '' : `${Math.min(TOTAL, nDone)} of ${TOTAL}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
