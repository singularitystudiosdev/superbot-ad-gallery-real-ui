// The details slot under each model's steps: one card per model, built in superbot's own card anatomy (raised
// #141416, 1px line, 16px radius, body 13/19, caption 11/16). Each painter is a pure function of t: parts arrive
// on superbot's switch-row motion (out-cubic, 6px rise) in a short stagger, bars grow on the same curve.
import { esc, seg, clamp } from '../../lib.js';
import { outCubic, standard } from './ease.js';
import { h } from './feed.js';

const rise = (el, a, px = 6) => {
  el.style.opacity = a.toFixed(3);
  el.style.transform = `translateY(${((1 - a) * px).toFixed(2)}px)`;
};

/** Gemini 3.8 Flash: the runner's baseline from 41 runs, four numbers */
export function baselineRow(stats) {
  const el = h(`<div class="ys-row nest"><div class="fx-card fx-stats">${stats.map((s) =>
    `<div class="st"><b>${esc(s.v)}<small>${esc(s.u)}</small></b><i>${esc(s.k)}</i></div>`).join('')}</div></div>`);
  return { el, parts: [...el.querySelectorAll('.st')] };
}
export function paintBaseline(c, t, T0) {
  c.parts.forEach((p, i) => rise(p, outCubic(seg(t, T0 + i * 0.08, T0 + i * 0.08 + 0.42))));
}

/** GPT-6 Astra: the goal, the 12-week mileage ramp and the four training paces */
export function planRow(goal, weeks, easy, paces) {
  const max = Math.max(...weeks);
  const total = weeks.reduce((a, b) => a + b, 0);
  const el = h(`<div class="ys-row nest"><div class="fx-card fx-plan">
    <div class="ph">
      <div class="goal"><i>Goal</i><b>${esc(goal.time)}</b></div>
      <div class="gm"><span>Half marathon, ${esc(goal.race)}</span><span>${esc(goal.pace)}/mi race pace</span></div>
      <div class="tot"><b>0</b><i>miles in 12 weeks</i></div>
    </div>
    <div class="bars">${weeks.map((w, i) => `<span class="bc"><i class="b${easy.includes(i) ? ' lo' : ''}" style="height:${(64 * w / max).toFixed(1)}px"></i><em>${i + 1}</em></span>`).join('')}</div>
    <div class="paces">${paces.map(([k, v]) => `<span class="pc"><i>${esc(k)}</i><b>${esc(v)}</b><small>/mi</small></span>`).join('')}</div>
  </div></div>`);
  const q = (s) => el.querySelector(s);
  return { el, total, head: q('.ph'), tot: q('.tot b'), bars: [...el.querySelectorAll('.b')], paces: [...el.querySelectorAll('.pc')] };
}
export function paintPlan(c, t, T0) {
  rise(c.head, outCubic(seg(t, T0, T0 + 0.42)));
  const B0 = T0 + 0.18, gap = 0.055;
  c.bars.forEach((b, i) => {
    const a = outCubic(seg(t, B0 + i * gap, B0 + i * gap + 0.5));
    b.style.transform = `scaleY(${a.toFixed(4)})`;
  });
  const n = Math.round(c.total * standard(seg(t, B0, B0 + c.bars.length * gap + 0.45)));
  if (c.tot.textContent !== String(n)) c.tot.textContent = String(n);
  const P0 = B0 + c.bars.length * gap * 0.6;
  c.paces.forEach((p, i) => rise(p, outCubic(seg(t, P0 + i * 0.07, P0 + i * 0.07 + 0.42))));
}

/** Claude Opus 5.5: week 1 as Garmin structured workouts, each one's steps written out in place */
export function weekRow(title, week) {
  const el = h(`<div class="ys-row nest"><div class="fx-card fx-week">
    <div class="wh">${esc(title)}</div>
    ${week.map((w) => `<div class="wr"><span class="d">${esc(w.day)}</span><b>${esc(w.name)}</b><span class="tx"><span class="typed"></span><span class="rest">${esc(w.steps)}</span></span></div>`).join('')}
  </div></div>`);
  const rows = [...el.querySelectorAll('.wr')].map((r) => ({ el: r, typed: r.querySelector('.typed'), rest: r.querySelector('.rest') }));
  return { el, head: el.querySelector('.wh'), rows };
}
export function paintWeek(c, t, T0, gap, cps, week) {
  rise(c.head, outCubic(seg(t, T0, T0 + 0.42)));
  c.rows.forEach((r, i) => {
    const s = T0 + 0.12 + i * gap;
    rise(r.el, outCubic(seg(t, s, s + 0.42)));
    const text = week[i].steps;
    const n = clamp(Math.floor((t - s - 0.1) * cps), 0, text.length);
    const a = text.slice(0, n);
    if (r.typed.textContent !== a) { r.typed.textContent = a; r.rest.textContent = text.slice(n); }
  });
}
