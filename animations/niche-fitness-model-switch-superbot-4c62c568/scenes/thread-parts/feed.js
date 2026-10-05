// The superbot side: the empty state (mascot, greeting, composer) and the thread's rows, built to the shipped
// desktop app's anatomy (superbot-desktop packages/ui provider-switch.tsx + .css, message-row, composer):
// the user turn as a grey pill, the answer as switch pills ("Switching to X" / "Connecting to N") with a nest
// column under each (who header "X in superbot", step rows, a details slot), the composer's model chip.
// Every row is absolutely placed by thread.js; this file only makes markup and paints per-row state.
import { esc, clamp, seg, lerp } from '../../lib.js';
import { ICON } from '../../shell.js';
import { MS } from '../icons.js';
import { outCubic, outBack, sine } from './ease.js';

export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const lucide = (inner, cls = '') => `<svg class="lu ${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
export const SPIN = lucide('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', 'spin');
export const CHECK = lucide('<path d="M20 6 9 17l-5-5"/>', 'chk');
const CHEV = lucide('<path d="m6 9 6 6 6-6"/>', 'chev');
const MIC = lucide('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>');
const BUILD = lucide('<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>');
export const ms = (name, cls = '') => `<svg class="ms ${cls}" viewBox="0 0 24 24" aria-hidden="true">${MS[name]}</svg>`;
// the composer's superbot cat (hub-real .rc-cat, the same glyph shell.js draws)
const CAT = '<svg class="cat" viewBox="0 0 100 100" aria-hidden="true"><g fill="#fff"><path d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="#1a1a1c"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></svg>';
const tileImg = (src) => `<img src="${src}" alt="" draggable="false">`;

// ---------- the empty state and the composer ----------
export function buildApp(makeMark) {
  const el = h(`<div class="ys-app">
    <div class="ys-home"><div class="ys-mascot"></div><div class="ys-greet">Good evening. Where do we go?</div></div>
    <div class="ys-feed"><div class="ys-feed-in"></div></div>
    <div class="ys-comp"><div class="ys-rc">
      <div class="ys-draft"><span class="ys-hint">How can superbot help you today?</span><span class="ys-text"></span></div>
      <div class="ys-crow">
        <span class="ys-ib">${ICON.plus}</span>
        <span class="ys-seg"><span class="on">${ICON.chat}</span><span>${BUILD}</span></span>
        <span class="ys-super"><i></i>SUPER</span>
        <span class="ys-sp"></span>
        <span class="ys-chip"><span class="ys-chip-in"><span class="ys-chip-mark">${CAT}</span><span class="ys-chip-lbl">superbot</span>${CHEV}</span></span>
        <span class="ys-ib bare">${ICON.monitor}</span>
        <span class="ys-ib">${MIC}</span>
        <span class="ys-send">${ICON.send}</span>
      </div>
    </div></div>
  </div>`);
  const mark = makeMark(64);
  el.querySelector('.ys-mascot').appendChild(mark.el);
  const q = (s) => el.querySelector(s);
  return {
    el, mark, home: q('.ys-home'), feed: q('.ys-feed'), feedIn: q('.ys-feed-in'),
    comp: q('.ys-comp'), rc: q('.ys-rc'), hint: q('.ys-hint'), text: q('.ys-text'), send: q('.ys-send'),
    chip: q('.ys-chip'), chipIn: q('.ys-chip-in'), chipMark: q('.ys-chip-mark'), chipLbl: q('.ys-chip-lbl'),
  };
}
export const CAT_MARK = CAT;
export const chipMarkHTML = (m) => (m.tile ? tileImg(m.tile) : CAT);

// ---------- rows ----------
export const userRow = (text) => h(`<div class="ys-row ys-user"><span>${esc(text)}</span></div>`);

export function pillRow(m) {
  const el = h(`<div class="ys-row"><span class="ys-pill"><span class="ys-tile">${tileImg(m.tile)}</span><span class="ys-lbl"></span><span class="ys-stat">${SPIN}${CHECK}</span></span></div>`);
  const q = (s) => el.querySelector(s);
  return { el, tile: q('.ys-tile'), lbl: q('.ys-lbl'), spin: q('.spin'), chk: q('.chk') };
}

export const whoRow = (m) => h(`<div class="ys-row nest"><div class="ys-who"><span class="ys-tile">${tileImg(m.tile)}</span><b>${esc(m.label)}</b><i>in superbot</i></div></div>`);

export function stepRow() {
  const el = h(`<div class="ys-row nest"><div class="ys-step"><span class="ys-ss">${SPIN}${CHECK}</span><span class="ys-sl"></span><span class="ys-sd"></span></div></div>`);
  const q = (s) => el.querySelector(s);
  return { el, spin: q('.spin'), chk: q('.chk'), lbl: q('.ys-sl'), det: q('.ys-sd') };
}

/** the connect card (provider-switch.tsx ConnectCard): tile, title + body, Cancel while waiting, the primary
    button walking idle "Connect YouTube" -> spinner "Waiting for sign-in" -> check "Connected" */
export function connectRow(m, account, body) {
  const el = h(`<div class="ys-row nest"><div class="ys-cc">
    <span class="ys-cc-tile">${tileImg(m.tile)}</span>
    <span class="ys-cc-copy"><span class="cc cc0"><b>${esc(m.label)} isn't connected</b><i>${esc(body)}</i></span><span class="cc cc1"><b>${esc(m.label)} is connected</b><i>Signed in as ${esc(account)}</i></span></span>
    <span class="ys-cc-btns">
      <span class="ys-btn ghost ys-cancel">Cancel</span>
      <span class="ys-btn ys-pri"><i class="fill"></i>
        <span class="st st0">Connect ${esc(m.label)}</span>
        <span class="st st1">${SPIN}Waiting for sign-in</span>
        <span class="st st2">${CHECK}Connected</span>
      </span>
    </span>
  </div></div>`);
  const q = (s) => el.querySelector(s);
  return { el, cc: [q('.cc0'), q('.cc1')], btn: q('.ys-pri'), fill: q('.ys-pri .fill'), st: [q('.st0'), q('.st1'), q('.st2')], cancel: q('.ys-cancel'), spin: q('.st1 .spin') };
}

// ---------- per-frame painters (pure: state comes from t and the row's schedule) ----------
const spinT = (el, t) => { el.style.transform = `rotate(${((t * 360) % 360).toFixed(1)}deg)`; };

/** a switch pill: T = revealed, D = settled. Tile pops (scale .5 -> 1, -25deg -> 0, out-back, after 50ms), the
    label shimmers until D then reads solid, the spinner hands over to the check pop. lbl = [running, done] */
export function paintPill(p, t, T, D, lbl) {
  const tp = outBack(seg(t, T + 0.17, T + 0.57)); // 50ms after the row's content starts rising
  p.tile.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(3)}) rotate(${lerp(-25, 0, tp).toFixed(2)}deg)`;
  const done = t >= D;
  const text = done ? lbl[1] : lbl[0];
  if (p.lbl.textContent !== text) { p.lbl.textContent = text; p._w = 0; }
  p.lbl.classList.toggle('shim', !done);
  if (!done) {
    // the travelling band (provider-switch.css): 140% of the label per second across a 250% span
    if (!p._w) p._w = p.lbl.offsetWidth || 120;
    const L = p._w, period = 2.5 / 1.4;
    const cx = -0.6 * L + 2.2 * L * (((t - T) / period) % 1);
    p.lbl.style.backgroundPosition = `${(cx - 1.25 * L).toFixed(1)}px 0`;
  }
  spinT(p.spin, t);
  p.spin.style.opacity = (1 - seg(t, D - 0.08, D + 0.06)).toFixed(3);
  const c = seg(t, D, D + 0.3);
  p.chk.style.opacity = seg(t, D, D + 0.12).toFixed(3);
  p.chk.style.transform = `scale(${lerp(0.3, 1, outBack(c)).toFixed(3)})`;
}

