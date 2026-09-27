// Gemini beat: Gemini paints the showreel's style frames. Its line streams, the "Painting 6 style frames" chip lands and
// its graph editor loops, then a contact sheet rises: six 16:9 boards from @shneural's clip (img/sr/frame-1..6, four
// from the Opus 5.5 Max reel, two from the GPT 6 Astra Max reel; see img/sr/CREDITS.txt) in a 3x2 grid. Each board
// arrives with a different motion graphics transition, named in a tiny mono tag under it:
//   wipe        a mask wipe left to right behind a signal orange leading edge that smears with its speed
//   push        the board shoves a cobalt slug out of the slot, both layers carrying horizontal motion blur
//   clock wipe  a polygon mask swept clockwise from twelve behind a hand and a trailing conic smear
//   circle wipe a circle mask opening from the centre (outExpo) with a keyline ring riding its edge
//   split       the two halves arrive from opposite edges (left half from the top, right half from the bottom)
//   slide       the whole board rises from below on a back-out bezier, overshooting its mark and settling
// Every ease is a cubic-bezier (the same curves a graph editor draws). Under each board a hairline timeline runs from
// an in keyframe to an out keyframe; its playhead crosses it over the transition, and the out diamond pops and fills
// when the board lands (signal orange on the Opus boards, acid lime on the GPT boards) as the frame number lights.
// The chip resolves to "Painted 6 style frames".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Painting the style frames: two looks, six boards.';
const W = 16, H = 9;   // the boards' aspect: the clip is 1920x1080, the stills 480x270
const FPS = 60;        // velocity for motion blur is measured over one frame at the clip's 60 fps
const STAGGER = 0.15;
const GRID = '<svg class="art-glyph" viewBox="0 0 24 24"><rect x="2" y="6.5" width="6" height="4.5" rx=".8"/><rect x="9" y="6.5" width="6" height="4.5" rx=".8"/><rect x="16" y="6.5" width="6" height="4.5" rx=".8"/><rect x="2" y="13" width="6" height="4.5" rx=".8"/><rect x="9" y="13" width="6" height="4.5" rx=".8"/><rect x="16" y="13" width="6" height="4.5" rx=".8"/></svg>';

