// Cut 3 "drop-in": four .env keys collapse into SUPERBOT_API_KEY -> two-line client diff -> terminal + flipping
// route card -> month chart (flat on plans vs climbing per token) -> end line.
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

const TYPE = [8.45, 11.0, 13.0], SEND = [9.4, 11.9, 13.85], LOCK = [10.0, 12.5, 14.4], NEXT = [10.95, 12.95, Infinity];
const FIT = [[0.97, 0.88, 0.8, 0.62], [0.78, 0.81, 0.96, 0.55], [0.7, 0.74, 0.79, 0.95]];
const ED = { x: 210, y: 236, w: 1500, h: 540 };
const LH = 62, CODE_Y = 104;
const ENV = {
  claude: ['ANTHROPIC_API_KEY', 'sk-ant-api03-••••••••'],
  openai: ['OPENAI_API_KEY', 'sk-proj-••••••••'],
  gemini: ['GEMINI_API_KEY', 'AIzaSy••••••••'],
  deepseek: ['DEEPSEEK_API_KEY', 'sk-••••••••'],
};
const NEW_LINE = `SUPERBOT_API_KEY=${K.KEY_FULL}`;
let S;

function mount(stage) {
  S = {};
  S.bd = K.backdrop(stage);
  S.hA1 = K.words(stage, 'Four AI plans. *Four* API keys.', 'headline display', 96, 76);
  S.hA2 = K.words(stage, 'And every call billed *per token.*', 'headline display', 96, 76);
  S.hB = K.words(stage, '*One* key holds all four.', 'headline display', 96, 76);
  S.hB2 = K.words(stage, '*Drop-in.* Two lines change.', 'headline display', 96, 76);

  // ---- editor ----
  S.ed = box(h('div', 'card', stage), ED.x, ED.y, ED.w, ED.h);
  S.ed.style.overflow = 'hidden';
  S.ed.style.background = 'linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015)),#080c0e';
  const bar = h('div', 'abs', S.ed);
  bar.style.cssText += 'left:0;right:0;height:62px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 24px;gap:10px';
  for (let i = 0; i < 3; i++) h('span', '', bar).style.cssText = 'width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.14)';
  S.tabEnv = h('div', 'mono', bar, '.env');
  S.tabPy = h('div', 'mono', bar, 'client.py');
  [S.tabEnv, S.tabPy].forEach((tb, i) => { tb.style.cssText += `margin-left:${i ? 4 : 26}px;height:40px;padding:0 18px;border-radius:10px;display:flex;align-items:center;font-size:19px`; });
  S.gutter = h('div', 'abs mono', S.ed);
  S.gutter.style.cssText += `left:0;top:${CODE_Y}px;width:72px;text-align:right;font-size:22px;line-height:${LH}px;color:#3d4649`;
  S.gutter.innerHTML = [1, 2, 3, 4, 5, 6, 7].join('<br>');
  S.env = h('div', 'abs', S.ed);
  S.env.style.cssText += `left:100px;top:${CODE_Y}px;right:30px;height:${LH * 6}px`;
  S.lines = PLAN_ORDER.map((id, i) => {
    const ln = h('div', 'abs mono', S.env);
    ln.style.cssText += `left:0;top:${i * LH}px;height:${LH}px;line-height:${LH}px;font-size:30px;white-space:pre;right:0`;
    h('span', '', ln, ENV[id][0]).style.color = '#e9eff1';
    h('span', '', ln, '=').style.color = '#5d676c';
    h('span', '', ln, ENV[id][1]).style.color = '#9aa6ab';
    const chip = h('div', 'pill', S.env);
    chip.style.cssText += `position:absolute;left:auto;right:0;top:${i * LH + 8}px;height:42px;font-size:19px`;
    K.logoTile(chip, id, 26).style.borderRadius = '7px';
    h('span', '', chip, `${PLANS[id].plan} · paid`);
    return { ln, chip };
  });
  S.newLn = h('div', 'abs mono', S.env);
  S.newLn.style.cssText += `left:0;top:0;height:${LH}px;line-height:${LH}px;font-size:30px;white-space:pre;color:#e9eff1`;
  S.newK = h('span', '', S.newLn);
  S.newEq = h('span', '', S.newLn, '=');
  S.newEq.style.color = '#5d676c';
  S.newV = h('span', '', S.newLn);
  S.newV.style.color = '#00e5c3';
  S.dock = h('div', 'abs', S.env);
  S.dock.style.cssText += `left:auto;right:0;top:8px;height:42px;width:${4 * 46 + 8}px`;
  S.docked = PLAN_ORDER.map((id) => { const d = h('div', 'abs', S.env); K.logoTile(d, id, 40).style.borderRadius = '11px'; return d; });
  S.cmt = h('div', 'abs mono', S.env, '# one key · Claude Max · ChatGPT Plus · Google AI Pro · DeepSeek');
  S.cmt.style.cssText += `left:0;top:${LH}px;line-height:${LH}px;font-size:26px;color:#5d676c;white-space:pre`;
  S.selBar = h('div', 'abs', S.env);
  S.selBar.style.cssText += `left:-12px;top:0;width:1200px;height:${LH * 4}px;background:rgba(0,229,195,.10);border-radius:8px;transform-origin:0 50%`;
  S.env.insertBefore(S.selBar, S.env.firstChild);
  S.ripEnv = K.makeRipple(stage, 760, ED.y + CODE_Y + 29, 1300);

  // client.py diff
  S.py = h('div', 'abs mono', S.ed);
  S.py.style.cssText += `left:100px;top:${CODE_Y}px;right:30px;font-size:27px;line-height:${LH}px;white-space:pre`;
  const PY = [
    [' ', '<span style="color:#9aa6ab">from</span> openai <span style="color:#9aa6ab">import</span> OpenAI'],
    ['-', 'client = OpenAI(api_key=os.environ[<span style="color:#ffb4aa">"OPENAI_API_KEY"</span>])'],
    ['+', `client = OpenAI(base_url=<span style="color:#8df5e6">"${K.BASE_URL}"</span>,`],
    ['+', `                api_key=os.environ[<span style="color:#8df5e6">"SUPERBOT_API_KEY"</span>])`],
    [' ', ''],
    [' ', 'resp = client.chat.completions.create(model=<span style="color:#8df5e6">"auto"</span>, messages=msgs)'],
  ];
  S.pyLines = PY.map(([mark, src]) => {
    const ln = h('div', '', S.py);
    ln.style.cssText = `position:relative;height:${LH}px;padding-left:44px;border-radius:8px;color:#e9eff1`;
    const m = h('span', '', ln, mark);
    m.style.cssText = `position:absolute;left:12px;color:${mark === '-' ? '#ff6b5b' : mark === '+' ? '#00e5c3' : '#3d4649'}`;
    h('span', '', ln, src);
    return { ln, mark };
  });

  // ---- terminal + route card ----
  S.term = box(h('div', 'card', stage), 80, 180, 800, 720);
  S.term.style.background = 'linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015)),#070a0b';
  const th = h('div', 'abs', S.term);
  th.style.cssText += 'left:0;right:0;height:56px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 22px;gap:10px;font-size:18px;color:#5d676c';
  for (let i = 0; i < 3; i++) h('span', '', th).style.cssText = 'width:13px;height:13px;border-radius:50%;background:rgba(255,255,255,.14)';
  h('span', 'mono', th, 'zsh · my-agent').style.marginLeft = '18px';
  S.tBody = h('div', 'abs mono', S.term);
  S.tBody.style.cssText += 'left:28px;right:24px;top:80px;font-size:21px;line-height:34px;white-space:pre-wrap;color:#c4cdd1';
  h('div', '', S.tBody, '<span style="color:#00e5c3">$</span> export SUPERBOT_API_KEY=<span style="color:#8df5e6">sb_live_7c1Q…kP0z</span>');
  h('div', '', S.tBody, `<span style="color:#00e5c3">$</span> python agent.py <span class="muted"># model="auto"</span>`);
  S.tReq = REQUESTS.map(() => {
    const blk = h('div', '', S.tBody);
    blk.style.marginTop = '18px';
    const q = h('div', '', blk);
    const qt = h('span', '', q);
    const caret = h('span', 'caret', q);
    const a = h('div', '', blk);
    return { blk, qt, caret, a };
  });

  S.flipWrap = box(h('div', 'abs', stage), 940, 180, 900, 720);
  S.flipWrap.style.perspective = '2400px';
  S.flip = h('div', 'layer', S.flipWrap);
  S.flip.style.transformStyle = 'preserve-3d';
  S.front = h('div', 'card', S.flip);
  S.back = h('div', 'card', S.flip);
  [S.front, S.back].forEach((f) => { f.style.cssText += 'left:0;top:0;width:900px;height:720px;backface-visibility:hidden;-webkit-backface-visibility:hidden'; });
  S.back.style.transform = 'rotateY(180deg)';
  S.back.style.borderColor = 'rgba(0,229,195,.55)';
  S.back.style.boxShadow = '0 40px 90px rgba(0,0,0,.55), 0 0 80px rgba(0,229,195,.18)';
  // front: ranking
  const fh = h('div', 'abs', S.front);
  fh.style.cssText += 'left:36px;top:30px;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600';
  S.fMark = K.makeMark(h('div', '', fh), 40);
  h('span', '', fh, 'superbot router · <span style="color:#00e5c3">auto</span>');
  S.fReq = h('div', 'abs', S.front);
  S.fReq.style.cssText += 'left:36px;right:36px;top:96px;height:74px;border-radius:14px;background:#070b0c;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;padding:0 22px;font-size:25px;color:#f1f5f6;white-space:nowrap;overflow:hidden';
  h('div', 'abs muted', S.front, 'SCORING EVERY MODEL YOUR PLANS COVER').style.cssText += 'left:36px;top:196px;font-size:15px;letter-spacing:.1em';
  S.rank = MODELS.map((m, i) => {
    const r = h('div', 'abs', S.front);
    r.style.cssText += `left:36px;right:36px;top:${236 + i * 112}px;height:96px;border-radius:16px;border:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:18px;padding:0 20px`;
    K.logoTile(r, m.id, 52);
    const nm = h('div', '', r);
    nm.style.width = '330px';
    h('div', '', nm, m.name).style.cssText = 'font-size:25px;font-weight:600;color:#eef3f4';
    h('div', 'muted', nm, `via ${PLANS[m.id].plan}`).style.cssText += 'font-size:17px;margin-top:2px';
    const fit = h('div', 'fit', r);
    fit.style.flex = '1';
    const fb = h('b', '', fit);
    const fw = h('b', '', fit);
    fw.style.background = 'linear-gradient(90deg,#00b89c,#8df5e6)';
    const sc = h('div', 'tnum', r);
    sc.style.cssText = 'width:64px;text-align:right;font-size:22px;color:#9aa6ab';
    return { r, fb, fw, sc };
  });
  // back: result
  const bh = h('div', 'abs muted', S.back, 'ROUTED TO');
  bh.style.cssText += 'left:44px;top:40px;font-size:16px;letter-spacing:.12em';
  S.bTile = h('div', 'abs', S.back);
  S.bTile.style.cssText += 'left:44px;top:84px';
  S.bTiles = MODELS.map((m) => { const d = h('div', 'abs', S.bTile); K.logoTile(d, m.id, 120).style.borderRadius = '30px'; return d; });
  S.bName = h('div', 'abs display', S.back);
  S.bName.style.cssText += 'left:190px;top:92px;font-size:58px;white-space:nowrap';
  S.bSlug = h('div', 'abs mono', S.back);
  S.bSlug.style.cssText += 'left:192px;top:166px;font-size:19px;color:#5d676c';
  S.bWhy = h('div', 'abs', S.back);
  S.bWhy.style.cssText += 'left:44px;top:250px;font-size:24px;color:#cfd6d9';
  const grid = h('div', 'abs', S.back);
  grid.style.cssText += 'left:44px;right:44px;top:316px;display:grid;grid-template-columns:1fr 1fr;gap:18px';
  const cell = (label) => {
    const c = h('div', '', grid);
    c.style.cssText = 'height:150px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);padding:22px 24px;position:relative';
    h('div', 'muted', c, label).style.cssText += 'font-size:16px;letter-spacing:.1em;text-transform:uppercase';
    const v = h('div', '', c);
    v.style.cssText = 'margin-top:14px;font-size:34px;font-weight:700;white-space:nowrap';
    return v;
  };
  S.bBill = cell('Billed to');
  S.bPay = cell('You pay');
  S.bList = cell('Per-token list price');
  S.bRate = cell('In / Out per 1M');
  S.bPay.style.color = '#00e5c3';
  S.bList.className = 'cost tnum';
  S.ripFlip = K.makeRipple(stage, 1390, 540, 1100);

  // ---- month chart ----
  S.hD = K.words(stage, 'Billed to plans you *already pay for.*', 'headline display', 96, 70);
  S.chart = box(h('div', 'card', stage), 150, 220, 1620, 680);
  const cl = h('div', 'abs', S.chart);
  cl.style.cssText += 'left:44px;top:40px;width:430px';
  const clh = h('div', '', cl);
  clh.style.cssText = 'display:flex;align-items:center;gap:12px;font-size:22px;font-weight:600';
  S.cMark = K.makeMark(h('div', '', clh), 34);
  h('span', '', clh, 'Usage on your plans');
  S.cBars = PLAN_ORDER.map((id) => {
    const r = h('div', '', cl);
    r.style.cssText = 'margin-top:26px';
    const top = h('div', '', r);
    top.style.cssText = 'display:flex;align-items:center;gap:12px;font-size:20px;color:#dfe5e7';
    K.logoTile(top, id, 32).style.borderRadius = '9px';
    h('span', '', top, PLANS[id].plan);
    const pct = h('span', 'tnum muted', top);
    pct.style.marginLeft = 'auto';
    const bar = h('div', 'meter-bar', r);
    bar.style.marginTop = '10px';
    const b = h('b', '', bar);
    b.style.background = 'linear-gradient(90deg,#00b89c,#8df5e6)';
    return { b, pct };
  });
  S.cExtra = h('div', '', cl);
  S.cExtra.style.cssText = 'margin-top:34px;font-size:22px;color:#9aa6ab';
  S.cExtra.innerHTML = 'Extra spend <b class="big-num" style="font-size:44px;color:#00e5c3;margin-left:10px">$0.00</b>';
  const CH = { x: 560, y: 70, w: 1000, h: 520 };
  S.CH = CH;
  S.cs = svgEl('svg', { width: 1620, height: 680 }, S.chart);
  S.cs.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  for (let k = 0; k <= 4; k++) svgEl('line', { x1: CH.x, x2: CH.x + CH.w, y1: CH.y + (CH.h * k) / 4, y2: CH.y + (CH.h * k) / 4, stroke: 'rgba(255,255,255,.06)', 'stroke-width': 1 }, S.cs);
  ['Day 1', 'Day 10', 'Day 20', 'Day 30'].forEach((d, k) => {
    const tx = svgEl('text', { x: CH.x + (CH.w * k) / 3, y: CH.y + CH.h + 36, fill: '#5d676c', 'font-size': 18, 'text-anchor': k === 0 ? 'start' : k === 3 ? 'end' : 'middle' }, S.cs);
    tx.textContent = d;
  });
  S.cRedFill = svgEl('path', { fill: 'rgba(255,107,91,.10)' }, S.cs);
  S.cRed = svgEl('path', { fill: 'none', stroke: '#ff6b5b', 'stroke-width': 5, 'stroke-linejoin': 'round' }, S.cs);
  S.cTeal = svgEl('path', { fill: 'none', stroke: '#00e5c3', 'stroke-width': 5 }, S.cs);
  S.cTeal.style.filter = 'drop-shadow(0 0 8px rgba(0,229,195,.7))';
  S.cRedTip = h('div', 'abs', S.chart);
  S.cRedTip.style.cssText += 'padding:10px 16px;border-radius:12px;background:#1a0f0e;border:1px solid rgba(255,107,91,.5);white-space:nowrap';
  S.cRedNum = h('div', 'big-num cost tnum', S.cRedTip);
  S.cRedNum.style.fontSize = '40px';
  S.cRedSub = h('div', 'tnum', S.cRedTip);
  S.cRedSub.style.cssText = 'font-size:16px;color:#ffb4aa';
  S.cTealTip = h('div', 'abs', S.chart);
  S.cTealTip.style.cssText += 'padding:8px 14px;border-radius:12px;background:#0b1a18;border:1px solid rgba(0,229,195,.5);white-space:nowrap;font-size:20px;color:#c9fff6';
  S.cTealTip.innerHTML = '<b style="color:#00e5c3">$0.00</b> extra · superbot on your plans';

  S.ripEnd = K.makeRipple(stage, 960, 520, 1700);
  S.outro = K.makeOutro(stage);
  K.finish(stage);
}

