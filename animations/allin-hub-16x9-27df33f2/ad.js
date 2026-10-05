// allin-hub-16x9-27df33f2: "Superbot is all your agents in one", hub cut (32 s, 16:9).
// 1) Four subscription cards orbit a superbot key card in 3D and slot into it one by one.
// 2) Hub: a request leaves the composer, hits the superbot hub, three model nodes score it and
//    the winning link fires (Opus 5.5, Gemini 3.1 Pro, DeepSeek V4.1). 3) Claude Code, Codex,
//    Gemini CLI and Cursor in a coverflow are absorbed into the mascot, which opens into one agent
//    board that deals each step into the column of the model it routed to. 4) bars. 5) end line.
import { h, $, $$, op, tf, clamp, lerp, smooth, outCubic, inOutCubic, sp, PRESETS, tile, PLANS, PLAN, KEY_PRE, REQS, ROUTE_MODELS, COST_ALL_OPUS, COST_ROUTED, money, scramble, typed, makeMark, camera, makeCaption, makeEnd, boot, win } from './kit.js';
import { LINE, AGENTS, TASK, STEPS, makeAgentWin, limAt, posIn, arc } from './allin.js';

export const DUR = 32;
export const T = {
  slot: [1.3, 1.95, 2.6, 3.25], flyDur: 0.6, full: 3.95, turn: 4.1,
  hub: 7.4, req: [7.85, 9.95, 12.05],
  desk: 14.6, run0: 15.05, runGap: 0.2, merge: 17.85, board: 18.75, deal0: 20.0, dealGap: 0.55,
  bars: 25.0, end: 28.4,
};
const KC = { x: 460, y: 250, w: 1000, h: 440 };
const ORB = { cx: 960, cy: 470, rx: 790, ry: 290, w: 0.55 };
const NODES = { claude: [470, 330], gemini: [960, 210], deepseek: [1450, 330] };
const HUB = [960, 590];
const COMP = { x: 410, y: 820, w: 1100, h: 84 };
const FLOW = [[440, 440, 28], [790, 450, 10], [1130, 450, -10], [1480, 440, -28]];
const BOARD = { x: 140, y: 90, w: 1640, h: 860 };
const COLS = ['claude', 'gemini', 'deepseek', 'openai'];
const COLW = 372, COLG = 24;

let S = null;

