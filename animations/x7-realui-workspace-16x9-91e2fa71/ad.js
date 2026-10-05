// V1 workspace (91e2fa71): the whole spot lives in one superbot window, in launch-film grammar
// (chat left, tabbed workspace right, pop-out card over a dim+blur scrim, caption box, bar chart
// before the lockup). Keys: four plans connect and fold into one sk-superbot key -> Router: three
// requests scored and sent to Opus 5.5 / Gemini 3.1 Pro / DeepSeek V4.1 -> agent.yaml: the base_url
// line retyped -> Shell: the same agent run on both endpoints with live timers, superbot done 7x
// sooner -> chart -> the line.
import {
  clamp, lerp, smooth, outCubic, inOutCubic, sp, win, h, $, $$, op, tf, typed, scramble, track, mulberry32,
  PRESETS, PLANS, PLAN, KEY_PRE, BASE_URL, REQS, ROUTE_MODELS, tile,
  makeMark, makeCursor, placeCursor, pressScale, camera, makeCaption, boot,
} from './kit.js';
import { STEPS, OLD_TOTAL, SB_TOTAL, RATIO, OLD_COST, RACE, raceClock, speedX, fmt, stepStates, makeX7End, OLD_HOST, SB_HOST } from './x7.js';

const DUR = 30;
const T = {
  m1: 0.3, conn: [1.5, 2.0, 2.5, 3.0], create: 3.5, card: 3.75, dock: [4.0, 4.5, 5.0, 5.5], count: 6.0, keyOut: 6.6,
  rt: 7.0, req: [7.5, 9.5, 11.5], ya: 13.5, sel: 14.0, type: 14.3, save: 15.2, diff: 15.45,
  sh: 16.6, cmd: 16.95, race: 17.5, chart: 23.6, end: 27.0,
}; // 120 BPM grid: beat 0.5 s; connects, docks and request launches land on beats
const SB_DONE = T.race + RACE.A, OLD_DONE = T.race + RACE.END;
const BX = 620, BY = 172; // workspace body origin, world px
const ROWY = (i) => 150 + i * 116;
const CARD = { x: 780, y: 373, w: 900, h: 440 };
const CC = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };
const SLOT = (i) => ({ x: CARD.x + 76 + i * 84, y: CARD.y + 332 });
const CHIP = { x: 222, y: 959 }; // composer key chip centre, world
const LANE_Y = [150, 360, 570];
const OLD_URL = 'https://api.openai.com/v1';
const TABS = ['Keys', 'Router', 'agent.yaml', 'Shell'];
const TAB_T = [0, T.rt, T.ya, T.sh];
const PANE_W = [[0, T.rt], [T.rt, T.ya], [T.ya, T.sh], [T.sh, 99]];
const S = {};

const YAML = [
  '<span class="c"># agent.yaml</span>',
  '<span class="k">name</span><span class="p">:</span> <span class="s">billing-agent</span>',
  '<span class="k">provider</span><span class="p">:</span> <span class="s">openai</span>',
  '<span class="k">base_url</span><span class="p">:</span> <span class="v u"></span>',
  '<span class="k">api_key</span><span class="p">:</span> <span class="s">${OPENAI_API_KEY}</span>',
  '<span class="k">tools</span><span class="p">:</span> <span class="p">[</span><span class="s">shell, editor, browser</span><span class="p">]</span>',
  '<span class="k">max_steps</span><span class="p">:</span> <span class="v">60</span>',
];
const CHK = '<i class="chk"></i>';
const MSGS = [
  { t: T.m1, u: 'Use every plan I already pay for.' },
  { t: T.keyOut + 0.35, s: `<span class="keychip"><i class="g"></i>sk-superbot-…pD8v</span> 4 plans, 1 key` },
  ...REQS.flatMap((r, i) => [
    { t: T.req[i] + 0.05, u: r.text },
    { t: T.req[i] + 1.3, s: `→ ${tile(r.plan, 'xs')} <b>${PLAN[r.plan].short}</b> on ${PLAN[r.plan].plan}` },
  ]),
  { t: T.diff + 0.15, s: '<b>agent.yaml</b> base_url → beta.superbot.gg' },
  { t: T.cmd - 0.25, u: 'Race it against the old endpoint.' },
  { t: SB_DONE + 0.1, s: `${CHK} <b>superbot</b> done in 0:24.0` },
  { t: OLD_DONE + 0.15, s: `Old endpoint: 2:48.0. <b>${RATIO.toFixed(1)}× faster.</b>` },
];

