// Built beat: the coding result card. The routed model's line streams, a result card lands, its progress bar fills,
// its file rows arrive one at a time and each stamps a green check, then the footer stat lands and the check in the
// title lights. There is no code on screen: a build is only ever shown as a result (a title, file names, a pass count,
// a progress bar). opts.kind picks the result: 'scene' (six scene files built), 'sync' (cuts snapped to 124 BPM),
// 'fix' (WireCube timing repaired), 'render' (the spot rendered and encoded, its frame counter counting up).
// resultCard(x, kind) draws the same card with no say line, animated between two times, so play.js can use it as an intro.
// Pure function of t: no Date, no rAF, no CSS transitions, no Math.random — every moving value is written from t.
import { clamp, lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

// the four results, exactly as the brief lays them out. rows are file names (or render step labels) only — the card
// never shows code, a diff, a command or an editor. `counter` (render only) marks the row whose number counts up.
const KINDS = {
  scene: {
    say: 'Built the animation.',
    title: 'Built the animation',
    rows: ['src/scenes/KineticType.tsx', 'DotField.tsx', 'WireCube.tsx', 'Ribbon.tsx', 'TypeRing.tsx', 'Logo.tsx'],
    stat: '6 scenes · 900 frames · 60 fps',
  },
  sync: {
    say: 'Synced every cut to the Suno beat.',
    title: 'Cuts synced to 124 BPM',
    rows: ['src/timing/cuts.ts', 'src/timing/beats.ts'],
    stat: 'Tests 12 passed',
  },
  fix: {
    say: 'Fixed the cube cut, it landed 2 frames late.',
    title: 'Fixed WireCube timing',
    rows: ['src/scenes/WireCube.tsx'],
    stat: '1 file changed · Tests 12 passed',
  },
  render: {
    say: 'Rendered the spot.',
    title: 'Rendered motion-ad.mp4',
    rows: ['Bundled 6 scenes', 'Rendered 900/900 frames', 'Encoded H.264 1920x1080'],
    stat: '0:15 · 18.4 MB',
    counter: { at: 1, total: 900, text: (n) => `Rendered ${n}/900 frames` },
  },
};

// the card's own mark (a window with a check in it) and the small green check in the footer stat
const MARK = '<svg class="bt-ic" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M8 12.4l2.8 2.8L16.5 9.6"/></svg>';
const FIC = '<svg class="bt-fic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const ROW_A = 0.6, ROW_B = 1.46; // rows land across this window after the reply, however many there are
const COUNT = 0.45;              // seconds the render frame counter takes to climb to its total

/** the beat's clock: r is the reply time. Fixed beats: say, card, bar, rows/checks, stat, title check, end. */
export function times(r, opts = {}) {
  const K = KINDS[opts.kind] || KINDS.scene;
  const n = K.rows.length;
  const T = { r, kind: KINDS[opts.kind] ? opts.kind : 'scene' };
  T.card = r + 0.18;      // the result card lands
  T.bar = r + 0.42;       // the progress bar starts filling
  T.barFull = r + 1.05;   // ... and is full here
  T.row = K.rows.map((_, i) => r + (n > 1 ? ROW_A + (i / (n - 1)) * (ROW_B - ROW_A) : ROW_A + 0.12));
  T.check = T.row.map((a) => a + 0.14);            // each row's green check lands just behind it
  T.count = K.counter ? T.row[K.counter.at] : T.row[0];
  T.stat = r + 1.9;       // the footer stat lands
  T.title = r + 2.12;     // the check in the title lights
  T.end = r + 2.6;
  return T;
}

/** build the card's nodes and return its refs plus a render(t) that animates it against the absolute clock T. */
function makeCard(x, kind) {
  const K = KINDS[kind] || KINDS.scene;
  const rowsHtml = K.rows.map((label) => `<div class="bt-row"><span class="bt-nm">${x.esc(label)}</span><span class="bt-tk">${x.OK}</span></div>`).join('');
  const card = x.el(`<div class="bt-card">
    <div class="bt-hd">${MARK}<span class="bt-title">${x.esc(K.title)}</span><span class="bt-tk">${x.OK}</span></div>
    <div class="bt-bar"><span class="bt-fill"></span></div>
    <div class="bt-rows">${rowsHtml}</div>
    <div class="bt-ft">${FIC}<span class="bt-stat">${x.esc(K.stat)}</span></div>
  </div>`);
  const title = card.querySelector('.bt-title');
  const titleTick = card.querySelector('.bt-hd .bt-tk');
  const fill = card.querySelector('.bt-fill');
  const rows = [...card.querySelectorAll('.bt-row')];
  const names = rows.map((r) => r.querySelector('.bt-nm'));
  const ticks = rows.map((r) => r.querySelector('.bt-tk'));
  const ft = card.querySelector('.bt-ft');
  const rise = (n, p, dy) => {
    const e = outCubic(p);
    n.style.opacity = e.toFixed(3);
    n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
    return e;
  };
  return {
    card, title, titleTick, fill, rows, names, ticks, ft,
    render(t, T) {
      // the card lands
      const ci = outCubic(seg(t, T.card, T.card + 0.42));
      card.style.opacity = ci.toFixed(3);
      card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

      // the progress bar fills to full
      fill.style.transform = `scaleX(${outCubic(seg(t, T.bar, T.barFull)).toFixed(4)})`;

      // each file row slides in and pops its green check just behind it
      rows.forEach((row, i) => {
        const a = T.row[i];
        rise(row, seg(t, a, a + 0.24), 5);
        const cp = seg(t, T.check[i], T.check[i] + 0.26);
        ticks[i].style.opacity = outCubic(seg(t, T.check[i], T.check[i] + 0.14)).toFixed(3);
        ticks[i].style.transform = `scale(${outBack(cp).toFixed(3)})`;
      });

      // the render card's frame counter climbs on its own row while that row lands
      const C = K.counter;
      if (C) {
        const n = Math.round(C.total * outCubic(seg(t, T.count, T.count + COUNT)));
        const txt = C.text(n);
        if (names[C.at].textContent !== txt) names[C.at].textContent = txt;
      }

      // the footer stat lands, then the check in the title lights
      rise(ft, seg(t, T.stat, T.stat + 0.3), 5);
      const tp = seg(t, T.title, T.title + 0.3);
      titleTick.style.opacity = outCubic(tp).toFixed(3);
      titleTick.style.transform = `scale(${outBack(tp).toFixed(3)})`;
      title.style.opacity = lerp(0.88, 1, outCubic(tp)).toFixed(3);
    },
  };
}

export default {
  times,
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const kind = KINDS[opts.kind] ? opts.kind : 'scene';
    const sayText = opts.say || KINDS[kind].say;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(sayText)}</span></div>`);
    const c = makeCard(x, kind);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    return {
      nodes: [say, c.card],
      marks: [[T.r, say], [T.card, c.card], [T.stat, c.card]],
      render(t) {
        const n = streamCount(sayText, T.r + 0.05, 84, t);
        if (n !== shown) { vis.textContent = sayText.slice(0, n); hid.textContent = sayText.slice(n); shown = n; }
        c.render(t, T);
      },
    };
  },
};

/** the same result card with no say line, animated proportionally across [t0, t1] so a beat can use it as an intro.
    The card's own clock is anchored at 0 (times(0)); t0..t1 is mapped onto it, so at t0 the card is still landing
    and at t1 it has fully landed (bar full, every check lit, stat up). */
export function resultCard(x, kind) {
  const K = KINDS[kind] ? kind : 'scene';
  const T = times(0, { kind: K });
  const c = makeCard(x, K);
  const span = T.end - T.r;
  return {
    node: c.card,
    render(t, t0, t1) { c.render(clamp((t - t0) / Math.max(1e-6, t1 - t0)) * span, T); },
  };
}