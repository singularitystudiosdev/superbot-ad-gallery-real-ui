// V1 "Keyring": Settings › Subscriptions → four plans pack into one sbc_ key → the key
// drops into an OpenAI SDK snippet (base_url, api_key, model="auto") → OpenRouter-style
// router table bills each route to a plan → flat plan meter vs climbing per-token
// counter → "Open router for your subscriptions."
import {
  W, H, clamp, lerp, seg, smooth, outCubic, inOutCubic, sp, win, h, $, $$, op, tf, money, typed,
  PLANS, KEY_FULL, BASE_URL, listCost, tile, makeMark, makeCursor, placeCursor, pressScale, camera,
  makePlanMeter, makeTokenMeter, makeEnd, boot, PRESETS, track, spring,
} from './kit.js';

const DUR = 25;
const WX = 120, WY = 70, MX = WX + 280, MY = WY + 52; // window + main-area origins (world px)

// ---- the three routed requests (list prices from kit PLANS) ----------------------
const REQS = [
  { t: 9.8, ask: 'Refactor auth/ into typed modules and keep every test green', tin: 142000, tout: 9000, fit: [0.96, 0.84, 0.79, 0.52], win: 0 },
  { t: 12.9, ask: 'Summarize 14 earnings-call transcripts into one table', tin: 610000, tout: 6000, fit: [0.81, 0.78, 0.95, 0.66], win: 2 },
  { t: 16.0, ask: 'Tag 5,000 support tickets by intent', tin: 2100000, tout: 160000, fit: [0.62, 0.7, 0.74, 0.94], win: 3 },
];
REQS.forEach((r) => { r.cost = listCost(PLANS[r.win], r.tin, r.tout); });
const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1000) + 'k');
const T_METERS = 19.0, T_END = 21.8;
const BASE_SPEND = REQS.reduce((a, r) => a + r.cost, 0);
const AVG = BASE_SPEND / REQS.length;
const spendAt = (t) => BASE_SPEND + (t <= T_METERS ? 0 : 60 * (t - T_METERS) + 140 * (t - T_METERS) ** 2);

const ROW_Y = (i) => 290 + i * 122; // subscription rows (world)
const KEY = { x: 1180, y: 300, w: 560, h: 380 };
const SLOT = (i) => ({ x: KEY.x + 44 + i * 82, y: KEY.y + 262 });

const CODE = [
  ['from openai import OpenAI'],
  [''],
  ['client = OpenAI('],
  ['    base_url=', 'S:"https://openrouter.ai/api/v1"', ','],
  ['    api_key=', 'S:os.environ["OPENROUTER_API_KEY"]', ','],
  [')'],
  [''],
  ['reply = client.chat.completions.create('],
  ['    model=', 'S:"anthropic/claude-opus-5.5"', ','],
  ['    messages=[{"role": "user", "content": ask}],'],
  [')'],
];
const ED = { x: 300, y: 150, w: 1320, h: 800, lineH: 52, top: 92, left: 120 };
const lineY = (i) => ED.y + ED.top + i * ED.lineH + ED.lineH / 2;

let R = {};

