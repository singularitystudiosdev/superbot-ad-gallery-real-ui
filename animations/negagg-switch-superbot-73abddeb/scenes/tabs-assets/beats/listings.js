// ChatGPT, the search: a tool chip scans the rentals (the listing count climbs), three filter pills light in turn,
// then three listing cards land one after another, each with its photo, rent, beds and baths, neighbourhood and the
// park it is near. Pure function of t (the tabs scene's local time). Data and photos: ./data.js, img/CREDITS.txt.
import { seg, outCubic, rise, sayLine, statusChip, num, TREE } from './util.js';
import { LISTINGS } from './data.js';

const SAY = 'Here are 3 two-bedrooms under $2,000, each a short walk from a park.';
const FILTERS = ['Austin, TX', '2 bd', 'Under $2,000', 'Near a park'];
const SCANNED = 214;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 1.15;
    T.flt = FILTERS.map((_, i) => r + 0.3 + i * 0.2);
    T.match = T.flt[FILTERS.length - 1] + 0.35;
    T.card = LISTINGS.map((_, i) => T.chipDone + 0.05 + i * 0.42);
    T.end = T.card[LISTINGS.length - 1] + 0.95;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Searching Austin rentals', 'Searched Austin rentals', true);
    const flt = x.el(`<div class="sw-flt">${FILTERS.map((f) => `<span class="sw-fp"><i>${x.OK}</i>${x.esc(f)}</span>`).join('')}<span class="sw-fp sw-match"><i>${x.OK}</i>3 matches</span></div>`);
    const pills = [...flt.children];
    const cards = LISTINGS.map((l) => x.el(`<div class="sw-lc">
      <div class="sw-ph"><img src="${x.img(l.photo)}" alt="${x.esc(l.name)}"/><span class="sw-rent">${l.rent}<small>/mo</small></span></div>
      <div class="sw-body">
        <div class="sw-nm"><b>${x.esc(l.name)}</b><span>${x.esc(l.hood)}</span></div>
        <div class="sw-spec"><span>${l.bd} bd</span><i></i><span>${l.ba} ba</span><i></i><span>${l.sqft}</span></div>
        <div class="sw-tags"><span class="sw-tag sw-park">${TREE}${x.esc(l.park)}</span>${l.tags.map((g) => `<span class="sw-tag">${x.esc(g)}</span>`).join('')}</div>
      </div>
    </div>`));
    const list = x.el('<div class="sw-list"></div>');
    cards.forEach((c) => list.appendChild(c));
    return {
      nodes: [say.node, chip.node, flt, list],
      marks: [[T.r, say.node], [T.chip, chip.node], [T.flt[0], flt], ...cards.map((c, i) => [T.card[i], c])],
      render(t) {
        say.update(t, T.r + 0.05, 75);
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        const scanned = SCANNED * outCubic(seg(t, T.chip + 0.1, T.chipDone));
        chip.update(t, T.chip, T.chipDone, `${num(scanned)} listings`);
        flt.style.opacity = t >= T.flt[0] - 0.05 ? '1' : '0';
        pills.forEach((p, i) => {
          const a = i < FILTERS.length ? T.flt[i] : T.match;
          rise(p, seg(t, a, a + 0.26), 6);
          p.classList.toggle('on', t >= a + 0.2);
        });
        cards.forEach((c, i) => {
          const p = seg(t, T.card[i], T.card[i] + 0.5);
          const e = outCubic(p);
          c.style.opacity = e.toFixed(3);
          c.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 16).toFixed(2)}px)`;
          const img = c.firstElementChild.firstElementChild;
          img.style.transform = p >= 1 ? '' : `scale(${(1.1 - 0.1 * e).toFixed(4)})`;
        });
      },
    };
  },
};
