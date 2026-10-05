// onekey-aurora "stack" (16:9, bdadac04): four stacked consoles pile up, their keys pack
// into one glowing pill, Copy, paste into one SDK line, three requests route to three models.
import {
  makeBackdrop, makeKinetic, makeDot, makeRings, provCard, makeKeyPill, makeEditor, modelCard,
  renderModelCard, makeCost, makeLockup, at, qb, SPARK, CHECK, blurF,
  h, $, $$, op, tf, clamp, lerp, seg, smooth, outCubic, outQuint, sp, PRESETS, track, makeMark,
} from './aurora.js';
import { PLANS, PLAN, REQS, KEY_PRE, KEY_FULL, BASE_URL, COST_ALL_OPUS, COST_ROUTED, placeCursor, camera, boot, typed, scramble, swapAlpha, logoSrc } from './kit.js';

const DUR = 27;
const COLS = [235, 700, 1165, 1630];
const KINDS = ['login', 'dash', 'key'];
const LAND = { login: 2.55, dash: 3.75, key: 4.95 };
const ROW_Y = { login: 330, dash: 545, key: 760 };
const R = (i, k) => [-2.5, 1.8, -1.2, 2.6][i] * (k === 'dash' ? -0.8 : k === 'key' ? 0.5 : 1);
const PACK0 = 7.1;
const dockT = (i) => PACK0 + 0.25 + i * 0.22 + 0.55;
const COPY_T = 10.7;
const PASTE_T = 12.75;
const RQ = [15.45, 17.4, 19.3]; // request starts
const COST_T = 21.35;
const END_T = 23.25;

let S = {};

