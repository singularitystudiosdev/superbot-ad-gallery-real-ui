// onekey-aurora "tray" (16:9, bdadac04): four logins / dashboards / keys stack up as kinetic type,
// a tilted tray of the four consoles spits out windows, everything sinks back and the tray flips
// into one keycard; paste once into settings.json; an orbit router sends three requests to three models.
import {
  makeBackdrop, makeKinetic, makeDot, makeRings, provCard, makeEditor, makeLockup, at, qb, SPARK, CHECK, blurF,
  h, $, $$, op, tf, clamp, lerp, seg, smooth, outCubic, outQuint, sp, PRESETS, track, makeMark, mulberry32, money,
} from './aurora.js';
import { PLANS, PLAN, REQS, KEY_PRE, KEY_FULL, BASE_URL, COST_ALL_OPUS, COST_ROUTED, placeCursor, camera, boot, typed, scramble, logoSrc } from './kit.js';

const DUR = 26.5;
const KINDS = ['login', 'dash', 'key'];
const SHORT = { claude: 'Limit hit', openai: 'Rate limited', gemini: 'No billing', deepseek: 'Low balance' };
const FLIP0 = 8.0;        // tray flips to the keycard
const COPY_T = 10.15;
const PASTE_T = 11.35;
const ORB0 = 13.35;
const RQ = [14.0, 16.0, 17.95];
const SAVE_T = 20.15;
const END_T = 22.6;

const CSS = `
.t3 { position:absolute; left:0; top:0; width:1320px; height:640px; transform-style:preserve-3d; }
.tface { position:absolute; inset:0; border-radius:40px; backface-visibility:hidden; -webkit-backface-visibility:hidden; overflow:hidden; }
.tface.front { background:linear-gradient(180deg, rgba(22,32,44,.96), rgba(9,14,21,.97)); border:1.5px solid rgba(125,251,230,.32);
  box-shadow:0 0 70px rgba(0,229,195,.18), 0 60px 120px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08); }
.tface.back { transform:rotateY(180deg); background:
  radial-gradient(700px 360px at 85% -10%, rgba(139,92,246,.35), transparent 70%),
  radial-gradient(800px 420px at 0% 110%, rgba(0,229,195,.30), transparent 70%),
  linear-gradient(160deg, #0f1a24, #070c12); border:2px solid rgba(125,251,230,.6);
  box-shadow:0 0 0 10px rgba(0,229,195,.05), 0 0 110px rgba(0,229,195,.30), 0 60px 120px rgba(0,0,0,.6); }
.tray-h { position:absolute; left:48px; right:48px; top:34px; display:flex; align-items:center; justify-content:space-between; }
.tray-h b { font-family:var(--disp); font-size:40px; font-weight:800; letter-spacing:-.02em; color:#f2fbff; }
.tray-h span { font-size:22px; font-weight:700; color:#ff9a9d; }
.tcol { position:absolute; top:128px; width:270px; display:flex; flex-direction:column; align-items:center; gap:14px; }
.ttile { position:relative; width:168px; height:168px; border-radius:42px; background:linear-gradient(180deg,#ffffff,#e6edf3); display:grid; place-items:center;
  box-shadow:0 22px 40px rgba(0,0,0,.45), inset 0 -6px 0 rgba(0,0,0,.08), inset 0 2px 0 #fff; }
.ttile img { width:104px; height:104px; }
.ttile:has(> img[src*="claude-logo"]) { background:linear-gradient(180deg,#e58a6c,#cf6b4c); }
.ttile .bdg { position:absolute; right:-12px; top:-12px; min-width:46px; height:46px; padding:0 10px; border-radius:23px; background:#f2555a; color:#fff; font-weight:850; font-size:24px; display:grid; place-items:center; border:4px solid #0d141c; }
.tname { font-size:24px; font-weight:800; color:#eef5f9; margin-top:6px; }
.tst { width:250px; height:46px; border-radius:14px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:10px; padding:0 14px; font-size:19px; font-weight:700; color:#b9c7d3; }
.tst i { width:12px; height:12px; border-radius:50%; flex:none; }
.kc-top { position:absolute; left:56px; right:56px; top:46px; display:flex; align-items:center; gap:18px; }
.kc-top .wm { font-family:var(--disp); font-weight:800; font-size:52px; letter-spacing:-.04em; }
.kc-top .lbl { margin-left:auto; font-size:20px; font-weight:800; letter-spacing:.16em; color:#8fe9da; }
.kc-key { position:absolute; left:56px; top:236px; font-family:var(--mono); font-size:66px; font-weight:650; color:#fff; letter-spacing:.01em; white-space:nowrap; }
.kc-key .pre { color:#9ff7e9; }
.kc-bot { position:absolute; left:56px; right:44px; bottom:44px; display:flex; align-items:center; gap:14px; }
.kc-bot .inc { font-size:19px; font-weight:800; letter-spacing:.14em; color:#7f95a6; margin-right:6px; }
.kc-bot .pl { position:relative; left:auto; top:auto; height:56px; font-size:21px; }
.kc-bot .cta { margin-left:auto; }
.kc-sheen { position:absolute; top:-20%; bottom:-20%; width:260px; background:linear-gradient(100deg, transparent, rgba(255,255,255,.14), transparent); }
.hub { position:absolute; left:0; top:0; width:210px; height:210px; border-radius:50%; display:grid; place-items:center;
  background:radial-gradient(circle, rgba(0,229,195,.20), rgba(8,14,20,.95) 62%); border:2px solid rgba(125,251,230,.6);
  box-shadow:0 0 80px rgba(0,229,195,.35), inset 0 0 40px rgba(0,229,195,.12); }
.node { position:absolute; left:0; top:0; display:flex; align-items:center; gap:16px; height:116px; padding:0 30px 0 18px; border-radius:30px; white-space:nowrap;
  background:rgba(12,18,26,.95); border:1.5px solid rgba(255,255,255,.12); box-shadow:0 30px 70px rgba(0,0,0,.5); }
.node .lg { width:76px; height:76px; border-radius:22px; background:#fff; display:grid; place-items:center; }
.node .lg img { width:48px; height:48px; }
.node .nm { font-size:30px; font-weight:800; color:#f3f8fb; }
.node .via { font-size:19px; font-weight:700; color:#8fa1b2; margin-top:4px; }
.node .via b { color:#8dfbe9; }
.why2 { position:absolute; left:0; right:0; top:0; text-align:center; font-size:26px; font-weight:700; color:#a9c0cf; }
.why2 b { color:#8dfbe9; }
.big { position:absolute; left:0; top:0; text-align:center; }
.big .num { font-family:var(--disp); font-weight:800; font-size:168px; letter-spacing:-.045em; line-height:1; }
.big .bcap { font-size:27px; font-weight:700; color:#93a6b5; margin-top:18px; }
.kstrike { position:absolute; left:-12px; right:-12px; top:50%; height:8px; border-radius:4px; background:#f2555a; transform-origin:0 50%; }
`;

