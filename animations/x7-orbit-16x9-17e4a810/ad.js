// x7 ORBIT (17e4a810): your four plans orbit the key and spiral into it; a beam routes each request
// to a 3D fan of models; one line changes in agent.config.ts; two facing panels race on one shared
// clock (0:24.0 vs 2:48.0, 7.0x); the exact line closes under the arc of light.
import { clamp, sp, h, op, tf, typed, scramble, smooth, inCubic, outCubic, track, PRESETS, PLANS, PLAN, KEY_PRE, REQS, ROUTE_MODELS, tile, makeMark, makeCursor, placeCursor, boot } from './kit.js';
import { TASK, OLD_HOST, SB_HOST, STEPS, OLD_TOTAL, SB_TOTAL, RACE, raceClock, speedX, fmt, stepStates } from './x7.js';
import { makeEnv, makeHead, panel, pose, glint, makeZEnd } from './zl.js';

const DUR = 30;
const CX = 960, CY = 560;
const L0 = 17.6; // race start: superbot done at L0 + 2.4, old done at L0 + 5.48
const RQ = [7.25, 9.15, 11.05];
const TC = (i) => 3.45 + i * 0.5; // plan i starts its dive into the key
const TA = (i) => TC(i) + 0.42; // ...and lands
const END = 26.15;

const env = makeEnv();
const heads = {
  hook: makeHead(['You already pay for', '*four AI plans.*'], { size: 104, y: 330 }),
  pack: makeHead(['Pack them into *one key.*'], { size: 70, y: 70 }),
  route: makeHead(['Each request goes to the *best model.*'], { size: 62, y: 64 }),
  swap: makeHead(['Swap *one line.*'], { size: 70, y: 80 }),
  race: makeHead(['Same agent. *Same task.*'], { size: 56, y: 58 }),
};
const zend = makeZEnd();

// zoom-through: a scene arrives from depth and leaves past the camera
function through(el, t, tIn, tOut) {
  const a = sp(t, tIn, PRESETS.default), b = inCubic((t - tOut) / 0.45);
  tf(el, `scale(${((0.82 + 0.18 * a) * (1 + 0.35 * b)).toFixed(4)})`);
  const o = clamp((t - tIn) / 0.3) * (1 - b);
  op(el, o);
  return o > 0.001;
}
const scene = () => { const el = h(`<div class="scene"></div>`); el.style.transformOrigin = `${CX}px ${CY}px`; return el; };
const keysOf = (pairs) => [[0, 0], ...pairs.sort((a, b) => a[0] - b[0])];

