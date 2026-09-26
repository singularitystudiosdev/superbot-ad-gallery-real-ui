// Preview beat: the animation comes back as a result card, not as text. The header names what was built and the
// spinner beside it hands over to a green check, the big 16:9 pane plays the spot (the style frames cut as the
// playhead walks it, the scrub bar and timecode run 0:00 -> 0:15), the five scene files tick in underneath and the
// footer carries the render meta.
// Pure function of t: every moving value is written from t, so ?t= freezes a frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'On it. Live preview is running.';
const BUILT = 'Built the animation';
const FPS = 60;
const SPAN = 15;   // the spot is 15 seconds long: the timecode walks the whole 0:00 -> 0:15
// the five files the spot is built from: the scene list ticking in under the pane, one chip each
const SCENES = ['KineticType.tsx', 'DotField.tsx', 'WireCube.tsx', 'TypeRing.tsx', 'Logo.tsx'];
const FOOT = `${SCENES.length} scenes · ${FPS} fps`;
const SHOTS = ['mg/frame-1.jpg', 'mg/frame-2.jpg', 'mg/frame-3.jpg', 'mg/frame-4.jpg'];
const CHECK = '<svg class="pv-ck" viewBox="0 0 24 24"><path class="pv-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.26;   // the result card lands
    T.play = r + 0.40;   // the preview starts playing ...
    T.span = r + 2.52;   // ... and its playhead reaches the end of the 0:15 spot
    T.file = SCENES.map((_, i) => r + 0.85 + i * 0.34); // the scene files tick in, one after another
    T.done = r + 2.5;    // the header's spinner becomes the green check
    T.end = r + 2.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pv-card">
      <div class="pv-head">
        <span class="pv-ttl">${x.tile(k.app)}<b>${x.esc(BUILT)}</b></span>
        <span class="pv-st"><i class="pv-spin"></i>${CHECK}</span>
      </div>
      <div class="pv-prev">
        ${SHOTS.map((src, i) => `<img class="pv-frame" src="${x.img(src)}" alt="preview frame ${i + 1}"/>`).join('')}
        <span class="pv-badge">Preview · ${FPS} fps</span>
        <span class="pv-live"><i class="pv-dot"></i>LIVE</span>
        <span class="pv-tc"><b class="pv-tcn">0:00</b><em class="pv-tct">/ 0:${SPAN}</em></span>
        <div class="pv-scrub"><i class="pv-fill"></i><i class="pv-knob"></i></div>
      </div>
      <div class="pv-files">${SCENES.map((n) => `<span class="pv-file"><i class="pv-tick"></i><span>${x.esc(n)}</span></span>`).join('')}</div>
      <div class="pv-foot">${x.esc(FOOT)}</div>
    </div>`);
    const frames = [...card.querySelectorAll('.pv-frame')];
    const spin = card.querySelector('.pv-spin');
    const ck = card.querySelector('.pv-ck');
    const ckp = card.querySelector('.pv-ck-p');
    const live = card.querySelector('.pv-dot');
    const tcn = card.querySelector('.pv-tcn');
    const fill = card.querySelector('.pv-fill');
    const knob = card.querySelector('.pv-knob');
    const chips = [...card.querySelectorAll('.pv-file')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastTc = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the header: the spinner turns while the build is coming back, then the green check draws over it
        const d = outCubic(seg(t, T.done, T.done + 0.22));
        spin.style.opacity = (1 - d).toFixed(3);
        spin.style.transform = d >= 1 ? '' : `rotate(${(((t - T.card) * 450) % 360).toFixed(1)}deg)`;
        ck.style.opacity = seg(t, T.done - 0.04, T.done + 0.02).toFixed(3);
        ckp.style.strokeDashoffset = (23 * (1 - d)).toFixed(2);

        // the pane plays the spot: the style frames cut on each quarter of the playback and the timecode and the
        // scrub bar walk 0:00 -> 0:15 across it
        const p = seg(t, T.play, T.span);
        frames.forEach((img, i) => {
          const a = i / SHOTS.length, b = (i + 1) / SHOTS.length, e = 0.04;
          const o = i === 0 ? 1 - seg(p, b - e, b + e)
            : i === frames.length - 1 ? seg(p, a - e, a + e)
              : seg(p, a - e, a + e) * (1 - seg(p, b - e, b + e));
          img.style.opacity = o.toFixed(3);
        });
        const tc = `0:${String(Math.round(SPAN * p)).padStart(2, '0')}`;
        if (tc !== lastTc) { tcn.textContent = tc; lastTc = tc; }
        const w = `${(p * 100).toFixed(1)}%`;
        fill.style.width = w;
        knob.style.left = w;
        // the LIVE lamp breathes off t
        live.style.opacity = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 7))).toFixed(3);

        // the scene files tick in under the pane, each popping in and taking its tick
        chips.forEach((chip, i) => {
          const a = T.file[i];
          const q = seg(t, a, a + 0.3);
          if (q <= 0) {
            chip.style.opacity = '0';
            chip.style.transform = 'translateY(7px) scale(0.86)';
            chip.classList.remove('pv-on');
            return;
          }
          const e = outBack(q);
          chip.style.opacity = outCubic(q).toFixed(3);
          chip.style.transform = q >= 1 ? '' : `translateY(${((1 - e) * 7).toFixed(2)}px) scale(${lerp(0.86, 1, e).toFixed(4)})`;
          chip.classList.toggle('pv-on', q >= 1);
        });
      },
    };
  },
};