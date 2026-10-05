// V3 trace (91e2fa71): an IDE with the superbot extension. A command palette links four plans and
// their key parts fly into OPENAI_API_KEY in .env -> the Traces panel shows each request's span
// waterfall routing to Opus 5.5 / Gemini 3.1 Pro / DeepSeek V4.1 -> in .agent/config.json the
// baseURL host is backspaced and retyped -> the same agent task traced on both endpoints as two
// waterfalls with live timers; the axis zooms out when superbot finishes 7x sooner -> the line.
import {
  clamp, lerp, smooth, outCubic, sp, win, h, $, $$, op, tf, typed, scramble, track, mulberry32,
  PRESETS, PLANS, PLAN, KEY_PRE, REQS, ROUTE_MODELS, tile, makeMark, camera, makeCaption, boot,
} from './kit.js';
import { STEPS, OLD_TOTAL, SB_TOTAL, RATIO, OLD_COST, RACE, raceClock, speedX, fmt, stepStates, makeX7End, OLD_HOST, SB_HOST } from './x7.js';

const DUR = 30;
const T = {
  pal: 0.25, palTy: 0.35, chk: [1.5, 2.0, 2.5, 3.0], enter: 3.4, fly: [3.8, 4.25, 4.7, 5.15], hover: 5.8, hoverOut: 6.75,
  panel: 6.6, req: [7.1, 9.1, 11.1], swap: 13.2, del: 14.1, ins: 14.65, saved: 15.4, panelBig: 16.6, race: 17.5, end: 27.0,
}; // 120 BPM: checks, key parts and requests on the half-beat grid
const SB_DONE = T.race + RACE.A, OLD_DONE = T.race + RACE.END;
const EDX = 444, EDY = 80; // editor wrapper origin, world
const ROWY = (i) => 84 + i * 64; // sidebar plan rows (sidebar-relative)
const OLD_H = 'api.openai.com', NEW_H = 'beta.superbot.gg';
const AXW = 1130; // race axis width
const LAT = [1.84, 1.21, 0.62]; // illustrative per-request wall time in the trace view (s)
const S = {};

const ENV = [
  '<span class="cm3"># .env</span>',
  '<span class="kv">DATABASE_URL</span><span class="pu">=</span><span class="sv">postgres://localhost/billing</span>',
  `<span class="kv">OPENAI_API_KEY</span><span class="pu">=</span><span class="sv">${KEY_PRE}</span>${PLANS.map((p) => `<span class="segk sv">····<i style="background:${p.color}"></i></span>`).join('')}`,
  '<span class="kv">LOG_LEVEL</span><span class="pu">=</span><span class="sv">info</span>',
];
const CFG = [
  '<span class="pu">{</span>',
  '  <span class="kv">"agent"</span><span class="pu">:</span> <span class="sv">"billing-agent"</span><span class="pu">,</span>',
  '  <span class="kv">"llm"</span><span class="pu">: {</span>',
  '    <span class="kv">"provider"</span><span class="pu">:</span> <span class="sv">"openai"</span><span class="pu">,</span>',
  '    <span class="kv">"baseURL"</span><span class="pu">:</span> <span class="sv">"https://<span class="host"></span>/v1"</span><span class="pu">,</span>',
  '    <span class="kv">"apiKey"</span><span class="pu">:</span> <span class="sv">"env:OPENAI_API_KEY"</span>',
  '  <span class="pu">},</span>',
  '  <span class="kv">"maxSteps"</span><span class="pu">:</span> <span class="sv">60</span>',
  '<span class="pu">}</span>',
];

