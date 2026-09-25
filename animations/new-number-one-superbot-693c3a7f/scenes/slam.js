// slam.js: the week's new #1, four weeks running, each headline landing faster than the last.
// A flat news-desk look: a NEW #1 badge with a live dot, a week counter, the headline itself (brand tile + model name
// + "is the new #1."), and a leaderboard strip under it that flips the new #1 to the front every time. Everything is a
// pure function of the scene clock: the headline punches in from 1.26x with a 22px blur, the frame shakes on impact,
// a light streak sweeps across, and the whole beat is shorter than the one before it.
import { clamp, lerp, seg, outCubic, outQuint, esc } from '../lib.js';
import { SYMBOLS } from './tabs-assets/icons.js';

const tile = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;

// the four weeks, in order. Icons are the real marks: three from the tbs-ic registry (the ad series' own sprite) and
// Grok's shipped png tile; nothing here is drawn or invented.
const WEEKS = [
  { name: 'GPT-6', cls: 'openai', sym: 'openai' },
  { name: 'Claude Opus 5.5', cls: 'claude', sym: 'claude' },
  { name: 'Gemini 3', cls: 'gemini', sym: 'gemini' },
  { name: 'Grok 4.7', cls: 'grok', img: tile('grok.png') },
];
// how long each week's headline gets: the entrance and the hold both shrink, so the ad visibly speeds up
const BEAT = [{ in: 0.52, hold: 1.62 }, { in: 0.44, hold: 1.44 }, { in: 0.36, hold: 1.26 }, { in: 0.29, hold: 1.08 }];
const DUR = BEAT.reduce((a, b) => a + b.in + b.hold, 0);
const T0 = (() => { let a = 0; const out = []; for (const b of BEAT) { out.push(a); a += b.in + b.hold; } return out; })();
const OUT = 0.26;        // the headline leaves over its last OUT seconds (slides up + fades)
const CW = 262, GAP = 14; // the leaderboard chips' width and gap

const iconOf = (w) => (w.img
  ? `<img src="${w.img}" alt="">`
  : `<svg class="vz-ic"><use href="#tbs-ic-${w.sym}"/></svg>`);

