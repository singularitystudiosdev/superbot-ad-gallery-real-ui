// Render beat: Nano Banana Pro renders thumbnails at 1280 x 720 from Gemini's frames. opts.round picks the round.
// Round 1: A (split screen, "$40 vs $400"), B (Sam with both webcams, "$40 WINS?") and C (the two price tags).
// Round 2: B carried over as the champion (already sharp, its 47.3% on a chip), then B2 and B3 render beside it in
// the same frame. Each new tile resolves the way an image model's preview does: noise and blur clearing, a sweep of
// light across it, then its letter and caption. While it renders the camera pushes in on the card (chat.js FOCUS) so
// the thumbnails read at full size. The images are img/thumbs/*.jpg (img/CREDITS.txt). Pure function of t.
import { lerp, seg, outCubic, inOutCubic } from '../../../lib.js';
import { THUMBS, ROUNDS } from './studio-data.js?v=42953f43';

const COPY = {
  1: { say: 'Rendering 3 thumbnails at 1280 × 720 from those frames.', head: '3 thumbnails', done: 'A, B and C ready for Test & compare' },
  2: { say: 'Rendering B2 and B3 next to the champion B, same 1280 × 720 frame.', head: 'B2 and B3 next to B', done: 'Round 2 ready: B vs B2 vs B3' },
};
const CPS = 100;
const SAY_AT = 0.048;
const CARD = 0.144;
const RISE = 0.36;
const TILE_AT = 0.3;                   // the card landing to the first tile starting to resolve
const STAGGER = 0.28;                  // one tile to the next
const RES = 0.95; /* deliberate */     // a tile resolving from noise to the finished thumbnail
const FOOT_AT = 0.1;
const FOOT_IN = 0.24;
const READ = 0.8; /* deliberate */     // the finished set holds, readable and pushed in, before the camera pulls back
const FOCUS_IN = 0.5, FOCUS_OUT = 0.5;

export default {
  times(r, opts = {}) {
    const round = opts.round || 1;
    const T = { r, round };
    const ids = ROUNDS[round].ids;
    T.card = r + CARD;
    // round 2's champion B is there from the start; only the new tiles resolve
    const fresh = ids.map((id, i) => !(round === 2 && i === 0));
    let n = 0;
    T.tile = ids.map((_, i) => (fresh[i] ? T.card + TILE_AT + (n++) * STAGGER : T.card));
    T.fresh = fresh;
    const last = Math.max(...T.tile) + RES;
    T.foot = last + FOOT_AT;
    T.end = T.foot + FOOT_IN + READ;
    if (opts.zoom) T.focus = { sw: T.card + 0.1, landed: T.card + 0.1 + FOCUS_IN, pull: T.end - FOCUS_OUT, back: T.end, fill: 0.94 };
    return T;
  },
  build(k, x) {
    const T = k.T;
    const R = ROUNDS[T.round], C = COPY[T.round];
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(C.say)}</span></div>`);
    const card = x.el(`<div class="rn-card">
      <div class="rn-hd"><span class="rn-round">Round ${T.round}</span><b>${x.esc(C.head)}</b><span class="rn-size">1280 × 720</span>
        <span class="rn-st"><i class="rn-spin"></i>${x.OK}</span></div>
      <div class="rn-grid">${R.ids.map((id, i) => {
        const [letter, what, f] = THUMBS[id];
        const champ = T.round === 2 && i === 0;
        return `<div class="rn-tile${champ ? ' rn-champ' : ''}">
          <span class="rn-im"><img src="${x.img(f)}" width="1280" height="720" alt=""/><i class="rn-noise"></i><i class="rn-sweep"></i>
            <i class="rn-letter">${letter}</i>${champ ? `<i class="rn-chip">Round 1 winner · ${ROUNDS[1].share[ROUNDS[1].win]}%</i>` : ''}</span>
          <span class="rn-cap"><b>${letter}</b>${x.esc(what)}</span></div>`;
      }).join('')}</div>
      <div class="rn-ft">${x.OK}<span>${x.esc(C.done)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.rn-spin'), ok: $('.rn-st .qc-ok') };
    const tiles = [...card.querySelectorAll('.rn-tile')].map((n) => ({
      n, img: n.querySelector('img'), noise: n.querySelector('.rn-noise'), sweep: n.querySelector('.rn-sweep'),
      letter: n.querySelector('.rn-letter'), cap: n.querySelector('.rn-cap'),
    }));
    const ft = $('.rn-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const last = Math.max(...T.tile) + RES;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      focus: T.focus ? card : null,
      render(t) {
        const ns = Math.max(0, Math.min(C.say.length, Math.floor((t - T.r - SAY_AT) * CPS)));
        if (ns !== shown) { vis.textContent = C.say.slice(0, ns); hid.textContent = C.say.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const d = outCubic(seg(t, last, last + 0.2));
        st.spin.style.opacity = (1 - seg(t, last - 0.08, last + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        tiles.forEach((tl, i) => {
          if (!T.fresh[i]) { tl.noise.style.opacity = '0'; tl.sweep.style.opacity = '0'; tl.letter.style.opacity = '1'; tl.cap.style.opacity = '1'; return; }
          const a = T.tile[i];
          const p = inOutCubic(seg(t, a, a + RES));
          // noise -> image: the noise layer thins out while the image comes up out of a heavy blur
          tl.noise.style.opacity = (t < a ? 1 : 1 - p).toFixed(3);
          tl.img.style.filter = p >= 1 ? 'none' : `blur(${lerp(18, 0, p).toFixed(2)}px) saturate(${lerp(0.4, 1, p).toFixed(3)})`;
          tl.img.style.opacity = lerp(0.25, 1, outCubic(seg(t, a, a + RES * 0.6))).toFixed(3);
          const sw = seg(t, a + RES * 0.55, a + RES + 0.2);
          tl.sweep.style.opacity = (sw > 0 && sw < 1 ? Math.sin(Math.PI * sw) : 0).toFixed(3);
          tl.sweep.style.transform = `translateX(${lerp(-120, 220, sw).toFixed(1)}%)`;
          const lo = outCubic(seg(t, a + RES - 0.15, a + RES + 0.15));
          tl.letter.style.opacity = lo.toFixed(3);
          tl.letter.style.transform = `scale(${lerp(0.6, 1, lo).toFixed(4)})`;
          tl.cap.style.opacity = lo.toFixed(3);
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
