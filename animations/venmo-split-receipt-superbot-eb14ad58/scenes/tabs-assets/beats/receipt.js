// Gemini beat: reads the receipt photo sent with the ask. The photo sits in a card; a highlight box sweeps across
// each line Gemini pulls out while the matching row lights up beside it, then Gemini answers with the split.
// Photo: img/receipt.jpg, made for this ad (a thermal receipt printed in code onto public-domain textures from
// Wikimedia Commons, "Surface wooden furniture interior.jpg" and "Crumpled olive green paper.jpg"). "Lucca
// Trattoria" is made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = '$195.89 for 4. That is $48.97 each.';
// line boxes on the 1000x1400 photo (corners clockwise from top-left), in the order Gemini reads them
const LINES = [
  { label: 'Lucca Trattoria', val: '', q: [[255.3, 241.5], [731.6, 227.5], [733.4, 272.2], [254.9, 286]] },
  { label: '4 guests', val: '', q: [[253.8, 405.6], [738.4, 392.5], [739.9, 427.7], [253.5, 440.6]] },
  { label: 'Subtotal', val: '$152.00', q: [[251.2, 694.8], [750.5, 683.4], [752, 720.8], [250.8, 731.9]] },
  { label: 'Tax', val: '$13.49', q: [[250.8, 728], [751.9, 716.9], [753.4, 754.5], [250.5, 765.4]] },
  { label: 'Tip 20%', val: '$30.40', q: [[250.5, 761.5], [753.3, 750.5], [754.9, 788.4], [250.2, 799.1]] },
  { label: 'Total', val: '$195.89', q: [[249.9, 829], [756.1, 818.5], [758, 863], [249.5, 873.2]], total: true },
];
// the part of the photo the card shows (photo px), scaled into the card's 200x250 window
const CROP = { x: 190, y: 160, s: 200 / 640 };
const STRIDE = 0.1, SWEEP = 0.15;
const mix = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
const pts = (q) => q.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08;
    T.hl = LINES.map((_, i) => r + 0.2 + i * STRIDE);
    T.read = T.hl[LINES.length - 1] + SWEEP;
    T.say = r + 0.8;
    T.end = r + 1.02;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const card = x.el(`<div class="rr-card">
      <div class="rr-photo"><div class="rr-zoom" style="transform:scale(${CROP.s}) translate(${-CROP.x}px,${-CROP.y}px)">
        <img src="${x.img('receipt.jpg')}" alt="Lucca Trattoria receipt"/>
        <svg class="rr-hl" viewBox="0 0 1000 1400">${LINES.map(() => '<polygon points=""/>').join('')}</svg>
      </div></div>
      <div class="rr-side">
        <div class="rr-hd"><span class="rr-st">Reading receipt</span><small>IMG_4471.jpg</small></div>
        ${LINES.map((l) => `<div class="rr-row${l.total ? ' rr-tot' : ''}"><span class="rr-ck">${x.OK}</span><span class="rr-l">${x.esc(l.label)}</span><span class="rr-v">${x.esc(l.val)}</span></div>`).join('')}
      </div>
    </div>`);
    const say = x.el(`<div class="qc-say rr-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const polys = [...card.querySelectorAll('.rr-hl polygon')];
    const rows = [...card.querySelectorAll('.rr-row')];
    const st = card.querySelector('.rr-st');
    const zoom = card.querySelector('.rr-zoom');
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
        const push = lerp(1, 1.06, outCubic(seg(t, T.card, T.read + 0.3)));
        zoom.style.transform = `scale(${(CROP.s * push).toFixed(5)}) translate(${(-CROP.x - 8 * (push - 1) / 0.06).toFixed(2)}px,${(-CROP.y - 30 * (push - 1) / 0.06).toFixed(2)}px)`;
        LINES.forEach((l, i) => {
          // the box sweeps left to right across its line, then rests as a lit band
          const p = outCubic(seg(t, T.hl[i], T.hl[i] + SWEEP));
          const [a, b, c, d] = l.q;
          polys[i].setAttribute('points', p <= 0 ? '' : pts([a, mix(a, b, p), mix(d, c, p), d]));
          polys[i].classList.toggle('on', p > 0 && p < 1);
          const lit = seg(t, T.hl[i] + SWEEP * 0.5, T.hl[i] + SWEEP + 0.12);
          rows[i].style.setProperty('--lit', outCubic(lit).toFixed(3));
          rows[i].querySelector('.qc-ok').style.transform = `scale(${lerp(0.3, 1, outBack(lit)).toFixed(3)})`;
        });
        const read = t >= T.read;
        if (st.textContent !== (read ? 'Receipt read' : 'Reading receipt')) st.textContent = read ? 'Receipt read' : 'Reading receipt';
        card.classList.toggle('is-read', read);
        const n = streamCount(SAY, T.say, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        say.style.opacity = t >= T.say ? '1' : '0';
      },
    };
  },
};
