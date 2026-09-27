// The build tray: the cold open's X-ray teardown, shrunk to a card that rides beside the chat and fills back in as
// each model finishes its part. It shows the frozen frame (img/tkr/freeze-1280.jpg) in the same X-ray look play.js
// opens on (desaturated, faint blueprint grid) with every HUD piece cut out as an empty dashed slot at its
// img/tkr/xray.json rect. When a step's beat ends (STEPS[i].t1) its piece snaps into the slot in full colour (the real
// crop from img/tkr/hud/*.png, kart.png or board.png) with a 160ms scale-settle, and that model's logo pip lands in the
// column beside the card:
//   DeepSeek V4 Flash    -> the item box
//   Gemini               -> the standings
//   Nano Banana Pro      -> the TURBO KART RALLY board (a strip slot along the picture's top edge: no HUD rect)
//   Lyria 2 + ElevenLabs -> a waveform strip along the card's bottom edge (music bars, then SFX bars)
//   Claude Opus 5.5      -> the minimap, the kart and the lap counter (the HUD it writes in hud.js)
//   GPT-5 Codex          -> the speed gauge
//   GitHub               -> a small 'pushed' check on the card's header
// The header counts the parts up ('turbo kart rally · n/7 parts'). Just before play.js's window appears on the same
// frozen frame (the play beat's T.v0) the tray fades out over 150ms, so the full-size frame takes over from it.
//
// The card lives in the hub's .main, in hub px, so it scales with the thread. It docks just above the composer's
// right end, centred in the room between the widest beat's right edge and the hub's edge: full size at 16:9, shrunk to
// fit at 4:3, and hidden at 1:1 and 4:5, where the thread fills the width and there is no such room. renderTray(tr, t) is a pure
// function of the scene's local time: every moving value is written from t, so a scrub or a ?t= frame is exact.
import { lerp, seg, outCubic, outBack } from '../../lib.js';

const XR = await (async () => {
  const url = new URL('../../img/tkr/xray.json', import.meta.url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`tray.js: ${url} answered ${r.status}`);
  return r.json();
})();

const tkr = (f) => new URL('../../img/tkr/' + f, import.meta.url).href;
const SW = XR.src.w, SH = XR.src.h;  // the HUD rects are in source px (2098 x 1080), the freeze frame's own size

// the board strip's slot on the picture's top edge, in source px: centred in the empty band between the lap counter
// and the item box, at board.png's own 312:50 ratio. It is a slot position, not a crop (the board has no HUD rect).
const BOARD_H = 90;
const BOARD = (() => {
  const a = XR.hud.lap.x + XR.hud.lap.w, b = XR.hud.item.x;
  const w = Math.round(BOARD_H * XR.crops.board.w / XR.crops.board.h);
  return { x: Math.round((a + b - w) / 2), y: 16, w, h: BOARD_H };
})();

// the parts in build order: the beat whose end lands them, and what they fill
const PARTS = [
  { beat: 'scrape', fill: ['item'] },
  { beat: 'assets', fill: ['standings'] },
  { beat: 'art', fill: ['board'] },
  { beat: 'parallel', fill: ['wave'] },
  { beat: 'code', fill: ['minimap', 'kart', 'lap'] },
  { beat: 'terminal', fill: ['speed'] },
  { beat: 'git', fill: ['pushed'] },
];

const SETTLE = 0.16;   // the snap's scale-settle
const STAGGER = 0.02;  // a part with several pieces lands them this far apart
const FADE = 0.15;     // the hand-off to play.js's window
const WIDEST = 520;    // hub px from the thread column's left edge to the widest beat's right edge (code.css .code-ed
                       // is 510px; the longest reply lines end just short of that)
const GAP = 12;        // breathing room between that edge and the tray
const MARGIN = 10;     // the least room the tray keeps on either side
const MIN_FIT = 0.72;  // the smallest the tray is drawn at to fit a narrower gutter; below it the tray stays hidden

