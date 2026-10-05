// Cut 1 "horizon": stacked subscription cards fuse into one key -> OpenRouter-style router table -> meters -> end line.
import * as K from './kit.mjs';
const { h, css, text, box, show, sp, tr, seg, clamp, lerp, PRESETS: P, PLANS, PLAN_ORDER, MODELS, REQUESTS } = K;
const DUR = 22;

// beat grid (120 BPM): request timings
const TYPE = [8.45, 11.0, 13.0], SEND = [9.5, 12.0, 14.0], LOCK = [10.0, 12.5, 14.5], NEXT = [10.9, 12.9, Infinity];
const FIT = [[0.97, 0.88, 0.8, 0.62], [0.78, 0.81, 0.96, 0.55], [0.7, 0.74, 0.79, 0.95]];
// stacked card and fused key geometry
const CARD = { x: 480, y0: 292, dy: 152, w: 960, h: 132 };
const KEY = { x: 375, y: 470, pre: 250, seg: 230, h: 130 };
const PANEL = { x: 210, y: 150, w: 1500, h: 820 };
const ROW = (i) => 284 + i * 112;
let S;

function mount(stage) {
  S = {};
  S.bd = K.backdrop(stage);

  // ---- scenes A/B: the stack that becomes the key ----
  S.keyMove = h('div', 'layer', stage);
  S.keyMove.style.transformOrigin = '0 0';
  S.stack = h('div', 'layer', S.keyMove);
  S.stack.style.transformOrigin = '960px 560px';
  S.prefix = box(h('div', 'card', S.stack), KEY.x, KEY.y, KEY.pre, KEY.h);
  S.prefix.style.borderRadius = '26px 0 0 26px';
  h('div', 'abs muted', S.prefix, 'superbot key').style.cssText += 'left:24px;top:22px;font-size:18px';
  const pk = h('div', 'abs mono', S.prefix, K.KEY_PREFIX);
  pk.style.cssText += 'left:24px;top:60px;font-size:40px;color:#00e5c3';
  S.cards = PLAN_ORDER.map((id, i) => {
    const p = PLANS[id];
    const el = h('div', 'card', S.stack);
    const tileHost = h('div', 'abs', el);
    tileHost.style.transformOrigin = '0 0';
    K.logoTile(tileHost, id, 76);
    const info = h('div', 'abs', el);
    info.style.cssText += 'left:130px;top:30px';
    h('div', '', info, p.plan).style.cssText = 'font-size:36px;font-weight:600;color:#f1f5f6;letter-spacing:-.01em';
    h('div', 'muted', info, `${p.vendor} · subscription · paid monthly`).style.cssText += 'font-size:21px;margin-top:4px';
    const hint = h('div', 'abs mono', el, p.keyHint);
    hint.style.cssText += 'left:auto;right:30px;top:38px;height:56px;padding:0 20px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:#070b0c;display:flex;align-items:center;font-size:24px;color:#9aa6ab';
    const label = h('div', 'abs muted', el, p.plan);
    label.style.cssText += 'left:66px;top:24px;font-size:17px;white-space:nowrap';
    const chars = h('div', 'abs mono', el);
    chars.style.cssText += 'left:22px;top:60px;font-size:40px;color:#f1f5f6;white-space:pre';
    const under = h('div', 'abs', el);
    under.style.cssText += `left:22px;top:110px;height:3px;width:96px;border-radius:2px;background:${p.color};transform-origin:0 50%`;
    return { id, el, tileHost, info, hint, label, chars, under };
  });
  S.keyFrame = box(h('div', 'abs', S.stack), KEY.x - 2, KEY.y - 2, KEY.pre + KEY.seg * 4 + 4, KEY.h + 4);
  S.keyFrame.style.cssText += 'border-radius:28px;border:2px solid rgba(0,229,195,.85);box-shadow:0 0 0 6px rgba(0,229,195,.08),0 0 60px rgba(0,229,195,.35)';
  S.copy = box(h('div', 'pill abs', S.stack), 0, 640, null, 54);
  S.copyTxt = h('span', '', S.copy, 'Copy key');
  S.copy.style.fontSize = '21px';
  S.ripKey = K.makeRipple(stage, 960, 535, 1500);

  S.hA1 = K.words(stage, 'You already pay for *four* AIs.', 'headline display', 140, 82);
  S.hA2 = K.words(stage, 'And juggle *four* API keys.', 'headline display', 140, 82);
  S.hB = K.words(stage, '*One* key. All four inside.', 'headline display', 262, 82);

  // ---- scene C: router panel ----
  S.panelWrap = h('div', 'layer', stage);
  S.panel = box(h('div', 'card', S.panelWrap), PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  S.panel.style.transformOrigin = '50% 50%';
  const head = h('div', 'rp-head', S.panel);
  S.headMark = K.makeMark(h('div', '', head), 46);
  h('div', 'rp-title', head, 'superbot <span class="muted" style="font-weight:500">/ router</span>');
  S.rpKey = h('div', 'rp-key mono', head, `<span style="color:#00e5c3">●</span>${K.KEY_MASK}`);
  const modes = h('div', 'rp-modes', head);
  h('div', 'pill on', modes, '<span class="dot"></span>Auto · best per request');
  h('div', 'pill', modes, 'Cheapest');
  h('div', 'pill', modes, 'Fastest');
  const ask = h('div', 'rp-ask', S.panel);
  h('div', 'muted', ask, '›').style.fontSize = '34px';
  S.askTxt = h('span', '', ask);
  S.caret = h('span', 'caret', ask);
  S.send = h('div', 'send', ask, 'Send ↵');
  const cols = h('div', 'rp-cols', S.panel);
  const GRID = '540px 140px 250px 290px 1fr';
  cols.style.gridTemplateColumns = GRID;
  cols.style.paddingLeft = '12px';
  ['Model', 'Context', 'In / Out per 1M', 'Billed to', 'Fit'].forEach((c) => h('div', '', cols, c));
  S.rows = MODELS.map((m, i) => {
    const row = h('div', 'rp-row', S.panel);
    row.style.top = ROW(i) + 'px';
    row.style.gridTemplateColumns = GRID;
    const mc = h('div', 'm', row);
    K.logoTile(mc, m.id, 54);
    const nm = h('div', '', mc);
    h('div', 'name', nm, m.name);
    h('div', 'slug mono', nm, m.slug);
    h('div', 'num tnum', row, m.ctx);
    const pc = h('div', 'price tnum', row);
    const pt = h('span', '', pc, K.priceLabel(m));
    const strike = h('div', 'strike', pc);
    strike.style.width = '150px';
    const incl = h('div', 'incl', pc, 'Included · $0');
    const bill = h('div', 'bill', row);
    const bt = h('div', 'pill', bill);
    K.logoTile(bt, m.id, 26).style.borderRadius = '7px';
    h('span', '', bt, PLANS[m.id].plan);
    const fit = h('div', 'fit', row);
    const fb = h('b', '', fit);
    const fw = h('b', '', fit);
    fw.style.background = 'linear-gradient(90deg,#00b89c,#8df5e6)';
    return { row, pt, strike, incl, bt, fb, fw };
  });
  S.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  S.svg.setAttribute('width', PANEL.w); S.svg.setAttribute('height', PANEL.h);
  S.svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  S.panel.appendChild(S.svg);
  S.route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  S.route.setAttribute('fill', 'none'); S.route.setAttribute('stroke', '#00e5c3'); S.route.setAttribute('stroke-width', '3');
  S.route.setAttribute('stroke-linecap', 'round');
  S.route.style.filter = 'drop-shadow(0 0 8px rgba(0,229,195,.8))';
  S.svg.appendChild(S.route);
  S.routeDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  S.routeDot.setAttribute('r', '7'); S.routeDot.setAttribute('fill', '#c9fff6');
  S.svg.appendChild(S.routeDot);
  S.toast = h('div', 'abs', S.panel);
  S.toast.style.cssText += 'left:34px;right:34px;top:742px;height:52px;display:flex;align-items:center;gap:14px;font-size:21px;color:#cfd6d9';
  S.toastL = h('span', 'mono', S.toast);
  S.toastR = h('span', '', S.toast);
  S.toastR.style.marginLeft = 'auto';
  S.ripRow = K.makeRipple(S.panel, 300, 0, 560);
  stage.appendChild(S.keyMove); // the key flies in front of the panel it docks into

  // ---- scene D: meters ----
  S.meters = h('div', 'layer', stage);
  S.hD = K.words(stage, 'Same work. *$0* extra.', 'headline display', 110, 78);
  S.mL = box(h('div', 'card', S.meters), 170, 260, 770, 600);
  S.mR = box(h('div', 'card', S.meters), 980, 260, 770, 600);
  S.mR.style.borderColor = 'rgba(255,107,91,.28)';
  const lh = h('div', 'abs', S.mL);
  lh.style.cssText += 'left:40px;top:34px;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600';
  S.mMark = K.makeMark(h('div', '', lh), 38);
  h('span', '', lh, 'superbot · billed to your subscriptions');
  S.mLnum = h('div', 'abs big-num', S.mL, '$0.00');
  S.mLnum.style.cssText += 'left:40px;top:96px;font-size:128px;color:#00e5c3';
  h('div', 'abs muted', S.mL, 'extra this month · within plan limits').style.cssText += 'left:44px;top:250px;font-size:22px';
  S.bars = PLAN_ORDER.map((id, i) => {
    const r = h('div', 'abs', S.mL);
    r.style.cssText += `left:40px;top:${312 + i * 66}px;width:690px;display:flex;align-items:center;gap:16px`;
    K.logoTile(r, id, 40).style.borderRadius = '10px';
    h('div', '', r, PLANS[id].plan).style.cssText = 'width:170px;font-size:21px;color:#dfe5e7';
    const bar = h('div', 'meter-bar', r);
    bar.style.flex = '1';
    const b = h('b', '', bar);
    b.style.background = 'linear-gradient(90deg,#00b89c,#8df5e6)';
    const pct = h('div', 'tnum', r);
    pct.style.cssText = 'width:120px;text-align:right;font-size:20px;color:#9aa6ab';
    return { b, pct };
  });
  const rh = h('div', 'abs', S.mR);
  rh.style.cssText += 'left:40px;top:34px;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600;color:#ffd9d4';
  h('span', '', rh, '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff6b5b"></span>');
  h('span', '', rh, 'Same requests, pay-per-token');
  S.mRnum = h('div', 'abs big-num cost', S.mR);
  S.mRnum.style.cssText += 'left:40px;top:96px;font-size:128px';
  S.mRsub = h('div', 'abs muted tnum', S.mR);
  S.mRsub.style.cssText += 'left:44px;top:250px;font-size:22px';
  S.spark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  S.spark.setAttribute('width', '690'); S.spark.setAttribute('height', '230');
  S.spark.style.cssText = 'position:absolute;left:40px;top:320px;overflow:visible';
  S.mR.appendChild(S.spark);
  S.sparkFill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  S.sparkFill.setAttribute('fill', 'rgba(255,107,91,.12)');
  S.sparkLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  S.sparkLine.setAttribute('fill', 'none'); S.sparkLine.setAttribute('stroke', '#ff6b5b'); S.sparkLine.setAttribute('stroke-width', '4');
  S.spark.append(S.sparkFill, S.sparkLine);

  // ---- scene E: outro ----
  S.ripEnd = K.makeRipple(stage, 960, 520, 1700);
  S.outro = K.makeOutro(stage);
  K.finish(stage);
}

function cardGeom(i, pm) {
  const x = lerp(CARD.x, KEY.x + KEY.pre + i * KEY.seg, pm);
  const y = lerp(CARD.y0 + i * CARD.dy, KEY.y, pm);
  const w = lerp(CARD.w, KEY.seg, pm);
  const hh = lerp(CARD.h, KEY.h, pm);
  return { x, y, w, hh };
}

const climb = (t) => {
  const p = seg(t, 15.5, 18.4);
  const e = p * p * (1.6 - 0.6 * p); // accelerating, still rising at the cut
  return 3 + 997 * e;
};

function render(t) {
  // backdrop
  const hy = tr(t, [[0, 1220], [0.05, 930], [7.7, 1010], [15.0, 965], [18.4, 830]], P.heavy);
  K.horizonAt(S.bd, hy, 1, t < 8 ? 1 : 0.55);

  // ---- A/B ----
  K.wordsAt(S.hA1, t, 0.15, 1.95);
  K.wordsAt(S.hA2, t, 2.05, 3.95);
  K.wordsAt(S.hB, t, 6.1, 7.4);
  const tiltIn = 1 - sp(t, 0.2, P.heavy);
  const lean = sp(t, 4.0, P.default) - sp(t, 4.75, P.heavy);
  const rx = 16 * tiltIn + 14 * lean;
  css(S.stack, { transform: `perspective(1600px) rotateX(${rx.toFixed(3)}deg) scale(${(1 - 0.05 * lean).toFixed(4)})` });
  S.cards.forEach((c, i) => {
    const pin = sp(t, 0.35 + i * 0.3, P.default);
    const pm = sp(t, 4.45 + i * 0.13, P.default);
    const g = cardGeom(i, pm);
    const slide = (1 - pin) * 360;
    css(c.el, {
      left: g.x.toFixed(2) + 'px', top: (g.y + slide).toFixed(2) + 'px', width: g.w.toFixed(2) + 'px', height: g.hh.toFixed(2) + 'px',
      opacity: clamp(pin * 1.6).toFixed(3),
      borderRadius: i === 3 ? `${lerp(22, 0, pm).toFixed(1)}px ${lerp(22, 26, pm).toFixed(1)}px ${lerp(22, 26, pm).toFixed(1)}px ${lerp(22, 0, pm).toFixed(1)}px` : `${lerp(22, 0, pm).toFixed(1)}px`,
      borderColor: `rgba(255,255,255,${lerp(0.09, 0.07, pm).toFixed(3)})`,
    });
    const ts = lerp(1, 36 / 76, pm);
    css(c.tileHost, { transform: `translate3d(${lerp(28, 20, pm).toFixed(2)}px,${lerp(28, 18, pm).toFixed(2)}px,0) scale(${ts.toFixed(4)})` });
    const infoO = 1 - seg(pm, 0, 0.3);
    css(c.info, { opacity: infoO.toFixed(3) });
    // the key hint lights up one by one in shot A2
    const hl = K.inOut(t, 2.35 + i * 0.25, 3.9, P.snappy);
    css(c.hint, { opacity: infoO.toFixed(3), color: hl > 0.5 ? '#ffd9d4' : '#9aa6ab', borderColor: `rgba(255,107,91,${(0.1 + 0.6 * hl).toFixed(3)})`, transform: `scale(${(1 + 0.06 * (sp(t, 2.35 + i * 0.25, P.playful) - sp(t, 2.6 + i * 0.25, P.default))).toFixed(4)})` });
    const so = seg(pm, 0.55, 1);
    css(c.label, { opacity: so.toFixed(3) });
    css(c.chars, { opacity: so.toFixed(3) });
    text(c.chars, K.scramble(PLANS[c.id].seg, t, 5.45 + i * 0.12, 0.06, 100 + i));
    css(c.under, { transform: `scaleX(${sp(t, 5.75 + i * 0.12, P.snappy).toFixed(4)})` });
  });
  const pp = sp(t, 5.15, P.default);
  css(S.prefix, { transform: `translate3d(${((1 - pp) * -220).toFixed(2)}px,0,0)`, opacity: clamp(pp * 1.5).toFixed(3) });
  const kf = sp(t, 5.85, P.snappy);
  css(S.keyFrame, { opacity: kf.toFixed(3), transform: `scale(${lerp(1.04, 1, kf).toFixed(4)})` });
  K.rippleAt(S.ripKey, t, 6.0, 1.2);
  const cp = sp(t, 6.6, P.default), clicked = t >= 7.25;
  text(S.copyTxt, clicked ? 'Copied ✓' : 'Copy key');
  const cpw = S.copy.offsetWidth;
  css(S.copy, { left: (960 - cpw / 2).toFixed(1) + 'px', opacity: cp.toFixed(3), transform: `translate3d(0,${((1 - cp) * 20).toFixed(2)}px,0) scale(${(1 + 0.08 * (sp(t, 7.25, P.playful) - sp(t, 7.4, P.default))).toFixed(4)})` });
  S.copy.classList.toggle('on', clicked);

  // key flies into the router header
  const km = sp(t, 7.75, P.default);
  const ks = lerp(1, 0.4, km);
  const tx = lerp(0, 540 - KEY.x * 0.4, km), ty = lerp(0, 172 - KEY.y * 0.4, km);
  css(S.keyMove, { transform: `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${ks.toFixed(4)})` });
  show(S.keyMove, 1 - seg(t, 8.45, 8.65));

  // ---- C: router ----
  const pe = sp(t, 7.45, P.heavy), px = sp(t, 14.95, P.heavy);
  const sway = tr(t, [[0, 0], [10.85, -5], [12.85, 5], [14.85, 0]], P.heavy);
  const pScale = lerp(0.93, 1, pe) * lerp(1, 0.72, px);
  css(S.panel, {
    transform: `perspective(2000px) translate3d(${(-px * 620).toFixed(2)}px,${((1 - pe) * 90).toFixed(2)}px,0) rotateX(${((1 - pe) * 18).toFixed(3)}deg) rotateY(${(sway - px * 38).toFixed(3)}deg) scale(${pScale.toFixed(4)})`,
  });
  show(S.panelWrap, clamp(pe * 2.2) * (1 - clamp(px * 1.7)));
  if (t > 7.5 && t < 16.2) renderRouter(t);

  // ---- D: meters ----
  K.wordsAt(S.hD, t, 15.45, 18.3);
  const mo = sp(t, 18.25, P.default);
  [S.mL, S.mR].forEach((c, i) => {
    const pin = sp(t, 15.15 + i * 0.18, P.default);
    css(c, { transform: `perspective(1800px) translate3d(0,${((1 - pin) * 380 + mo * 420).toFixed(2)}px,0) rotateX(${((1 - pin) * 24).toFixed(3)}deg)`, opacity: (clamp(pin * 1.6) * (1 - clamp(mo * 1.4))).toFixed(3) });
  });
  show(S.meters, t > 14.9 && t < 19.4 ? 1 : 0);
  if (t > 14.9 && t < 19.4) {
    S.mMark.render(t);
    const n = climb(t);
    text(S.mRnum, K.fmtUSD((K.reqCost(REQUESTS[0]) + K.reqCost(REQUESTS[1]) + K.reqCost(REQUESTS[2])) * n / 3));
    text(S.mRsub, `${K.fmtInt(n)} requests like these, at list price`);
    const use = [[24, 38], [12, 19], [30, 44], [8, 21]];
    const up = seg(t, 15.5, 18.4);
    S.bars.forEach((b, i) => {
      const v = lerp(use[i][0], use[i][1], up) * sp(t, 15.4 + i * 0.08, P.default);
      css(b.b, { transform: `scaleX(${(v / 100).toFixed(4)})` });
      text(b.pct, `${Math.round(v)}% of plan`);
    });
    const N = 48, pts = [];
    const shown = seg(t, 15.5, 18.4);
    for (let k = 0; k <= N; k++) {
      const q = (k / N) * shown;
      const yv = q * q * (1.6 - 0.6 * q);
      pts.push(`${(k / N * 690 * shown).toFixed(1)},${(220 - yv * 210 - 4 * Math.sin(k * 1.7) * q).toFixed(1)}`);
    }
    const d = 'M' + pts.join(' L');
    S.sparkLine.setAttribute('d', d);
    S.sparkFill.setAttribute('d', `${d} L${(690 * shown).toFixed(1)},230 L0,230 Z`);
  }

  // ---- E: outro ----
  K.rippleAt(S.ripEnd, t, 18.55, 1.3);
  K.outroAt(S.outro, t, 18.6);
}

function renderRouter(t) {
  S.headMark.render(t);
  const r = t < NEXT[0] ? 0 : t < NEXT[1] ? 1 : 2;
  const req = REQUESTS[r];
  const typing = t >= TYPE[r] && t < SEND[r];
  text(S.askTxt, K.typed(req.text, t, TYPE[r], 40));
  css(S.caret, { opacity: typing || (t < TYPE[r] ? Math.floor(t * 3) % 2 === 0 : false) ? '1' : '0' });
  const press = sp(t, SEND[r], P.snappy) - sp(t, SEND[r] + 0.12, P.snappy);
  css(S.send, { transform: `scale(${(1 - 0.1 * press).toFixed(4)})` });
  css(S.rpKey, { opacity: seg(t, 8.45, 8.65).toFixed(3) });

  S.rows.forEach((row, i) => {
    const keys = [[0, 0]];
    for (let q = 0; q < 3; q++) {
      if (q > 0) keys.push([TYPE[q], 0.1]);
      keys.push([SEND[q] + 0.06 + i * 0.06, FIT[q][i]]);
    }
    const fv = Math.max(0, K.tr(t, keys, P.snappy));
    css(row.fb, { transform: `scaleX(${fv.toFixed(4)})` });
    // lit while this row is the current winner
    let lit = 0, used = -1;
    for (let q = 0; q < 3; q++) {
      if (REQUESTS[q].model === i) {
        lit = Math.max(lit, K.inOut(t, LOCK[q], NEXT[q], P.snappy));
        if (t >= LOCK[q]) used = q;
      }
    }
    css(row.fw, { transform: `scaleX(${fv.toFixed(4)})`, opacity: lit.toFixed(3) });
    css(row.row, { background: `rgba(0,229,195,${(0.075 * lit).toFixed(4)})`, borderColor: `rgba(0,229,195,${(0.6 * lit).toFixed(3)})` });
    const sk = used >= 0 ? sp(t, LOCK[used] + 0.05, P.snappy) : 0;
    const inc = used >= 0 ? sp(t, LOCK[used] + 0.32, P.snappy) : 0;
    if (!row.sw) row.sw = row.pt.offsetWidth + 10;
    css(row.strike, { width: row.sw + 'px', transform: `scaleX(${sk.toFixed(4)})`, opacity: (1 - inc).toFixed(3) });
    css(row.pt, { opacity: (1 - 0.45 * sk - 0.55 * inc).toFixed(3) });
    css(row.incl, { opacity: inc.toFixed(3), transform: `translate3d(${((1 - inc) * -24).toFixed(2)}px,0,0) scale(${lerp(0.85, 1, inc).toFixed(4)})` });
    row.bt.classList.toggle('on', lit > 0.5);
  });

  // route: ask box -> winning row, drawn between send and lock
  const wi = req.model;
  const y0 = 160, y1 = ROW(wi) + 49;
  S.route.setAttribute('d', `M 34 ${y0} C -60 ${y0}, -60 ${y1}, 22 ${y1}`);
  const L = S.route.getTotalLength();
  const dp = K.easeInOut(seg(t, SEND[r] + 0.05, LOCK[r]));
  const fade = r < 2 ? 1 - seg(t, NEXT[r] - 0.15, NEXT[r]) : 1;
  S.route.setAttribute('stroke-dasharray', `${L.toFixed(1)} ${L.toFixed(1)}`);
  S.route.setAttribute('stroke-dashoffset', (L * (1 - dp)).toFixed(1));
  S.route.style.opacity = (t >= SEND[r] ? fade : 0).toFixed(3);
  const pt = S.route.getPointAtLength(L * dp);
  S.routeDot.setAttribute('cx', pt.x.toFixed(1)); S.routeDot.setAttribute('cy', pt.y.toFixed(1));
  S.routeDot.style.opacity = (t >= SEND[r] && dp < 1 ? fade : 0).toFixed(3);
  css(S.ripRow, { top: (y1 - 280).toFixed(1) + 'px' });
  K.rippleAt(S.ripRow, t, LOCK[r], 0.8);

  const m = MODELS[req.model];
  const to = K.inOut(t, LOCK[r] + 0.3, r < 2 ? NEXT[r] - 0.1 : Infinity, P.default);
  text(S.toastL, `200 OK · ${m.slug}`);
  K.html(S.toastR, `billed to <b style="color:#c9fff6">${PLANS[m.id].plan}</b> · you pay <b style="color:#00e5c3">$0.00</b> <span class="muted">· per-token list price</span> <span class="cost">${K.fmtUSD(K.reqCost(req))}</span>`);
  css(S.toast, { opacity: to.toFixed(3), transform: `translate3d(0,${((1 - to) * 14).toFixed(2)}px,0)` });
}

K.boot({ dur: DUR, mount, render });