async function mount(stage) {
  const bd = makeBackdrop();
  const world = h('<div class="world"></div>');
  stage.append(bd.el, world);

  // ---- hook title -------------------------------------------------------------------
  const t1 = makeKinetic(['Four', 'AI', { em: 'subscriptions.' }], 118);
  const t1sub = h('<div class="kin" style="font-size:34px;font-weight:650;color:#a9bccb;letter-spacing:0">Four logins. Four dashboards. Four API keys.</div>');
  world.append(t1.el, t1sub);

  // ---- counters --------------------------------------------------------------------
  const counters = ['logins', 'dashboards', 'API keys'].map((w) => h(`<div class="chip bad"><span class="n">0</span>${w}</div>`));
  world.append(...counters);

  // ---- clutter cards ---------------------------------------------------------------------
  const cards = [];
  KINDS.forEach((k) => PLANS.forEach((p, i) => { const el = provCard(p, k); world.appendChild(el); cards.push({ el, k, i, p }); }));

  // ---- pack: pill, rings, headline -----------------------------------------------------
  const rings = makeRings(3);
  const pill = makeKeyPill(PLANS, 'Copy');
  const packHead = makeKinetic(['Packed', 'into', { em: 'one key.' }], 78);
  const packSub = h('<div class="kin" style="font-size:28px;font-weight:650;color:#9fb4c3">Claude Max · ChatGPT Pro · Google AI Pro · DeepSeek</div>');
  world.append(rings.el, pill.el, packHead.el, packSub);

  // ---- paste scene (world y + 1160) ---------------------------------------------------
  const pasteHead = makeKinetic(['Paste', 'it', { em: 'once.' }], 84);
  const keyEsc = KEY_FULL;
  const ed = makeEditor('app.py', [
    '<span class="k">from</span> openai <span class="k">import</span> OpenAI',
    ' ',
    `ai = OpenAI(base_url=<span class="s">"${BASE_URL}"</span>, api_key=<span class="s">"<span class="kslot hl"></span><span class="kcaret"></span>"</span>)`,
    ' ',
    '<span class="c"># one key, every model, picked per request</span>',
    `r = ai.chat.completions.create(model=<span class="s">"auto"</span>, messages=msgs)`,
  ], 1720);
  ed.querySelector('.ed-b').style.fontSize = '27px';
  const slot = $(ed, '.kslot'), caret = $(ed, '.kcaret');
  caret.style.cssText = 'display:inline-block;width:3px;height:30px;vertical-align:-5px;background:#7dfbe6';
  const edLines = $$(ed, '.ed-b .l');
  const modelsRow = h(`<div class="kin" style="gap:18px"></div>`);
  const chipsSpec = [['claude', 'Opus 5.5'], ['openai', 'GPT-6.1'], ['gemini', 'Gemini 3.1 Pro'], ['deepseek', 'DeepSeek V4.1']];
  const chips = chipsSpec.map(([id, nm]) => h(`<div class="chip" style="position:relative"><span class="lg"><img src="${logoSrc(id)}" alt=""></span>${nm}<span class="ok">${CHECK}</span></div>`));
  modelsRow.append(...chips);
  const clip = h(`<div class="chip" style="font-family:var(--mono);font-size:21px;border-color:rgba(125,251,230,.6)"><span class="ok">${CHECK}</span>${KEY_PRE}${PLANS[0].seg}…</div>`);
  world.append(pasteHead.el, ed, modelsRow);

  // ---- route scene (world x + 2040, y + 1160) -----------------------------------------
  const routeHead = makeKinetic(['Every', 'request', 'gets', 'the', { em: 'best model.' }], 64);
  const ask = h(`<div class="gpill" style="width:1440px"><span class="q"><span class="ph">Ask anything…</span><span class="tx"></span><span class="caret"></span></span><span class="cta">${SPARK}Send</span></div>`);
  const router = h('<div class="gcard" style="width:132px;height:132px;border-radius:66px;display:grid;place-items:center"></div>');
  const routerMark = makeMark(96);
  router.appendChild(routerMark.el);
  const autoTag = h('<div class="chip" style="height:46px;font-size:19px;padding:0 18px"><span class="n">model="auto"</span></div>');
  const svg = h(`<svg class="abs" style="left:0;top:0;overflow:visible" width="1" height="1">${[0, 1, 2].map(() => '<path fill="none" stroke="rgba(125,251,230,.28)" stroke-width="3" stroke-linecap="round"/>').join('')}${[0, 1, 2].map(() => '<path fill="none" stroke="#7dfbe6" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 0 8px #00e5c3)"/>').join('')}</svg>`);
  const packet = h('<div class="abs" style="left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#dffff9;box-shadow:0 0 0 6px rgba(0,229,195,.25),0 0 30px #00e5c3"></div>');
  const mcs = ['claude', 'gemini', 'deepseek'].map((id) => modelCard(PLAN[id]));
  world.append(routeHead.el, svg, ask, router, autoTag, ...mcs, packet);

  // ---- cost scene (world x + 2040, y 0) ------------------------------------------------
  const costWrap = h('<div class="abs" style="left:2040px;top:0;width:1920px;height:1080px"></div>');
  const cost = makeCost([
    { label: 'All on Opus 5.5', sub: 'one model for everything', v: COST_ALL_OPUS, bg: 'linear-gradient(90deg,#4b5361,#7d8796)' },
    { label: 'Routed by superbot', sub: 'Opus · Gemini · DeepSeek', v: COST_ROUTED, bg: 'linear-gradient(92deg,#8dfbe9,#2fe0d0 40%,#4fb8ff 75%,#a98bff)' },
  ], 'Same 3 requests.', 'At API list prices (openrouter.ai, Oct 2026)');
  const save = h(`<div class="chip" style="height:76px;font-size:34px;padding:0 30px;border-color:rgba(125,251,230,.7);box-shadow:0 0 50px rgba(0,229,195,.35)"><span style="background:var(--agrad);-webkit-background-clip:text;color:transparent;font-weight:800">${(COST_ALL_OPUS / COST_ROUTED).toFixed(1)}x cheaper</span></div>`);
  costWrap.append(cost.el, save);
  world.append(costWrap);

  // ---- end (screen space) --------------------------------------------------------------
  const end1 = makeKinetic(['One', 'API', 'key', { mark: true }], 116);
  const end2 = makeKinetic(['for', 'all', 'your', { em: 'subscriptions.' }], 116);
  const lock = makeLockup({ size: 60 });
  lock.el.classList.add('mini');
  stage.append(end1.el, end2.el, lock.el);

  const dot = makeDot();
  world.append(clip, dot);

  S = { bd, world, t1, t1sub, counters, cards, rings, pill, packHead, packSub, pasteHead, ed, slot, caret, edLines, modelsRow, chips, clip, routeHead, ask, router, routerMark, autoTag, svg, packet, mcs, costWrap, cost, save, end1, end2, lock, dot };
}

