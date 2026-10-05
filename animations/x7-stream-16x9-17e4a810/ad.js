// x7 STREAM (17e4a810): one lateral camera flight across four stations on the grid floor. Your four
// existing keys pour their glyphs into one superbot key; a rail switch sends each request to its
// model; a git diff shows the single base_url change; two lanes race on one clock (0:24.0 vs 2:48.0).
import { clamp, sp, h, op, tf, scramble, smooth, inCubic, inOutCubic, outCubic, track, PRESETS, PLANS, PLAN, KEY_PRE, REQS, ROUTE_MODELS, tile, makeMark, boot } from './kit.js';
import { TASK, OLD_HOST, SB_HOST, STEPS, OLD_TOTAL, SB_TOTAL, RACE, raceClock, speedX, fmt, stepStates } from './x7.js';
import { makeEnv, makeHead, panel, pose, glint, cam, bez, makeZEnd } from './zl.js';

const DUR = 30;
const SX = [960, 3160, 5360, 7560]; // station centers in world x
const L0 = 17.6;
const RQ = [7.2, 9.1, 11.0];
const TS = (i) => 2.6 + i * 0.45; // pill i starts pouring
const TA = (i) => TS(i) + 0.95; // its segment decodes
const END = 26.15;
const CAM = [[0, SX[0], 540, 1], [2.2, SX[0], 548, 1.03], [6.7, SX[0], 540, 1], [6.72, SX[1], 540, 1], [12.55, SX[1], 540, 1.02], [12.57, SX[2], 540, 1], [16.75, SX[2], 540, 1.03], [16.77, SX[3], 540, 1], [25.9, SX[3], 560, 0.97]];

const env = makeEnv();
const world = h(`<div class="world"></div>`);
const heads = {
  hook: makeHead(['Four AI plans.', '*Four API keys.*'], { size: 96, y: 54 }),
  pack: makeHead(['Pour them into *one key.*'], { size: 68, y: 66 }),
  route: makeHead(['Every request rides to the *best model.*'], { size: 60, y: 60 }),
  swap: makeHead(['Change *one line.*'], { size: 68, y: 66 }),
  race: makeHead(['Same task. *Two endpoints.*'], { size: 56, y: 52 }),
};
const zend = makeZEnd({ size: 92 });
function offIn(el, root) { let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; }
const keysOf = (pairs) => [[0, 0], ...pairs.sort((a, b) => a[0] - b[0])];

