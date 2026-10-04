// The stage caption helper: one short line per beat, in the calm bottom strip (the race clip reserves its bottom
// 140 px, so a caption there never covers the CI graph or the race's status lines). No em/en dashes: the strings come
// from scenes/budget.js. mount(section, {text, at, off}) appends the caption element and returns render(lt).
import { seg, outCubic, esc } from '../lib.js';

export function mountCaption(section, { text, at = 0.18, dur = 1.5, in: fin = 0.3, out: fout = 0.25 } = {}) {
  const el = document.createElement('div');
  el.className = 'sb-cap';
  el.innerHTML = `<span class="sb-cap-in">${esc(text || '')}</span>`;
  section.appendChild(el);
  const inner = el.firstElementChild;
  return function renderCaption(lt) {
    const p = seg(lt, at, at + fin) * (1 - seg(lt, dur - fout, dur));
    el.style.opacity = p.toFixed(3);
    inner.style.transform = `translateY(${((1 - outCubic(seg(lt, at, at + fin))) * 16).toFixed(2)}px)`;
  };
}