// the waveform strip: the same deterministic bars parallel.js draws (a busy music loop, then a short SFX burst)
const hash = (i, seed) => { const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
const MUSIC = Array.from({ length: 22 }, (_, i) => (0.25 + 0.75 * hash(i, 3)) * (0.6 + 0.4 * Math.sin((i / 22) * Math.PI)));
const SFX = Array.from({ length: 12 }, (_, i) => { const x = i / 11; return Math.max(0.12, x < 0.12 ? 1 : 0.9 * Math.exp(-(x - 0.12) * 5)); });
const bars = (hs) => hs.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('');

const pct = (r) => `left:${(r.x / SW * 100).toFixed(3)}%;top:${(r.y / SH * 100).toFixed(3)}%;width:${(r.w / SW * 100).toFixed(3)}%;height:${(r.h / SH * 100).toFixed(3)}%`;

// a node's layout offset from the document, transforms ignored (the composer's drop and the camera never move it)
function offAbs(n) {
  let x = 0, y = 0;
  for (; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
  return { x, y };
}

// mountTray(main, composer, { STEPS, BEATS, APPS, OK }): builds the card in the hub's .main and returns its handle
export function mountTray(main, composer, { STEPS, BEATS, APPS, OK }) {
  const at = (beat) => { const s = STEPS.find((r) => r.beat === beat); return s ? s : null; };
  const parts = PARTS.map((p) => ({ ...p, step: at(p.beat) })).filter((p) => p.step);
  const total = parts.length;

  const pieces = [];
  const slot = (key, rect, file) => {
    pieces.push({ key });
    return `<span class="tray-slot tray-s-${key}" style="${pct(rect)}"><img class="tray-piece" src="${tkr(file)}" alt="" decoding="sync"/></span>`;
  };
  const slots = [
    ...Object.keys(XR.hud).map((k) => slot(k, XR.hud[k], XR.hudImg[k])),
    slot('board', BOARD, XR.crops.board.file),
  ].join('');
  const tile = (app) => `<span class="qc-tile qc-t-${app}"><img src="${APPS[app].logo}" alt=""/></span>`;

  const root = document.createElement('div');
  root.className = 'tray';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="tray-hd"><span class="tray-t">turbo kart rally · <b>0</b>/${total} parts</span><span class="tray-push"><i class="tray-ring"></i>${OK}</span></div>
    <div class="tray-pic">
      <img class="tray-frz" src="${tkr(XR.freezeImg.w1280)}" alt="" decoding="sync"/>
      <i class="tray-grid"></i>
      ${slots}
    </div>
    <div class="tray-wave"><span class="tray-wv tray-wv-m">${bars(MUSIC)}</span><span class="tray-wv tray-wv-s">${bars(SFX)}</span></div>
    <div class="tray-pips">${parts.map((p) => `<span class="tray-pip">${p.step.apps.map(tile).join('')}</span>`).join('')}</div>`;
  main.appendChild(root);

  const q = (s) => root.querySelector(s);
  const byKey = new Map(pieces.map((p) => [p.key, p]));
  pieces.forEach((p) => { p.slot = q(`.tray-s-${p.key}`); p.img = p.slot.firstElementChild; });
  const push = q('.tray-push');
  const wave = q('.tray-wave');
  // every landing: the node that snaps in, the slot that stops being empty, and when
  const lands = [];
  parts.forEach((p, i) => {
    const t1 = p.step.t1;
    p.fill.forEach((key, j) => {
      const a = t1 + j * STAGGER;
      if (key === 'wave') lands.push({ at: a, node: [...wave.children], slot: wave });
      else if (key === 'pushed') lands.push({ at: a, node: [push.querySelector('.qc-ok')], slot: push, ring: push.querySelector('.tray-ring') });
      else { const pc = byKey.get(key); lands.push({ at: a, node: [pc.img], slot: pc.slot }); }
    });
    p.pip = root.querySelector('.tray-pips').children[i];
  });

  const play = at('play') ? BEATS[at('play').i] : null;
  return {
    root, main, composer, parts, lands, total,
    count: q('.tray-t b'), shown: -1, g: null,
    in: BEATS[0].k.send + 0.7,                         // the composer has dropped and the camera has eased out (tabs.js)
    out: play ? play.k.T.v0 : Infinity,                // play.js's window appears on the same frozen frame
  };
}

function geo(tr) {
  const op = tr.root.offsetParent;
  if (!op) return null;
  const key = `${op.clientWidth}x${op.clientHeight}|${tr.main.clientWidth}|${tr.composer.offsetWidth}`;
  if (tr.g && tr.g.key === key) return tr.g;
  const o = offAbs(op), c = offAbs(tr.composer), m = offAbs(tr.main);
  const colL = c.x - o.x, compTop = c.y - o.y;
  const right = m.x - o.x + tr.main.offsetWidth;
  const pips = tr.root.querySelector('.tray-pips');
  const gw = Math.max(tr.root.offsetWidth, pips.offsetLeft + pips.offsetWidth);
  const lo = colL + WIDEST + GAP;
  // full size where the gutter allows (16:9); shrunk to fit down to MIN_FIT (4:3); hidden where even that won't fit
  const s = Math.min(1, (right - lo - 2 * MARGIN) / gw);
  tr.g = { key, fits: s >= MIN_FIT, s, x: lo + (right - lo - gw * s) / 2, y: compTop - 14 - tr.root.offsetHeight };
  return tr.g;
}

export function renderTray(tr, t) {
  if (!tr) return;
  const g = geo(tr);
  const a = outCubic(seg(t, tr.in, tr.in + 0.4));
  const f = seg(t, tr.out - FADE, tr.out);
  const o = g && g.fits ? a * (1 - f) : 0;
  tr.root.style.visibility = o > 0 ? 'visible' : 'hidden';
  tr.root.style.opacity = o.toFixed(3);
  if (!(o > 0)) return;
  // rises in beside the composer; swells a touch as it hands off to the full-size frame
  tr.root.style.left = `${g.x.toFixed(2)}px`;
  tr.root.style.top = `${g.y.toFixed(2)}px`;
  tr.root.style.transform = `translateY(${((1 - a) * 8).toFixed(2)}px) scale(${(g.s * lerp(1, 1.06, outCubic(f))).toFixed(4)})`;

  // each piece: empty dashed slot until its step ends, then a 160ms scale-settle in full colour and a brief rim flash
  tr.lands.forEach((L) => {
    const on = t >= L.at;
    const p = seg(t, L.at, L.at + SETTLE);
    const s = on ? lerp(1.4, 1, outBack(p)) : 1;
    const op = seg(t, L.at, L.at + 0.05);
    L.node.forEach((n) => { n.style.opacity = op.toFixed(3); n.style.transform = p >= 1 || !on ? '' : `scale(${s.toFixed(4)})`; });
    L.slot.classList.toggle('tray-on', on);
    const fl = on ? 1 - seg(t, L.at, L.at + 0.35) : 0;
    L.slot.style.boxShadow = fl > 0 ? `0 0 0 1px rgba(255, 255, 255, ${(0.9 * fl).toFixed(3)})` : '';
    if (L.ring) L.ring.style.display = on ? 'none' : '';
  });

  // the logo pips land with their parts; the header counts them
  let n = 0;
  tr.parts.forEach((p) => {
    const a0 = p.step.t1, on = t >= a0;
    if (on) n++;
    const q = seg(t, a0, a0 + SETTLE);
    p.pip.style.opacity = seg(t, a0, a0 + 0.06).toFixed(3);
    p.pip.style.transform = on && q < 1 ? `scale(${lerp(0.4, 1, outBack(q)).toFixed(4)})` : '';
  });
  if (n !== tr.shown) { tr.count.textContent = String(n); tr.shown = n; }
}
