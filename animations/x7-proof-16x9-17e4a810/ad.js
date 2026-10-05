// x7 PROOF (17e4a810): macro type and hard pull-backs. Four plans charge a ring around the key; the
// chat's model chip spins like a slot reel and lands on the model each request needs; the base_url
// rolls like an odometer in agent_config.py; a Gantt race ends with seven superbot runs laid end to
// end under one old run (7 x 0:24.0 = 2:48.0).
import { W, clamp, sp, h, op, tf, typed, scramble, smooth, inCubic, inOutCubic, outCubic, track, PRESETS, PLANS, PLAN, KEY_PRE, REQS, tile, makeMark, boot } from './kit.js';
import { TASK, OLD_HOST, SB_HOST, STEPS, OLD_TOTAL, SB_TOTAL, RACE, raceClock, speedX, fmt } from './x7.js';
import { makeEnv, makeHead, panel, pose, glint, bez, makeZEnd } from './zl.js';

const DUR = 30;
const L0 = 17.6;
const RQ = [7.2, 9.1, 11.0];
const TP = (i) => 2.5 + i * 0.55; // pulse i leaves its plan
const TA = (i) => TP(i) + 0.45; // ...and charges the ring
const END = 26.15;
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

const env = makeEnv();
const heads = {
  pack: makeHead(['One key. *All your plans.*'], { size: 70, y: 46 }),
  route: makeHead(['It picks the *best model* for each request.'], { size: 56, y: 44 }),
  swap: makeHead(['Your agent code *stays the same.*'], { size: 60, y: 70 }),
  race: makeHead(['One task. *Watch the clock.*'], { size: 54, y: 40 }),
};
const zend = makeZEnd({ size: 92 });
function offIn(el, root) { let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; }
const scene = () => h(`<div class="scene"></div>`);
// zoom-through about the frame center
function through(el, t, tIn, tOut, extra = '') {
  const a = sp(t, tIn, PRESETS.default), b = inCubic((t - tOut) / 0.45);
  const s = (0.84 + 0.16 * a) * (1 + 0.35 * b);
  tf(el, `translate(960px, 540px) scale(${s.toFixed(4)}) translate(-960px, -540px) ${extra}`);
  const o = clamp((t - tIn) / 0.3) * (1 - b);
  op(el, o);
  return o > 0.001;
}

// ---- 0. hook: the key prefix, typed huge -------------------------------------------------------------
const macro = h(`<div class="macro"><span class="tx"></span><span class="caret"></span></div>`);
const macroTx = macro.querySelector('.tx'), macroCaret = macro.querySelector('.caret');
function renderMacro(t) {
  if (t > 1.9) { op(macro, 0); return; }
  macroTx.textContent = typed(KEY_PRE, t, 0.15, KEY_PRE.length / 0.85);
  macroCaret.style.visibility = t < 1.05 || Math.floor(t * 4) % 2 === 0 ? 'visible' : 'hidden';
  const p = sp(t, 1.3, PRESETS.default);
  tf(macro, `translateY(${(300 * p).toFixed(1)}px) scale(${(1 - 0.71 * p).toFixed(4)})`);
  op(macro, 1 - clamp((t - 1.45) / 0.2));
}

