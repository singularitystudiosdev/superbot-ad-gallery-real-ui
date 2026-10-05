// V3 "Keyring": four subscriptions pack into one sbc_ key, and that key is the only thing
// that changes in the code. Two legitimate prompts the stock endpoint refuses both come
// back answered, each routed to the plan that fits it (Opus 5.5 for the pen-test script,
// DeepSeek V4.1 Flash for the bulk rewrite). End line: Superbot doesn't refuse. Drop in API
// replacement.
import {
  W, H, clamp, lerp, seg, smooth, outCubic, sp, win, h, $, $$, op, tf, typed,
  PLANS, REQUESTS, STOCK_URL, BASE_URL, KEY_FULL, PLAN, listCost, fmtTok,
  tile, makeMark, makeCursor, placeCursor, pressScale, camera, makeEditor, editorLines,
  makeKeyCard, makeEnd, boot, PRESETS, track, spring,
} from './kit.js';

const DUR = 26;
const A = REQUESTS.pentest, B = REQUESTS.dosage;
const PAIR = [
  { req: A, model: PLAN.claude, fit: 0.96 },
  { req: B, model: PLAN.deepseek, fit: 0.91 },
];

const T_KEY = 2.0, T_ROWS = 9.2, T_ANSWER = 13.6, T_END = 22.4;

const KEY = { x: 560, y: 210, w: 1000, h: 540 };
const subY = (i) => 210 + i * 130;
let R = {};

function mount(stage) {
  stage.innerHTML = '';
  const world = h('<div class="world" id="cam"></div>');
  stage.appendChild(world);

  const head = h(`<div class="abs" style="left:0;top:58px;width:1920px;text-align:center">
    <div class="kicker">all your subscriptions · one key</div>
    <div class="v3-title">Drop it into any OpenAI client and it stops refusing</div>
  </div>`);
  world.appendChild(head);

  // keyring hero --------------------------------------------------------------------
  const kc = makeKeyCard();
  kc.el.style.cssText = `left:${KEY.x}px;top:${KEY.y}px;width:${KEY.w}px;height:${KEY.h}px`;
  world.appendChild(kc.el);
  const subs = PLANS.map((p, i) => {
    const r = h(`<div class="abs v3-sub" style="left:96px;top:${subY(i)}px;width:440px;height:112px">
      <div class="tslot">${tile(p.id)}</div>
      <div class="nm"><b>${p.plan}</b><span>${p.vendor} · ${p.model}</span></div>
      <div class="st"><i class="dot"></i>Connected</div></div>`);
    world.appendChild(r);
    return r;
  });
  const flyers = PLANS.map((p) => { const f = h(`<div class="abs flyer">${tile(p.id)}</div>`); world.appendChild(f); return f; });
  const slotPos = (i) => ({ x: KEY.x + 46 + i * 96, y: KEY.y + 372 });

  // pair table: prompt | stock response | superbot response -----------------------------
  const ROW_H = 214;
  const rows = PAIR.map((pair, i) => {
    const r = h(`<div class="abs v3-row" style="left:190px;top:${262 + i * (ROW_H + 24)}px;width:1540px;height:${ROW_H}px">
      <div class="c-ask"><div class="who">You</div><div class="body"><span class="txt"></span></div></div>
      <div class="c-stock"><div class="endpill stock"><span class="st"></span><span class="mono">${STOCK_URL}</span></div>
        <div class="refuse"><span class="rk"></span>I can't help with that.</div></div>
      <div class="c-sb"><div class="who"><span class="m"></span><b>Superbot</b><span class="chip route mono"></span></div>
        <pre class="ans mono"></pre></div></div>`);
    world.appendChild(r);
    const mk = makeMark(26);
    $(r, '.c-sb .who .m').appendChild(mk.el);
    return { el: r, mark: mk, ask: $(r, '.c-ask .txt'), refuse: $(r, '.c-stock .refuse'),
      route: $(r, '.c-sb .chip.route'), ans: $(r, '.c-sb .ans'), pick: pair };
  });

  // swap strip (base_url + api_key both come from one key) -----------------------------
  const ed = makeEditor();
  Object.assign(ed.el.style, { left: '360px', top: '760px', width: '1200px', height: '300px' });
  world.appendChild(ed.el);
  const lines = editorLines(ed);
  const swapLine = lines[3];
  const keyLine = lines[4];

  const cursor = makeCursor();
  world.appendChild(cursor);
  const dim = h('<div class="layer" style="background:#060607"></div>');
  stage.appendChild(dim);
  const end = makeEnd();
  stage.appendChild(end.el);

  R = { world, head, kc, subs, flyers, slotPos, rows, ed, swapLine, keyLine, cursor, dim, end };
}