function mount(stage) {
  // scene A: orbiting cards around a key card
  const wA = h(`<div class="world wA"></div>`);
  const kc = h(`<div class="kcard" style="left:${KC.x}px;top:${KC.y}px;width:${KC.w}px;height:${KC.h}px">
    <div class="kc-top"><span class="kmk"></span><b>superbot</b><span class="kl">API KEY</span></div>
    <div class="kk"><span class="pre">${KEY_PRE}</span>${PLANS.map((p) => `<span class="slot" style="--c:${p.color}"><span class="sv">${p.seg}</span></span>`).join('')}</div>
    <div class="kc-plans">${PLANS.map((p) => `<span class="kp" style="--c:${p.color}">${tile(p.id, 'xs')}${p.plan}</span>`).join('')}</div>
    <div class="sheen"></div></div>`);
  const kMark = makeMark(54); $(kc, '.kmk').appendChild(kMark.el);
  const cards = PLANS.map((p) => h(`<div class="ocard" style="--c:${p.color}">${tile(p.id)}<div><b>${p.plan}</b><small>${p.vendor} · ${p.short}</small></div></div>`));
  wA.append(kc, ...cards);

  // scene B: hub and three model nodes
  const wB = h(`<div class="world wB"></div>`);
  const svg = `<svg class="links" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="lg27" x1="0" x2="1"><stop offset="0" stop-color="#5b8dff"/><stop offset="1" stop-color="#b06bff"/></linearGradient></defs>
    ${ROUTE_MODELS.map((id) => `<line class="lk0" x1="${HUB[0]}" y1="${HUB[1]}" x2="${NODES[id][0]}" y2="${NODES[id][1]}"/><line class="lk1" data-id="${id}" x1="${HUB[0]}" y1="${HUB[1]}" x2="${NODES[id][0]}" y2="${NODES[id][1]}"/>`).join('')}</svg>`;
  wB.appendChild(h(svg));
  const nodes = ROUTE_MODELS.map((id) => {
    const n = h(`<div class="node" style="left:${NODES[id][0]}px;top:${NODES[id][1]}px;--c:${PLAN[id].color}">
      <svg class="ring" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" class="r0"/><circle cx="80" cy="80" r="70" class="r1" style="stroke:${PLAN[id].color}"/></svg>
      ${tile(id, 'lg')}<div class="nn"><b>${PLAN[id].model}</b><small>via ${PLAN[id].plan}</small></div><div class="ns num">0.00</div></div>`);
    wB.appendChild(n); return n;
  });
  const hub = h(`<div class="hub" style="left:${HUB[0]}px;top:${HUB[1]}px"><div class="hring"></div><span class="hmk"></span></div>`);
  const hMark = makeMark(120); $(hub, '.hmk').appendChild(hMark.el);
  const pkt = h(`<div class="pkt"></div>`);
  const bub = h(`<div class="bub"></div>`);
  const comp = h(`<div class="comp" style="left:${COMP.x}px;top:${COMP.y}px;width:${COMP.w}px;height:${COMP.h}px"><span class="ctx"></span><span class="ccar"></span><span class="csend">↑</span></div>`);
  const rlab = h(`<div class="rlab">${REQS.map((r) => `<div class="rl">${tile(r.plan, 'xs')}<b>${PLAN[r.plan].model}</b><span>via ${PLAN[r.plan].plan} · ${r.why}</span></div>`).join('')}</div>`);
  wB.append(hub, pkt, bub, comp, rlab);

  // scene C: coverflow of agents, mascot, board
  const wC = h(`<div class="world wC"></div>`);
  const wins = AGENTS.map((a) => { const w = makeAgentWin(a, 640, 400); wC.appendChild(w.el); return w; });
  const core = h(`<div class="core"><span class="cmk"></span></div>`);
  const cMark = makeMark(170); $(core, '.cmk').appendChild(cMark.el);
  const board = h(`<div class="board" style="left:${BOARD.x}px;top:${BOARD.y}px;width:${BOARD.w}px;height:${BOARD.h}px">
    <div class="aw-bar sba-bar"><div class="dots"><i></i><i></i><i></i></div><span class="sba-mk"></span><span class="aw-ttl"><b>superbot</b> agent · ~/app</span><span class="sba-auto">model: auto</span></div>
    <div class="btask"><span class="tp"></span><span class="bst dim">6 steps · 4 models · 1 key</span></div>
    ${COLS.map((id, c) => `<div class="col" style="left:${40 + c * (COLW + COLG)}px;--c:${PLAN[id].color}"><div class="ch">${tile(id, 'sm')}<div><b>${PLAN[id].short}</b><small>via ${PLAN[id].plan}</small></div><span class="cn num"></span></div></div>`).join('')}
    ${STEPS.map((s, i) => `<div class="scard" style="--c:${PLAN[s.plan].color}"><div class="sc-t"><span class="sn">${i + 1}</span>${s.text}</div><div class="sc-m">${tile(s.plan, 'xs')}<b>${PLAN[s.plan].short}</b><span class="dim">${s.why}</span><i class="sck"></i></div></div>`).join('')}
  </div>`);
  const bMark = makeMark(30); $(board, '.sba-mk').appendChild(bMark.el);
  wC.append(core, board);

  // scene D: horizontal bars
  const hb = h(`<div class="hbars"><div class="hb-h"><b>Same 3 requests</b><span>list prices, read Oct 5 2026</span></div>
    <div class="hbr a"><div class="hl">Everything on Opus 5.5</div><div class="ht"><i></i></div><div class="hv num"></div></div>
    <div class="hbr b"><div class="hl">Routed by Superbot</div><div class="ht"><i></i></div><div class="hv num"></div></div>
    <div class="hx"><b class="num">${(COST_ALL_OPUS / COST_ROUTED).toFixed(1)}×</b> cheaper for the same work</div></div>`);

  const sceneA = h(`<div class="scene"></div>`); sceneA.appendChild(wA);
  const sceneB = h(`<div class="scene"></div>`); sceneB.appendChild(wB);
  const sceneC = h(`<div class="scene p3d"></div>`); sceneC.appendChild(wC);
  const end = makeEnd(LINE);
  const cap = makeCaption([
    [0.3, 3.7, 'Every AI subscription you already pay for…'],
    [3.9, 7.1, '…packed into one Superbot API key.'],
    [7.7, 10.6, 'Ask once. Superbot reads the request…'],
    [10.8, 14.35, '…and sends it to Opus 5.5, Gemini or DeepSeek.'],
    [14.9, 17.7, 'Four agents. Four separate limits.'],
    [18.6, 21.4, 'Superbot pulls them into one agent.'],
    [21.6, 24.75, 'Each step goes to the model that does it best.'],
  ]);
  stage.append(sceneA, sceneB, sceneC, hb, end.el, cap.el);
  S = { wA, kc, kMark, cards, wB, nodes, hub, hMark, pkt, bub, comp, rlab, wC, wins, core, cMark, board, bMark, hb, end, cap, sceneA, sceneB, sceneC, geo: null };
}

