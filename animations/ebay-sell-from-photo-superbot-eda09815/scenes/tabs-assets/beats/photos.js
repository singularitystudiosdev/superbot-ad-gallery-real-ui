// GPT Image 2's answer: the messy desk photo wipes into a clean white-sweep shot (the shutter beat), then that shot
// shrinks into the first cell of a 2x2 grid while the back, top plate and lens shots develop beside it.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { PHOTOS, SHOTS } from './listing.js';

const SAY = '4 clean listing photos on a white sweep.';
const CELL = 150, GAP = 10, FULL = CELL * 2 + GAP;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.2;
    T.w0 = T.card + 0.35;
    T.w1 = T.w0 + 0.6;
    T.sh0 = T.w1 + 0.12;
    T.sh1 = T.sh0 + 0.4;
    T.tiles = [T.sh0 + 0.22, T.sh0 + 0.34, T.sh0 + 0.46];
    T.end = T.sh1 + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const at = (i) => `left:${(i % 2) * (CELL + GAP)}px;top:${Math.floor(i / 2) * (CELL + GAP)}px`;
    const card = x.el(`<div class="eb-shots" style="width:${FULL}px;height:${FULL}px">
      ${SHOTS.slice(1).map((s, i) => `<div class="eb-shot" style="${at(i + 1)}"><img src="${x.img(s.f)}" alt="${x.esc(s.label)}"/><i class="qc-gen"></i><span class="eb-cap">${x.esc(s.label)}</span></div>`).join('')}
      <div class="eb-ba" style="width:${FULL}px;height:${FULL}px">
        <img class="eb-before" src="${x.img(PHOTOS[0].f)}" alt="Desk photo"/>
        <img class="eb-after" src="${x.img(SHOTS[0].f)}" alt="${x.esc(SHOTS[0].label)}"/>
        <i class="eb-flash"></i>
        <i class="eb-wipe"></i>
        <span class="eb-tag eb-tag-b">Before</span><span class="eb-tag eb-tag-a">After</span>
        <span class="eb-cap">${x.esc(SHOTS[0].label)}</span>
      </div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const $ = (s) => card.querySelector(s);
    const ba = $('.eb-ba'), after = $('.eb-after'), wipe = $('.eb-wipe'), flash = $('.eb-flash');
    const tagB = $('.eb-tag-b'), tagA = $('.eb-tag-a'), cap0 = ba.querySelector('.eb-cap');
    const tiles = [...card.querySelectorAll('.eb-shot')];
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = seg(t, T.card, T.card + 0.4);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        // the wipe: after is revealed left to right behind a bright divider
        const w = inOutCubic(seg(t, T.w0, T.w1));
        after.style.clipPath = `inset(0 ${((1 - w) * 100).toFixed(2)}% 0 0)`;
        wipe.style.left = `${(w * 100).toFixed(2)}%`;
        wipe.style.opacity = (w > 0 && w < 1 ? 1 : 0).toString();
        flash.style.opacity = (0.55 * (1 - seg(t, T.w0, T.w0 + 0.18)) * (t >= T.w0 ? 1 : 0)).toFixed(3);
        const tagOut = 1 - seg(t, T.sh0 - 0.05, T.sh0 + 0.12);
        tagB.style.opacity = ((1 - seg(t, T.w1 - 0.25, T.w1)) * seg(t, T.card + 0.1, T.card + 0.3)).toFixed(3);
        tagA.style.opacity = (seg(t, T.w0 + 0.2, T.w0 + 0.4) * tagOut).toFixed(3);
        // the clean front shot settles into the first grid cell
        const s = inOutCubic(seg(t, T.sh0, T.sh1));
        ba.style.transform = s <= 0 ? 'none' : `scale(${lerp(1, CELL / FULL, s).toFixed(4)})`;
        ba.style.borderRadius = `${lerp(14, 10 * FULL / CELL, s).toFixed(1)}px`;
        cap0.style.opacity = seg(t, T.sh1 - 0.1, T.sh1 + 0.15).toFixed(3);
        cap0.style.transform = `scale(${(FULL / CELL).toFixed(4)})`;
        tiles.forEach((tile, i) => {
          const a = T.tiles[i], p = seg(t, a, a + 0.45), e = outCubic(p);
          tile.style.opacity = Math.min(1, seg(t, a, a + 0.15) * 1).toFixed(3);
          const im = tile.firstElementChild, gen = im.nextElementSibling;
          im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 12).toFixed(2)}px)`;
          im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          gen.style.transform = `translateX(${lerp(-110, 110, p).toFixed(1)}%)`;
          gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          tile.lastElementChild.style.opacity = seg(t, a + 0.3, a + 0.5).toFixed(3);
        });
      },
    };
  },
};
