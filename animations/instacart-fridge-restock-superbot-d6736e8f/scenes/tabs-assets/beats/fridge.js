// GPT-6 Astra beat: reads the fridge photo sent with the ask. A scan line passes down the photo, then one labeled box
// pops onto it per item (amber = low, red = out, dashed = an empty spot) while the matching row of the restock list
// lights up beside it, and Astra answers with the count. Photo: img/fridge.jpg, made for this ad (see img/CREDITS.txt).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { ITEMS, PHOTO } from './restock.js';

const SAY = 'Out of 5 things, low on 2. Here is your list.';
const STRIDE = 0.19, POP = 0.2;
const pct = (v) => `${(v * 100).toFixed(2)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08;
    T.scan = [T.card + 0.04, T.card + 0.4];
    T.box = ITEMS.map((_, i) => r + 0.42 + i * STRIDE);
    T.read = T.box[ITEMS.length - 1] + POP;
    T.say = r + 1.72;
    T.end = r + 2.28;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const boxes = ITEMS.map((it) => {
      const [x0, y0, x1, y1] = it.box;
      return `<div class="fr-box fr-${it.st}${it.dash ? ' fr-dash' : ''}" style="left:${pct(x0)};top:${pct(y0)};width:${pct(x1 - x0)};height:${pct(y1 - y0)}"><i class="fr-c fr-c1"></i><i class="fr-c fr-c2"></i><i class="fr-c fr-c3"></i><i class="fr-c fr-c4"></i><span class="fr-tag fr-tag-${it.tag}"><span>${x.esc(it.label)}</span></span></div>`;
    }).join('');
    const card = x.el(`<div class="fr-card">
      <div class="fr-photo"><img src="${x.img('fridge.jpg')}" alt="Fridge photo"/><i class="fr-scan"></i>${boxes}</div>
      <div class="fr-side">
        <div class="fr-hd"><span class="fr-st">Reading photo</span><small>${x.esc(PHOTO.file)}</small></div>
        ${ITEMS.map((it) => `<div class="fr-row"><span class="fr-ck">${x.OK}</span><span class="fr-n"><b>${x.esc(it.name)}</b><small>${x.esc(it.size)}</small></span><span class="fr-tg fr-tg-${it.st}">${it.st.toUpperCase()}</span></div>`).join('')}
        <div class="fr-sum"><span class="fr-sum-out"><b>5</b> out</span><span class="fr-sum-low"><b>2</b> low</span><span class="fr-sum-n">7 items to buy</span></div>
      </div>
    </div>`);
    const say = x.el(`<div class="qc-say fr-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const $$ = (s) => [...card.querySelectorAll(s)];
    const bx = $$('.fr-box'), tags = $$('.fr-tag'), rows = $$('.fr-row');
    const st = card.querySelector('.fr-st'), scan = card.querySelector('.fr-scan'), sum = card.querySelector('.fr-sum');
    const img = card.querySelector('.fr-photo img');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [card, say],
      marks: [[T.card, card], [T.say, say]],
      render(t) {
        const ci = seg(t, T.card, T.card + 0.3);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        // a slow push into the photo while it is read
        img.style.transform = `scale(${lerp(1, 1.025, outCubic(seg(t, T.card, T.read + 0.4))).toFixed(4)})`;
        const sp = seg(t, T.scan[0], T.scan[1]);
        scan.style.opacity = (sp > 0 && sp < 1 ? Math.sin(Math.PI * sp) : 0).toFixed(3);
        scan.style.top = `${(lerp(-6, 100, sp)).toFixed(2)}%`;
        ITEMS.forEach((it, i) => {
          // the box pops in from a little larger, its corners lock, then its label slides out of the box edge
          const p = seg(t, T.box[i], T.box[i] + POP);
          bx[i].style.opacity = outCubic(Math.min(1, p * 2.2)).toFixed(3);
          bx[i].style.transform = p >= 1 ? '' : `scale(${lerp(1.14, 1, outBack(p)).toFixed(4)})`;
          bx[i].classList.toggle('on', p > 0 && p < 1);
          const g = outCubic(seg(t, T.box[i] + 0.07, T.box[i] + 0.25));
          tags[i].style.opacity = g.toFixed(3);
          tags[i].style.clipPath = g >= 1 ? '' : `inset(0 ${((1 - g) * 100).toFixed(1)}% 0 0)`;
          const lit = outCubic(seg(t, T.box[i] + 0.05, T.box[i] + 0.22));
          rows[i].style.setProperty('--lit', lit.toFixed(3));
          rows[i].querySelector('.qc-ok').style.transform = `scale(${lerp(0.3, 1, outBack(lit)).toFixed(3)})`;
        });
        const read = t >= T.read;
        const label = read ? 'Restock list' : 'Reading photo';
        if (st.textContent !== label) st.textContent = label;
        card.classList.toggle('is-read', read);
        const s = seg(t, T.read, T.read + 0.25);
        sum.style.opacity = outCubic(s).toFixed(3);
        sum.style.transform = s >= 1 ? '' : `translateY(${((1 - outCubic(s)) * 6).toFixed(2)}px)`;
        const n = streamCount(SAY, T.say, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        say.style.opacity = t >= T.say ? '1' : '0';
      },
    };
  },
};
