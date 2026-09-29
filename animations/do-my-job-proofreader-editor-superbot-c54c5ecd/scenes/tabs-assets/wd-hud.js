// wd-hud.js: superbot's HUD over the Word desk. It is the source spot's HUD (the do-my-job call-center spot's desk module renderHud,
// as the market-research remake carried it in qx.js), moved into its own module so word.js holds only Word: the step
// list, the markup lanes (the source's voice lanes: 26 deterministic bars each and a meter that ends in "matched"), the
// chip block (the source's resolver chips, one per style rule label) and the stats line. Its values are the source
// spot's, unchanged (wd-hud.css); nothing here is Word chrome. render(h, t, B) is a pure function of the desk clock.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, esc } from '../../lib.js';

const CHECK = '<svg class="wd-hi" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 12.6 9 16.8 19.2 6.6"/></svg>';

/** mountHud(host, ctx, C): C = { hud: [7 lines], steps: [4], laneYou, laneSb, laneMatch, matched, learn, chips: [labels], stats: [3] } */
export function mountHud(host, ctx, C) {
  const mark = ctx.shell.makeMark(26);
  const root = document.createElement('div');
  root.className = 'wd-hud';
  root.innerHTML = `
    <div class="wd-hud-h"><span class="wd-hud-mark"></span><span class="wd-hud-cur">${esc(C.hud[0])}</span></div>
    <ul class="wd-hud-steps">${C.steps.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="wd-hud-voice">
      <div class="wd-hud-lane"><b>${esc(C.laneYou)}</b><span class="wd-hud-bars" data-l="you"></span></div>
      <div class="wd-hud-lane sb"><b>${esc(C.laneSb)}</b><span class="wd-hud-bars" data-l="sb"></span></div>
      <div class="wd-hud-mh"><span>${esc(C.laneMatch)}</span><b class="wd-hud-ok">${CHECK}${esc(C.matched)}</b></div>
      <div class="wd-hud-meter"><i></i></div>
    </div>
    <div class="wd-hud-res"><b>${esc(C.learn)}</b><div class="wd-hud-chips">${C.chips.map((l) => `<span class="wd-hud-chip">${CHECK}${esc(l)}</span>`).join('')}</div></div>
    <div class="wd-hud-stats">${C.stats.map((s, i) => `<span>${esc(s)} <b class="wd-hs" data-i="${i}">0</b></span>`).join('')}</div>`;
  host.appendChild(root);
  root.querySelector('.wd-hud-mark').appendChild(mark.el);
  const q = (s) => root.querySelector(s);
  const lane = (which) => {
    const box = q(`.wd-hud-bars[data-l="${which}"]`);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  return {
    root, mark, C, cur: q('.wd-hud-cur'), steps: [...root.querySelectorAll('.wd-hud-steps li')],
    voice: q('.wd-hud-voice'), ok: q('.wd-hud-ok'), meter: q('.wd-hud-meter i'),
    res: q('.wd-hud-res'), chips: [...root.querySelectorAll('.wd-hud-chip')], stats: q('.wd-hud-stats'), hs: [...root.querySelectorAll('.wd-hs')],
    barsYou: lane('you'), barsSb: lane('sb'), YOU, OTHER: YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1)), chipsH: 0,
  };
}

/** the chip block's open height, measured once per layout (its max-height animates from 0 to this) */
export function measureHud(h) {
  h.res.style.maxHeight = 'none';
  h.chipsH = h.res.scrollHeight;
  h.res.style.maxHeight = '';
}

// a HUD section that unfolds over [a, b] and folds over [c, d]: h drives its height; its contents (o) fade in only once
// it is open and fade out before it folds, so no line is ever drawn half clipped by the moving edge
function reveal(t, a, b, c, d) {
  const hh = inOutCubic(seg(t, a, b)) * (1 - inOutCubic(seg(t, c, d)));
  const o = seg(t, b, b + 0.14) * (1 - seg(t, c - 0.14, c));
  return { h: hh, o };
}

const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };

/** B = { VOICE, LEARN_B, ANSWER, LAND, STEP_DONE }, stats = [three numbers already formatted] */
export function renderHud(h, t, B, stats) {
  const H = h.C.hud;
  const cur = t < 1.50 ? H[0] : t < B.VOICE.a ? H[1] : t < 4.30 ? H[2] : t < B.LEARN_B.a ? H[3] : t < 8.30 ? H[4] : t < B.LAND.a ? H[5] : H[6];
  setT(h.cur, cur);
  // each step is ACTIVE (bright label, pulsing green dot) while its beat runs and ticks when the beat lands
  h.steps.forEach((li, i) => {
    const done = t >= B.STEP_DONE[i];
    const on = !done && t >= (i === 0 ? 0 : B.STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', on);
    const dot = li.firstElementChild;
    if (on) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : B.STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px #34c759, 0 0 0 ${(1 + 4 * b).toFixed(2)}px rgba(52,199,89,${(0.42 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the markup panel (VOICE): no score, just "matched" with a check once the lanes agree
  const V = reveal(t, B.VOICE.a + 0.04, B.VOICE.a + 0.34, 4.40, 4.72), vo = V.h;
  h.voice.style.maxHeight = (124 * vo).toFixed(1) + 'px';
  h.voice.style.opacity = V.o.toFixed(3);
  if (vo > 0.01) {
    const cv = outCubic(seg(t, B.VOICE.a + 0.25, 4.15));
    const play = t * 2.6;
    for (let i = 0; i < 26; i++) {
      const swell = 0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play));
      h.barsYou[i].style.height = (3 + 21 * h.YOU[i] * swell).toFixed(2) + 'px';
      h.barsSb[i].style.height = (3 + 21 * lerp(h.OTHER[i], h.YOU[i], cv) * (0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play + 1.9)))).toFixed(2) + 'px';
      h.barsSb[i].style.opacity = (0.55 + 0.45 * cv).toFixed(3);
    }
    h.meter.style.width = (100 * cv).toFixed(1) + '%';
    const okp = outCubic(seg(t, 4.0, 4.3));
    h.ok.style.opacity = okp.toFixed(3);
    h.ok.style.transform = okp >= 1 ? 'none' : `scale(${lerp(0.8, 1, okp).toFixed(3)})`;
  }
  // the style rules superbot lifted (LEARN): one chip per rule label, as the source lifted its resolvers; the block
  // folds away once the pieces start, so the HUD stays small over the page
  const R = reveal(t, 6.55, 6.85, B.ANSWER.a + 0.35, B.ANSWER.a + 0.75);
  h.res.style.opacity = R.o.toFixed(3);
  h.res.style.maxHeight = (h.chipsH * R.h).toFixed(1) + 'px';
  const step = Math.min(0.15, 1.1 / Math.max(1, h.chips.length - 1));
  h.chips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * step, 6.62 + i * step + 0.4));
    n.style.opacity = (p * R.o).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  });
  const St = reveal(t, B.ANSWER.a - 0.2, B.ANSWER.a + 0.2, 1e6, 1e6 + 1);
  h.stats.style.opacity = St.o.toFixed(3);
  h.stats.style.maxHeight = (34 * St.h).toFixed(1) + 'px';
  stats.forEach((v, i) => setT(h.hs[i], v));
  h.mark.render(t);
}
