// The relay's Accounts panel, over the thread while the Claude task runs. Same rows, labels and bars as the Accounts
// tab on superbot.gg/features ("your plans and keys, one place. live limits on every plan." and "your plans, one
// endpoint."): a plan per row, a five-hour bar and a seven-day bar each. Every value stays below the top, so nothing
// on screen reads as a limit hit or a complaint (user ruling: solution only). Account names and percentages are made
// up for the spot. Everything is a pure function of the scene's local time; sizes are delivered-frame px (--k in ul.css).
import { seg, outCubic, outQuint, inOutCubic } from '../../lib.js';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const ROWS = [
  { vendor: 'Claude', who: 'sam@example.com', logo: 'claude-logo.svg', tile: 'claude', h5: 62, d7: 41 },
  { vendor: 'Claude', who: 'work@example.com', logo: 'claude-logo.svg', tile: 'claude', h5: 18, d7: 33 },
  { vendor: 'ChatGPT', who: 'Plus plan', logo: 'openai-logo.svg', tile: 'gpt', h5: 34, d7: 20 },
];

export function mountAccounts(root) {
  const ov = document.createElement('div');
  ov.className = 'ul-ov';
  ov.innerHTML = `<i class="ul-scrim"></i><div class="ul-ov-in">
    <h2 class="ul-cap">Every plan's limits, live.</h2>
    <div class="ul-panel">
      <div class="ul-ph"><b>Accounts</b><span>Plans and keys your Relay uses.</span></div>
      ${ROWS.map((r) => `<div class="ul-row">
        <span class="ul-tile ul-t-${r.tile}"><img src="${brand(r.logo)}" alt=""/></span>
        <span class="ul-name"><b>${r.vendor}</b><small>${r.who}</small></span>
        <span class="ul-bars">
          <span class="ul-line"><span class="ul-bar ul-b5"><i></i></span><em class="ul-l5">5h 0%</em></span>
          <span class="ul-line"><span class="ul-bar ul-b7"><i></i></span><em class="ul-l7">7d 0%</em></span>
        </span></div>`).join('')}
    </div>
    <p class="ul-foot">One endpoint for every plan and key.</p>
  </div>`;
  root.appendChild(ov);
  const rows = [...ov.querySelectorAll('.ul-row')].map((row, i) => ({
    row, d: ROWS[i], b5: row.querySelector('.ul-b5 i'), b7: row.querySelector('.ul-b7 i'),
    l5: row.querySelector('.ul-l5'), l7: row.querySelector('.ul-l7'), last: ['', ''],
  }));
  return { ov, scrim: ov.querySelector('.ul-scrim'), inner: ov.querySelector('.ul-ov-in'), cap: ov.querySelector('.ul-cap'), panel: ov.querySelector('.ul-panel'), foot: ov.querySelector('.ul-foot'), rows, on: false };
}

export function renderAccounts(c, t, w) {
  if (!c) return;
  const live = t >= w.t0 - 0.02 && t <= w.t1 + 0.02;
  if (live !== c.on) { c.ov.style.display = live ? 'block' : 'none'; c.on = live; }
  if (!live) return;
  const a = outCubic(seg(t, w.t0, w.t0 + 0.4)), z = inOutCubic(seg(t, w.t1 - 0.4, w.t1)), v = a * (1 - z);
  // opaque scrim: the panel reads clean, with no ghost of the thread under it (solution only, nothing else on screen)
  c.scrim.style.opacity = v.toFixed(3);
  c.inner.style.opacity = v.toFixed(3);
  c.inner.style.transform = `translateY(${((1 - a) * 22 + z * -14).toFixed(2)}px)`;
  const capIn = outQuint(seg(t, w.t0 + 0.1, w.t0 + 0.6));
  c.cap.style.opacity = capIn.toFixed(3);
  c.cap.style.filter = capIn >= 1 ? 'none' : `blur(${((1 - capIn) * 8).toFixed(2)}px)`;
  c.panel.style.opacity = outCubic(seg(t, w.t0 + 0.2, w.t0 + 0.55)).toFixed(3);
  c.rows.forEach((r, i) => {
    const t0 = w.t0 + 0.5 + i * 0.16;
    const p5 = outCubic(seg(t, t0, t0 + 0.7)), p7 = outCubic(seg(t, t0 + 0.1, t0 + 0.8));
    const v5 = r.d.h5 * p5, v7 = r.d.d7 * p7;
    r.b5.style.width = `${v5.toFixed(2)}%`;
    r.b7.style.width = `${v7.toFixed(2)}%`;
    const s5 = `5h ${Math.round(v5)}%`, s7 = `7d ${Math.round(v7)}%`;
    if (s5 !== r.last[0]) { r.l5.textContent = s5; r.last[0] = s5; }
    if (s7 !== r.last[1]) { r.l7.textContent = s7; r.last[1] = s7; }
    r.row.style.opacity = outCubic(seg(t, t0 - 0.15, t0 + 0.2)).toFixed(3);
  });
  const f = outCubic(seg(t, w.t0 + 1.75, w.t0 + 2.2));
  c.foot.style.opacity = f.toFixed(3);
  c.foot.style.transform = `translateY(${((1 - f) * 8).toFixed(2)}px)`;
}