function geometry() {
  return { slots: $$(S.kc, '.slot').map((e) => posIn(e, S.wA)) };
}

const orbit = (i, t) => {
  const a = (i / 4) * Math.PI * 2 + t * ORB.w - Math.PI / 2;
  const d = Math.sin(a);
  return { x: ORB.cx + ORB.rx * Math.cos(a), y: ORB.cy + ORB.ry * d, d };
};

function renderA(t) {
  const { kc, cards, kMark } = S, g = S.geo;
  camera(S.wA, t, [[0, 960, 500, 0.98], [T.full, 960, 500, 1.0], [T.turn + 0.6, 960, 470, 1.32], [T.hub, 960, 470, 1.38]]);
  // key card: tilted while it fills, turns flat with a sheen once full
  const ft = inOutCubic((t - T.turn) / 0.9);
  const imp = T.slot.reduce((s, ts) => s + (t >= ts + T.flyDur ? Math.exp(-(t - ts - T.flyDur) * 6) * Math.sin((t - ts - T.flyDur) * 18) : 0), 0);
  tf(kc, `perspective(1600px) rotateX(${lerp(10, 0, ft) + imp * 1.5}deg) rotateY(${lerp(-14, 0, ft) + Math.sin(t * 0.8) * 2 * (1 - ft)}deg) scale(${1 + 0.012 * imp})`);
  op($(kc, '.sheen'), t > T.turn + 0.3 ? 1 : 0);
  tf($(kc, '.sheen'), `translateX(${lerp(-500, 1500, inOutCubic((t - T.turn - 0.3) / 0.9))}px) skewX(-20deg)`);
  kMark.render(t);
  let full = 0;
  $$(kc, '.slot').forEach((s, i) => {
    const ta = T.slot[i] + T.flyDur, on = t >= ta;
    s.classList.toggle('on', on);
    $(s, '.sv').textContent = on ? scramble(PLANS[i].seg, t, ta, 0.3, 21 + i) : '';
    s.style.setProperty('--f', on ? Math.exp(-(t - ta) * 3).toFixed(3) : '0');
    $$(kc, '.kp')[i].classList.toggle('on', on);
    if (on) full++;
  });
  kc.style.setProperty('--glow', (t >= T.full ? Math.exp(-(t - T.full) * 1.2) : 0).toFixed(3));
  // orbiting cards; each leaves its orbit in turn and dives into its slot
  cards.forEach((c, i) => {
    const ts = T.slot[i];
    const o = orbit(i, Math.min(t, ts));
    const sc = 0.78 + 0.22 * o.d;
    if (t < ts) {
      const live = orbit(i, t);
      tf(c, `translate(${live.x}px, ${live.y}px) translate(-50%, -50%) scale(${0.78 + 0.22 * live.d})`);
      c.style.zIndex = live.d > -0.05 ? 5 : 1;
      c.style.filter = `brightness(${0.55 + 0.45 * (live.d + 1) / 2})`;
      op(c, smooth((t - 0.05 - i * 0.08) / 0.3));
    } else {
      const u = inOutCubic((t - ts) / T.flyDur), p = arc(u, o, { x: g.slots[i].cx, y: g.slots[i].cy }, 70);
      tf(c, `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${lerp(sc, 0.22, u)})`);
      c.style.zIndex = 6; c.style.filter = 'none';
      op(c, 1 - smooth((u - 0.75) / 0.25));
    }
  });
}

