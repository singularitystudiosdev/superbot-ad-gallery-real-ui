// every-model-one-chat-3d (forked from every-model-one-chat): the same superbot hub and the same three-request
// chat, rebuilt as a floating 3D panel hanging in a dark parallax void, with a keyframed camera on it.
// The hub's markup and its chat are untouched (hub-markup.js + tabs-assets/chat3d.js). What this file adds is
// outside the panel (.env3d: grid, dust, glows, backdrop word) or above it (.rig3d = the camera's rotation and
// handheld drift, .cam3d = its pan and dolly, .panel3d = the lit screen the hub sits on). render(lt) is still a
// pure function of local time: the camera is ONE key table built from the chat's own event times (BEATS[].k.* and
// cuesOf()), interpolated with seg/lerp, and every layer of the void parallaxes against the camera's pan.
// The scene keeps the id "tabs" so the hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, pointOf, cuesOf, feedScrollAt, BEATS, CHAT_T0, CHAT_END } from './tabs-assets/chat3d.js?v=14';
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic, press, placeCursor, rand } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const brand = (f) => new URL('../brand/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;
const DUR = CHAT_END + 0.4;
const bump = (p) => Math.sin(Math.PI * clamp(p));
const TAU = Math.PI * 2;

// the panel must float at every key, so the key table's z is read as a relative dolly and remapped onto a band
// that always leaves a margin of void: z 1.0 (which used to fill the frame width) becomes .749, the punch becomes
// .946. The design box is widened by the same difference (geo), so the type the panel carries keeps its old size.
const Z_SRC_LO = .82, Z_SRC_HI = 1.42, Z_OUT_LO = .70, Z_OUT_HI = .92, Z_GAMMA = 1.25;
const floatZ = (z) => Z_OUT_LO + (Z_OUT_HI - Z_OUT_LO) * Math.pow(clamp((z - Z_SRC_LO) / (Z_SRC_HI - Z_SRC_LO)), Z_GAMMA);

// the routing chips of the last beat whip the camera the other way (the "Switched to Superbot" chip lands with the
// orbit reversed) and the order landing is the hard punch; a key's own z stays in [.82, 1.42] and floatZ narrows
// that onto the panel's share of the frame, [.70, .92]
const CHIP_YAW = [-4, -3, 4], CHIP_ROLL = [-2, -2, 2];
const PUNCH_Z = 1.40, PUNCH_SHAKE = 15;
const DUST_MOTES = 60;
// the logo burst: the arriving mark's peak scale (an .burst-logo is 44px, so it peaks at 60px, which still clears
// the chip's label because it grows leftward out of the chip's own icon) and how many neighbours drift past
const BURST_PEAK = 1.36, DRIFT_N = 3;
// every brand the ad itself already shows, so a drifting neighbour is never a new claim
const LOGO_OF = {
  gemini: brand('gemini-logo.svg'), deepseek: brand('deepseek-logo.svg'), doordash: brand('doordash-logo.svg'),
  superbot: asset('mark-clean.svg'), openai: brand('openai-logo.svg'), cursor: brand('cursor-logo.svg'),
  reddit: brand('reddit-logo.svg'), lovable: brand('lovable-logo.svg'),
};
// the drift roster is walked from the chip's own model, so the neighbours are the models either side of it; it is
// ordered so the GPT-5 Codex mark (a black disc, invisible on the void) is never one of them
const ROSTER = ['gemini', 'deepseek', 'doordash', 'superbot', 'cursor', 'lovable', 'reddit', 'openai'];
// the burger beat's order lands here: the one hard punch and the only decaying shake in the cut
const PUNCH_AT = BEATS[BEATS.length - 1].k.T.placed;

let el = null;

// the design box: a thread-wide hub, laid out narrower than the frame so the float factor below keeps the type its
// old size (narrow ratios keep a readable column)
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  // pulled back far enough that every sent ask stays in frame through its whole answer (the DoorDash order is
  // the tallest) AND wide enough that the float factor below does not shrink the type: the camera's k is W/DW
  // and the panel floats at z*W, so the text on screen scales with (W/DW)*z, and 1.8 * the float band's .76
  // lands on the 1.3 * 1.06 the pre-float cut rendered its mid-cut copy at
  const DW = Math.max(460, Math.min(1480, W / 1.8));
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.panel.style.width = DW + 'px';
  el.panel.style.height = DH.toFixed(3) + 'px';
  el.geo = { W, DW, DH, k, lift: null, keys: null };
  return el.geo;
}