// ---- 1. pack: four plans charge a ring around the key ------------------------------------------------
const pack = scene();
const RC = [960, 440], RR = 230;
const QUAD = { claude: 180, openai: 90, gemini: 270, deepseek: 0 }; // arc start (deg, clockwise from 3 o'clock)
const NODE = { claude: [300, 320], openai: [300, 580], gemini: [1620, 320], deepseek: [1620, 580] };
const ringPt = (deg) => [RC[0] + RR * Math.cos((deg * Math.PI) / 180), RC[1] + RR * Math.sin((deg * Math.PI) / 180)];
const LINKS = PLANS.map((p) => {
  const [nx, ny] = NODE[p.id], left = nx < 960;
  const a = [nx + (left ? 212 : -212), ny], b = ringPt(QUAD[p.id] + 45);
  return [a, [a[0] + (left ? 120 : -120), a[1]], [b[0] + (left ? -110 : 110), b[1]], b];
});
const dOf = (r) => `M ${r[0][0]} ${r[0][1]} C ${r[1][0]} ${r[1][1]}, ${r[2][0]} ${r[2][1]}, ${r[3][0]} ${r[3][1]}`;
const ring = h(`<svg class="ring" viewBox="0 0 1920 1080"><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
  <g fill="none" stroke-linecap="round">
  ${LINKS.map((r) => `<path d="${dOf(r)}" stroke="rgba(120,150,255,.20)" stroke-width="3"/>`).join('')}
  ${LINKS.map((r) => `<path class="pl" d="${dOf(r)}" pathLength="1" stroke="url(#pg)" stroke-width="5" stroke-dasharray="0.22 1.3"/>`).join('')}
  <circle cx="${RC[0]}" cy="${RC[1]}" r="${RR}" stroke="#1b2030" stroke-width="22"/>
  ${PLANS.map((p) => `<circle class="arc" cx="${RC[0]}" cy="${RC[1]}" r="${RR}" pathLength="360" stroke="${p.color}" stroke-width="22" stroke-linecap="butt" stroke-dasharray="0 360" stroke-dashoffset="${-QUAD[p.id] - 1}"/>`).join('')}
  <circle class="halo" cx="${RC[0]}" cy="${RC[1]}" r="${RR + 26}" stroke="rgba(140,170,255,.5)" stroke-width="2"/>
  </g></svg>`);
