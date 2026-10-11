// superbot-fast, the second ask: a caption for the best of the 12 photos. A status chip looks through the 12, then the
// chosen photo lands as a large card (Pena Palace, Sintra, with its new file name and a "Best of 12" tag), its one-line
// caption streams in under it and three hashtag chips pop in. Pure function of t. Photo and caption: ./data.js, img/CREDITS.txt.
import { seg, outCubic, rise, sayLine, statusChip, ICONS } from './util.js';
import { FILES, BEST, CAPTION, TAGS } from './data.js';
import { outBack } from '../../../lib.js';

const SAY = 'Best one is the Sintra shot. Here is a caption for it:';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.75;
    T.say = T.chipDone + 0.05;
    T.card = T.chipDone + 0.15;
    T.cap = T.card + 0.5;
    T.tag = [0, 1, 2].map((i) => T.cap + 0.95 + i * 0.16);
    T.end = T.tag[2] + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Looking through the photos', `Picked 1 of ${FILES.length}`, true);
    const cap = sayLine(x, CAPTION, 'ca-line');
    const tags = TAGS.map((tg) => x.el(`<span class="ca-tag">${x.esc(tg)}</span>`));
    const card = x.el(`<div class="ca-card">
      <div class="ca-ph"><img src="${x.img(BEST.img + '.jpg')}" alt="${x.esc(BEST.place)}"/><span class="ca-best"><i>${ICONS.star}</i>Best of ${FILES.length}</span><span class="ca-fn">${ICONS.img}${x.esc(BEST.to)}</span></div>
      <div class="ca-body"><div class="ca-cap"></div><div class="ca-tags"></div><div class="ca-f"><span>Caption</span><em>1 line, 3 tags</em></div></div>
    </div>`);
    card.querySelector('.ca-cap').appendChild(cap.node);
    const tbox = card.querySelector('.ca-tags');
    tags.forEach((n) => tbox.appendChild(n));
    const best = card.querySelector('.ca-best');
    return {
      nodes: [chip.node, say.node, card],
      marks: [[T.chip, chip.node], [T.card, card], [T.tag[2], tbox]],
      render(t) {
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(FILES.length * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} of ${FILES.length}`);
        say.update(t, T.say, 75);
        const p = seg(t, T.card, T.card + 0.5);
        const e = outCubic(p);
        card.style.opacity = e.toFixed(3);
        card.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const img = card.firstElementChild.firstElementChild;
        img.style.transform = p >= 1 ? '' : `scale(${(1.1 - 0.1 * e).toFixed(4)})`;
        best.style.transform = `scale(${(0.7 + 0.3 * outBack(seg(t, T.card + 0.15, T.card + 0.5))).toFixed(3)})`;
        best.style.opacity = outCubic(seg(t, T.card + 0.15, T.card + 0.4)).toFixed(3);
        cap.update(t, T.cap, 62);
        tags.forEach((n, i) => {
          const f = seg(t, T.tag[i], T.tag[i] + 0.35);
          n.style.opacity = outCubic(Math.min(1, f * 1.6)).toFixed(3);
          n.style.transform = `scale(${(0.6 + 0.4 * outBack(f)).toFixed(3)})`;
        });
      },
    };
  },
};