export default {
  dur: DUR,
  id: 'slam',

  mount(section) {
    section.classList.add('sl');
    section.innerHTML = `<svg class="tbs-defs" aria-hidden="true" width="0" height="0">${SYMBOLS}</svg>
<i class="sl-glow"></i>
<div class="sl-top"><span class="sl-badge"><i class="sl-live"></i>NEW #1</span><span class="sl-wk">WK 01</span></div>
<div class="sl-weeks">${WEEKS.map((w, i) => `<article class="sl-week" data-w="${i}">
  <div class="sl-row"><span class="sl-ic c-${w.cls}">${iconOf(w)}</span><h1 class="sl-name">${esc(w.name)}</h1></div>
  <p class="sl-sub">is the new <em>#1</em>.</p>
</article>`).join('')}</div>
<div class="sl-rank">${WEEKS.map((w, i) => `<div class="sl-chip" data-c="${i}">
  <span class="sl-ct c-${w.cls}">${iconOf(w)}</span><b>${esc(w.name)}</b><em>01</em>
</div>`).join('')}</div>
<i class="sl-streak"></i><i class="sl-flash"></i>`;
    const q = (s) => section.querySelector(s);
    return {
      live: q('.sl-live'), badge: q('.sl-badge'), wk: q('.sl-wk'), glow: q('.sl-glow'),
      streak: q('.sl-streak'), flash: q('.sl-flash'),
      wks: WEEKS.map((w, i) => q(`.sl-week[data-w="${i}"]`)),
      subs: WEEKS.map((w, i) => q(`.sl-week[data-w="${i}"] .sl-sub`)),
      chips: WEEKS.map((w, i) => q(`.sl-chip[data-c="${i}"]`)),
      ranks: WEEKS.map((w, i) => q(`.sl-chip[data-c="${i}"] em`)),
    };
  },

  render(t, ctx) {
    const R = ctx.state;
    // the news desk's live dot: a slow throb, so the frame reads as "on air" between the slams
    const pulse = 0.5 + 0.5 * Math.sin(t * 8.4);
    R.live.style.transform = `scale(${(0.84 + 0.34 * pulse).toFixed(3)})`;
    R.badge.style.opacity = (0.88 + 0.12 * pulse).toFixed(3);
    R.glow.style.opacity = (0.16 + 0.07 * Math.sin(t * 1.7)).toFixed(3);

    // which week is on screen
    let wk = 0;
    for (let k = 0; k < WEEKS.length; k++) if (t >= T0[k]) wk = k;

    // the week counter flips over as the new one lands
    const wu = t - T0[wk];
    const wf = outCubic(clamp(wu / 0.22));
    R.wk.textContent = `WK ${String(wk + 1).padStart(2, '0')}`;
    R.wk.style.opacity = clamp(0.35 + 0.65 * wf).toFixed(3);
    R.wk.style.transform = `rotateX(${((1 - wf) * -68).toFixed(1)}deg)`;

    // the headlines: one on screen at a time, each one entering harder and faster than the week before
    for (let k = 0; k < WEEKS.length; k++) {
      const el = R.wks[k], sub = R.subs[k];
      const b = BEAT[k], total = b.in + b.hold;
      const u = t - T0[k];
      if (u < 0 || u >= total) { el.style.visibility = 'hidden'; el.style.opacity = '0'; continue; }
      el.style.visibility = 'visible';
      const e = outQuint(clamp(u / b.in));
      const ex = seg(u, total - OUT, total);
      const fl = clamp(1 - (u - b.in) / 0.3); // the impact, decaying over .3 s
      const dx = Math.sin((u - b.in) * 120) * 13 * fl * fl;
      const dy = Math.cos((u - b.in) * 91) * 9 * fl * fl;
      el.style.opacity = clamp(e * 1.4 * (1 - ex)).toFixed(3);
      el.style.transform = `translate(${dx.toFixed(2)}px,${(lerp(-34, 0, e) - 54 * ex).toFixed(2)}px) scale(${(lerp(1.26, 1, e) * lerp(1, 1.035, ex)).toFixed(4)})`;
      el.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 22).toFixed(2)}px)`;
      // "is the new #1." follows the name in, tighter every week
      const se = outQuint(seg(u, b.in * 0.55, b.in + 0.16));
      sub.style.opacity = clamp(se * 1.35 * (1 - ex)).toFixed(3);
      sub.style.transform = `translateY(${((1 - se) * 16).toFixed(2)}px)`;
    }

    // the light streak and the flash fire on the impact, and are the only things that carry across weeks
    let s = -1;
    for (let k = 0; k < WEEKS.length; k++) {
      const u = t - T0[k];
      if (u >= BEAT[k].in - 0.05 && u <= BEAT[k].in + 0.3) { s = k; break; }
    }
    if (s < 0) { R.streak.style.opacity = '0'; R.flash.style.opacity = '0'; }
    else {
      const a = BEAT[s].in - 0.05, u = t - T0[s];
      const f = seg(u, a, a + 0.35);
      R.streak.style.opacity = (Math.sin(Math.PI * f) * 0.9).toFixed(3);
      R.streak.style.transform = `translateX(${lerp(-720, 2140, outCubic(f)).toFixed(1)}px)`;
      R.flash.style.opacity = (0.16 * (1 - seg(u, BEAT[s].in, BEAT[s].in + 0.26))).toFixed(3);
    }

    // the leaderboard: the week's #1 chip travels to the front and the rest shift right, so the ranking visibly flips
    const prev = wk === 0 ? 0 : wk - 1;
    const flip = wk === 0 ? 1 : outCubic(clamp(wu / (BEAT[wk].in + 0.2)));
    for (let j = 0; j < WEEKS.length; j++) {
      const ch = R.chips[j];
      const from = (j - prev + WEEKS.length) % WEEKS.length;
      const to = (j - wk + WEEKS.length) % WEEKS.length;
      const idx = lerp(from, to, flip);
      const top = 1 - clamp(idx); // the #1 chip sits a hair higher and is the only one lit
      ch.style.transform = `translate(${(idx * (CW + GAP)).toFixed(2)}px,${(-8 * top).toFixed(2)}px)`;
      ch.classList.toggle('on', idx < 0.5);
      R.ranks[j].textContent = String(Math.min(4, Math.max(1, Math.round(idx) + 1))).padStart(2, '0');
    }
  },
};