/** a step row: S = started (spinner), E = done (check pop, label swaps) */
export function paintStep(s, t, S, E, lbl, det = ['', '']) {
  const done = t >= E;
  const text = done ? lbl[1] : lbl[0];
  if (s.lbl.textContent !== text) s.lbl.textContent = text;
  const d = done ? det[1] : det[0];
  if (s.det.textContent !== d) s.det.textContent = d;
  spinT(s.spin, t);
  s.spin.style.opacity = (1 - seg(t, E - 0.08, E + 0.06)).toFixed(3);
  s.chk.style.opacity = seg(t, E, E + 0.12).toFixed(3);
  s.chk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, E, E + 0.3))).toFixed(3)})`;
}

/** the connect card's primary button: idle -> waiting (W) -> connected (C); width tweens between the measured
    widths of its three states, the accent fill fades out as it stops being the call to action */
export function paintConnect(c, t, W, C, press) {
  if (!c._w) c._w = c.st.map((s) => s.offsetWidth + 24);
  const a = sine(seg(t, W, W + 0.28)), b = sine(seg(t, C, C + 0.28));
  const w = lerp(lerp(c._w[0], c._w[1], a), c._w[2], b);
  c.btn.style.width = `${w.toFixed(1)}px`;
  c.st[0].style.opacity = (1 - a).toFixed(3);
  c.st[1].style.opacity = (a * (1 - b)).toFixed(3);
  c.st[2].style.opacity = b.toFixed(3);
  c.fill.style.opacity = (1 - a).toFixed(3);
  c.btn.style.transform = `scale(${(1 - 0.05 * press).toFixed(3)})`;
  c.cc[0].style.opacity = (1 - b).toFixed(3);
  c.cc[1].style.opacity = b.toFixed(3);
  spinT(c.spin, t);
  c.cancel.style.opacity = (seg(t, W, W + 0.2) * (1 - seg(t, C - 0.1, C + 0.1))).toFixed(3);
}

/** a reply typing in place: the untyped rest is laid out but invisible, so the row never reflows */
export function paintTyping(r, text, t0, cps, t) {
  const n = clamp(Math.floor((t - t0) * cps), 0, text.length);
  const a = text.slice(0, n);
  if (r.typed.textContent !== a) { r.typed.textContent = a; r.rest.textContent = text.slice(n); }
}
