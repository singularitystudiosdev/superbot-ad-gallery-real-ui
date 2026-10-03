// Watch beat (the data fork's backlog.js, reskinned): Gemini watches the vlog. Its line streams, a card rises
// ("Watching iceland_vlog_final.mp4", a mm:ss counter), and inside it a window of timestamped moments scrolls fast from
// the top of the video to the end while the counter climbs 00:00 to 18:42: each row a mono time, a small 16:9 frame
// (a crop of the vlog's real photos, img/sw-*.jpg) and a caption. The three frames Gemini picks (07:12, 09:55, 12:30)
// light gold with a star as the counter passes them. Then the watch resolves: the rows dim under a scrim and the
// chips land over them, one by one, the last one the gold "Ready to design".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Watched all 18:42. Three frames carry the story: 07:12, 09:55 and 12:30.';
const LABEL = 'Watching iceland_vlog_final.mp4';
const TOTAL = 18 * 60 + 42; // seconds of video
// the moments as they pass: [mm:ss, frame swatch, caption, picked?]
const ROWS = [
  ['00:41', 'sw-0041.jpg', 'base camp, wind picking up'],
  ['03:20', 'sw-0320.jpg', 'crampons on, crossing the ice'],
  ['07:12', 'sw-0712.jpg', 'inside the ice cave, blue light', true],
  ['09:55', 'sw-0955.jpg', 'tent on the ice at dusk', true],
  ['12:30', 'sw-1230.jpg', 'the ice cracks next to the tent', true],
  ['15:48', 'sw-1548.jpg', 'sunrise over the glacier'],
  ['18:02', 'sw-1802.jpg', 'packing out'],
];
const ISSUES = ['18:42 watched', 'Hook at 12:30', '3 frames picked'];
const READY = 'Ready to design';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the moments scrolling past, first to last (the counter runs with it)
const CHIPS_AT = 0.82;                 // the card landing to the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 4;                       // rows visible in the window
const ROW = 30;                        // one row's height, px

const secs = (s) => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
const mmss = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STAR = '<svg class="wt-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = [...ISSUES, READY].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wt-card">
      <div class="wt-hd"><span class="wt-st"><i class="wt-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="wt-cnt"><b class="wt-n">00:00</b> / 18:42</span></div>
      <div class="wt-vp">
        <div class="wt-bar"><i class="wt-fill"></i></div>
        <div class="wt-win"><div class="wt-list">${ROWS.map(([tm, sw, cap, pick]) => `<div class="wt-row${pick ? ' wt-pick' : ''}"><span class="wt-tm">${tm}</span><img class="wt-sw" src="${x.img(sw)}" alt=""/><span class="wt-cap">${esc(cap)}</span>${pick ? STAR : ''}</div>`).join('')}</div></div>
        <i class="wt-scrim"></i>
        <div class="wt-chips">${ISSUES.map((tp) => `<span class="wt-chip">${x.esc(tp)}</span>`).join('')}<span class="wt-chip wt-ready">${x.esc(READY)}</span></div>
      </div>
    </div>`);
    const list = card.querySelector('.wt-list'), n = card.querySelector('.wt-n'), scrim = card.querySelector('.wt-scrim');
    const fill = card.querySelector('.wt-fill');
    const rows = [...card.querySelectorAll('.wt-row')].map((r, i) => ({ r, at: secs(ROWS[i][0]), pick: !!ROWS[i][3] }));
    const chips = [...card.querySelectorAll('.wt-chip')];
    const spin = card.querySelector('.wt-spin'), ok = card.querySelector('.wt-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scroll: first moment to the last, fast through the middle (a touch of blur at speed), the counter with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        // the counter rides the same easing as the scroll, so the time on the counter is the moment in the window
        const v = TOTAL * e;
        const c = mmss(v);
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${(v / TOTAL).toFixed(4)})`;
        // a picked moment lights as the counter passes it
        rows.forEach((o) => { if (o.pick) o.r.classList.toggle('on', p > 0 && v >= o.at); });

        // done watching: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the watch resolves: the rows dim under the scrim, the chips land over them
        scrim.style.opacity = outCubic(seg(t, T.chip[0] - 0.1, T.chip[0] + 0.2)).toFixed(3);
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
