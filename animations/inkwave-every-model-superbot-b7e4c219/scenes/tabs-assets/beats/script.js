// Script beat (beats/script.js), step 1 of the routing: Claude Opus 5.5 writes Inkwave's game design script and hands
// the build off. The card is the kit's Claude artifact sheet (the reference kit's build.js / opus-lapse.js grammar): a
// document header with a Writing / Written pill, the script typing itself out line by line behind a lime cursor, and a
// HANDOFF block whose six chips land one after another and light up as they stream. Those six chips ARE the manifest
// the rest of the ad fills: DeepSeek V4 the weapon stats and turf rules, Meshy 5 the models, HY-Motion the clips,
// ElevenLabs the SFX, Suno the track, and Opus 5.5 the build.
// Every fact and name is the source footage's (@JaydenDavisNC, the "Splatoon Game made by Opus 5.5" post; source file
// and frame timings in img/ink/CREDITS.txt): Turf War 4v4, 3:00, Kraken Pier, the KRAKEN sign, the bridge and palms,
// lime vs magenta ink, Juno on the Glint Charger, the Spritzer, squid form, splat cards, Ink Storm, the TAB MAP
// minimap, the turf % bar, and the announcer's "Ready? GO!" and "1 minute left!".
// No drawn imagery: the only images are the app marks x.tile() already loads out of brand/ (provenance in
// brand/CREDITS.txt). The one glyph is Lucide's file-text (ISC, lucide.dev), stroked like the kit's other marks, and
// the checks are the kit's own x.OK. Pure function of t (the tabs scene's local time): no Date, no rAF state, no CSS
// animation or transition, so ?t=<sec> freezes an exact frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount, blink } from '../../../lib.js';

const SAY = 'Wrote Inkwave: 4v4 Turf War on Kraken Pier, lime vs magenta, 3 minutes.';
const DOC = 'inkwave.game.md';
const BADGE = 'plan';

const DOC_DUR = 1.9;    // seconds the script body takes to type out
const JOB_CPS = 120;    // the handoff chip's job types at this rate
const CHIP_GAP = 0.15;  // one handoff chip lands every this many seconds
const FOLLOW = 0.72;    // where the line being written sits in the viewport (0 top .. 1 bottom)
const VIEW = 226;       // the document viewport height, in hub px

// Lucide 'file-text' (ISC, lucide.dev): the document's mark in the card header
const DOC_IC = '<svg class="gd-ic" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';

// The script, one rendered row per line: ['# ' or '## ' markers, the rest the line's own text. [[x]] is a lime ink
// term, {{x}} a magenta one, so the two inks are legible in the document itself and not only in the game.
const LINES = [
  ['h1', '# INKWAVE'],
  ['sub', 'Turf War · 4v4 · 3:00 · Kraken Pier'],
  ['sec', '## THE MATCH'],
  ['p', 'Four a side, three minutes. Ink the floor and hold it.'],
  ['p', 'No score, only [[coverage]]. At 3:00 the whistle, then JUDGING'],
  ['p', 'and the {{turf bar}}. "Ready? GO!" then "1 minute left!"'],
  ['sec', '## THE MAP'],
  ['p', 'Kraken Pier: boardwalk, the KRAKEN sign over the north stall.'],
  ['p', 'Crates for cover, one bridge to cross, palms over the bay.'],
  ['sec', '## THE SQUAD'],
  ['p', '[[lime]]     Juno on the Glint Charger, Loop on the Spritzer.'],
  ['p', '[[lime]]     Kelp and Bubbles.'],
  ['p', '{{magenta}}  Coral, Squiddo, Suki, fourth slot open.'],
  ['sec', '## SQUID FORM'],
  ['p', 'Dive into your own ink: faster, lower, harder to hit.'],
  ['p', 'Surface to fire. The fight is over floor, not bodies.'],
  ['sec', '## THE SPECIAL'],
  ['p', '[[Ink Storm]]: a column of ink, and every cell under it flips.'],
  ['sec', '## THE HUD'],
  ['p', 'Splat cards name who got you. TAB MAP minimap.'],
  ['p', 'The {{turf % bar}} counts both inks live.'],
  ['sec', '## HANDOFF'],
  ['p', 'Six agents, six jobs. Build this next:'],
];
// The HANDOFF block, the script's last section: [app key in chat.js APPS, the job that agent is handed]
const CHIPS = [
  ['deepseek', 'weapon stats and turf rules'],
  ['meshy', '3 models: squid_kid.glb + 2 meshes'],
  ['motion', '4 clips: swim, super jump, strafe, splat'],
  ['eleven', '9 SFX: splat, swim, super jump, announcer'],
  ['suno', '1 track: Turf War (Kraken Pier)'],
  ['opus', 'build the game'],
];