function render(t) {
  const { world, head, kc, subs, flyers, rows, ed, cursor, dim, end } = R;
  const cam = [
    [0, 960, 320, 1.02], [1.2, 960, 460, 1.2], [4.0, 1010, 480, 1.24], [7.2, 1010, 480, 1.2], [8.2, 960, 560, 1.0],
    [9.0, 980, 620, 1.16], [12.4, 980, 640, 1.2],
    [13.0, 960, 660, 1.0], [13.6, 980, 700, 1.22], [16.0, 1000, 720, 1.24],
    [17.4, 980, 900, 1.3], [19.0, 980, 900, 1.34],
    [20.4, 960, 700, 1.0], [21.2, 1120, 700, 1.34],
  ];
  camera(world, t, cam);
  const s = (a, b) => smooth((t - a) / (b - a));

  // S1 keyring hero
  op(head, win(t, 0.0, T_ROWS - 0.6, 0.4, 0.35));
  const kIn = win(t, 0.2, T_ROWS - 0.1, 0.4, 0.35);
  op(kc.el, kIn);
  op(dim, kIn * 0.5 * (1 - smooth((t - T_ROWS + 0.2) / 0.4)));
  subs.forEach((r, i) => {
    const k = sp(t, 0.4 + i * 0.1, PRESETS.default);
    const fly = 2.2 + i * 0.5;
    const gone = smooth((t - fly) / 0.3);
    tf(r, `translateY(${(1 - k) * 46}px)`);
    op(r, kIn * smooth((t - 0.4 - i * 0.1) / 0.3) * (1 - 0.88 * gone));
    $(r, '.tslot').style.opacity = t < fly ? 1 : 0;
    const f = flyers[i];
    const a = { x: 96 + 28, y: subY(i) + 28 }, b = R.slotPos(i);
    const u = spring(t - fly, 120, 20);
    const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - 170 * Math.sin(Math.PI * clamp(u));
    const land = t - fly - 0.46;
    const pop = land > 0 ? 1 + 0.2 * Math.exp(-land * 7) * Math.sin(land * 22) : 1;
    tf(f, `translate(${x}px, ${y}px) scale(${lerp(1.1, 0.92, u) * pop}) rotate(${Math.sin(Math.PI * clamp(u)) * -12}deg)`);
    op(f, (t >= fly ? 1 : 0) * kIn);
  });
  const kOn = smooth((t - 2.15) / 0.3);
  kc.el.classList.toggle('live', t > 2.15);
  op(kc.empty, 1 - kOn);
  op(kc.body, kOn);
  let landed = 0;
  kc.segs.forEach((sg, i) => {
    const t0 = 2.2 + i * 0.5 + 0.48;
    if (t > t0) landed++;
    sg.textContent = typed(PLANS[i].seg, t, t0, 32);
    sg.style.width = smooth((t - t0) / 0.22) > 0.5 ? 'auto' : '0';
  });
  kc.count.textContent = landed;
  kc.countW.textContent = landed === 1 ? 'subscription' : 'subscriptions';
  kc.caret.style.opacity = t > 2.2 && t < 5.6 && Math.floor(t * 3) % 2 === 0 ? 1 : 0;
  kc.el.classList.toggle('copied', t > 6.2);
  kc.copy.style.transform = `scale(${pressScale(t, [6.2])})`;

  // S2 pair rows: two prompts, two refusals, two answers
  const rOn = win(t, T_ROWS, T_ANSWER + 0.2, 0.4, 0.3);
  rows.forEach((row, i) => {
    const rr = t - (T_ROWS + i * 0.5);
    const rk = sp(rr, 0, PRESETS.default);
    op(row.el, rOn);
    tf(row.el, `translateY(${(1 - rk) * 44}px)`);
    $(row.el, '.txt').textContent = typed(row.pick.req.ask, t, T_ROWS + 0.3 + i * 0.5, 56);
    const spin = rr > 0.9 - i * 0.1 && rr < 1.7 - i * 0.1;
    $(row.el, '.rk').style.transform = spin ? `rotate(${t * 300}deg)` : 'none';
    $(row.el, '.rk').classList.toggle('waiting', spin);
    op(row.refuse, smooth((rr - 1.55 + i * 0.1) / 0.22));
    row.el.classList.toggle('show-sb', rr > 2.1);
    op($(row.el, '.c-sb'), smooth((rr - 2.1) / 0.3));
    row.route.innerHTML = rr > 2.3 ? `${tile(row.pick.model.id, 'xs')}${row.pick.model.model}` : '';
    const shown = Math.max(0, Math.floor((rr - 2.5) * 110));
    row.ans.textContent = row.pick.req.answer.split('\n').slice(0, 3).join('\n').slice(0, shown);
    row.mark.render(t);
  });

  // S3 swap strip: the one key fills base_url and api_key
  const eIn = sp(t, 16.4, PRESETS.default), eOut = sp(t, 20.6, PRESETS.default);
  tf(ed.el, `translateY(${(1 - eIn) * 420 + eOut * 460}px)`);
  op(ed.el, t > 16.25 && t < 21.0 ? 1 : 0);
  paintSwap(t);
  op(ed.diff, smooth((t - 18.7) / 0.3));
  op(ed.same, smooth((t - 19.0) / 0.3));
  ed.run.style.transform = `scale(${pressScale(t, [18.4])})`;
  ed.run.classList.toggle('go', t > 18.4);

  placeCursor(cursor, t, [[0, 1500, 980], [2.6, 620, 300], [6.2, 1560, 720], [9.6, 1500, 380], [13.0, 1560, 700], [17.0, 1200, 900]], [6.2], win(t, 1.6, 20.4, 0.3, 0.3));

  op(end.el, smooth((t - T_END - 0.2) / 0.35));
  end.render(Math.max(0, t - T_END - 0.2));
}

function paintSwap(t) {
  const { swapLine, keyLine } = R;
  const old = $(swapLine, '.old'), nw = $(swapLine, '.new');
  const tSel = 16.9, tTyp = 17.3;
  old.classList.toggle('sel', t > tSel && t < tTyp);
  old.style.display = t < tTyp ? '' : 'none';
  nw.textContent = t > tTyp ? typed(BASE_URL, t, tTyp, 42) : '';
  swapLine.classList.toggle('chg', t > tTyp);
  $(swapLine, '.gut').style.transform = `scaleY(${smooth((t - tTyp) / 0.2)})`;
  // api_key line gets the one key
  const o2 = $(keyLine, '.old'), n2 = $(keyLine, '.new');
  if (o2 && n2) {
    const tTyp2 = 17.9;
    o2.style.display = t < tTyp2 ? '' : 'none';
    n2.textContent = t > tTyp2 ? typed('os.environ["SUPERBOT_API_KEY"]', t, tTyp2, 34) : '';
    keyLine.classList.toggle('chg', t > tTyp2);
    $(keyLine, '.gut').style.transform = `scaleY(${smooth((t - tTyp2) / 0.2)})`;
  }
}

boot({ DUR, mount, render });