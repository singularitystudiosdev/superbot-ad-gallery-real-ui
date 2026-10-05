// V2 "Activity": split screen held for the whole spot. Left, the superbot Router window:
// four plan logos orbit a blank key and stamp its segments in, the key docks, a curl call
// fires, then an OpenRouter-style activity log streams real-priced traffic, every row
// billed to a plan. Right, the plan meter sits at $0.00 extra while the pay-per-token
// counter (the exact sum of the rows' list prices) climbs. Ends on the line.
import {
  W, H, clamp, lerp, seg, smooth, outCubic, sp, win, h, $, $$, op, tf, money, typed,
  PLANS, KEY_FULL, BASE_URL, listCost, tile, makeMark, camera, makePlanMeter, makeTokenMeter, makeEnd, boot,
  PRESETS, spring, mulberry32,
} from './kit.js';

const DUR = 24, T_END = 19.8;
const KC = { cx: 696, cy: 600, w: 860, h: 270 }; // key card centre (world)
const DIVE = [1.3, 1.75, 2.2, 2.65];
const IMPACT = 0.34;
const LOG_TOP = 404, LOG_BOT = 1010, ROW_H = 58, GAP = 6, EXP_H = 172;

// ---- traffic: templates per plan, tokens in/out ranges ---------------------------
const ASKS = {
  claude: [['Fix the flaky test in payments/retry.ts', 60, 140, 3, 9], ['Review PR #4127 for race conditions', 80, 160, 4, 10], ['Plan the Postgres 18 migration', 40, 90, 5, 12], ['Port the CLI from click to typer', 70, 150, 6, 12]],
  openai: [['Explain this stack trace', 6, 18, 1, 3], ['Write SQL for weekly cohort retention', 8, 20, 1, 3], ['Draft the v2.3 launch email', 4, 12, 1, 2], ['Turn these notes into a spec', 10, 30, 2, 4]],
  gemini: [['Read the 300-page spec PDF, list breaking changes', 300, 700, 3, 8], ['Summarize 6 hours of call recordings', 400, 800, 4, 8], ['Find UI bugs in this screen recording', 200, 500, 2, 5]],
  deepseek: [['Tag ticket #88214 by intent', 2, 6, 0.1, 0.4], ['Extract fields from invoice_0412.pdf', 4, 12, 0.3, 1], ['Classify review sentiment', 1, 4, 0.1, 0.3], ['Translate product strings to es-MX', 6, 14, 2, 5]],
};
const MIX = [['claude', 0.34], ['openai', 0.18], ['gemini', 0.15], ['deepseek', 0.33]];
const FEAT = [
  { t: 7.8, id: 'claude', ask: 'Refactor auth/ into typed modules and keep every test green', tin: 142000, tout: 9000, why: 'multi-file refactor · tool use · 142k context' },
  { t: 11.2, id: 'gemini', ask: 'Summarize 14 earnings-call transcripts into one table', tin: 610000, tout: 6000, why: 'long context · 610k tokens of transcripts' },
  { t: 14.6, id: 'deepseek', ask: 'Tag 5,000 support tickets by intent', tin: 2100000, tout: 160000, why: 'bulk labeling · cheapest fit that clears the bar' },
];
const rate = (t) => {
  if (t < 6.45) return 0;
  if (t < 7.6) return 1.6;
  for (const f of FEAT) if (t >= f.t - 0.2 && t < f.t + 2.2) return 0.8;
  if (t < 16.8) return 4 + (t - 7.6) * 0.5;
  return 8 + (t - 16.8) * 9;
};
function buildTraffic() {
  const rnd = mulberry32(0xc490ad04);
  const rows = [];
  let acc = 0;
  for (let t = 6.4; t < T_END + 0.6; t += 1 / 480) {
    acc += rate(t) / 480;
    if (acc >= 1) {
      acc -= 1;
      let r = rnd(), id = MIX[MIX.length - 1][0];
      for (const [k, w] of MIX) { if (r < w) { id = k; break; } r -= w; }
      const list = ASKS[id], a = list[Math.floor(rnd() * list.length)];
      const tin = Math.round((a[1] + rnd() * (a[2] - a[1])) * 1000), tout = Math.round((a[3] + rnd() * (a[4] - a[3])) * 1000);
      rows.push({ t, id, ask: a[0], tin, tout });
    }
  }
  for (const f of FEAT) rows.push({ ...f, feat: true });
  rows.sort((a, b) => a.t - b.t);
  rows.forEach((r, i) => { r.k = i; r.cost = listCost(PLANS.find((p) => p.id === r.id), r.tin, r.tout); });
  return rows;
}
const ROWS = buildTraffic();
const planOf = (id) => PLANS.find((p) => p.id === id);
const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n));
const clock = (t) => {
  const s = 9 * 3600 + 15 * 60 + 33800 * Math.pow(clamp((t - 6.4) / 13.6), 1.45);
  const p = (n) => String(Math.floor(n)).padStart(2, '0');
  return `${p(s / 3600)}:${p((s % 3600) / 60)}:${p(s % 60)}`;
};
const expandOf = (r, t) => (r.feat ? smooth((t - r.t - 0.25) / 0.45) * (1 - smooth((t - r.t - 2.45) / 0.45)) : 0);
// closed-form y of row r at t: newer rows push it down as they spring in
function rowY(r, t) {
  let y = LOG_TOP;
  for (let i = ROWS.length - 1; i > r.k; i--) {
    const n = ROWS[i];
    if (n.t > t) continue;
    y += (ROW_H + GAP + EXP_H * expandOf(n, t)) * spring(t - n.t, 260, 30);
    if (y > LOG_BOT + 200) break;
  }
  return y;
}