// ---- the document model: one token stream, so a character count can reveal any prefix of it -----------------------
// A line's marker ('#' / '##') is its own token and the space after it is dropped (the row's flex gap draws it), so the
// stream the typewriter walks is exactly the string the tokens concatenate to.
const rich = (s, off) => {
  const out = [], re = /\[\[(.+?)\]\]|\{\{(.+?)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index), c: '', s: off + last });
    out.push({ t: m[1] || m[2], c: m[1] ? 'lime' : 'mag', s: off + m.index + (m[1] ? 2 : 2) });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last), c: '', s: off + last });
  return out;
};
const lineTokens = (text) => {
  const m = /^(#{1,2}) (.*)$/.exec(text);
  if (!m) return rich(text, 0);
  const mk = { t: m[1], c: 'mk', s: 0 };
  return [mk, ...rich(m[2], m[1].length + 1).map((k) => ({ ...k, s: k.s - 1 }))];
};
const MODEL = LINES.map(([cls, text]) => ({ cls, toks: lineTokens(text) }));
const TOTAL = MODEL.reduce((a, L) => a + L.toks.reduce((b, k) => b + k.t.length, 0), 0);
const TEXT = MODEL.map((L) => L.toks.map((k) => k.t).join('')).join('');

const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// The cursor sits OUT of the text flow (absolutely placed inside the stack), so streaming a line never re-wraps it.
// Both faces the write point lands in are monospace, so the width of a visible prefix is its character count times
// the face's own advance, measured once per element off a canvas with that element's computed font.
const CARET_H = 12;
let fctx = null, fkey = null, fadv = 6.6;
const advance = (el) => {
  const cs = getComputedStyle(el);
  const key = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if (key !== fkey) {
    fkey = key;
    if (!fctx) fctx = document.createElement('canvas').getContext('2d');
    fctx.font = key;
    fadv = fctx.measureText('x'.repeat(64)).width / 64 || parseFloat(cs.fontSize) * 0.6;
  }
  return fadv;
};

export default {
  times(r, opts = {}) {
    const T = { r, say: opts.say };
    T.card = r + 0.10;                                    // the artifact sheet rises in
    T.doc = r + 0.34;                                     // the script starts typing
    T.cps = TOTAL / DOC_DUR;
    T.wrote = T.doc + DOC_DUR;                            // ...and the last line lands
    T.chip = CHIPS.map((_, i) => T.wrote + 0.10 + i * CHIP_GAP);  // the handoff chips land one by one
    T.job = CHIPS.map(([, job], i) => T.chip[i] + job.length / JOB_CPS);
    T.tk = T.job.map((a) => a + 0.02);                    // each chip's tick lands when its job has been spelled out
    T.done = T.tk[CHIPS.length - 1] + 0.10;               // Written: 6 agents, the handoff is live
    T.end = T.done + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(T.say || SAY)}</span></div>`);
    const card = x.el(`<div class="gd">
      <div class="gd-hd">${DOC_IC}<span class="gd-name">${x.esc(DOC)}</span><span class="gd-badge">${x.esc(BADGE)}</span>
        <span class="gd-pill"><i class="gd-spin"></i><span class="gd-pl">Writing</span>${x.OK}</span></div>
      <div class="gd-vp"><div class="gd-stk"></div></div>
      <div class="gd-ft"><span class="gd-meta"><b class="gd-ln">0</b> lines</span><i class="gd-dot"></i>
        <span class="gd-meta"><b class="gd-ag">0</b> agents handed off</span>
        <span class="gd-ready">${x.OK}<span>Handoff ready</span></span></div>
    </div>`);
    const vp = card.querySelector('.gd-vp');
    const stk = card.querySelector('.gd-stk');
    vp.style.height = VIEW + 'px';
    // the document's rows, then the six handoff chips under the HANDOFF header
    let at = 0;
    const rows = MODEL.map((L) => {
      const row = x.el(`<div class="gd-l gd-${L.cls}"></div>`);
      const toks = L.toks.map((tok) => {
        const n = x.el(`<span class="${tok.c ? 'gd-' + tok.c : ''}"></span>`);
        n.textContent = tok.t;
        row.appendChild(n);
        return { el: n, t: tok.t, s: tok.s, n: -1 };
      });
      // a section header's hairline is an element, not a ::after: it has to land with the heading, not sit there
      // empty from the first frame while the heading's own text is still hidden
      const rule = L.cls === 'sec' ? x.el('<i class="gd-rule"></i>') : null;
      if (rule) row.appendChild(rule);
      const len = L.toks.reduce((a, tok) => a + tok.t.length, 0);
      const r = { el: row, toks, rule, start: at, len, v: -1 };
      at += len;
      return r;
    });
    const chips = CHIPS.map(([app, job]) => {
      const row = x.el(`<div class="gd-chip">${x.tile(app)}<b class="gd-cn">${x.esc(x.apps[app].name)}</b><span class="gd-job"></span><span class="gd-tk">${x.OK}</span></div>`);
      return { row, job, el: row.querySelector('.gd-job'), tk: row.querySelector('.gd-tk'), n: -1 };
    });
    rows.forEach((r) => stk.appendChild(r.el));
    chips.forEach((c) => stk.appendChild(c.row));
    const caret = x.el('<i class="gd-caret"></i>');
    stk.appendChild(caret);
    const pill = card.querySelector('.gd-pill');
    const pl = pill.querySelector('.gd-pl');
    const spin = pill.querySelector('.gd-spin');
    const pillOk = pill.querySelector('.qc-ok');
    const lnEl = card.querySelector('.gd-ln');
    const agEl = card.querySelector('.gd-ag');
    const ready = card.querySelector('.gd-ready');
    const readyOk = ready.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastSh = null, wasDone = null;

    return {
      nodes: [say, card],
      // the thread's fold: the say line lands with the reply, the sheet with its own mark (the doc streams inside the
      // card, so one more mark on the same node would only re-glide the feed onto the box it is already anchored to)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        // a no-op until the thread has placed this beat's nodes: nothing here may measure or place a node that is not
        // in the document yet (the caret reads offsets off rows and tokens)
        if (!say.isConnected || !card.isConnected) return;
        const n = streamCount(TEXT, T.doc, T.cps, t);
        const sn = streamCount(T.say || SAY, T.r + 0.05, 80, t);
        if (sn !== shown) { vis.textContent = (T.say || SAY).slice(0, sn); hid.textContent = (T.say || SAY).slice(sn); shown = sn; }

        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the script types itself out: as the stream advances only the boundary token's text changes, every token
        // behind it just shows; the document grows downward as it is written, and the scroll follow below keeps the
        // write line in view. The caret is out of the text flow (gd-caret), so it never pushes what it is writing.
        rows.forEach((L) => {
          const v = clamp(n - L.start, 0, L.len);
          if (v === L.v) return;
          L.v = v;
          if (L.rule) L.rule.style.opacity = (v <= 0 ? 0 : Math.min(1, v / 8)).toFixed(3);
          L.toks.forEach((tok) => {
            const a = clamp(v - tok.s, 0, tok.t.length);
            if (a === tok.n) return;
            tok.n = a;
            tok.el.style.visibility = a ? '' : 'hidden';
            tok.el.textContent = a >= tok.t.length ? tok.t : tok.t.slice(0, a);
          });
        });

        // the HANDOFF chips: each rises in, spells its job out, then stamps its tick. The six ticks are the manifest.
        let ticked = 0, typing = t >= T.doc && t < T.wrote;
        chips.forEach((c, i) => {
          const p = outCubic(seg(t, T.chip[i], T.chip[i] + 0.22));
          c.row.style.opacity = p.toFixed(3);
          c.row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          const a = streamCount(c.job, T.chip[i], JOB_CPS, t);
          if (a !== c.n) { c.n = a; c.el.textContent = c.job.slice(0, a); }
          if (t >= T.chip[i] && t < T.job[i]) typing = true;
          const q = seg(t, T.tk[i], T.tk[i] + 0.2);
          c.tk.style.opacity = q.toFixed(3);
          c.tk.style.transform = `scale(${lerp(0.4, 1, outBack(q)).toFixed(4)})`;
          if (q >= 1) ticked++;
        });

        // the cursor sits at the write point of the line or job mid-stream, and the document follows it. Both the
        // write point and the line to follow come out of t alone, with no run history, so a frozen frame renders the
        // same wherever the clock stopped: while the script is being written, the first line still incomplete; after
        // it, the last line, then the chips as they land, and the last chip once the handoff is done (which is what
        // keeps the whole manifest in view on the spot after it)
        let row = null, tok = null, a = 0;
        if (t < T.wrote) {
          const L = rows.find((r) => r.v < r.len) || rows[rows.length - 1];
          const k = L.toks.find((x) => x.n < x.t.length);
          row = L.el;
          if (k) { tok = k; a = k.n; }
        } else {
          const i = chips.findIndex((c, j) => t >= T.chip[j] && c.n < c.job.length);
          row = i >= 0 ? chips[i].row : t < T.chip[0] ? rows[rows.length - 1].el : chips[chips.length - 1].row;
          if (i >= 0) { tok = chips[i]; a = chips[i].n; }
        }
        if (tok) {
          if (!tok.adv) tok.adv = advance(tok.el);
          const x = tok.el.offsetLeft + a * tok.adv;
          const y = tok.el.offsetTop + (row.offsetHeight - CARET_H) / 2;
          caret.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
        }
        caret.style.opacity = t >= T.done ? '0' : typing ? '1' : blink(t) ? '1' : '0';

        // the document scrolls itself: the line being written sits low in the viewport, and the stack never scrolls
        // past its own end, so the whole HANDOFF block is in view when its last chip lands
        const max = Math.min(0, VIEW - stk.offsetHeight);
        const sh = Math.round(clamp(FOLLOW * VIEW - (row.offsetTop + row.offsetHeight), max, 0) * 100) / 100;
        if (sh !== lastSh) { stk.style.transform = `translateY(${sh.toFixed(2)}px)`; lastSh = sh; }

        // header: Writing spins into Written, and the footer counts what landed
        const d = t >= T.done;
        if (d !== wasDone) { setText(pl, d ? 'Written' : 'Writing'); pill.classList.toggle('gd-done', d); wasDone = d; }
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const po = seg(t, T.done, T.done + 0.28);
        pillOk.style.opacity = po.toFixed(3);
        pillOk.style.transform = `scale(${lerp(0.3, 1, outBack(po)).toFixed(4)})`;
        setText(lnEl, String(rows.filter((L) => L.v >= L.len).length + ticked));
        setText(agEl, String(ticked));
        ready.classList.toggle('on', d);
        const rq = seg(t, T.done, T.done + 0.3);
        readyOk.style.opacity = rq.toFixed(3);
        readyOk.style.transform = `scale(${lerp(0.3, 1, outBack(rq)).toFixed(4)})`;
      },
    };
  },
};