async function mount(stage) {
  S.marks = [];
  const mk = (n) => { const m = makeMark(n); S.marks.push(m); return m.el; };
  S.L = h('<div class="layer"></div>');
  S.w = h('<div class="iw"></div>');
  S.L.appendChild(S.w);
  stage.appendChild(S.L);

  S.ide = h(`<div class="ide">
    <div class="tb3"><div class="dots"><i></i><i></i><i></i></div><div class="tt">billing-agent</div></div>
    <div class="act"><i></i><i></i><i></i><span class="on2"></span></div>
    <div class="sbar"><div class="sh">SUPERBOT</div><div class="sec">Plans</div>
      <div class="skey"><div class="sec" style="padding:0">Key</div><div class="keychip2"><i></i><span class="kt">no key yet</span></div></div>
      <div class="srt"><div class="sec" style="padding:0 12px 6px">Router · this session</div>${ROUTE_MODELS.map((id) => `<div class="rr">${tile(id)}${PLAN[id].short}<span class="cn">0</span></div>`).join('')}</div></div>
    <div class="edw"><div class="etabs"><div class="etab"><span>.env</span></div><div class="etab"><span>config.json</span><span class="dt3"></span></div></div>
      <div class="code"><div class="cv cv0"></div><div class="cv cv1"></div></div><div class="pnl"></div></div>
    <div class="stb"><span>⎇ main</span><span class="sbx"><i></i><span class="sbt">superbot · 0 plans</span></span><span class="rt2">UTF-8</span></div>
  </div>`);
  S.w.appendChild(S.ide);
  $(S.ide, '.on2').appendChild(mk(34));
  S.sbar = $(S.ide, '.sbar');
  S.prows = PLANS.map((p, i) => {
    const el = h(`<div class="prow" style="top:${ROWY(i)}px">${tile(p.id)}<div><b>${p.plan}</b><span>${p.short}</span></div><span class="ps"><em class="no2">not linked</em><em class="ys"><i class="chk" style="width:14px;height:14px"></i>linked</em></span></div>`);
    S.sbar.appendChild(el);
    return { el, no: $(el, '.no2'), ys: $(el, '.ys'), tl: $(el, '.tile') };
  });
  S.kt = $(S.ide, '.kt');
  S.cn = $$(S.ide, '.srt .cn');
  S.tabs = $$(S.ide, '.etab');
  S.dt3 = $(S.ide, '.dt3');
  S.sbt = $(S.ide, '.sbt');
  S.rt2 = $(S.ide, '.rt2');
  S.edw = $(S.ide, '.edw');
  const cv = (sel, lines) => $(S.ide, sel).append(...lines.map((l, i) => h(`<div class="cl3" style="top:${24 + i * 42}px"><span class="n3">${i + 1}</span><span class="g3"></span><span class="t3">${l}</span></div>`)));
  cv('.cv0', ENV);
  cv('.cv1', CFG);
  S.cv = [$(S.ide, '.cv0'), $(S.ide, '.cv1')];
  $$(S.ide, '.cv').forEach((el) => { el.style.cssText = 'position:absolute;inset:0'; });
  S.segs = $$(S.cv[0], '.segk').map((el) => ({ el, u: $(el, 'i'), tx: el.firstChild }));
  S.host = $(S.cv[1], '.host');
  S.cfgLine = $$(S.cv[1], '.cl3')[4];
  S.cfgT3 = $(S.cfgLine, '.t3');
  S.cfgG3 = $(S.cfgLine, '.g3');
  S.car = h('<div class="car"></div>');
  S.ghost = h(`<div class="ghost">${OLD_H}</div>`);
  S.okc = h('<div style="position:absolute;top:2px;height:38px;padding:0 14px;border-radius:10px;background:#0f2a1b;border:1px solid rgba(35,165,89,.5);color:#3ccf7b;font-family:var(--ui);font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px;white-space:nowrap"><i class="chk" style="width:16px;height:16px"></i>1 line changed</div>');
  S.cfgT3.append(S.car, S.ghost, S.okc);

  // command palette + hover card
  S.pal = h(`<div class="pal"><div class="pin"><span class="gt">&gt;</span><span class="pt"></span><span class="cr"></span></div>
    ${PLANS.map((p) => `<div class="pit"><span class="cb"><b></b></span>${tile(p.id)}${p.plan}<em>${p.vendor} · sign in</em></div>`).join('')}</div>`);
  S.pt = $(S.pal, '.pt');
  S.pits = $$(S.pal, '.pit').map((el) => ({ el, b: $(el, '.cb b'), em: $(el, 'em') }));
  S.hov = h(`<div class="hov" style="left:330px;top:205px"><div class="hh"><span class="hm2"></span>superbot key · OpenAI-compatible</div>
    <div class="hp">${PLANS.map((p) => `<span class="chip plan">${tile(p.id)}${p.plan}</span>`).join('')}</div><div class="hn">Routes every request to the best model on these plans.</div></div>`);
  $(S.hov, '.hm2').appendChild(mk(26));
  S.edw.append(S.pal, S.hov);
  S.flys = PLANS.map((p) => { const el = h(`<div class="flyk">${tile(p.id)}</div>`); S.w.appendChild(el); return el; });

  // bottom panel: traces (route) + run compare (race)
  S.pnl = $(S.ide, '.pnl');
  S.pnl.appendChild(h('<div class="ph2"><span>PROBLEMS</span><span>OUTPUT</span><span>TERMINAL</span><span class="ac">TRACES</span><span class="rc" style="margin-left:auto;color:var(--muted)"></span></div>'));
  S.rc = $(S.pnl, '.rc');
  S.route = h('<div class="rte" style="position:absolute;inset:40px 0 0 0"></div>');
  S.pnl.appendChild(S.route);
  S.tl = h('<div class="tl"></div>');
  S.route.appendChild(S.tl);
  S.trs = REQS.map((r, i) => {
    const el = h(`<div class="tr"><div class="m1"><b>200</b>POST /v1/chat/completions<span style="margin-left:auto">${LAT[i].toFixed(2)}s</span></div><div class="m2">${r.text}</div></div>`);
    S.tl.appendChild(el);
    return el;
  });
  S.wfs = REQS.map((r, i) => {
    const p = PLAN[r.plan], L = LAT[i];
    const x = (s) => (s / 2) * 956;
    const el = h(`<div class="wf"><div class="ax">${[0, 0.5, 1, 1.5, 2].map((s) => `<span style="left:${x(s)}px">${s.toFixed(1)}s</span>`).join('')}</div>
      <div class="sp" style="top:34px"><div class="bx b0" style="left:0;width:${x(L)}px;background:#3a3d47"></div><div class="lb3" style="left:12px">POST /v1/chat/completions</div></div>
      <div class="sp" style="top:76px"><div class="bx b1" style="left:0;width:${Math.max(8, x(0.041))}px;background:#6b6f7c"></div><div class="lb3" style="left:${x(0.041) + 16}px">router.classify · 41 ms</div></div>
      <div class="sp" style="top:118px"><div class="bx b2" style="left:${x(0.05)}px;width:${x(L - 0.07)}px;background:${p.color}cc"></div><div class="lb3" style="left:${x(0.05) + 12}px">${tile(r.plan)}${p.model} · ${p.plan}</div></div></div>`);
    S.route.appendChild(el);
    return { el, b: $$(el, '.bx'), lb: $$(el, '.lb3') };
  });
  S.attrs = REQS.map((r, i) => {
    const p = PLAN[r.plan];
    const el = h(`<div class="attrs"><span class="ak">route.model</span><span class="av2">${p.model}</span><span class="ak">route.plan</span><span class="av2">${p.plan}</span><span class="ak">route.reason</span><span class="av2">${r.why}</span><span class="ak">route.fit</span><span class="av2">${r.fit[ROUTE_MODELS.indexOf(r.plan)].toFixed(2)}</span></div>`);
    S.route.appendChild(el);
    return el;
  });

  // race view
  S.rv = h('<div class="rv"><div class="rax"></div></div>');
  S.pnl.appendChild(S.rv);
  S.rax = $(S.rv, '.rax');
  S.spd = h('<div class="spd3"><div class="speed"><span class="ff"><i></i><i></i></span><span class="x">10×</span> time-lapse</div></div>');
  S.spX = $(S.spd, '.x');
  S.rv.appendChild(S.spd);
  S.lanes = ['old', 'sb'].map((side, li) => {
    const sb = side === 'sb';
    const el = h(`<div class="lane3" style="top:${110 + li * 340}px"><div class="ll"><div class="nm3">${sb ? '<span class="lm"></span>' : tile('openai')}${sb ? 'superbot' : 'Old endpoint'}</div><div class="hs3">${sb ? SB_HOST : OLD_HOST}</div><div class="tm3">0:00.0</div><div class="rs3"><i class="chk"></i>PR #418 · ${sb ? '$0.00 extra' : `$${OLD_COST.toFixed(2)} API spend`}</div></div><div class="gridl"></div></div>`);
    if (sb) $(el, '.lm').appendChild(mk(30));
    S.rv.appendChild(el);
    const grid = $(el, '.gridl');
    const spans = STEPS.map((s, i) => {
      const mdl = sb ? s.model : (s.model ? 'openai' : null);
      const lbl = `${s.label}${mdl ? ` · ${sb ? s.badge : 'GPT-6.1'}` : ' · local'}`;
      const sp2 = h(`<div class="rsp" style="top:${14 + i * 46}px"><div class="bx" style="background:${mdl ? (sb ? PLAN[mdl].color + 'd0' : '#4a4d57') : '#2c2e35'}"></div>${!sb && s.retry ? '<div class="rd"></div>' : ''}<div class="lb4">${mdl ? tile(mdl) : ''}${lbl}<span class="r4"></span></div></div>`);
      grid.appendChild(sp2);
      const par = sb && i === 2 ? h(`<div class="par3">${'<i></i>'.repeat(14)}</div>`) : null;
      if (par) { par.style.top = (14 + i * 46) + 'px'; grid.appendChild(par); }
      return { el: sp2, bx: $(sp2, ".bx"), rd: $(sp2, ".rd"), lb: $(sp2, ".lb4"), r4: $(sp2, ".r4"), lw: lbl.length * 8.4 + 30, parEl: par, par: par ? $$(par, "i") : null };
    });
    const ph = h('<div class="phd"></div>');
    grid.appendChild(ph);
    const dim = h(`<div class="dim3" style="top:${14 + 6 * 46 + 8}px;left:0;color:${sb ? '#7aa2ff' : '#9a9da6'}"><div class="dl3"></div><div class="dt4">${fmt(sb ? SB_TOTAL : OLD_TOTAL)}</div></div>`);
    grid.appendChild(dim);
    return { el, sb, total: sb ? SB_TOTAL : OLD_TOTAL, tm: $(el, '.tm3'), rs: $(el, '.rs3'), spans, ph, dim, dl: $(dim, '.dl3'), dt: $(dim, '.dt4') };
  });
  S.vx = h(`<div class="vx3" style="left:900px;top:560px">${RATIO.toFixed(1)}× faster · $0.00 extra</div>`);
  S.rv.appendChild(S.vx);

  S.cap = makeCaption([
    [0.7, 3.4, 'Link the plans you already pay for.'],
    [3.8, 6.5, 'They become one key in your .env.'],
    [7.0, 13.1, 'Each request routes to the best model.'],
    [13.6, 16.5, 'Point baseURL at superbot. One line.'],
    [17.0, 23.3, 'Same agent task, traced on both endpoints.'],
  ]);
  stage.appendChild(S.cap.el);
  S.end = makeX7End();
  stage.appendChild(S.end.el);
}