function bez(j, u) {
  const y = LANE_Y[j] + 80, P = [[635, 425], [690, 425], [690, y], [740, y]], v = 1 - u;
  const c = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return { x: c.reduce((s, k, i) => s + k * P[i][0], 0), y: c.reduce((s, k, i) => s + k * P[i][1], 0) };
}
function cardXf(t) {
  const kin = sp(t, T.card, PRESETS.default), kout = sp(t, T.keyOut, PRESETS.default);
  return {
    s: (0.9 + 0.1 * kin) * lerp(1, 0.14, kout),
    dx: lerp(0, CHIP.x - CC.x, kout),
    dy: (1 - kin) * 70 + lerp(0, CHIP.y - CC.y, kout),
    a: Math.min(smooth((t - T.card) / 0.2), 1 - smooth((t - T.keyOut - 0.24) / 0.16)),
  };
}
const onCard = (p, x) => ({ x: CC.x + x.dx + (p.x - CC.x) * x.s, y: CC.y + x.dy + (p.y - CC.y) * x.s });

async function mount(stage) {
  S.L = h('<div class="layer"></div>');
  S.w = h('<div class="wl"></div>');
  S.L.appendChild(S.w);
  S.marks = [];
  const mk = (n) => { const m = makeMark(n); S.marks.push(m); return m.el; };

  // ---- the app window
  S.app = h(`<div class="app">
    <div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><div class="ttl"><b>superbot</b> · billing-agent</div><span class="beta">beta</span></div>
    <div class="chat"><div class="chat-hd"><span class="hm"></span>billing-agent<span class="st"><i></i>online</span></div>
      <div class="msgs"><div class="msgs-in"></div></div>
      <div class="composer"><span class="kc"></span><span class="ph">Ask superbot…</span><span class="send"></span></div></div>
    <div class="ws"><div class="ws-tabs"><div class="ws-ind"></div>${TABS.map((n) => `<div class="ws-tab"><span class="ic"></span>${n}<span class="dirty"></span></div>`).join('')}</div>
      <div class="ws-body"></div></div>
  </div>`);
  S.w.appendChild(S.app);
  $(S.app, '.hm').appendChild(mk(30));
  S.tabs = $$(S.app, '.ws-tab');
  S.ind = $(S.app, '.ws-ind');
  S.dirty = $$(S.app, '.dirty');
  S.kc = h('<span class="keychip"><i class="g"></i>sk-superbot-…pD8v</span>');
  $(S.app, '.kc').appendChild(S.kc);
  S.ph = $(S.app, '.ph');
  S.msgIn = $(S.app, '.msgs-in');
  S.msgs = MSGS.map((m) => {
    const el = m.u ? h(`<div class="msg u"><div class="bub">${m.u}</div></div>`) : h(`<div class="msg s"><span class="av"></span><span class="txt">${m.s}</span></div>`);
    if (m.s) $(el, '.av').appendChild(mk(30));
    S.msgIn.appendChild(el);
    return { ...m, el };
  });
  const body = $(S.app, '.ws-body');
  S.panes = TABS.map(() => { const p = h('<div class="pane"></div>'); body.appendChild(p); return p; });

  // ---- pane 0: subscriptions
  const P0 = S.panes[0];
  S.k_hd = h('<div class="p-hd"><h2>Subscriptions</h2><p>Connect the plans you already pay for.</p></div>');
  P0.appendChild(S.k_hd);
  S.rows = PLANS.map((p, i) => {
    const el = h(`<div class="krow" style="top:${ROWY(i)}px">${tile(p.id)}<div class="nm"><b>${p.plan}</b><span>${p.vendor} · ${p.model}</span></div>
      <span class="chip plan mdl">${tile(p.id)}${p.short}</span>
      <div class="btn"><div class="b0">Connect</div><div class="b1"><i class="spinr"></i>Connecting</div><div class="b2"><i class="chk"></i>Connected</div></div></div>`);
    P0.appendChild(el);
    return { el, tl: $(el, '.tile'), btn: $(el, '.btn'), b: [$(el, '.b0'), $(el, '.b1'), $(el, '.b2')], spin: $(el, '.spinr') };
  });
  S.create = h('<div class="create">Pack into one key <span style="font-size:22px">→</span></div>');
  P0.appendChild(S.create);

  // key card + scrim + flying tiles live in world space above the window
  S.scrim = h('<div class="scrim"></div>');
  S.card = h(`<div class="kcard"><div class="shine"></div><div class="rim"></div>
    <div class="k-hd"><span class="km"></span>superbot API key</div>
    <span class="chip" style="position:absolute;right:44px;top:40px"><i class="dot"></i>OpenAI-compatible</span>
    <div class="k-lbl">One key · every plan</div>
    <div class="k-key"><span class="pre">${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg">${p.seg}<i style="background:${p.color}"></i></span>`).join('')}</div>
    ${PLANS.map((_, i) => `<div class="slot" style="left:${44 + i * 84}px"></div>`).join('')}
    <div class="k-cnt"><div class="c1"><b class="n">0 of 4 plans packed</b><span>docking subscriptions</span></div>
      <div class="c2" style="position:absolute;left:0;top:0;height:64px;display:flex;flex-direction:column;justify-content:center;white-space:nowrap"><b>4 plans · 1 key</b><span>drop-in for any OpenAI client</span></div></div>
  </div>`);
  $(S.card, '.km').appendChild(mk(40));
  S.shine = $(S.card, '.shine');
  S.segs = $$(S.card, '.sg').map((el) => ({ el, u: $(el, 'i'), txt: el.firstChild }));
  S.cnt = { c1: $(S.card, '.c1'), c2: $(S.card, '.c2'), n: $(S.card, '.n') };
  S.flys = PLANS.map((p) => { const el = h(`<div class="fly">${tile(p.id)}</div>`); return el; });
  S.env = h(`<div class="envl">OPENAI_API_KEY=${KEY_PRE}7Kq9…pD8v<span class="m">works anywhere an OpenAI key does</span></div>`);
  S.w.append(S.scrim, S.card, ...S.flys, S.env);

  // ---- pane 1: router
  const P1 = S.panes[1];
  P1.appendChild(h('<div class="p-hd"><h2>Router</h2><p><span class="mono" style="color:var(--fg-2)">model: auto</span> · one call, the best model for each request</p></div>'));
  const wires = h(`<svg class="wires" viewBox="0 0 1220 842">${[0, 1, 2].map((j) => { const y = LANE_Y[j] + 80; return `<path d="M635 425 C690 425 690 ${y} 740 ${y}"/>`; }).join('')}<path d="M390 425 L485 425"/></svg>`);
  P1.appendChild(wires);
  S.rqs = REQS.map((r) => { const el = h(`<div class="rq"><div class="lb">Request<span>model: auto</span></div><div class="tx">${r.text}</div></div>`); P1.appendChild(el); return el; });
  S.rnode = h('<div class="rnode"><div class="ring"></div><span class="rm"></span></div>');
  $(S.rnode, '.rm').appendChild(mk(96));
  S.ring = $(S.rnode, '.ring');
  P1.append(S.rnode, h('<div class="rlbl">superbot router</div>'));
  S.why = h(`<div class="why">${REQS.map((r) => `<div><em>why</em>${r.why}</div>`).join('')}</div>`);
  P1.appendChild(S.why);
  S.whys = $$(S.why, ':scope > div');
  S.lanes = ROUTE_MODELS.map((id, j) => {
    const p = PLAN[id];
    const el = h(`<div class="lane" style="top:${LANE_Y[j]}px"><div class="hl"></div><div class="top">${tile(id)}<div><b>${p.short}</b><span>via ${p.plan}</span></div></div>
      <div class="fit"><div class="bar"><i></i></div><div class="sc">0%</div></div><div class="pick">picked</div></div>`);
    P1.appendChild(el);
    return { el, hl: $(el, '.hl'), bar: $(el, '.bar i'), sc: $(el, '.sc'), pick: $(el, '.pick'), id };
  });
  S.pkt = h('<div class="pkt"></div>');
  S.pkt0 = h('<div class="pkt"></div>');
  P1.append(S.pkt0, S.pkt);

  // ---- pane 2: agent.yaml
  const P2 = S.panes[2];
  S.ed = h('<div class="ed"></div>');
  P2.appendChild(S.ed);
  S.lines = YAML.map((l, i) => {
    const el = h(`<div class="ln"><span class="no">${i + 1}</span><span class="gm"></span><span class="cd">${l}</span></div>`);
    S.ed.appendChild(el);
    return el;
  });
  S.del = h(`<div class="ln del" style="top:${110 + 3 * 46}px"><span class="no">−</span><span class="gm"></span><span class="cd"><span>base_url: ${OLD_URL}</span></span></div>`);
  S.ed.insertBefore(S.del, S.lines[3]);
  S.url = $(S.lines[3], '.u');
  S.cd3 = $(S.lines[3], '.cd');
  S.sel = h('<div class="sel"></div>');
  S.caret = h('<div class="caret"></div>');
  S.cd3.append(S.sel, S.caret);
  S.okbg = h('<div class="bgok"></div>');
  S.okgm = h('<div class="gmok"></div>');
  S.lines[3].prepend(S.okbg);
  S.lines[3].append(S.okgm);
  S.saved = h('<div class="saved"><kbd>⌘S</kbd>Saved agent.yaml</div>');
  S.chg = h('<div class="chg"><span class="n a">+1</span><span class="n d">−1</span><span class="t">1 line changed. Same agent, same key.</span></div>');
  S.ed.append(S.saved, S.chg);

  // ---- pane 3: the race
  const P3 = S.panes[3];
  const term = (side, x) => {
    const sb = side === 'sb';
    const el = h(`<div class="rterm ${side}" style="left:${x}px"><div class="glow"></div>
      <div class="t-hd">${sb ? '<span class="tm0"></span>' : tile('openai')}<b>${sb ? 'superbot' : 'Old endpoint'}</b><span class="h">${sb ? SB_HOST : OLD_HOST}</span><span class="sd">${sb ? 'routed' : 'GPT-6.1 only'}</span></div>
      <div class="cmd"></div><div class="tmr">0:00.0</div><div class="tlb">elapsed</div><div class="prog"><i></i></div>
      <div class="steps">${STEPS.map((s, i) => `<div class="st" style="top:${i * 58}px"><span class="ico"><i class="waitdot"></i><i class="spinr"></i><i class="chk"></i></span><span class="lb">${s.label}</span>${sb && i === 2 ? `<span class="par">${'<i><b></b></i>'.repeat(14)}</span>` : ''}<span class="bd"></span><span class="tm"></span></div>`).join('')}</div>
      <div class="res"><i class="chk"></i><b>PR #418 opened</b><span><em>${fmt(sb ? SB_TOTAL : OLD_TOTAL)}</em>${sb ? '$0.00 extra, on your plans' : `$${OLD_COST.toFixed(2)} API spend`}</span></div></div>`);
    if (sb) $(el, '.tm0').appendChild(mk(30));
    P3.appendChild(el);
    const rows = $$(el, '.st').map((r, i) => {
      const bd = $(r, '.bd');
      const s = STEPS[i];
      const tag = sb ? (s.model ? `<span class="mb">${tile(s.model)}${s.badge}</span>` : '<span class="mb loc">local</span>')
        : (s.model ? `<span class="mb">${tile('openai')}GPT-6.1</span>` : '<span class="mb loc">local</span>');
      bd.innerHTML = tag + (s.retry && !sb ? '<span class="mb bad">429 · retry</span>' : '');
      const [ok, bad] = $$(bd, ':scope > span');
      bd.style.width = (sb ? 180 : 150) + 'px';
      return { r, ico: $$(r, '.ico > i'), tm: $(r, '.tm'), ok, bad, par: $$(r, '.par b') };
    });
    $$(el, '.ico').forEach((x) => { x.style.cssText = 'position:relative;width:20px;height:20px;flex:none'; });
    $$(el, '.ico > i').forEach((x) => { x.style.position = 'absolute'; x.style.left = '0'; x.style.top = '0'; });
    return { el, side, glow: $(el, '.glow'), cmd: $(el, '.cmd'), tmr: $(el, '.tmr'), prog: $(el, '.prog i'), rows, res: $(el, '.res'), total: sb ? SB_TOTAL : OLD_TOTAL };
  };
  S.terms = [term('old', 30), term('sb', 625)];
  S.speed = h(`<div class="speedw"><div class="speed"><span class="ff"><i></i><i></i></span><span class="x">10×</span> time-lapse</div></div>`);
  P3.appendChild(S.speed);
  S.spX = $(S.speed, '.x');
  S.spIn = $(S.speed, '.speed');

  // cursor last in world
  S.cur = makeCursor();
  S.w.appendChild(S.cur);
  stage.appendChild(S.L);

  S.cap = makeCaption([
    [1.0, 3.45, 'Connect every plan you already pay for.'],
    [3.9, 6.5, 'superbot packs them into one API key.'],
    [7.4, 13.4, 'Each request goes to the best model for it.'],
    [13.9, 16.5, 'Swap one line in your agent’s config.'],
    [17.1, 23.45, 'Same agent, same task: old endpoint vs superbot.'],
  ]);
  stage.appendChild(S.cap.el);

  // chart pop-out (screen space)
  S.ov = h(`<div class="ov"><div class="sc2"></div><div class="chart"><h3>Same agent task, wall-clock</h3><div class="sub">${'Migrate billing to the new Stripe API and open a PR'} · 6 steps</div>
    <div class="row old" style="top:200px"><div class="who">${tile('openai')}<div><b>Old endpoint</b><span>GPT-6.1 · ${OLD_HOST}</span></div></div><div class="trk"><i style="width:520px"></i></div><div class="val"><span class="v">0:00.0</span><em>$${OLD_COST.toFixed(2)} API spend</em></div></div>
    <div class="row sb" style="top:350px"><div class="who"><span class="cm"></span><div><b>superbot</b><span>routed across your plans</span></div></div><div class="trk"><i style="width:${(520 / RATIO).toFixed(1)}px"></i></div><div class="val"><span class="v">0:00.0</span><em>$0.00 extra</em></div></div>
    <div class="big"><b>${RATIO.toFixed(1)}×</b><span>faster</span><span class="c">same agent, one base_url</span></div></div></div>`);
  $(S.ov, '.cm').appendChild(mk(56));
  S.chart = $(S.ov, '.chart');
  S.sc2 = $(S.ov, '.sc2');
  S.crow = $$(S.ov, '.row').map((el) => ({ el, bar: $(el, '.trk i'), v: $(el, '.v') }));
  S.big = $(S.ov, '.big');
  stage.appendChild(S.ov);

  S.end = makeX7End();
  stage.appendChild(S.end.el);
}

