// The real superbot thread's switch pieces, shared by chat.js and the beats. Markup and motion follow the desktop app
// (superbot-desktop packages/ui/src/components/provider-switch/provider-switch.{tsx,css}, read 2026-10-06):
//   pill   [tile 20] "Switching to X" (a travelling sweep lights the label) [spinner 16] -> "Switched to X" [check]
//          a service reads "Connecting to X" -> "Connected to X"
//   nest   inset under the pill on a hairline rail: the who header ([tile] X  in superbot, chevron when it has
//          details), the step rows ([check 12] label  muted detail), then the details (each beat's card)
// Entrances are the app's own: a 10px rise with a fade over 0.42s on easeOutCubic, the tile popping from 0.5 and
// -25deg on easeOutBack 0.05s after its row, the check popping from 0.4 on easeOutBack. Pure functions of t.
import { lerp, seg, outCubic, outBack, esc } from '../../lib.js';

const svg = (cls, d) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const SPIN = svg('sb-spin', '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>');
export const CHECK = svg('sb-check', '<path d="M20 6 9 17l-5-5"/>');
export const CHEV = svg('sb-chev', '<path d="m6 9 6 6 6-6"/>');

export const RISE = 0.42;      // --duration-switch-row
const TILE_DELAY = 0.05;        // --duration-switch-tile-delay
const TILE_POP = 0.4;           // --duration-switch-tile
const CHECK_POP = 0.3;          // --duration-switch-check
const SWEEP = 250 / 140;        // one pass of the label's sweep (250% span at 140% a second)

export const tile = (src, cls = '') => `<span class="sb-tile ${cls}"><img src="${src}" alt=""/></span>`;

export function pillHtml(src, label) {
  return `<span class="sb-pill">${tile(src)}<span class="sb-pl"><span class="sb-ink">${esc(label)}</span></span><span class="sb-st">${SPIN}${CHECK}</span></span>`;
}
export function whoHtml(src, label, details = true) {
  return `<div class="sb-who">${tile(src)}<b>${esc(label)}</b><small>in superbot</small>${details ? CHEV : ''}</div>`;
}
export function stepHtml(label, detail = '') {
  return `<li class="sb-step"><span class="sb-ss">${SPIN}${CHECK}</span><span class="sb-sl">${esc(label)}</span>${detail ? `<span class="sb-sd">${esc(detail)}</span>` : ''}</li>`;
}

// a row's entrance: the switch's one rise
export function rise(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + RISE));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
  return p;
}

// a spinner turning from a, resolving to the check at b (spinner fades as the check pops)
export function status(spin, check, t, a, b) {
  spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
  spin.style.transform = `rotate(${(((t - a) * 360) % 360).toFixed(1)}deg)`;
  const c = seg(t, b, b + CHECK_POP);
  check.style.opacity = Math.min(1, c * 3).toFixed(3);
  check.style.transform = `scale(${lerp(0.4, 1, outBack(c)).toFixed(4)})`;
}

// the pill: rises in at a, its tile pops, the label sweeps while switching and swaps to the settled words at b
export function mountPill(node, words) {
  return { node, tile: node.querySelector('.sb-tile'), ink: node.querySelector('.sb-ink'), spin: node.querySelector('.sb-spin'), check: node.querySelector('.sb-check'), words, shown: null };
}
export function renderPill(p, t, a, b) {
  const tp = seg(t, a + TILE_DELAY, a + TILE_DELAY + TILE_POP);
  const e = outBack(tp);
  p.tile.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.5, 1, e).toFixed(4)}) rotate(${((1 - e) * -25).toFixed(2)}deg)`;
  status(p.spin, p.check, t, a, b);
  const settled = t >= b;
  const w = settled ? p.words[1] : p.words[0];
  if (w !== p.shown) { p.ink.textContent = w; p.shown = w; }
  p.node.classList.toggle('sb-live', !settled);
  // the sweep: a bright band crossing the muted label left to right, once every SWEEP seconds, while switching
  const ph = (((t - a) % SWEEP) + SWEEP) % SWEEP / SWEEP;
  p.ink.style.backgroundPosition = settled ? '' : `${(100 - ph * 100).toFixed(2)}% 0`;
}

// a step row: opens (its 20px height and the 4px gap above it ease in, so a row not yet started takes no room),
// rises at a, turns until b, then reads its settled label
export function mountStep(li, words) {
  return { li, spin: li.querySelector('.sb-spin'), check: li.querySelector('.sb-check'), label: li.querySelector('.sb-sl'), words, shown: null };
}
export function renderStep(s, t, a, b) {
  const p = rise(s.li, t, a, 8);
  s.li.style.height = p >= 1 ? '' : `${(20 * p).toFixed(2)}px`;
  if (s.li.previousElementSibling) s.li.style.marginTop = p >= 1 ? '' : `${(4 * p).toFixed(2)}px`;
  status(s.spin, s.check, t, a, b);
  const w = t >= b ? s.words[1] : s.words[0];
  if (w !== s.shown) { s.label.textContent = w; s.shown = w; }
  s.li.classList.toggle('sb-run', t < b);
}
