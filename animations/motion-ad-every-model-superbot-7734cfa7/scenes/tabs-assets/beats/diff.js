// Diff beat: the routed model patches the spot. Its line streams, the diff card rises, the hunk's context lines land,
// every red '-' and green '+' line then arrives one at a time with a flash, and a small chip resolves to 'Applied'.
// opts.set picks the edit: 'sync' (default) snaps every cut to the Suno beat grid, 'fix' repairs the cube cut that
// landed two frames late. Pure function of t (no Date, no rAF, no CSS transitions): every moving value is written
// from t, so ?t= freezes a frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

// [kind, text] — ' ' context, '-' removed, '+' added: the hunk as a GitHub PR shows it
const SETS = {
  sync: {
    say: 'Snapped every cut to the Suno beat grid.',
    path: 'src/timing/cuts.ts',
    hunk: '@@ -12,4 +12,4 @@',
    lines: [
      [' ', "import { beatsToFrames } from './beats';"],
      ['-', 'export const CUTS = [0, 90, 200, 270, 360];'],
      ['+', 'export const CUTS = beatsToFrames(bed.cues, 60); // 0,186,420,540,720'],
      ['-', 'export const cutAt = (s: number) => Math.round(s * 15);'],
      ['+', 'export const cutAt = (s: number) => Math.round(s * 60);'],
      [' ', 'export const DUR = 15 * 60;'],
    ],
  },
  fix: {
    say: 'Fixed the cube cut, it landed 2 frames late.',
    path: 'src/scenes/WireCube.tsx',
    hunk: '@@ -40,5 +40,5 @@',
    lines: [
      [' ', '  <Series>'],
      ['-', '    <Sequence from={422}>'],
      ['+', '    <Sequence from={420}>'],
      [' ', '      <WireCube spin />'],
      ['-', '      <Warp amount={0.6} />'],
      ['+', '      <Warp amount={0.5} />'],
      [' ', '    </Sequence>'],
    ],
  },
};
const MAX_LINES = 4; // changed-line slots times(r) lays out (both sets change four lines)

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.24;  // the card rises
    T.hunk = r + 0.46;  // the hunk header and its context lines land
    T.line = [0, 1, 2, 3].map((i) => r + 0.68 + i * 0.17); // the '-'/'+' lines, one at a time
    T.done = T.line[MAX_LINES - 1] + 0.3;                  // the chip resolves: Applied
    T.end = r + 2.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const S = SETS[(k.opts && k.opts.set) || 'sync'] || SETS.sync;
    const adds = S.lines.filter(([m]) => m === '+').length;
    const dels = S.lines.filter(([m]) => m === '-').length;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const card = x.el(`<div class="diff-card">
      <div class="diff-hd">
        <svg class="diff-ic" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>
        <span class="diff-path">${x.esc(S.path)}</span>
        <span class="diff-stat"><b class="diff-plus">+0</b><b class="diff-minus">-0</b></span>
      </div>
      <div class="diff-body"><div class="diff-hunkhd">${x.esc(S.hunk)}</div></div>
      <div class="diff-ft"><span class="diff-applied">${x.OK}Applied</span></div>
    </div>`);
    const body = card.querySelector('.diff-body');
    const hun = card.querySelector('.diff-hunkhd');
    const plus = card.querySelector('.diff-plus');
    const minus = card.querySelector('.diff-minus');
    const appl = card.querySelector('.diff-applied');
    // the hunk's own line numbers: the header says where the old and new sides start, each line advances its side
    const o0 = +/^@@ -(\d+)/.exec(S.hunk)[1];
    const n0 = +/^@@ -\d+(?:,\d+)? \+(\d+)/.exec(S.hunk)[1];
    let on = o0, nn = n0, ci = 0, cx = 0;
    const rows = S.lines.map(([kind, text]) => {
      const oldN = kind === '+' ? '' : on++;
      const newN = kind === '-' ? '' : nn++;
      const cls = kind === '+' ? ' diff-ln-add' : kind === '-' ? ' diff-ln-del' : '';
      const node = x.el(`<div class="diff-ln${cls}"><span class="diff-n">${oldN}</span><span class="diff-n">${newN}</span><span class="diff-sg">${kind === ' ' ? '' : kind}</span><span class="diff-t"></span></div>`);
      node.lastElementChild.textContent = text; // code text goes in as text, never as markup
      body.appendChild(node);
      const changed = kind !== ' ';
      return { node, changed, at: changed ? ci++ : -1, ctx: changed ? -1 : cx++, gb: kind === '+' ? '63, 185, 80' : '248, 81, 73' };
    });
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // a changed line past the slots times(r) laid out (it never happens today) simply follows the last one
    const lineAt = (i) => (i < T.line.length ? T.line[i] : T.line[MAX_LINES - 1] + (i - MAX_LINES + 1) * 0.17);

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.card + 0.5, card]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the card rises
        const ci2 = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci2.toFixed(3);
        card.style.transform = ci2 >= 1 ? '' : `translateY(${((1 - ci2) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, ci2).toFixed(4)})`;

        // the header's counts climb with the lines that are landing
        const cp = outCubic(seg(t, T.line[0] - 0.08, T.line[MAX_LINES - 1] + 0.26));
        const pt = `+${Math.round(adds * cp)}`, mt = `-${Math.round(dels * cp)}`;
        if (plus.textContent !== pt) plus.textContent = pt;
        if (minus.textContent !== mt) minus.textContent = mt;

        // the hunk header, then its context lines
        hun.style.opacity = outCubic(seg(t, T.hunk, T.hunk + 0.3)).toFixed(3);

        rows.forEach((r) => {
          const a = r.changed ? lineAt(r.at) : T.hunk + 0.05 + r.ctx * 0.07;
          const p = outCubic(seg(t, a, a + (r.changed ? 0.22 : 0.3)));
          r.node.style.opacity = p.toFixed(3);
          r.node.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * (r.changed ? -8 : -4)).toFixed(2)}px)`;
          if (r.changed) {
            const fl = 1 - seg(t, a + 0.26, a + 0.8); // the tint it lands with fades back to the hunk's own colour
            r.node.style.background = fl <= 0.002 ? '' : `rgba(${r.gb}, ${(0.16 * fl).toFixed(3)})`;
          }
        });

        // the resolved chip
        const ap = seg(t, T.done, T.done + 0.32);
        appl.style.opacity = outCubic(ap).toFixed(3);
        appl.style.transform = ap >= 1 ? '' : `translateY(${((1 - outCubic(ap)) * 5).toFixed(2)}px) scale(${lerp(0.86, 1, outBack(ap)).toFixed(4)})`;
      },
    };
  },
};