// palette sampled from the clip: signal orange, cobalt (Opus half), acid lime (GPT half)
const ORANGE = [252, 89, 31], LIME = [201, 251, 30];
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c.join(',')})` : `rgba(${c.join(',')},${Math.max(0, a).toFixed(3)})`);

// cubic-bezier(x1, y1, x2, y2) as an easing of progress u, solved by bisection on x (x1, x2 in [0, 1] keep x monotonic);
// y1 or y2 past 1 overshoots, exactly as in a CSS transition or an After Effects value graph
function bezier(x1, y1, x2, y2) {
  const cb = (a, b, s) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
  return (u) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 28; i++) { const s = (lo + hi) / 2; if (cb(x1, x2, s) < u) lo = s; else hi = s; }
    return cb(y1, y2, (lo + hi) / 2);
  };
}

// the six boards in reading order. fx: the transition (also its tag). ease: its curve. dur: seconds. gpt: the GPT half's
// look (lime accent), else the Opus half's (orange)
const BOARDS = [
  { src: 'sr/frame-1.jpg', alt: 'Style frame 01: EVERY, black underlined type on signal orange', fx: 'wipe', ease: bezier(0.76, 0, 0.24, 1), dur: 0.5 },
  { src: 'sr/frame-2.jpg', alt: 'Style frame 02: CODE glitching with RGB fringing', fx: 'push', ease: bezier(0.83, 0, 0.17, 1), dur: 0.55 },
  { src: 'sr/frame-3.jpg', alt: 'Style frame 03: MOTION on an orange centre band', fx: 'clock wipe', ease: bezier(0.45, 0, 0.2, 1), dur: 0.6 },
  { src: 'sr/frame-4.jpg', alt: 'Style frame 04: the CLAUDE. end card', fx: 'circle wipe', ease: bezier(0.16, 1, 0.3, 1), dur: 0.55 },
  { src: 'sr/frame-5.jpg', alt: 'Style frame 05: TYPE IN MOTION. on acid lime', fx: 'split', ease: bezier(0.83, 0, 0.17, 1), dur: 0.55, gpt: true },
  { src: 'sr/frame-6.jpg', alt: 'Style frame 06: HIT THE BEAT. on cream', fx: 'slide', ease: bezier(0.34, 1.56, 0.64, 1), dur: 0.55, gpt: true },
];

const pct = (v) => `${v.toFixed(3)}%`;

// clock wipe: the fan polygon swept clockwise from twelve through angle a (degrees), measured in the board's own 16:9
// space so the mask edge meets the rotated hand exactly. Corners are listed in sweep order (60.6, 119.4, 240.6, 299.4).
const CORNERS = [[W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2], [-W / 2, -H / 2]].map(([dx, dy]) => ({
  a: ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360,
  at: `${pct(50 + (dx / W) * 100)} ${pct(50 + (dy / H) * 100)}`,
}));
function sweep(a) {
  const r = (a * Math.PI) / 180, dx = Math.sin(r), dy = -Math.cos(r);
  const s = Math.min(Math.abs(dx) > 1e-9 ? W / 2 / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-9 ? H / 2 / Math.abs(dy) : Infinity);
  const tip = `${pct(50 + ((s * dx) / W) * 100)} ${pct(50 + ((s * dy) / H) * 100)}`;
  return `polygon(50% 50%, 50% 0%, ${CORNERS.filter((c) => c.a < a).map((c) => `${c.at}, `).join('')}${tip})`;
}
// circle wipe: circle() percentages resolve against sqrt(w^2 + h^2) / sqrt(2), so the half diagonal (full cover) is 70.71%
const CIRCLE = 70.72;

// the layers each transition needs inside the board window, over the empty slot's guides
const LAYERS = {
  wipe: (img) => `<div class="art-pic">${img}</div><i class="art-edge"></i>`,
  push: (img) => '<div class="art-slate"></div>' + `<div class="art-pic">${img}</div>`,
  'clock wipe': (img) => `<div class="art-pic">${img}</div><i class="art-sweep"></i><i class="art-hand"></i>`,
  'circle wipe': (img) => `<div class="art-pic">${img}</div><i class="art-ring"></i>`,
  split: (img) => `<div class="art-pic art-half art-ha">${img}</div><div class="art-pic art-half art-hb">${img}</div><i class="art-seam"></i>`,
  slide: (img) => `<div class="art-pic">${img}<i class="art-bleed"></i></div>`,
};

let UID = 0;   // filter ids only need to be unique per build; the counter changes nothing that is drawn

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.36;
    T.tile = BOARDS.map((_, i) => r + 0.5 + i * STAGGER);
    T.land = BOARDS.map((b, i) => T.tile[i] + b.dur);
    T.done = Math.max(...T.land);
    T.end = T.done + 0.34;   // the last diamond pops at T.done and settles by T.done + 0.26, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const uid = `art-mb-${++UID}`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Painting 6 style frames</span></div></div>');
    const card = x.el(`<div class="art-sheet">
      <svg class="art-defs" aria-hidden="true"><defs>${BOARDS.map((_, i) => `<filter id="${uid}-${i}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>`).join('')}</defs></svg>
      <div class="art-hd"><i class="art-ic">${GRID}</i><b>Showreel: style frames</b><small>6 boards, 16:9</small></div>
      <div class="art-grid">${BOARDS.map((b, i) => {
        const img = `<img src="${x.img(b.src)}" alt="${x.esc(b.alt)}" draggable="false">`;
        return `<div class="art-cell${b.gpt ? ' art-gpt' : ''}">
          <div class="art-win"><i class="art-guide"></i>${LAYERS[b.fx](img)}<i class="art-rim"></i></div>
          <div class="art-cap"><span class="art-no">${String(i + 1).padStart(2, '0')}</span><span class="art-fx">${x.esc(b.fx)}</span>`
          + '<span class="art-trk"><i class="art-kin"></i><i class="art-prog"></i><i class="art-ph"></i><i class="art-kf"></i></span></div>'
          + '</div>';
      }).join('')}</div>
    </div>`);
    const blurs = [...card.querySelectorAll('.art-defs feGaussianBlur')];
    const cells = [...card.querySelectorAll('.art-cell')].map((cell, i) => ({
      cell,
      b: BOARDS[i],
      acc: BOARDS[i].gpt ? LIME : ORANGE,
      win: cell.querySelector('.art-win'),
      pics: [...cell.querySelectorAll('.art-pic')],
      slate: cell.querySelector('.art-slate'),
      edge: cell.querySelector('.art-edge'),
      hand: cell.querySelector('.art-hand'),
      sweepEl: cell.querySelector('.art-sweep'),
      ring: cell.querySelector('.art-ring'),
      seam: cell.querySelector('.art-seam'),
      rim: cell.querySelector('.art-rim'),
      no: cell.querySelector('.art-no'),
      prog: cell.querySelector('.art-prog'),
      ph: cell.querySelector('.art-ph'),
      kf: cell.querySelector('.art-kf'),
      blur: blurs[i],
      filter: `url(#${uid}-${i})`,
    }));
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    // directional motion blur from a layer's speed: v is the travel over the last 1/60 s as a fraction of the board's
    // width (horizontal) or height (vertical), converted to px on the laid out board
    const motionBlur = (c, v, horiz, els) => {
      const px = Math.abs(v) * (horiz ? c.win.offsetWidth : c.win.offsetHeight);
      const s = Math.min(4.5, px * 0.42);
      const on = s > 0.12, d = on ? s.toFixed(2) : '0';
      c.blur.setAttribute('stdDeviation', horiz ? `${d} 0` : `0 ${d}`);
      els.forEach((el) => { el.style.filter = on ? c.filter : 'none'; });
    };

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the painting chip: lands, its graph editor loops, then resolves once the last board has landed
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Painted 6 style frames' : 'Painting 6 style frames';
        if (lab.textContent !== cl) lab.textContent = cl;

        // the sheet rises as one card
        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        cells.forEach((c, i) => {
          const { b, acc, pics } = c;
          const t0 = T.tile[i], t1 = T.land[i];
          const p = seg(t, t0, t1), e = b.ease(p);
          const e1 = b.ease(seg(t - 1 / FPS, t0, t1));   // the same pose one frame earlier, for speed
          const live = p > 0 && p < 1, landed = t >= t1;
          c.cell.classList.toggle('art-live', live);
          c.cell.classList.toggle('art-landed', landed);
          pics.forEach((el) => { el.style.visibility = p > 0 ? 'visible' : 'hidden'; });

          if (b.fx === 'wipe') {
            // a mask wipe: the board is uncovered left to right; its leading edge smears back over what it just crossed
            pics[0].style.clipPath = landed ? 'none' : `inset(0 ${pct((1 - e) * 100)} 0 0)`;
            c.edge.style.left = pct(e * 100);
            c.edge.style.opacity = live ? (1 - seg(p, 0.86, 1)).toFixed(3) : '0';
            c.edge.style.setProperty('--tr', `${Math.min(34, Math.abs(e - e1) * c.win.offsetWidth * 2.2).toFixed(2)}px`);
          } else if (b.fx === 'push') {
            // a push: the board enters from the right and shoves the cobalt slug out to the left, one rigid move
            pics[0].style.transform = landed ? 'none' : `translateX(${pct((1 - e) * 100)})`;
            c.slate.style.transform = `translateX(${pct(-e * 100)})`;
            c.slate.style.visibility = landed ? 'hidden' : 'visible';
            motionBlur(c, live ? e - e1 : 0, true, [pics[0], c.slate]);
          } else if (b.fx === 'clock wipe') {
            // a clock wipe: a fan mask sweeps clockwise from twelve; a hand rides its edge, a conic smear trails it
            const a = e * 360;
            pics[0].style.clipPath = landed ? 'none' : p > 0 ? sweep(a) : 'inset(50%)';
            const vis2 = live ? (1 - seg(p, 0.88, 1)).toFixed(3) : '0';
            c.hand.style.opacity = vis2;
            c.hand.style.transform = `rotate(${a.toFixed(2)}deg)`;
            const tr = Math.min(70, Math.max(6, (e - e1) * 360 * 5));   // trail length in degrees, from the sweep speed
            c.sweepEl.style.opacity = vis2;
            c.sweepEl.style.background = `conic-gradient(from ${(a - tr).toFixed(2)}deg at 50% 50%, ${rgb(acc, 0)} 0deg, ${rgb(acc, 0.34)} ${tr.toFixed(2)}deg, ${rgb(acc, 0)} ${tr.toFixed(2)}deg)`;
          } else if (b.fx === 'circle wipe') {
            // a circle wipe: a circle mask opens from the centre on outExpo, a keyline ring riding its edge
            pics[0].style.clipPath = landed ? 'none' : `circle(${pct(e * CIRCLE)} at 50% 50%)`;
            c.ring.style.transform = `translate(-50%, -50%) scale(${Math.max(0.001, e).toFixed(4)})`;
            c.ring.style.opacity = live ? (1 - seg(p, 0.5, 0.95)).toFixed(3) : '0';
          } else if (b.fx === 'split') {
            // a split: the left half drops in from the top, the right half rises from the bottom, meeting on the seam
            const y = (1 - e) * 100;
            pics[0].style.transform = landed ? 'none' : `translateY(${pct(-y)})`;
            pics[1].style.transform = landed ? 'none' : `translateY(${pct(y)})`;
            c.seam.style.opacity = live ? (seg(p, 0.05, 0.3) * (1 - seg(p, 0.8, 1))).toFixed(3) : '0';
            motionBlur(c, live ? e - e1 : 0, false, pics);
          } else {
            // a slide: the board rises from below on a back-out bezier, overshoots its mark (the cream bleed under it
            // keeps the window full) and settles
            pics[0].style.transform = landed ? 'none' : `translateY(${pct((1 - e) * 100)})`;
            motionBlur(c, live ? e - e1 : 0, false, pics);
          }

          // the landing: the board's rim flashes its accent and relaxes to a paper keyline
          const fl = landed ? 1 - seg(t, t1, t1 + 0.45) : 0;
          c.rim.style.boxShadow = fl > 0.01
            ? `inset 0 0 0 1px ${rgb(acc, 0.35 + 0.65 * fl)}, inset 0 0 ${(9 * fl).toFixed(2)}px ${rgb(acc, 0.45 * fl)}`
            : '';

          // the timeline under the board: its playhead crosses from the in key to the out key over the transition;
          // the out diamond pops (outBack) and fills with the accent on landing
          c.prog.style.width = `calc((100% - 7px) * ${p.toFixed(4)})`;
          c.ph.style.left = `calc(3px + (100% - 7px) * ${p.toFixed(4)})`;
          c.ph.style.opacity = live ? '1' : '0';
          if (landed) {
            const pop = outBack(seg(t, t1, t1 + 0.26));
            const glow = 1 - seg(t, t1, t1 + 0.5);
            c.kf.style.transform = `rotate(45deg) scale(${lerp(1.7, 1, pop).toFixed(3)})`;
            c.kf.style.backgroundColor = rgb(acc);
            c.kf.style.boxShadow = `0 0 0 1px #0c0b0e${glow > 0.01 ? `, 0 0 ${(7 * glow).toFixed(2)}px ${rgb(acc, 0.8 * glow)}` : ''}`;
            c.no.style.color = rgb(acc);
          } else {
            c.kf.style.transform = 'rotate(45deg)';
            c.kf.style.backgroundColor = '';
            c.kf.style.boxShadow = '';
            c.no.style.color = '';
          }
        });
      },
    };
  },
};