let measured = false;
function measure() {
  measured = true;
  S.tabX = S.tabs.map((el) => [el.offsetLeft, el.offsetLeft + el.offsetWidth]);
  // chat stack: real heights once fonts are in
  let y = 18;
  S.msgs.forEach((m) => { m.y = y; m.h = m.el.offsetHeight; m.el.style.top = y + 'px'; y += m.h + 14; });
  const AREA = 948 - 52 - 64 - 110;
  S.scrollKeys = [[0, 0], ...S.msgs.map((m) => [m.t, Math.max(0, m.y + m.h + 18 - AREA)])];
  S.url.textContent = OLD_URL;
  S.urlL = S.url.offsetLeft;
  S.urlW0 = S.url.offsetWidth;
  S.cw = S.urlW0 / OLD_URL.length;
}

function render(t) {
  if (!measured) measure();
  const X = cardXf(t);
  S.marks.forEach((m) => m.render(t));

  // camera
  camera(S.w, t, [
    [0, 960, 570, 0.93], [0.15, 960, 540, 1.0], [1.1, 1180, 520, 1.1], [3.7, 1230, 590, 1.16],
    [6.5, 960, 540, 1.0], [7.2, 1080, 560, 1.07], [13.5, 1080, 520, 1.12], [13.9, 1010, 450, 1.62],
    [15.35, 1040, 500, 1.3], [16.5, 1230, 610, 1.29], [23.4, 1230, 590, 1.12],
  ]);
  const ka = sp(t, 0, PRESETS.heavy);
  tf(S.app, `translateY(${(1 - ka) * 60}px)`);
  op(S.app, smooth(t / 0.3));

  // tabs + panes
  const ti = TAB_T.filter((x) => t >= x).length - 1;
  const left = track(t, TAB_T.map((x, i) => [x, S.tabX[i][0]]), 320, 30);
  const right = track(t, TAB_T.map((x, i) => [x, S.tabX[i][1]]), 140, 22);
  S.ind.style.left = left + 'px';
  S.ind.style.width = (right - left) + 'px';
  S.tabs.forEach((el, i) => el.classList.toggle('on', i === ti));
  S.dirty.forEach((el, i) => op(el, i === 2 ? win(t, T.type, T.save + 0.05, 0.05, 0.08) : 0));
  S.panes.forEach((p, i) => {
    const [a, b] = PANE_W[i];
    const v = i === 0 ? 1 - smooth((t - b) / 0.2) : Math.min(smooth((t - a - 0.05) / 0.2), 1 - smooth((t - b) / 0.2));
    op(p, v);
    tf(p, `translateY(${(1 - sp(t, a, PRESETS.default)) * (i ? 14 : 0)}px)`);
  });

  // chat
  tf(S.msgIn, `translateY(${-track(t, S.scrollKeys, 170, 26)}px)`);
  S.msgs.forEach((m) => {
    const k = sp(t, m.t, PRESETS.snappy);
    op(m.el, smooth((t - m.t) / 0.15));
    tf(m.el, `translateY(${(1 - k) * 16}px) scale(${0.97 + 0.03 * k})`);
  });
  op(S.kc, smooth((t - T.keyOut - 0.3) / 0.15));
  tf(S.kc, `scale(${0.8 + 0.2 * sp(t, T.keyOut + 0.3, PRESETS.snappy)})`);

  renderKeys(t, X);
  renderRouter(t);
  renderEditor(t);
  renderRace(t);
  renderChart(t);

  // cursor: two acts (connect + pack, then the yaml edit)
  const ck = [
    [0, 1500, 980], [1.15, 1678, 378], ...T.conn.slice(1).map((c, i) => [c - 0.32, 1678, 378 + 116 * (i + 1)]),
    [3.2, 800, 846], [3.95, 1100, 1010], [13.3, 1320, 720], [13.75, 1066, 454], [14.45, 1160, 540],
  ];
  const clicks = [...T.conn, T.create, T.sel - 0.06, T.sel + 0.08];
  placeCursor(S.cur, t, ck, clicks, Math.max(win(t, 0.8, 4.0, 0.25, 0.3), win(t, 13.45, 15.0, 0.2, 0.3)));

  S.cap.render(t);

  // end card
  const ea = smooth((t - T.end) / 0.35);
  op(S.end.el, ea);
  if (ea > 0) S.end.render(t - T.end);
}

