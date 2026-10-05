// The composer's model chip (.rc-plat): it names the model that is running. On a switch the old name slides up and
// out while the new one rises in, and the chip's width eases between the two names, so the composer row never jumps.
// All of it is a function of t; the names' widths are read once the fonts have landed.
import { seg, lerp, inOutCubic } from '../../lib.js';

const LEAD = 0.25;   // the chip switches this long before the step's card opens
const SWITCH = 0.5;  // the slide + width ease
const DY = 9;
const SB = '<span class="qc-pi-sb"><i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i></span>';

export function mountChip(plat, mods, brand) {
  const list = [{ app: 'superbot', name: 'superbot' }, ...mods.map((m) => ({ app: m.app, name: m.chip || m.model, logo: m.logo }))];
  const chev = plat.querySelector('.rc-chev');
  plat.textContent = '';
  const stack = document.createElement('span');
  stack.className = 'pl-stack';
  const items = list.map((x) => {
    const n = document.createElement('span');
    n.className = 'pl-it';
    n.innerHTML = `<span class="qc-pi">${x.app === 'superbot' ? SB : `<img data-app="${x.app}" src="${brand(x.logo)}" alt=""/>`}</span><span class="pl-nm">${x.name}</span>`;
    stack.appendChild(n);
    return n;
  });
  plat.append(stack);
  if (chev) plat.append(chev);
  return { stack, items, W: null, done: false };
}

export function renderChip(c, t, steps) {
  if (!c.done) {
    c.W = c.items.map((n) => n.offsetWidth);
    c.done = !document.fonts || document.fonts.status === 'loaded';
  }
  let idx = 0;
  steps.forEach((s, i) => { if (t >= s.t0 - LEAD) idx = i + 1; });
  const sw = idx ? steps[idx - 1].t0 - LEAD : -1;
  const p = idx ? inOutCubic(seg(t, sw, sw + SWITCH)) : 1;
  c.items.forEach((n, j) => {
    let o = 0, y = 0;
    if (j === idx) { o = p; y = (1 - p) * DY; }
    else if (j === idx - 1) { o = 1 - p; y = -DY * p; }
    n.style.opacity = o.toFixed(3);
    n.style.transform = y ? `translate3d(0,${y.toFixed(2)}px,0)` : 'none';
    n.style.visibility = o > 0.001 ? 'visible' : 'hidden';
  });
  const w = idx ? lerp(c.W[idx - 1], c.W[idx], p) : c.W[0];
  c.stack.style.width = w.toFixed(2) + 'px';
}
