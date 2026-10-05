// allin-shell-16x9-27df33f2: "Superbot is all your agents in one", terminal cut (32.5 s, 16:9).
// 1) .env holds four provider keys; `npx superbot link` turns each into a key part and the four
//    lines physically collapse into one SUPERBOT_API_KEY line. 2) `superbot chat`: a router tree
//    scores Opus 5.5 / Gemini / DeepSeek per request and picks one. 3) Claude Code, Codex, Gemini CLI
//    and Cursor fan out, hit their limits, stack into one deck and flip into the superbot agent,
//    whose steps run on per-model lanes, each bar labeled with its model. 4) receipt. 5) end line.
import { h, $, $$, op, tf, clamp, lerp, smooth, outCubic, inOutCubic, sp, PRESETS, tile, PLANS, PLAN, KEY_PRE, REQS, ROUTE_MODELS, listCost, COST_ALL_OPUS, COST_ROUTED, money, scramble, typed, makeMark, camera, makeCaption, makeEnd, boot, win } from './kit.js';
import { LINE, AGENTS, TASK, makeAgentWin, limAt } from './allin.js';

export const DUR = 32.5;
export const T = {
  cmd: 0.45, link: [1.35, 1.85, 2.35, 2.85], packed: 3.3, col: 3.6, colDur: 0.8,
  shrink: 7.2, chat: 7.55, req: [8.2, 10.25, 12.3],
  desk: 14.6, run0: 15.0, runGap: 0.22, stack: 17.9, flip: 18.45, sb0: 18.75, lanes: 20.2, unit: 0.72,
  rcpt: 25.4, end: 28.7,
};
const WIN = { x: 180, y: 90, w: 1560, h: 860 };
const ENV_VARS = PLANS.map((p) => p.env + '=');
const FINAL_VAR = 'SUPERBOT_API_KEY=';
const CW_PROBE = 'MMMMMMMMMM';
const BAR_CH = 22;
// lanes: step bars in timeline units (start, length) on the lane of the model they routed to
const LANES = ['claude', 'gemini', 'deepseek', 'openai'];
const BARS = [
  { text: 'Map the repo · 214 files', plan: 'gemini', s: 0, l: 1.2 },
  { text: 'Plan the Stripe migration', plan: 'claude', s: 1.0, l: 1.3 },
  { text: 'Rewrite 14 billing handlers', plan: 'claude', s: 2.3, l: 1.7 },
  { text: 'Generate 1,200 test fixtures', plan: 'deepseek', s: 2.4, l: 1.6 },
  { text: 'Review the diff', plan: 'openai', s: 4.0, l: 1.1 },
  { text: 'Write the PR summary', plan: 'deepseek', s: 4.4, l: 1.3 },
];
const SPAN = 6;
const CARDS = [[90, 130, -3], [470, 210, -1], [850, 130, 1], [1130, 220, 3]];

let S = null;

function termA() {
  return `<div class="tl c0"><span class="ps">$</span> <span class="tcmd"></span><span class="tcar"></span></div>
    ${PLANS.map((p) => `<div class="tl lk"><span class="okc">✓</span> ${p.plan.padEnd(15, ' ')}<span class="dim">linked · ${p.short}</span></div>`).join('')}
    <div class="tl pk"><span class="okc">✓</span> 4 subscriptions packed into <b>SUPERBOT_API_KEY</b></div>`;
}

function reqBlock(r) {
  const rows = ROUTE_MODELS.map((id, j) => `<div class="tl rr" data-id="${id}"><span class="dim">${j === 2 ? '└' : '├'}</span> <span class="mn">${PLAN[id].slug.split('/')[1].padEnd(24, ' ')}</span><span class="bk" style="color:${PLAN[id].color}"></span><span class="sc num"></span><span class="pick">✓ picked</span></div>`).join('');
  return `<div class="blk"><div class="tl"><span class="pr2">›</span> <span class="rq"></span></div>
    <div class="tl rh dim">router · scoring 3 models</div>${rows}
    <div class="tl res">→ <b>${PLAN[r.plan].model}</b> <span class="dim">· billed to ${PLAN[r.plan].plan} · ${r.why}</span></div></div>`;
}