function renderKeys(t, X) {
  const hk = sp(t, 0.15, PRESETS.default);
  op(S.k_hd, smooth((t - 0.15) / 0.2));
  tf(S.k_hd, `translateY(${(1 - hk) * 18}px)`);
  S.rows.forEach((r, i) => {
    const t0 = 0.3 + i * 0.07, k = sp(t, t0, PRESETS.default), c = T.conn[i];
    op(r.el, smooth((t - t0) / 0.2));
    tf(r.el, `translateY(${(1 - k) * 26}px)`);
    op(r.b[0], 1 - smooth((t - c) / 0.08));
    op(r.b[1], win(t, c, c + 0.32, 0.06, 0.08));
    op(r.b[2], smooth((t - c - 0.28) / 0.1));
    tf(r.spin, `rotate(${t * 720}deg)`);
    tf(r.btn, `scale(${pressScale(t, [c])})`);
    const flash = win(t, c + 0.28, c + 0.9, 0.06, 0.4);
    r.el.style.borderColor = flash > 0.01 ? `rgba(35,165,89,${(0.25 + 0.5 * flash).toFixed(3)})` : '';
    op(r.tl, t < T.dock[i] ? 1 : smooth((t - T.keyOut - 0.2) / 0.25));
  });
  const ck = sp(t, 3.1, PRESETS.snappy);
  op(S.create, smooth((t - 3.1) / 0.15));
  tf(S.create, `translateY(${(1 - ck) * 14}px) scale(${pressScale(t, [T.create])})`);

  // scrim + card
  op(S.scrim, win(t, T.card - 0.1, T.keyOut + 0.35, 0.25, 0.3));
  op(S.card, X.a);
  tf(S.card, `translate(${X.dx}px, ${X.dy}px) scale(${X.s})`);
  let n = 0;
  S.segs.forEach((g, i) => {
    const d = T.dock[i] + 0.3;
    if (t >= d + 0.3) n++;
    g.txt.textContent = t < d ? '····' : scramble(PLANS[i].seg, t, d, 0.3, 11 + i);
    g.el.style.color = t < d ? '#4a4d58' : '';
    tf(g.u, `scaleX(${outCubic((t - d) / 0.35).toFixed(3)})`);
  });
  S.cnt.n.textContent = `${n} of 4 plans packed`;
  op(S.cnt.c1, 1 - smooth((t - T.count) / 0.12));
  op(S.cnt.c2, smooth((t - T.count - 0.08) / 0.15));
  tf(S.cnt.c2, `translateY(${(1 - sp(t, T.count, PRESETS.snappy)) * 10}px)`);
  const sh = outCubic((t - T.count) / 0.8);
  tf(S.shine, `translateX(${lerp(-260, 1000, sh)}px) rotate(16deg)`);
  op(S.shine, t > T.count && sh < 1 ? 1 : 0);
  S.flys.forEach((el, i) => {
    const k = sp(t, T.dock[i], PRESETS.default);
    const from = { x: BX + 112, y: BY + ROWY(i) + 50 };
    const to = onCard(SLOT(i), X);
    const x = lerp(from.x, to.x, k), y = lerp(from.y, to.y, k) - Math.sin(Math.PI * clamp(k)) * 90;
    const s = lerp(1, X.s, clamp(k));
    tf(el, `translate(${x - 28}px, ${y - 28}px) scale(${s})`);
    op(el, t >= T.dock[i] ? X.a : 0);
  });
  op(S.env, win(t, T.count + 0.1, T.keyOut + 0.05, 0.25, 0.15));
  tf(S.env, `translateY(${(1 - sp(t, T.count + 0.1, PRESETS.default)) * 12}px)`);
}