function renderB(t) {
  const { nodes, hub, hMark, pkt, bub, comp, rlab } = S;
  camera(S.wB, t, [[T.hub, 960, 560, 0.94], [T.req[0] + 0.5, 960, 545, 1.0], [T.desk, 960, 540, 1.04]]);
  let ri = 0; REQS.forEach((r, i) => { if (t >= T.req[i] - 0.1) ri = i; });
  const r = REQS[ri], tq = T.req[ri];
  // composer: type, send, the request travels into the hub as a bubble
  const ctx = $(comp, '.ctx');
  ctx.textContent = t < tq + 0.7 ? typed(r.text, t, tq, r.text.length / 0.6) : '';
  $(comp, '.ccar').style.opacity = t > tq + 0.65 && t < tq + 0.9 ? '0' : (Math.floor(t * 2.4) % 2 ? '0.25' : '1');
  const ks = sp(t, tq + 0.68, PRESETS.snappy);
  tf($(comp, '.csend'), `scale(${t >= tq + 0.6 && t < tq + 0.85 ? 0.88 + 0.12 * ks : 1})`);
  const bu = inOutCubic((t - tq - 0.62) / 0.36);
  bub.textContent = r.text;
  const bp = { x: lerp(960, HUB[0], bu), y: lerp(COMP.y + 42, HUB[1], bu) };
  tf(bub, `translate(${bp.x}px, ${bp.y}px) translate(-50%, -50%) scale(${lerp(1, 0.15, bu)})`);
  op(bub, t >= tq + 0.62 && bu < 1 ? 1 - smooth((bu - 0.7) / 0.3) : 0);
  // hub pulse on arrival
  const hp = t >= tq + 0.98 ? Math.exp(-(t - tq - 0.98) * 3) : 0;
  hub.style.setProperty('--p', hp.toFixed(3));
  tf($(hub, '.hmk'), `scale(${1 + 0.08 * hp})`);
  hMark.render(t);
  // rings fill to each model's fit; the winner's link fires
  ROUTE_MODELS.forEach((id, j) => {
    const prev = ri > 0 ? REQS[ri - 1].fit[j] : 0;
    const kb = sp(t, tq + 1.0 + j * 0.05, PRESETS.default), v = clamp(lerp(prev, r.fit[j], clamp(kb, 0, 1.06)));
    const n = nodes[j], C = 2 * Math.PI * 70;
    $(n, '.r1').style.strokeDasharray = `${(v * C).toFixed(1)} ${C.toFixed(1)}`;
    $(n, '.ns').textContent = v.toFixed(2);
    const won = r.plan === id && t >= tq + 1.4;
    n.classList.toggle('won', won);
    const kw = won ? sp(t, tq + 1.6, PRESETS.playful) : 0;
    tf(n, `translate(-50%, -50%) scale(${won ? 1 + 0.1 * clamp(kw, 0, 1.2) : 1 - 0.06 * (t >= tq + 1.4 ? 1 : 0)})`);
    op(n, smooth((t - T.hub - 0.1 - j * 0.1) / 0.3) * (t >= tq + 1.4 && !won ? 0.5 : 1));
    const l1 = $(S.wB, `.lk1[data-id="${id}"]`), len = Math.hypot(NODES[id][0] - HUB[0], NODES[id][1] - HUB[1]);
    const lu = won ? outCubic((t - tq - 1.4) / 0.3) : 0;
    l1.style.strokeDasharray = `${(lu * len).toFixed(1)} ${len.toFixed(1)}`;
  });
  const wj = ROUTE_MODELS.indexOf(r.plan), pu = (t - tq - 1.4) / 0.3;
  op(pkt, pu > 0 && pu < 1 ? 1 : 0);
  tf(pkt, `translate(${lerp(HUB[0], NODES[r.plan][0], outCubic(pu))}px, ${lerp(HUB[1], NODES[r.plan][1], outCubic(pu))}px)`);
  $$(rlab, '.rl').forEach((e, i) => { const a = i === ri ? smooth((t - T.req[i] - 1.62) / 0.16) : 0; op(e, a); tf(e, `translateY(${(1 - a) * 12}px)`); });
  void wj;
  op(hub, smooth((t - T.hub) / 0.3)); op(comp, smooth((t - T.hub - 0.15) / 0.3));
  op($(S.wB, '.links'), smooth((t - T.hub - 0.2) / 0.3));
}