let measured = false;
function measure() {
  measured = true;
  S.segPos = S.segs.map((g) => ({ x: EDX + 98 + g.el.offsetLeft + g.el.offsetWidth / 2, y: EDY + 46 + 24 + 2 * 42 + 21 }));
  S.host.textContent = OLD_H;
  S.hostL = S.host.offsetLeft;
  S.cw = S.host.offsetWidth / OLD_H.length;
}

function render(t) {
  if (!measured) measure();
  S.marks.forEach((m) => m.render(t));
  camera(S.w, t, [
    [0, 960, 540, 1.0], [0.3, 1010, 340, 1.15], [3.45, 930, 380, 1.1], [6.5, 1160, 600, 1.03],
    [13.2, 1000, 330, 1.55], [16.4, 960, 540, 1.0], [23.4, 960, 560, 1.02],
  ]);
  op(S.ide, smooth(t / 0.25));
  tf(S.ide, `translateY(${(1 - sp(t, 0, PRESETS.heavy)) * 40}px)`);
  renderPack(t);
  renderRoute(t);
  renderSwap(t);
  renderRace(t);
  S.cap.render(t);
  const ea = smooth((t - T.end) / 0.35);
  op(S.end.el, ea);
  if (ea > 0) S.end.render(t - T.end);
}