// how far the composer sits above its resting place in the empty state: just under the greeting, as a group
// centred in the frame
function lift(g) {
  if (g.lift !== null) return g.lift;
  const main = el.main.getBoundingClientRect();
  if (!main.height) return 0;
  const s = main.height / g.DH;
  const comp = el.composer.getBoundingClientRect(), hero = el.hero.getBoundingClientRect();
  const compH = comp.height / s, heroH = hero.height / s;
  const groupTop = (g.DH - (heroH + 34 + compH)) / 2;
  el.hero.style.top = groupTop.toFixed(2) + 'px';
  g.lift = (comp.top - main.top) / s - (groupTop + heroH + 34);
  return g.lift;
}

// ---------- the camera's key table ----------
// Built once per design width from the chat's own clock: every ask (k.send), every routing chip (chips[].sw and
// chips[].done), the model's answer (k.reply), whatever the beat marks (cuesOf) and the order landing (k.T.placed
// / k.T.eta). Each key aims either at a node — read from LAYOUT OFFSETS at the moment its cue fires, so a dolly
// lands on the chip / the meme / the order card at every ratio and at every scroll depth — or at a fixed point of
// the panel. camAt(t) interpolates them: outQuint into a whip key, inOutCubic otherwise.
function buildKeys(c, g) {
  const keys = [];
  const mid = { x: g.DW / 2, y: g.DH / 2, w: 0 };
  const at = (t, o) => { if (isFinite(t)) keys.push({ t, aim: mid, whip: false, ax: .5, ay: .5, z: 1, yaw: 0, pitch: 0, roll: 0, ...o }); };
  // a node's box in the panel's own px at time t: its live scroll offset is resolved for that moment, so the key
  // is where the node will BE when the cue fires, not where it is while the table is built. w is kept so a narrow
  // frame can hold the whole node instead of cutting its copy off (see the fit in camAt).
  const at0 = (node, t, fy = .5) => { const p = pointOf(c, node, feedScrollAt(c, t)); return p ? { x: p.x, y: p.top + fy * p.h, w: p.w, h: p.h, top: p.top } : null; };

  // the cut opens wide on the empty state and is already closing by 1.1s, so the first beats land on motion
  at(0, { z: .84, yaw: -8, pitch: 5, ay: .52 });
  at(1.1, { z: 1.0, yaw: -6, pitch: 4.5, ay: .51 });

  // which beat / chip each cue's node belongs to (cuesOf gives the node, the beat clocks give the role)
  const role = new Map();
  c.beats.forEach((b, i) => {
    if (b.u) role.set(b.u, { i, kind: 'ask' });
    b.sws.forEach((s, ci) => role.set(s.w, { i, ci, kind: 'chip', ch: s.c }));
    role.set(b.r, { i, kind: 'reply' });
    // whatever the beat itself marks (its answer's text, its card, its tool calls, its subreddit sweep)
    (b.inst.marks || []).forEach(([mt, node]) => role.set(node, { i, kind: 'beat', mt }));
  });

  for (const cue of cuesOf(c)) {
    const r = role.get(cue.node);
    if (!r) continue;
    const k = c.beats[r.i].k;
    if (r.kind === 'ask') {
      // the ask lands on the composer line: push in as it arrives
      at(cue.t, { z: r.i === 0 ? 1.24 : 1.06, yaw: -3, pitch: 2.6, ay: .74, aim: at0(cue.node, cue.t) || mid });
    } else if (r.kind === 'chip') {
      // whip + punch onto the routing chip as it lands, then settle onto whatever the beat does next
      const yaw = CHIP_YAW[r.i] === undefined ? -3 : CHIP_YAW[r.i];
      const roll = CHIP_ROLL[r.i] === undefined ? -2 : CHIP_ROLL[r.i];
      at(cue.t + 0.1, { whip: true, z: 1.30, yaw, pitch: 2, roll, ax: .5, ay: .48, aim: at0(cue.node, cue.t + 0.1) || mid });
      at(r.ch.done + 0.05, { z: 1.06, yaw: yaw * .3, pitch: 1.7, roll: 0, ax: .5, ay: .44, aim: at0(cue.node, r.ch.done + 0.05) || mid });
    } else if (r.kind === 'reply') {
      // the app answers: hold on its head (the who line and the first of the answer), not the middle of a card
      at(cue.t, { z: 1.10, yaw: -2, pitch: 1.5, ax: .5, ay: .62, aim: at0(cue.node, cue.t, .18) || mid });
    } else {
      if (cue.t <= k.reply + 0.02) continue;   // the answer's own text node, already covered by the reply key
      const p = at0(cue.node, cue.t);
      if (!p) continue;
      if (cue.node.querySelectorAll('.sc-sub').length > 1) {
        // the reddit sweep is a list: track down it, top then bottom
        const lo = at0(cue.node, cue.t + 0.85, .92);
        at(cue.t, { z: 1.16, yaw: -2, pitch: 1.2, roll: -1, ax: .5, ay: .36, aim: { x: p.x, y: p.top + p.h * .12, w: p.w } });
        if (lo) at(cue.t + 0.85, { z: 1.20, yaw: 1, pitch: 2, roll: 0, ax: .5, ay: .70, aim: { x: lo.x, y: lo.top + lo.h * .92, w: lo.w } });
      } else {
        // the meme as it resolves, the tool rows, the DoorDash order card: the taller the mark, the closer the push
        at(cue.t, { z: p.h > 300 ? 1.22 : 1.12, yaw: -2, pitch: 1.6, ax: .5, ay: .5, aim: { x: p.x, y: p.y, w: p.w } });
      }
    }
  }

  // the order lands: hard punch, then the eta pill lights, then the long pull-out that hands off to the end card
  const T = BEATS[BEATS.length - 1].k.T;
  const last = c.beats[c.beats.length - 1];
  const card = (last.inst.nodes || []).find((n) => n.classList && n.classList.contains('dd-card'));
  const eta = card && card.querySelector('.dd-eta');
  if (T && T.placed !== undefined) {
    at(T.placed, { whip: true, z: PUNCH_Z, yaw: 2, pitch: 1.2, roll: 2, ax: .5, ay: .52, aim: at0(card, T.placed, .55) || mid });
    at(T.eta, { z: 1.28, yaw: 2, pitch: 1.4, roll: 1, ax: .5, ay: .60, aim: at0(eta, T.eta) || mid });
  }
  at(DUR - 0.05, { z: .84, yaw: -8, pitch: 5, ay: .52 });

  // two keys closer than a frame's worth of story collapse into the later one (the chip's settle and the answer's
  // first line are 0.03s apart); a whip is never dropped
  keys.sort((a, b) => a.t - b.t);
  const out = [];
  for (const k of keys) {
    const p = out[out.length - 1];
    if (p && k.t - p.t < 0.15 && !p.whip) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

// the camera at t: one key table, evaluated as a pure function of t
function camAt(t, keys, g, W) {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  const f = !b || b.t <= a.t ? 1 : (b.whip ? outQuint(seg(t, a.t, b.t)) : inOutCubic(seg(t, a.t, b.t)));
  const mix = (p, q) => lerp(p, b ? q : p, f);
  const z = floatZ(clamp(mix(a.z, b ? b.z : a.z), Z_SRC_LO, Z_SRC_HI));
  const ax = mix(a.ax, b ? b.ax : a.ax), ay = mix(a.ay, b ? b.ay : a.ay);
  const aimX = mix(a.aim.x, b ? b.aim.x : a.aim.x), aimY = mix(a.aim.y, b ? b.aim.y : a.aim.y);
  const aimW = mix(a.aim.w || 0, ((b ? b.aim.w : a.aim.w) || 0));
  // a key that aims at a node never dollies past the point where that node would be cut off by the frame: on a
  // narrow frame the punch backs off enough to hold the whole order card, and at 16x9 (aimW .98W of the frame)
  // the factor is exactly 1, so the key table's own z stands as written
  const kz = g.k * z * (aimW > 0 ? Math.min(1, (W * .98) / (g.k * z * aimW)) : 1);
  // where the camera has to put the panel's origin for the aimed point to sit at (ax, ay) of the frame
  const dx = (ax * W - W / 2) / kz - aimX + g.DW / 2;
  const dy = (ay * H - H / 2) / kz - aimY + g.DH / 2;
  // the ordered! punch: a decaying shake on top of the dolly, an exact function of t
  let shx = 0, shy = 0;
  if (t > PUNCH_AT) {
    const dt = t - PUNCH_AT;
    const amp = PUNCH_SHAKE * Math.exp(-dt * 5.5) * Math.max(0, 1 - dt / 1.1);
    shx = amp * Math.sin(dt * 47);
    shy = amp * .7 * Math.sin(dt * 39 + 1.1);
  }
  // handheld drift: three sines on tx/ty/roll (6-10 px, 0.19-1.13 Hz) so no frame in the cut is ever static
  const driftX = 5.5 * Math.sin(TAU * .23 * t) + 3.5 * Math.sin(TAU * .71 * t + 1.7);
  const driftY = 5 * Math.sin(TAU * .31 * t + .6) + 3 * Math.sin(TAU * 1.13 * t + 2.4);
  const driftRoll = .35 * Math.sin(TAU * .19 * t + 2.1) + .22 * Math.sin(TAU * .61 * t + .4);
  return {
    kz, dx, dy, shx, shy, driftX, driftY,
    panX: kz * dx, panY: kz * dy,
    yaw: mix(a.yaw, b ? b.yaw : a.yaw), pitch: mix(a.pitch, b ? b.pitch : a.pitch),
    roll: mix(a.roll, b ? b.roll : a.roll) + driftRoll,
    punch: PUNCH_AT > 0 && t > PUNCH_AT ? Math.max(0, 1 - (t - PUNCH_AT) / 1.1) : 0,
  };
}

// ---------- the void ----------
// Every layer parallaxes against the camera's own pan at its own rate, so the panel reads as floating in front of
// a space that stays put. No reads here: only writes, all of them a function of t.
function renderVoid(t, cam, W, g) {
  const px = cam.panX, py = cam.panY;
  el.glowA.style.transform = `translate3d(${(-px * .05).toFixed(2)}px, ${(-py * .05).toFixed(2)}px, 0)`;
  el.glowB.style.transform = `translate3d(${(-px * .07).toFixed(2)}px, ${(-py * .07).toFixed(2)}px, 0)`;
  // two grid planes: the far one sits higher, at a shallower rake, with double-size cells and less than half the
  // scroll speed, so the void behind the panel reads as depth rather than as one scrolling floor. The scroll itself
  // is a transform on a taller inner layer (the parent keeps the rake, the parallax and the soft mask), never a
  // background-position write: that was the cut's first per-frame paint cost.
  el.gridFar.style.transform = `perspective(900px) rotateX(66deg) translate3d(${(-px * .11).toFixed(2)}px, ${(-py * .11).toFixed(2)}px, 0)`;
  el.gridFarBit.style.transform = `translate3d(0, ${(t * 26 % 168).toFixed(1)}px, 0)`;
  el.gridNear.style.transform = `perspective(900px) rotateX(72deg) translate3d(${(-px * .18).toFixed(2)}px, ${(-py * .18).toFixed(2)}px, 0)`;
  el.gridNearBit.style.transform = `translate3d(0, ${(t * 74 % 84).toFixed(1)}px, 0)`;

  // the backdrop word follows the routing chips: it names the model the last chip switched to, and every model
  // during the pull-out
  let word = el.word0, swapAt = -1;
  for (const ev of el.wordEvents) if (t >= ev.t) { word = ev.text; swapAt = ev.t; }
  if (word !== el.lastWord) { el.lastWord = word; el.wordText.textContent = word; el.word.style.fontSize = el.wordFit(word) + 'px'; }
  el.word.style.transform = `translate3d(${(-px * .12 + Math.sin(TAU * .047 * t) * W * .06).toFixed(1)}px, ${(-py * .12).toFixed(1)}px, 0)`;
  el.word.style.opacity = ((word === (el.wordEvents[el.wordEvents.length - 1] || {}).text ? .16 : .09)
    + .09 * bump(seg(t, swapAt - .2, swapAt + .3))).toFixed(3);
  el.wordText.style.backgroundPositionX = ((t * 14) % 320).toFixed(1) + '%';

  // the motes drift up and sideways from their seed and wrap, scaled by depth; the bokeh ones (every eighth) are
  // large, soft and parallax four times as hard, so the nearest of them reads as a defocused body close to the lens
  for (const m of el.dust) {
    const x = ((m.x + Math.sin(TAU * m.w * t + m.p) * m.a - m.px * m.pxr) % 1 + 1) % 1;
    const y = ((m.y - t * m.v - m.py * m.pxr) % 1 + 1) % 1;
    const s = m.s * (1 + m.breath * Math.sin(TAU * m.bw * t + m.bp));
    m.node.style.transform = `translate3d(${((x - .5) * W * 1.16).toFixed(1)}px, ${((y - .5) * H * 1.16).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
  }

  // the neighbours: while a chip is landing, the models either side of it drift across the frame BEHIND the panel
  // (blurred, dim, gone) - visible only in the margin the float keeps open, so they can never touch the chat text
  for (const d of el.drift) {
    const p = seg(t, d.ch.sw - 0.5, d.ch.done + 0.6);
    const live = p > 0 && p < 1;
    const w = d.w, s = d.sc * (0.85 + 0.4 * p);
    const x = lerp(d.from, d.to, p) * W - px * .10;
    const y = (d.y + d.a * Math.sin(TAU * d.f * t + d.p)) * H - py * .10;
    d.node.style.transform = `translate3d(${(x - w * s / 2).toFixed(1)}px, ${(y - w * s / 2).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    d.node.style.opacity = (live ? d.o * bump(p) : 0).toFixed(3);
  }
}

// ---------- the logo burst: one arriving mark per routing chip ----------
// Each chip's own logo (read off its tile at mount, so a route change needs no table here) flies in from depth
// toward the tile, overshoots, then collapses into it and dissolves as the tile's spin lands. It is anchored by its
// RIGHT edge to the chip's icon and grows leftward, over the chip's padding and the avatar gutter, so it never
// covers the chip's own label. Timing comes only from the chip's own clock (sw, swap, done); nothing here reads
// layout: the chip's tile is located by pointOf's offset chain, the same one the camera aims with.
function renderBurst(t) {
  for (const b of el.bursts) {
    const ch = b.ch;
    const pt = pointOf(el.chat, b.tile);
    const f = seg(t, ch.sw - 0.12, ch.sw + 0.42);
    const dl = seg(t, ch.swap - 0.02, ch.swap + 0.46);
    if (!pt || (f <= 0 && dl <= 0) || t > ch.done + 0.3) { b.node.style.opacity = '0'; continue; }
    const grow = lerp(0.28, BURST_PEAK, outBack(f)) * lerp(1, 0.42, outCubic(dl));
    const rx = pt.x + pt.w / 2, cy = pt.y;
    b.node.style.transform = `translate3d(${(rx - 44).toFixed(1)}px, ${(cy - 22).toFixed(1)}px, 0)`
      + ` scale(${grow.toFixed(3)}) rotate(${((1 - f) * -12).toFixed(2)}deg)`;
    b.node.style.opacity = (clamp(f * 3.4) * (1 - dl)).toFixed(3);
    b.node.style.filter = `blur(${((1 - outCubic(f)) * 13 + dl * 6).toFixed(2)}px)`;
  }
}

// ---------- the cursor ----------
// No beat hands chat3d a pointer target, so the synthetic cursor (makeCursor, placed by lib.placeCursor) is dark
// for the whole cut. The two places it is due are driven from here, off the chat's own clock: every ask's send
// control just before its send (with the click dip), and every chip just after it lands. Both targets come from the
// offset chains (pointOf on the chat's own nodes); outside those windows the pointer is hidden.
function renderCursor(t) {
  const c = el.chat, P = c.pointer;
  let tip = null, press0 = 0, v = 0;
  for (const b of c.beats) {
    const s = b.k.send;
    if (!b.k.ask || t < s - 0.24 || t > s + 0.4) continue;
    const p = pointOf(c, c.send);
    if (!p) continue;
    // the composer is still gliding down out of its empty-state lift while the send is pressed, and the lift is a
    // transform (pointOf reads offsets, which ignore it), so the cursor has to carry the same offset to stay on the
    // button the viewer sees
    tip = { x: p.x - 4, y: p.y - 7 - el.liftNow };
    press0 = press(t, s);
    v = seg(t, s - 0.22, s - 0.08) * (1 - seg(t, s + 0.14, s + 0.40));
  }
  if (!tip) for (const b of c.beats) {
    for (let j = 0; j < b.k.chips.length; j++) {
      const ch = b.k.chips[j], s = b.sws[j];
      // after the chip has finished sliding up into the thread (its scroll glide ends at sw + 0.45) and before the
      // reply it triggers appears at done + 0.08, so the cursor never sits over a line of text
      if (!s || t < ch.sw + 0.36 || t > ch.done - 0.04) continue;
      const p = pointOf(c, s.sw.firstElementChild);
      if (!p) continue;
      // it glides in from below-right of the chip and comes to rest just under its icon, pointing up at it
      const gl = inOutCubic(seg(t, ch.sw + 0.36, ch.sw + 0.70));
      tip = { x: lerp(p.x + 26, p.x - 2, gl), y: lerp(p.y + 30, p.top + p.h + 9, gl) };
      v = seg(t, ch.sw + 0.36, ch.sw + 0.52) * (1 - seg(t, ch.done - 0.30, ch.done - 0.04));
    }
  }
  if (tip) placeCursor(P, tip.x, tip.y, press0, v); else P.style.opacity = '0';
}

export default {
  id: 'tabs',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="ask-root ask3d">
  <div class="env3d">
    <div class="glowA"></div>
    <div class="glowB"></div>
    <div class="grid gf"><i></i></div>
    <div class="grid gn"><i></i></div>
    <div class="dust">${'<i></i>'.repeat(DUST_MOTES)}</div>
    <div class="env-word"><b></b></div>
  </div>
  <div class="rig3d"><div class="cam3d"><div class="panel3d">
    <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  </div></div></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    // the composer as the empty state shows it: SUPER is a switch (off), the platform chip names the model
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = {
      section, hub, main, hero, composer: hub.querySelector('.composer'), geo: null,
      site: q('.sbsite'), rig: q('.rig3d'), cam: q('.cam3d'), panel: q('.panel3d'),
      env: q('.env3d'), arena: q('.arena'),
      gridFar: q('.grid.gf'), gridFarBit: q('.grid.gf i'), gridNear: q('.grid.gn'), gridNearBit: q('.grid.gn i'),
      glowA: q('.glowA'), glowB: q('.glowB'),
      word: q('.env-word'), wordText: q('.env-word b'), word0: '', lastWord: null, wordFit: null,
      dust: [], drift: [], bursts: [], wordEvents: [], liftNow: 0,
    };
    el.chat = mountChat(hub);

    // the backdrop word names the model the composer is on at t=0 (the platform chip), then follows every routing
    // chip: the chip's own label carries the name ("Switching to Gemini" -> GEMINI), and the pull-out lands on the
    // line the end card then holds
    el.word0 = el.chat.pLabel.textContent.trim().toUpperCase();
    el.chat.beats.forEach((b) => b.k.chips.forEach((ch, ci) => {
      const lab = b.sws[ci] && b.sws[ci].w.querySelector('.qc-swl');
      const name = lab ? lab.textContent.split(/\s+to\s+/).pop().trim().toUpperCase() : '';
      if (name) el.wordEvents.push({ t: ch.swap, text: name });
    }));
    el.wordEvents.sort((a, b) => a.t - b.t);
    el.wordEvents.push({ t: BEATS[BEATS.length - 1].k.T.eta + .25, text: 'EVERY MODEL' });

    // the motes: seeded once, so a mote's drift never changes per frame. Every eighth is a bokeh body - large,
    // softly out of focus, four times the parallax of the fine dust - so the void has a near layer as well as a far
    el.dust = [...section.querySelectorAll('.dust i')].map((node, i) => {
      const seed = i + 1, bokeh = i % 8 === 0, s = .55 + .95 * rand(seed * 3.7);
      const size = bokeh ? 30 + 46 * rand(seed * 3.1) : 2.2 + 3.4 * rand(seed * 13.3);
      node.style.width = node.style.height = size.toFixed(2) + 'px';
      node.style.opacity = (bokeh ? .10 + .12 * rand(seed * 7.1) : .22 + .5 * rand(seed * 7.1)).toFixed(3);
      if (bokeh) node.style.filter = `blur(${(5 + 7 * rand(seed * 17.9)).toFixed(1)}px)`;
      return {
        node, s, pxr: bokeh ? .30 : .10,
        x: rand(seed * 1.7), y: rand(seed * 5.3), p: TAU * rand(seed * 9.1),
        w: .04 + .12 * rand(seed * 11.9), a: .01 + .05 * rand(seed * 2.3),
        v: bokeh ? .002 + .006 * rand(seed * 4.7) : .004 + .022 * rand(seed * 4.7),
        breath: bokeh ? .08 + .12 * rand(seed * 23.3) : 0,
        bw: .05 + .09 * rand(seed * 29.1), bp: TAU * rand(seed * 31.7),
        px: 0, py: 0,
      };
    });

    // the logo burst: one arriving mark per routing chip. The mark is the chip's OWN tile art, read off the node
    // the chip already built, so ?route= needs no table and Superbot's CSS mark arrives as its cat. The neighbours
    // are the models either side of it in the ad's own roster, and they drift under the panel, behind the void.
    el.chat.beats.forEach((b) => b.k.chips.forEach((ch, ci) => {
      const s = b.sws[ci];
      if (!s) return;
      const tile = s.sw.firstElementChild;
      const own = tile.querySelector('img');
      const node = document.createElement('img');
      node.className = 'burst-logo'; node.alt = ''; node.decoding = 'sync';
      node.src = own ? own.src : (LOGO_OF[ch.app] || '');
      el.arena.appendChild(node);
      el.bursts.push({ ch, tile, node });
      const own_at = ROSTER.indexOf(ch.app);
      for (let i = 0; i < DRIFT_N; i++) {
        const d = document.createElement('img');
        d.className = 'drift-logo'; d.alt = ''; d.decoding = 'sync';
        d.src = LOGO_OF[ROSTER[(own_at + 1 + i) % ROSTER.length]] || '';
        el.env.appendChild(d);
        const sd = ci * 7 + i * 3 + 1, left = i % 2 === 0;
        d.style.filter = `blur(${(7 + 11 * rand(sd * 17.9)).toFixed(1)}px)`;
        el.drift.push({
          ch, node: d, w: 150, sc: .5 + .45 * rand(sd * 23.1),
          from: left ? -.14 - .1 * rand(sd * 2.7) : 1.14 + .1 * rand(sd * 2.7),
          to: left ? 1.14 + .1 * rand(sd * 3.3) : -.14 - .1 * rand(sd * 3.3),
          y: .16 + .68 * rand(sd * 5.9), a: .04 + .09 * rand(sd * 7.7), f: .05 + .09 * rand(sd * 11.3),
          p: TAU * rand(sd * 13.1), o: .16 + .16 * rand(sd * 19.3),
        });
      }
    }));
    // the word is measured with a canvas (never a layout read) so a long model name still fits the frame
    const cv = document.createElement('canvas').getContext('2d');
    el.wordFit = (text) => {
      const cs = getComputedStyle(el.word);
      cv.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
      const w100 = Math.max(1, cv.measureText(text).width);
      return Math.round(Math.min(300, Math.max(44, ((el.W || 1920) * .86) / (w100 / 100))));
    };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    el.W = W;
    // measurement happens on an UN-transformed tree: the rig and the camera are cleared first, so lift() and the
    // beats' cursor boxes read layout px (and the cursor, which lives inside the panel, lands in panel px)
    el.rig.style.transform = 'none';
    el.cam.style.transform = 'none';
    const g = geo(W);
    const up = lift(g);

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.liftNow = up * (1 - drop);   // the cursor carries this so it stays on the send control while the composer drops
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-el.liftNow).toFixed(2)}px)`;
    const heroIn = outCubic(seg(t, 0.15, 0.8));
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);

    // then the camera and the void, on top of a tree that has already been laid out and measured
    if (!g.keys) g.keys = buildKeys(el.chat, g);
    // QA hook, in the same spirit as window.__V7.T: the camera's key table, so a capture script can name the cut's
    // beats and a reviewer can check the dolly aims without reading the source
    if (!window.__CUT3D || window.__CUT3D.keys !== g.keys) window.__CUT3D = { keys: g.keys };
    const cam = camAt(t, g.keys, g, W);
    for (const m of el.dust) { m.px = cam.panX; m.py = cam.panY; }
    el.cam.style.transform = `translate(${(W / 2 + cam.shx).toFixed(2)}px, ${(H / 2 + cam.shy).toFixed(2)}px)`
      + ` scale(${cam.kz.toFixed(5)}) translate(${(-g.DW / 2 + cam.dx).toFixed(2)}px, ${(-g.DH / 2 + cam.dy).toFixed(2)}px)`;
    el.rig.style.transform = `translate3d(${cam.driftX.toFixed(2)}px, ${cam.driftY.toFixed(2)}px, 0)`
      + ` rotateX(${cam.pitch.toFixed(3)}deg) rotateY(${cam.yaw.toFixed(3)}deg) rotateZ(${cam.roll.toFixed(3)}deg)`;
    renderVoid(t, cam, W, g);
    renderBurst(t);
    renderCursor(t);
  },
};