function mount(stage) {
  const wA = h(`<div class="world wA"></div>`);
  const win1 = h(`<div class="tw" style="left:${WIN.x}px;top:${WIN.y}px;width:${WIN.w}px;height:${WIN.h}px">
    <div class="aw-bar"><div class="dots"><i></i><i></i><i></i></div><span class="aw-ttl"><b>~/app</b> · zsh</span></div>
    <div class="envp"><div class="etab"><span>.env</span></div>
      <div class="cwp">${CW_PROBE}</div>
      ${PLANS.map((p, i) => `<div class="el" style="top:${70 + i * 56}px;--c:${p.color}"><span class="no">${i + 1}</span><span class="vr">${ENV_VARS[i]}</span><span class="vl">${p.keyMask}</span><span class="cm"># ${p.plan}</span></div>`).join('')}
      <div class="el fin" style="top:70px"><span class="no">1</span><span class="vr">${FINAL_VAR}</span><span class="pre">${KEY_PRE}</span></div>
      ${PLANS.map((p) => `<div class="sgf" style="--c:${p.color}">${p.seg}</div>`).join('')}
    </div>
    <div class="shp"><div class="scroll"><div class="pa">${termA()}</div>
      <div class="pb"><div class="tl"><span class="ps">$</span> <span class="ccmd"></span></div>${REQS.map(reqBlock).join('')}</div></div>
      <div class="callout pop">${REQS.map((r) => `<div class="co" data-id="${r.plan}">${tile(r.plan, 'lg')}<div><small>routed to</small><b>${PLAN[r.plan].model}</b><span>via ${PLAN[r.plan].plan}</span></div></div>`).join('')}</div>
    </div>
  </div>`);
  wA.appendChild(win1);

  const wC = h(`<div class="world wC"></div>`);
  const deck = h(`<div class="deck"></div>`); wC.appendChild(deck);
  const wins = AGENTS.map((a, i) => { const w = makeAgentWin(a, 720, 430); w.el.style.left = CARDS[i][0] + 'px'; w.el.style.top = CARDS[i][1] + 'px'; deck.appendChild(w.el); return w; });
  const sb = h(`<div class="lw">
    <div class="aw-bar sba-bar"><div class="dots"><i></i><i></i><i></i></div><span class="sba-mk"></span><span class="aw-ttl"><b>superbot</b> agent · ~/app</span><span class="sba-auto">model: auto</span></div>
    <div class="lw-task"><span class="pr2">›</span> <span class="tp"></span></div>
    <div class="lw-sub dim">6 steps · each one routed to the model that fits it</div>
    <div class="lanes">${LANES.map((id) => `<div class="lane" data-id="${id}"><div class="ll">${tile(id, 'sm')}<div><b>${PLAN[id].short}</b><small>via ${PLAN[id].plan}</small></div></div><div class="lt"></div></div>`).join('')}
      ${BARS.map((b) => `<div class="lb" style="--c:${PLAN[b.plan].color}"><i></i><b>${b.text}</b><small>→ ${PLAN[b.plan].model}</small></div>`).join('')}
      <div class="ph"></div></div>
    <div class="lw-ft"><span class="okd2"></span><span class="ftx"></span></div>
  </div>`);
  const sbMark = makeMark(30); $(sb, '.sba-mk').appendChild(sbMark.el);
  wC.appendChild(sb);

  const rc = h(`<div class="rcpt"><div class="tw rw">
    <div class="aw-bar"><div class="dots"><i></i><i></i><i></i></div><span class="aw-ttl"><b>superbot usage</b> · last 3 requests</span></div>
    <div class="rb"><div class="rrw hd"><span>request</span><span>routed to</span><span>cost</span></div>
      ${REQS.map((r) => `<div class="rrw"><span>${r.text.length > 34 ? r.text.slice(0, 33) + '…' : r.text}</span><span>${tile(r.plan, 'xs')}${PLAN[r.plan].short}</span><span class="num">${money(listCost(PLAN[r.plan], r.tin, r.tout))}</span></div>`).join('')}
      <div class="rrw tot"><span>Routed total</span><span></span><span class="num rt1">$0.00</span></div>
      <div class="rrw alt"><span>Same 3 requests, all on Opus 5.5</span><span></span><span class="num">${money(COST_ALL_OPUS)}</span></div>
      <div class="rx"><b class="num">${(COST_ALL_OPUS / COST_ROUTED).toFixed(1)}×</b> cheaper than sending everything to Opus 5.5</div></div></div></div>`);
  const end = makeEnd(LINE);
  const sceneA = h(`<div class="scene"></div>`); sceneA.appendChild(wA);
  const sceneC = h(`<div class="scene sc3d"></div>`); sceneC.appendChild(wC);
  const cap = makeCaption([
    [0.3, 3.45, 'Four subscriptions. Four API keys.'],
    [3.65, 7.1, 'Superbot packs them into one.'],
    [7.6, 10.2, 'One key in. Superbot picks the model per request.'],
    [10.4, 14.35, 'Opus 5.5 for hard code. Gemini for long context. DeepSeek for bulk.'],
    [14.9, 17.75, 'Claude Code, Codex, Gemini CLI, Cursor. Each one hits a wall.'],
    [18.7, 21.6, 'Superbot runs them as one agent.'],
    [21.8, 25.2, 'Every step is labeled with the model it routed to.'],
  ]);
  stage.append(sceneA, sceneC, rc, end.el, cap.el);
  S = { wA, win1, wC, deck, wins, sb, sbMark, rc, end, cap, sceneA, sceneC, geo: null };
}

function geometry() {
  const e = $(S.win1, '.envp');
  const cw = $(e, '.cwp').offsetWidth / CW_PROBE.length;
  const x0 = $(e, '.el .vr').offsetLeft;
  // a segment's start x on its own line, and in the final key line
  const from = PLANS.map((p, i) => ({ x: x0 + ENV_VARS[i].length * cw, y: 70 + i * 56 }));
  const to = PLANS.map((p, i) => ({ x: x0 + (FINAL_VAR.length + KEY_PRE.length + i * 4) * cw, y: 70 }));
  return { cw, from, to, lineY: WIN.y + 46 + 70 + 26, keyX: WIN.x + x0 + (FINAL_VAR.length + KEY_PRE.length + 8) * cw };
}

function renderA(t) {
  const g = S.geo, w = S.win1, e = $(w, '.envp');
  camera(S.wA, t, [[0, 960, 520, 1.0], [T.col - 0.1, 960, 520, 1.0], [T.col + T.colDur + 0.2, g.keyX - 120, g.lineY + 60, 1.5], [T.shrink - 0.1, g.keyX - 90, g.lineY + 60, 1.56],
    [T.shrink + 0.5, 960, 560, 1.0], [T.req[0] + 0.6, 900, 600, 1.08], [T.desk, 920, 600, 1.1]]);
  // shell A: link command + four linked lines
  $(w, '.tcmd').textContent = typed('npx superbot link', t, T.cmd, 26);
  $(w, '.tcar').style.opacity = t > T.link[0] - 0.2 ? '0' : (Math.floor(t * 2.4) % 2 ? '0.2' : '1');
  $$(w, '.pa .lk').forEach((l, i) => { op(l, smooth((t - T.link[i]) / 0.1)); tf(l, `translateX(${(1 - sp(t, T.link[i], PRESETS.snappy)) * -14}px)`); });
  op($(w, '.pa .pk'), smooth((t - T.packed) / 0.15));
  // env lines: each value turns into its key part, then the four lines collapse into one
  const u = inOutCubic((t - T.col) / T.colDur);
  $$(e, '.el:not(.fin)').forEach((l, i) => {
    const vl = $(l, '.vl'), lk = T.link[i] + 0.05;
    op(vl, 1 - smooth((t - lk) / 0.12));
    l.classList.toggle('lit', t >= lk);
    l.style.setProperty('--hl', (t >= lk ? Math.exp(-(t - lk) * 2.5) : 0).toFixed(3));
    op($(l, '.vr'), 1 - smooth((t - T.col) / 0.35));
    op($(l, '.cm'), 1 - smooth((t - T.col) / 0.25));
    op($(l, '.no'), i === 0 ? 1 : 1 - smooth((t - T.col) / 0.25));
    op(l, 1);
    tf(l, `translateY(${(-i * 56) * u}px)`);
  });
  const fin = $(e, '.fin');
  op(fin, smooth((t - T.col - T.colDur * 0.55) / 0.3));
  $(fin, '.vr').classList.toggle('in', t > T.col + T.colDur);
  $$(e, '.sgf').forEach((s, i) => {
    const lk = T.link[i] + 0.05, f = g.from[i], to = g.to[i];
    const k = sp(t, T.col + i * 0.04, PRESETS.snappy), uu = clamp(k, 0, 1.06);
    const x = lerp(f.x, to.x, uu), y = lerp(f.y, to.y, uu);
    tf(s, `translate(${x}px, ${y}px)`);
    op(s, smooth((t - lk) / 0.1));
    s.textContent = scramble(PLANS[i].seg, t, lk, 0.3, 3 + i);
    s.style.setProperty('--u', outCubic((t - T.col - T.colDur) / 0.45).toFixed(3));
  });
  const done = t >= T.col + T.colDur;
  e.style.setProperty('--glow', (done ? Math.exp(-(t - T.col - T.colDur) * 1.4) : 0).toFixed(3));
  // after packing, the env pane shrinks to its single line; the shell takes the window
  const ks = inOutCubic((t - T.shrink) / 0.6);
  e.style.height = lerp(330, 150, ks) + 'px';
  const shp = $(w, '.shp'); shp.style.top = lerp(46 + 330, 46 + 150, ks) + 'px';
  const pa = $(w, '.pa'), pb = $(w, '.pb');
  op(pa, 1 - smooth((t - T.shrink) / 0.3));
  op(pb, smooth((t - T.shrink - 0.2) / 0.3));
  $(w, '.ccmd').textContent = typed('superbot chat', t, T.chat, 30);
  // three request blocks; the newest scrolls into view
  const blks = $$(w, '.blk');
  let scroll = 0;
  REQS.forEach((r, i) => {
    const tq = T.req[i], b = blks[i];
    op(b, smooth((t - tq) / 0.1));
    $(b, '.rq').textContent = typed(r.text, t, tq, r.text.length / 0.55);
    op($(b, '.rh'), smooth((t - tq - 0.65) / 0.12));
    $$(b, '.rr').forEach((row, j) => {
      const kb = sp(t, tq + 0.75 + j * 0.06, PRESETS.default), v = clamp(r.fit[j] * clamp(kb, 0, 1.05));
      op(row, smooth((t - tq - 0.7 - j * 0.06) / 0.1));
      $(row, '.bk').textContent = '█'.repeat(Math.round(v * BAR_CH)).padEnd(BAR_CH, ' ');
      $(row, '.sc').textContent = v.toFixed(2);
      const won = ROUTE_MODELS[j] === r.plan && t >= tq + 1.3;
      row.classList.toggle('won', won);
      op($(row, '.pick'), won ? smooth((t - tq - 1.3) / 0.1) : 0);
    });
    op($(b, '.res'), smooth((t - tq - 1.42) / 0.14));
    if (i > 0) scroll += 280 * inOutCubic((t - tq + 0.15) / 0.45);
  });
  tf($(w, '.pb'), `translateY(${-scroll}px)`);
  // pop-out callout: the model that just won
  const co = $(w, '.callout');
  let ci = -1; REQS.forEach((r, i) => { if (t >= T.req[i] + 1.3) ci = i; });
  const k0 = sp(t, T.req[0] + 1.3, PRESETS.snappy);
  op(co, smooth((t - T.req[0] - 1.3) / 0.15));
  tf(co, `translateY(${(1 - k0) * 24}px) scale(${0.92 + 0.08 * k0})`);
  $$(co, '.co').forEach((c, i) => {
    const a = i === ci ? smooth((t - T.req[i] - 1.3) / 0.15) : 0;
    op(c, a); tf(c, `translateY(${(1 - a) * 12}px)`);
  });
}

function renderC(t) {
  const { wins, deck, sb, sbMark } = S;
  camera(S.wC, t, [[T.desk, 760, 420, 1.12], [T.run0 + 0.9, 760, 430, 1.12], [T.stack - 0.3, 1180, 440, 1.12], [T.stack + 0.3, 960, 470, 0.98], [T.sb0 + 0.6, 960, 520, 1.0], [T.lanes + 0.6, 960, 540, 1.04], [T.rcpt, 960, 540, 1.06]]);
  const su = inOutCubic((t - T.stack) / 0.55);
  wins.forEach((w, i) => {
    const kin = sp(t, T.desk + i * 0.16, PRESETS.snappy);
    const [x, y, r] = CARDS[i], tx = 600 - x + i * 14, ty = 300 - y + i * 12;
    tf(w.el, `translate(${(1 - kin) * 260 + tx * su}px, ${(1 - kin) * 120 + ty * su}px) rotate(${r * (1 - su)}deg)`);
    op(w.el, smooth((t - T.desk - i * 0.16) / 0.18));
    const run0 = T.run0 + i * T.runGap;
    w.render(t - run0);
    const la = run0 + limAt(AGENTS[i]);
    w.el.style.setProperty('--hit', (t >= la ? Math.exp(-(t - la) * 3) : 0).toFixed(3));
  });
  // the stacked deck flips edge-on and the superbot agent flips in from the other side
  const f1 = inOutCubic((t - T.flip) / 0.3);
  tf(deck, `perspective(1800px) rotateY(${90 * f1}deg) scale(${1 + 0.45 * f1})`);
  op(deck, t < T.flip + 0.3 ? 1 : 0);
  const f2 = sp(t, T.sb0, PRESETS.snappy);
  tf(sb, `perspective(1800px) rotateY(${-90 * (1 - clamp(f2, 0, 1.1))}deg) scale(${0.72 + 0.28 * clamp(f2, 0, 1.02)})`);
  op(sb, t >= T.sb0 ? 1 : 0);
  sbMark.render(t);
  const lt = t - T.sb0;
  $(sb, '.tp').textContent = typed(TASK, lt, 0.35, 40);
  op($(sb, '.lw-sub'), smooth((lt - 1.4) / 0.2));
  // lanes: playhead sweeps; each bar grows from its start and lights its lane when it begins
  const lanes = $(sb, '.lanes'), now = (t - T.lanes) / T.unit;
  const lw = 1240, px = lw / SPAN;
  $$(lanes, '.lane').forEach((ln) => {
    const id = ln.dataset.id, active = BARS.some((b) => b.plan === id && now >= b.s && now < b.s + b.l);
    ln.classList.toggle('on', active);
  });
  $$(lanes, '.lb').forEach((el, i) => {
    const b = BARS[i], y = LANES.indexOf(b.plan) * 112 + 14, x = 300 + b.s * px;
    const grow = clamp((now - b.s) / b.l), kk = sp(t, T.lanes + b.s * T.unit, PRESETS.snappy);
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = b.l * px - 10 + 'px';
    op(el, smooth((now - b.s) / 0.12));
    tf(el, `scaleY(${0.6 + 0.4 * clamp(kk, 0, 1.05)})`);
    $(el, 'i').style.width = (grow * 100).toFixed(2) + '%';
    el.classList.toggle('ok', grow >= 1);
  });
  const ph = $(lanes, '.ph');
  op(ph, smooth((now + 0.2) / 0.2) * (1 - smooth((now - SPAN) / 0.3)));
  tf(ph, `translateX(${300 + clamp(now, 0, SPAN) * px}px)`);
  const fin = now >= SPAN - 0.1;
  $(sb, '.ftx').textContent = fin ? 'PR #482 opened · 6 steps · 4 models · 1 key' : (now > 0 ? `running step ${Math.min(6, BARS.filter((b) => now >= b.s).length)} of 6` : 'planning');
  sb.classList.toggle('fin', fin);
}

function renderR(t) {
  const lt = t - T.rcpt, rc = S.rc;
  const k = sp(lt, 0, PRESETS.heavy);
  tf($(rc, '.rw'), `translateY(${(1 - k) * 40}px) scale(${0.96 + 0.04 * k})`);
  $$(rc, '.rrw').forEach((r, i) => { op(r, smooth((lt - 0.2 - i * 0.14) / 0.15)); tf(r, `translateX(${(1 - sp(lt, 0.2 + i * 0.14, PRESETS.snappy)) * -16}px)`); });
  $(rc, '.rt1').textContent = money(COST_ROUTED * outCubic((lt - 0.75) / 0.6));
  const kx = sp(lt, 1.4, PRESETS.playful);
  op($(rc, '.rx'), smooth((lt - 1.4) / 0.15)); tf($(rc, '.rx'), `scale(${0.85 + 0.15 * kx})`);
}

function render(t) {
  if (!S.geo) S.geo = geometry();
  const aA = 1 - smooth((t - T.desk + 0.2) / 0.35);
  const aC = win(t, T.desk - 0.15, T.rcpt + 0.05, 0.3, 0.3);
  op(S.sceneA, aA); op(S.sceneC, aC);
  tf(S.sceneA, `scale(${1 - 0.05 * smooth((t - T.desk + 0.2) / 0.35)})`);
  if (aA > 0) renderA(t);
  if (aC > 0) renderC(t);
  const aR = win(t, T.rcpt - 0.1, T.end + 0.1, 0.3, 0.3);
  op(S.rc, aR); if (aR > 0) renderR(t);
  const aE = smooth((t - T.end) / 0.3);
  op(S.end.el, aE); if (aE > 0) S.end.render(t - T.end);
  S.cap.render(t);
}

if (typeof document !== 'undefined') boot({ DUR, mount, render });
