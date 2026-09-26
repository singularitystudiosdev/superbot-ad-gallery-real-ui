// Shots beat: the video model animates the storyboard into shots. Its line streams, the "Rendering 4 shots" chip
// lands, and the render-queue card rises in behind it: one row per shot, a 96x54 thumbnail that resolves out of the
// dark under a single sweeping light band and then keeps drifting in a slow t-driven ken-burns push, so a finished
// row reads as a clip that is moving, a thin progress bar filling and a percentage counting up on its right until
// the moment the shot lands, when the percentage swaps to a green check and "Done". Rows start 0.35s apart and the
// chip fades as the last clip lands. k.opts.set picks what the model took: 'all' (shots 1 to 4, the default),
// 'hero' (1 and 2) or 'rest' (3 and 4), and the beat's line says which.
// Pure function of t: every moving value is written from t in render, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = {
  all: 'Animated the storyboard into four shots.',
  hero: 'Animated the two hero shots.',
  rest: 'Animated the other two shots.',
};

// [still, number, scene, seconds]: the four shots in storyboard order, as frames of the animated short
const SHOTS = [
  ['future/still-42.jpg', 'Shot 01', 'Kid meets the machine', 8],
  ['future/still-152.jpg', 'Shot 02', 'Rooftop at dusk', 8],
  ['future/still-212.jpg', 'Shot 03', 'The bloom', 6],
  ['future/still-172.jpg', 'Shot 04', 'Garden and the moon', 8],
];
const SETS = { all: [0, 1, 2, 3], hero: [0, 1], rest: [2, 3] };

