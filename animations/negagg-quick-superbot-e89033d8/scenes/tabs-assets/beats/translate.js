// superbot-fast, the third ask: the caption in Spanish, French and Japanese. A status chip translates, then a card
// shows three language rows (flag, language, the translated line), one at a time, and a "Copied all 3" chip lands under
// them. Pure function of t. Caption and translations: ./data.js (invented).
import { seg, outCubic, rise, sayLine, statusChip, ICONS, CHECK } from './util.js';
import { LANGS } from './data.js';
import { outBack } from '../../../lib.js';

const SAY = 'Here it is in Spanish, French and Japanese:';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.7;
    T.say = T.chipDone + 0.05;
    T.row = LANGS.map((_, i) => T.chipDone + 0.15 + i * 0.3);
    T.copy = T.row[LANGS.length - 1] + 0.55;
    T.end = T.copy + 1.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Translating', `Translated into ${LANGS.length} languages`, true);
    const rows = LANGS.map((l) => x.el(`<div class="tr-row"><span class="tr-fl">${l.flag}</span><span class="tr-m"><small>${x.esc(l.name)}</small><b>${x.esc(l.text)}</b></span></div>`));
    const list = x.el('<div class="tr-list"></div>');
    rows.forEach((r) => list.appendChild(r));
    const copy = x.el(`<div class="tr-copy"><span class="tr-copy-ic">${ICONS.clip}</span><span>Copied all ${LANGS.length}</span><span class="tr-copy-ok">${CHECK}</span></div>`);
    const ok = copy.querySelector('.tr-copy-ok');
    return {
      nodes: [chip.node, say.node, list, copy],
      marks: [[T.chip, chip.node], [T.row[LANGS.length - 1], list], [T.copy, copy]],
      render(t) {
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(LANGS.length * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} of ${LANGS.length}`);
        say.update(t, T.say, 75);
        rows.forEach((r, i) => rise(r, seg(t, T.row[i], T.row[i] + 0.34), 10));
        rise(copy, seg(t, T.copy, T.copy + 0.35), 6);
        const o = seg(t, T.copy + 0.3, T.copy + 0.6);
        ok.style.opacity = o.toFixed(3);
        ok.style.transform = `scale(${(0.3 + 0.7 * outBack(o)).toFixed(3)})`;
      },
    };
  },
};