let L = null; // layout measured once fonts are in
function layout() {
  if (L) return L;
  // offsetLeft/Top resolve against the nearest positioned ancestor: the pill, the editor, the ask pill
  const pw = S.pill.el.offsetWidth;
  const cta = S.pill.cta;
  const pillC = [960, 600];
  const ctaX = pillC[0] - pw / 2 + cta.offsetLeft + cta.offsetWidth / 2;
  const segEls = $$(S.pill.el, '.kp-txt .s');
  const segX = segEls.map((s) => pillC[0] - pw / 2 + s.offsetLeft + s.offsetWidth / 2);
  const ew = S.ed.offsetWidth, eh = S.ed.offsetHeight;
  const edC = [960, 1700];
  const line = S.edLines[2];
  const slotX = edC[0] - ew / 2 + S.slot.offsetLeft;
  const slotY = edC[1] - eh / 2 + line.offsetTop + line.offsetHeight / 2;
  const askW = S.ask.offsetWidth;
  const askCta = $(S.ask, '.cta');
  const sendX = 3000 - askW / 2 + askCta.offsetLeft + askCta.offsetWidth / 2;
  L = { pw, ctaX, ctaY: pillC[1], pillC, segX, edC, ew, eh, slotX, slotY, sendX, sendY: 1420 };
  return L;
}

const MC_X = [2490, 3000, 3510], MC_Y = 1835, ROUTER = [3000, 1590];
const pathD = (i) => {
  const x = MC_X[i], y0 = ROUTER[1] + 66, y1 = MC_Y - 98;
  return `M ${ROUTER[0]} ${y0} C ${ROUTER[0]} ${y0 + 60}, ${x} ${y1 - 70}, ${x} ${y1}`;
};
const bez = (i, k) => {
  const x = MC_X[i], y0 = ROUTER[1] + 66, y1 = MC_Y - 98;
  const P = [[ROUTER[0], y0], [ROUTER[0], y0 + 60], [x, y1 - 70], [x, y1]];
  const u = 1 - k;
  return [0, 1].map((d) => u * u * u * P[0][d] + 3 * u * u * k * P[1][d] + 3 * u * k * k * P[2][d] + k * k * k * P[3][d]);
};

