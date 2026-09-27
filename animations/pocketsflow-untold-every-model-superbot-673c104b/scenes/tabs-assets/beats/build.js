// Build beat: Claude Opus 5.5 builds a part of Dark Souls and reports it as a RESULT, never as code. A dark card rises
// with what was built (a title and a "Building" pill that turns into "Built" with a check), its parts land one at a
// time and stamp a check each (a system with a short note, or a file name), and the footer counts up how many files
// were written and how many tests passed. opts pick the words and the shape per variant:
//   { say, title, rows: [[name, note, flag?]], mono, files, tests, bar, stagger }
// mono = the row names are file names (set in the mono face); bar = a tests bar that fills as the parts land;
// flag = a row that lands amber with its note as a warning (e.g. a texture still missing) instead of a check.
// Pure function of t (the tab scene's local time): no Date, no rAF, no CSS transitions, so ?t= freezes a frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const DEF = {
  say: 'Built Dark Souls.',
  title: 'Dark Souls',
  rows: [['Combat', 'stamina, roll, parry'], ['Gatewarden, the Last Oath', 'three phases'], ['The Outer Ward', 'bonfires and respawns']],
  mono: false, files: 0, tests: 0, bar: false, stagger: 0.2,
};
const CUBE = '<svg class="bld-ic" viewBox="0 0 24 24"><path d="M12 2.8l8.2 4.6v9.2L12 21.2l-8.2-4.6V7.4z"/><path d="M3.9 7.4L12 12l8.1-4.6M12 12v9.2"/></svg>';
const WARN = '<svg class="bld-warn" viewBox="0 0 24 24"><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.4v.1"/></svg>';

const conf = (opts = {}) => ({ ...DEF, ...opts });

export default {
  times(r, opts) {
    const o = conf(opts);
    const T = { r };
    T.card = r + 0.24;                                               // the result card rises in
    T.row = o.rows.map((_, i) => T.card + 0.3 + i * o.stagger);      // each part lands
    T.ok = T.row.map((a) => a + 0.26);                               // ...and stamps its check
    T.done = T.ok[T.ok.length - 1] + 0.08;                           // the pill turns to "Built"
    T.foot = T.row[0];                                               // the counters run while the parts land
    T.end = T.done + 0.42;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const o = conf(k.opts);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(o.say)}</span></div>`);
    const rows = o.rows.map(([name, note, flag]) => `<div class="bld-row${flag ? ' is-flag' : ''}">
        <span class="bld-name${o.mono ? ' is-mono' : ''}">${x.esc(name)}</span>
        ${note ? `<span class="bld-note">${x.esc(note)}</span>` : ''}
        <span class="bld-st">${flag ? WARN : x.OK}</span></div>`).join('');
    const foot = [
      o.files ? '<span class="bld-cnt"><b class="bld-files">0</b> files</span>' : '',
      o.tests ? '<span class="bld-cnt"><b class="bld-tests">0</b> tests passed</span>' : '',
    ].filter(Boolean).join('<i class="bld-dot"></i>');
    const card = x.el(`<div class="bld">
      <div class="bld-hd">${CUBE}<span class="bld-title">${x.esc(o.title)}</span>
        <span class="bld-pill"><i class="bld-spin"></i><span class="bld-pl">Building</span>${x.OK}</span></div>
      <div class="bld-rows">${rows}</div>
      ${o.bar ? '<div class="bld-bar"><i class="bld-fill"></i></div>' : ''}
      ${foot ? `<div class="bld-foot">${foot}</div>` : ''}
    </div>`);
    const rowEls = [...card.querySelectorAll('.bld-row')];
    const stEls = rowEls.map((n) => n.querySelector('.bld-st'));
    const pill = card.querySelector('.bld-pill');
    const pl = pill.querySelector('.bld-pl');
    const spin = pill.querySelector('.bld-spin');
    const pOk = pill.querySelector('.qc-ok');
    const fill = card.querySelector('.bld-fill');
    const filesEl = card.querySelector('.bld-files');
    const testsEl = card.querySelector('.bld-tests');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, built = null;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], ...T.row.map((a) => [a, card])],
      render(t) {
        const n = streamCount(o.say, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = o.say.slice(0, n); hid.textContent = o.say.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // each part: rises in, then its check (or the amber warning) pops
        rowEls.forEach((row, i) => {
          const p = outCubic(seg(t, T.row[i], T.row[i] + 0.3));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          const s = seg(t, T.ok[i], T.ok[i] + 0.28);
          stEls[i].style.opacity = s.toFixed(3);
          stEls[i].style.transform = `scale(${lerp(0.3, 1, outBack(s)).toFixed(4)})`;
        });

        // the pill: spinner while building, then "Built" with a check
        const isBuilt = t >= T.done;
        if (isBuilt !== built) { pl.textContent = isBuilt ? 'Built' : 'Building'; pill.classList.toggle('is-done', isBuilt); built = isBuilt; }
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const po = seg(t, T.done, T.done + 0.28);
        pOk.style.opacity = po.toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, outBack(po)).toFixed(4)})`;

        // the counters and the tests bar run from the first part landing to the last check
        const f = outCubic(seg(t, T.foot, T.done));
        if (fill) fill.style.transform = `scaleX(${f.toFixed(4)})`;
        if (filesEl) filesEl.textContent = String(Math.round(o.files * f));
        if (testsEl) testsEl.textContent = String(Math.round(o.tests * f));
      },
    };
  },
};
