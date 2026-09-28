// The one-ask chat of japan-bikeride-every-model-superbot, inside the real hub (tabs.js mounts the hub).
//   0.00-0.30  empty thread, the composer focused with its caret
//   0.30-1.25  "Make me relaxing Japan bikeride" is typed, one character at a time on a deterministic jitter
//   1.30       send press (0.94 -> 1); 1.35-1.60 the ask's bubble rises into the thread, the composer clears
//   1.60-3.55  the switch burst: 14 "Switching to <Model>" pills, 0.24 s -> 0.16 s -> 0.10 s a slot, each entering at
//              the bottom of a stacked column while the older ones step up and dim; the last one is Veo 3
//   3.55-3.80  the video reply's slot opens under the last pill (tabs.js draws the card itself, in frame px)
// renderChat(c, t) is a pure function of the scene's local time (= master t: the scene starts at 0).
import { clamp, lerp, seg, outCubic, outQuint, outBack, esc, rand } from '../../lib.js';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;

// ---------- the beats ----------
export const ASK = 'Make me relaxing Japan bikeride';
export const TYPE0 = 0.30, TYPE1 = 1.25;       // first and last character land
export const SEND = 1.30;                        // the send button is pressed
export const BUB0 = 1.35, BUB1 = 1.60;           // the bubble rises (outQuint), the composer clears at BUB0
export const BURST0 = 1.60;                      // the first pill enters
export const CARD0 = 3.55, CARD1 = 3.80;         // the video reply's slot opens

// ---------- the roster (every logo is a sourced file in brand/, see brand/CREDITS.txt) ----------
// tile: the pill's tile class (jb-t-<tile> in chat.css) for brands with their own tile colour
const M = (name, logo, tile = '') => ({ name, logo: brand(logo), tile });
export const ROSTER = [
  M('Claude Opus 5.5', 'claude-logo.svg', 'claude'),
  M('Gemini 3 Pro', 'gemini-logo.svg'),
  M('GPT-5', 'openai-logo.svg', 'gpt'),
  M('DeepSeek V4', 'deepseek-logo.svg'),
  M('Grok 4', 'grok-logo.svg'),
  M('Midjourney v7', 'midjourney-logo.svg', 'mj'),
  M('Nano Banana', 'nanobanana-logo.svg'),
  M('Kling 2.5', 'kling-logo.svg'),
  M('Seedance', 'bytedance-logo.svg'),
  M('Hailuo 02', 'minimax-logo.svg'),
  M('Runway Gen-4', 'runway-logo.svg'),
  M('Lyria 2', 'gemini-logo.svg'),
  M('ElevenLabs', 'elevenlabs-logo.svg', 'eleven'),
  M('Veo 3', 'deepmind-logo.svg'),              // the video model: its slot runs until the reply lands
];
// the accelerating cadence: 2 slots of 0.24 s, 3 of 0.16 s, then 0.10 s (6 frames) each; the last slot (Veo 3)
// fills what is left up to CARD0 (0.19 s)
const SLOTS = (() => {
  const n = ROSTER.length, d = [];
  for (let i = 0; i < n - 1; i++) d.push(i < 2 ? 0.24 : i < 5 ? 0.16 : 0.10);
  let s = BURST0;
  const out = d.map((dur) => { const o = { s, d: dur }; s = +(s + dur).toFixed(4); return o; });
  out.push({ s, d: +(CARD0 - s).toFixed(4) });
  return out.map((o) => ({ ...o, ok: o.s + 0.6 * o.d }));  // the check pops at 60% of the slot
})();
export const BURST = SLOTS;

const ENTER = 0.12;     // a pill's entry (and the column's step up): outQuint
const LAG = 2 / 60;     // the new pill enters this long after the column starts stepping up
const CHECK = 0.09;     // the check's pop: scale 0.6 -> 1
const DIM = 0.45;       // an older pill's opacity
const ROWS = 5;         // rows in the column; the one above them fades out under the top mask

