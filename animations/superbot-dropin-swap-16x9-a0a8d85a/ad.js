// V1 "Swap": the same prompt against two base_urls. Left, a stock endpoint refuses a
// legitimate ask in 3 lines. One line of the SDK changes (base_url), the subscriptions
// pack into one key, the router picks Opus 5.5 over Gemini and DeepSeek, and the same
// prompt comes back fully answered. End line: Superbot doesn't refuse. Drop in API
// replacement.
import {
  W, H, clamp, lerp, seg, smooth, outCubic, sp, win, h, $, $$, op, tf, typed, esc,
  PLANS, REQUESTS, STOCK_URL, BASE_URL, KEY_FULL, MODEL_LANES, PLAN, listCost, fmtTok,
  tile, makeMark, makeCursor, placeCursor, pressScale, camera, makeEditor, editorLines,
  makeKeyCard, makeLanes, makeEnd, boot, PRESETS, track, spring,
} from './kit.js';

const DUR = 26;
const REQ = REQUESTS.pentest;

// scene times
const T_SWAP = 7.4, T_KEYS = 11.0, T_ROUTE = 15.6, T_ANSWER = 20.0, T_END = 23.2;

const ROW0 = 250, ROWH = 118;
const subRowY = (i) => ROW0 + i * ROWH;
const COL_L = { x: 250, y: 336, w: 690, h: 520 };
const COL_R = { x: 980, y: 336, w: 690, h: 520 };
const ED = { x: 300, y: 150, w: 1320, h: 780 };
const KEY = { x: 500, y: 250, w: 920, h: 540 };
const LANES = { x: 340, y: 250, w: 1240 };

let R = {};

function mount(stage) {
  stage.innerHTML = '';
  const world = h('<div class="world" id="cam"></div>');
  stage.appendChild(world);

  // header ------------------------------------------------------------------------
  const head = h(`<div class="abs" style="left:0;top:64px;width:1920px;text-align:center">
    <div class="kicker">same prompt · same code</div>
    <div class="v1-title">One line decides what you get back</div>
  </div>`);
  world.appendChild(head);

  // ask (both endpoints, one prompt) ----------------------------------------------
  const ask = h(`<div class="abs v1-ask" style="left:250px;top:186px;width:1420px;height:104px">
    <div class="who">You</div><div class="body"><span class="txt"></span><span class="caret"></span></div>
    <div class="once mono">model: auto</div></div>`);
  world.appendChild(ask);

  // two endpoint columns -----------------------------------------------------------
  const mkCol = (side, o) => {
    const col = h(`<div class="abs v1-col ${side}" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px">
      <div class="endpill ${side}"><span class="st"></span><span class="mono url"></span><span class="lat mono"></span></div>
      <div class="bub stock"><div class="who"><span class="ep mono">POST /v1/chat/completions</span></div>
        <div class="body"><div class="refuse"><span class="rk"></span>I can't help with that.</div><div class="why"></div></div></div>
      <div class="bub sb"><div class="who"><span class="m"></span><b>Superbot</b><span class="chip route mono"></span></div>
        <div class="body"><pre class="ans mono"></pre><span class="cursor-line"></span></div></div>
    </div>`);
    world.appendChild(col);
    const mk = makeMark(30);
    $(col, '.sb .who .m').appendChild(mk.el);
    return {
      el: col, mark: mk, pill: $(col, '.endpill'), url: $(col, '.endpill .url'), lat: $(col, '.endpill .lat'),
      stock: $(col, '.bub.stock'), refuse: $(col, '.bub.stock .refuse'), rk: $(col, '.rk'), why: $(col, '.why'),
      sb: $(col, '.bub.sb'), route: $(col, '.chip.route'), ans: $(col, '.ans'), ansLine: $(col, '.cursor-line'),
    };
  };
  const left = mkCol('stock', COL_L);
  const right = mkCol('sb', COL_R);
  left.url.textContent = STOCK_URL; right.url.textContent = BASE_URL;
  left.sb.style.display = 'none'; right.stock.style.display = 'none';

  // editor (the one-line swap) ------------------------------------------------------
  const ed = makeEditor();
  world.appendChild(ed.el);
  Object.assign(ed.el.style, { left: ED.x + 'px', top: ED.y + 'px', width: ED.w + 'px', height: ED.h + 'px' });
  const lines = editorLines(ed);
  const swapLine = lines[3];

  // keyring -------------------------------------------------------------------------
  const kc = makeKeyCard();
  kc.el.style.cssText = `left:${KEY.x}px;top:${KEY.y}px;width:${KEY.w}px;height:${KEY.h}px`;
  world.appendChild(kc.el);  const subs = PLANS.map((p, i) => {
    const r = h(`<div class="abs v1-sub" style="left:224px;top:${subRowY(i)}px;width:660px;height:104px">
      <div class="tslot">${tile(p.id)}</div>
      <div class="nm"><b>${p.plan}</b><span>${p.vendor} · ${p.model}</span></div>
      <div class="st"><i class="dot"></i>Connected</div></div>`);
    world.appendChild(r);
    return r;
  });
  const flyers = PLANS.map((p) => { const f = h(`<div class="abs flyer">${tile(p.id)}</div>`); world.appendChild(f); return f; });
  const slotPos = (i) => ({ x: KEY.x + 40 + i * 82, y: KEY.y + 340 });

  // lanes ---------------------------------------------------------------------------
  const lanes = makeLanes();
  Object.assign(lanes.el.style, { left: LANES.x + 'px', top: LANES.y + 'px', width: LANES.w + 'px' });
  world.appendChild(lanes.el);
  const laneCost = lanes.lanes.map((_, i) => listCost(PLAN[MODEL_LANES[i]], REQ.tin, REQ.tout));
  const laneFit = [0.96, 0.74, 0.58];
  const WINNER = 0;
  const routeCap = h(`<div class="abs" style="left:${LANES.x}px;top:196px;width:${LANES.w}px">
    <div class="kicker">routing this request through your plans</div></div>`);
  world.appendChild(routeCap);

  const cursor = makeCursor();
  world.appendChild(cursor);
  const dim = h('<div class="layer" style="background:#050506"></div>');
  stage.appendChild(dim);
  const end = makeEnd();
  stage.appendChild(end.el);

  R = { world, head, ask, left, right, ed, lines, swapLine, kc, subs, flyers, slotPos, lanes, laneFit, laneCost, WINNER, routeCap, cursor, dim, end };
}