const climbN = (p) => 3 + 997 * p * p * (1.6 - 0.6 * p);
const TOTAL3 = K.reqCost(REQUESTS[0]) + K.reqCost(REQUESTS[1]) + K.reqCost(REQUESTS[2]);

function render(t) {
  const hy = tr(t, [[0, 1220], [0.05, 940], [7.7, 1020], [15.0, 990], [18.4, 830]], P.heavy);
  K.horizonAt(S.bd, hy, 1, t < 8 ? 0.8 : 0.45);
  K.wordsAt(S.hA1, t, 0.2, 1.95);
  K.wordsAt(S.hA2, t, 2.05, 3.85);
  K.wordsAt(S.hB, t, 5.55, 6.75);
  K.wordsAt(S.hB2, t, 6.85, 7.75);

  // ---- editor ----
  const ein = sp(t, 0.1, P.heavy), eout = sp(t, 7.75, P.heavy);
  const tiltY = tr(t, [[0, -22], [0.1, -6], [4.0, 0], [7.75, 0]], P.heavy);
  css(S.ed, {
    transform: `perspective(2200px) translate3d(${(-eout * 700).toFixed(2)}px,${((1 - ein) * 140).toFixed(2)}px,0) rotateX(${((1 - ein) * 26 + 3).toFixed(3)}deg) rotateY(${(tiltY - eout * 50).toFixed(3)}deg) scale(${(lerp(0.9, 1, ein) * lerp(1, 0.75, eout)).toFixed(4)})`,
    opacity: (clamp(ein * 1.6) * (1 - clamp(eout * 1.6))).toFixed(3),
    visibility: t < 8.9 ? 'visible' : 'hidden',
  });
  const onPy = sp(t, 6.75, P.default);
  css(S.tabEnv, { background: `rgba(255,255,255,${(0.08 * (1 - onPy)).toFixed(3)})`, color: onPy < 0.5 ? '#e9eff1' : '#5d676c' });
  css(S.tabPy, { background: `rgba(255,255,255,${(0.08 * onPy).toFixed(3)})`, color: onPy >= 0.5 ? '#e9eff1' : '#5d676c' });
  css(S.env, { transform: `translate3d(${(-onPy * 120).toFixed(2)}px,0,0)`, opacity: (1 - clamp(onPy * 1.5)).toFixed(3) });
  css(S.py, { transform: `translate3d(${((1 - onPy) * 120).toFixed(2)}px,0,0)`, opacity: clamp(onPy * 1.5 - 0.3).toFixed(3) });
  // select-all sweep, then lines collapse into line 1
  text(S.newK, K.scramble('SUPERBOT_API_KEY', t, 4.9, 0.03, 500));
  text(S.newV, K.scramble(K.KEY_FULL, t, 5.25, 0.03, 600));
  const sel = sp(t, 4.0, P.snappy) - sp(t, 4.75, P.default);
  css(S.selBar, { transform: `scaleX(${sel.toFixed(4)})`, opacity: clamp(sel * 2).toFixed(3) });
  S.lines.forEach((L, i) => {
    const pin = sp(t, 0.45 + i * 0.32, P.default);
    const pc = sp(t, 4.45 + i * 0.1, P.default);
    const chipHi = K.inOut(t, 2.3 + i * 0.25, 3.9, P.snappy);
    css(L.ln, { transform: `translate3d(${((1 - pin) * 40).toFixed(2)}px,${(-pc * i * LH).toFixed(2)}px,0) scaleY(${lerp(1, 0.2, pc).toFixed(4)})`, opacity: (clamp(pin * 1.6) * (1 - clamp(pc * 1.5))).toFixed(3) });
    css(L.chip, { transform: `translate3d(${((1 - pin) * 40).toFixed(2)}px,${(-pc * i * LH).toFixed(2)}px,0)`, opacity: (clamp(pin * 1.6) * (1 - clamp(pc * 2.2))).toFixed(3), borderColor: `rgba(255,107,91,${(0.09 + 0.55 * chipHi).toFixed(3)})` });
    // logos fly from their chips into the dock on the new line
    const pd = sp(t, 4.75 + i * 0.12, P.default);
    if (L.fromX == null) { L.fromX = L.chip.offsetLeft + 14; S.dockX = S.dockX ?? S.newLn.offsetWidth + 30; }
    const fromX = L.fromX, fromY = i * LH + 9;
    const toX = S.dockX + i * 50, toY = 9;
    css(S.docked[i], { transform: `translate3d(${lerp(fromX, toX, pd).toFixed(2)}px,${lerp(fromY, toY, pd).toFixed(2)}px,0) scale(${lerp(0.65, 1, pd).toFixed(4)})`, opacity: (pd > 0.02 ? clamp(pd * 3) : 0).toFixed(3) });
  });
  const nl = sp(t, 4.95, P.default);
  css(S.newLn, { opacity: clamp(nl * 2).toFixed(3) });
  css(S.newEq, { opacity: seg(t, 5.2, 5.3).toFixed(3) });
  css(S.cmt, { opacity: sp(t, 6.1, P.default).toFixed(3), transform: `translate3d(${((1 - sp(t, 6.1, P.default)) * 30).toFixed(2)}px,0,0)` });
  K.rippleAt(S.ripEnv, t, 6.0, 1.1);
  S.pyLines.forEach((L, i) => {
    const hl = L.mark === '-' ? sp(t, 7.0, P.default) : L.mark === '+' ? sp(t, 7.15 + (i - 2) * 0.12, P.default) : 0;
    const col = L.mark === '-' ? `rgba(255,107,91,${(0.14 * hl).toFixed(3)})` : `rgba(0,229,195,${(0.12 * hl).toFixed(3)})`;
    css(L.ln, { background: col, opacity: L.mark === '-' ? (1 - 0.45 * hl).toFixed(3) : '1' });
  });

  // ---- terminal + route card ----
  const ci = sp(t, 7.85, P.heavy), cx = sp(t, 14.95, P.heavy);
  const sway = tr(t, [[0, 0], [10.9, -3], [12.9, 3], [14.9, 0]], P.heavy);
  css(S.term, { transform: `perspective(2200px) translate3d(${(-(1 - ci) * 300 - cx * 500).toFixed(2)}px,${(cx * 40).toFixed(2)}px,0) rotateY(${((1 - ci) * 30 + sway + cx * 30).toFixed(3)}deg) scale(${lerp(1, 0.8, cx).toFixed(4)})`, opacity: (clamp(ci * 1.6) * (1 - clamp(cx * 1.6))).toFixed(3) });
  css(S.flipWrap, { transform: `translate3d(${((1 - ci) * 300 + cx * 500).toFixed(2)}px,${(cx * 40).toFixed(2)}px,0) scale(${lerp(1, 0.8, cx).toFixed(4)})`, opacity: (clamp(ci * 1.6) * (1 - clamp(cx * 1.6))).toFixed(3) });
  const live = t > 7.7 && t < 16.2;
  css(S.term, { visibility: live ? 'visible' : 'hidden' });
  css(S.flipWrap, { visibility: live ? 'visible' : 'hidden' });
  if (live) renderRoute(t, sway, ci);

  // ---- chart ----
  K.wordsAt(S.hD, t, 15.4, 18.3, 0.06);
  const pin = sp(t, 15.1, P.default), mo = sp(t, 18.25, P.default);
  css(S.chart, { transform: `perspective(2000px) translate3d(0,${((1 - pin) * 360 + mo * 420).toFixed(2)}px,0) rotateX(${((1 - pin) * 22).toFixed(3)}deg)`, opacity: (clamp(pin * 1.6) * (1 - clamp(mo * 1.4))).toFixed(3), visibility: t > 14.9 && t < 19.4 ? 'visible' : 'hidden' });
  if (t > 14.9 && t < 19.4) renderChart(t);

  K.rippleAt(S.ripEnd, t, 18.55, 1.3);
  K.outroAt(S.outro, t, 18.6);
}