// ---------- typing: a deterministic per-character jitter, normalised so the last character lands at TYPE1 ----------
const KEYS = (() => {
  const n = ASK.length, w = [];
  for (let i = 1; i < n; i++) {
    let x = 0.62 + 0.76 * rand(i * 3 + 11);          // 0.62 .. 1.38 of the mean interval
    if (ASK[i] === ' ' || ASK[i - 1] === ' ') x *= 1.22; // a touch slower around word breaks
    w.push(x);
  }
  const sum = w.reduce((a, b) => a + b, 0), k = (TYPE1 - TYPE0) / sum;
  const at = [TYPE0];
  w.forEach((x) => at.push(at[at.length - 1] + x * k));
  return at;
})();
const typedCount = (t) => { let n = 0; while (n < KEYS.length && t >= KEYS[n] - 1e-6) n++; return n; };
const blinkOn = (t, period = 1.06) => ((t % period + period) % period) < period / 2;

const OK = '<svg class="jb-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  const feed = hub.querySelector('.feed');
  feed.innerHTML = '';
  const thread = el('<div class="jb-thread"></div>');
  feed.appendChild(thread);
  const u = el(`<div class="msg qc-u jb-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">you</span></div><div class="m-text">${esc(ASK)}</div></div></div>`);
  const burst = el('<div class="jb-burst"></div>');
  const pills = ROSTER.map((m, i) => {
    const p = el(`<div class="jb-pill"><span class="jb-tile${m.tile ? ` jb-t-${m.tile}` : ''}"><img src="${m.logo}" alt="" decoding="sync"/></span><span class="jb-lab">Switching to ${esc(m.name)}</span><span class="jb-st"><i class="jb-spin"></i>${OK}</span></div>`);
    burst.appendChild(p);
    return { p, slot: SLOTS[i], spin: p.querySelector('.jb-spin'), ok: p.querySelector('.jb-ok') };
  });
  const slot = el('<div class="jb-slot"></div>');
  thread.append(u, burst, slot);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, feed, thread, u, burst, pills, slot,
    ph, phText: ph.textContent.trim(), lastPh: null,
    send: hub.querySelector('.rc-send'),
    lay: null,
  };
}

// sizes that depend on the frame (tabs.js calls this when the design box changes): the pill is ~11% of the frame
// height (the star of the spot), shrunk only if its longest label would not fit the thread column; k = frame px
// per design px
export function layoutChat(c, k) {
  const colW = c.thread.clientWidth;
  if (!colW) return null;
  const REF = 100;
  c.hub.style.setProperty('--pill-f', (0.3 * REF) + 'px');
  const widest = Math.max(...c.pills.map(({ p }) => p.offsetWidth));
  const target = 0.11 * 1080 / k;
  const pillH = Math.min(target, colW * REF / widest);
  c.hub.style.setProperty('--pill-f', (0.3 * pillH).toFixed(3) + 'px');
  c.hub.style.setProperty('--hair', (1.2 / k).toFixed(3) + 'px');
  const gap = 0.17 * pillH;
  c.lay = {
    k, colW, pillH, gap, P: pillH + gap,
    rise: 0.22 * pillH,                     // a pill's entry travel
    uH: c.u.offsetHeight,                   // the ask's bubble
    ugap: 0.3 * pillH,                      // bubble -> first pill
    cardW: colW, cardH: colW * 9 / 16, cardGap: 0.22 * pillH,
    radius: 14,
  };
  c.slot.style.height = c.lay.cardH.toFixed(2) + 'px';
  return c.lay;
}

