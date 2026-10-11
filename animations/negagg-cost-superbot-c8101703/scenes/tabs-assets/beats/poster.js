// ChatGPT, the second ask: "make a poster for my bakery's Saturday sale". A status chip designs, then the poster lands
// as an image card: a real bakery photograph (img/loaves.jpg, Unsplash, see img/CREDITS.txt) with the type laid over it
// (shop name, "Saturday Sale", a 20% off stamp, the hours and the address; composition only, nothing drawn). Beside it
// the poster's details and a "0 superbot credits" chip: the model ran on the user's own plan, so superbot adds no credits.
// Pure function of t. Content: ./data.js (invented).
import { seg, outCubic, rise, sayLine, statusChip, ICONS, CHECK } from './util.js';
import { BAKERY, SALE, CREDITS } from './data.js';
import { outBack } from '../../../lib.js';

const SAY = 'Here is the poster, 1080 by 1350, ready to post:';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.55;
    T.say = T.chipDone + 0.05;
    T.card = T.chipDone + 0.14;
    T.type = [0, 1, 2, 3, 4].map((i) => T.card + 0.25 + i * 0.11);   // shop, headline, offer stamp, hours, address
    T.meta = [0, 1, 2, 3].map((i) => T.card + 0.4 + i * 0.12);
    T.credit = T.meta[3] + 0.3;
    T.end = T.credit + 0.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Designing the poster', 'Poster ready', false);
    const META = [
      ['Headline', SALE.headline],
      ['Offer', `${SALE.off}% off every loaf`],
      ['When', `${SALE.day}, ${SALE.hours}`],
      ['Where', BAKERY.address],
    ];
    const metaRows = META.map(([a, b]) => x.el(`<div class="po-mr"><small>${x.esc(a)}</small><b>${x.esc(b)}</b></div>`));
    const card = x.el(`<div class="po-card">
      <div class="po-art"><img src="${x.img('loaves.jpg')}" alt="Bakery loaves with wheat"/><div class="po-shade"></div>
        <div class="po-shop">${x.esc(BAKERY.name.toUpperCase())}</div>
        <div class="po-hl">${x.esc(SALE.headline.split(' ')[0])}<br/>${x.esc(SALE.headline.split(' ')[1])}</div>
        <div class="po-stamp"><b>${SALE.off}%</b><span>OFF</span></div>
        <div class="po-when">${x.esc(SALE.day.toUpperCase())} · ${x.esc(SALE.hours.toUpperCase())}</div>
        <div class="po-addr">${x.esc(BAKERY.address)}</div>
      </div>
      <div class="po-side">
        <div class="po-sh"><span>${ICONS.img}Poster</span><em>1080 × 1350 · PNG</em></div>
        <div class="po-meta"></div>
        <div class="po-credit"><span class="po-cr-t">${x.tile('sb', 'cn-ftile')}<b>${CREDITS} superbot credits</b></span><small>Made on your ChatGPT plan</small><span class="po-cr-ok">${CHECK}</span></div>
      </div>
    </div>`);
    const mbox = card.querySelector('.po-meta');
    metaRows.forEach((r) => mbox.appendChild(r));
    const art = card.querySelector('.po-art');
    const img = art.firstElementChild;
    const kids = [...art.children].slice(2);            // shop, headline, stamp, when, addr
    const stamp = art.querySelector('.po-stamp');
    const credit = card.querySelector('.po-credit');
    const ok = card.querySelector('.po-cr-ok');
    return {
      nodes: [chip.node, say.node, card],
      marks: [[T.chip, chip.node], [T.card, card], [T.credit, credit]],
      render(t) {
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone);
        say.update(t, T.say, 75);
        const p = seg(t, T.card, T.card + 0.5);
        const e = outCubic(p);
        card.style.opacity = e.toFixed(3);
        card.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        img.style.transform = p >= 1 ? '' : `scale(${(1.1 - 0.1 * e).toFixed(4)})`;
        kids.forEach((n, i) => {
          const f = seg(t, T.type[i], T.type[i] + 0.4);
          n.style.opacity = outCubic(f).toFixed(3);
          if (n === stamp) n.style.transform = `rotate(-9deg) scale(${(0.5 + 0.5 * outBack(f)).toFixed(3)})`;
          else n.style.transform = f >= 1 ? '' : `translateY(${((1 - outCubic(f)) * 10).toFixed(2)}px)`;
        });
        metaRows.forEach((r, i) => rise(r, seg(t, T.meta[i], T.meta[i] + 0.3), 6));
        rise(credit, seg(t, T.credit, T.credit + 0.38), 6);
        const o = seg(t, T.credit + 0.25, T.credit + 0.55);
        ok.style.opacity = o.toFixed(3);
        ok.style.transform = `scale(${(0.3 + 0.7 * outBack(o)).toFixed(3)})`;
      },
    };
  },
};