// ---- 1. pack: four plans orbit the key, then dive in -------------------------------------
const pack = scene();
const keyMark = makeMark(30);
const key = panel(1100, 214, `<div class="kc"><div class="kl"><span class="m"></span>SUPERBOT KEY</div>
  <div class="kv"><span>${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}">····</span>`).join('')}</div>
  <div class="meta"><span class="tiles">${PLANS.map((p) => tile(p.id, 'xs')).join('')}</span><span style="margin-left:8px">4 plans packed</span><span class="sep"></span><span>OpenAI-compatible</span></div></div>`);
key.querySelector('.kl .m').appendChild(keyMark.el);
const segs = [...key.querySelectorAll('.sg')];
const meta = key.querySelector('.meta');
const cards = PLANS.map((p) => panel(340, 108, `<div class="pc">${tile(p.id)}<div><b>${p.plan}</b><small>${p.vendor}</small></div><i class="on"></i></div>`, 'plan'));
pack.append(...cards, key);

function renderPack(t) {
  if (!through(pack, t, 1.45, 6.75)) return;
  const k = sp(t, 2.05, PRESETS.heavy);
  let bump = 0;
  PLANS.forEach((p, i) => { const d = t - TA(i); if (d > 0 && d < 0.4) bump = Math.max(bump, Math.sin((d / 0.4) * Math.PI)); });
  pose(key, { x: CX, y: CY, z: -520 * (1 - k), rx: 6 * (1 - k), s: 1 + 0.03 * bump });
  op(key, clamp((t - 2.05) / 0.3));
  key.style.zIndex = 20;
  keyMark.render(t);
  glint(key, t, 5.75, 1.0);
  segs.forEach((s, i) => {
    const p = PLANS[i], ta = TA(i);
    s.textContent = t < ta ? '····' : scramble(p.seg, t, ta, 0.3, 11 + i);
    s.style.color = t < ta ? '#3a3f4d' : p.color;
    s.style.setProperty('--u', outCubic((t - ta) / 0.3).toFixed(3));
  });
  const m = sp(t, 5.5, PRESETS.snappy);
  tf(meta, `translateY(${((1 - m) * 16).toFixed(2)}px)`); op(meta, clamp((t - 5.5) / 0.2));
  cards.forEach((c, i) => {
    const t0 = 1.5 + i * 0.09;
    const e = sp(t, t0, PRESETS.default);
    const col = sp(t, TC(i), { k: 90, d: 19 });
    const r = 1 - col;
    const a = (i * Math.PI) / 2 + 0.85 * (t - 1.2) + 0.6;
    const x = CX + 760 * r * Math.cos(a), y = CY + 30 + 215 * r * Math.sin(a);
    const z = 320 * r * Math.sin(a) - 900 * (1 - e);
    pose(c, { x, y, z, s: 0.2 + 0.8 * (1 - inCubic(col)), ry: -16 * r * Math.cos(a) });
    c.style.zIndex = col > 0.25 ? 30 : Math.sin(a) > 0 ? 25 : 10;
    op(c, clamp((t - t0) / 0.3) * (1 - smooth((col - 0.8) / 0.17)));
  });
}

// ---- 2. route: a beam carries each request through the key to the best model ----------------
const route = scene();
const comp = panel(660, 440, `<div class="cm"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><b>Agent</b><span>· chat</span></div>
  <div class="body">${REQS.map((r) => `<div class="bub">${r.text}<div class="rt">${tile(r.plan, 'xs')}routed to ${PLAN[r.plan].short} · via ${PLAN[r.plan].plan}</div></div>`).join('')}</div>
  <div class="inp"><span class="tx"></span><span class="kchip">sk-superbot-7Kq9…</span><span class="send"></span></div></div>`);
const bubs = [...comp.querySelectorAll('.bub')], rts = bubs.map((b) => b.querySelector('.rt'));
const inTx = comp.querySelector('.inp .tx'), sendBtn = comp.querySelector('.send');
const hub = h(`<div class="hub"><div class="ring"></div></div>`);
const hubMark = makeMark(104);
hub.appendChild(hubMark.el);
const hubRing = hub.querySelector('.ring');
const hubL = h(`<div class="hubl">SUPERBOT ROUTER<b>ready</b></div>`);
const hubWhy = hubL.querySelector('b');
const MY = [412, 610, 808];
const models = ROUTE_MODELS.map((id) => panel(560, 150, `<div class="mc">${tile(id)}<div><b>${PLAN[id].model}</b><small>via your ${PLAN[id].plan}</small></div>
  <div class="fit"><span class="pct">0%</span><div class="fb"><i></i></div></div></div><div class="wonb"></div><div class="tag">ROUTED</div>`, 'model'));
const mParts = models.map((m) => ({ pct: m.querySelector('.pct'), bar: m.querySelector('.fb i'), won: m.querySelector('.wonb'), tag: m.querySelector('.tag') }));
const HX = 990, HY = 610;
const P1 = `M 806 610 L ${HX - 112} 610`;
const P2 = MY.map((y) => `M ${HX + 112} ${HY} C ${HX + 190} ${HY}, ${1140} ${y}, 1222 ${y}`);
const beams = h(`<svg class="beams" viewBox="0 0 1920 1080"><defs><linearGradient id="bg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#5b8dff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
  <g fill="none" stroke-linecap="round">
    <path d="${P1}" stroke="rgba(120,150,255,.22)" stroke-width="3"/>
    ${P2.map((d) => `<path d="${d}" stroke="rgba(120,150,255,.16)" stroke-width="3"/>`).join('')}
    <path class="l1" d="${P1}" pathLength="1" stroke="url(#bg)" stroke-width="5" stroke-dasharray="0.35 1.4"/>
    ${P2.map((d) => `<path class="l2" d="${d}" pathLength="1" stroke="url(#bg)" stroke-width="5" stroke-dasharray="1 1"/>`).join('')}
    ${P2.map((d) => `<path class="l3" d="${d}" pathLength="1" stroke="#e8f0ff" stroke-width="6" stroke-dasharray="0.12 1.2"/>`).join('')}
  </g></svg>`);
const l1 = beams.querySelector('.l1'), l2 = [...beams.querySelectorAll('.l2')], l3 = [...beams.querySelectorAll('.l3')];
route.append(beams, comp, hub, hubL, ...models);

// per-model springs keyed off the three requests
const winOf = (k) => ROUTE_MODELS.indexOf(REQS[k].plan);
const last = RQ.length - 1;
const liftKeys = ROUTE_MODELS.map((_, j) => keysOf(RQ.flatMap((R, k) => (winOf(k) !== j ? [] : k === last ? [[R + 1.35, 1]] : [[R + 1.35, 1], [R + 1.8, 0]]))));
const fitKeys = ROUTE_MODELS.map((_, j) => keysOf(RQ.flatMap((R, k) => (k === last ? [[R + 1.0 + j * 0.06, REQS[k].fit[j]]] : [[R + 1.0 + j * 0.06, REQS[k].fit[j]], [R + 1.76, 0]]))));
const dimKeys = ROUTE_MODELS.map((_, j) => keysOf(RQ.flatMap((R, k) => (winOf(k) === j ? [] : k === last ? [[R + 1.4, 1]] : [[R + 1.4, 1], [R + 1.8, 0]]))));
const bh = [];

function renderRoute(t) {
  if (!through(route, t, 6.8, 12.55)) return;
  const k = RQ.reduce((acc, R, i) => (t >= R ? i : acc), -1);
  const R = k >= 0 ? RQ[k] : 0, l = t - R;
  const e = sp(t, 6.85, PRESETS.default);
  pose(comp, { x: 470, y: 610, ry: 12, z: -300 * (1 - e) });
  hubMark.render(t);
  // composer: type, send, bubble rises; older bubbles scroll up
  if (k >= 0 && l < 0.7) { inTx.innerHTML = `${typed(REQS[k].text, t, R, REQS[k].text.length / 0.55)}<span class="caret"></span>`; inTx.classList.remove('ph'); }
  else { inTx.textContent = 'Ask your agent…'; inTx.classList.add('ph'); }
  const press = k >= 0 && l > 0.62 && l < 0.82 ? Math.sin(((l - 0.62) / 0.2) * Math.PI) : 0;
  tf(sendBtn, `scale(${1 - 0.14 * press})`);
  bubs.forEach((b, i) => {
    if (!bh[i]) bh[i] = b.offsetHeight;
    const a = sp(t, RQ[i] + 0.7, PRESETS.default);
    let up = 0;
    for (let j = i + 1; j < bubs.length; j++) up += (bh[j] + 14) * sp(t, RQ[j] + 0.7, PRESETS.default);
    tf(b, `translateY(${((1 - a) * 90 - up).toFixed(2)}px) scale(${0.92 + 0.08 * a})`);
    op(b, clamp((t - RQ[i] - 0.7) / 0.15));
    op(rts[i], clamp((t - RQ[i] - 1.6) / 0.2));
  });
  // beam into the hub, hub pulse, the reason
  l1.style.strokeDashoffset = (0.35 - 1.75 * clamp((l - 0.7) / 0.3)).toFixed(3);
  l1.style.opacity = k >= 0 && l > 0.7 && l < 1.0 ? 1 : 0;
  const d = k >= 0 ? clamp((l - 0.98) / 0.55) : 1;
  tf(hubRing, `scale(${1 + 0.35 * d})`); hubRing.style.opacity = (1 - d).toFixed(3);
  tf(hub, `scale(${1 + 0.05 * Math.sin(clamp((l - 0.95) / 0.3) * Math.PI)})`);
  hub.style.left = `${HX}px`; hub.style.top = `${HY}px`;
  hubL.style.left = `${HX}px`; hubL.style.top = `${HY + 128}px`;
  hubWhy.textContent = k >= 0 && l >= 0.95 ? scramble(REQS[k].why, t, R + 0.95, 0.35, 5 + k) : 'ready';
  // models: fit bars, the winner lifts, losers dim, the beam lands
  models.forEach((m, j) => {
    const lift = track(t, liftKeys[j], 220, 26), fit = track(t, fitKeys[j], 320, 30), dim = track(t, dimKeys[j], 220, 30);
    const me = sp(t, 6.95 + j * 0.08, PRESETS.default);
    pose(m, { x: 1500 - 40 * lift, y: MY[j], ry: -15 + 6 * lift, z: -300 * (1 - me) + 90 * lift, s: 1 + 0.03 * lift });
    op(m, clamp((t - 6.95 - j * 0.08) / 0.3) * (1 - 0.5 * clamp(dim)));
    m.style.zIndex = lift > 0.05 ? 5 : 2;
    mParts[j].pct.textContent = `${Math.round(clamp(fit) * 100)}%`;
    tf(mParts[j].bar, `scaleX(${clamp(fit).toFixed(3)})`);
    mParts[j].won.style.opacity = clamp(lift).toFixed(3);
    tf(mParts[j].tag, `translateY(${((1 - clamp(lift)) * -32).toFixed(1)}px)`);
    const isW = k >= 0 && winOf(k) === j;
    const u = isW ? outCubic((l - 1.35) / 0.3) : 0;
    l2[j].style.strokeDashoffset = (1 - u).toFixed(3);
    l2[j].style.opacity = isW && l > 1.3 && (k === last || l < 1.82) ? 1 : 0;
    l3[j].style.strokeDashoffset = (0.12 - 1.32 * clamp((l - 1.35) / 0.32)).toFixed(3);
    l3[j].style.opacity = isW && l > 1.35 && l < 1.67 ? 1 : 0;
  });
}

// ---- 3. swap: one line in agent.config.ts --------------------------------------------------
const swap = scene();
const OLD_URL = 'https://api.openai.com/v1', NEW_URL = 'https://beta.superbot.gg/v1';
const LINES = [
  '<span class="k">import</span> OpenAI <span class="k">from</span> <span class="s">"openai"</span>;',
  '',
  '<span class="k">export const</span> client = <span class="k">new</span> <span class="f">OpenAI</span>({',
  '  <span class="p">apiKey</span>: process.env.<span class="p">OPENAI_API_KEY</span>,',
  '  <span class="p">baseURL</span>: <span class="s">"<span class="url"><span class="sel"></span><span class="txt"></span><span class="caret"></span></span>"</span>,',
  '});',
  '',
  '<span class="k">export default</span> { client, maxSteps: <span class="f">40</span> };',
];
const editor = panel(1260, 560, `<div class="ed"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="tab"><i></i>agent.config.ts</span><span class="r chg">1 line changed</span></div>
  <div class="code">${LINES.map((l, i) => `<div class="ln">${i === 4 ? '<span class="band"></span><span class="gut"></span>' : ''}<span class="no">${i + 1}</span><span class="cd">${l}</span></div>`).join('')}</div></div>`);
const urlEl = editor.querySelector('.url'), urlTxt = urlEl.querySelector('.txt'), urlSel = urlEl.querySelector('.sel'), urlCaret = urlEl.querySelector('.caret');
const band = editor.querySelector('.band'), gut = editor.querySelector('.gut'), chg = editor.querySelector('.chg');
const cursor = makeCursor();
editor.appendChild(cursor);
swap.append(editor);
let urlBox = null;
function offIn(el, root) { let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; }

function renderSwap(t) {
  if (!through(swap, t, 12.6, 16.75)) return;
  const e = sp(t, 12.6, PRESETS.heavy);
  pose(editor, { x: CX, y: 620, z: -600 * (1 - e), ry: 7 + 14 * (1 - e), rx: 4, s: 1.12 });
  if (!urlBox) { urlTxt.textContent = OLD_URL; const o = offIn(urlEl, editor); urlBox = { x: o.x, y: o.y, w: urlTxt.offsetWidth, h: urlEl.offsetHeight }; }
  const tDel = 14.05, tType = 14.1;
  if (t < tDel) urlTxt.textContent = OLD_URL;
  else urlTxt.textContent = typed(NEW_URL, t, tType, NEW_URL.length / 0.75);
  const sel = t < tDel ? clamp((t - 13.55) / 0.45) : 0;
  urlSel.style.width = `${(sel * urlBox.w).toFixed(1)}px`;
  const typing = t >= tDel && t < 15.3;
  urlCaret.style.display = typing && (t < tType + 0.8 || Math.floor((t - tType) * 2.2) % 2 === 0) ? 'inline-block' : 'none';
  tf(band, `scaleX(${sp(t, 13.05, PRESETS.default).toFixed(3)})`);
  tf(gut, `scaleY(${sp(t, 14.1, PRESETS.snappy).toFixed(3)})`); op(gut, clamp((t - 14.1) / 0.1));
  const c = sp(t, 15.0, PRESETS.playful);
  tf(chg, `scale(${(0.6 + 0.4 * c).toFixed(3)})`); op(chg, clamp((t - 15.0) / 0.15));
  glint(editor, t, 15.15, 0.9);
  const ux = urlBox.x, uy = urlBox.y + urlBox.h * 0.6;
  placeCursor(cursor, t, [[12.6, 1000, 470], [13.0, 1000, 470], [13.5, ux - 2, uy], [13.55, ux - 2, uy], [14.0, ux + urlBox.w, uy], [14.45, ux + urlBox.w + 60, uy + 70]], [13.52], clamp((t - 12.9) / 0.2) * (1 - clamp((t - 14.3) / 0.25)));
}

// ---- 4. race: same agent, same task, one shared clock ------------------------------------------
const race = scene();
const ICON = '<span class="waitdot"></span><span class="spinr"></span><span class="chk"></span>';
function racePanel(side) {
  const sb = side === 'sb';
  const el = panel(800, 680, `<div class="rp ${side}"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><b>${sb ? SB_HOST : OLD_HOST}</b><span class="r who">${sb ? 'SUPERBOT' : 'BEFORE'}</span></div>
    <div class="task">${TASK}</div><div class="tm">0:00.0</div><div class="fin"><span class="chk"></span>Done</div>
    <div class="steps">${STEPS.map((s) => `<div class="st wait"><span class="ic">${ICON}</span><span class="lb">${s.label}</span><span class="bd"></span></div>`).join('')}</div>
    <div class="prog"><i></i></div></div>`);
  const rows = [...el.querySelectorAll('.st')].map((r) => ({ r, ic: [...r.querySelectorAll('.ic > span')], bd: r.querySelector('.bd'), last: '' }));
  return { el, side, rows, tm: el.querySelector('.tm'), done: el.querySelector('.fin'), prog: el.querySelector('.prog i') };
}
const lanes = [racePanel('old'), racePanel('sb')];
const spd = h(`<div class="spd"><span class="speed"><span class="ff"><i></i><i></i></span>time-lapse <span class="x">10×</span></span></div>`);
const spdX = spd.querySelector('.x');
const x7p = h(`<div class="x7p"><div class="gpill"><span class="gx">${(OLD_TOTAL / SB_TOTAL).toFixed(1)}×</span> faster <small>${fmt(SB_TOTAL)} vs ${fmt(OLD_TOTAL)}</small></div></div>`);
race.append(...lanes.map((l) => l.el), spd, x7p);
const badge = (s, side, st) => {
  if (st.state === 'wait') return '';
  if (s.model === null) return '<span class="mb loc">local</span>';
  if (side === 'old') return s.retry && st.state === 'run' && st.el >= s.retry[0] && st.el < s.retry[1] ? '<span class="mb bad">429 · retrying</span>' : `<span class="mb">${tile('openai')}GPT-6.1 Sol</span>`;
  return `<span class="mb">${tile(s.model)}${s.badge}</span>`;
};

function renderRace(t) {
  if (!through(race, t, 16.85, 25.85)) return;
  const lt = t - L0, clock = raceClock(lt);
  const tEnd = { old: L0 + RACE.END, sb: L0 + RACE.A };
  lanes.forEach((ln, i) => {
    const total = ln.side === 'sb' ? SB_TOTAL : OLD_TOTAL, d = Math.min(clock, total);
    const e = sp(t, 16.9 + i * 0.1, PRESETS.default);
    const fin = sp(t, tEnd[ln.side], PRESETS.snappy);
    const win = ln.side === 'sb' ? fin : 0;
    pose(ln.el, { x: i ? 1420 : 500, y: 580, ry: i ? -9 : 9, z: -400 * (1 - e) + 50 * win, s: 1 });
    op(ln.el, (1 - 0.45 * clamp((t - 23.3) / 0.3)));
    ln.tm.textContent = fmt(d);
    ln.tm.classList.toggle('won', ln.side === 'sb' && t >= tEnd.sb);
    tf(ln.done, `scale(${(0.6 + 0.4 * sp(t, tEnd[ln.side], PRESETS.playful)).toFixed(3)})`); op(ln.done, clamp((t - tEnd[ln.side]) / 0.12));
    tf(ln.prog, `scaleX(${(d / total).toFixed(4)})`);
    stepStates(d, ln.side).forEach((st, j) => {
      const row = ln.rows[j];
      row.r.className = `st ${st.state}`;
      row.ic.forEach((ic, q) => { ic.style.display = q === ['wait', 'run', 'done'].indexOf(st.state) ? 'block' : 'none'; });
      tf(row.ic[1], `rotate(${(t * 900) % 360}deg)`);
      const b = badge(STEPS[j], ln.side, st);
      if (b !== row.last) { row.bd.innerHTML = b; row.last = b; }
    });
    if (ln.side === 'sb') glint(ln.el, t, tEnd.sb + 0.05, 0.8);
  });
  spdX.textContent = `${speedX(lt)}×`;
  op(spd, clamp((t - L0 + 0.25) / 0.2) * (1 - clamp((t - tEnd.old - 0.2) / 0.2)));
  const x = sp(t, 23.3, PRESETS.playful);
  tf(x7p, `translate(-50%, -50%) scale(${(0.55 + 0.45 * x).toFixed(4)})`); op(x7p, clamp((t - 23.3) / 0.12));
}

// ---- mount / render ------------------------------------------------------------------------------
boot({
  DUR,
  mount(stage) {
    stage.append(env.el, pack, route, swap, race, ...Object.values(heads).map((x) => x.el), zend.el);
  },
  render(t) {
    const light = 0.35 + 0.65 * smooth(t / 1.2) + 0.18 * smooth((t - 26) / 1.0);
    env.render(t, { light, lift: -40 * sp(t, 26, PRESETS.heavy), hz: 700, fy: t * 70 + 380 * clamp(t - L0, 0, RACE.END) });
    heads.hook.render(t, 0.2, 1.5);
    heads.pack.render(t, 2.15, 6.45);
    heads.route.render(t, 6.9, 12.3);
    heads.swap.render(t, 12.75, 16.5);
    heads.race.render(t, 16.95, 25.6);
    renderPack(t);
    renderRoute(t);
    renderSwap(t);
    renderRace(t);
    zend.render(t, END);
  },
});
