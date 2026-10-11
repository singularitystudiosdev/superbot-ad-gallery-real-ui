// superbot-fast, the first ask: the 12 dropped photos are renamed by date and place. A status chip counts the photos
// ("Renamed 12 photos"), then a before/after list lands: each row has the photo's thumbnail, the camera name struck down to
// grey and the new "date place" name, one row at a time, five rows and "+7 more". A last chip says all 12 are done.
// Pure function of t (the tabs scene's local time). Names and photos: ./data.js, img/CREDITS.txt.
import { seg, outCubic, rise, sayLine, statusChip, ICONS, CHECK } from './util.js';
import { FILES, SHOWN, MORE } from './data.js';

const SAY = 'Done. Sorted by date taken and named by place:';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.8;
    T.say = T.chipDone + 0.05;
    T.card = T.chipDone + 0.12;
    T.row = Array.from({ length: SHOWN }, (_, i) => T.card + 0.22 + i * 0.2);
    T.more = T.row[SHOWN - 1] + 0.26;
    T.done = T.more + 0.3;
    T.end = T.done + 0.75;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Renaming photos', `Renamed ${FILES.length} photos`, true);
    const rows = FILES.slice(0, SHOWN).map((f) => x.el(`<div class="rn-row">
      <span class="rn-ph"><img src="${x.img('t-' + f.img + '.jpg')}" alt=""/></span>
      <span class="rn-from">${x.esc(f.from)}</span>
      <span class="rn-ar">${ICONS.arrow}</span>
      <span class="rn-to"><b>${x.esc(f.date)}</b> ${x.esc(f.place)}<i>.jpg</i></span>
    </div>`));
    const more = x.el(`<div class="rn-more"><span class="rn-stack">${FILES.slice(SHOWN, SHOWN + 3).map((f) => `<img src="${x.img('t-' + f.img + '.jpg')}" alt=""/>`).join('')}</span><b>+${MORE} more</b><span>renamed the same way</span></div>`);
    const card = x.el(`<div class="rn-card">
      <div class="rn-h"><span><small>Sorted by date taken</small>Photos renamed</span><b class="rn-n">0 of ${FILES.length}</b></div>
    </div>`);
    const list = x.el('<div class="rn-list"></div>');
    rows.forEach((r) => list.appendChild(r));
    card.appendChild(list);
    card.appendChild(more);
    const n = card.querySelector('.rn-n');
    const done = x.el(`<div class="rn-done"><span class="rn-done-ic">${ICONS.img}</span><span>All ${FILES.length} photos renamed in place</span><span class="rn-done-ok">${CHECK}</span></div>`);
    return {
      nodes: [chip.node, say.node, card, done],
      marks: [[T.chip, chip.node], [T.card, card], [T.more, more], [T.done, done]],
      render(t) {
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(FILES.length * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} of ${FILES.length}`);
        say.update(t, T.say, 75);
        const cp = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = cp.toFixed(3);
        card.style.transform = cp >= 1 ? '' : `translateY(${((1 - cp) * 12).toFixed(2)}px)`;
        rows.forEach((r, i) => {
          rise(r, seg(t, T.row[i], T.row[i] + 0.32), 8);
          // the camera name greys out and the new name takes over as the row lands
          r.style.setProperty('--sw', outCubic(seg(t, T.row[i] + 0.12, T.row[i] + 0.5)).toFixed(3));
        });
        rise(more, seg(t, T.more, T.more + 0.32), 6);
        n.textContent = `${Math.round(FILES.length * outCubic(seg(t, T.row[0], T.more)))} of ${FILES.length}`;
        rise(done, seg(t, T.done, T.done + 0.35), 6);
      },
    };
  },
};