let S = {};

async function mount(stage) {
  document.head.appendChild(h(`<style>${CSS}</style>`));
  const bd = makeBackdrop();
  const world = h('<div class="world"></div>');
  stage.append(bd.el, world);

  // ---- kinetic opener -------------------------------------------------------------------
  const lines = [['4', { em: 'logins.' }], ['4', { em: 'dashboards.' }], ['4', { em: 'API keys.' }]].map((w) => makeKinetic(w, 132));
  const logoRow = h(`<div class="kin" style="gap:26px">${PLANS.map((p) => `<span class="ttile" style="width:92px;height:92px;border-radius:26px"><img src="${logoSrc(p.id)}" alt="" style="width:58px;height:58px"></span>`).join('')}</div>`);
  world.append(...lines.map((l) => l.el), logoRow);

  // ---- tray (front) + keycard (back) ------------------------------------------------------
  const t3 = h('<div class="t3"><div class="tface front"></div><div class="tface back"></div></div>');
  const front = $(t3, '.front'), back = $(t3, '.back');
  front.appendChild(h('<div class="tray-h"><b>Your AI subscriptions</b><span>4 logins · 4 dashboards · 4 API keys</span></div>'));
  const cols = PLANS.map((p, i) => {
    const c = h(`<div class="tcol" style="left:${70 + i * 300}px">
      <div class="ttile"><img src="${logoSrc(p.id)}" alt=""><span class="bdg">3</span></div>
      <div class="tname">${p.console}</div>
      <div class="tst"><i style="background:#f0b232"></i>Login + 2FA</div>
      <div class="tst"><i style="background:#f2555a"></i>${SHORT[p.id]}</div>
      <div class="tst"><i style="background:#7f909f"></i>${p.env}</div></div>`);
    front.appendChild(c); return c;
  });
  back.innerHTML = `<div class="kc-top"><span class="face"></span><span class="wm gtext">superbot</span><span class="lbl">ONE API KEY</span></div>
    <div class="kc-key"><span class="pre"></span><span class="rest"></span></div>
    <div class="kc-bot"><span class="inc">INCLUDES</span>${PLANS.map((p) => `<span class="chip pl"><span class="lg"><img src="${logoSrc(p.id)}" alt=""></span>${p.plan}</span>`).join('')}<span class="cta"><span class="lbl2">Copy</span></span></div>
    <div class="kc-sheen"></div>`;
  const kcMark = makeMark(96);
  $(back, '.face').appendChild(kcMark.el);
  world.appendChild(t3);
  const rings = makeRings(3);
  world.appendChild(rings.el);
  const flipHead = makeKinetic(['All', 'four,', 'packed', 'into', { em: 'one key.' }], 70);
  world.appendChild(flipHead.el);

  // ---- minis (floating console windows) ----------------------------------------------------
  const rnd = mulberry32(2207);
  const minis = [];
  KINDS.forEach((k, ki) => PLANS.forEach((p, i) => {
    const el = provCard(p, k);
    world.appendChild(el);
    const tx = 170 + i * 520 + (rnd() - 0.5) * 200 + ki * 30;
    const ty = 210 + ki * 120 + (rnd() - 0.5) * 120;
    minis.push({ el, i, ki, t0: 3.45 + ki * 0.55 + i * 0.12, tx: clamp(tx, 190, 1730), ty, r: (rnd() - 0.5) * 16 });
  }));

  // ---- settings.json -----------------------------------------------------------------------
  const ed = makeEditor('settings.json', [
    '{',
    '  <span class="k">"provider"</span>: <span class="s">"openai-compatible"</span>,',
    `  <span class="k">"baseUrl"</span>: <span class="s">"${BASE_URL}"</span>,`,
    '  <span class="k">"apiKey"</span>: <span class="s">"<span class="kslot"></span><span class="kcaret"></span>"</span>,',
    '  <span class="k">"model"</span>: <span class="s">"auto"</span>',
    '}',
  ], 1160);
  const kslot = $(ed, '.kslot'), kcaret = $(ed, '.kcaret');
  kcaret.style.cssText = 'display:inline-block;width:3px;height:32px;vertical-align:-6px;background:#7dfbe6';
  const edLines = $$(ed, '.ed-b .l');
  const pasteHead = makeKinetic(['Paste', 'it', 'into', 'one', { em: 'line.' }], 74);
  world.append(ed, pasteHead.el);

  // ---- orbit -------------------------------------------------------------------------------
  const orbit = h(`<svg class="abs" style="left:0;top:0;overflow:visible" width="1" height="1">
    <defs><linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="#7dfbe6" stop-opacity=".1"/><stop offset=".5" stop-color="#7dfbe6" stop-opacity=".55"/><stop offset="1" stop-color="#a98bff" stop-opacity=".15"/></linearGradient></defs>
    <ellipse cx="960" cy="610" rx="640" ry="250" fill="none" stroke="url(#og)" stroke-width="2.5"/>
    <ellipse cx="960" cy="610" rx="420" ry="164" fill="none" stroke="rgba(125,251,230,.12)" stroke-width="2" stroke-dasharray="6 12"/>
    <line class="beam" x1="960" y1="610" x2="960" y2="610" stroke="#7dfbe6" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 0 10px #00e5c3)"/>
    <line class="feed" x1="960" y1="200" x2="960" y2="505" stroke="#7dfbe6" stroke-width="4" stroke-linecap="round" style="filter:drop-shadow(0 0 8px #00e5c3)"/></svg>`);
  const hub = h('<div class="hub"></div>');
  const hubMark = makeMark(140);
  hub.appendChild(hubMark.el);
  const hubRing = h('<svg class="abs" style="left:0;top:0;overflow:visible" width="1" height="1"><circle cx="0" cy="0" r="132" fill="none" stroke="rgba(125,251,230,.5)" stroke-width="2.5" stroke-dasharray="4 14"/></svg>');
  const nodes = ['claude', 'gemini', 'deepseek'].map((id) => {
    const p = PLAN[id];
    return h(`<div class="node"><div class="lg"><img src="${logoSrc(id)}" alt=""></div><div><div class="nm">${p.short}</div><div class="via">via <b>${p.plan}</b></div></div></div>`);
  });
  const ask = h(`<div class="gpill" style="width:1240px;height:96px;font-size:30px"><span class="q"><span class="ph">Ask anything…</span><span class="tx"></span><span class="caret"></span></span><span class="cta" style="height:72px">${SPARK}Send</span></div>`);
  const comet = h('<div class="abs" style="left:0;top:0;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:#e9fffb;box-shadow:0 0 0 6px rgba(0,229,195,.25),0 0 30px #00e5c3"></div>');
  const why = h('<div class="why2"></div>');
  world.append(orbit, hubRing, hub, ...nodes, ask, comet, why);

  // ---- savings -------------------------------------------------------------------------
  const saveHead = makeKinetic(['Same', '3', 'requests.'], 64);
  const bigL = h(`<div class="big"><div class="num" style="color:#7f8a99;position:relative">${money(COST_ALL_OPUS)}<span class="kstrike"></span></div><div class="bcap">everything on Opus 5.5</div></div>`);
  const bigR = h(`<div class="big"><div class="num gtext">${money(COST_ROUTED)}</div><div class="bcap">routed by superbot</div></div>`);
  const arrow = h('<svg class="abs" style="left:0;top:0;overflow:visible" width="1" height="1"><path d="M -60 0 L 50 0 M 22 -28 L 54 0 L 22 28" fill="none" stroke="#7dfbe6" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  const saveNote = h('<div class="kin" style="font-size:24px;font-weight:650;color:#7f95a6">API list prices, openrouter.ai, Oct 2026</div>');
  world.append(saveHead.el, bigL, bigR, arrow, saveNote);

  // ---- end -----------------------------------------------------------------------------
  const end1 = makeKinetic(['One', 'API', 'key', { mark: true }], 116);
  const end2 = makeKinetic(['for', 'all', 'your', { em: 'subscriptions.' }], 116);
  const lock = makeLockup({ size: 60 });
  lock.el.classList.add('mini');
  stage.append(end1.el, end2.el, lock.el);

  const dot = makeDot();
  world.appendChild(dot);
  S = { bd, world, lines, logoRow, t3, front, back, cols, kcMark, rings, flipHead, minis, ed, kslot, kcaret, edLines, pasteHead, orbit, hub, hubMark, hubRing, nodes, ask, comet, why, saveHead, bigL, bigR, arrow, saveNote, end1, end2, lock, dot };
}

let L = null;
function layout() {
  if (L) return L;
  const ew = S.ed.offsetWidth, eh = S.ed.offsetHeight;
  const edC = [960, 672];
  const line = S.edLines[3];
  const slotX = edC[0] - ew / 2 + S.kslot.offsetLeft, slotY = edC[1] - eh / 2 + line.offsetTop + line.offsetHeight / 2;
  const cta = $(S.back, '.kc-bot .cta');
  const bot = $(S.back, '.kc-bot');
  // the flipped card sits at scale ~0.92 about the tray centre when Copy is clicked
  const ctaX = 960 + (960 - 660 + bot.offsetLeft + cta.offsetLeft + cta.offsetWidth / 2 - 960) * 0.92;
  const ctaY = 590 + (590 - 320 + bot.offsetTop + cta.offsetTop + cta.offsetHeight / 2 - 590) * 0.92;
  const askCta = $(S.ask, '.cta');
  const sendX = 960 - S.ask.offsetWidth / 2 + askCta.offsetLeft + askCta.offsetWidth / 2;
  L = { edC, slotX, slotY, ctaX, ctaY, sendX, sendY: 150 };
  return L;
}

const HUB = [960, 610];
const NODE_A = [Math.PI * 1.06, -0.3, 0.62];
const nodePos = (i, t) => { const a = NODE_A[i] + 0.05 * (t - ORB0); return [HUB[0] + 640 * Math.cos(a), HUB[1] + 250 * Math.sin(a)]; };

function render(t) {
  const Lx = layout();
  const cam = camera(S.world, t, [[0, 960, 540, 1], [2.6, 960, 560, 1.0], [5.6, 960, 540, 1.03], [7.2, 960, 540, 1.0], [ORB0, 960, 540, 1.0], [END_T - 0.2, 960, 540, 0.94]]);
  op(S.world, 1 - smooth((t - END_T + 0.1) / 0.45));
  S.world.style.filter = blurF(1 - smooth((t - END_T + 0.15) / 0.5), 18);

  const ax = track(t, [[0, 960], [2.6, 1400], [FLIP0, 960], [ORB0, 600], [SAVE_T, 960]], 40, 13);
  const ay = track(t, [[0, 3000], [0.05, 2380], [2.6, 2460], [FLIP0, 2230], [ORB0, 2520], [SAVE_T, 2330], [END_T, 2150]], 40, 13);
  const glow = clamp(0.55 + 0.45 * smooth(t / 1.0) - 0.22 * Math.min(smooth((t - 3.2) / 0.5), smooth((FLIP0 - 0.4 - t) / 0.5)) + 0.15 * smooth((t - END_T) / 0.8));
  S.bd.render(t, { ax, ay, glow, floor: 0.8, px: cam.cx - 960, py: cam.cy - 540 });

  // ---- opener: three lines stack, each pushes the last up ------------------------------------
  const L0 = [0.12, 0.85, 1.58];
  const openOut = smooth((t - 2.5) / 0.35);
  S.lines.forEach((ln, j) => {
    const lt = t - L0[j];
    ln.render(lt, { out: openOut });
    const pushes = L0.filter((x, k) => k > j && t >= x).length;
    const yOff = track(t, [[0, 0], ...L0.slice(j + 1).map((x, k) => [x, -(k + 1) * 150])], 170, 26);
    tf(ln.el, `translateY(${400 + 150 + yOff - 150 * 0}px)`);
    op(ln.el, t >= L0[j] && t < 3 ? 1 - 0.62 * Math.min(1, pushes) * smooth((t - L0[Math.min(2, j + 1)]) / 0.25) : 0);
  });
  {
    const k = sp(t, 0.45, PRESETS.default);
    tf(S.logoRow, `translateY(${760 + (1 - k) * 40 - openOut * 40}px)`);
    op(S.logoRow, smooth((t - 0.45) / 0.25) * (1 - openOut));
    $$(S.logoRow, '.ttile').forEach((tl, i) => { const kk = sp(t, 0.5 + i * 0.09, PRESETS.playful); tf(tl, `scale(${kk})`); });
  }

  // ---- tray --------------------------------------------------------------------------------
  const tk = sp(t, 2.55, PRESETS.default);
  const flip = sp(t, FLIP0, PRESETS.heavy);
  const rx = lerp(26, 0, sp(t, FLIP0 - 0.55, PRESETS.default)) + (1 - tk) * 18;
  const ry = 180 * flip;
  const sTray = (0.88 + 0.12 * tk) * lerp(1, 0.92, flip) * (1 - 0.06 * Math.sin(Math.PI * clamp(flip)));
  const lift = sp(t, 10.45, PRESETS.default);
  const ty = 590 + (1 - tk) * 380 + lerp(0, -400, lift);
  const sc = sTray * lerp(1, 0.36, lift);
  tf(S.t3, `translate(${960 - 660}px, ${ty - 320}px) perspective(2200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`);
  op(S.t3, smooth((t - 2.55) / 0.25) * (1 - smooth((t - ORB0 + 0.2) / 0.3)));
  // columns: badges bounce while clutter spawns; columns converge before the flip
  const conv = outCubic(seg(t, FLIP0 - 1.0, FLIP0 - 0.15));
  S.cols.forEach((c, i) => {
    const k = sp(t, 2.75 + i * 0.1, PRESETS.default);
    // the four tiles fan into one pile at the centre, like a hand of cards, before the flip
    const dx = (525 + (i - 1.5) * 30 - (70 + i * 300)) * conv;
    tf(c, `translate(${dx}px, ${(1 - k) * 50 + conv * 70}px) rotate(${(i - 1.5) * 8 * conv}deg)`);
    op(c, smooth((t - 2.75 - i * 0.1) / 0.2));
    c.style.zIndex = String(i);
    op($(c, '.tname'), 1 - conv);
    const b = $(c, '.bdg');
    const nb = 3 - Math.max(0, Math.min(3, Math.floor((t - 6.25 - i * 0.05) / 0.12)));
    const bv = t < 3.6 + i * 0.12 ? 0 : t < 6.25 ? 3 : nb;
    b.textContent = String(Math.max(1, bv));
    tf(b, `scale(${bv > 0 ? sp(t, 3.6 + i * 0.12, PRESETS.playful) : 0})`);
    $$(c, '.tst').forEach((r) => op(r, 1 - conv));
  });
  op($(S.front, '.tray-h'), 1 - conv);
  // keycard face
  const kcT = FLIP0 + 0.55;
  const keyTxt = t < kcT ? '' : scramble(KEY_FULL, t, kcT, 0.6, 31);
  const pre = keyTxt.slice(0, KEY_PRE.length), rest = keyTxt.slice(KEY_PRE.length);
  const preEl = $(S.back, '.kc-key .pre'), restEl = $(S.back, '.kc-key .rest');
  if (preEl.textContent !== pre) preEl.textContent = pre;
  if (restEl.textContent !== rest) restEl.textContent = rest;
  $$(S.back, '.kc-bot .pl').forEach((p, i) => { const k = sp(t, kcT + 0.25 + i * 0.1, PRESETS.playful); tf(p, `scale(${t < kcT + 0.25 + i * 0.1 ? 0 : k})`); });
  tf($(S.back, '.kc-sheen'), `translateX(${lerp(-400, 1500, smooth((t - kcT - 0.3) / 0.8))}px) skewX(-12deg)`);
  S.kcMark.render(t);
  const lbl = $(S.back, '.lbl2');
  const want = t >= COPY_T + 0.04 ? `${CHECK.replace('<svg', '<svg style="width:28px;height:28px;vertical-align:-5px;margin-right:8px"')}Copied` : 'Copy';
  if (lbl.dataset.v !== want) { lbl.innerHTML = want; lbl.dataset.v = want; }
  tf($(S.back, '.kc-bot .cta'), `scale(${1 - 0.08 * Math.max(0, 1 - Math.abs(t - COPY_T) / 0.14)})`);
  S.rings.render(t, 960, 590, [1320 * 0.92, 640 * 0.92], [FLIP0 + 0.5, FLIP0 + 0.9], 1 - lift);
  S.flipHead.render(t - FLIP0 - 0.6, { out: smooth((t - 10.25) / 0.3) });
  tf(S.flipHead.el, 'translateY(118px)');
  op(S.flipHead.el, t > FLIP0 + 0.55 && t < 10.9 ? 1 : 0);

  // ---- minis -----------------------------------------------------------------------------
  S.minis.forEach((m) => {
    const src = [180 + m.i * 300 + 135, 470];
    const k = outCubic(seg(t, m.t0, m.t0 + 0.6));
    const back = clamp((t - 6.2 - (3 - m.i) * 0.05 - (2 - m.ki) * 0.08) / 0.5);
    const kb = back * back * back;
    const p0 = qb(src, [lerp(src[0], m.tx, 0.5), m.ty - 220], [m.tx, m.ty], k);
    const x = lerp(p0[0], src[0], kb), y = lerp(p0[1], src[1], kb);
    const jit = Math.sin(t * 1.4 + m.i * 2 + m.ki) * 1.5;
    at(m.el, x, y, lerp(0.22, 0.58, k) * (1 - 0.8 * kb), m.r * k + jit);
    op(m.el, smooth((t - m.t0) / 0.15) * (1 - smooth((back - 0.75) / 0.25)));
    m.el.style.zIndex = String(10 + m.ki * 4 + m.i);
  });

  // ---- cursor -----------------------------------------------------------------------------
  const curKeys = [[0, 1500, 1100], [9.5, 1500, 1100], [9.95, Lx.ctaX + 8, Lx.ctaY + 6], [10.6, Lx.ctaX - 200, 520], [11.05, Lx.slotX + 30, Lx.slotY + 22], [12.4, Lx.slotX + 120, Lx.slotY + 90],
    [13.4, Lx.sendX + 60, 260], [RQ[0] + 0.7, Lx.sendX + 4, 156], [RQ[1] - 0.2, Lx.sendX + 50, 240], [RQ[1] + 0.62, Lx.sendX + 4, 156], [RQ[2] - 0.2, Lx.sendX + 50, 240], [RQ[2] + 0.55, Lx.sendX + 4, 156], [19.3, Lx.sendX + 70, 280]];
  const sends = [RQ[0] + 0.85, RQ[1] + 0.75, RQ[2] + 0.68];
  placeCursor(S.dot, t, curKeys, [COPY_T, PASTE_T, ...sends], Math.min(smooth((t - 9.45) / 0.25), smooth((19.6 - t) / 0.3)) * (t > 12.6 && t < 13.5 ? 1 - Math.min(smooth((t - 12.6) / 0.2), smooth((13.5 - t) / 0.2)) : 1));
  S.dot.style.transform += ` scale(${(1 / cam.s).toFixed(4)})`;

  // ---- settings.json -------------------------------------------------------------------------
  const ek = sp(t, 10.5, PRESETS.default);
  const edOut = smooth((t - ORB0 + 0.25) / 0.3);
  at(S.ed, Lx.edC[0], Lx.edC[1] + (1 - ek) * 120 + edOut * 60, (0.94 + 0.06 * ek) * (1 - 0.05 * edOut));
  op(S.ed, smooth((t - 10.5) / 0.3) * (1 - edOut));
  const pasted = t >= PASTE_T;
  const key = pasted ? scramble(KEY_FULL, t, PASTE_T, 0.35, 19) : '';
  if (S.kslot.dataset.v !== key) { S.kslot.textContent = key; S.kslot.dataset.v = key; }
  const fl = pasted ? Math.max(0, 1 - (t - PASTE_T) / 0.9) : 0;
  S.kslot.style.cssText = `color:#ffd98a;border-radius:8px;background:${fl > 0.01 ? `rgba(0,229,195,${(0.32 * fl).toFixed(3)})` : 'transparent'};box-shadow:${fl > 0.01 ? `0 0 ${(30 * fl).toFixed(0)}px rgba(0,229,195,${(0.5 * fl).toFixed(3)})` : 'none'}`;
  op(S.kcaret, pasted ? 0 : Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
  const lg = pasted ? Math.min(1, (t - PASTE_T) / 0.2) : 0;
  S.edLines[3].style.background = lg > 0 ? `rgba(0,229,195,${(0.08 * lg).toFixed(3)})` : 'transparent';
  S.edLines.forEach((l, i) => { if (i !== 3) op(l, pasted ? lerp(1, 0.45, smooth((t - PASTE_T - 0.3) / 0.4)) : 1); });
  S.pasteHead.render(t - 10.65, { out: edOut });
  tf(S.pasteHead.el, 'translateY(314px)');
  op(S.pasteHead.el, t > 10.6 && t < ORB0 + 0.2 ? 1 : 0);

  // ---- orbit -------------------------------------------------------------------------------
  const ok = sp(t, ORB0, PRESETS.heavy);
  const orbA = smooth((t - ORB0) / 0.35) * (1 - smooth((t - SAVE_T + 0.1) / 0.35));
  op(S.orbit, orbA);
  const ell = $$(S.orbit, 'ellipse');
  ell.forEach((e, i) => { e.style.transformOrigin = '960px 610px'; e.style.transform = `scale(${0.7 + 0.3 * ok}) rotate(${i ? -t * 4 : 0}deg)`; });
  at(S.hub, HUB[0], HUB[1], ok * (1 + 0.06 * pulse(t, sends.map((s) => s + 0.35))));
  op(S.hub, orbA);
  S.hubMark.render(t);
  tf(S.hubRing, `translate(${HUB[0]}px, ${HUB[1]}px) rotate(${t * 26}deg) scale(${ok})`);
  op(S.hubRing, orbA);
  let ri = -1; for (let j = 0; j < 3; j++) if (t >= RQ[j]) ri = j;
  const req = ri >= 0 ? REQS[ri] : null;
  const sendT = ri >= 0 ? sends[ri] : 1e9;
  const wi = req ? ['claude', 'gemini', 'deepseek'].indexOf(req.plan) : -1;
  S.nodes.forEach((n, i) => {
    const k = sp(t, ORB0 + 0.2 + i * 0.12, PRESETS.default);
    const [x, y] = nodePos(i, t);
    const hot = i === wi ? smooth((t - sendT - 0.62) / 0.18) * (ri < 2 ? 1 - smooth((t - RQ[ri + 1]) / 0.2) : 1) : 0;
    const dim = req && i !== wi ? 0.7 * smooth((t - sendT - 0.62) / 0.18) * (ri < 2 ? 1 - smooth((t - RQ[ri + 1]) / 0.2) : 1) : 0;
    at(n, x, y, k * (1 + 0.1 * hot));
    op(n, smooth((t - ORB0 - 0.2 - i * 0.12) / 0.25) * (1 - smooth((t - SAVE_T + 0.1) / 0.35)));
    n.style.borderColor = hot > 0.01 ? `rgba(125,251,230,${(0.12 + 0.7 * hot).toFixed(3)})` : '';
    n.style.boxShadow = hot > 0.01 ? `0 0 ${(60 * hot).toFixed(0)}px rgba(0,229,195,${(0.38 * hot).toFixed(3)}), 0 30px 70px rgba(0,0,0,.5)` : '';
    n.style.filter = dim > 0.01 ? `brightness(${1 - 0.45 * dim}) saturate(${1 - 0.6 * dim})` : 'none';
    n.style.zIndex = String(5 + Math.round(y / 100));
  });
  // feed: pill -> hub ; beam: hub -> node
  const feed = $(S.orbit, '.feed'), beam = $(S.orbit, '.beam');
  if (req) {
    const fk = outCubic(seg(t, sendT + 0.05, sendT + 0.35));
    const fo = smooth((t - sendT - 0.55) / 0.2);
    feed.setAttribute('y1', String(lerp(200, 505, fo)));
    feed.setAttribute('y2', String(lerp(200, 505, fk)));
    op(feed, fk > 0 ? 1 - fo * 0.999 : 0);
    const [nx, ny] = nodePos(wi, t);
    const bk = outCubic(seg(t, sendT + 0.35, sendT + 0.65));
    const bo = ri < 2 ? smooth((t - RQ[ri + 1] + 0.05) / 0.2) : 0;
    beam.setAttribute('x2', String(lerp(HUB[0], nx, bk))); beam.setAttribute('y2', String(lerp(HUB[1], ny, bk)));
    op(beam, bk > 0 ? 1 - bo : 0);
    const ck = t < sendT + 0.35 ? fk : bk;
    const cp = t < sendT + 0.35 ? [960, lerp(200, 505, fk)] : [lerp(HUB[0], nx, bk), lerp(HUB[1], ny, bk)];
    tf(S.comet, `translate(${cp[0]}px, ${cp[1]}px)`);
    op(S.comet, t > sendT + 0.05 && t < sendT + 0.7 ? 1 : 0);
    const wt = sendT + 0.62;
    const whyTxt = `${req.why} <b>→ ${PLAN[req.plan].short}</b>`;
    if (S.why.dataset.v !== whyTxt) { S.why.innerHTML = whyTxt; S.why.dataset.v = whyTxt; }
    const wk = sp(t, wt, PRESETS.default);
    tf(S.why, `translateY(${HUB[1] + 330 + (1 - wk) * 20}px)`);
    op(S.why, smooth((t - wt) / 0.2) * (ri < 2 ? 1 - smooth((t - RQ[ri + 1]) / 0.2) : 1) * orbA);
  } else { op(feed, 0); op(beam, 0); op(S.comet, 0); op(S.why, 0); }
  const ak = sp(t, ORB0 + 0.1, PRESETS.default);
  at(S.ask, 960, 150 + (1 - ak) * -40, 0.95 + 0.05 * ak);
  op(S.ask, smooth((t - ORB0 - 0.1) / 0.3) * (1 - smooth((t - SAVE_T + 0.1) / 0.35)));
  const tx = req ? typed(req.text, t, RQ[ri] + 0.05, ri === 0 ? 80 : 68) : '';
  const txEl = $(S.ask, '.tx');
  if (txEl.dataset.v !== tx) { txEl.textContent = tx; txEl.dataset.v = tx; }
  $(S.ask, '.ph').style.display = tx ? 'none' : '';
  op($(S.ask, '.caret'), Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
  tf($(S.ask, '.cta'), `scale(${1 - 0.08 * Math.max(0, 1 - Math.abs(t - sendT) / 0.14)})`);

  // ---- savings -------------------------------------------------------------------------------
  const s0 = SAVE_T;
  S.saveHead.render(t - s0, { out: smooth((t - END_T + 0.3) / 0.3) });
  tf(S.saveHead.el, 'translateY(250px)');
  op(S.saveHead.el, t > s0 - 0.02 && t < END_T ? 1 : 0);
  const sOut = smooth((t - END_T + 0.3) / 0.3);
  [[S.bigL, 560, s0 + 0.25], [S.bigR, 1360, s0 + 0.55]].forEach(([el, x, t0]) => {
    const k = sp(t, t0, PRESETS.heavy);
    at(el, x, 560 + (1 - k) * 60, 0.9 + 0.1 * k);
    op(el, smooth((t - t0) / 0.25) * (1 - sOut));
    el.style.filter = blurF(k, 14);
  });
  const stk = outCubic(seg(t, s0 + 1.05, s0 + 1.35));
  tf($(S.bigL, '.kstrike'), `scaleX(${stk})`);
  const ark = sp(t, s0 + 0.45, PRESETS.snappy);
  tf(S.arrow, `translate(${960 + (1 - ark) * -30}px, 528px)`);
  op(S.arrow, smooth((t - s0 - 0.45) / 0.2) * (1 - sOut));
  tf(S.saveNote, 'translateY(800px)');
  op(S.saveNote, smooth((t - s0 - 1.1) / 0.3) * (1 - sOut));

  // ---- end -----------------------------------------------------------------------------------
  const e0 = END_T + 0.2;
  S.end1.render(t - e0, { stagger: 0.09 });
  S.end2.render(t - e0 - 0.32, { stagger: 0.08 });
  const up = sp(t, END_T + 1.9, PRESETS.heavy);
  tf(S.end1.el, `translateY(${330 - up * 70}px)`);
  tf(S.end2.el, `translateY(${470 - up * 70}px)`);
  op(S.end1.el, t > e0 ? 1 : 0); op(S.end2.el, t > e0 ? 1 : 0);
  S.lock.render(t - END_T - 2.0);
  op(S.lock.el, t > END_T + 1.95 ? 1 : 0);
}

function pulse(t, ts) { let v = 0; for (const x of ts) { const d = t - x; if (d >= 0 && d < 0.4) v = Math.max(v, Math.sin((d / 0.4) * Math.PI) * (1 - d / 0.4)); } return v; }

boot({ DUR, mount, render });
