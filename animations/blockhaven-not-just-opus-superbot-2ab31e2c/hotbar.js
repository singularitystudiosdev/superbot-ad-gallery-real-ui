// The stage hotbar: a Minecraft HUD hotbar that runs over every scene of the spot. Its nine slots hold the models the
// spot is about (1 Claude Opus 5.5, 2 DeepSeek V4 Flash, 3 Gemini, 4 Meshy 5, 5 ElevenLabs, 6 Superbot; 7 to 9
// empty). Minecraft's GUI geometry, in GUI units u: the bar is 182x22, slot i's item is 16x16 at (3 + 20i, 3), the
// selection frame is 24x24 at (-1 + 20i, -1), and the held item's name sits centred above the bar. It is laid out at
// u = 4 (728x88 px) and scaled for the other sizes.
//
// Everything is a pure function of the global clock t and a schedule the timeline writes from its segment table
// (timeline.js hotbarSchedule): `pos` keys {t, cx, by, u} (centre x, bottom y, GUI scale; eased between keys), `op`
// keys {t, v}, `sel` keys {t, slot} (the frame hops in 0.1 s), `tip` keys {t, text, hold}, `fill` = the time each
// slot's item arrives (it pops in), and `drop` = the intro's dropped item {t0, tPick, tLand, x, y}: it bobs and turns
// where the post shattered, then flies into slot 1 (Minecraft's pickup) and lands at tLand.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from './lib.js';

const B = (f) => new URL('./brand/' + f, import.meta.url).href;

export const SLOTS = ['claude', 'deepseek', 'gemini', 'meshy', 'eleven', 'superbot'];
export const NAMES = {
  claude: 'Claude Opus 5.5', deepseek: 'DeepSeek V4 Flash', gemini: 'Gemini',
  meshy: 'Meshy 5', eleven: 'ElevenLabs', superbot: 'Superbot',
};
// chat.js routes by app key; Claude's key there is 'opus'
export const APP_SLOT = { opus: 0, claude: 0, deepseek: 1, gemini: 2, meshy: 3, eleven: 4, superbot: 5 };

const SB = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
const ICON = {
  claude: `<img alt="" src="${B('claude-logo.svg')}"/>`,
  // the simple-icons DeepSeek path has no fill of its own: masked and painted DeepSeek blue so it reads on the slot
  deepseek: `<i class="hb-mask" style="--m: url('${B('deepseek-logo.svg')}'); background: #4d6bfe"></i>`,
  gemini: `<img alt="" src="${B('gemini-logo.svg')}"/>`,
  meshy: `<img alt="" src="${B('meshy-logo.svg')}"/>`,
  eleven: `<img alt="" src="${B('elevenlabs-logo.svg')}"/>`,
  superbot: `<span class="hb-sb">${SB}</span>`,
};
export const iconHTML = (key) => ICON[key];

const U0 = 4; // layout scale (px per GUI unit)

export function mountHotbar(stage, before) {
  const root = document.createElement('div');
  root.id = 'hotbar';
  root.innerHTML = '<div class="hb-bar">'
    + Array.from({ length: 9 }, (_, i) => `<div class="hb-slot" style="left:${(1 + 20 * i) * U0}px"></div>`).join('')
    + SLOTS.map((k, i) => `<div class="hb-item hb-i-${k}" style="left:${(3 + 20 * i) * U0}px">${ICON[k]}</div>`).join('')
    + '<div class="hb-sel"></div>'
    + '</div><div class="hb-tip"></div>';
  const drop = document.createElement('div');
  drop.id = 'hb-drop';
  drop.innerHTML = `<div class="hb-drop-spin">${ICON.claude}</div>`;
  stage.insertBefore(root, before);
  stage.insertBefore(drop, before);
  return {
    root, drop, spin: drop.firstElementChild,
    items: [...root.querySelectorAll('.hb-item')],
    sel: root.querySelector('.hb-sel'),
    tip: root.querySelector('.hb-tip'),
    lastTip: null,
  };
}

