// Shared pieces for the canvas beats: the thread-side receipt (a streamed line, tool chips that resolve, a file card
// pointing at the canvas) and the small timing helpers every beat uses. Markup reuses chat.css/ports.css's shared
// .ch-tool/.spin chip so a receipt reads like every other tool call in the hub; canvas.css styles the rest.
import { clamp, seg, outBack } from '../../../lib.js';

/** a streamed reply line: the untyped tail stays in the layout (transparent), so the line never reflows */
export function sayNode(x, text) {
  const n = x.el(`<div class="kt-say"><span class="kt-on"></span><span class="qc-hid"></span></div>`);
  n.dataset.text = text;
  return n;
}
export function renderSay(n, t, a, cps = 70) {
  const s = n.dataset.text, k = clamp(Math.floor((t - a) * cps), 0, s.length);
  if (n.dataset.k === String(k)) return;
  n.dataset.k = String(k);
  n.firstElementChild.textContent = s.slice(0, k);
  n.lastElementChild.textContent = s.slice(k);
}

/** tool chips: rows = [{ run, done, count? }] -> one .kt-tools column */
export function toolsNode(x, rows) {
  return x.el(`<div class="kt-tools">${rows.map((r) => `<span class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(r.run)}</span>${r.count ? `<span class="yt-count">${x.esc(r.count)}</span>` : ''}</span>`).join('')}</div>`);
}
/** at[i] = [appear, done] per row */
export function renderTools(n, t, rows, at) {
  [...n.children].forEach((chip, i) => {
    const [a, d] = at[i];
    const p = seg(t, a, a + 0.3);
    chip.style.opacity = p.toFixed(3);
    chip.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
    const isDone = t >= d;
    chip.classList.toggle('yt-chip-done', isDone);
    const spin = chip.querySelector('.spin');
    spin.classList.toggle('done', isDone);
    spin.style.transform = isDone ? 'none' : `rotate(${((t - a) * 400).toFixed(1)}deg)`;
    const label = isDone ? rows[i].done : rows[i].run;
    const tt = chip.querySelector('.ch-tool-t');
    if (tt.textContent !== label) tt.textContent = label;
    const cnt = chip.querySelector('.yt-count');
    if (cnt) cnt.style.display = isDone ? 'none' : '';
  });
}

/** the file card under a receipt: names the artifact the canvas is showing */
export function fileNode(x, app, name, meta) {
  return x.el(`<div class="kt-file">${x.tile(app)}<div><b>${x.esc(name)}</b><small>${x.esc(meta)}</small></div><span class="kt-open">Open in canvas</span></div>`);
}
export function renderPop(n, t, a) {
  const p = clamp(seg(t, a, a + 0.4));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px) scale(${(0.97 + 0.03 * outBack(p)).toFixed(4)})`;
}

/** count up to `to` between a and b, formatted by fmt */
export const countUp = (t, a, b, to, fmt = (v) => String(Math.round(v))) => fmt(to * clamp(seg(t, a, b)));