function renderRoute(t, sway, ci) {
  S.fMark.render(t);
  const r = t < NEXT[0] ? 0 : t < NEXT[1] ? 1 : 2;
  S.tReq.forEach((q, i) => {
    const req = REQUESTS[i];
    const vis = t >= TYPE[i] - 0.05;
    css(q.blk, { display: vis ? 'block' : 'none' });
    if (!vis) return;
    const typedTxt = K.typed(req.text, t, TYPE[i], 40);
    K.html(q.qt, `<span style="color:#00e5c3">›</span> "${typedTxt}${typedTxt.length === req.text.length ? '"' : ''}`);
    css(q.caret, { display: t >= TYPE[i] && t < SEND[i] ? 'inline-block' : 'none' });
    const m = MODELS[req.model];
    const done = t >= LOCK[i] + 0.15;
    K.html(q.a, done ? `<span style="color:#00e5c3">✓ 200</span> · ${m.slug} · billed: <span style="color:#c9fff6">${PLANS[m.id].plan}</span> · <b style="color:#00e5c3">$0.00</b>` : t >= SEND[i] ? `<span class="muted">… routing ${'.'.repeat(1 + (Math.floor(t * 8) % 3))}</span>` : '');
  });
  // flip: front (ranking) -> back (result) at each lock, back to front at the next request
  const ang = tr(t, [[0, 0], [LOCK[0], 180], [NEXT[0], 360], [LOCK[1], 540], [NEXT[1], 720], [LOCK[2], 900]], P.default);
  css(S.flip, { transform: `rotateX(${((1 - ci) * 16).toFixed(3)}deg) rotateY(${(ang + sway).toFixed(3)}deg)` });
  // the faces show the request whose turn it is (front shows the next request once flipped away)
  const req = REQUESTS[r];
  K.html(S.fReq, `<span style="color:#00e5c3;margin-right:12px">›</span>${K.typed(req.text, t, TYPE[r], 40)}`);
  S.rank.forEach((row, i) => {
    const keys = [[0, 0]];
    for (let q = 0; q < 3; q++) { if (q > 0) keys.push([TYPE[q], 0.08]); keys.push([SEND[q] + 0.05 + i * 0.07, FIT[q][i]]); }
    const fv = Math.max(0, K.tr(t, keys, P.snappy));
    const win = req.model === i ? sp(t, LOCK[r] - 0.25, P.snappy) : 0;
    css(row.fb, { transform: `scaleX(${fv.toFixed(4)})` });
    css(row.fw, { transform: `scaleX(${fv.toFixed(4)})`, opacity: win.toFixed(3) });
    css(row.r, { borderColor: `rgba(0,229,195,${(0.07 + 0.55 * win).toFixed(3)})`, background: `rgba(0,229,195,${(0.07 * win).toFixed(3)})` });
    text(row.sc, t >= SEND[r] + 0.05 ? fv.toFixed(2) : '—');
  });
  // the back face keeps the last routed request until the next lock, so it never changes mid-flip
  const rb = t < LOCK[1] ? 0 : t < LOCK[2] ? 1 : 2;
  const done = REQUESTS[rb];
  const m = MODELS[done.model];
  S.bTiles.forEach((d, i) => css(d, { visibility: i === done.model ? 'visible' : 'hidden' }));
  text(S.bName, m.name);
  text(S.bSlug, m.slug);
  K.html(S.bWhy, `Best fit for <b style="color:#f1f5f6">“${done.text}”</b>`);
  K.html(S.bBill, `${PLANS[m.id].plan}`);
  text(S.bPay, '$0.00');
  K.html(S.bList, `<s>${K.fmtUSD(K.reqCost(done))}</s>`);
  text(S.bRate, K.priceLabel(m));
  K.rippleAt(S.ripFlip, t, LOCK[r] + 0.2, 0.9);
}