function renderC(t) {
  const { wins, core, cMark, board, bMark } = S;
  camera(S.wC, t, [[T.desk, 960, 450, 0.95], [T.merge, 960, 455, 0.98], [T.board - 0.1, 960, 470, 1.06], [T.board + 0.7, 960, 520, 1.0], [T.bars, 960, 525, 1.02]]);
  const mu = inOutCubic((t - T.merge) / 0.6);
  wins.forEach((w, i) => {
    const [cx, cy, ry] = FLOW[i], kin = sp(t, T.desk + i * 0.12, PRESETS.snappy);
    const st = T.merge + i * 0.06, u = inOutCubic((t - st) / 0.55);
    const x = lerp(cx, 960, u) - 320, y = lerp(cy, 470, u) - 200;
    w.el.style.left = '0px'; w.el.style.top = '0px';
    tf(w.el, `translate(${x}px, ${y + (1 - kin) * 160}px) rotateY(${ry * (1 - u)}deg) scale(${lerp(1, 0.06, u)})`);
    w.el.style.zIndex = i === 1 || i === 2 ? 3 : 2;
    op(w.el, smooth((t - T.desk - i * 0.12) / 0.2) * (1 - smooth((u - 0.8) / 0.2)));
    const run0 = T.run0 + i * T.runGap;
    w.render(t - run0);
    const la = run0 + limAt(AGENTS[i]);
    w.el.style.setProperty('--hit', (t >= la ? Math.exp(-(t - la) * 3) : 0).toFixed(3));
  });
  // core mascot gulps each window, then opens into the board
  const kc = sp(t, T.merge - 0.05, PRESETS.playful);
  const gulp = [0, 1, 2, 3].reduce((s, i) => { const ta = T.merge + i * 0.06 + 0.55; return s + (t >= ta ? Math.exp(-(t - ta) * 7) : 0); }, 0);
  const bo = inOutCubic((t - T.board) / 0.55);
  tf(core, `translate(960px, 470px) translate(-50%, -50%) scale(${clamp(kc, 0, 1.15) * (1 + 0.12 * gulp) * (1 + 0.6 * bo)})`);
  op(core, smooth((t - T.merge + 0.05) / 0.15) * (1 - smooth((t - T.board - 0.25) / 0.25)));
  cMark.render(t);
  const rad = lerp(0, 1900, bo);
  board.style.clipPath = `circle(${rad.toFixed(0)}px at ${960 - BOARD.x}px ${470 - BOARD.y}px)`;
  op(board, t >= T.board ? 1 : 0);
  bMark.render(t);
  const lt = t - T.board;
  $(board, '.tp').textContent = typed(TASK, lt, 0.5, 40);
  op($(board, '.bst'), smooth((lt - 1.5) / 0.2));
  $$(board, '.col').forEach((c, ci) => { op(c, smooth((lt - 0.6 - ci * 0.08) / 0.25)); tf(c, `translateY(${(1 - sp(t, T.board + 0.6 + ci * 0.08, PRESETS.snappy)) * 30}px)`); });
  // deal: each step card flies from the task bar into its model's column
  const counts = { claude: 0, gemini: 0, deepseek: 0, openai: 0 }, landed = { claude: 0, gemini: 0, deepseek: 0, openai: 0 };
  $$(board, '.scard').forEach((el, i) => {
    const s = STEPS[i], c = COLS.indexOf(s.plan), k = counts[s.plan]++;
    const x = 40 + c * (COLW + COLG) + 14, y = 190 + 84 + k * 116;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    const td = T.deal0 + i * T.dealGap, u = inOutCubic((t - td) / 0.45);
    const p = arc(u, { x: 820 - 172, y: 113 }, { x, y }, 60);
    tf(el, `translate(${p.x - x}px, ${p.y - y}px) rotate(${(1 - u) * (c < 2 ? -6 : 6)}deg) scale(${lerp(0.6, 1, u)})`);
    op(el, smooth((t - td) / 0.12));
    if (t >= td + 0.45) landed[s.plan]++;
    el.classList.toggle('ok', t >= td + 1.25);
    el.style.setProperty('--l', (t >= td + 0.45 ? Math.exp(-(t - td - 0.45) * 3) : 0).toFixed(3));
  });
  $$(board, '.col').forEach((c, ci) => { const n = landed[COLS[ci]]; $(c, '.cn').textContent = n ? `${n}` : ''; });
}