function renderPack(t) {
  const pv = win(t, T.pal, T.enter + 0.05, 0.12, 0.12);
  op(S.pal, pv);
  tf(S.pal, `translateY(${(1 - sp(t, T.pal, PRESETS.snappy)) * -14}px)`);
  S.pt.textContent = typed('Superbot: Link subscriptions', t, T.palTy, 40);
  let linked = 0;
  S.pits.forEach((p, i) => {
    const c = T.chk[i], k = sp(t, c, PRESETS.snappy);
    op(p.b, smooth((t - c) / 0.08));
    tf(p.b, `scale(${0.5 + 0.5 * k})`);
    p.el.classList.toggle('hi', t >= c - 0.35 && t < c + 0.15);
    p.em.textContent = t >= c + 0.2 ? 'signed in' : `${PLANS[i].vendor} · sign in`;
    const r = S.prows[i];
    const on = smooth((t - c - 0.2) / 0.12);
    op(r.no, 1 - on); op(r.ys, on);
    if (t >= c + 0.2) linked++;
    const fk = sp(t, T.fly[i], PRESETS.default);
    const a = S.prows[i], from = { x: 104 + 12 + 12 + 17, y: EDY + ROWY(i) + 28 }, to = S.segPos[i];
    const x = lerp(from.x, to.x, fk), y = lerp(from.y, to.y, fk) - Math.sin(Math.PI * clamp(fk)) * 70;
    tf(S.flys[i], `translate(${x - 17}px, ${y - 17}px) scale(${1 - 0.3 * clamp(fk)})`);
    op(S.flys[i], t >= T.fly[i] ? 1 - smooth((t - T.fly[i] - 0.42) / 0.1) : 0);
    a.el.style.background = win(t, T.fly[i] - 0.05, T.fly[i] + 0.4, 0.05, 0.2) > 0.01 ? `rgba(91,141,255,${(0.12 * win(t, T.fly[i] - 0.05, T.fly[i] + 0.4, 0.05, 0.2)).toFixed(3)})` : '';
    const g = S.segs[i], d = T.fly[i] + 0.42;
    g.tx.textContent = t < d ? '····' : scramble(PLANS[i].seg, t, d, 0.28, 31 + i);
    g.el.style.color = t < d ? '#4a4d58' : '';
    tf(g.u, `scaleX(${outCubic((t - d) / 0.3).toFixed(3)})`);
  });
  const keyed = t >= T.fly[3] + 0.7;
  S.sbt.textContent = keyed ? 'superbot · 1 key · 4 plans' : `superbot · ${linked} plan${linked === 1 ? '' : 's'}`;
  S.kt.textContent = keyed ? `${KEY_PRE}…pD8v` : 'no key yet';
  const hk = sp(t, T.hover, PRESETS.snappy);
  op(S.hov, win(t, T.hover, T.hoverOut, 0.12, 0.15));
  tf(S.hov, `translateY(${(1 - hk) * 10}px)`);
}