function renderChart(t) {
  S.cMark.render(t);
  const p = seg(t, 15.45, 18.4);
  const use = [[24, 38], [12, 19], [30, 44], [8, 21]];
  S.cBars.forEach((b, i) => {
    const v = lerp(use[i][0], use[i][1], p) * sp(t, 15.3 + i * 0.08, P.default);
    css(b.b, { transform: `scaleX(${(v / 100).toFixed(4)})` });
    text(b.pct, `${Math.round(v)}%`);
  });
  const CH = S.CH;
  const N = 60, red = [], teal = [];
  for (let k = 0; k <= N; k++) {
    const q = (k / N) * p;
    const x = CH.x + q * CH.w;
    const v = climbN(q) / 1000;
    red.push(`${x.toFixed(1)},${(CH.y + CH.h - v * CH.h * 0.92 - 4 * Math.sin(k * 2.1) * q).toFixed(1)}`);
    teal.push(`${x.toFixed(1)},${(CH.y + CH.h - 3).toFixed(1)}`);
  }
  const dR = 'M' + red.join(' L');
  S.cRed.setAttribute('d', dR);
  S.cRedFill.setAttribute('d', `${dR} L${(CH.x + p * CH.w).toFixed(1)},${CH.y + CH.h} L${CH.x},${CH.y + CH.h} Z`);
  S.cTeal.setAttribute('d', 'M' + teal.join(' L'));
  const n = climbN(p);
  text(S.cRedNum, K.fmtUSD((TOTAL3 * n) / 3));
  text(S.cRedSub, `pay-per-token · ${K.fmtInt(n)} requests`);
  const tipX = CH.x + p * CH.w, tipY = CH.y + CH.h - (n / 1000) * CH.h * 0.92;
  const tw = S.cRedTip.offsetWidth;
  css(S.cRedTip, { transform: `translate3d(${(Math.min(tipX + 18, CH.x + CH.w - tw)).toFixed(1)}px,${(tipY - 110 < CH.y - 40 ? tipY + 20 : tipY - 100).toFixed(1)}px,0)`, opacity: clamp(p * 8).toFixed(3) });
  const ttw = S.cTealTip.offsetWidth;
  css(S.cTealTip, { transform: `translate3d(${(Math.min(tipX + 18, CH.x + CH.w - ttw)).toFixed(1)}px,${(CH.y + CH.h - 70).toFixed(1)}px,0)`, opacity: clamp(p * 8).toFixed(3) });
}

K.boot({ dur: DUR, mount, render });