function renderD(t) {
  const lt = t - T.bars, hb = S.hb;
  const k = sp(lt, 0, PRESETS.heavy);
  tf($(hb, '.hb-h'), `translateY(${(1 - k) * 24}px)`); op($(hb, '.hb-h'), smooth(lt / 0.3));
  const a = outCubic((lt - 0.35) / 0.8), b = outCubic((lt - 0.65) / 0.8);
  $(hb, '.a .ht i').style.width = (a * 100).toFixed(2) + '%';
  $(hb, '.b .ht i').style.width = (b * 100 * COST_ROUTED / COST_ALL_OPUS).toFixed(2) + '%';
  $(hb, '.a .hv').textContent = money(COST_ALL_OPUS * a);
  $(hb, '.b .hv').textContent = money(COST_ROUTED * b);
  $$(hb, '.hbr').forEach((r, i) => op(r, smooth((lt - 0.2 - i * 0.3) / 0.2)));
  const kx = sp(lt, 1.6, PRESETS.playful);
  op($(hb, '.hx'), smooth((lt - 1.6) / 0.15)); tf($(hb, '.hx'), `scale(${0.85 + 0.15 * kx})`);
}

function render(t) {
  if (!S.geo) S.geo = geometry();
  const aA = 1 - smooth((t - T.hub + 0.25) / 0.35);
  const aB = win(t, T.hub - 0.15, T.desk + 0.1, 0.35, 0.3);
  const aC = win(t, T.desk - 0.1, T.bars + 0.05, 0.3, 0.3);
  op(S.sceneA, aA); op(S.sceneB, aB); op(S.sceneC, aC);
  tf(S.sceneA, `scale(${1 + 0.08 * smooth((t - T.hub + 0.25) / 0.35)})`);
  tf(S.sceneB, `scale(${1 - 0.05 * smooth((t - T.desk + 0.1) / 0.3)})`);
  if (aA > 0) renderA(t);
  if (aB > 0) renderB(t);
  if (aC > 0) renderC(t);
  const aD = win(t, T.bars - 0.1, T.end + 0.1, 0.3, 0.3);
  op(S.hb, aD); if (aD > 0) renderD(t);
  const aE = smooth((t - T.end) / 0.3);
  op(S.end.el, aE); if (aE > 0) S.end.render(t - T.end);
  S.cap.render(t);
}

if (typeof document !== 'undefined') boot({ DUR, mount, render });
