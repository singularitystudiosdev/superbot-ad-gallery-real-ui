// Shared bits of the race-day beats: the streamed reply line, the card rising in, small fades, the header status
// (a spinner that resolves to the green check) and the media URL helper. Pure functions of t, like every beat.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

export const media = (f) => new URL('../../../media/' + f, import.meta.url).href;
export const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// the model's reply line, streamed at cps from t0 (the hidden tail keeps the line's final width from the start)
export function sayLine(x, text, t0, cps = 100) {
  const n = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = n.firstElementChild, hid = n.lastElementChild;
  let shown = -1;
  return {
    n, end: t0 + text.length / cps,
    render(t) {
      const k = streamCount(text, t0, cps, t);
      if (k !== shown) { vis.textContent = text.slice(0, k); hid.textContent = text.slice(k); shown = k; }
    },
  };
}

// a card rising in: opacity, a small lift and a 0.97 -> 1 scale
export function rise(n, p, dy = 14) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${lerp(0.97, 1, e).toFixed(4)})`;
}

// a row or chip landing: opacity and a short lift
export function land(n, p, dy = 6) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}

// the header status: <span class="rk-st"><i class="rk-spin"></i>OK</span>; spins from t0, resolves at done
export const statusHTML = (x) => `<span class="rk-st"><i class="rk-spin"></i>${x.OK}</span>`;
export function statusRender(st, t, t0, done) {
  const spin = st.firstElementChild, ok = st.lastElementChild;
  const d = outCubic(seg(t, done, done + 0.2));
  spin.style.opacity = (1 - seg(t, done - 0.08, done + 0.06)).toFixed(3);
  spin.style.transform = `rotate(${((t - t0) * 420).toFixed(1)}deg)`;
  ok.style.opacity = d.toFixed(3);
  ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
}

// the camera's push onto a beat's card (zoom cut only; tabs.js FOCUS fills 90% of the frame width with it): in once
// the card is up, held while the model works, and pulled back at readEnd. The beat reports its end just before
// readEnd, so the next switch pill lands while the camera is still leaving the card and the pull glides straight
// onto it (chat.js starts the pill GAP 0.2 after end). The nozoom cut ends at readEnd and never moves.
export const FOCUS_PUSH = 0.4, FOCUS_PULL = 0.45;
export function withFocus(T, opts, from, readEnd) {
  if (opts && opts.zoom === false) { T.end = readEnd; return T; }
  T.focus = { sw: from, landed: from + FOCUS_PUSH, pull: readEnd, back: readEnd + FOCUS_PULL };
  T.end = readEnd - 0.12;
  return T;
}

// the card shell every beat uses: status, the model's logo, a label and a right-hand counter
export function cardHead(x, logo, label, right = '') {
  return `<div class="rk-hd">${statusHTML(x)}<img class="rk-logo" src="${x.brand(logo)}" alt=""><span class="rk-lb">${x.esc(label)}</span><span class="rk-cnt">${right}</span></div>`;
}