function renderRoute(t) {
  const ph = track(t, [[0, 0], [T.panel, 480], [T.swap, 0], [T.panelBig, 830]], 170, 26);
  S.pnl.style.height = ph.toFixed(1) + 'px';
  S.rc.textContent = t >= T.panelBig ? 'RUN COMPARE · billing-migration' : 'live';
  op(S.route, 1 - smooth((t - T.swap) / 0.15));
  const ri = T.req.filter((x) => t >= x).length - 1;
  S.trs.forEach((el, k) => {
    const keys = [[T.req[k], 0], ...T.req.slice(k + 1).map((x, j) => [x, (j + 1) * 74])];
    const y = track(t, keys, 170, 26);
    tf(el, `translateY(${y}px)`);
    op(el, smooth((t - T.req[k]) / 0.15));
    el.classList.toggle('sel2', k === ri);
  });
  S.wfs.forEach((w, i) => {
    const a = T.req[i];
    op(w.el, win(t, a, i < 2 ? T.req[i + 1] : 99, 0.1, 0.1));
    tf(w.b[0], `scaleX(${clamp((t - a - 0.1) / 0.8).toFixed(4)})`);
    tf(w.b[1], `scaleX(${clamp((t - a - 0.2) / 0.08).toFixed(4)})`);
    tf(w.b[2], `scaleX(${clamp((t - a - 0.4) / 0.5).toFixed(4)})`);
    op(w.lb[0], smooth((t - a - 0.1) / 0.15));
    op(w.lb[1], smooth((t - a - 0.25) / 0.15));
    op(w.lb[2], smooth((t - a - 0.45) / 0.15));
    op(S.attrs[i], win(t, a + 0.6, i < 2 ? T.req[i + 1] : 99, 0.15, 0.1));
  });
  S.cn.forEach((el, j) => {
    el.textContent = String(REQS.filter((r, i) => r.plan === ROUTE_MODELS[j] && t >= T.req[i] + 0.6).length);
  });
}

