// V2 "Route": a medication-dosage prompt a stock endpoint refuses, then the same prompt
// tossed at three lanes. Opus 5.5, Gemini 3.1 Pro and DeepSeek V4.1 Flash each score a
// fit, two lose, Opus takes it, and the answer comes back whole. One key, your plans.
// End line: Superbot doesn't refuse. Drop in API replacement.
import {
  W, H, clamp, lerp, seg, smooth, outCubic, sp, win, h, $, $$, op, tf, typed,
  PLANS, REQUESTS, STOCK_URL, BASE_URL, KEY_FULL, MODEL_LANES, PLAN, listCost, fmtTok,
  tile, makeMark, makeCursor, placeCursor, pressScale, camera, makeEditor, editorLines,
  makeKeyCard, makeLanes, makeEnd, boot, PRESETS, track, spring,
} from './kit.js';

const DUR = 26;
const REQ = REQUESTS.dosage;

const T_SWAP = 6.6, T_KEY = 9.4, T_ROUTE = 11.8, T_ANSWER = 17.4, T_END = 21.4;

const LANES = { x: 300, y: 300, w: 1320 };
let R = {};

function mount(stage) {
  stage.innerHTML = '';
  const world = h('<div class="world" id="cam"></div>');
  stage.appendChild(world);

  const head = h(`<div class="abs" style="left:0;top:58px;width:1920px;text-align:center">
    <div class="kicker">one prompt · three of your models</div>
    <div class="v2-title">It picks the model that fits, not the one that flinches</div>
  </div>`);
  world.appendChild(head);

  // ask + stock refusal ------------------------------------------------------------
  const ask = h(`<div class="abs v2-ask" style="left:340px;top:200px;width:1240px;height:96px">
    <div class="who">You</div><div class="body"><span class="txt"></span><span class="caret"></span></div></div>`);
  world.appendChild(ask);
  const stock = h(`<div class="abs v2-stock" style="left:340px;top:324px;width:1240px;height:150px">
    <div class="endpill stock"><span class="st"></span><span class="mono url">${STOCK_URL}</span></div>
    <div class="refuse"><span class="rk"></span><span class="rtxt">I can't help with that.</span></div></div>`);
  world.appendChild(stock);

  // compact swap snippet ------------------------------------------------------------
  const ed = makeEditor();
  Object.assign(ed.el.style, { left: '340px', top: '196px', width: '1240px', height: '470px' });
  world.appendChild(ed.el);
  const lines = editorLines(ed);
  const swapLine = lines[3];

  // key chip (compact, forms from subs) ----------------------------------------------
  const kc = makeKeyCard();
  Object.assign(kc.el.style, { left: '340px', top: '700px', width: '1240px', height: '300px' });
  world.appendChild(kc.el);
  const subY = (i) => 700 + 30 + i * 60;
  const subs = PLANS.map((p, i) => {
    const r = h(`<div class="abs v2-sub" style="left:200px;top:${(180 + i * 96)}px;width:520px;height:84px">
      <div class="tslot">${tile(p.id)}</div>
      <div class="nm"><b>${p.plan}</b><span>${p.vendor}</span></div>
      <div class="st"><i class="dot"></i>Connected</div></div>`);
    world.appendChild(r);
    return r;
  });
  const flyers = PLANS.map((p) => { const f = h(`<div class="abs flyer">${tile(p.id)}</div>`); world.appendChild(f); return f; });
  const slotPos = (i) => ({ x: 340 + 40 + i * 78, y: 700 + 210 });

  // lanes ---------------------------------------------------------------------------
  const lanes = makeLanes();
  Object.assign(lanes.el.style, { left: LANES.x + 'px', top: LANES.y + 'px', width: LANES.w + 'px' });
  world.appendChild(lanes.el);
  const laneFit = [0.93, 0.88, 0.44];
  const laneCost = lanes.lanes.map((_, i) => listCost(PLAN[MODEL_LANES[i]], REQ.tin, REQ.tout));
  const WINNER = 1; // Gemini 3.1 Pro wins the long medication context in this variant
  const routeCap = h(`<div class="abs" style="left:${LANES.x}px;top:236px;width:${LANES.w}px">
    <div class="kicker">same prompt · three of your plans · one gets it</div></div>`);
  world.appendChild(routeCap);

  // answer --------------------------------------------------------------------------
  const ans = h(`<div class="abs v2-ans bub sb" style="left:520px;top:300px;width:880px;height:560px">
    <div class="who"><span class="m"></span><b>Superbot</b><span class="chip route mono"></span></div>
    <div class="body"><pre class="txt mono"></pre><span class="cursor-line"></span></div></div>`);
  world.appendChild(ans);
  const ansMark = makeMark(30);
  $(ans, '.who .m').appendChild(ansMark.el);

  const cursor = makeCursor();
  world.appendChild(cursor);
  const dim = h('<div class="layer" style="background:#060607"></div>');
  stage.appendChild(dim);
  const end = makeEnd();
  stage.appendChild(end.el);

  R = { world, head, ask, stock, ed, lines, swapLine, kc, subs, flyers, slotPos, lanes, laneFit, laneCost, WINNER, routeCap, ans, ansMark, cursor, dim, end };
}