const pulses = [...ring.querySelectorAll('.pl')], arcs = [...ring.querySelectorAll('.arc')], halo = ring.querySelector('.halo');
const hero = h(`<div class="hero"></div>`); const heroMark = makeMark(150); hero.appendChild(heroMark.el);
const ringL = h(`<div class="ringl">4 PLANS · 1 KEY · OPENAI-COMPATIBLE</div>`);
const nodes = PLANS.map((p) => panel(424, 116, `<div class="node">${tile(p.id)}<div><b>${p.plan}</b><small>${p.vendor}</small></div><span class="lk chk"></span></div>`));
const nodeChk = nodes.map((n) => n.querySelector('.lk'));
const kstrip = panel(1080, 112, `<div class="kstrip"><span class="lbl">SUPERBOT KEY</span><div class="kv"><span>${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}">····</span>`).join('')}</div></div>`);
const segs = [...kstrip.querySelectorAll('.sg')];
pack.append(ring, hero, ringL, ...nodes, kstrip);

function renderPack(t) {
  if (!through(pack, t, 1.3, 6.7)) return;
  const full = sp(t, 5.3, PRESETS.playful);
  hero.style.left = `${RC[0]}px`; hero.style.top = `${RC[1]}px`;
  tf(hero, `scale(${(0.7 + 0.3 * sp(t, 1.35, PRESETS.heavy) + 0.05 * Math.sin(clamp((t - 5.3) / 0.4) * Math.PI)).toFixed(4)})`);
  heroMark.render(t);
  halo.style.opacity = (clamp((t - 5.3) / 0.15) * (1 - clamp((t - 5.5) / 0.6))).toFixed(3);
  halo.setAttribute('r', (RR + 26 + 60 * clamp((t - 5.3) / 0.8)).toFixed(1));
  ringL.style.left = `${RC[0]}px`; ringL.style.top = `${RC[1] + RR + 44}px`;
  tf(ringL, `translateY(${((1 - full) * 16).toFixed(1)}px)`); op(ringL, clamp((t - 5.3) / 0.2));
  PLANS.forEach((p, i) => {
    const [nx, ny] = NODE[p.id];
    const e = sp(t, 1.55 + i * 0.1, PRESETS.default);
    pose(nodes[i], { x: nx + (nx < 960 ? -1 : 1) * 260 * (1 - e), y: ny, ry: (nx < 960 ? 10 : -10) });
    op(nodes[i], clamp((t - 1.55 - i * 0.1) / 0.25));
    const u = clamp((t - TP(i)) / 0.45);
    pulses[i].style.strokeDashoffset = (0.22 - 1.3 * inOutCubic(u)).toFixed(3);
    pulses[i].style.opacity = u > 0 && u < 1 ? 1 : 0;
    const f = sp(t, TA(i), PRESETS.snappy);
    arcs[i].setAttribute('stroke-dasharray', `${(88 * f).toFixed(2)} 360`);
    tf(nodeChk[i], `scale(${sp(t, TA(i), PRESETS.playful).toFixed(3)})`); op(nodeChk[i], clamp((t - TA(i)) / 0.1));
    const s = segs[i];
    s.textContent = t < TA(i) ? '····' : scramble(p.seg, t, TA(i), 0.3, 41 + i);
    s.style.color = t < TA(i) ? '#3a3f4d' : p.color;
    s.style.setProperty('--u', outCubic((t - TA(i)) / 0.3).toFixed(3));
  });
  pose(kstrip, { x: 960, y: 840, s: 1 + 0.02 * Math.sin(clamp((t - 5.3) / 0.35) * Math.PI) });
  op(kstrip, clamp((t - 1.4) / 0.2));
  glint(kstrip, t, 5.5, 0.9);
}

// ---- 2. route: the chat's model chip is a slot reel -------------------------------------------------
const route = scene();
const CYCLE = ['claude', 'openai', 'gemini', 'deepseek'];
const appMark = makeMark(32);
const app = panel(1500, 790, `<div class="app"><div class="sd"><div class="brand"><span class="m"></span>superbot</div>
  <div class="it on"><i></i>Chat</div><div class="it"><i></i>Keys</div><div class="it"><i></i>Plans<span class="n">4</span></div><div class="it"><i></i>Usage</div></div>
  <div class="main"><div class="top">billing-agent<span class="r">sk-superbot-7Kq9… · ${SB_HOST}</span></div><div class="feed"><div class="conv">
  ${REQS.map((r) => {
    const strip = [...CYCLE, ...CYCLE, ...CYCLE, ...CYCLE.slice(0, CYCLE.indexOf(r.plan) + 1)];
    return `<div class="ex"><div class="u">${r.text}</div><div class="a"><span class="av"></span><div class="reel"><div class="strip">${strip.map((id) => `<div class="ro">${tile(id)}${PLAN[id].model}</div>`).join('')}</div></div>
      <span class="why">via your ${PLAN[r.plan].plan} · <b>${r.why}</b></span></div><div class="sk"><i style="width:620px"></i><i style="width:560px"></i><i style="width:380px"></i></div></div>`;
  }).join('')}</div></div></div></div>`);
app.querySelector('.brand .m').appendChild(appMark.el);
const exs = [...app.querySelectorAll('.ex')].map((ex, k) => {
  const av = makeMark(48); ex.querySelector('.av').appendChild(av.el);
  return { ex, av, u: ex.querySelector('.u'), a: ex.querySelector('.a'), reel: ex.querySelector('.reel'), strip: ex.querySelector('.strip'), why: ex.querySelector('.why'), sk: [...ex.querySelectorAll('.sk i')], F: 12 + CYCLE.indexOf(REQS[k].plan) };
});
const conv = app.querySelector('.conv');
route.append(app);

function renderRoute(t) {
  const dz = 1 + 0.17 * smooth((t - 6.9) / 2.6), py = track(t, [[0, 470], [RQ[1], 560], [RQ[2], 640]], 60, 15.5);
  if (!through(route, t, 6.8, 12.55, `translate(820px, ${py.toFixed(1)}px) scale(${dz.toFixed(4)}) translate(-820px, ${(-py).toFixed(1)}px)`)) return;
  const e = sp(t, 6.8, PRESETS.heavy);
  pose(app, { x: 960, y: 610, rx: 6 * (1 - e) + 2, z: -300 * (1 - e) });
  appMark.render(t);
  // scroll so the newest exchange sits at the bottom of the feed
  const scroll = track(t, [[0, 0], [RQ[2] - 0.05, -300]], 170, 26);
  tf(conv, `translateY(${scroll.toFixed(2)}px)`);
  exs.forEach((x, k) => {
    const R = RQ[k];
    const u = sp(t, R, PRESETS.default);
    tf(x.u, `translateY(${((1 - u) * 40).toFixed(2)}px)`); op(x.u, clamp((t - R) / 0.15));
    op(x.a, clamp((t - R - 0.4) / 0.15));
    x.av.render(t);
    const land = sp(t, R + 0.45, { k: 60, d: 11 });
    tf(x.strip, `translateY(${(-60 * x.F * land).toFixed(2)}px)`);
    x.reel.classList.toggle('won', t >= R + 1.2);
    tf(x.why, `translateX(${((1 - sp(t, R + 1.2, PRESETS.snappy)) * -14).toFixed(2)}px)`); op(x.why, clamp((t - R - 1.2) / 0.15));
    x.sk.forEach((s, q) => { tf(s, `scaleX(${sp(t, R + 1.35 + q * 0.1, PRESETS.default).toFixed(3)})`); op(s, clamp((t - R - 1.35 - q * 0.1) / 0.1)); });
  });
}

// ---- 3. swap: the URL rolls like an odometer, then the camera pulls back -----------------------------------
const swap = scene();
const OLD_URL = 'https://api.openai.com/v1', NEW_URL = 'https://beta.superbot.gg/v1';
const slots = [...NEW_URL].map((nc, j) => {
  const oc = OLD_URL[j] ?? '';
  if (oc === nc) return [nc];
  return [oc || ' ', ...[0, 1, 2].map((q) => ALNUM[(j * 13 + q * 29 + 7) % ALNUM.length]), nc];
});
const odo = `<span class="uro">"${slots.map((col, j) => `<span class="oc"><span class="col">${col.map((c) => `<span>${c}</span>`).join('')}</span></span>`).join('')}"</span>`;
const PY_LINES = [
  '<span class="k">import</span> os',
  '<span class="k">from</span> openai <span class="k">import</span> OpenAI',
  '<span class="k">from</span> agent <span class="k">import</span> Agent',
  '',
  'client = <span class="f">OpenAI</span>(',
  `    <span class="p">base_url</span>=${odo},`,
  '    <span class="p">api_key</span>=os.environ[<span class="s">"OPENAI_API_KEY"</span>],',
  ')',
  'agent = <span class="f">Agent</span>(client=client, max_steps=<span class="f">40</span>)',
];
const editor = panel(1240, 600, `<div class="ed"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="tab"><i></i>agent_config.py</span><span class="r chg">1 line changed</span></div>
  <div class="code">${PY_LINES.map((l, i) => `<div class="ln">${i === 5 ? '<span class="band"></span><span class="gut"></span>' : ''}<span class="no">${i + 1}</span><span class="cd">${l}</span></div>`).join('')}</div></div>`);
const cols = [...editor.querySelectorAll('.uro .oc')].map((c, j) => ({ c, col: c.querySelector('.col'), n: slots[j].length, grow: !OLD_URL[j] }));
cols.forEach((x) => { if (x.grow) x.c.style.width = '0em'; });
const odoEl = editor.querySelector('.uro');
const band = editor.querySelector('.band'), gut = editor.querySelector('.gut'), chg = editor.querySelector('.chg');
swap.append(editor);
let focus = null;

function renderSwap(t) {
  const vis = t > 12.5 && t < 17.3;
  if (!vis) { op(swap, 0); return; }
  pose(editor, { x: 960, y: 600 });
  if (!focus) {
    const prev = swap.style.transform; swap.style.transform = 'none';
    const st = swap.parentElement.getBoundingClientRect(), r = odoEl.getBoundingClientRect(), k = st.width / W;
    focus = [(r.left - st.left + r.width / 2) / k, (r.top - st.top + r.height / 2) / k];
    swap.style.transform = prev;
  }
  cols.forEach((x, j) => {
    const t0 = 13.35 + j * 0.035;
    const r = sp(t, t0, { k: 150, d: 16 });
    tf(x.col, `translateY(${(-50 * (x.n - 1) * r).toFixed(2)}px)`);
    if (x.grow) x.c.style.width = `${(clamp((t - t0) / 0.25) * 0.6).toFixed(3)}em`;
  });
  const s = track(t, [[0, 2.15], [14.5, 1.0]], 90, 20);
  const k = (2.15 - s) / 1.15;
  const fx = focus[0] + (960 - focus[0]) * k, fy = focus[1] + (600 - focus[1]) * k;
  const inA = clamp((t - 12.55) / 0.25), outB = inCubic((t - 16.75) / 0.45);
  tf(swap, `translate(960px, 540px) scale(${(s * (1 + 0.35 * outB)).toFixed(4)}) translate(${(-fx).toFixed(2)}px, ${(-fy).toFixed(2)}px)`);
  op(swap, inA * (1 - outB));
  op(band, clamp((t - 14.55) / 0.2)); op(gut, clamp((t - 14.55) / 0.2));
  tf(chg, `scale(${(0.6 + 0.4 * sp(t, 14.9, PRESETS.playful)).toFixed(3)})`); op(chg, clamp((t - 14.9) / 0.15));
  glint(editor, t, 15.0, 0.9);
}

// ---- 4. race: a Gantt on one shared clock, then the proof ------------------------------------------------
const race = scene();
const TW = 1300; // track width px
const segOf = (side) => {
  const out = []; let a = 0;
  STEPS.forEach((s) => {
    const len = side === 'sb' ? s.sb : s.old;
    if (side === 'old' && s.retry) { out.push([a, s.retry[0], '']); out.push([a + s.retry[0], s.retry[1] - s.retry[0], 'bad']); out.push([a + s.retry[1], len - s.retry[1], '']); }
    else out.push([a, len, side === 'sb' ? (s.model ?? 'loc') : '']);
    a += len;
  });
  return out;
};
const SEG = { old: segOf('old'), sb: segOf('sb') };
const COLOR = Object.fromEntries(PLANS.map((p) => [p.id, p.color]));
COLOR.loc = '#6b7280';
const rowHtml = (side, top) => `<div class="row ${side}" style="top:${top}px"><div class="lb"><div class="h">${side === 'sb' ? SB_HOST : OLD_HOST}</div><div class="tm">0:00.0</div></div>
  <div class="tr"><div class="bar2">${SEG[side].map(([, , c]) => `<i class="${c === 'bad' ? 'bad' : ''}" style="${side === 'sb' ? `background:${COLOR[c]}` : ''}"></i>`).join('')}</div><div class="ph"></div></div><div class="fin"><span class="chk"></span>Done</div></div>`;
const gantt = panel(1680, 600, `<div class="gt"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><b>trace</b><span class="r">${TASK}</span></div>
  <div class="axis">${Array.from({ length: 24 }, () => '<span></span>').join('')}</div><div class="grid">${Array.from({ length: 24 }, () => '<i></i>').join('')}</div>
  ${rowHtml('old', 170)}${rowHtml('sb', 300)}
  <div class="row pf" style="top:430px"><div class="lb"><div class="h">7 × superbot run</div><div class="tm won">${fmt(7 * SB_TOTAL)}</div></div><div class="tr">${Array.from({ length: 7 }, (_, c) => `<div class="cp">${c + 1}</div>`).join('')}</div></div></div>`);
const axisS = [...gantt.querySelectorAll('.axis span')], gridI = [...gantt.querySelectorAll('.grid i')];
const rowsG = ['old', 'sb'].map((side) => {
  const r = gantt.querySelector(`.row.${side}`);
  return { side, total: side === 'sb' ? SB_TOTAL : OLD_TOTAL, tm: r.querySelector('.tm'), segs: [...r.querySelectorAll('.bar2 i')], ph: r.querySelector('.ph'), fin: r.querySelector('.fin') };
});
const pf = gantt.querySelector('.row.pf'), pfLb = pf.querySelector('.lb'), copies = [...pf.querySelectorAll('.cp')];
const spd = h(`<div class="spd"><span class="speed"><span class="ff"><i></i><i></i></span>time-lapse <span class="x">10×</span></span></div>`);
const spdX = spd.querySelector('.x');
const x7p = h(`<div class="x7p"><div class="gpill"><span class="gx">${(OLD_TOTAL / SB_TOTAL).toFixed(1)}×</span> faster <small>${fmt(SB_TOTAL)} vs ${fmt(OLD_TOTAL)}</small></div></div>`);
race.append(gantt, spd, x7p);

function renderRace(t) {
  if (!through(race, t, 16.85, 25.85)) return;
  const lt = t - L0, clock = raceClock(lt);
  const tEnd = { old: L0 + RACE.END, sb: L0 + RACE.A };
  const e = sp(t, 16.85, PRESETS.heavy);
  pose(gantt, { x: 960, y: 590, rx: 8 * (1 - e) + 2, z: -400 * (1 - e) });
  const A = Math.max(30, clock * 1.1);
  const px = (sec) => (sec / A) * TW;
  const step = A <= 40 ? 5 : A <= 80 ? 10 : A <= 140 ? 20 : 30;
  axisS.forEach((s, i) => {
    const sec = i * step, on = sec <= A + 0.01;
    s.style.visibility = on ? 'visible' : 'hidden'; gridI[i].style.visibility = on ? 'visible' : 'hidden';
    if (!on) return;
    s.style.left = `${px(sec).toFixed(1)}px`; gridI[i].style.left = `${px(sec).toFixed(1)}px`;
    const txt = fmt(sec).replace(/\.0$/, '');
    if (s.textContent !== txt) s.textContent = txt;
  });
  rowsG.forEach((r) => {
    const d = Math.min(clock, r.total);
    SEG[r.side].forEach(([a, len], q) => { r.segs[q].style.width = `${px(clamp(d - a, 0, len)).toFixed(2)}px`; });
    r.ph.style.left = `${px(d).toFixed(2)}px`;
    op(r.ph, t < tEnd[r.side] ? 1 : 0);
    r.tm.textContent = fmt(d);
    r.tm.classList.toggle('won', r.side === 'sb' && t >= tEnd.sb);
    tf(r.fin, `scale(${(0.6 + 0.4 * sp(t, tEnd[r.side], PRESETS.playful)).toFixed(3)})`); op(r.fin, clamp((t - tEnd[r.side]) / 0.12));
  });
  // proof: seven superbot runs, end to end, fill exactly one old run
  op(pfLb, clamp((t - 23.3) / 0.2)); tf(pfLb, `translateX(${((1 - sp(t, 23.3, PRESETS.snappy)) * -20).toFixed(1)}px)`);
  copies.forEach((c, q) => {
    const t0 = 23.35 + q * 0.11, u = sp(t, t0, PRESETS.snappy);
    c.style.left = `${px(q * SB_TOTAL).toFixed(2)}px`; c.style.width = `${px(SB_TOTAL).toFixed(2)}px`;
    tf(c, `translateY(${((1 - u) * -130).toFixed(1)}px)`); op(c, clamp((t - t0) / 0.08));
  });
  glint(gantt, t, 24.25, 0.9);
  spdX.textContent = `${speedX(lt)}×`;
  op(spd, clamp((t - L0 + 0.25) / 0.2) * (1 - clamp((t - tEnd.old - 0.2) / 0.2)));
  const x = sp(t, 24.3, PRESETS.playful);
  x7p.style.left = '960px'; x7p.style.top = '205px';
  tf(x7p, `translate(-50%, -50%) scale(${(0.55 + 0.45 * x).toFixed(4)})`); op(x7p, clamp((t - 24.3) / 0.12));
}

boot({
  DUR,
  mount(stage) {
    stage.append(env.el, pack, route, swap, race, macro, ...Object.values(heads).map((x) => x.el), zend.el);
  },
  render(t) {
    const light = 0.22 + 0.78 * smooth((t - 1.25) / 0.5) + 0.18 * smooth((t - 26) / 1.0);
    env.render(t, { light, lift: -40 * sp(t, 26, PRESETS.heavy), hz: 720, fy: t * 70 + 380 * clamp(t - L0, 0, RACE.END), floor: 0.6 + 0.4 * smooth((t - 1.25) / 0.5) });
    renderMacro(t);
    heads.pack.render(t, 1.5, 6.45);
    heads.route.render(t, 6.9, 12.3);
    heads.swap.render(t, 14.7, 16.5);
    heads.race.render(t, 16.95, 25.6);
    renderPack(t);
    renderRoute(t);
    renderSwap(t);
    renderRace(t);
    zend.render(t, END);
  },
});