function renderSwap(t) {
  const onCfg = t >= T.swap;
  S.tabs.forEach((el, i) => el.classList.toggle('on', i === (onCfg ? 1 : 0)));
  op(S.cv[0], 1 - smooth((t - T.swap) / 0.12));
  op(S.cv[1], smooth((t - T.swap) / 0.12));
  const delN = Math.floor(clamp((t - T.del) * 28, 0, OLD_H.length));
  const txt = t < T.ins ? OLD_H.slice(0, OLD_H.length - delN) : typed(NEW_H, t, T.ins, 32);
  S.host.textContent = txt;
  S.car.style.left = (S.hostL + txt.length * S.cw) + 'px';
  const tEnd = T.ins + NEW_H.length / 32;
  op(S.car, t >= T.swap + 0.4 && t < T.saved + 0.4 ? (t > T.del - 0.3 && t < tEnd ? 1 : (Math.floor(t * 2.6) % 2 ? 1 : 0)) : 0);
  S.cfgG3.style.background = t >= T.del ? '#5b8dff' : 'transparent';
  op(S.dt3, win(t, T.del, T.saved, 0.05, 0.08));
  const gx = S.hostL + (NEW_H.length + 6) * S.cw + 22;
  S.ghost.style.left = gx + 'px';
  S.ghost.style.top = '7px';
  op(S.ghost, smooth((t - T.saved) / 0.2));
  tf(S.ghost, `translateY(${(1 - sp(t, T.saved, PRESETS.snappy)) * 8}px)`);
  S.okc.style.left = (gx + OLD_H.length * 11 + 40) + 'px';
  const ks = sp(t, T.saved + 0.15, PRESETS.snappy);
  op(S.okc, smooth((t - T.saved - 0.15) / 0.12));
  tf(S.okc, `scale(${0.7 + 0.3 * ks})`);
  S.rt2.textContent = t >= T.saved ? 'config.json · 1 line changed' : t >= T.swap ? 'config.json' : '.env';
}

