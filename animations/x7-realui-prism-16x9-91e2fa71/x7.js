// Shared story data for the x7 real-UI spots (91e2fa71): the agent task, the race clock,
// per-step timing on both endpoints, and the end card that carries the exact line.
// Every function here is pure in t, so any frame can be painted cold.
import { clamp, smooth, sp, outCubic, h, $$, op, tf, PRESETS, PLAN, listCost, makeMark } from './kit.js';

export const LINE = 'Superbot drop in replacement makes your agent run x7 faster.';
export const TASK = 'Migrate billing to the new Stripe API and open a PR';
export const OLD_HOST = 'api.openai.com/v1';
export const SB_HOST = 'beta.superbot.gg/v1';

// Same six steps on both endpoints, seconds of wall-clock each. Old: every step on one model behind
// one rate limit (a 429 back-off inside step 2). superbot: each step routed, the 14 edits fanned out.
// Sums: 168.0 s vs 24.0 s -> 7.0x.
export const STEPS = [
  { label: 'Plan the migration', old: 21, sb: 4.0, model: 'claude', badge: 'Opus 5.5' },
  { label: 'Read 212 files', old: 47, sb: 4.5, model: 'gemini', badge: 'Gemini 3.1 Pro', retry: [12, 32] },
  { label: 'Edit 14 files', old: 58, sb: 5.5, model: 'deepseek', badge: 'DeepSeek x14' },
  { label: 'Run the test suite', old: 3, sb: 3.0, model: null, badge: 'local' },
  { label: 'Fix 2 failing tests', old: 27, sb: 4.8, model: 'claude', badge: 'Opus 5.5' },
  { label: 'Open the pull request', old: 12, sb: 2.2, model: 'deepseek', badge: 'DeepSeek V4.1' },
];
export const OLD_TOTAL = STEPS.reduce((s, x) => s + x.old, 0); // 168
export const SB_TOTAL = STEPS.reduce((s, x) => s + x.sb, 0); // 24
export const RATIO = OLD_TOTAL / SB_TOTAL; // 7.0
// The old run bills every token to the API at list price (GPT-6.1 Sol, openrouter.ai, read 2026-10-05):
// 1.84M in + 92k out = $4.60. superbot bills the same work to the subscriptions in the key.
export const OLD_COST = listCost(PLAN.openai, 1.84e6, 92e3);

// Race clock: one shared time-lapse for both lanes so the ratio on screen is the real ratio.
// 10x until superbot finishes, a 0.5 s smoothstep ramp, then 50x until the old run finishes.
export const RACE = { r1: 10, r2: 50, ramp: 0.5 };
RACE.A = SB_TOTAL / RACE.r1; // 2.4 s of film
RACE.END = RACE.A + (OLD_TOTAL - SB_TOTAL + (RACE.r2 - RACE.r1) * RACE.ramp * 0.5) / RACE.r2; // 5.48 s
export function raceClock(lt) {
  const { r1, r2, ramp, A } = RACE;
  if (lt <= 0) return 0;
  if (lt <= A) return lt * r1;
  const u = lt - A;
  if (u <= ramp) { const x = u / ramp; return A * r1 + r1 * u + (r2 - r1) * ramp * (x * x * x - (x * x * x * x) / 2); }
  return Math.min(OLD_TOTAL, A * r1 + r1 * u + (r2 - r1) * (ramp * 0.5 + (u - ramp)));
}
export const speedX = (lt) => (lt < RACE.A + RACE.ramp * 0.5 ? RACE.r1 : RACE.r2);

// m:ss.t with tabular digits
export function fmt(sec) {
  const tt = Math.floor(Math.max(0, sec) * 10 + 1e-6); // whole tenths, so a digit never rounds up to 10
  const m = Math.floor(tt / 600), whole = Math.floor((tt % 600) / 10), tenth = tt % 10;
  return `${m}:${String(whole).padStart(2, '0')}.${tenth}`;
}

// Per-step state at displayed second d for one side ('old' | 'sb').
export function stepStates(d, side) {
  let acc = 0;
  return STEPS.map((s) => {
    const a = acc, len = s[side];
    acc += len;
    const f = clamp((d - a) / len);
    return { a, len, f, state: d >= acc ? 'done' : d >= a ? 'run' : 'wait', el: clamp(d - a, 0, len) };
  });
}

export const multX = (v) => `${v.toFixed(1)}×`;

// ---- end card: the mark, then the exact line set on two rows -----------------------
export function makeX7End() {
  const rowA = 'Superbot drop in replacement'.split(' ');
  const rowB = ['makes', 'your', 'agent', 'run'];
  const el = h(`<div class="endc x7end">
    <div class="face"></div>
    <div class="line l1">${rowA.map((w) => `<span>${w}</span>`).join(' ')}</div>
    <div class="line l2">${rowB.map((w) => `<span>${w}</span>`).join(' ')} <span class="em"><b>x7</b> faster.</span></div>
    <div class="url">beta.superbot.gg/v1</div>
  </div>`);
  const mark = makeMark(132);
  el.querySelector('.face').appendChild(mark.el);
  const face = el.querySelector('.face'), url = el.querySelector('.url');
  const spans = $$(el, '.line span');
  return {
    el, mark,
    render(lt) {
      const a = sp(lt, 0, PRESETS.heavy);
      tf(face, `translateY(${(1 - a) * 30}px) scale(${0.85 + 0.15 * a})`);
      op(face, smooth(lt / 0.3));
      spans.forEach((s, i) => {
        const t0 = 0.3 + i * 0.07 + (i >= 4 ? 0.12 : 0);
        const k = sp(lt, t0, PRESETS.default);
        tf(s, `translateY(${(1 - k) * 42}px)`);
        op(s, smooth((lt - t0) / 0.2));
      });
      spans[spans.length - 1].style.setProperty('--u', outCubic((lt - 1.25) / 0.55).toFixed(3));
      op(url, smooth((lt - 1.5) / 0.3));
      tf(url, `translateY(${(1 - sp(lt, 1.5, PRESETS.default)) * 16}px)`);
      mark.render(lt + 2);
    },
  };
}