function renderRouter(t) {
  const ri = T.req.filter((x) => t >= x).length - 1;
  S.rqs.forEach((el, i) => {
    const a = T.req[i], kin = sp(t, a, PRESETS.default), kout = smooth((t - a - 1.75) / 0.25);
    op(el, Math.min(smooth((t - a) / 0.18), 1 - kout));
    tf(el, `translate(${(1 - kin) * -50 + kout * 40}px, 0) scale(${1 - 0.06 * kout})`);
  });
  const think = ri >= 0 ? win(t, T.req[ri] + 0.5, T.req[ri] + 1.1, 0.1, 0.15) : 0;
  op(S.ring, think);
  tf(S.ring, `rotate(${t * 540}deg)`);
  S.whys.forEach((el, i) => op(el, win(t, T.req[i] + 0.55, T.req[i] + 1.95, 0.15, 0.15)));
  const u0 = ri >= 0 ? clamp((t - T.req[ri] - 0.42) / 0.3) : 0;
  op(S.pkt0, u0 > 0 && u0 < 1 ? 1 : 0);
  tf(S.pkt0, `translate(${lerp(390, 485, inOutCubic(u0))}px, 425px)`);
  S.lanes.forEach((L, j) => {
    const v = track(t, [[0, 0], ...REQS.map((r, i) => [T.req[i] + 0.35, r.fit[j]])], 170, 26);
    tf(L.bar, `scaleX(${clamp(v).toFixed(4)})`);
    L.sc.textContent = Math.round(clamp(v) * 100) + '%';
    let hl = 0, dim = 0, pick = 0;
    REQS.forEach((r, i) => {
      const w = win(t, T.req[i] + 1.05, T.req[i] + 1.95, 0.12, 0.2);
      if (r.plan === L.id) { hl = Math.max(hl, w); pick = Math.max(pick, win(t, T.req[i] + 1.3, T.req[i] + 1.95, 0.1, 0.2)); }
      else dim = Math.max(dim, w);
    });
    op(L.hl, hl);
    L.el.classList.toggle('win', hl > 0.5);
    op(L.el, Math.min(smooth((t - T.rt - 0.15 - j * 0.08) / 0.2), 1 - 0.55 * dim));
    tf(L.el, `translateX(${(1 - sp(t, T.rt + 0.15 + j * 0.08, PRESETS.default)) * 30}px) scale(${1 + 0.025 * hl})`);
    op(L.pick, pick);
    tf(L.pick, `scale(${0.7 + 0.3 * sp(t, ri >= 0 ? T.req[ri] + 1.3 : 99, PRESETS.snappy)})`);
  });
  if (ri >= 0) {
    const j = ROUTE_MODELS.indexOf(REQS[ri].plan), u = clamp((t - T.req[ri] - 0.95) / 0.4);
    const p = bez(j, inOutCubic(u));
    op(S.pkt, u > 0 && u < 1 ? 1 : 0);
    tf(S.pkt, `translate(${p.x}px, ${p.y}px)`);
  } else op(S.pkt, 0);
}