// the value of a key track at t: each key starts easing toward its values at key.t over key.dur (0 = a cut), from
// wherever the track is at that moment, so a key that lands mid-move carries on smoothly
function track(keys, t, fields) {
  let o = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t < b.t) break;
    const p = b.dur ? inOutCubic(clamp((t - b.t) / b.dur, 0, 1)) : 1;
    const n = {};
    for (const f of fields) n[f] = lerp(o[f], b[f], p);
    o = n;
  }
  return o;
}

// where slot i's item centre is on the stage, for the bar at pos {cx, by, u}
export function slotCentre(pos, i) {
  return { x: pos.cx + (11 + 20 * i - 91) * pos.u, y: pos.by - 22 * pos.u + 11 * pos.u };
}

export function renderHotbar(h, t, S) {
  const pos = track(S.pos, t, ['cx', 'by', 'u']);
  const op = track(S.op, t, ['v']).v;
  const s = pos.u / U0;
  h.root.style.opacity = op.toFixed(3);
  h.root.style.visibility = op > 0.002 ? 'visible' : 'hidden';
  // top-left at (cx - 91u, by - 22u) in stage px; the u = 4 layout then scales about that corner (origin 0 0)
  h.root.style.transform = `translate(${(pos.cx - 91 * pos.u).toFixed(1)}px, ${(pos.by - 22 * pos.u).toFixed(1)}px) scale(${s.toFixed(4)})`;

  // items: each pops in at its fill time (slot 1 lands from the pickup flight instead of popping)
  h.items.forEach((n, i) => {
    const at = S.fill[i];
    const on = t >= at;
    n.style.visibility = on ? 'visible' : 'hidden';
    if (!on) return;
    const p = i === 0 ? 1 : outBack(seg(t, at, at + 0.24));
    const land = i === 0 ? 1 + 0.18 * Math.sin(Math.PI * clamp((t - at) / 0.16, 0, 1)) : 1;
    n.style.transform = `scale(${((0.25 + 0.75 * p) * land).toFixed(3)})`;
  });

  // selection frame: hops to the newest key's slot in 0.1 s
  let k = 0;
  while (k + 1 < S.sel.length && t >= S.sel[k + 1].t) k++;
  const cur = S.sel[k], prev = S.sel[Math.max(0, k - 1)];
  const hp = k === 0 ? 1 : outCubic(seg(t, cur.t, cur.t + 0.1));
  const sx = lerp(prev.slot, cur.slot, hp);
  h.sel.style.transform = `translateX(${((-1 + 20 * sx) * U0).toFixed(1)}px)`;

  // held-item name above the bar: in fast, holds, fades in 0.3 s
  let tk = null;
  for (const e of S.tip) if (t >= e.t) tk = e;
  let ta = 0;
  if (tk) ta = Math.min(seg(t, tk.t, tk.t + 0.06), 1 - seg(t, tk.t + tk.hold, tk.t + tk.hold + 0.3));
  if (tk && tk.text !== h.lastTip) { h.tip.textContent = tk.text; h.lastTip = tk.text; }
  h.tip.style.opacity = ta.toFixed(3);

  // the dropped item: pops out of the shatter, bobs and turns, then Minecraft's pickup pulls it into slot 1
  const D = S.drop;
  const dv = t >= D.t0 && t < D.tLand;
  h.drop.style.visibility = dv ? 'visible' : 'hidden';
  if (dv) {
    const age = t - D.t0;
    const bob = Math.sin(age * Math.PI * 2 * 0.9) * 12;
    const pop = outBack(seg(t, D.t0, D.t0 + 0.2));
    let x = D.x, y = D.y - 30 * pop + bob, size = 132 * (0.4 + 0.6 * pop);
    if (t >= D.tPick) {
      const f = outCubic(seg(t, D.tPick, D.tLand));
      const to = slotCentre(pos, 0);
      x = lerp(x, to.x, f);
      y = lerp(y, to.y, f) - Math.sin(Math.PI * f) * 90;
      size = lerp(size, 16 * pos.u, f);
    }
    h.drop.style.transform = `translate(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px)`;
    h.drop.style.width = h.drop.style.height = size.toFixed(1) + 'px';
    h.spin.style.transform = `rotateY(${((age * 140) % 360).toFixed(1)}deg)`;
  }
}