function renderRace(t) {
  op(S.rv, smooth((t - T.panelBig - 0.1) / 0.2));
  if (t < T.panelBig) return;
  const lt = t - T.race, D = raceClock(lt);
  const ax = track(t, [[0, 30], [SB_DONE + 0.2, 180]], 120, 22);
  const X = (s) => (s / ax) * AXW;
  const step = ax < 70 ? 10 : 30;
  let html = '';
  for (let s = 0; s <= ax + 0.01; s += step) html += `<span style="left:${X(s).toFixed(1)}px;opacity:${clamp((ax - s) / (step * 0.4) + 0.15).toFixed(2)}">${s}s</span>`;
  S.rax.innerHTML = html;
  S.lanes.forEach((L, li) => {
    const k = sp(t, T.panelBig + 0.15 + li * 0.1, PRESETS.default);
    tf(L.el, `translateY(${(1 - k) * 24}px)`);
    op(L.el, smooth((t - T.panelBig - 0.15 - li * 0.1) / 0.2));
    const d = Math.min(D, L.total);
    L.tm.textContent = fmt(d);
    L.tm.style.color = d >= L.total && L.sb ? '#3ccf7b' : '';
    const done = L.sb ? SB_DONE : OLD_DONE;
    op(L.rs, smooth((t - done) / 0.15));
    const st = stepStates(d, L.sb ? 'sb' : 'old');
    L.spans.forEach((s2, i) => {
      const s = st[i], x0 = X(s.a), w = X(s.el);
      s2.el.style.left = x0.toFixed(1) + 'px';
      s2.bx.style.width = Math.max(0, w).toFixed(1) + 'px';
      op(s2.el, s.state === 'wait' ? 0 : 1);
      const end = x0 + w + 10;
      s2.lb.style.left = (end + s2.lw > AXW ? -s2.lw - 6 : w + 10).toFixed(1) + 'px';
      s2.lb.style.justifyContent = 'flex-start';
      const ret = STEPS[i].retry;
      if (s2.rd) {
        const a = clamp(s.el, ret[0], ret[1]);
        s2.rd.style.left = X(ret[0]).toFixed(1) + 'px';
        s2.rd.style.width = Math.max(0, X(a - ret[0])).toFixed(1) + 'px';
        op(s2.rd, s.el > ret[0] ? 1 : 0);
        s2.r4.textContent = s.state === 'run' && s.el >= ret[0] && s.el < ret[1] ? `429 · retry ${Math.ceil(ret[1] - s.el)}s` : (s.el >= ret[1] ? '429 · 20s lost' : '');
      }
      if (s2.par) s2.par.forEach((b, q) => {
        const f = 0.82 + 0.18 * mulberry32(70 + q)();
        b.style.top = (q * 2.4).toFixed(1) + 'px';
        b.style.width = Math.max(0, X(Math.min(s.el, s.len * f))).toFixed(1) + 'px';
      });
      if (s2.par) { op(s2.bx, 0); s2.parEl.style.left = x0.toFixed(1) + "px"; op(s2.parEl, s.state === "wait" ? 0 : 1); }
    });
    L.ph.style.left = X(d).toFixed(1) + 'px';
    op(L.ph, t >= T.race && d < L.total ? 1 : 0);
    const dv = smooth((t - OLD_DONE - 0.3) / 0.2);
    op(L.dim, dv);
    tf(L.dl, `scaleX(${outCubic((t - OLD_DONE - 0.3) / 0.5).toFixed(3)})`);
    L.dl.style.width = X(L.total).toFixed(1) + 'px';
    L.dt.style.left = (X(L.total) + 12).toFixed(1) + 'px';
    L.dt.style.top = '4px';
  });
  op(S.spd, win(t, T.race - 0.15, OLD_DONE + 0.3, 0.2, 0.2));
  S.spX.textContent = speedX(lt) + '×';
  const kv = sp(t, OLD_DONE + 0.55, PRESETS.snappy);
  op(S.vx, smooth((t - OLD_DONE - 0.55) / 0.15));
  tf(S.vx, `scale(${0.6 + 0.4 * kv})`);
}

boot({ DUR, mount, render });