function renderEditor(t) {
  // the base_url value: old -> selected -> retyped
  const editing = t >= T.type;
  const txt = editing ? typed(BASE_URL, t, T.type, 34) : OLD_URL;
  S.url.textContent = txt;
  S.url.className = editing ? 's u' : 'v u';
  op(S.sel, t >= T.sel && t < T.type ? 1 : 0);
  S.sel.style.left = S.urlL + 'px';
  S.sel.style.width = S.urlW0 + 'px';
  S.caret.style.left = (S.urlL + txt.length * S.cw) + 'px';
  const tEnd = T.type + BASE_URL.length / 34;
  op(S.caret, t >= T.type && t < T.save + 0.2 ? (t < tEnd || Math.floor((t - tEnd) * 2.6) % 2 === 1 ? 1 : 0) : 0);
  // diff
  const kd = sp(t, T.diff, PRESETS.default);
  S.lines.forEach((el, i) => { el.style.top = (110 + i * 46 + (i >= 3 ? 46 * kd : 0)) + 'px'; });
  op(S.del, smooth((t - T.diff) / 0.2));
  tf(S.del, `scaleY(${0.4 + 0.6 * kd})`);
  op(S.okbg, smooth((t - T.diff) / 0.25));
  op(S.okgm, smooth((t - T.diff) / 0.2));
  const sv = win(t, T.save, T.save + 1.3, 0.1, 0.3);
  op(S.saved, sv);
  tf(S.saved, `translateY(${(1 - sp(t, T.save, PRESETS.snappy)) * -12}px)`);
  op(S.chg, smooth((t - T.diff - 0.2) / 0.2));
  tf(S.chg, `translateY(${(1 - sp(t, T.diff + 0.2, PRESETS.snappy)) * 14}px)`);
}

