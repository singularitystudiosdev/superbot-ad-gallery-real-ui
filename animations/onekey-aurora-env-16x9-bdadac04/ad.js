// onekey-aurora "env" (16:9, bdadac04): a desktop buried in four consoles, alerts and a four-key .env;
// the four key values fly out of the file into one key, the file empties, one line is pasted; then a chat
// shows each request routed to its model, a receipt adds it up, and the line lands.
import {
  makeBackdrop, makeKinetic, makeDot, makeRings, provCard, makeKeyPill, makeEditor, makeLockup, at, qb, SPARK, CHECK, blurF,
  h, $, $$, op, tf, clamp, lerp, seg, smooth, outCubic, outQuint, sp, PRESETS, track, makeMark, money,
} from './aurora.js';
import { PLANS, PLAN, REQS, KEY_PRE, KEY_FULL, COST_ALL_OPUS, COST_ROUTED, listCost, placeCursor, camera, boot, typed, scramble, logoSrc } from './kit.js';

const DUR = 26.5;
const WINS = [
  { id: 'claude', kind: 'login', x: 370, y: 400, r: -3.5 },
  { id: 'openai', kind: 'dash', x: 1550, y: 380, r: 2.8 },
  { id: 'gemini', kind: 'dash', x: 480, y: 770, r: 2.2 },
  { id: 'deepseek', kind: 'login', x: 1460, y: 790, r: -2.4 },
];
const TOASTS = ['Claude: usage limit reached', 'OpenAI: 429 rate limit', 'Gemini: billing required', 'DeepSeek: balance $0.42'];
const ENV0 = 1.75;        // .env window lands
const PUSH = 4.55;        // camera pushes onto the .env
const FLY0 = 5.15;        // first key value leaves its line
const flyT = (i) => FLY0 + i * 0.32;
const dockT = (i) => flyT(i) + 0.5;
const COPY_T = 7.45;
const TYPE_T = 7.95;
const PASTE_T = 8.45;
const CHAT0 = 9.75;
const CQ = [10.05, 12.45, 14.85];
const RCPT = 17.45;
const END_T = 20.95;

