// superbot-omni, the first ask: the dropped statement is read on this device (a status chip counts the 86 transactions),
// then the September breakdown lands as a card, one category row at a time with its horizontal bar growing, and the
// total counts up to $2,600. A last chip says it ran on this device. Pure function of t (the tabs scene's local time).
// Figures: ./data.js (invented).
import { seg, outCubic, rise, sayLine, statusChip, money, ICONS, CHECK } from './util.js';
import { CATS, TOTAL, FILE } from './data.js';

const SAY = 'Done. Here is where September went:';
const MAX = Math.max(...CATS.map((c) => c.amt));

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.85;
    T.say = T.chipDone + 0.05;
    T.card = T.chipDone + 0.15;
    T.row = CATS.map((_, i) => T.card + 0.2 + i * 0.17);
    T.fill = T.row[CATS.length - 1] + 0.1;
    T.fillEnd = T.fill + 0.7;
    T.dev = T.fillEnd - 0.1;
    T.end = T.dev + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Reading the statement', `Read ${FILE.tx} transactions`, true);
    const rows = CATS.map((c) => x.el(`<div class="sp-row">
      <span class="sp-ic" style="--c:${c.color}">${ICONS[c.k]}</span>
      <span class="sp-l">${x.esc(c.label)}</span>
      <span class="sp-bar"><i style="background:${c.color}"></i></span>
      <b class="sp-amt">${money(c.amt)}</b>
    </div>`));
    const card = x.el(`<div class="sp-card">
      <div class="sp-h"><span><small>September</small>Spending by category</span><b class="sp-sum">$0</b></div>
      <div class="sp-rows"></div>
      <div class="sp-f"><span>${CATS.length} categories</span><span>${FILE.tx} transactions</span></div>
    </div>`);
    const box = card.querySelector('.sp-rows');
    rows.forEach((r) => box.appendChild(r));
    const sum = card.querySelector('.sp-sum');
    const bars = rows.map((r) => r.querySelector('.sp-bar i'));
    const dev = x.el(`<div class="sp-dev"><span class="sp-dev-ic">${ICONS.laptop}</span><span>Ran on this device</span><span class="sp-dev-ok">${CHECK}</span></div>`);
    return {
      nodes: [chip.node, say.node, card, dev],
      marks: [[T.chip, chip.node], [T.card, card], [T.row[CATS.length - 1], box], [T.dev, dev]],
      render(t) {
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(FILE.tx * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} of ${FILE.tx}`);
        say.update(t, T.say, 75);
        const cp = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = cp.toFixed(3);
        card.style.transform = cp >= 1 ? '' : `translateY(${((1 - cp) * 12).toFixed(2)}px)`;
        rows.forEach((r, i) => rise(r, seg(t, T.row[i], T.row[i] + 0.32), 8));
        const f = outCubic(seg(t, T.fill, T.fillEnd));
        bars.forEach((b, i) => {
          const own = outCubic(seg(t, T.row[i] + 0.05, T.row[i] + 0.6));
          b.style.width = `${(100 * CATS[i].amt / MAX * own).toFixed(2)}%`;
        });
        sum.textContent = money(TOTAL * f);
        rise(dev, seg(t, T.dev, T.dev + 0.35), 6);
      },
    };
  },
};
