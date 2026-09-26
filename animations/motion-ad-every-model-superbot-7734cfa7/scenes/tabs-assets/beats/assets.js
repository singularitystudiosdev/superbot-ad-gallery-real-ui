// Assets beat: the routed auditor (DeepSeek, by the variant that routes it) walks the spot's asset list row by row.
// Every file lands with its icon, name and size and stamps a green check as it clears; the one file that is late —
// scenes/WireCube.tsx, a scene in an asset folder — lands an amber "cut 2 frames late", and the auditing model fixes it
// itself: the row flips to green "fixed" (no hand-back, one model works at a time). opts.say overrides the streamed line.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

// the list, in the order the auditor works it: frames, score, fonts, the logo, then the scene file that is out of place
const FILES = [
  ['frames/kinetic-type.png', '1.2 MB', 'img'],
  ['frames/dot-field.png', '980 KB', 'img'],
  ['frames/wire-cube.png', '1.1 MB', 'img'],
  ['frames/type-ring.png', '870 KB', 'img'],
  ['frames/ribbon.png', '1.0 MB', 'img'],
  ['audio/bed-124bpm.wav', '2.6 MB', 'aud'],
  ['audio/sfx-hits.wav', '640 KB', 'aud'],
  ['audio/riser.wav', '410 KB', 'aud'],
  ['fonts/Inter-Black.woff2', '220 KB', 'font'],
  ['fonts/Tiempos.woff2', '205 KB', 'font'],
  ['svg/claude-logo.svg', '38 KB', 'svg'],
  ['scenes/WireCube.tsx', '14 KB', 'code'],
];
const LATE = FILES.length - 1;               // the scene file: the one row the audit sends back
const WARN = 'cut 2 frames late';

const LIST = '<svg class="as-lic" viewBox="0 0 24 24"><path d="M7.5 3h6.5l5 5v13h-11.5Z"/><path d="M14 3v5h5"/><path d="M10 13h5M10 17h5"/></svg>';
const ICONS = {
  img: '<svg class="as-ic" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.5" r="1.6"/><path d="M5 17.5l4.5-4.5 3.5 3.5 2.5-2.5 3.5 3.5"/></svg>',
  aud: '<svg class="as-ic" viewBox="0 0 24 24"><path d="M5 14v-4M9 17V7M13 19V5M17 15v-6M21 13v-2"/></svg>',
  font: '<svg class="as-ic" viewBox="0 0 24 24"><path d="M5 6.5V5h9v1.5"/><path d="M9.5 5v14"/><path d="M7.5 19h4"/></svg>',
  svg: '<svg class="as-ic" viewBox="0 0 24 24"><path d="M12 3.5l2.5 5.3 5.5.7-4.1 3.9 1.1 5.6-4.9-2.9-4.9 2.9 1.1-5.6L4.2 9.5l5.5-.7Z"/></svg>',
  code: '<svg class="as-ic" viewBox="0 0 24 24"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/></svg>',
};

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.24;
    T.row = FILES.map((_, i) => r + 0.44 + i * 0.135);   // twelve rows, the last landing at r+1.93
    T.check = T.row.map((a) => a + 0.18);                // each row's check lands just behind it
    T.warn = T.row[LATE] + 0.2;                          // the flagged row notes what is wrong
    T.fix = r + 2.3;                                     // the flagged row comes back green "fixed"
    T.end = r + 2.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const sayText = opts.say || 'Checked every asset and fixed one late cut.';

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(sayText)}</span></div>`);
    const rowsHtml = FILES.map(([p, size, kind], i) => `<div class="as-row">
      ${ICONS[kind]}
      <span class="as-name">${x.esc(p)}</span>
      <span class="as-size">${x.esc(size)}</span>
      <span class="as-st">${i === LATE
        ? `<span class="as-warn">${x.esc(WARN)}</span><span class="as-fix">fixed</span>`
        : `<span class="as-tick">${x.OK}</span>`}</span>
    </div>`).join('');
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><i class="as-lic-w">${LIST}</i><span class="as-path"><b>motion-ad</b><i>/</i><b>assets</b></span><span class="as-count">${FILES.length} files</span></div>
      <div class="as-rows">${rowsHtml}</div>
    </div>`);

    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rows = [...card.querySelectorAll('.as-row')];
    const ticks = rows.map((r) => r.querySelector('.as-tick'));
    const late = rows[LATE];
    const warn = late.querySelector('.as-warn'), fix = late.querySelector('.as-fix');
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[0], card]],
      render(t) {
        const n = streamCount(sayText, T.r + 0.06, 82, t);
        if (n !== shown) { vis.textContent = sayText.slice(0, n); hid.textContent = sayText.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each row slides in; a clean row pops its green check just after it lands
        rows.forEach((row, i) => {
          const a = T.row[i];
          rise(row, seg(t, a, a + 0.24), 5);
          if (i === LATE) return;
          const cp = seg(t, T.check[i], T.check[i] + 0.26);
          ticks[i].style.opacity = outCubic(seg(t, T.check[i], T.check[i] + 0.14)).toFixed(3);
          ticks[i].style.transform = `scale(${outBack(cp).toFixed(3)})`;
        });

        // the late row: amber warning, then it flips green "fixed"
        const wp = seg(t, T.warn, T.warn + 0.24);
        warn.style.opacity = (outCubic(wp) * (1 - seg(t, T.fix - 0.12, T.fix + 0.06))).toFixed(3);
        warn.style.transform = wp >= 1 ? '' : `scale(${outBack(wp).toFixed(3)})`;
        const fp = seg(t, T.fix, T.fix + 0.26);
        fix.style.opacity = outCubic(fp).toFixed(3);
        fix.style.transform = `scale(${outBack(fp).toFixed(3)})`;

      },
    };
  },
};