const CSS = `
.envl { display:inline-flex; align-items:center; vertical-align:top; height:54px; }
.envl .elg { width:40px; height:40px; border-radius:11px; background:#fff; display:grid; place-items:center; margin-right:16px; flex:none; }
.envl .elg img { width:26px; height:26px; }
.envl .elg:has(> img[src*="claude-logo"]) { background:#d97757; }
.envl .val { color:#ffd98a; }
.fly { position:absolute; left:0; top:0; font-family:var(--mono); font-size:28px; color:#ffd98a; white-space:nowrap; padding:6px 14px; border-radius:12px;
  background:rgba(255,217,138,.08); border:1px solid rgba(255,217,138,.35); }
.toast { position:absolute; left:0; top:0; display:flex; align-items:center; gap:14px; height:64px; padding:0 24px 0 16px; border-radius:18px; white-space:nowrap;
  background:rgba(22,14,16,.94); border:1.5px solid rgba(242,85,90,.5); color:#ffc2c4; font-size:22px; font-weight:750; box-shadow:0 24px 60px rgba(0,0,0,.55); }
.toast i { width:30px; height:30px; border-radius:50%; background:#f2555a; color:#1a0607; font-style:normal; font-weight:900; display:grid; place-items:center; font-size:18px; }
.chat { position:absolute; left:0; top:0; width:1360px; height:880px; border-radius:36px; overflow:hidden;
  background:linear-gradient(180deg, rgba(16,24,34,.95), rgba(8,13,20,.96)); border:1.5px solid rgba(125,251,230,.3);
  box-shadow:0 0 80px rgba(0,229,195,.14), 0 60px 120px rgba(0,0,0,.6); }
.chat::before { content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size:68px 68px; }
.chat-h { position:absolute; left:0; right:0; top:0; height:96px; display:flex; align-items:center; gap:16px; padding:0 36px; border-bottom:1px solid rgba(255,255,255,.08); background:rgba(8,13,20,.6); }
.chat-h b { font-family:var(--disp); font-size:32px; font-weight:800; color:#f2fbff; letter-spacing:-.02em; }
.chat-h .chip { position:relative; left:auto; top:auto; margin-left:auto; height:48px; font-size:20px; }
.msgs { position:absolute; left:0; right:0; top:96px; bottom:0; overflow:hidden; }
.mlist { position:absolute; left:0; right:0; top:0; }
.bub { position:absolute; display:flex; align-items:flex-start; gap:18px; }
.bub.me { right:40px; flex-direction:row-reverse; }
.bub.ai { left:40px; }
.av { width:64px; height:64px; border-radius:50%; flex:none; display:grid; place-items:center; }
.av.me { background:linear-gradient(135deg,#7dfbe6,#8b5cf6); color:#061016; font-weight:900; font-size:26px; }
.av.ai { background:rgba(0,229,195,.12); border:1.5px solid rgba(125,251,230,.5); }
.bt { max-width:900px; padding:22px 28px; border-radius:26px; font-size:28px; font-weight:650; line-height:1.3; color:#eef6fa; }
.bub.me .bt { background:rgba(255,255,255,.07); border:1.5px solid rgba(125,251,230,.55); box-shadow:0 0 34px rgba(0,229,195,.18); border-top-right-radius:8px; }
.bub.ai .bt { background:rgba(12,20,28,.95); border:1.5px solid rgba(255,255,255,.12); border-top-left-radius:8px; width:900px; }
.rt { display:flex; gap:12px; margin-bottom:16px; }
.rt .chip { position:relative; left:auto; top:auto; height:54px; font-size:21px; transition:none; }
.rsn { font-size:24px; color:#a6b8c6; font-weight:650; }
.rsn b { color:#8dfbe9; }
.rcpt { position:absolute; left:0; top:0; width:1080px; padding:44px 54px 40px; border-radius:34px; background:linear-gradient(180deg, rgba(18,26,36,.96), rgba(9,14,21,.97));
  border:1.5px solid rgba(125,251,230,.3); box-shadow:0 0 70px rgba(0,229,195,.14), 0 60px 120px rgba(0,0,0,.6); }
.rcpt h4 { font-family:var(--disp); font-size:46px; font-weight:800; letter-spacing:-.03em; color:#f2fbff; }
.rcpt h4 small { display:block; font-family:var(--ui); font-size:21px; color:#7f95a6; font-weight:650; letter-spacing:0; margin-top:6px; }
.rr { display:grid; grid-template-columns:64px 1fr auto; align-items:center; gap:20px; height:96px; border-bottom:1px dashed rgba(255,255,255,.12); }
.rr .lg { width:56px; height:56px; border-radius:16px; background:#fff; display:grid; place-items:center; }
.rr .lg img { width:36px; height:36px; }
.rr .lg:has(> img[src*="claude-logo"]) { background:#d97757; }
.rr .t { font-size:26px; font-weight:750; color:#e8f1f6; }
.rr .t small { display:block; font-size:19px; color:#8fa1b2; font-weight:650; margin-top:3px; }
.rr .m { font-family:var(--mono); font-size:32px; font-weight:700; color:#fff; }
.rtot { display:flex; align-items:center; justify-content:space-between; margin-top:26px; }
.rtot .a { font-size:27px; font-weight:800; color:#d7fff7; }
.rtot .b { font-family:var(--disp); font-size:76px; font-weight:800; letter-spacing:-.03em; }
.rvs { display:flex; align-items:center; justify-content:space-between; margin-top:8px; color:#7f8a99; font-size:24px; font-weight:700; }
.rvs .m { position:relative; font-family:var(--mono); font-size:30px; }
.rvs .m i { position:absolute; left:-6px; right:-6px; top:50%; height:4px; border-radius:2px; background:#f2555a; transform-origin:0 50%; }
`;

let S = {};

