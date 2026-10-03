// Read beat (the sibling's watch beat, re-themed): Gemini reads the client's brief and the model file. Its line
// streams, a card rises ("Reading 2 files": client_brief.pdf and alarm_clock.blend, each row's spinner resolving to a
// check in turn), then the spec lands under them, one row at a time: Body, Bells + frame, Colorways (three swatches with
// their hex), Shot, Output. The last row lands and the gold "Spec ready" chip closes the card.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Read the brief and the model file. Here is the spec.';
const LABEL = 'Reading 2 files';
const FILES = [['pdf', 'client_brief.pdf', '6 pages'], ['blend', 'alarm_clock.blend', '1 scene']];
// the spec, row by row: [key, value]; the colorways row carries its swatches instead of a plain value
const COLORS = [['Sage', '#8FAE8B'], ['Coral', '#E2725B'], ['Midnight', '#1E2A44']];
const SPEC = [
  ['Body', 'gloss enamel, recolor only'],
  ['Bells + frame', 'keep brushed steel'],
  ['Colorways', null],
  ['Shot', '3/4 hero, 85mm, warm paper sweep'],
  ['Output', '3 square PNGs, 1600 px'],
];
const READY = 'Spec ready';
// timing (seconds from the reply start, or from the card where noted), in the sibling's watch pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const FILE_AT = 0.24;                  // the card landing to the first file's check
const FILE_STAGGER = 0.2;              // one file's check to the next
const POP = 0.2;                       // a check popping in
const SPEC_AT = 0.62;                  // the card landing to the first spec row
const STAGGER = 0.13;                  // one spec row to the next
const ROW_IN = 0.24;                   // a row rising in
const READY_AT = 0.1;                  // the last row in, then the gold chip
const HOLD = 0.5; /* deliberate */     // the finished spec reads before the next pill

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const GLYPH = {
  pdf: '<svg class="rs-fi rs-pdf" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  blend: '<svg class="rs-fi rs-blend" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.file = FILES.map((_, i) => T.card + FILE_AT + i * FILE_STAGGER);
    T.spec = SPEC.map((_, i) => T.card + SPEC_AT + i * STAGGER);
    T.ready = T.spec[T.spec.length - 1] + ROW_IN + READY_AT;
    T.end = Math.max(T.ready + ROW_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const sw = COLORS.map(([n, hex]) => `<span class="rs-sw"><i style="background:${hex}"></i><b>${esc(n)}</b><em>${esc(hex)}</em></span>`).join('');
    const card = x.el(`<div class="rs-card">
      <div class="rs-hd"><span class="rs-st"><i class="rs-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b></div>
      <div class="rs-files">${FILES.map(([g, name, meta]) => `<div class="rs-file">${GLYPH[g]}<b>${esc(name)}</b><span>${esc(meta)}</span><span class="rs-ok"><i class="rs-spin"></i>${x.OK}</span></div>`).join('')}</div>
      <div class="rs-spec">${SPEC.map(([key, v]) => `<div class="rs-row"><span class="rs-k">${esc(key)}</span><span class="rs-v">${v === null ? sw : esc(v)}</span></div>`).join('')}</div>
      <div class="rs-foot"><span class="rs-ready">${x.OK}${esc(READY)}</span></div>
    </div>`);
    const spin = card.querySelector('.rs-hd .rs-spin'), ok = card.querySelector('.rs-hd .qc-ok');
    const files = [...card.querySelectorAll('.rs-ok')].map((n) => ({ spin: n.querySelector('.rs-spin'), ok: n.querySelector('.qc-ok') }));
    const rows = [...card.querySelectorAll('.rs-row')];
    const ready = card.querySelector('.rs-ready');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const check = (o, a, t, from) => {
      const d = outCubic(seg(t, a, a + POP));
      o.spin.style.opacity = (1 - seg(t, a - 0.08, a + 0.06)).toFixed(3);
      o.spin.style.transform = `rotate(${((t - from) * 420).toFixed(1)}deg)`;
      o.ok.style.opacity = d.toFixed(3);
      o.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };
    const rise = (n, a, t, dy) => {
      const q = outCubic(seg(t, a, a + ROW_IN));
      n.style.opacity = q.toFixed(3);
      n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * dy).toFixed(2)}px)`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // each file: its spinner turns until it has been read, then the check
        files.forEach((o, i) => check(o, T.file[i], t, T.card));
        // the header resolves with the last file
        check({ spin, ok }, T.file[T.file.length - 1], t, T.card);
        // the spec, row by row, then the gold chip
        rows.forEach((n, i) => rise(n, T.spec[i], t, 6));
        rise(ready, T.ready, t, 4);
      },
    };
  },
};
