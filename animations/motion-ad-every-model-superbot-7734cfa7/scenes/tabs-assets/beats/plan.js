// Plan beat: the routed model answers with one streamed line, then the spot's doc card lands under it and its
// rows settle one by one, each stamping a green check as it arrives. k.opts.kind picks the card: 'script' (the default,
// also used when opts is the empty object) is the 15-second shot list, 'sound' is the music and SFX cue sheet.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const DOC_ICON = '<svg class="plan-doc" viewBox="0 0 24 24"><path d="M7.5 3h6.5l5 5v13h-11.5Z"/><path d="M14 3v5h5"/><path d="M10 13h5M10 17h5"/></svg>';

// a row is [label, value]: the label prints bold with its colon, and a row with no label prints its sentence alone.
// The shot list follows the finished spot the play beat shows, cut for cut.
const SCRIPT = {
  say: 'Here is the shot list for the 15-second spot.',
  title: 'Motion ad: 15s shot list',
  rows: [
    ['0:00', 'kinetic type, EVERY FRAME on the beat'],
    ['0:03', 'red circle bursts into a dot field'],
    ['0:07', 'wireframe cube on electric blue'],
    ['0:09', 'ribbon loop, then a spinning type ring'],
    ['0:12', 'logo lockup, hold to 0:15'],
  ],
};
const SOUND = {
  say: 'Scored it. Every cut lands on a hit.',
  title: 'Motion ad: sound design',
  rows: [
    ['Track', 'minimal electronic, 8 bars'],
    ['0:00', 'type stabs on every word'],
    ['0:03', 'pop and shimmer on the dots'],
    ['0:07', 'whoosh on the cube spin'],
    ['0:12', 'riser into the logo'],
  ],
};

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.26;
    // five landing slots, one per row: both cards carry five rows, so they run the same length
    T.row = [0, 1, 2, 3, 4].map((i) => r + 0.62 + i * 0.3);
    T.end = r + 2.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const doc = (k.opts || {}).kind === 'sound' ? SOUND : SCRIPT;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(doc.say)}</span></div>`);
    const rowsHtml = doc.rows.map(([lab, val]) => `<div class="plan-row"><span class="plan-tick">${x.OK}</span><span class="plan-txt">${lab ? `<b class="plan-lab">${x.esc(lab)}:</b> ` : ''}<span class="plan-val">${x.esc(val)}</span></span></div>`).join('');
    const card = x.el(`<div class="plan-card">
      <div class="plan-hd"><i class="plan-ic">${DOC_ICON}</i><b>${x.esc(doc.title)}</b></div>
      <div class="plan-rows">${rowsHtml}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.plan-row')];
    const ticks = rows.map((row) => row.querySelector('.plan-tick'));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[0], rows[0]]],
      render(t) {
        const n = streamCount(doc.say, T.r + 0.06, 75, t);
        if (n !== shown) { vis.textContent = doc.say.slice(0, n); hid.textContent = doc.say.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each row slides in, then its check pops: the row is only "written down" once its check has landed
        rows.forEach((row, i) => {
          const a = T.row[i];
          rise(row, seg(t, a, a + 0.32), 7);
          const cp = seg(t, a + 0.16, a + 0.46);
          ticks[i].style.opacity = outCubic(seg(t, a + 0.16, a + 0.3)).toFixed(3);
          ticks[i].style.transform = `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`;
        });
      },
    };
  },
};