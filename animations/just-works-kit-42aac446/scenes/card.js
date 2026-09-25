/* scenes/card.js: the black text card that sits between the ChatGPT beat and the hub.
   cfg.card = { text, hl } : the whole line is cfg.card.text, the substring cfg.card.hl is cut out and
   painted with the superbot storm gradient (which drifts with t) under a white shine band that sweeps
   once, exactly like the referent's "in one" card. Words rise and unblur in on the referent's timings.
   The card's exit is the engine's dip (the engine fades the section), so nothing here animates out.
   freeze/thaw: mount builds once, render is pure in lt (0..dur) and writes every moving value per frame. */
import { clamp, seg, outQuint, lerp, inOutCubic, op } from '../lib.js';

const DEFAULT_DUR = 2.8;
// the referent's card motion (seconds), and the geometry its words travel
const W_IN = 0.12, W_STAG = 0.06, W_DUR = 0.55, W_RISE = 18, W_BLUR = 8;
// the gradient tile: a seamless storm loop GRAD_P px wide, drifting left at GRAD_V px/s, plus a shine
const GRAD_P = 900, GRAD_V = 110, SHINE_DELAY = 0.08, SHINE_DUR = 0.9;
// seconds the settled card must sit still before the engine takes it away
const SETTLE_TAIL = 0.4;

let ST = null;

function dur(cfg) {
  const o = cfg && cfg.dur && cfg.dur.card;
  return o != null && isFinite(o) && +o > 0 ? +o : DEFAULT_DUR;
}

/** tokenize cfg.card.text, tagging the words that overlap cfg.card.hl */
function tokenize(text, hl) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const start = hl ? text.indexOf(hl) : -1;
  const end = start >= 0 ? start + hl.length : -1;
  let pos = 0;
  return tokens.map((word) => {
    const i = text.indexOf(word, pos);
    pos = i + word.length;
    return { word, grad: start >= 0 && i < end && i + word.length > start };
  });
}

function mount(sec, ctx) {
  const spec = (ctx.cfg && ctx.cfg.card) || {};
  const text = String(spec.text || '');
  const tokens = tokenize(text, spec.hl != null ? String(spec.hl) : '');

  const line = document.createElement('p');
  line.className = 'cl';
  const words = [], grads = [];
  tokens.forEach((tk, i) => {
    const w = document.createElement('span');
    w.className = 'w';
    if (tk.grad) {
      // the gradient lives on an inner span so the outer .w can carry the blur/rise without
      // fighting background-clip: text
      const gt = document.createElement('span');
      gt.className = 'gt';
      gt.textContent = tk.word;
      w.appendChild(gt);
      grads.push(gt);
    } else {
      w.textContent = tk.word;
    }
    words.push(w);
    if (i) line.appendChild(document.createTextNode(' '));
    line.appendChild(w);
  });
  sec.appendChild(line);

  const settle = W_IN + Math.max(0, words.length - 1) * W_STAG + W_DUR;
  const k = Math.min(1, (dur(ctx.cfg) - SETTLE_TAIL) / settle);
  ST = {
    cfg: ctx.cfg, sec, line, words, grads, k,
    in: W_IN * k, stag: W_STAG * k, rise: W_DUR * k, land: 0,
    rows: null, dirty: true, mw: 0, mar: '', fs: 1,
  };
  ST.land = ST.in + Math.max(0, words.length - 1) * ST.stag + ST.rise;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ST) ST.dirty = true; });
}

/** walk the offsetParent chain up to the line: a word mid-rise is transformed, which makes it the
    offsetParent of its gradient span, so a bare offsetLeft would read 0 during the entrance */
function offX(el, line) {
  let x = 0;
  while (el && el !== line) { x += el.offsetLeft; el = el.offsetParent; }
  return x;
}

/** the gradient phrase, per visual line: wrapping at the narrow ratios puts gradient words on two
    lines, and the storm has to run continuously along each of them, not across the wrap. */
function measureGrads(st) {
  const rows = new Map();
  for (const g of st.grads) {
    const host = g.parentElement;
    const y = host.offsetTop;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push({ g, x: offX(g, st.line), w: g.offsetWidth });
  }
  st.rows = [...rows.values()].map((items) => {
    const x0 = Math.min(...items.map((i) => i.x));
    const x1 = Math.max(...items.map((i) => i.x + i.w));
    return { items: items.map((i) => ({ g: i.g, dx: i.x - x0 })), W: Math.max(1, x1 - x0) };
  });
  st.dirty = false;
}

/** the card must fit every ratio: nowrap first, then balanced wrapping, then a font scale if the
    longest line still runs past the frame. Layout only, never time. */
function fitLine(st) {
  const line = st.line;
  st.fs = 1;
  line.style.setProperty('--card-fs', '1');
  line.classList.remove('wrap');
  const box = () => Math.max(1, line.clientWidth);
  if (line.scrollWidth <= box() + 1) return;
  line.classList.add('wrap');
  for (let i = 0; i < 3 && line.scrollWidth > box() + 1; i++) {
    st.fs = Math.max(0.6, st.fs * (box() / line.scrollWidth));
    line.style.setProperty('--card-fs', st.fs.toFixed(3));
  }
  st.dirty = true;
}

function renderGrads(st, lt) {
  const drift = ((lt * GRAD_V) % GRAD_P + GRAD_P) % GRAD_P;
  const f = inOutCubic(seg(lt, st.land + SHINE_DELAY, st.land + SHINE_DELAY + SHINE_DUR));
  for (const row of st.rows) {
    const band = row.W * 0.55;
    const sx = lerp(-band, row.W, f);
    for (const { g, dx } of row.items) {
      g.style.backgroundSize = `${band.toFixed(1)}px 100%, ${GRAD_P}px 100%`;
      g.style.backgroundPosition = `${(sx - dx).toFixed(1)}px 0, ${(-drift - dx).toFixed(1)}px 0`;
    }
  }
}

function render(lt, ctx) {
  const st = ST;
  if (!st) return;
  if (st.dirty || st.mw !== ctx.W || st.mar !== ctx.ar) {
    if (st.mw !== ctx.W || st.mar !== ctx.ar) { st.mw = ctx.W; st.mar = ctx.ar; fitLine(st); }
    if (st.grads.length) measureGrads(st);
    else st.dirty = false;
  }
  for (let i = 0; i < st.words.length; i++) {
    const w = st.words[i];
    const p = outQuint(seg(lt, st.in + i * st.stag, st.in + i * st.stag + st.rise));
    op(w, clamp(p * 1.15));
    w.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * W_RISE).toFixed(2)}px)`;
    w.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * W_BLUR).toFixed(2)}px)`;
  }
  if (st.grads.length) renderGrads(st, lt);
}

export default { id: 'card', dur, mount, render };