function render(t) {
  const { world, head, ask, stock, ed, kc, subs, flyers, lanes, routeCap, ans, cursor, dim, end } = R;
  const cam = [
    [0, 960, 300, 1.06], [1.0, 960, 300, 1.24],
    [2.4, 960, 280, 1.3], [4.2, 960, 360, 1.34], [5.4, 960, 300, 1.1],
    [6.2, 960, 400, 1.34], [8.0, 960, 430, 1.3], [8.9, 960, 420, 1.0],
    [9.6, 900, 840, 1.24], [10.6, 960, 800, 1.2],
    [11.2, 960, 700, 1.0], [11.9, 960, 760, 1.24], [16.4, 960, 800, 1.26],
    [17.2, 960, 560, 1.0], [17.9, 960, 580, 1.4], [19.6, 990, 620, 1.3], [21.0, 1090, 660, 1.36],
  ];
  camera(world, t, cam);
  const s = (a, b) => smooth((t - a) / (b - a));

  // S1 refusal
  op(head, win(t, 0.0, 5.2, 0.35, 0.3));
  op(ask, win(t, 0.2, T_SWAP, 0.35, 0.3));
  op(stock, win(t, 1.5, T_SWAP, 0.3, 0.3));
  $(ask, '.txt').textContent = typed(REQ.ask, t, 1.25, 44);
  $(ask, '.caret').style.opacity = t > 1.25 && t < 5.0 && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  const spinning = t > 2.7 && t < 3.55;
  $(stock, '.rk').style.transform = spinning ? `rotate(${t * 300}deg)` : 'none';
  $(stock, '.rk').classList.toggle('waiting', spinning);
  op($(stock, '.refuse'), smooth((t - 3.5) / 0.22));
  stock.classList.toggle('flash', t > 3.5 && t < 3.85);

  // S2 swap
  const eIn = sp(t, 5.5, PRESETS.default), eOut = sp(t, 8.7, PRESETS.default);
  tf(ed.el, `translateY(${(1 - eIn) * 700 + eOut * 780}px)`);
  op(ed.el, t > 5.35 && t < 9.4 ? 1 : 0);
  paintSwap(t);
  op(ed.diff, smooth((t - 7.8) / 0.3));
  op(ed.same, smooth((t - 8.1) / 0.3));
  ed.run.style.transform = `scale(${pressScale(t, [7.55])})`;
  ed.run.classList.toggle('go', t > 7.55);

  // S3 key
  const kIn = win(t, 9.3, T_ROUTE + 0.8, 0.4, 0.3);
  op(kc.el, kIn);
  op(dim, kIn * 0.5 * (1 - smooth((t - T_ROUTE + 0.3) / 0.4)));
  subs.forEach((r, i) => {
    const k = sp(t, 9.4 + i * 0.1, PRESETS.default);
    const fly = 10.1 + i * 0.36;
    const gone = smooth((t - fly) / 0.3);
    tf(r, `translateY(${(1 - k) * 40}px)`);
    op(r, kIn * smooth((t - 9.4 - i * 0.1) / 0.3) * (1 - 0.86 * gone));
    $(r, '.tslot').style.opacity = t < fly ? 1 : 0;
    const f = flyers[i];
    const a = { x: 200 + 18, y: 180 + i * 96 + 18 }, b = R.slotPos(i);
    const u = spring(t - fly, 120, 20);
    const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - 130 * Math.sin(Math.PI * clamp(u));
    const land = t - fly - 0.42;
    const pop = land > 0 ? 1 + 0.16 * Math.exp(-land * 7) * Math.sin(land * 22) : 1;
    tf(f, `translate(${x}px, ${y}px) scale(${lerp(1, 0.86, u) * pop}) rotate(${Math.sin(Math.PI * clamp(u)) * -8}deg)`);
    op(f, (t >= fly ? 1 : 0) * kIn);
  });
  const kOn = smooth((t - 10.05) / 0.3);
  kc.el.classList.toggle('live', t > 10.05);
  op(kc.empty, 1 - kOn);
  op(kc.body, kOn);
  let landed = 0;
  kc.segs.forEach((sg, i) => {
    const t0 = 10.1 + i * 0.36 + 0.42;
    if (t > t0) landed++;
    sg.textContent = typed(PLANS[i].seg, t, t0, 30);
    sg.style.width = smooth((t - t0) / 0.22) > 0.5 ? 'auto' : '0';
  });
  kc.count.textContent = landed;
  kc.caret.style.opacity = t > 10.1 && t < 11.4 && Math.floor(t * 3) % 2 === 0 ? 1 : 0;

  // S4 lanes
  const lIn = win(t, T_ROUTE - 0.3, T_ANSWER + 0.2, 0.4, 0.3);
  op(lanes.el, lIn);
  op(routeCap, lIn);
  const u = t - T_ROUTE;
  lanes.lanes.forEach((row, i) => {
    const f = R.laneFit[i];
    const fu = outCubic((u - 0.4 - i * 0.14) / 0.7);
    $(row, '.bar i').style.width = (f * fu * 100).toFixed(1) + '%';
    $(row, '.bar i').style.background = i === R.WINNER && u > 1.4 ? 'var(--grad)' : '#5c5f69';
    $(row, '.l-sc').textContent = (f * fu).toFixed(2);
    const isWin = i === R.WINNER;
    const done = u > 1.4;
    row.classList.toggle('win', isWin && done);
    row.classList.toggle('lose', !isWin && done);
    op(row, lIn * (done && !isWin ? 0.45 : 1));
    tf(row, `translateX(${isWin && done ? sp(t, T_ROUTE + 1.4, PRESETS.snappy) * 10 : 0}px)`);
    $(row, '.l-cost').textContent = u > 0.6 ? `${fmtTok(REQ.tin)} in · ${fmtTok(REQ.tout)} out` : '';
    $(row, '.l-bill').style.opacity = isWin && done ? 1 : 0.35;
  });

  // S5 answer
  const aIn = win(t, T_ANSWER - 0.2, T_END + 0.1, 0.4, 0.3);
  op(ans, aIn);
  $(ans, '.chip.route').innerHTML = t > T_ANSWER ? `${tile('gemini', 'xs')}Gemini 3.1 Pro · Google AI Pro` : '';
  const shown = Math.max(0, Math.floor((t - T_ANSWER - 0.4) * 96));
  $(ans, '.txt').textContent = REQ.answer.slice(0, shown);
  $(ans, '.cursor-line').style.opacity = t > T_ANSWER + 0.4 && t < T_END && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  R.ansMark.render(t);

  placeCursor(cursor, t, [[0, 1560, 980], [2.9, 900, 400], [5.2, 1640, 1000], [7.55, 1400, 600], [10.4, 460, 860], [13.0, 1500, 880], [16.6, 1450, 900]], [7.55], win(t, 2.4, T_ANSWER - 0.4, 0.3, 0.3));

  op(end.el, smooth((t - T_END - 0.2) / 0.35));
  end.render(Math.max(0, t - T_END - 0.2));
}

function paintSwap(t) {
  const { swapLine, lines } = R;
  const old = $(swapLine, '.old'), nw = $(swapLine, '.new');
  const tSel = 5.9, tTyp = 6.25;
  old.classList.toggle('sel', t > tSel && t < tTyp);
  old.style.display = t < tTyp ? '' : 'none';
  nw.textContent = t > tTyp ? typed(BASE_URL, t, tTyp, 42) : '';
  swapLine.classList.toggle('chg', t > tTyp);
  $(swapLine, '.gut').style.transform = `scaleY(${smooth((t - tTyp) / 0.2)})`;
  const keyLine = lines[4];
  const o2 = $(keyLine, '.old'), n2 = $(keyLine, '.new');
  const tTyp2 = 6.65;
  o2.classList.toggle('sel', t > 6.3 && t < tTyp2);
  o2.style.display = t < tTyp2 ? '' : 'none';
  n2.textContent = t > tTyp2 ? typed('os.environ["SUPERBOT_API_KEY"]', t, tTyp2, 34) : '';
  keyLine.classList.toggle('chg', t > tTyp2);
  $(keyLine, '.gut').style.transform = `scaleY(${smooth((t - tTyp2) / 0.2)})`;
}

boot({ DUR, mount, render });