async function mount(stage) {
  document.head.appendChild(h(`<style>${CSS}</style>`));
  const bd = makeBackdrop();
  const world = h('<div class="world"></div>');
  stage.append(bd.el, world);

  // ---- desktop clutter -----------------------------------------------------------------------
  const wins = WINS.map((w) => { const el = provCard(PLAN[w.id], w.kind); world.appendChild(el); return el; });
  const toasts = TOASTS.map((tx) => { const el = h(`<div class="toast"><i>!</i>${tx}</div>`); world.appendChild(el); return el; });
  const cap = makeKinetic(['Four', 'logins.', 'Four', 'dashboards.', 'Four', { em: 'API keys.' }], 56);
  world.appendChild(cap.el);

  // ---- .env ---------------------------------------------------------------------------------
  const ed = makeEditor('.env', [
    ...PLANS.map((p) => `<span class="envl"><span class="elg"><img src="${logoSrc(p.id)}" alt=""></span><span class="k">${p.env}</span>=<span class="val">${p.keyMask}</span></span>`),
    '<span class="envl nl"><span class="k ty"></span><span class="s ks"></span><span class="ecaret"></span></span>',
  ], 1000);
  $(ed, '.ed-b').style.fontSize = '28px';
  const edLines = $$(ed, '.ed-b .l');
  const ecaret = $(ed, '.ecaret');
  ecaret.style.cssText = 'display:inline-block;width:3px;height:32px;vertical-align:-6px;background:#7dfbe6;margin-left:2px';
  world.appendChild(ed);
  const flies = PLANS.map((p) => { const el = h(`<div class="fly">${p.keyMask}</div>`); world.appendChild(el); return el; });

  // ---- key pill + heads -------------------------------------------------------------------------
  const rings = makeRings(3);
  const pill = makeKeyPill(PLANS, 'Copy');
  const head1 = makeKinetic(['Four', 'keys', 'in,', { em: 'one key out.' }], 64);
  const head2 = makeKinetic(['One', 'line.', { em: 'Every model.' }], 64);
  const models = h(`<div class="kin" style="gap:16px">${[['claude', 'Opus 5.5'], ['openai', 'GPT-6.1'], ['gemini', 'Gemini 3.1 Pro'], ['deepseek', 'DeepSeek V4.1']].map(([id, nm]) => `<div class="chip" style="position:relative"><span class="lg"><img src="${logoSrc(id)}" alt=""></span>${nm}<span class="ok">${CHECK}</span></div>`).join('')}</div>`);
  world.append(rings.el, pill.el, head1.el, head2.el, models);

  // ---- chat ---------------------------------------------------------------------------------------
  const chat = h(`<div class="chat"><div class="chat-h"><span class="hm"></span><b>superbot</b><span class="chip"><span class="n">model="auto"</span></span></div><div class="msgs"><div class="mlist"></div></div></div>`);
  const hm = makeMark(58); $(chat, '.hm').appendChild(hm.el);
  const mlist = $(chat, '.mlist');
  const avMarks = [];
  const pairs = REQS.map((r, j) => {
    const me = h(`<div class="bub me" style="top:${28 + j * 300}px"><div class="av me">Y</div><div class="bt">${r.text}</div></div>`);
    const ai = h(`<div class="bub ai" style="top:${28 + j * 300 + 118}px"><div class="av ai"></div><div class="bt"><div class="rt">${['claude', 'gemini', 'deepseek'].map((id) => `<span class="chip"><span class="lg"><img src="${logoSrc(id)}" alt=""></span>${PLAN[id].short}</span>`).join('')}</div><div class="rsn"></div></div></div>`);
    const m = makeMark(48); $(ai, '.av').appendChild(m.el); avMarks.push(m);
    mlist.append(me, ai);
    return { me, ai };
  });
  world.appendChild(chat);

  // ---- receipt ------------------------------------------------------------------------------------
  const rc = h(`<div class="rcpt"><h4>Same 3 requests, routed.<small>API list prices, openrouter.ai, Oct 2026</small></h4>
    ${REQS.map((r) => `<div class="rr"><span class="lg"><img src="${logoSrc(r.plan)}" alt=""></span><div class="t">${r.text.length > 44 ? r.text.slice(0, 42) + '…' : r.text}<small>${PLAN[r.plan].short} · via ${PLAN[r.plan].plan}</small></div><span class="m">${money(listCost(PLAN[r.plan], r.tin, r.tout))}</span></div>`).join('')}
    <div class="rtot"><span class="a">Routed by superbot</span><span class="b gtext">${money(COST_ROUTED)}</span></div>
    <div class="rvs"><span>Everything on Opus 5.5</span><span class="m">${money(COST_ALL_OPUS)}<i></i></span></div></div>`);
  const save = h(`<div class="chip" style="height:76px;font-size:34px;padding:0 30px;border-color:rgba(125,251,230,.7);box-shadow:0 0 50px rgba(0,229,195,.35)"><span style="background:var(--agrad);-webkit-background-clip:text;color:transparent;font-weight:800">${(COST_ALL_OPUS / COST_ROUTED).toFixed(1)}x cheaper</span></div>`);
  world.append(rc, save);

  // ---- end ---------------------------------------------------------------------------------------
  const end1 = makeKinetic(['One', 'API', 'key', { mark: true }], 116);
  const end2 = makeKinetic(['for', 'all', 'your', { em: 'subscriptions.' }], 116);
  const lock = makeLockup({ size: 60 });
  lock.el.classList.add('mini');
  stage.append(end1.el, end2.el, lock.el);

  const dot = makeDot();
  world.appendChild(dot);
  S = { bd, world, wins, toasts, cap, ed, edLines, ecaret, flies, rings, pill, head1, head2, models, chat, hm, pairs, avMarks, rc, save, end1, end2, lock, dot };
}

