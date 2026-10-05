// Cut 2 "orbit": subscription tiles orbit in 3D and dock into a capsule key -> node-graph router + activity log
// -> plan gauge vs pay-per-token odometer -> end line.
import * as K from './kit.mjs';
const { h, css, text, box, show, sp, tr, seg, clamp, lerp, PRESETS: P, PLANS, PLAN_ORDER, MODELS, REQUESTS } = K;
const DUR = 22;
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

const TYPE = [8.4, 11.0, 13.0], SEND = [9.35, 11.85, 13.8], LOCK = [10.4, 12.6, 14.45], NEXT = [10.95, 12.95, Infinity];
const REASON = ['code + reasoning', '2-hour video · long context', '10k items · bulk + cheap'];
const NODES = [0, 2, 3]; // model indexes shown as nodes: Opus 5.5, Gemini 3.1 Pro, DeepSeek V4.1 Flash
const NODE_Y = [250, 480, 710];
const HUB = { x: 960, y: 480 };
const TILE = 170;
const CAP = { x: 340, y: 455, w: 1240, h: 160 };
const SLOT = (i) => ({ x: CAP.x + 88 + i * 112, y: CAP.y + CAP.h / 2 });
const DOCK = [4.25, 4.55, 4.85, 5.15];
let S;

function mount(stage) {
  S = {};
  S.bd = K.backdrop(stage);
  S.hA1 = K.words(stage, 'You pay for *four* AI plans.', 'headline display', 140, 82);
  S.hA2 = K.words(stage, 'Your API still pays *per token.*', 'headline display', 140, 82);
  S.hB = K.words(stage, '*One* key. Every plan inside.', 'headline display', 250, 82);

  // ---- capsule key ----
  S.capMove = h('div', 'layer', stage);
  S.capMove.style.transformOrigin = '0 0';
  S.cap = box(h('div', 'card', S.capMove), CAP.x, CAP.y, CAP.w, CAP.h);
  S.cap.style.borderRadius = '80px';
  S.capGlow = box(h('div', 'abs', S.capMove), CAP.x - 2, CAP.y - 2, CAP.w + 4, CAP.h + 4);
  S.capGlow.style.cssText += 'border-radius:82px;border:2px solid rgba(0,229,195,.85);box-shadow:0 0 0 7px rgba(0,229,195,.07),0 0 70px rgba(0,229,195,.35)';
  PLAN_ORDER.forEach((id, i) => {
    const s = SLOT(i);
    const ring = box(h('div', 'abs', S.capMove), s.x - 50, s.y - 50, 100, 100);
    ring.style.cssText += 'border-radius:26px;border:1.5px dashed rgba(255,255,255,.14)';
  });
  S.capKey = h('div', 'abs mono', S.capMove);
  S.capKey.style.cssText += `left:${CAP.x + 520}px;top:${CAP.y + 34}px;font-size:46px;color:#f1f5f6;white-space:pre`;
  S.capSub = h('div', 'abs muted', S.capMove, '1 API key · 4 subscriptions · OpenAI-compatible');
  S.capSub.style.cssText += `left:${CAP.x + 522}px;top:${CAP.y + 100}px;font-size:21px`;
  S.charge = PLAN_ORDER.map((id, i) => {
    const w = (CAP.w - 36) / 4;
    const segEl = box(h('div', 'abs', S.capMove), CAP.x + i * (w + 12), CAP.y + CAP.h + 40, w, 10);
    segEl.style.cssText += 'border-radius:5px;background:rgba(255,255,255,.07);overflow:hidden';
    const fill = h('div', 'abs', segEl);
    fill.style.cssText += `width:100%;height:100%;background:${PLANS[id].color};transform-origin:0 50%;border-radius:5px`;
    const lab = box(h('div', 'abs muted', S.capMove), CAP.x + i * (w + 12), CAP.y + CAP.h + 62);
    lab.textContent = PLANS[id].plan;
    lab.style.fontSize = '19px';
    return { fill, lab };
  });
  S.ripCap = K.makeRipple(stage, 960, 535, 1600);
  S.ripDock = PLAN_ORDER.map((_, i) => K.makeRipple(stage, SLOT(i).x, SLOT(i).y, 260));

  // ---- orbiting tiles ----
  S.ring = box(h('div', 'abs', stage), 960 - 560, 560 - 110, 1120, 220);
  S.ring.style.cssText += 'border-radius:50%;border:1.5px solid rgba(0,229,195,.22);box-shadow:0 0 40px rgba(0,229,195,.08),inset 0 0 40px rgba(0,229,195,.06)';
  S.tiles = PLAN_ORDER.map((id) => {
    const wrap = h('div', 'abs', stage);
    wrap.style.width = TILE + 'px';
    const t = K.logoTile(wrap, id, TILE);
    t.style.borderRadius = '38px';
    t.style.boxShadow = '0 30px 60px rgba(0,0,0,.5)';
    const lab = h('div', '', wrap, PLANS[id].plan);
    lab.style.cssText = 'position:absolute;left:-50px;width:270px;top:186px;text-align:center;font-size:24px;font-weight:600;color:#e8eef0;white-space:nowrap';
    return { wrap, lab };
  });

  // ---- node graph router ----
  S.graph = h('div', 'layer', stage);
  S.graph.style.transformOrigin = '960px 520px';
  S.edges = svgEl('svg', { width: 1920, height: 1080 }, S.graph);
  S.edges.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  S.eIn = svgEl('path', { d: `M 620 ${HUB.y} L ${HUB.x - 112} ${HUB.y}`, fill: 'none', stroke: 'rgba(255,255,255,.14)', 'stroke-width': 2 }, S.edges);
  S.eOut = NODE_Y.map((y) => svgEl('path', { d: `M ${HUB.x + 112} ${HUB.y} C 1190 ${HUB.y}, 1170 ${y}, 1300 ${y}`, fill: 'none', stroke: 'rgba(255,255,255,.14)', 'stroke-width': 2 }, S.edges));
  S.eLit = svgEl('path', { fill: 'none', stroke: '#00e5c3', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, S.edges);
  S.eLit.style.filter = 'drop-shadow(0 0 8px rgba(0,229,195,.85))';
  S.packet = svgEl('circle', { r: 9, fill: '#c9fff6' }, S.edges);
  S.packet.style.filter = 'drop-shadow(0 0 10px rgba(0,229,195,1))';

  S.req = box(h('div', 'card', S.graph), 100, 330, 520, 300);
  h('div', 'abs mono muted', S.req, 'POST /v1/chat/completions').style.cssText += 'left:30px;top:28px;font-size:18px';
  const ml = h('div', 'abs mono', S.req, 'model: <span style="color:#00e5c3">"auto"</span>');
  ml.style.cssText += 'left:30px;top:62px;font-size:20px;color:#cfd6d9';
  S.bubble = h('div', 'abs', S.req);
  S.bubble.style.cssText += 'left:30px;right:30px;top:108px;min-height:96px;border-radius:16px;background:#070b0c;border:1px solid rgba(255,255,255,.1);padding:18px 22px;font-size:27px;line-height:1.25;color:#f1f5f6';
  S.reqTxt = h('span', '', S.bubble);
  S.caret = h('span', 'caret', S.bubble);
  S.auth = h('div', 'abs mono', S.req, `Authorization: Bearer <span style="color:#8df5e6">${K.KEY_MASK}</span>`);
  S.auth.style.cssText += 'left:30px;top:244px;font-size:16px;color:#7f8a8f;white-space:nowrap';

  S.hub = box(h('div', 'abs', S.graph), HUB.x - 112, HUB.y - 112, 224, 224);
  S.hub.style.cssText += 'border-radius:50%;background:radial-gradient(circle at 50% 40%,#13201f,#070b0c 70%);border:1px solid rgba(0,229,195,.35);display:flex;align-items:center;justify-content:center';
  S.hubSpin = box(h('div', 'abs', S.graph), HUB.x - 132, HUB.y - 132, 264, 264);
  S.hubSpin.style.cssText += 'border-radius:50%;border:3px solid transparent;border-top-color:#00e5c3;border-right-color:rgba(0,229,195,.35)';
  S.hubMark = K.makeMark(h('div', '', S.hub), 104);
  S.hubCap = h('div', 'abs', S.graph);
  S.hubCap.style.cssText += `left:${HUB.x - 300}px;width:600px;top:${HUB.y + 150}px;text-align:center`;
  h('div', '', S.hubCap, 'superbot router · auto').style.cssText = 'font-size:22px;font-weight:600;color:#e8eef0';
  S.reason = h('div', 'pill on', S.hubCap);
  S.reason.style.cssText += 'margin-top:12px;font-size:19px';
  S.reasonTxt = h('span', '', S.reason);

  S.nodes = NODES.map((mi, k) => {
    const m = MODELS[mi];
    const n = box(h('div', 'card', S.graph), 1300, NODE_Y[k] - 75, 540, 150);
    const tl = h('div', 'abs', n); tl.style.cssText += 'left:24px;top:24px';
    K.logoTile(tl, m.id, 58);
    h('div', 'abs', n, m.name).style.cssText += 'left:100px;top:24px;font-size:28px;font-weight:600;color:#f1f5f6;white-space:nowrap';
    h('div', 'abs mono', n, m.slug).style.cssText += 'left:100px;top:62px;font-size:15px;color:#5d676c';
    const pr = h('div', 'abs tnum', n);
    pr.style.cssText += 'left:24px;top:102px;font-size:19px;color:#c4cdd1;white-space:nowrap';
    const prT = h('span', '', pr, `${K.priceLabel(m)} per 1M`);
    const strike = h('div', 'abs', pr);
    strike.style.cssText += 'top:50%;height:2px;background:#ff6b5b;transform-origin:0 50%;left:-3px';
    const bill = h('div', 'abs pill', n);
    bill.style.cssText += 'left:auto;right:22px;top:92px;height:38px;font-size:18px';
    K.logoTile(bill, m.id, 22).style.borderRadius = '6px';
    const billT = h('span', '', bill, PLANS[m.id].plan);
    return { n, pr, prT, strike, bill, billT, mi };
  });

  S.log = box(h('div', 'abs', S.graph), 100, 838, 1740, 190);
  const LG = '360px 300px 330px 330px 1fr';
  const lh = h('div', '', S.log);
  lh.style.cssText = `display:grid;grid-template-columns:${LG};height:34px;align-items:center;padding:0 20px;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:#5d676c;border-bottom:1px solid rgba(255,255,255,.08)`;
  ['Activity · model', 'Tokens in / out', 'Billed to', 'Per-token list price', 'You pay'].forEach((c) => h('div', '', lh, c));
  S.logRows = REQUESTS.map((r) => {
    const m = MODELS[r.model];
    const row = h('div', '', S.log);
    row.style.cssText = `display:grid;grid-template-columns:${LG};height:48px;align-items:center;padding:0 20px;font-size:20px;color:#dfe5e7;border-bottom:1px solid rgba(255,255,255,.05)`;
    h('div', 'mono', row, m.slug).style.fontSize = '17px';
    h('div', 'tnum muted', row, `${K.fmtInt(r.tin)} / ${K.fmtInt(r.tout)}`);
    h('div', '', row, PLANS[m.id].plan);
    h('div', 'tnum', row, `<s style="color:#ff6b5b">${K.fmtUSD(K.reqCost(r))}</s>`);
    h('div', 'tnum', row, '<b style="color:#00e5c3">$0.00</b>');
    return row;
  });
  S.ripNode = K.makeRipple(S.graph, 1570, 480, 520);
  // the capsule and its docked tiles fly in front of the graph they dock into
  stage.appendChild(S.capMove);
  S.tiles.forEach((tl) => stage.appendChild(tl.wrap));

  // ---- gauge vs odometer ----
  S.hD = K.words(stage, 'Your plans stay *flat.* Per-token keeps climbing.', 'headline display', 110, 64);
  S.cards = h('div', 'layer', stage);
  S.gC = box(h('div', 'card', S.cards), 150, 240, 780, 640);
  S.oC = box(h('div', 'card', S.cards), 990, 240, 780, 640);
  S.oC.style.borderColor = 'rgba(255,107,91,.28)';
  const gh = h('div', 'abs', S.gC);
  gh.style.cssText += 'left:38px;top:32px;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600';
  S.gMark = K.makeMark(h('div', '', gh), 38);
  h('span', '', gh, 'superbot · plan usage');
  const g = svgEl('svg', { width: 780, height: 330 }, S.gC);
  g.style.cssText = 'position:absolute;left:0;top:90px';
  const R = 220, cx = 390, cy = 290;
  const arc = (a0, a1) => {
    const p = (a) => [cx + R * Math.cos(Math.PI + a * Math.PI), cy + R * Math.sin(Math.PI + a * Math.PI)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  svgEl('path', { d: arc(0, 1), fill: 'none', stroke: 'rgba(255,255,255,.08)', 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
  S.gArc = svgEl('path', { d: arc(0, 1), fill: 'none', stroke: '#00e5c3', 'stroke-width': 26, 'stroke-linecap': 'round', pathLength: 100 }, g);
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI + (k / 10) * Math.PI;
    svgEl('line', { x1: cx + (R - 40) * Math.cos(a), y1: cy + (R - 40) * Math.sin(a), x2: cx + (R - 52) * Math.cos(a), y2: cy + (R - 52) * Math.sin(a), stroke: 'rgba(255,255,255,.25)', 'stroke-width': 2 }, g);
  }
  S.needle = svgEl('line', { x1: cx, y1: cy, x2: cx - (R - 30), y2: cy, stroke: '#ecf6f4', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  svgEl('circle', { cx, cy, r: 13, fill: '#ecf6f4' }, g);
  S.gPct = h('div', 'abs big-num tnum', S.gC);
  S.gPct.style.cssText += 'left:auto;right:38px;top:34px;font-size:24px;color:#9aa6ab';
  S.gNum = h('div', 'abs big-num', S.gC, '$0.00');
  S.gNum.style.cssText += 'left:0;width:780px;top:432px;text-align:center;font-size:104px;color:#00e5c3';
  h('div', 'abs muted', S.gC, 'extra this month · used inside the plans you already pay for').style.cssText += 'left:0;width:780px;top:566px;text-align:center;font-size:21px';

  const oh = h('div', 'abs', S.oC);
  oh.style.cssText += 'left:38px;top:32px;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600;color:#ffd9d4';
  h('span', '', oh, '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff6b5b"></span>');
  h('span', '', oh, 'Same requests, pay-per-token');
  S.odo = h('div', 'abs big-num cost', S.oC);
  S.odo.style.cssText += 'left:38px;top:150px;height:150px;font-size:136px;line-height:150px;display:flex;overflow:hidden';
  // $ D , D D D . D D
  const layout = ['$', 6, ',', 5, 4, 3, '.', 2, 1];
  S.cols = [];
  layout.forEach((c) => {
    if (typeof c === 'string') { const sep = h('span', '', S.odo, c); if (c === ',') S.comma = sep; return; }
    const col = h('span', '', S.odo);
    col.style.cssText = 'display:inline-block;height:150px;overflow:hidden;position:relative;width:0.62em';
    const strip = h('span', '', col);
    strip.style.cssText = 'position:absolute;left:0;top:0;display:flex;flex-direction:column;width:100%;text-align:center';
    for (let d = 0; d <= 10; d++) h('span', '', strip, String(d % 10)).style.height = '150px';
    S.cols.push({ place: c, strip, col });
  });
  S.oSub = h('div', 'abs muted tnum', S.oC);
  S.oSub.style.cssText += 'left:42px;top:318px;font-size:22px';
  S.oSpark = svgEl('svg', { width: 700, height: 200 }, S.oC);
  S.oSpark.style.cssText = 'position:absolute;left:40px;top:390px;overflow:visible';
  S.oFill = svgEl('path', { fill: 'rgba(255,107,91,.12)' }, S.oSpark);
  S.oLine = svgEl('path', { fill: 'none', stroke: '#ff6b5b', 'stroke-width': 4 }, S.oSpark);

  S.ripEnd = K.makeRipple(stage, 960, 520, 1700);
  S.outro = K.makeOutro(stage);
  K.finish(stage);
}

// orbit position of tile i at time t
function orbit(i, t) {
  const spin = 22 * t + 300 * sp(t, 3.9, P.heavy);
  const a = ((spin + i * 90) * Math.PI) / 180;
  const z = Math.cos(a);
  return { x: 960 + 560 * Math.sin(a), y: 560 + 110 * z, z, s: lerp(0.68, 1.12, (z + 1) / 2) };
}

const climbN = (t) => {
  const p = seg(t, 15.45, 18.4);
  return 3 + 997 * p * p * (1.6 - 0.6 * p);
};
const TOTAL3 = K.reqCost(REQUESTS[0]) + K.reqCost(REQUESTS[1]) + K.reqCost(REQUESTS[2]);

function render(t) {
  const hy = tr(t, [[0, 1220], [0.05, 900], [7.7, 1060], [15.0, 980], [18.4, 830]], P.heavy);
  K.horizonAt(S.bd, hy, 1, t < 8 ? 0.9 : 0.4);
  K.wordsAt(S.hA1, t, 0.2, 1.95);
  K.wordsAt(S.hA2, t, 2.05, 3.85);
  K.wordsAt(S.hB, t, 6.1, 7.35);

  // the capsule (with its docked tiles) flies into the request card's auth line
  const cm = sp(t, 7.55, P.default);
  const reqTarget = { x: 130, y: 574, s: 0.34 };
  const cs = lerp(1, reqTarget.s, cm);
  const ctx = lerp(0, reqTarget.x - CAP.x * reqTarget.s, cm), cty = lerp(0, reqTarget.y - CAP.y * reqTarget.s, cm);
  const capT = `translate3d(${ctx.toFixed(2)}px,${cty.toFixed(2)}px,0) scale(${cs.toFixed(4)})`;
  css(S.capMove, { transform: capT });

  // ---- tiles: orbit, then dock ----
  S.tiles.forEach((tl, i) => {
    const o = orbit(i, t);
    const pin = sp(t, 0.3 + i * 0.18, P.playful);
    const pd = sp(t, DOCK[i] - 0.35, P.default);
    const sl = SLOT(i);
    const x = lerp(o.x, sl.x, pd), y = lerp(o.y, sl.y, pd);
    const s = lerp(o.s, 96 / TILE, pd) * clamp(pin, 0, 1.2);
    const depth = lerp((o.z + 1) / 2, 1, pd);
    css(tl.wrap, {
      transformOrigin: '0 0',
      transform: `${capT} translate3d(${(x - (TILE / 2) * s).toFixed(2)}px,${(y - (TILE / 2) * s).toFixed(2)}px,0) scale(${s.toFixed(4)})`,
      opacity: (clamp(pin * 1.5) * lerp(0.4, 1, depth)).toFixed(3),
      zIndex: String(pd > 0.5 ? 300 : Math.round(o.z * 100) + 100),
      visibility: t < 8.6 ? 'visible' : 'hidden',
    });
    css(tl.lab, { opacity: (1 - seg(pd, 0, 0.25)).toFixed(3) });
    K.rippleAt(S.ripDock[i], t, DOCK[i], 0.6);
    css(S.charge[i].fill, { transform: `scaleX(${sp(t, DOCK[i], P.snappy).toFixed(4)})` });
  });
  const ringIn = sp(t, 0.1, P.heavy), ringOut = sp(t, 4.0, P.default);
  css(S.ring, { opacity: (ringIn * (1 - ringOut)).toFixed(3), transform: `scale(${(lerp(0.6, 1, ringIn) * lerp(1, 0.2, ringOut)).toFixed(4)})` });
  const capIn = sp(t, 4.05, P.default);
  show(S.capMove, clamp(capIn * 1.4) * (1 - seg(t, 8.25, 8.55)));
  css(S.cap, { transform: `scale(${lerp(0.9, 1, capIn).toFixed(4)})` });
  const glow = sp(t, 5.85, P.snappy);
  css(S.capGlow, { opacity: glow.toFixed(3) });
  const keyS = K.scramble(K.KEY_PREFIX + PLAN_ORDER.map((p) => PLANS[p].seg).join(''), t, 5.25, 0.035, 300);
  text(S.capKey, keyS);
  css(S.capSub, { opacity: sp(t, 6.2, P.default).toFixed(3) });
  S.charge.forEach((c, i) => css(c.lab, { opacity: sp(t, DOCK[i], P.default).toFixed(3) }));
  K.rippleAt(S.ripCap, t, 6.0, 1.2);

  // ---- graph ----
  const ge = sp(t, 7.8, P.heavy), gx = sp(t, 14.95, P.heavy);
  const sway = tr(t, [[0, 0], [10.9, -4], [12.9, 4], [14.9, 0]], P.heavy);
  css(S.graph, {
    transform: `perspective(2200px) translate3d(0,${((1 - ge) * 80 - gx * 60).toFixed(2)}px,0) rotateX(${((1 - ge) * 22 + 5 * ge + gx * 26).toFixed(3)}deg) rotateY(${sway.toFixed(3)}deg) scale(${(lerp(0.9, 0.97, ge) * lerp(1, 0.8, gx)).toFixed(4)})`,
  });
  show(S.graph, clamp(ge * 2) * (1 - clamp(gx * 1.7)));
  if (t > 7.6 && t < 16.2) renderGraph(t);

  // ---- gauge + odometer ----
  K.wordsAt(S.hD, t, 15.4, 18.3, 0.05);
  const mo = sp(t, 18.25, P.default);
  [S.gC, S.oC].forEach((c, i) => {
    const pin = sp(t, 15.1 + i * 0.18, P.default);
    css(c, { transform: `perspective(1800px) translate3d(0,${((1 - pin) * 380 + mo * 420).toFixed(2)}px,0) rotateY(${((1 - pin) * (i ? -26 : 26)).toFixed(3)}deg)`, opacity: (clamp(pin * 1.6) * (1 - clamp(mo * 1.4))).toFixed(3) });
  });
  show(S.cards, t > 14.9 && t < 19.4 ? 1 : 0);
  if (t > 14.9 && t < 19.4) renderMeters(t);

  K.rippleAt(S.ripEnd, t, 18.55, 1.3);
  K.outroAt(S.outro, t, 18.6);
}

function renderGraph(t) {
  S.hubMark.render(t);
  const r = t < NEXT[0] ? 0 : t < NEXT[1] ? 1 : 2;
  const req = REQUESTS[r];
  const typing = t >= TYPE[r] && t < SEND[r];
  text(S.reqTxt, K.typed(req.text, t, TYPE[r], 40));
  css(S.caret, { opacity: typing || (t < TYPE[r] && Math.floor(t * 3) % 2 === 0) ? '1' : '0' });
  css(S.auth, { opacity: seg(t, 8.25, 8.55).toFixed(3) });
  const bp = sp(t, SEND[r], P.snappy) - sp(t, SEND[r] + 0.14, P.snappy);
  css(S.req, { borderColor: `rgba(0,229,195,${(0.09 + 0.6 * bp).toFixed(3)})` });

  // packet: request -> hub (send..send+0.4), hub thinks, hub -> node (lock-0.4..lock)
  const k = NODES.indexOf(req.model);
  const pIn = K.easeInOut(seg(t, SEND[r] + 0.05, SEND[r] + 0.45));
  const pOut = K.easeInOut(seg(t, LOCK[r] - 0.4, LOCK[r]));
  const think = K.inOut(t, SEND[r] + 0.4, LOCK[r] - 0.35, P.snappy);
  const lit = r < 2 ? 1 - seg(t, NEXT[r] - 0.2, NEXT[r]) : 1;
  const active = t >= SEND[r] + 0.05;
  let d = '', pt = null;
  if (active) {
    const Lin = S.eIn.getTotalLength();
    if (t < LOCK[r] - 0.4) {
      d = `M 620 ${HUB.y} L ${(620 + (HUB.x - 112 - 620) * pIn).toFixed(1)} ${HUB.y}`;
      pt = pIn < 1 ? S.eIn.getPointAtLength(Lin * pIn) : null;
    } else {
      const path = S.eOut[k];
      const L = path.getTotalLength();
      const sub = [];
      const n = 24;
      for (let q = 0; q <= n; q++) { const p = path.getPointAtLength((L * pOut * q) / n); sub.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
      d = `M 620 ${HUB.y} L ${HUB.x - 112} ${HUB.y} M ${sub.join(' L ')}`;
      pt = pOut < 1 ? path.getPointAtLength(L * pOut) : null;
    }
  }
  S.eLit.setAttribute('d', d || 'M 0 0');
  S.eLit.style.opacity = (active ? lit : 0).toFixed(3);
  S.packet.style.opacity = pt ? '1' : '0';
  if (pt) { S.packet.setAttribute('cx', pt.x.toFixed(1)); S.packet.setAttribute('cy', pt.y.toFixed(1)); }
  css(S.hubSpin, { transform: `rotate(${(t * 320).toFixed(1)}deg)`, opacity: think.toFixed(3) });
  const hubPulse = sp(t, SEND[r] + 0.45, P.playful) - sp(t, SEND[r] + 0.6, P.default);
  css(S.hub, { transform: `scale(${(1 + 0.06 * hubPulse).toFixed(4)})`, borderColor: `rgba(0,229,195,${(0.35 + 0.5 * think).toFixed(3)})` });
  // reason chip: shows once the hub has read the request
  const rv = K.inOut(t, SEND[r] + 0.5, r < 2 ? NEXT[r] - 0.1 : Infinity, P.default);
  text(S.reasonTxt, `${REASON[r]}  →  ${MODELS[req.model].name}`);
  css(S.reason, { opacity: rv.toFixed(3), transform: `translate3d(0,${((1 - rv) * 12).toFixed(2)}px,0)` });

  S.nodes.forEach((nd, j) => {
    let on = 0, used = -1;
    for (let q = 0; q < 3; q++) if (REQUESTS[q].model === nd.mi) {
      on = Math.max(on, K.inOut(t, LOCK[q], NEXT[q], P.snappy));
      if (t >= LOCK[q]) used = q;
    }
    css(nd.n, { borderColor: `rgba(0,229,195,${(0.09 + 0.6 * on).toFixed(3)})`, boxShadow: `0 40px 90px rgba(0,0,0,.55), 0 0 ${(60 * on).toFixed(1)}px rgba(0,229,195,${(0.3 * on).toFixed(3)})`, transform: `translate3d(${(-14 * on).toFixed(2)}px,0,0)` });
    if (!nd.sw) nd.sw = nd.prT.offsetWidth + 6;
    const sk = used >= 0 ? sp(t, LOCK[used] + 0.05, P.snappy) : 0;
    css(nd.strike, { width: nd.sw + 'px', transform: `scaleX(${sk.toFixed(4)})` });
    css(nd.prT, { opacity: (1 - 0.5 * sk).toFixed(3) });
    nd.bill.classList.toggle('on', used >= 0);
    text(nd.billT, used >= 0 ? `${PLANS[MODELS[nd.mi].id].plan} · $0` : PLANS[MODELS[nd.mi].id].plan);
  });
  css(S.ripNode, { top: (NODE_Y[k] - 260).toFixed(1) + 'px' });
  K.rippleAt(S.ripNode, t, LOCK[r], 0.8);
  S.logRows.forEach((row, q) => {
    const p = sp(t, LOCK[q] + 0.2, P.default);
    css(row, { opacity: p.toFixed(3), transform: `translate3d(${((1 - p) * -30).toFixed(2)}px,0,0)`, background: `rgba(0,229,195,${(0.07 * K.inOut(t, LOCK[q] + 0.2, LOCK[q] + 0.9, P.default)).toFixed(3)})` });
  });
}

function renderMeters(t) {
  S.gMark.render(t);
  const use = 41 * sp(t, 15.5, P.heavy) + 6 * seg(t, 16.5, 18.4);
  css(S.gArc, { strokeDasharray: `${use.toFixed(2)} 200` });
  const a = Math.PI + (use / 100) * Math.PI + 0.012 * Math.sin(t * 9);
  const R = 220 - 30, cx = 390, cy = 290;
  S.needle.setAttribute('x2', (cx + R * Math.cos(a)).toFixed(1));
  S.needle.setAttribute('y2', (cy + R * Math.sin(a)).toFixed(1));
  text(S.gPct, `${Math.round(use)}% of plan limits`);
  const n = climbN(t);
  const cents = (TOTAL3 * n * 100) / 3;
  S.cols.forEach((c) => {
    const unit = Math.pow(10, c.place - 1);
    const v = cents / unit;
    let pos = Math.floor(v) % 10;
    const lower = (cents / (unit / 10)) % 10;
    if (c.place > 1 && lower > 9) pos += lower - 9; // odometer carry: roll during the last unit of the digit below
    if (c.place === 1) pos = v % 10;
    css(c.strip, { transform: `translate3d(0,${(-pos * 150).toFixed(2)}px,0)` });
    css(c.col, { opacity: cents >= unit || c.place <= 3 ? '1' : '0.14' });
  });
  css(S.comma, { opacity: cents >= 100000 ? '1' : '0.14' });
  text(S.oSub, `${K.fmtInt(n)} requests like these, at per-token list price`);
  const N = 48, shown = seg(t, 15.45, 18.4), pts = [];
  for (let k = 0; k <= N; k++) {
    const q = (k / N) * shown;
    const yv = q * q * (1.6 - 0.6 * q);
    pts.push(`${((k / N) * 700 * shown).toFixed(1)},${(190 - yv * 180 - 3 * Math.sin(k * 1.9) * q).toFixed(1)}`);
  }
  const d = 'M' + pts.join(' L');
  S.oLine.setAttribute('d', d);
  S.oFill.setAttribute('d', `${d} L${(700 * shown).toFixed(1)},200 L0,200 Z`);
}

K.boot({ dur: DUR, mount, render });
