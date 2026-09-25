/* scenes/end.js: the end card. Exactly cfg.end.text (default "Superbot just works") in large type with
   the REAL superbot mascot (shell.makeMark, the live mark from assets/sb-mark-live.js) to the right of it.
   The mascot pops in and blinks on its own schedule; the words rise. On 1x1 and 4x5 the line breaks in two
   ("Superbot" / "just works") and the type shrinks, so the mascot stays beside the words at every ratio.
   Exit is the engine's dip. render is pure in lt (0..dur) and idempotent. */
import { clamp, seg, outQuint, outBack, lerp, op } from '../lib.js';
import * as shell from '../shell.js';

const DEFAULT_DUR = 3.4;
const DEFAULT_TEXT = 'Superbot just works';
const RISE = 46, STAG = 0.07, W_IN = 0.12, W_DUR = 0.5, POP = 0.55;

let ST = null;

function dur(cfg) {
  const o = cfg && cfg.dur && cfg.dur.end;
  return o != null && isFinite(o) && +o > 0 ? +o : DEFAULT_DUR;
}

const endText = (cfg) => {
  const t = cfg && cfg.end && cfg.end.text;
  return t ? String(t) : DEFAULT_TEXT;
};

/** the words of the card, split into the lines the current ratio can carry */
function linesFor(text, narrow) {
  const ws = text.split(/\s+/).filter(Boolean);
  if (!narrow || ws.length < 3) return [ws];
  const mid = Math.max(1, Math.floor(ws.length / 2));
  return [ws.slice(0, mid), ws.slice(mid)];
}

function buildLines(st, narrow) {
  st.h1.textContent = '';
  st.words = [];
  for (const line of linesFor(st.text, narrow)) {
    const ln = document.createElement('span');
    ln.className = 'ln';
    line.forEach((word, i) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = word;
      if (i) ln.appendChild(document.createTextNode(' '));
      ln.appendChild(w);
      st.words.push(w);
    });
    st.h1.appendChild(ln);
  }
  st.narrow = narrow;
  st.dirty = true;
}

/** shrink the type until the lock fits the frame (layout only, never time) */
function fitLock(st, ctx) {
  st.k = 1;
  st.lock.style.setProperty('--end-k', '1');
  for (let i = 0; i < 4 && st.lock.scrollWidth > ctx.W - 64; i++) {
    st.k = Math.max(0.62, st.k * ((ctx.W - 64) / st.lock.scrollWidth));
    st.lock.style.setProperty('--end-k', st.k.toFixed(3));
  }
}

function mount(sec, ctx) {
  const lock = document.createElement('div');
  lock.className = 'lock';
  const h1 = document.createElement('h1');
  const mh = document.createElement('div');
  mh.className = 'mh';
  const mk = document.createElement('div');
  mk.className = 'mk';
  const mark = shell.makeMark(220);
  mk.appendChild(mark.el);
  mh.appendChild(mk);
  lock.appendChild(h1);
  lock.appendChild(mh);
  sec.appendChild(lock);

  ST = {
    cfg: ctx.cfg, sec, lock, h1, mh, mark,
    text: endText(ctx.cfg), words: [], narrow: null, dirty: true, k: 1, mw: 0,
  };
  buildLines(ST, ctx.ar === '1x1' || ctx.ar === '4x5');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ST) ST.dirty = true; });
}

function render(lt, ctx) {
  const st = ST;
  if (!st) return;
  const narrow = ctx.ar === '1x1' || ctx.ar === '4x5';
  if (narrow !== st.narrow) buildLines(st, narrow);
  if (st.dirty || st.mw !== ctx.W) {
    if (st.mw !== ctx.W) st.mw = ctx.W;
    fitLock(st, ctx);
    st.dirty = false;
  }
  for (let i = 0; i < st.words.length; i++) {
    const w = st.words[i];
    const p = outQuint(seg(lt, W_IN + i * STAG, W_IN + i * STAG + W_DUR));
    op(w, clamp(p * 1.25));
    w.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * RISE).toFixed(2)}px)`;
  }
  const f = seg(lt, 0.02, 0.02 + POP);
  op(st.mh, clamp(f * 1.6));
  st.mh.style.transform = `scale(${lerp(0.55, 1, outBack(f)).toFixed(4)})`;
  st.mark.render(ctx.t || 0);
}

export default { id: 'end', dur, mount, render };