function render(t) {
  const Lx = layout();
  // ---- camera ---------------------------------------------------------------------------
  const cam = camera(S.world, t, [
    [0, 960, 540, 1], [2.4, 960, 560, 1.0], [4.0, 960, 545, 1.03], [6.9, 960, 540, 1.0],
    [9.75, Lx.ctaX - 120, 600, 1.0], [10.05, Lx.ctaX - 60, 600, 1.55],
    [11.05, 960, 1200, 1.0], [11.35, 960, 1700, 1.0], [13.6, 960, 1700, 1.0],
    [14.75, 3000, 1700, 1.0], [COST_T - 0.25, 3000, 540, 1.0], [END_T - 0.2, 3000, 540, 0.94],
  ]);
  op(S.world, 1 - smooth((t - END_T + 0.1) / 0.45));
  S.world.style.filter = blurF(1 - smooth((t - END_T + 0.15) / 0.5), 18);

  // ---- backdrop ---------------------------------------------------------------------
  const ax = track(t, [[0, 1250], [2.4, 1350], [6.9, 960], [11.2, 700], [14.7, 1200], [COST_T, 960], [END_T, 960]], 40, 13);
  const ay = track(t, [[0, 3000], [0.05, 2330], [2.4, 2420], [6.9, 2260], [8.4, 2190], [11.2, 2400], [14.7, 2360], [COST_T, 2330], [END_T, 2150]], 40, 13);
  const glow = 0.55 + 0.45 * smooth(t / 1.2) - 0.25 * win2(t, 2.6, 6.8) + 0.2 * win2(t, 7.4, 10.5) + 0.15 * smooth((t - END_T) / 0.8);
  S.bd.render(t, { ax, ay, as: 1, glow: clamp(glow), floor: 0.8, px: cam.cx - 960, py: cam.cy - 540, dia: 1 });

  // ---- hook --------------------------------------------------------------------------------
  const hookOut = smooth((t - 2.25) / 0.35);
  if (t < 3) {
    S.t1.render(t - 0.15, { out: hookOut });
    tf(S.t1.el, 'translateY(410px)');
    tf(S.t1sub, `translateY(${560 + (1 - sp(t, 0.75, PRESETS.default)) * 30 - hookOut * 30}px)`);
    op(S.t1sub, smooth((t - 0.75) / 0.3) * (1 - hookOut));
  } else { op(S.t1.el, 0); op(S.t1sub, 0); }
  if (t < 3) op(S.t1.el, 1);

  // ---- counters ----------------------------------------------------------------------------
  const cOut = smooth((t - PACK0) / 0.4);
  S.counters.forEach((c, j) => {
    const k = KINDS[j];
    const t0 = LAND[k] - 0.2;
    const kk = sp(t, t0, PRESETS.snappy);
    const n = PLANS.filter((_, i) => t >= LAND[k] + i * 0.16 + 0.12).length;
    $(c, '.n').textContent = String(n);
    const x = 960 + (j - 1) * 330;
    at(c, x, 92 - cOut * 40, 0.85 + 0.15 * kk);
    op(c, smooth((t - t0) / 0.2) * (1 - cOut));
  });

  // ---- clutter cards -------------------------------------------------------------------
  S.cards.forEach(({ el, k, i }) => {
    const tl = LAND[k] + i * 0.16;
    const kk = sp(t, tl, PRESETS.default);
    const x0 = COLS[i] + (k === 'dash' ? 28 : k === 'key' ? 56 : 0);
    const y0 = ROW_Y[k];
    const jit = Math.sin(t * 1.3 + i * 1.7 + k.length) * 1.2;
    let x = x0, y = y0 + (1 - kk) * 160, s = 0.8 * (0.9 + 0.1 * kk), r = R(i, k) * kk + (1 - kk) * 8 + jit * kk, a = smooth((t - tl) / 0.18);
    if (k !== 'key') {
      // fall away
      const f = clamp((t - PACK0 - i * 0.07 - (k === 'dash' ? 0.05 : 0)) / 0.6);
      const fc = f * f * f;
      y += fc * 900; r += fc * (i % 2 ? 26 : -26); a *= 1 - smooth(f * 1.3);
    } else {
      // fly into the pill
      const t0 = PACK0 + 0.25 + i * 0.22;
      const f = outCubic(seg(t, t0, t0 + 0.55));
      if (t > t0) {
        const p = qb([x0, y0], [lerp(x0, 960, 0.5), 180], [Lx.segX[i], Lx.pillC[1]], f);
        x = p[0]; y = p[1]; s = lerp(0.8, 0.14, f); r = lerp(r, 0, f);
        a *= 1 - smooth((f - 0.75) / 0.25);
      }
    }
    at(el, x, y, s, r);
    op(el, a);
    el.style.zIndex = String(k === 'login' ? 1 : k === 'dash' ? 2 : 3);
  });

  // ---- pill + rings ---------------------------------------------------------------------
  const docks = PLANS.map((_, i) => dockT(i));
  const pk = sp(t, PACK0 + 0.05, PRESETS.heavy);
  const pillOut = smooth((t - 11.2) / 0.3);
  at(S.pill.el, Lx.pillC[0], Lx.pillC[1], (0.6 + 0.4 * pk) * (1 + 0.04 * pulse(t, docks)), 0);
  op(S.pill.el, smooth((t - PACK0) / 0.3) * (1 - pillOut));
  S.pill.render(t, { docks, tPre: PACK0 + 0.15, tCopied: COPY_T + 0.05 });
  const ctaPress = Math.max(0, 1 - Math.abs(t - COPY_T) / 0.14);
  tf(S.pill.cta, `scale(${1 - 0.07 * ctaPress})`);
  S.rings.render(t, Lx.pillC[0], Lx.pillC[1], [Lx.pw, 128], docks.concat([dockT(3) + 0.5]), 1 - pillOut);

  const ph0 = dockT(3) + 0.25;
  S.packHead.render(t - ph0, { out: smooth((t - 9.85) / 0.35) });
  tf(S.packHead.el, 'translateY(392px)');
  op(S.packHead.el, t > ph0 - 0.05 && t < 10.6 ? 1 : 0);
  const ps = sp(t, ph0 + 0.35, PRESETS.default);
  tf(S.packSub, `translateY(${738 + (1 - ps) * 24}px)`);
  op(S.packSub, smooth((t - ph0 - 0.35) / 0.3) * (1 - smooth((t - 9.85) / 0.3)));

  // ---- cursor (world space, counter-scaled) ------------------------------------------------
  const curKeys = [
    [0, 1560, 1100], [9.55, 1560, 1100], [10.15, Lx.ctaX + 10, Lx.ctaY + 8],
    [11.15, Lx.ctaX - 120, 1350], [11.6, Lx.slotX + 40, Lx.slotY + 26], [PASTE_T + 0.4, Lx.slotX + 60, Lx.slotY + 60],
    [14.6, 2900, 1650], [15.0, Lx.sendX + 40, 1490], [15.6, Lx.sendX + 6, 1426],
    [16.6, Lx.sendX + 40, 1480], [17.95, Lx.sendX + 6, 1426], [18.6, Lx.sendX + 40, 1480], [19.85, Lx.sendX + 6, 1426], [20.5, Lx.sendX + 60, 1500],
  ];
  const clicks = [COPY_T, PASTE_T - 0.05, RQ[0] + 0.85, RQ[1] + 0.75, RQ[2] + 0.62];
  const curA = win(t, 9.5, 21.0, 0.25, 0.35) * (t > 14.0 && t < 14.7 ? 0 : 1);
  placeCursor(S.dot, t, curKeys, clicks, curA);
  S.dot.style.transform += ` scale(${(1 / cam.s).toFixed(4)})`;

  // clipboard chip rides the cursor from Copy to the slot
  {
    const cx = track(t, curKeys.map((k) => [k[0], k[1]]), 120, 22), cy = track(t, curKeys.map((k) => [k[0], k[2]]), 120, 22);
    const a = win(t, COPY_T + 0.15, PASTE_T + 0.05, 0.2, 0.12);
    const k = sp(t, COPY_T + 0.15, PRESETS.snappy);
    tf(S.clip, `translate(${cx + 34}px, ${cy + 30}px) scale(${(0.6 + 0.4 * k) / cam.s})`);
    S.clip.style.transformOrigin = '0 0';
    op(S.clip, a);
  }

  // ---- paste scene ------------------------------------------------------------------------
  S.pasteHead.render(t - 11.35, { out: smooth((t - 14.3) / 0.3) });
  tf(S.pasteHead.el, 'translateY(1238px)');
  op(S.pasteHead.el, t > 11.3 && t < 14.8 ? 1 : 0);
  const ek = sp(t, 11.2, PRESETS.default);
  at(S.ed, Lx.edC[0], Lx.edC[1] + (1 - ek) * 120, 0.94 + 0.06 * ek);
  op(S.ed, smooth((t - 11.2) / 0.3));
  const pasted = t >= PASTE_T;
  const key = pasted ? scramble(KEY_FULL, t, PASTE_T, 0.35, 77) : '';
  if (S.slot.dataset.v !== key) { S.slot.textContent = key; S.slot.dataset.v = key; }
  const fl = pasted ? Math.max(0, 1 - (t - PASTE_T) / 0.9) : 0;
  S.slot.style.background = fl > 0.01 ? `rgba(0,229,195,${(0.32 * fl).toFixed(3)})` : 'transparent';
  S.slot.style.boxShadow = fl > 0.01 ? `0 0 ${(30 * fl).toFixed(0)}px rgba(0,229,195,${(0.5 * fl).toFixed(3)})` : 'none';
  S.slot.style.color = '#ffd98a';
  op(S.caret, Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
  [4, 5].forEach((li, j) => { const t0 = PASTE_T + 0.45 + j * 0.25; op(S.edLines[li], smooth((t - t0) / 0.25)); tf(S.edLines[li], `translateX(${(1 - outCubic(seg(t, t0, t0 + 0.4))) * -24}px)`); });
  const lineGlow = pasted ? win(t, PASTE_T, 14.4, 0.15, 0.5) : 0;
  S.edLines[2].style.background = lineGlow > 0.01 ? `rgba(0,229,195,${(0.07 * lineGlow).toFixed(3)})` : 'transparent';
  tf(S.modelsRow, 'translateY(2060px)');
  S.chips.forEach((c, j) => {
    const t0 = PASTE_T + 0.7 + j * 0.13;
    const k = sp(t, t0, PRESETS.playful);
    tf(c, `translateY(${(1 - k) * 26}px) scale(${0.8 + 0.2 * k})`);
    op(c, smooth((t - t0) / 0.2));
  });

  // ---- route scene ----------------------------------------------------------------------------
  S.routeHead.render(t - 14.85, {});
  tf(S.routeHead.el, 'translateY(1214px) translateX(2040px)');
  op(S.routeHead.el, t > 14.7 ? 1 : 0);
  S.routeHead.el.style.width = '1920px'; S.routeHead.el.style.right = 'auto';
  const ak = sp(t, 15.0, PRESETS.default);
  at(S.ask, 3000, 1420 + (1 - ak) * 40, 0.94 + 0.06 * ak);
  op(S.ask, smooth((t - 15.0) / 0.3));
  // which request is live
  let ri = -1; for (let j = 0; j < 3; j++) if (t >= RQ[j]) ri = j;
  const req = ri >= 0 ? REQS[ri] : null;
  const tx = req ? typed(req.text, t, RQ[ri] + 0.05, ri === 0 ? 82 : 70) : '';
  const txEl = $(S.ask, '.tx');
  if (txEl.dataset.v !== tx) { txEl.textContent = tx; txEl.dataset.v = tx; }
  op($(S.ask, '.ph'), tx ? 0 : 1);
  $(S.ask, '.ph').style.display = tx ? 'none' : '';
  op($(S.ask, '.caret'), Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
  const sendT = ri >= 0 ? RQ[ri] + [0.85, 0.75, 0.62][ri] : 1e9;
  tf($(S.ask, '.cta'), `scale(${1 - 0.08 * Math.max(0, 1 - Math.abs(t - sendT) / 0.14)})`);
  // router
  const rk = sp(t, 15.15, PRESETS.heavy);
  at(S.router, ROUTER[0], ROUTER[1], rk * (1 + 0.06 * Math.max(0, 1 - Math.abs(t - sendT - 0.1) / 0.25)));
  op(S.router, smooth((t - 15.1) / 0.25));
  S.routerMark.render(t);
  at(S.autoTag, ROUTER[0] + 190, ROUTER[1], 1);
  op(S.autoTag, smooth((t - 15.4) / 0.25));
  // paths
  const paths = $$(S.svg, 'path');
  for (let i = 0; i < 3; i++) {
    const d = pathD(i);
    if (paths[i].getAttribute('d') !== d) { paths[i].setAttribute('d', d); paths[i + 3].setAttribute('d', d); }
    const len = 330;
    const draw = outCubic(seg(t, 15.2 + i * 0.08, 15.75 + i * 0.08));
    paths[i].style.strokeDasharray = `${len}`; paths[i].style.strokeDashoffset = `${(1 - draw) * len}`;
    const win_i = req && ['claude', 'gemini', 'deepseek'].indexOf(req.plan) === i;
    const pk2 = win_i ? outCubic(seg(t, sendT + 0.12, sendT + 0.5)) : 0;
    const fade = win_i ? 1 - smooth((t - (ri < 2 ? RQ[ri + 1] - 0.1 : 30)) / 0.2) : 0;
    paths[i + 3].style.strokeDasharray = `${len}`; paths[i + 3].style.strokeDashoffset = `${(1 - pk2) * len}`;
    op(paths[i + 3], pk2 > 0 ? fade : 0);
  }
  // packet
  if (req && t > sendT + 0.1) {
    const i = ['claude', 'gemini', 'deepseek'].indexOf(req.plan);
    const k = outCubic(seg(t, sendT + 0.12, sendT + 0.5));
    const p = bez(i, k);
    tf(S.packet, `translate(${p[0]}px, ${p[1]}px) scale(${1 - 0.3 * smooth((k - 0.8) / 0.2)})`);
    op(S.packet, k < 1 ? 1 : 1 - smooth((t - sendT - 0.5) / 0.15));
  } else op(S.packet, 0);
  // model cards
  S.mcs.forEach((c, i) => {
    const t0 = 15.3 + i * 0.1;
    const k = sp(t, t0, PRESETS.default);
    at(c, MC_X[i], MC_Y + (1 - k) * 60, 0.94 + 0.06 * k);
    op(c, smooth((t - t0) / 0.25));
    let fit = 0, hot = 0, dim = 0, why = '';
    if (req) {
      const fk = outCubic(seg(t, sendT + 0.1, sendT + 0.55));
      const reset = ri > 0 ? 1 - outCubic(seg(t, RQ[ri], RQ[ri] + 0.25)) : 0;
      fit = req.fit[i] * fk + (ri > 0 ? REQS[ri - 1].fit[i] * reset : 0) * (fk < 0.01 ? 1 : 0);
      const isWin = ['claude', 'gemini', 'deepseek'].indexOf(req.plan) === i;
      const hk = smooth((t - sendT - 0.5) / 0.18);
      if (isWin) { hot = hk; why = `<b>${req.why}</b>`; } else dim = hk * 0.8;
    }
    renderModelCard(c, t, { fit, hot, dim, why });
  });

  // ---- cost -------------------------------------------------------------------------------
  S.cost.render(t - COST_T);
  op(S.cost.el, t > COST_T - 0.05 ? 1 : 0);
  const sk = sp(t, COST_T + 1.35, PRESETS.playful);
  at(S.save, 960 + 330, 540 + 250, 0.6 + 0.4 * sk);
  op(S.save, smooth((t - COST_T - 1.35) / 0.2));

  // ---- end ------------------------------------------------------------------------------
  const e0 = END_T + 0.2;
  S.end1.render(t - e0, { stagger: 0.09 });
  S.end2.render(t - e0 - 0.32, { stagger: 0.08 });
  const lift = sp(t, END_T + 1.9, PRESETS.heavy);
  tf(S.end1.el, `translateY(${330 - lift * 70}px)`);
  tf(S.end2.el, `translateY(${470 - lift * 70}px)`);
  op(S.end1.el, t > e0 ? 1 : 0); op(S.end2.el, t > e0 ? 1 : 0);
  S.lock.render(t - END_T - 2.0);
  op(S.lock.el, t > END_T + 1.95 ? 1 : 0);
}

function win2(t, a, b) { return Math.min(smooth((t - a) / 0.5), smooth((b - t) / 0.5)); }
function win(t, a, b, fi, fo) { return Math.min(smooth((t - a) / fi), smooth((b - t) / fo)); }
function pulse(t, ts) { let v = 0; for (const x of ts) { const d = t - x; if (d >= 0 && d < 0.4) v = Math.max(v, Math.sin((d / 0.4) * Math.PI) * (1 - d / 0.4)); } return v; }

boot({ DUR, mount, render });