let R = {};
const POOL = 16;

function mount(stage) {
  stage.innerHTML = '';
  const world = h('<div class="world"></div>');
  stage.appendChild(world);
  const winEl = h(`<div class="win" style="left:40px;top:40px;width:1240px;height:1000px">
    <div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><div class="ttl"><b>superbot</b> · Router · Activity</div></div>
    <div class="rail"><span class="m"></span><i></i><i class="on"></i><i></i><i></i></div></div>`);
  world.appendChild(winEl);
  const railMark = makeMark(40);
  $(winEl, '.rail .m').appendChild(railMark.el);
  const head = h(`<div class="abs v2-head" style="left:150px;top:126px"><span class="pg-h">Activity</span><span class="chip mono">model: auto</span><span class="chip today"><i class="dot"></i>Today</span></div>`);
  world.appendChild(head);
  const dockChip = h(`<div class="abs keychip mono" style="left:880px;top:122px"><span class="stack">${PLANS.map((p) => tile(p.id, 'xs')).join('')}</span>${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)}</div>`);
  world.appendChild(dockChip);

  // key card + orbiters
  const kc = h(`<div class="abs keycard2" style="left:${KC.cx - KC.w / 2}px;top:${KC.cy - KC.h / 2}px;width:${KC.w}px;height:${KC.h}px">
    <div class="kc-top"><span class="kc-lbl">superbot key</span><span class="kc-minis">${PLANS.map((p) => `<span class="mini">${tile(p.id, 'xs')}</span>`).join('')}</span></div>
    <div class="kc-key mono"><span class="pre">sbc_</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}"><span class="ph">····</span><span class="tx">${p.seg}</span></span>`).join('')}</div>
    <div class="kc-sub">4 subscriptions · 1 key · works with any OpenAI SDK</div></div>`);
  world.appendChild(kc);
  const ripples = PLANS.map((p) => { const r = h(`<div class="abs ripple" style="border-color:${p.color}"></div>`); world.appendChild(r); return r; });
  const orbs = PLANS.map((p) => { const o = h(`<div class="abs orb">${tile(p.id)}<span class="olbl">${p.plan}</span></div>`); world.appendChild(o); return o; });

  // terminal
  const term = h(`<div class="abs term mono" style="left:150px;top:200px;width:1090px;height:170px"><div class="tl l1"></div><div class="tl l2"></div><div class="tl l3"></div><div class="tl l4"></div></div>`);
  world.appendChild(term);

  // log
  const thead = h(`<div class="abs lhead" style="left:150px;top:372px;width:1090px"><span style="width:110px">Time</span><span style="width:350px">Request</span><span style="width:220px">Model</span><span style="width:110px">Tokens</span><span style="width:130px">Cost</span><span>Billed to</span></div>`);
  world.appendChild(thead);
  const clip = h('<div class="abs logclip" style="left:112px;top:396px;width:1168px;height:644px"></div>');
  world.appendChild(clip);
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const el = h(`<div class="abs lrow" style="left:38px;width:1090px">
      <div class="lr-main"><span class="c-time mono"></span><span class="c-ask"></span><span class="c-model"><span class="tl-host"></span><span class="nm"></span></span><span class="c-tok mono"></span><span class="c-cost mono"><span class="strike"><span class="lv"></span></span><b>$0.00</b></span><span class="c-bill"><span class="chip plan"></span></span></div>
      <div class="lr-exp"><div class="path"><span class="pn req">request</span><span class="ar"></span><span class="pn rtr">router · auto</span><span class="ar"></span><span class="pn mdl"></span><span class="ar"></span><span class="pn pln"></span></div><div class="why"></div></div></div>`);
    clip.appendChild(el);
    pool.push(el);
  }

  // meters (right column)
  const pm = makePlanMeter('Billed to your subscriptions');
  const tm = makeTokenMeter('Same traffic today, pay-per-token');
  pm.el.classList.add('abs'); tm.el.classList.add('abs');
  pm.el.style.cssText += ';left:1310px;top:40px;width:570px;height:480px';
  tm.el.style.cssText += ';left:1310px;top:540px;width:570px;height:500px';
  world.append(pm.el, tm.el);

  const end = makeEnd();
  stage.appendChild(end.el);
  R = { world, winEl, railMark, head, dockChip, kc, ripples, orbs, term, thead, pool, pm, tm, end };
}

function render(t) {
  const { world, railMark, head, dockChip, kc, ripples, orbs, term, thead, pool, pm, tm, end } = R;
  railMark.render(t);

  // camera: key close-up → terminal → log + focus rows → meters
  const fy = FEAT.map((f) => rowY(ROWS.find((r) => r.feat && r.t === f.t), f.t + 1.4) + 110);
  camera(world, t, [
    [0, KC.cx, KC.cy - 10, 1.32], [3.3, KC.cx, KC.cy, 1.4], [4.45, 700, 290, 1.5], [6.35, 960, 540, 1.0],
    [7.85, 690, fy[0], 1.42], [10.0, 1150, 600, 1.06], [11.25, 690, fy[1], 1.42], [13.4, 1150, 600, 1.06],
    [14.65, 690, fy[2], 1.42], [16.75, 1595, 300, 1.3], [17.9, 1595, 790, 1.42], [18.9, 1560, 540, 1.04],
  ], { k: 55, d: 15 });
  op(world, smooth(t / 0.4) * (1 - smooth((t - T_END) / 0.4)));

  // P1: orbit + dive + stamp
  const kcIn = sp(t, 0.15, PRESETS.heavy);
  const dock = sp(t, 4.25, { k: 150, d: 24 });
  const kcX = lerp(0, 1060 - KC.cx, dock), kcY = lerp(0, 150 - KC.cy, dock), kcS = lerp(0.9 + 0.1 * kcIn, 0.36, dock);
  tf(kc, `translate(${kcX}px, ${kcY}px) scale(${kcS})`);
  op(kc, smooth(t / 0.4) * (1 - smooth((t - 4.55) / 0.15)));
  kc.classList.toggle('live', t > DIVE[3] + IMPACT);
  op(dockChip, smooth((t - 4.5) / 0.2));
  tf(dockChip, `scale(${0.9 + 0.1 * sp(t, 4.5, PRESETS.snappy)})`);
  orbs.forEach((o, i) => {
    const th = (i / 4) * Math.PI * 2 - Math.PI / 2 + t * 1.25;
    const ox = KC.cx + Math.cos(th) * 470, oy = KC.cy + Math.sin(th) * 260;
    const td = DIVE[i];
    const thD = (i / 4) * Math.PI * 2 - Math.PI / 2 + td * 1.25;
    const sx = KC.cx + Math.cos(thD) * 470, sy = KC.cy + Math.sin(thD) * 260;
    const gx = KC.cx - KC.w / 2 + 200 + i * 140, gy = KC.cy + 6;
    const u = spring(t - td, 210, 26);
    const x = t < td ? ox : lerp(sx, gx, u), y = t < td ? oy : lerp(sy, gy, u);
    const enter = sp(t, 0.2 + i * 0.1, PRESETS.playful);
    tf(o, `translate(${x - 42}px, ${y - 42}px) scale(${enter * lerp(1, 0.45, u)})`);
    op(o, smooth((t - 0.2 - i * 0.1) / 0.25) * (1 - smooth((t - td - IMPACT + 0.04) / 0.08)));
    const ri = ripples[i], rt = t - td - IMPACT;
    tf(ri, `translate(${gx - 60}px, ${gy - 60}px) scale(${0.45 + 0.9 * outCubic(rt / 0.5)})`);
    op(ri, rt > 0 ? 0.45 * (1 - smooth(rt / 0.5)) : 0);
  });
  $$(kc, '.sg').forEach((sg, i) => {
    const rt = t - DIVE[i] - IMPACT;
    const s = rt > 0 ? 1 + 0.35 * Math.exp(-rt * 9) : 1;
    op($(sg, '.ph'), rt > 0 ? 0 : 1);
    op($(sg, '.tx'), rt > 0 ? 1 : 0);
    tf($(sg, '.tx'), `scale(${s})`);
    sg.style.setProperty('--u', smooth(rt / 0.25).toFixed(3));
  });
  $$(kc, '.mini').forEach((m, i) => { const rt = t - DIVE[i] - IMPACT; op(m, smooth(rt / 0.2)); tf(m, `scale(${0.6 + 0.4 * sp(t, DIVE[i] + IMPACT, PRESETS.playful)})`); });
  op($(kc, '.kc-sub'), smooth((t - 3.15) / 0.3));

  // header + terminal
  op(head, smooth((t - 4.3) / 0.3));
  op(term, smooth((t - 4.55) / 0.25));
  const L1 = `$ curl ${BASE_URL}/chat/completions \\`;
  const L2 = `    -H "Authorization: Bearer ${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)}" \\`;
  const L3 = `    -d '{"model": "auto", "messages": [{"role": "user", "content": "Refactor auth/ …"}]}'`;
  const cps = 95, t1 = 4.7, t2 = t1 + L1.length / cps, t3 = t2 + L2.length / cps;
  $(term, '.l1').textContent = typed(L1, t, t1, cps);
  $(term, '.l2').textContent = typed(L2, t, t2, cps);
  $(term, '.l3').textContent = typed(L3, t, t3, cps);
  $(term, '.l4').innerHTML = t > 6.25 ? `<span class="ok-txt">200</span> · routed <b>anthropic/claude-opus-5.5</b> · billed to <b>Claude Max</b> · <span class="ok-txt">$0.00</span>` : '';
  op($(term, '.l4'), smooth((t - 6.25) / 0.2));
  op(thead, smooth((t - 6.2) / 0.3));

  // log rows (pool)
  let used = 0, spend = 0, reqs = 0;
  const per = { claude: 0, openai: 0, gemini: 0, deepseek: 0 };
  for (const r of ROWS) {
    if (r.t > t) break;
    const a = smooth((t - r.t) / 0.25);
    spend += r.cost * a; reqs += a; per[r.id] += a * (r.feat ? 6 : 1);
  }
  for (let i = ROWS.length - 1; i >= 0 && used < POOL; i--) {
    const r = ROWS[i];
    if (r.t > t) continue;
    const y = rowY(r, t) - LOG_TOP;
    if (y > 650) break;
    const el = pool[used++];
    const p = planOf(r.id);
    const enter = spring(t - r.t, 260, 30);
    el.style.display = '';
    tf(el, `translateY(${y + 8 - (1 - enter) * 30}px)`);
    op(el, smooth((t - r.t) / 0.18));
    const ex = expandOf(r, t);
    el.style.height = (ROW_H + EXP_H * ex) + 'px';
    el.classList.toggle('feat', !!r.feat && ex > 0.02);
    el.classList.toggle('fresh', t - r.t < 0.5);
    $(el, '.c-time').textContent = clock(r.t);
    $(el, '.c-ask').textContent = r.ask;
    $(el, '.tl-host').innerHTML = tile(p.id, 'xs');
    $(el, '.nm').textContent = p.model;
    $(el, '.c-tok').textContent = `${fmtTok(r.tin)} / ${fmtTok(r.tout)}`;
    $(el, '.lv').textContent = money(r.cost, r.cost < 0.01 ? 4 : 3);
    $(el, '.strike').style.setProperty('--k', outCubic((t - r.t - 0.15) / 0.3).toFixed(3));
    $(el, '.c-bill .chip').innerHTML = `${tile(p.id)}${p.plan}`;
    const exp = $(el, '.lr-exp');
    op(exp, ex);
    if (r.feat) {
      $(exp, '.mdl').innerHTML = `${tile(p.id, 'xs')}${p.model}`;
      $(exp, '.pln').innerHTML = `${tile(p.id, 'xs')}${p.plan} · <b class="ok-txt">$0.00</b> <span class="strike" style="--k:${outCubic((t - r.t - 1.5) / 0.3).toFixed(3)}">${money(r.cost, 3)}</span>`;
      $(exp, '.why').textContent = `why: ${r.why}`;
      $$(exp, '.pn').forEach((n, j) => { const k = smooth((t - r.t - 0.35 - j * 0.15) / 0.18); op(n, k); tf(n, `translateX(${(1 - k) * -14}px)`); });
      $$(exp, '.ar').forEach((n, j) => { n.style.transform = `scaleX(${smooth((t - r.t - 0.42 - j * 0.15) / 0.15)})`; });
      op($(exp, '.why'), smooth((t - r.t - 1.0) / 0.25));
    }
  }
  for (let i = used; i < POOL; i++) pool[i].style.display = 'none';

  // meters
  op(pm.el, smooth((t - 0.3) / 0.4)); op(tm.el, smooth((t - 0.3) / 0.4));
  pm.set(PLANS.map((p, i) => [0.12, 0.08, 0.1, 0.05][i] + per[p.id] * [0.0042, 0.006, 0.011, 0.0028][i]));
  const hist = [];
  for (let i = 0; i <= 40; i++) {
    const tt = 6.4 + (i / 40) * Math.max(0.01, t - 6.4);
    let s = 0;
    for (const r of ROWS) { if (r.t > tt) break; s += r.cost; }
    hist.push(s);
  }
  tm.set(spend, reqs, t > 6.4 ? hist : null);

  op(end.el, smooth((t - T_END) / 0.4));
  end.render(Math.max(0, t - T_END));
}

boot({ DUR, mount, render });