function mount(stage) {
  stage.innerHTML = '';
  const world = h('<div class="world" id="cam"></div>');
  stage.appendChild(world);

  // superbot window -------------------------------------------------------------
  const winEl = h(`<div class="win" style="left:${WX}px;top:${WY}px;width:1680px;height:940px">
    <div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><div class="ttl"><b>superbot</b> · Settings</div></div>
    <div class="side">
      <div class="brand"><span class="m"></span>superbot</div>
      <div class="nav"><span class="ic round"></span>Chats</div>
      <div class="nav"><span class="ic"></span>Projects</div>
      <div class="nav n-router"><span class="ic"></span>Router</div>
      <div class="nav n-subs on"><span class="ic round"></span>Subscriptions</div>
      <div class="nav"><span class="ic"></span>API keys</div>
      <div class="nav"><span class="ic round"></span>Usage</div>
    </div>
  </div>`);
  world.appendChild(winEl);
  const sideMark = makeMark(34);
  $(winEl, '.brand .m').appendChild(sideMark.el);

  // page A: subscriptions --------------------------------------------------------
  const pageA = h(`<div class="abs pageA" style="left:0;top:0;width:1920px;height:1080px"></div>`);
  world.appendChild(pageA);
  pageA.appendChild(h(`<div class="abs" style="left:460px;top:160px"><div class="pg-h">Subscriptions</div><div class="pg-sub">Plans you already pay for. Connect once, use everywhere.</div></div>`));
  const rows = PLANS.map((p, i) => {
    const r = h(`<div class="abs subrow" style="left:460px;top:${ROW_Y(i)}px;width:640px;height:104px">
      <div class="tslot">${tile(p.id)}</div>
      <div class="nm"><b>${p.plan}</b><span>${p.vendor} · ${p.model}</span></div>
      <div class="st"><i class="dot"></i>Connected</div></div>`);
    pageA.appendChild(r);
    return r;
  });
  const btn = h(`<div class="abs btn-white" style="left:460px;top:800px">Create API key</div>`);
  pageA.appendChild(btn);
  const keyCard = h(`<div class="abs keycard" style="left:${KEY.x}px;top:${KEY.y}px;width:${KEY.w}px;height:${KEY.h}px">
      <div class="kc-empty">No API key yet</div>
      <div class="kc-body">
        <div class="kc-top"><span class="kc-lbl">superbot key</span><span class="chip kc-count"><i class="dot"></i><span class="n">0</span>&nbsp;<span class="w">subscriptions</span></span></div>
        <div class="kc-key mono"><span class="pre">sbc_</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}"></span>`).join('')}<span class="caret"></span></div>
        <div class="kc-slots">${PLANS.map(() => '<div class="slot"></div>').join('')}</div>
        <div class="kc-copy"><span class="cp">Copy</span><span class="cpd">Copied</span></div>
      </div></div>`);
  pageA.appendChild(keyCard);
  const flyers = PLANS.map((p) => { const f = h(`<div class="abs flyer">${tile(p.id)}</div>`); world.appendChild(f); return f; });

  // page C: router ---------------------------------------------------------------
  const pageC = h(`<div class="abs pageC" style="left:0;top:0;width:1920px;height:1080px"></div>`);
  world.appendChild(pageC);
  pageC.appendChild(h(`<div class="abs" style="left:460px;top:150px;display:flex;align-items:center;gap:18px"><div class="pg-h">Router</div><span class="chip mono" style="font-size:15px">model: auto</span><span class="chip mono" style="font-size:15px"><i class="dot"></i>${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)} · 4 plans</span></div>`));
  const req = h(`<div class="abs reqcard" style="left:460px;top:236px;width:1280px;height:104px">
      <div class="rq-l">Incoming request</div>
      <div class="rq-t"><span class="txt"></span><span class="caret"></span></div>
      <div class="rq-tok mono"></div>
      <div class="abs rq-pill pill"><span class="ptile"></span><span class="plbl"></span><span class="spin"></span><span class="chk"></span></div>
    </div>`);
  pageC.appendChild(req);
  pageC.appendChild(h(`<div class="abs thead" style="left:460px;top:370px;width:1280px">
      <span style="width:380px">Model</span><span style="width:110px">Context</span><span style="width:190px">List $ / 1M in · out</span><span style="width:210px">Fit</span><span>Billed to</span></div>`));
  const trows = PLANS.map((p, i) => {
    const r = h(`<div class="abs trow" style="left:460px;top:${410 + i * 106}px;width:1280px;height:94px">
      <div class="acc" style="background:${p.color}"></div>
      <div class="c-model">${tile(p.id, 'sm')}<div><b>${p.model}</b><span class="mono">${p.slug}</span></div></div>
      <div class="c-ctx">${p.ctx}</div>
      <div class="c-price mono"><span class="strike">$${p.pin} · $${p.pout}</span></div>
      <div class="c-fit"><div class="bar"><i></i></div><span class="sc mono">0.00</span></div>
      <div class="c-bill"><span class="chip plan">${tile(p.id)}${p.plan}</span><span class="inc">included</span></div>
      <div class="routed">Routed</div></div>`);
    pageC.appendChild(r);
    return r;
  });
  const svgNS = 'http://www.w3.org/2000/svg';
  const conn = document.createElementNS(svgNS, 'svg');
  conn.setAttribute('class', 'abs'); conn.setAttribute('width', W); conn.setAttribute('height', H);
  conn.style.cssText = 'left:0;top:0;overflow:visible;pointer-events:none';
  const connPath = document.createElementNS(svgNS, 'path');
  connPath.setAttribute('fill', 'none'); connPath.setAttribute('stroke-width', '3'); connPath.setAttribute('pathLength', '1');
  connPath.setAttribute('stroke-dasharray', '1 1'); connPath.setAttribute('stroke-linecap', 'round');
  conn.appendChild(connPath); pageC.appendChild(conn);
  const receipt = h(`<div class="abs receipt" style="left:460px;top:850px;width:1280px;height:96px">
      <span class="rc-l">This call</span>
      <span class="rc-list mono">list price <span class="strike"><span class="v">$0.000</span></span></span>
      <span class="rc-arrow">→</span>
      <span class="rc-bill">billed <b class="mono">$0.00</b> to <span class="chip plan rc-plan"></span></span></div>`);
  pageC.appendChild(receipt);

  // editor window (page B) ---------------------------------------------------------
  const ed = h(`<div class="abs editor" style="left:${ED.x}px;top:${ED.y}px;width:${ED.w}px;height:${ED.h}px">
      <div class="ed-bar"><div class="dots"><i></i><i></i><i></i></div><span class="tab">app.py</span><span class="tab dim">requirements.txt</span></div>
      <div class="ed-code mono"></div>
      <div class="ed-status mono"><span class="msg">3 lines changed · same SDK · same code</span><span class="run">▶ Run</span></div></div>`);
  world.appendChild(ed);
  const codeHost = $(ed, '.ed-code');
  const codeLines = CODE.map((parts, i) => {
    const ln = h(`<div class="ln"><span class="no">${i + 1}</span><span class="gut"></span><span class="src"></span></div>`);
    const src = $(ln, '.src');
    parts.forEach((p) => {
      if (p.startsWith('S:')) src.appendChild(h(`<span class="str"><span class="old">${p.slice(2).replace(/</g, '&lt;')}</span><span class="new"></span></span>`));
      else src.appendChild(h(`<span>${p.replace(/</g, '&lt;') || '&nbsp;'}</span>`));
    });
    codeHost.appendChild(ln);
    return ln;
  });
  const keyChip = h(`<div class="abs keychip mono"><span class="stack">${PLANS.map((p) => tile(p.id, 'xs')).join('')}</span>${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)}</div>`);
  world.appendChild(keyChip);

  const cursor = makeCursor();
  world.appendChild(cursor);

  // meters + end (screen layers) -------------------------------------------------------
  const dim = h('<div class="layer" style="background:#050506"></div>');
  stage.appendChild(dim);
  const meters = h('<div class="layer meters"></div>');
  const pm = makePlanMeter('Billed to your subscriptions');
  const tm = makeTokenMeter('Same calls, pay-per-token');
  pm.el.style.cssText = 'position:absolute;left:120px;top:270px;width:820px;height:620px';
  tm.el.style.cssText = 'position:absolute;left:980px;top:270px;width:820px;height:620px';
  meters.append(pm.el, tm.el);
  meters.appendChild(h(`<div class="abs m-cap" style="left:120px;top:150px;width:1680px">The same calls, all month: <b>your plans</b> vs <b>per-token billing</b></div>`));
  stage.appendChild(meters);
  const end = makeEnd();
  stage.appendChild(end.el);

  R = { world, winEl, sideMark, pageA, rows, btn, keyCard, flyers, pageC, req, trows, connPath, receipt, ed, codeLines, keyChip, cursor, dim, meters, pm, tm, end,
    navSubs: $(winEl, '.n-subs'), navRouter: $(winEl, '.n-router'), ttl: $(winEl, '.ttl') };
}

// ---- paint --------------------------------------------------------------------------
function render(t) {
  const { world, pageA, rows, btn, keyCard, flyers, pageC, req, trows, connPath, receipt, ed, codeLines, keyChip, cursor, dim, meters, pm, tm, end } = R;
  R.sideMark.render(t);

  // camera
  const cam = [
    [0, 760, 470, 1.42], [1.2, 780, 520, 1.34], [2.2, 760, 640, 1.38], [3.05, 1100, 500, 1.02], [4.0, 1460, 470, 1.62], [5.75, 1460, 490, 1.5],
    [6.25, 960, 560, 1.0], [6.75, 900, lineY(3), 1.42], [7.55, 980, lineY(4), 1.42], [8.3, 900, lineY(8), 1.42], [9.05, 960, 560, 1.04],
  ];
  REQS.forEach((r, i) => {
    const row = 410 + r.win * 106 + 47;
    cam.push([r.t - 0.15, 1100, 560, 1.0], [r.t + 1.25, 1180, row, 1.32], [r.t + 1.95, 1300, 870, 1.42]);
    if (i === REQS.length - 1) cam.push([r.t + 2.85, 1100, 580, 0.96]);
  });
  const c = camera(world, t, cam);
  // slow push across the meters scene so it never sits dead
  world.style.opacity = (1 - smooth((t - T_METERS) / 0.5)).toFixed(3);
  world.style.visibility = t > T_METERS + 0.6 ? 'hidden' : 'visible';

  // page A visibility
  const aOn = 1 - smooth((t - 6.0) / 0.35);
  op(pageA, aOn * smooth(t / 0.4));
  op(R.winEl, smooth(t / 0.4));
  const cOn = smooth((t - 9.45) / 0.4);
  op(pageC, cOn);
  const routerNav = t > 9.45;
  R.navSubs.classList.toggle('on', !routerNav);
  R.navRouter.classList.toggle('on', routerNav);
  R.ttl.innerHTML = routerNav ? '<b>superbot</b> · Router' : '<b>superbot</b> · Settings';

  // rows enter, then collapse as their tiles fly into the key
  rows.forEach((r, i) => {
    const k = sp(t, 0.25 + i * 0.12, PRESETS.default);
    const fly = 3.3 + i * 0.32;
    const gone = smooth((t - fly) / 0.3);
    tf(r, `translateY(${(1 - k) * 40}px) scale(${1 - 0.04 * gone})`);
    op(r, smooth((t - 0.25 - i * 0.12) / 0.3) * (1 - 0.82 * gone));
    $(r, '.tslot').style.opacity = t < fly ? 1 : 0;
    const f = flyers[i];
    const a = { x: 460 + 24, y: ROW_Y(i) + 24 }, b = SLOT(i);
    const u = spring(t - fly, 120, 20);
    const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - 150 * Math.sin(Math.PI * clamp(u));
    const land = t - fly - 0.42;
    const pop = land > 0 ? 1 + 0.18 * Math.exp(-land * 7) * Math.sin(land * 22) : 1;
    tf(f, `translate(${x}px, ${y}px) scale(${lerp(1, 0.92, u) * pop}) rotate(${Math.sin(Math.PI * clamp(u)) * -10}deg)`);
    op(f, (t >= fly ? 1 : 0) * aOn);
  });
  btn.style.transform = `scale(${pressScale(t, [3.0])})`;
  btn.classList.toggle('pressed', t > 3.0);

  // key card fills
  const kOn = smooth((t - 3.05) / 0.3);
  keyCard.classList.toggle('live', t > 3.05);
  op($(keyCard, '.kc-empty'), 1 - kOn);
  op($(keyCard, '.kc-body'), kOn);
  let landed = 0;
  $$(keyCard, '.sg').forEach((sg, i) => {
    const t0 = 3.3 + i * 0.32 + 0.42;
    if (t > t0) landed++;
    sg.textContent = typed(PLANS[i].seg, t, t0, 30);
    sg.style.setProperty('--u', smooth((t - t0) / 0.2).toFixed(3));
  });
  $(keyCard, '.kc-count .n').textContent = landed;
  $(keyCard, '.kc-count .w').textContent = landed === 1 ? 'subscription' : 'subscriptions';
  $(keyCard, '.caret').style.opacity = t > 3.1 && t < 5.2 && Math.floor(t * 3) % 2 === 0 ? 1 : 0;
  const copied = t > 5.55;
  $(keyCard, '.cp').style.display = copied ? 'none' : '';
  $(keyCard, '.cpd').style.display = copied ? '' : 'none';
  $(keyCard, '.kc-copy').style.transform = `scale(${pressScale(t, [5.55])})`;

  // editor slides up over the window (6.2 → 9.4)
  const eIn = sp(t, 6.05, PRESETS.default), eOut = sp(t, 9.35, PRESETS.default);
  tf(ed, `translateY(${(1 - eIn) * 900 + eOut * 980}px)`);
  op(ed, t > 5.9 && t < 10.4 ? 1 : 0);
  editCode(t);

  // key chip: lifts off the card, then flies into api_key=
  const lift = sp(t, 5.85, PRESETS.snappy), dive = sp(t, 7.3, { k: 150, d: 22 });
  const kx = lerp(lerp(KEY.x + 40, 1180, lift), ED.x + ED.left + 220, dive);
  const ky = lerp(lerp(KEY.y + 140, 90, lift), lineY(4) - 24, dive) - Math.sin(Math.PI * clamp(dive)) * 60;
  tf(keyChip, `translate(${kx}px, ${ky}px) scale(${lerp(1.15, 0.85, dive)})`);
  op(keyChip, (t > 5.85 && t < 7.85 ? 1 : 0) * (1 - smooth((t - 7.68) / 0.12)));

  // cursor
  const cur = [[0, 1500, 1000], [2.4, 640, 840], [3.8, 760, 880], [5.2, 1650, 650], [6.0, 1500, 980], [9.0, 1500, 900], [9.6, 1720, 1020]];
  placeCursor(cursor, t, cur, [3.0, 5.55, 9.25], win(t, 1.4, 9.7, 0.3, 0.3));

  // router requests
  routerPaint(t);

  // meters
  const mIn = smooth((t - T_METERS) / 0.45);
  op(dim, mIn * (1 - smooth((t - T_END - 0.2) / 0.3)));
  op(meters, mIn * (1 - smooth((t - T_END) / 0.35)));
  const mk = sp(t, T_METERS, PRESETS.default);
  const drift = seg(t, T_METERS, T_END);
  tf(meters, `translateY(${(1 - mk) * 60}px) scale(${1 + 0.035 * drift})`);
  const mu = Math.max(0, t - T_METERS);
  const use = [[0.18, 0.41], [0.09, 0.22], [0.12, 0.33], [0.07, 0.29]].map(([a, b]) => lerp(a, b, outCubic(mu / 3)));
  pm.set(use);
  const spend = spendAt(Math.min(t, T_END + 1));
  const hist = [];
  const n = 40;
  for (let i = 0; i <= n; i++) hist.push(spendAt(T_METERS + (i / n) * Math.max(0.01, Math.min(t, T_END + 1) - T_METERS)));
  tm.set(spend, spend / AVG, hist);

  // end
  op(end.el, smooth((t - T_END - 0.25) / 0.35));
  end.render(Math.max(0, t - T_END - 0.25));
}

function editCode(t) {
  const { codeLines } = R;
  // [line, tSelect, tType, newText]
  const edits = [[3, 6.75, 7.0, `"${BASE_URL}"`], [4, 7.5, 7.8, `"${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)}"`], [8, 8.25, 8.5, '"auto"']];
  for (const [li, tSel, tTyp, txt] of edits) {
    const ln = codeLines[li];
    const old = $(ln, '.old'), nw = $(ln, '.new');
    const sel = t > tSel && t < tTyp;
    old.classList.toggle('sel', sel);
    old.style.display = t < tTyp ? '' : 'none';
    nw.textContent = li === 4 ? (t > tTyp ? txt : '') : typed(txt, t, tTyp, 60);
    ln.classList.toggle('chg', t > tTyp);
    $(ln, '.gut').style.transform = `scaleY(${smooth((t - tTyp) / 0.2)})`;
    ln.classList.toggle('hot', t > tSel - 0.1 && t < tTyp + 0.7);
  }
  const st = R.ed.querySelector('.ed-status');
  op(st.querySelector('.msg'), smooth((t - 8.8) / 0.25));
  st.querySelector('.run').style.transform = `scale(${pressScale(t, [9.25])})`;
  st.querySelector('.run').classList.toggle('go', t > 9.25);
}

function routerPaint(t) {
  const { req, trows, connPath, receipt } = R;
  let cur = 0;
  REQS.forEach((r, i) => { if (t >= r.t - 0.1) cur = i; });
  const r = REQS[cur];
  const u = t - r.t;
  const p = PLANS[r.win];
  $(req, '.txt').textContent = typed(r.ask, t, r.t, 62);
  $(req, '.caret').style.opacity = u > 0 && u < 1.1 && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  $(req, '.rq-tok').textContent = u > 0.75 ? `${fmtTok(r.tin)} in · ${fmtTok(r.tout)} out` : '';
  op($(req, '.rq-tok'), smooth((u - 0.75) / 0.2));
  // switch pill: "Routing to …" spinner → check
  const pill = $(req, '.rq-pill');
  const pk = sp(t, r.t + 0.95, PRESETS.snappy);
  op(pill, smooth((u - 0.95) / 0.15) * (1 - smooth((u - 2.95) / 0.12)));
  tf(pill, `translateY(-50%) scale(${0.85 + 0.15 * pk})`);
  $(pill, '.ptile').innerHTML = tile(p.id);
  $(pill, '.plbl').innerHTML = u < 1.35 ? `Routing to <b>${p.model}</b>` : `Routed to <b>${p.model}</b>`;
  $(pill, '.spin').style.display = u < 1.35 ? '' : 'none';
  $(pill, '.spin').style.transform = `rotate(${t * 720}deg)`;
  $(pill, '.chk').style.display = u < 1.35 ? 'none' : '';

  trows.forEach((row, i) => {
    const f = r.fit[i];
    const fu = outCubic((u - 0.45 - i * 0.08) / 0.6);
    $(row, '.bar i').style.width = (f * fu * 100).toFixed(1) + '%';
    $(row, '.bar i').style.background = i === r.win && u > 1.3 ? 'var(--grad)' : '#5c5f69';
    $(row, '.sc').textContent = (f * fu).toFixed(2);
    const isWin = i === r.win;
    const wk = isWin ? sp(t, r.t + 1.3, PRESETS.snappy) : 0;
    row.classList.toggle('win', isWin && u > 1.3);
    op(row, (cur === 0 ? sp(t, 9.55 + i * 0.07) : 1) * (u > 1.3 && !isWin ? 0.42 : 1));
    tf(row, `translateX(${isWin ? wk * 6 : 0}px)`);
    op($(row, '.routed'), isWin ? smooth((u - 1.35) / 0.15) : 0);
    $(row, '.acc').style.transform = `scaleY(${isWin ? wk : 0})`;
    $(row, '.strike').style.setProperty('--k', isWin ? outCubic((u - 1.7) / 0.3).toFixed(3) : 0);
    $(row, '.c-bill .chip').classList.toggle('lit', isWin && u > 1.6);
  });
  // connector: request card → winner row
  const y1 = 340, y2 = 410 + r.win * 106 + 47;
  connPath.setAttribute('d', `M 462 ${y1 - 52} C 418 ${y1 - 30}, 418 ${y2 - 40}, 462 ${y2}`);
  connPath.setAttribute('stroke', p.color);
  connPath.setAttribute('stroke-dashoffset', (1 - outCubic((u - 1.3) / 0.35)).toFixed(3));
  connPath.style.opacity = (1 - smooth((u - 2.9) / 0.15)).toFixed(3);
  // receipt
  const rk = smooth((u - 1.55) / 0.25);
  op(receipt, smooth((t - 9.6) / 0.3));
  $(receipt, '.rc-list .v').textContent = u > 1.55 ? money(r.cost, 3) : '$0.000';
  $(receipt, '.rc-list .strike').style.setProperty('--k', outCubic((u - 1.85) / 0.3).toFixed(3));
  $(receipt, '.rc-plan').innerHTML = `${tile(p.id)}${p.plan}`;
  op($(receipt, '.rc-bill'), rk);
  tf($(receipt, '.rc-bill'), `translateX(${(1 - rk) * 20}px)`);
}

boot({ DUR, mount, render });