const STAGGER = 0.35;  // gap between one row starting to render and the next
const HOLD = 0.8;      // the finished queue sits like this before the beat hands off
const SWEEP = 0.55;    // one band sweep across a thumbnail as it comes alive
const DRIFT = 1.4;     // seconds of ken-burns travel a row keeps moving for after its clip lands
const VID = '<svg class="shots-vid" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="12.5" height="13" rx="2.6"/>'
  + '<path d="M15 10.4l5.5-2.9v9l-5.5-2.9z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;     // the "Rendering N shots" chip lands
    T.card = r + 0.34;      // the queue card rises in
    T.end = r + 3.0;        // the four-shot schedule: the last row lands at r+2.2, then the queue holds
    T.last = T.end - HOLD;  // every row's render completes here, so either set fills the same window
    T.chipOut = T.last - 0.08; // the chip turns to its rendered label as the last clip lands
    return T;
  },
  build(k, x) {
    const T = k.T;
    const key = (k.opts || {}).set;
    const sayTxt = SAY[key] || SAY.all;
    const list = (SETS[key] || SETS.all).map((i) => SHOTS[i]);
    const N = list.length;
    const start = list.map((_, i) => T.card + i * STAGGER);  // each row's render begins
    // one render duration for the whole queue, sized so the last row lands at T.last however many shots there are
    const dur = Math.max(0.3, T.last - start[N - 1]);
    const doneT = start.map((a) => a + dur);                 // ...and each row lands here

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(sayTxt)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow shots-genrow"><span class="ch-tool shots-gen">${x.tile(k.app)}<span class="ch-tool-t">Rendering ${N} shots</span></span></div>`);
    const genT = gen.querySelector(".ch-tool-t");
    let genLab = "";
    const card = x.el(`<div class="shots-card">
      <div class="shots-hd"><i class="shots-ic">${VID}</i><b>Render queue</b><span class="shots-hd-l"></span></div>
      <div class="shots-rows">${list.map(([src, no, name, secs]) => `<div class="shots-row">
        <span class="shots-thumb"><img class="shots-img" src="${x.img(src)}" alt="${x.esc(no + ', ' + name)}"/>
          <i class="shots-band" aria-hidden="true"></i></span>
        <span class="shots-txt"><span class="shots-title">${x.esc(no + ' · ' + name)}</span>
          <span class="shots-meta">${secs}s · 1080p · 24fps</span></span>
        <span class="shots-out"><span class="shots-track"><i class="shots-bar"></i></span>
          <span class="shots-lab"><span class="shots-pct">0%</span><span class="shots-fin">${x.OK}<span class="shots-fin-l">Done</span></span></span></span>
      </div>`).join('')}</div>
    </div>`);

    const rows = [...card.querySelectorAll('.shots-row')].map((row) => ({
      img: row.querySelector('.shots-img'), band: row.querySelector('.shots-band'),
      track: row.querySelector('.shots-track'), bar: row.querySelector('.shots-bar'),
      pct: row.querySelector('.shots-pct'), fin: row.querySelector('.shots-fin'),
    }));
    const headL = card.querySelector('.shots-hd-l');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastDone = '', lastPct = rows.map(() => '');

    return {
      nodes: [say, gen, card],
      marks: [[T.r, say], [T.label, gen], [T.card, card]],
      render(t) {
        const n = streamCount(sayTxt, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = sayTxt.slice(0, n); hid.textContent = sayTxt.slice(n); shown = n; }

        // the "Rendering N shots" chip: lands with the ask and stays, its label turning to the rendered line as the
        // last clip finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        gen.style.opacity = li.toFixed(3);
        const lab = t >= T.chipOut ? `${N} shots rendered` : `Rendering ${N} shots`;
        if (lab !== genLab) { genLab = lab; genT.textContent = lab; }
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the queue card rises in as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let done = 0;
        rows.forEach((r, i) => {
          const a = start[i], b = doneT[i];
          const p = seg(t, a, b), e = outCubic(p);
          const landed = t >= b;
          if (landed) done++;

          // the thumbnail: dark, blurred and desaturated while it renders, alive the moment it lands
          r.img.style.filter = e >= 1 ? 'none'
            : `brightness(${lerp(0.4, 1, e).toFixed(3)}) saturate(${lerp(0.3, 1, e).toFixed(3)}) blur(${((1 - e) * 7).toFixed(2)}px)`;
          r.img.style.opacity = lerp(0.4, 1, e).toFixed(3);
          // ken burns: a slow push that keeps travelling after the clip lands, so a rendered row reads as moving
          const k = seg(t, a, a + dur + DRIFT);
          const dir = i % 2 ? -1 : 1;
          r.img.style.transform = `translate(${(lerp(-2.6, 2.6, k) * dir).toFixed(2)}px, ${lerp(1.2, -1.2, k).toFixed(2)}px) scale(${lerp(1.03, 1.11, k).toFixed(4)})`;

          // the light band that sweeps the thumbnail once, while it resolves
          const bp = seg(t, a, a + SWEEP);
          r.band.style.transform = `translateX(${lerp(-115, 115, bp).toFixed(1)}%)`;
          r.band.style.opacity = (bp >= 1 ? 0 : 1 - seg(bp, 0.72, 1)).toFixed(3);

          // the bar fills and the percentage counts up; the instant the shot lands the percentage swaps to a check
          const pc = Math.min(99, Math.floor(p * 100)) + '%';
          if (lastPct[i] !== pc) { r.pct.textContent = pc; lastPct[i] = pc; }
          r.bar.style.width = (p * 100).toFixed(1) + '%';
          r.track.classList.toggle('shots-on', landed);
          const fo = outCubic(seg(t, b, b + 0.28));
          r.pct.style.opacity = (1 - fo).toFixed(3);
          r.fin.style.opacity = fo.toFixed(3);
          r.fin.style.transform = `translateY(${((1 - fo) * 3).toFixed(2)}px)`;
        });

        // the card's own count, so the queue reads as a live job list
        const dl = `${done} of ${N} done`;
        if (lastDone !== dl) { headL.textContent = dl; lastDone = dl; }
      },
    };
  },
};