// ---- station 1: four keys pour into one --------------------------------------------------------
const PY = [372, 514, 656, 798];
const pills = PLANS.map((p) => panel(660, 124, `<div class="kp">${tile(p.id)}<div class="nm">${p.plan}<small>${p.env}</small></div><div class="kt">${p.keyMask}</div></div><div class="ok" style="opacity:0">PACKED</div>`, 'kpill'));
const pillTxt = pills.map((el) => el.querySelector('.kt')), pillOk = pills.map((el) => el.querySelector('.ok'));
const skMark = makeMark(30);
const sk = panel(860, 262, `<div class="sk"><div class="kl"><span class="m"></span>SUPERBOT KEY</div>
  <div class="kv"><span>${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}">····</span>`).join('')}</div>
  <div class="meta"><span>${PLANS.map((p) => tile(p.id, 'xs')).join('')} 4 plans</span><span>1 key</span><span>OpenAI-compatible</span></div></div>`);
sk.querySelector('.kl .m').appendChild(skMark.el);
const segs = [...sk.querySelectorAll('.sg')], skMeta = sk.querySelector('.meta');
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const glyphs = PLANS.map((p, i) => [...p.keyMask].map((ch, j) => { const g = h(`<span class="gl"></span>`); g.textContent = ch === '•' ? ALNUM[(i * 31 + j * 17 + j * j * 7) % ALNUM.length] : ch; g.style.color = p.color; return g; }));
world.append(...pills, sk, ...glyphs.flat());
let geo = null;
function measure() {
  const cw = pillTxt[0].offsetWidth / PLANS[0].keyMask.length;
  geo = {
    src: pillTxt.map((el) => offIn(el, world)), cw,
    dst: segs.map((el) => offIn(el, world)), dw: segs[0].offsetWidth / 4, dh: segs[0].offsetHeight,
  };
}

function renderPack(t) {
  const vis = t < 7.4;
  [...pills, sk, ...glyphs.flat()].forEach((el) => { if (!vis) op(el, 0); });
  if (!vis) return;
  if (!geo) { pills.forEach((el, i) => pose(el, { x: 600, y: PY[i] })); pose(sk, { x: 1430, y: 552 }); measure(); }
  pills.forEach((el, i) => {
    const e = sp(t, 0.8 + i * 0.12, PRESETS.default);
    const dim = sp(t, TA(i) + 0.2, PRESETS.default);
    pose(el, { x: 600 - 420 * (1 - e), y: PY[i], ry: 14 * (1 - e) });
    op(el, clamp((t - 0.8 - i * 0.12) / 0.25) * (1 - 0.5 * dim));
    const gone = Math.floor(clamp((t - TS(i)) / (PLANS[i].keyMask.length * 0.028)) * PLANS[i].keyMask.length);
    pillTxt[i].textContent = PLANS[i].keyMask.slice(gone).padStart(PLANS[i].keyMask.length, ' ');
    op(pillOk[i], dim); tf(pillOk[i], `scale(${(0.7 + 0.3 * sp(t, TA(i) + 0.2, PRESETS.playful)).toFixed(3)})`);
  });
  const k = sp(t, 2.25, PRESETS.heavy);
  let bump = 0;
  PLANS.forEach((p, i) => { const d = t - TA(i); if (d > 0 && d < 0.35) bump = Math.max(bump, Math.sin((d / 0.35) * Math.PI)); });
  pose(sk, { x: 1430, y: 552, z: -500 * (1 - k), ry: -10 * (1 - k), s: 1 + 0.025 * bump });
  op(sk, clamp((t - 2.25) / 0.3));
  skMark.render(t);
  glint(sk, t, 5.8, 0.9);
  segs.forEach((s, i) => {
    const p = PLANS[i], ta = TA(i);
    s.textContent = t < ta ? '····' : scramble(p.seg, t, ta, 0.35, 21 + i);
    s.style.color = t < ta ? '#3a3f4d' : p.color;
    s.style.setProperty('--u', outCubic((t - ta) / 0.3).toFixed(3));
  });
  const m = sp(t, 5.6, PRESETS.snappy);
  tf(skMeta, `translateY(${((1 - m) * 16).toFixed(2)}px)`); op(skMeta, clamp((t - 5.6) / 0.2));
  // glyphs: each character of an old key leaves its pill and arcs into that plan's segment
  glyphs.forEach((row, i) => row.forEach((g, j) => {
    const t0 = TS(i) + j * 0.028, u = clamp((t - t0) / 0.7);
    if (u <= 0 || u >= 1) { op(g, 0); return; }
    const a = [geo.src[i].x + j * geo.cw, geo.src[i].y];
    const b = [geo.dst[i].x + (j % 4) * geo.dw, geo.dst[i].y + (geo.dh - 30) / 2];
    const lift = (i - 1.5) * 90 - 160;
    const [x, y] = bez(a, [a[0] + 260, a[1] + lift], [b[0] - 240, b[1] - lift * 0.4], b, inOutCubic(u));
    tf(g, `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1.15 - 0.35 * u).toFixed(3)})`);
    op(g, Math.min(1, u * 6) * (1 - smooth((u - 0.85) / 0.15)));
  }));
}

// ---- station 2: the rail switch -----------------------------------------------------------------
const X2 = SX[1];
const JX = X2 - 40, JY = 560;
const MX = X2 + 560, MYS = [330, 560, 790];
const agent = panel(560, 330, `<div class="ag"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><b>billing-agent</b><span class="n r">req 1/3</span></div>
  <div class="rq"></div><div class="ep"><b>POST</b>/v1/chat/completions<span class="kc">sk-superbot-7Kq9…</span></div></div>`);
const rqEl = agent.querySelector('.rq'), rqN = agent.querySelector('.n');
const jn = h(`<div class="jn"></div>`); const jMark = makeMark(88); jn.appendChild(jMark.el);
const jl = h(`<div class="jl">SWITCH<b>ready</b></div>`); const jWhy = jl.querySelector('b');
const RAIL = MYS.map((y) => [[JX + 85, JY], [JX + 210, JY], [MX - 420, y], [MX - 290, y]]);
const IN = [[X2 - 610 + 280, JY], [JX - 85, JY]];
const pathD = (r) => `M ${r[0][0]} ${r[0][1]} C ${r[1][0]} ${r[1][1]}, ${r[2][0]} ${r[2][1]}, ${r[3][0]} ${r[3][1]}`;
const rails = h(`<svg class="rails"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#5b8dff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><g fill="none" stroke-linecap="round">
  <path d="M ${IN[0][0]} ${IN[0][1]} L ${IN[1][0]} ${IN[1][1]}" stroke="rgba(120,150,255,.35)" stroke-width="4" stroke-dasharray="2 12"/>
  ${RAIL.map((r) => `<path d="${pathD(r)}" stroke="rgba(120,150,255,.20)" stroke-width="4"/>`).join('')}
  ${RAIL.map((r) => `<path class="lit" d="${pathD(r)}" pathLength="1" stroke="url(#rg)" stroke-width="6" stroke-dasharray="1 1"/>`).join('')}
  <line class="blade" x1="${JX + 85}" y1="${JY}" x2="${JX + 175}" y2="${JY}" stroke="#eaf0ff" stroke-width="8"/></g></svg>`);
const lit = [...rails.querySelectorAll('.lit')], blade = rails.querySelector('.blade');
const pkt = h(`<div class="pkt">REQ</div>`);
const stations = ROUTE_MODELS.map((id) => panel(560, 150, `<div class="ms">${tile(id)}<div><b>${PLAN[id].model}</b><small>via your ${PLAN[id].plan}</small></div><span class="st">200 OK</span></div><div class="wonb"></div>`, 'st3'));
const stParts = stations.map((s) => ({ st: s.querySelector('.st'), won: s.querySelector('.wonb') }));
world.append(rails, agent, jn, jl, ...stations, pkt);
const winOf = (k) => ROUTE_MODELS.indexOf(REQS[k].plan);
const lastQ = RQ.length - 1;
const lightKeys = ROUTE_MODELS.map((_, j) => keysOf(RQ.flatMap((R, k) => (winOf(k) !== j ? [] : k === lastQ ? [[R + 1.25, 1]] : [[R + 1.25, 1], [R + 1.8, 0]]))));
// blade angle toward the chosen rail
const bladeAng = (j) => Math.atan2(MYS[j] - JY, 300) * (180 / Math.PI) * 0.55;
const angKeys = [[0, 0], ...RQ.map((R, k) => [R + 0.72, bladeAng(winOf(k))])];

function renderRoute(t) {
  const vis = t > 6.3 && t < 13.2;
  [agent, jn, jl, rails, pkt, ...stations].forEach((el) => { if (!vis) op(el, 0); });
  if (!vis) return;
  const k = RQ.reduce((acc, R, i) => (t >= R ? i : acc), -1);
  const R = k >= 0 ? RQ[k] : 0, l = t - R;
  pose(agent, { x: X2 - 610, y: JY, ry: 12 });
  op(agent, 1);
  rqN.textContent = `req ${Math.max(1, k + 1)}/3`;
  rqEl.textContent = k >= 0 ? REQS[k].text : '';
  tf(rqEl, `translateY(${((1 - sp(t, R, PRESETS.snappy)) * 14).toFixed(2)}px)`); op(rqEl, k >= 0 ? clamp(l / 0.15) : 0);
  op(rails, 1); op(jn, 1); op(jl, 1);
  jn.style.left = `${JX}px`; jn.style.top = `${JY}px`; jl.style.left = `${JX}px`; jl.style.top = `${JY + 110}px`;
  tf(jn, `scale(${(1 + 0.06 * Math.sin(clamp((l - 0.5) / 0.3) * Math.PI)).toFixed(4)})`);
  jMark.render(t);
  jWhy.textContent = k >= 0 && l >= 0.5 ? scramble(REQS[k].why, t, R + 0.5, 0.3, 3 + k) : 'ready';
  const ang = track(t, angKeys, 320, 30);
  blade.setAttribute('transform', `rotate(${ang.toFixed(2)} ${JX + 85} ${JY})`);
  // packet: agent -> junction -> chosen rail -> station
  let px = 0, py = 0, po = 0;
  if (k >= 0) {
    const r = RAIL[winOf(k)];
    if (l >= 0.2 && l < 0.55) { const u = inOutCubic((l - 0.2) / 0.35); px = IN[0][0] + (IN[1][0] + 85 - IN[0][0]) * u; py = JY; po = 1; }
    else if (l >= 0.55 && l < 0.85) { px = JX; py = JY; po = 1; }
    else if (l >= 0.85 && l < 1.25) { [px, py] = bez(r[0], r[1], r[2], r[3], inOutCubic((l - 0.85) / 0.4)); po = 1; }
  }
  tf(pkt, `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`); op(pkt, po);
  stations.forEach((s, j) => {
    const lt = track(t, lightKeys[j], 220, 26);
    const isW = k >= 0 && winOf(k) === j;
    pose(s, { x: MX - 30 * lt, y: MYS[j], ry: -14 + 6 * lt, z: 80 * lt, s: 1 + 0.03 * lt });
    op(s, 0.55 + 0.45 * clamp(lt) + (k < 0 ? 0.45 : 0));
    stParts[j].won.style.opacity = clamp(lt).toFixed(3);
    op(stParts[j].st, clamp(lt)); tf(stParts[j].st, `scale(${(0.7 + 0.3 * clamp(lt)).toFixed(3)})`);
    lit[j].style.strokeDashoffset = (1 - (isW ? outCubic((l - 0.85) / 0.4) : 0)).toFixed(3);
    lit[j].style.opacity = isW && l > 0.85 && (k === lastQ || l < 1.85) ? 1 : 0;
  });
}

// ---- station 3: the diff --------------------------------------------------------------------------
const X3 = SX[2];
const DL = [
  ['hd', ' ', 'diff --git a/agent.yaml b/agent.yaml'],
  ['hk', ' ', '@@ -1,5 +1,5 @@'],
  ['', ' ', '<span class="k">name</span>: billing-migrator'],
  ['del', '-', '<span class="k">base_url</span>: <span class="v">https://api.openai.com/v1</span>'],
  ['add', '+', '<span class="k">base_url</span>: <span class="v">https://beta.superbot.gg/v1</span>'],
  ['', ' ', '<span class="k">api_key</span>: ${OPENAI_API_KEY}'],
  ['', ' ', '<span class="k">max_steps</span>: 40'],
  ['', ' ', '<span class="k">tools</span>: [git, shell, tests]'],
];
const diff = panel(1240, 560, `<div class="df"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="fn">agent.yaml</span><span class="r">git diff</span></div>
  <div class="code">${DL.map(([c, s, l]) => `<div class="ln ${c}"><span class="bg"></span><div class="in"><span class="sgn">${s}</span>${l}</div></div>`).join('')}</div>
  <div class="stat"><span>1 file changed,</span><span class="a">1 insertion(+),</span><span class="d">1 deletion(-)</span><span class="pl">ONE LINE</span></div></div>`);
const dRows = [...diff.querySelectorAll('.ln')];
const dStat = diff.querySelector('.stat');
world.append(diff);

function renderSwap(t) {
  const vis = t > 12.2 && t < 17.3;
  if (!vis) { op(diff, 0); return; }
  op(diff, 1);
  pose(diff, { x: X3, y: 600, ry: 6, rx: 3, s: 1.08 });
  dRows.forEach((r, i) => {
    const c = DL[i][0];
    const bg = r.querySelector('.bg'), sg = r.querySelector('.sgn');
    if (c === 'del') { const a = sp(t, 13.6, PRESETS.snappy); tf(bg, `scaleX(${a.toFixed(3)})`); op(sg, clamp((t - 13.6) / 0.1)); r.classList.toggle('del', t >= 13.6); }
    if (c === 'add') { const a = sp(t, 14.1, PRESETS.default); r.style.height = `${(48 * a).toFixed(2)}px`; tf(bg, `scaleX(${sp(t, 14.2, PRESETS.snappy).toFixed(3)})`); }
  });
  const s = sp(t, 14.5, PRESETS.snappy);
  tf(dStat, `translateY(${((1 - s) * 18).toFixed(2)}px)`); op(dStat, clamp((t - 14.5) / 0.2));
  glint(diff, t, 15.1, 0.9);
}

// ---- station 4: two lanes, one clock ------------------------------------------------------------------
const X4 = SX[3];
function lane(side) {
  const sb = side === 'sb', total = sb ? SB_TOTAL : OLD_TOTAL;
  let acc = 0;
  const ticks = STEPS.slice(0, -1).map((s) => { acc += sb ? s.sb : s.old; return acc / total; });
  const el = panel(1660, 250, `<div class="lane ${side}"><div class="hdr"><span>${sb ? SB_HOST : OLD_HOST}</span><span class="who">${sb ? 'SUPERBOT' : 'BEFORE'}</span></div>
    <div class="tm">0:00.0</div><div class="trk"><div class="fl"></div>${ticks.map((f) => `<i class="tk" style="left:${(f * 100).toFixed(2)}%"></i>`).join('')}<div class="hd2"></div><span class="flag">PR OPEN</span></div>
    <div class="now"></div><div class="fin"><span class="chk"></span>Done</div></div>`);
  return { el, side, total, ticks, tm: el.querySelector('.tm'), fl: el.querySelector('.fl'), tks: [...el.querySelectorAll('.tk')], hd: el.querySelector('.hd2'), now: el.querySelector('.now'), fin: el.querySelector('.fin'), last: '' };
}
const lanes = [lane('old'), lane('sb')];
const taskChip = h(`<div class="spd" style="top:0;left:0"><span class="speed" style="font-size:17px">${TASK}</span></div>`);
const spd = h(`<div class="spd"><span class="speed"><span class="ff"><i></i><i></i></span>time-lapse <span class="x">10×</span></span></div>`);
const spdX = spd.querySelector('.x');
const x7p = h(`<div class="x7p"><div class="gpill"><span class="gx">${(OLD_TOTAL / SB_TOTAL).toFixed(1)}×</span> faster <small>${fmt(SB_TOTAL)} vs ${fmt(OLD_TOTAL)}</small></div></div>`);
world.append(...lanes.map((l) => l.el), taskChip, spd, x7p);
const LY = [440, 730];

function renderRace(t) {
  const vis = t > 16.3;
  [...lanes.map((l) => l.el), taskChip, spd, x7p].forEach((el) => { if (!vis) op(el, 0); });
  if (!vis) return;
  const lt = t - L0, clock = raceClock(lt);
  const tEnd = { old: L0 + RACE.END, sb: L0 + RACE.A };
  const out = inCubic((t - 25.85) / 0.45);
  lanes.forEach((ln, i) => {
    const d = Math.min(clock, ln.total), f = d / ln.total;
    const e = sp(t, 16.85 + i * 0.12, PRESETS.default);
    const win = ln.side === 'sb' ? sp(t, tEnd.sb, PRESETS.snappy) : 0;
    pose(ln.el, { x: X4 + 900 * (1 - e), y: LY[i], rx: 8, z: 40 * win - 300 * out, s: 1 });
    op(ln.el, (1 - 0.45 * clamp((t - 23.3) / 0.3)) * (1 - out));
    ln.tm.textContent = fmt(d);
    ln.tm.classList.toggle('won', ln.side === 'sb' && t >= tEnd.sb);
    tf(ln.fl, `scaleX(${f.toFixed(4)})`);
    ln.hd.style.left = `${(f * 100).toFixed(3)}%`;
    ln.tks.forEach((tk, q) => tk.classList.toggle('on', f >= ln.ticks[q]));
    const st = stepStates(d, ln.side);
    const j = st.findIndex((s) => s.state === 'run');
    const s = STEPS[j];
    let html;
    if (j < 0) html = `<span class="chk"></span>${STEPS.length} steps done · PR opened`;
    else if (ln.side === 'old' && s.retry && st[j].el >= s.retry[0] && st[j].el < s.retry[1]) html = `<span class="spinr"></span>${s.label}<span class="mb bad">429 · retrying</span>`;
    else if (s.model === null) html = `<span class="spinr"></span>${s.label}<span class="mb loc">local</span>`;
    else if (ln.side === 'old') html = `<span class="spinr"></span>${s.label}<span class="mb">${tile('openai')}GPT-6.1 Sol</span>`;
    else html = `<span class="spinr"></span>${s.label}<span class="mb">${tile(s.model)}${s.badge}</span>`;
    if (html !== ln.last) { ln.now.innerHTML = html; ln.last = html; }
    const sr = ln.now.querySelector('.spinr'); if (sr) tf(sr, `rotate(${(t * 900) % 360}deg)`);
    tf(ln.fin, `scale(${(0.6 + 0.4 * sp(t, tEnd[ln.side], PRESETS.playful)).toFixed(3)})`); op(ln.fin, clamp((t - tEnd[ln.side]) / 0.12));
    if (ln.side === 'sb') glint(ln.el, t, tEnd.sb + 0.05, 0.8);
  });
  const ce = sp(t, 17.0, PRESETS.default);
  taskChip.style.left = `${X4}px`; taskChip.style.top = `${232}px`; op(taskChip, clamp((t - 17.0) / 0.25) * (1 - out)); tf(taskChip, `translate(-50%, -50%) translateY(${((1 - ce) * 16).toFixed(1)}px)`);
  spd.style.left = `${X4}px`; spd.style.top = '1000px';
  spdX.textContent = `${speedX(lt)}×`;
  op(spd, clamp((t - L0 + 0.25) / 0.2) * (1 - clamp((t - tEnd.old - 0.2) / 0.2)));
  const x = sp(t, 23.3, PRESETS.playful);
  x7p.style.left = `${X4}px`; x7p.style.top = '585px';
  tf(x7p, `translate(-50%, -50%) scale(${((0.55 + 0.45 * x) * (1 + 0.3 * out)).toFixed(4)})`); op(x7p, clamp((t - 23.3) / 0.12) * (1 - out));
}

boot({
  DUR,
  mount(stage) {
    stage.append(env.el, world, ...Object.values(heads).map((x) => x.el), zend.el);
  },
  render(t) {
    const c = cam(world, t, CAM, 60, 15.5);
    const light = 0.35 + 0.65 * smooth(t / 1.2) + 0.18 * smooth((t - 26) / 1.0);
    env.render(t, { light, lift: -40 * sp(t, 26, PRESETS.heavy), hz: 700, fx: -c.cx * 0.45, fy: t * 60 + 300 * clamp(t - L0, 0, RACE.END) });
    heads.hook.render(t, 0.2, 2.15);
    heads.pack.render(t, 2.3, 6.45);
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
