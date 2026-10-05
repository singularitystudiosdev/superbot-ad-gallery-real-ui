// Gemini watches the attached 0:08 clip: it plays in a player card (three stills of the phone video, pushed in and
// hand-held), the scrubber runs and Gemini pins three frames on it (0:02 the crack at the jar base, 0:04 the leak on
// the counter, 0:06 the motor still running), outlining each spot on the frame and labelling it under its marker.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { CLIP, MARKS, VERDICT } from './returns.js';
import { PLAY } from './clip.js';

const SAY = VERDICT;
const SPEED = 1.7;                 // clip seconds per second of ad: the 0:08 clip plays in 4.7 s
// which still is on screen across the clip, and where each one pushes in (origin = the marked spot's centre)
const FRAMES = [
  { f: 'clip1.jpg', from: 0, to: 2.9, s0: 1.0, s1: 1.7, mk: 0 },
  { f: 'clip2.jpg', from: 2.9, to: 5.0, s0: 1.03, s1: 1.1, mk: 1 },
  { f: 'clip3.jpg', from: 5.0, to: 8.01, s0: 1.08, s1: 1.42, mk: 2, buzz: true },
];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.35;
    T.p0 = T.card + 0.5;
    T.p1 = T.p0 + CLIP.dur / SPEED;
    T.mk = MARKS.map((m) => T.p0 + m.at / SPEED);
    T.end = T.p1 + 0.75;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="gw-card">
      <div class="gw-vid">
        ${FRAMES.map((f) => { const b = MARKS[f.mk].box; return `<div class="gw-fr" style="transform-origin:${b[0] + b[2] / 2}% ${b[1] + b[3] / 2}%"><img src="${x.img(f.f)}" alt=""/><i class="gw-box" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"></i></div>`; }).join('')}
        <span class="gw-file"><img src="${x.brand('gemini-logo.svg')}" alt=""/>${x.esc(CLIP.file)}</span>
        <span class="gw-tc">0:00 / ${CLIP.len}</span>
        <i class="gw-play">${PLAY}</i>
      </div>
      <div class="gw-scrub">
        <div class="gw-track"><i class="gw-fill"></i>${MARKS.map((m) => `<span class="gw-mk" style="left:${(m.at / CLIP.dur) * 100}%"><i></i></span>`).join('')}<i class="gw-head"></i></div>
      </div>
      <div class="gw-tags">${MARKS.map((m) => `<span class="gw-tag" style="left:${(m.at / CLIP.dur) * 100}%"><b>${m.ts}</b>${x.esc(m.label)}</span>`).join('')}</div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const frs = $$('.gw-fr'), boxes = $$('.gw-box'), tc = $('.gw-tc'), play = $('.gw-play');
    const fill = $('.gw-fill'), head = $('.gw-head'), mks = $$('.gw-mk'), tags = $$('.gw-tag');
    let shown = -1, tcT = '';
    const scales = FRAMES.map(() => 1);
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the clip's own clock, and a phone held in a hand: a slow sway, plus the motor's buzz on the last frame
        const tau = Math.max(0, Math.min(CLIP.dur, (t - T.p0) * SPEED));
        const swayX = Math.sin(tau * 1.3) * 3 + Math.sin(tau * 3.1) * 1.2, swayY = Math.cos(tau * 1.1) * 2.2;
        frs.forEach((fr, i) => {
          const f = FRAMES[i];
          const a = i === 0 ? 1 : seg(tau, f.from - 0.12, f.from + 0.12);
          const b = i === FRAMES.length - 1 ? 0 : seg(tau, f.to - 0.12, f.to + 0.12);
          fr.style.opacity = (a * (1 - b)).toFixed(3);
          const p = seg(tau, f.from, Math.min(f.to, f.from + 2.2));
          const sc = lerp(f.s0, f.s1, outCubic(p));
          scales[i] = sc;
          const bz = f.buzz && tau > f.from ? Math.sin(t * 97) * 1.1 : 0;
          fr.style.transform = `translate(${(swayX + bz).toFixed(2)}px, ${(swayY + bz * 0.6).toFixed(2)}px) scale(${sc.toFixed(4)})`;
        });
        const tcN = `0:0${Math.min(8, Math.floor(tau))} / ${CLIP.len}`;
        if (tcN !== tcT) { tc.textContent = tcN; tcT = tcN; }
        const pl = seg(t, T.p0 - 0.15, T.p0 + 0.1);
        play.style.opacity = (outCubic(seg(t, T.card + 0.1, T.card + 0.35)) * (1 - pl)).toFixed(3);
        play.style.transform = `translate(-50%, -50%) scale(${lerp(1, 1.35, pl).toFixed(3)})`;

        const pr = tau / CLIP.dur;
        fill.style.transform = `scaleX(${pr.toFixed(4)})`;
        head.style.left = `${(pr * 100).toFixed(3)}%`;
        MARKS.forEach((m, i) => {
          const a = T.mk[i];
          const on = seg(t, a - 0.02, a + 0.22);
          mks[i].classList.toggle('on', t >= a);
          mks[i].style.transform = `translate(-50%, -50%) scale(${(1 + 0.6 * Math.sin(Math.PI * on)).toFixed(3)})`;
          const tg = seg(t, a, a + 0.32);
          tags[i].style.opacity = outCubic(tg).toFixed(3);
          tags[i].style.transform = `translate(-50%, ${((1 - outCubic(tg)) * 8).toFixed(2)}px)`;
          const bx = seg(t, a - 0.04, a + 0.3);
          boxes[i].style.opacity = outCubic(bx).toFixed(3);
          boxes[i].style.transform = `scale(${lerp(1.25, 1, outBack(bx)).toFixed(4)})`;
          boxes[i].style.borderWidth = `${(2.2 / scales[i]).toFixed(3)}px`; // stays 2.2px on screen while the frame pushes in
        });
      },
    };
  },
};