const ED_C = [960, 620];
const PILL_C = [960, 330];
let L = null;
function layout() {
  if (L) return L;
  const ew = S.ed.offsetWidth, eh = S.ed.offsetHeight;
  const vals = S.edLines.slice(0, 4).map((l) => {
    const v = $(l, '.val');
    return [ED_C[0] - ew / 2 + v.offsetLeft + v.offsetWidth / 2, ED_C[1] - eh / 2 + l.offsetTop + l.offsetHeight / 2];
  });
  const pw = S.pill.el.offsetWidth;
  const segX = $$(S.pill.el, '.kp-txt .s').map((s) => PILL_C[0] - pw / 2 + s.offsetLeft + s.offsetWidth / 2);
  const ctaX = PILL_C[0] - pw / 2 + S.pill.cta.offsetLeft + S.pill.cta.offsetWidth / 2;
  const lineH = S.edLines[0].offsetHeight;
  L = { vals, segX, ctaX, pw, lineH, ew, eh };
  return L;
}

function render(t) {
  const Lx = layout();
  const cam = camera(S.world, t, [[0, 960, 540, 1.04], [1.6, 960, 540, 1.0], [PUSH, 960, 470, 1.12], [CHAT0 - 0.35, 960, 540, 1.0], [END_T - 0.2, 960, 540, 0.94]]);
  op(S.world, 1 - smooth((t - END_T + 0.1) / 0.45));
  S.world.style.filter = blurF(1 - smooth((t - END_T + 0.15) / 0.5), 18);
  const ax = track(t, [[0, 1500], [PUSH, 960], [CHAT0, 1350], [RCPT, 700], [END_T, 960]], 40, 13);
  const ay = track(t, [[0, 3000], [0.05, 2480], [PUSH, 2300], [CHAT0, 2520], [RCPT, 2420], [END_T, 2150]], 40, 13);
  const glow = clamp(0.5 + 0.3 * smooth(t / 1.0) + 0.25 * smooth((t - FLY0) / 0.6) - 0.15 * smooth((t - CHAT0) / 0.5) + 0.15 * smooth((t - END_T) / 0.8));
  S.bd.render(t, { ax, ay, glow, floor: 0.75, px: cam.cx - 960, py: cam.cy - 540 });

  // ---- clutter ------------------------------------------------------------------------------------
  const away = (i) => clamp((t - PUSH - i * 0.06) / 0.55);
  S.wins.forEach((el, i) => {
    const w = WINS[i];
    const t0 = 0.1 + i * 0.36;
    const k = sp(t, t0, PRESETS.default);
    const a = away(i), ac = a * a * a;
    const dir = w.x < 960 ? -1 : 1;
    at(el, w.x + ac * dir * 700, w.y + (1 - k) * 140 + ac * 200, 0.88 * (0.9 + 0.1 * k), w.r * k + (1 - k) * 10 * dir + ac * dir * 18);
    op(el, smooth((t - t0) / 0.18) * (1 - smooth((a - 0.5) / 0.5)));
    el.style.filter = blurF(1 - a, 10);
    el.style.zIndex = String(2 + i);
  });
  S.toasts.forEach((el, i) => {
    const t0 = 2.3 + i * 0.32;
    const k = sp(t, t0, PRESETS.snappy);
    const a = away(i + 1), ac = a * a * a;
    at(el, 1530 + (1 - k) * 260 + ac * 600, 98 + i * 78, 1, 0);
    el.style.transformOrigin = '0 0';
    op(el, smooth((t - t0) / 0.15) * (1 - a));
    el.style.zIndex = '20';
  });
  S.cap.render(t - 0.55, { out: smooth((t - PUSH + 0.1) / 0.35), stagger: 0.12 });
  tf(S.cap.el, 'translateY(968px)');
  op(S.cap.el, t > 0.5 && t < PUSH + 0.6 ? 1 : 0);
  S.cap.el.style.zIndex = '25';

  // ---- .env ------------------------------------------------------------------------------------
  const ek = sp(t, ENV0, PRESETS.default);
  at(S.ed, ED_C[0], ED_C[1] + (1 - ek) * 160, 0.92 + 0.08 * ek, (1 - ek) * -3);
  op(S.ed, smooth((t - ENV0) / 0.2) * (1 - smooth((t - CHAT0 + 0.45) / 0.3)));
  S.ed.style.zIndex = '10';
  // lines: value leaves, line folds shut
  S.edLines.slice(0, 4).forEach((l, i) => {
    const f = outCubic(seg(t, flyT(i) + 0.15, flyT(i) + 0.5));
    l.style.height = `${(Lx.lineH * (1 - f)).toFixed(2)}px`;
    l.style.overflow = 'hidden';
    op(l, 1 - smooth(f * 1.4));
    op($(l, '.val'), t < flyT(i) ? 1 : 0);
  });
  const nl = S.edLines[4];
  const open = outCubic(seg(t, dockT(3) - 0.1, dockT(3) + 0.25));
  nl.style.height = `${(Lx.lineH * open).toFixed(2)}px`;
  nl.style.overflow = 'hidden';
  $(nl, '.ln').textContent = '1';
  const ty = typed('SUPERBOT_API_KEY', t, TYPE_T, 55);
  const tyEl = $(nl, '.ty');
  if (tyEl.textContent !== ty) tyEl.textContent = ty;
  const eq = t >= TYPE_T + 16 / 55 ? '=' : '';
  const pasted = t >= PASTE_T;
  const ks = eq + (pasted ? scramble(KEY_FULL, t, PASTE_T, 0.35, 53) : '');
  const ksEl = $(nl, '.ks');
  if (ksEl.dataset.v !== ks) { ksEl.textContent = ks; ksEl.dataset.v = ks; }
  const fl = pasted ? Math.max(0, 1 - (t - PASTE_T) / 0.9) : 0;
  ksEl.style.background = fl > 0.01 ? `rgba(0,229,195,${(0.3 * fl).toFixed(3)})` : 'transparent';
  ksEl.style.borderRadius = '8px';
  ksEl.style.color = '#ffd98a';
  op(S.ecaret, pasted ? 0 : Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
  nl.style.background = pasted ? `rgba(0,229,195,${(0.08 * Math.min(1, (t - PASTE_T) / 0.2)).toFixed(3)})` : 'transparent';

  // flying values -> pill segments
  S.flies.forEach((el, i) => {
    const k = outCubic(seg(t, flyT(i), dockT(i)));
    const p = qb(Lx.vals[i], [lerp(Lx.vals[i][0], Lx.segX[i], 0.5) + 120, 300], [Lx.segX[i], PILL_C[1]], k);
    at(el, p[0], p[1], lerp(1, 0.55, k), 0);
    op(el, t >= flyT(i) && t < dockT(i) + 0.02 ? 1 - smooth((k - 0.8) / 0.2) : 0);
    el.style.zIndex = '30';
  });
  const pk = sp(t, FLY0 - 0.1, PRESETS.heavy);
  const pOut = smooth((t - CHAT0 + 0.45) / 0.3);
  at(S.pill.el, PILL_C[0], PILL_C[1] + (1 - pk) * -40, (0.7 + 0.3 * pk) * (1 + 0.04 * pulse(t, PLANS.map((_, i) => dockT(i)))));
  op(S.pill.el, smooth((t - FLY0 + 0.1) / 0.3) * (1 - pOut));
  S.pill.el.style.zIndex = '28';
  S.pill.render(t, { docks: PLANS.map((_, i) => dockT(i)), tPre: FLY0, tCopied: COPY_T + 0.04 });
  tf(S.pill.cta, `scale(${1 - 0.08 * Math.max(0, 1 - Math.abs(t - COPY_T) / 0.14)})`);
  S.rings.render(t, PILL_C[0], PILL_C[1], [Lx.pw, 128], [dockT(3) + 0.1, COPY_T], 1 - pOut);
  S.rings.el.style.zIndex = '27';
  S.head1.render(t - dockT(3) - 0.05, { out: smooth((t - TYPE_T) / 0.3) });
  tf(S.head1.el, 'translateY(158px)');
  op(S.head1.el, t > dockT(3) && t < TYPE_T + 0.5 ? 1 : 0);
  S.head2.render(t - PASTE_T - 0.35, { out: smooth((t - CHAT0 + 0.45) / 0.3) });
  tf(S.head2.el, 'translateY(158px)');
  op(S.head2.el, t > PASTE_T + 0.3 && t < CHAT0 ? 1 : 0);
  [S.head1.el, S.head2.el].forEach((e) => { e.style.zIndex = '29'; });
  tf(S.models, 'translateY(800px)');
  $$(S.models, '.chip').forEach((c, j) => {
    const t0 = PASTE_T + 0.55 + j * 0.12;
    const k = sp(t, t0, PRESETS.playful);
    tf(c, `translateY(${(1 - k) * 24}px) scale(${0.8 + 0.2 * k})`);
    op(c, smooth((t - t0) / 0.2) * (1 - pOut));
  });
  S.models.style.zIndex = '29';

  // ---- cursor ------------------------------------------------------------------------------------
  const lineY = ED_C[1];
  const curKeys = [[0, 1500, 1100], [6.7, 1500, 1100], [7.25, Lx.ctaX + 8, PILL_C[1] + 8], [7.8, 640, lineY + 20], [PASTE_T - 0.05, 700, lineY + 26], [9.3, 900, 900]];
  placeCursor(S.dot, t, curKeys, [COPY_T, 7.85, PASTE_T], Math.min(smooth((t - 6.65) / 0.25), smooth((9.35 - t) / 0.3)));
  S.dot.style.transform += ` scale(${(1 / cam.s).toFixed(4)})`;
  S.dot.style.zIndex = '60';

  // ---- chat ----------------------------------------------------------------------------------------
  const ck = sp(t, CHAT0, PRESETS.default);
  const cOut = smooth((t - RCPT + 0.4) / 0.35);
  at(S.chat, 960, 560 + (1 - ck) * 140 + cOut * 60, (0.94 + 0.06 * ck) * (1 - 0.04 * cOut));
  op(S.chat, smooth((t - CHAT0) / 0.3) * (1 - cOut));
  S.hm.render(t);
  const scroll = track(t, [[0, 0], [CQ[2] - 0.05, -250]], 120, 22);
  tf($(S.chat, '.mlist'), `translateY(${scroll}px)`);
  S.pairs.forEach(({ me, ai }, j) => {
    const t0 = CQ[j];
    const km = sp(t, t0, PRESETS.default);
    tf(me, `translateY(${(1 - km) * 40}px) scale(${0.94 + 0.06 * km})`);
    me.style.transformOrigin = '100% 0';
    op(me, smooth((t - t0) / 0.2));
    const ka = sp(t, t0 + 0.45, PRESETS.default);
    tf(ai, `translateY(${(1 - ka) * 40}px) scale(${0.94 + 0.06 * ka})`);
    ai.style.transformOrigin = '0 0';
    op(ai, smooth((t - t0 - 0.45) / 0.2));
    S.avMarks[j].render(t);
    // routing: chips scan, then the winner locks
    const r = REQS[j];
    const wi = ['claude', 'gemini', 'deepseek'].indexOf(r.plan);
    const lock = t0 + 1.25;
    $$(ai, '.rt .chip').forEach((c, i) => {
      const scan = t > t0 + 0.6 && t < lock ? (Math.floor((t - t0 - 0.6) / 0.16) % 3 === i ? 1 : 0) : 0;
      const won = t >= lock && i === wi ? smooth((t - lock) / 0.15) : 0;
      const lost = t >= lock && i !== wi ? smooth((t - lock) / 0.15) : 0;
      c.style.borderColor = won > 0 ? `rgba(125,251,230,${(0.2 + 0.7 * won).toFixed(3)})` : scan ? 'rgba(125,251,230,.5)' : '';
      c.style.boxShadow = won > 0 ? `0 0 ${(36 * won).toFixed(0)}px rgba(0,229,195,${(0.45 * won).toFixed(3)})` : 'none';
      op(c, 1 - 0.6 * lost);
      tf(c, `scale(${1 + 0.06 * won})`);
    });
    const rsn = $(ai, '.rsn');
    const txt = t >= lock ? `Routed to <b>${PLAN[r.plan].short}</b> via ${PLAN[r.plan].plan} · ${r.why}` : 'Picking the best model…';
    if (rsn.dataset.v !== txt) { rsn.innerHTML = txt; rsn.dataset.v = txt; }
    op(rsn, t >= lock ? smooth((t - lock) / 0.2) : 0.55 + 0.25 * Math.sin(t * 9));
  });

  // ---- receipt ---------------------------------------------------------------------------------
  const rk = sp(t, RCPT, PRESETS.default);
  at(S.rc, 960, 545 + (1 - rk) * 120, 0.94 + 0.06 * rk);
  op(S.rc, smooth((t - RCPT) / 0.3));
  $$(S.rc, '.rr').forEach((r, i) => { const t0 = RCPT + 0.3 + i * 0.22; const k = sp(t, t0, PRESETS.default); tf(r, `translateX(${(1 - k) * -30}px)`); op(r, smooth((t - t0) / 0.2)); });
  const tot = $(S.rc, '.rtot'), vs = $(S.rc, '.rvs');
  op(tot, smooth((t - RCPT - 1.05) / 0.25)); tf(tot, `translateY(${(1 - sp(t, RCPT + 1.05, PRESETS.default)) * 20}px)`);
  op(vs, smooth((t - RCPT - 1.35) / 0.25));
  tf($(vs, 'i'), `scaleX(${outCubic(seg(t, RCPT + 1.7, RCPT + 2.0))})`);
  const sk = sp(t, RCPT + 2.05, PRESETS.playful);
  at(S.save, 960 + 400, 545 - 300, 0.6 + 0.4 * sk, -4);
  op(S.save, smooth((t - RCPT - 2.05) / 0.2));

  // ---- end ---------------------------------------------------------------------------------------
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