function renderComposer(c, t) {
  const n = t < BUB0 ? typedCount(t) : 0;
  const caretOn = t < BUB0 ? true : blinkOn(t - BUB0);
  const caret = `<i class="qc-caret${caretOn ? '' : ' off'}"></i>`;
  const ph = n > 0 ? `<span class="qc-typed">${esc(ASK.slice(0, n))}</span>${caret}` : `${caret}<span class="qc-hint">${esc(c.phText)}</span>`;
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', n > 0);
  // the press: down to 0.94 in 40 ms, back to 1 in 80 ms
  const s = t < SEND ? 1 : t < SEND + 0.04 ? lerp(1, 0.94, outCubic(seg(t, SEND, SEND + 0.04))) : lerp(0.94, 1, outCubic(seg(t, SEND + 0.04, SEND + 0.12)));
  c.send.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(4)})`;
}

const tf = (y) => `translate3d(0,${(-y).toFixed(2)}px,0)`;

export function renderChat(c, t) {
  if (!c || !c.lay) return;
  const L = c.lay;
  renderComposer(c, t);

  // per pill: the column's step up (pe, from the slot start) and the pill's own entry (pa, two frames later, so
  // the row it lands in has already been vacated and two labels never overlap)
  const pe = c.pills.map(({ slot }) => outQuint(seg(t, slot.s, slot.s + ENTER)));
  const pa = c.pills.map(({ slot }) => outQuint(seg(t, slot.s + LAG, slot.s + LAG + ENTER)));
  const all = pe.reduce((a, b) => a + b, 0);
  const rows = Math.min(ROWS, all);

  // the reply's slot opens at the bottom and lifts the whole thread
  const cr = outQuint(seg(t, CARD0, CARD1));
  const reserve = cr * (L.cardH + L.cardGap);
  // the slot rides up with the thread from just below it, like a new message scrolling in over the composer edge
  c.slot.style.transform = `translate3d(0,${((1 - cr) * (L.cardH + L.cardGap)).toFixed(2)}px,0)`;

  // the column: its box grows a row per pill up to ROWS, then its top fades out the row that leaves. It hangs
  // `pad` below the thread line so an entering pill (which starts `rise` low) is never cut by the mask box.
  const pad = 2 * L.rise;
  const boxH = rows * L.P + pad;
  c.burst.style.height = boxH.toFixed(2) + 'px';
  c.burst.style.width = L.colW.toFixed(2) + 'px';
  c.burst.style.transform = tf(reserve - pad);
  const m = 1.1 * L.P * seg(all, ROWS, ROWS + 1);
  const mask = m > 0.01 ? `linear-gradient(180deg, transparent 0px, #000 ${m.toFixed(2)}px)` : 'none';
  c.burst.style.webkitMaskImage = mask; c.burst.style.maskImage = mask;

  c.pills.forEach((x, i) => {
    let r = 0;
    for (let j = i + 1; j < pe.length; j++) r += pe[j];
    const p = pa[i];
    const vis = p * lerp(1, DIM, clamp(r)) * (1 - seg(r, ROWS - 1, ROWS));
    x.p.style.opacity = vis.toFixed(3);
    x.p.style.visibility = vis > 0.001 ? 'visible' : 'hidden';
    if (vis <= 0.001) return;
    x.p.style.transform = tf(pad + r * L.P - (1 - p) * L.rise);
    // spinner, then the check pops at 60% of the slot
    const ok = x.slot.ok;
    const sp = 1 - seg(t, ok - 0.02, ok + 0.03);
    x.spin.style.opacity = sp.toFixed(3);
    x.spin.style.transform = `rotate(${(((t - x.slot.s) * 900) % 360).toFixed(1)}deg)`;
    const f = seg(t, ok, ok + CHECK);
    x.ok.style.opacity = clamp(f * 2.5).toFixed(3);
    x.ok.style.transform = `scale(${lerp(0.6, 1, outBack(f)).toFixed(4)})`;
  });

  // the ask's bubble: rises out of the composer, then sits above the column
  const ub = outQuint(seg(t, BUB0, BUB1));
  const above = reserve + rows * L.P + (L.ugap - L.gap) * clamp(all);
  c.u.style.opacity = outCubic(seg(t, BUB0, BUB0 + 0.16)).toFixed(3);
  c.u.style.transform = tf(above - (1 - ub) * 0.9 * L.uH);
  return { cr };
}