function renderRace(t) {
  const lt = t - T.race, D = raceClock(lt);
  S.terms.forEach((m) => {
    const sb = m.side === 'sb';
    const k = sp(t, T.sh + (sb ? 0.12 : 0), PRESETS.default);
    tf(m.el, `translateY(${(1 - k) * 30}px)`);
    m.cmd.innerHTML = `<span class="pr">~/agent $</span> ${typed('agent run billing-migration', t, T.cmd, 60)}`;
    const d = Math.min(D, m.total);
    m.tmr.textContent = fmt(d);
    m.tmr.style.color = d >= m.total ? (sb ? '#3ccf7b' : 'var(--fg)') : '';
    tf(m.prog, `scaleX(${(d / m.total).toFixed(4)})`);
    const st = stepStates(d, sb ? 'sb' : 'old');
    m.rows.forEach((r, i) => {
      const s = st[i];
      r.r.className = 'st ' + s.state;
      op(r.ico[0], s.state === 'wait' ? 1 : 0);
      op(r.ico[1], s.state === 'run' ? 1 : 0);
      op(r.ico[2], s.state === 'done' ? 1 : 0);
      tf(r.ico[1], `rotate(${t * 720}deg)`);
      tf(r.ico[2], `scale(${s.state === 'done' ? 0.6 + 0.4 * sp(t, T.race + raceInv(s.a + s.len), PRESETS.snappy) : 1})`);
      r.tm.textContent = s.state === 'wait' ? '' : s.el.toFixed(1) + 's';
      const ret = STEPS[i].retry;
      const retrying = !sb && ret && s.state === 'run' && s.el >= ret[0] && s.el < ret[1];
      if (r.bad) { op(r.bad, retrying ? 1 : 0); if (retrying) r.bad.textContent = `429 · retry ${Math.ceil(ret[1] - s.el)}s`; }
      op(r.ok, retrying ? 0 : s.state === 'wait' ? 0.45 : 1);
      r.par.forEach((b, q) => {
        const off = mulberry32(90 + q)() * 0.35;
        b.style.height = (clamp((s.f - off) / (1 - off - 0.05)) * 100).toFixed(1) + '%';
      });
    });
    const done = sb ? SB_DONE : OLD_DONE;
    const rk = sp(t, done, PRESETS.snappy);
    op(m.res, smooth((t - done) / 0.15));
    tf(m.res, `translateY(${(1 - rk) * 16}px) scale(${0.96 + 0.04 * rk})`);
    if (sb) op(m.glow, Math.min(smooth((t - SB_DONE) / 0.2), 1));
    else op(m.glow, 0);
  });
  op(S.speed, win(t, T.race - 0.15, OLD_DONE + 0.3, 0.2, 0.2));
  const sx = speedX(lt);
  S.spX.textContent = sx + '×';
  const sw = T.race + RACE.A + RACE.ramp * 0.5;
  tf(S.spIn, `translateX(-50%) scale(${1 + 0.1 * Math.sin(Math.PI * clamp((t - sw) / 0.25))})`);
}
// film time at which the race clock shows displayed second d
function raceInv(d) {
  let lo = 0, hi = RACE.END;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (raceClock(m) < d) lo = m; else hi = m; }
  return hi;
}

function renderChart(t) {
  const a = win(t, T.chart, T.end + 0.2, 0.25, 0.3);
  op(S.ov, a);
  if (a <= 0) return;
  const k = sp(t, T.chart, PRESETS.default);
  tf(S.chart, `translateY(${(1 - k) * 60}px) scale(${0.94 + 0.06 * k})`);
  S.crow.forEach((r, i) => {
    const t0 = T.chart + 0.35 + i * 0.25, kb = sp(t, t0, PRESETS.heavy);
    tf(r.bar, `scaleX(${kb.toFixed(4)})`);
    r.v.textContent = fmt((i ? SB_TOTAL : OLD_TOTAL) * clamp(kb / 0.995));
    op(r.el, smooth((t - T.chart - 0.15 - i * 0.12) / 0.2));
  });
  const kb = sp(t, T.chart + 1.0, PRESETS.heavy);
  op(S.big, smooth((t - T.chart - 1.0) / 0.25));
  tf(S.big, `translateY(${(1 - kb) * 30}px)`);
}

boot({ DUR, mount, render });