function render(t) {
  const { world, head, ask, left, right, ed, kc, subs, flyers, lanes, routeCap, cursor, dim, end } = R;

  // camera: establish, hold on compare, rise to editor, drop to keys, lanes, back, end
  const cam = [
    [0, 960, 300, 1.08], [1.1, 960, 470, 1.22],
    [2.2, 900, 500, 1.14], [3.4, 940, 520, 1.16], [4.6, 960, 520, 1.12],
    [5.6, 960, 500, 1.0],
    [6.4, 960, 520, 1.4], [8.6, 960, 520, 1.4],
    [9.6, 960, 520, 1.0],
    [10.3, 900, 520, 1.32], [13.2, 980, 560, 1.26],
    [14.2, 960, 540, 1.0],
    [15.0, 960, 620, 1.22], [19.3, 980, 700, 1.26],
    [20.2, 960, 560, 1.0], [21.0, 960, 570, 1.1], [22.6, 960, 570, 1.14],
  ];
  camera(world, t, cam);

  const s = (a, b) => smooth((t - a) / (b - a));

  // S1 compare: ask types, stock refuses, superbot waits -----------------------------
  op(head, win(t, 0.0, 5.4, 0.35, 0.3));
  const onCompare = win(t, 0.2, T_SWAP + 0.2, 0.35, 0.25);
  const inCompare = t < T_SWAP + 0.3;
  const ba = smooth((t - T_ANSWER + 0.2) / 0.45);
  op(ask, onCompare);
  op(left.el, inCompare ? win(t, 1.5, T_SWAP + 0.1, 0.3, 0.25) : 0.55 + 0.45 * ba);
  tf(left.el, `translateX(${(1 - ba) * 365}px)`);
  op(right.el, inCompare ? 0 : ba);
  $(ask, '.txt').textContent = typed(REQ.ask, t, 1.3, 46);
  $(ask, '.caret').style.opacity = t > 1.3 && t < 4.4 && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  const onceK = sp(t, 1.55, PRESETS.snappy);
  op($(ask, '.once'), 0.9 * smooth((t - 1.55) / 0.3));
  tf($(ask, '.once'), `translateX(${(1 - onceK) * 16}px)`);

  // stock: spinner then refusal
  const spin = t > 2.9 && t < 3.75;
  left.rk.style.transform = spin ? `rotate(${t * 300}deg)` : 'none';
  left.rk.classList.toggle('waiting', spin);
  op(left.refuse, smooth((t - 3.7) / 0.22));
  op(left.why, smooth((t - 4.15) / 0.3));
  left.why.textContent = t > 4.15 ? REQ.reply : '';
  left.el.classList.toggle('flash', t > 3.7 && t < 4.05);
  left.sb.style.display = 'none';

  // superbot side, before the swap: just the endpoint waiting
  right.stock.style.display = 'none';
  op(right.route, 0);
  right.ans.textContent = '';
  right.ansLine.style.opacity = 0;

  // S2 editor: one line changes -------------------------------------------------------
  const eIn = sp(t, 6.3, PRESETS.default), eOut = sp(t, T_SWAP + 2.9, PRESETS.default);
  tf(ed.el, `translateY(${(1 - eIn) * 900 + eOut * 980}px)`);
  op(ed.el, t > 6.15 && t < T_SWAP + 3.6 ? 1 : 0);
  paintSwap(t);
  op(ed.diff, smooth((t - 8.6) / 0.3));
  op(ed.same, smooth((t - 8.9) / 0.3));
  ed.run.style.transform = `scale(${pressScale(t, [8.35])})`;
  ed.run.classList.toggle('go', t > 8.35);

  // S3 keyring ----------------------------------------------------------------------
  const kIn = win(t, 10.2, T_ROUTE - 0.5, 0.4, 0.3);
  op(kc.el, kIn);
  op(dim, kIn * 0.62 * (1 - smooth((t - T_ROUTE + 0.2) / 0.4)));
  subs.forEach((r, i) => {
    const k = sp(t, 10.3 + i * 0.1, PRESETS.default);
    const fly = 11.4 + i * 0.4;
    const gone = smooth((t - fly) / 0.3);
    tf(r, `translateY(${(1 - k) * 40}px)`);
    op(r, kIn * smooth((t - 10.3 - i * 0.1) / 0.3) * (1 - 0.86 * gone));
    $(r, '.tslot').style.opacity = t < fly ? 1 : 0;
    const f = flyers[i];
    const a = { x: 224 + 24, y: subRowY(i) + 24 }, b = R.slotPos(i);
    const u = spring(t - fly, 120, 20);
    const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - 150 * Math.sin(Math.PI * clamp(u));
    const land = t - fly - 0.44;
    const pop = land > 0 ? 1 + 0.18 * Math.exp(-land * 7) * Math.sin(land * 22) : 1;
    tf(f, `translate(${x}px, ${y}px) scale(${lerp(1, 0.9, u) * pop}) rotate(${Math.sin(Math.PI * clamp(u)) * -9}deg)`);
    op(f, (t >= fly ? 1 : 0) * kIn);
  });
  const kOn = smooth((t - 11.35) / 0.3);
  kc.el.classList.toggle('live', t > 11.35);
  op(kc.empty, 1 - kOn);
  op(kc.body, kOn);
  let landed = 0;
  kc.segs.forEach((sg, i) => {
    const t0 = 11.4 + i * 0.4 + 0.44;
    if (t > t0) landed++;
    sg.textContent = typed(PLANS[i].seg, t, t0, 30);
    sg.style.width = smooth((t - t0) / 0.22) > 0.5 ? 'auto' : '0';
  });
  kc.count.textContent = landed;
  kc.countW.textContent = landed === 1 ? 'subscription' : 'subscriptions';
  kc.caret.style.opacity = t > 11.4 && t < 13.9 && Math.floor(t * 3) % 2 === 0 ? 1 : 0;
  const copied = t > 14.2;
  kc.el.classList.toggle('copied', copied);
  kc.copy.style.transform = `scale(${pressScale(t, [14.2])})`;

  // S4 lanes -------------------------------------------------------------------------
  const lIn = win(t, T_ROUTE - 0.4, T_ANSWER + 0.3, 0.4, 0.3);
  op(lanes.el, lIn);
  op(routeCap, lIn);
  const u = t - T_ROUTE;
  lanes.lanes.forEach((row, i) => {
    const f = R.laneFit[i];
    const fu = outCubic((u - 0.35 - i * 0.12) / 0.6);
    $(row, '.bar i').style.width = (f * fu * 100).toFixed(1) + '%';
    $(row, '.bar i').style.background = i === R.WINNER && u > 1.25 ? 'var(--grad)' : '#5c5f69';
    $(row, '.l-sc').textContent = (f * fu).toFixed(2);
    const isWin = i === R.WINNER;
    const wk = isWin ? sp(t, u > 1.25 ? T_ROUTE + 1.25 : 1e9, PRESETS.snappy) : 0;
    row.classList.toggle('win', isWin && u > 1.25);
    op(row, (u > 1.25 && !isWin ? 0.4 : 1) * lIn);
    tf(row, `translateX(${isWin ? wk * 8 : 0}px)`);
    $(row, '.l-cost').textContent = t > T_ROUTE + 0.5 ? `${fmtTok(REQ.tin)} in · ${fmtTok(REQ.tout)} out · $${R.laneCost[i].toFixed(3)} list` : '';
  });

  // S5 answer lands -------------------------------------------------------------------
  const ansStart = T_ANSWER;
  const rOn = win(t, ansStart - 0.2, T_END + 0.1, 0.35, 0.3);
  op(right.route, smooth((t - ansStart) / 0.25));
  right.route.innerHTML = t > ansStart ? `${tile('claude', 'xs')}Opus 5.5 · Claude Max` : '';
  const shown = Math.max(0, Math.floor((t - ansStart - 0.35) * 120));
  right.ans.textContent = REQ.answer.slice(0, shown);
  right.ansLine.style.opacity = t > ansStart + 0.35 && t < T_END && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  // strike through the refusal
  left.el.classList.toggle('beat', t > ansStart + 0.2);
  left.el.style.setProperty('--k', outCubic((t - ansStart - 0.2) / 0.5));

  // cursor
  placeCursor(cursor, t, [[0, 1500, 1000], [2.6, 560, 430], [5.0, 1700, 980], [8.3, 1520, 990], [11.5, 520, 300], [14.2, 1540, 700], [16.4, 1450, 900], [19.2, 1500, 980]], [8.35, 14.2], win(t, 2.4, T_ANSWER - 0.2, 0.3, 0.3));

  // end
  op(end.el, smooth((t - T_END - 0.2) / 0.35));
  end.render(Math.max(0, t - T_END - 0.2));
}

function paintSwap(t) {
  const { swapLine, lines } = R;
  const old = $(swapLine, '.old'), nw = $(swapLine, '.new');
  const tSel = 6.7, tTyp = 7.05;
  const sel = t > tSel && t < tTyp;
  old.classList.toggle('sel', sel);
  old.style.display = t < tTyp ? '' : 'none';
  nw.textContent = t > tTyp ? typed(BASE_URL, t, tTyp, 42) : '';
  swapLine.classList.toggle('chg', t > tTyp);
  $(swapLine, '.gut').style.transform = `scaleY(${smooth((t - tTyp) / 0.2)})`;
  const keyLine = lines[4];
  const o2 = $(keyLine, '.old'), n2 = $(keyLine, '.new');
  const tTyp2 = 7.45;
  o2.classList.toggle('sel', t > 7.1 && t < tTyp2);
  o2.style.display = t < tTyp2 ? '' : 'none';
  n2.textContent = t > tTyp2 ? typed('os.environ["SUPERBOT_API_KEY"]', t, tTyp2, 34) : '';
  keyLine.classList.toggle('chg', t > tTyp2);
  $(keyLine, '.gut').style.transform = `scaleY(${smooth((t - tTyp2) / 0.2)})`;
}

boot({ DUR, mount, render });