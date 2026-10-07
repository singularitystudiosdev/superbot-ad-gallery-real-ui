// pocketsflow-node-graph-every-model-superbot act 3: the real superbot hub at full width (rail, chats, header), the
// "make a launch video for Pocketsflow" ask, and then no thread at all: superbot answers with a FLOW, a dataflow graph
// of six nodes on a canvas inside the chat. Each node runs in order (Claude Opus 5.5, Nano Banana Pro, Blender,
// DeepSeek V4.1 Flash, ElevenLabs, Superbot): the composer's model chip switches, the node opens into a 16:9 stage
// showing that model's real output (tabs-assets/panels/*), closes back to a thumbnail, and its result travels the
// edges to the nodes that consume it. The render node cuts everything into the film (film.js), which takes the frame.
// render(lt) is a pure function of local time. The id stays "tabs" so the hub stylesheets scoped under #s-tabs apply.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { SYMBOLS } from './tabs-assets/icons.js';
import { APPS, el, esc, tile, SB_MARK } from './tabs-assets/panels/kit.js';
import { opus } from './tabs-assets/panels/opus.js';
import { nbp } from './tabs-assets/panels/nbp.js';
import { blender } from './tabs-assets/panels/blender.js';
import { deepseek } from './tabs-assets/panels/deepseek.js';
import { eleven } from './tabs-assets/panels/eleven.js';
import { render as renderNode } from './tabs-assets/panels/render.js';
import { mountFilm, fitFilm, renderFilm, FILM_DUR } from './film.js';
import { clamp, lerp, seg, outCubic, inOutCubic, outBack, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080, DW = 1200, DH = 675;      // the hub's design box (k = 1.6 at 1920x1080)
const SW = 880, SH = 495;                  // a node's open stage, 16:9, in canvas px
const ASK = 'make a launch video for Pocketsflow';
const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// beats (scene seconds)
const T_TYPE = 1.6, CPS = 24, T_SEND = 3.25;
const T_PLAN = 3.65, T_PLAN_OK = 4.35, T_OPEN = 4.95, T_OPEN_END = 6.05;
const RUN0 = 6.2, D = 4.3, D_R = 3.6;
// a run, in run seconds: chip, model swap, stage open, play, stage close, edges
const U = { swap: 0.25, open: 0.35, play: 0.9, close: 3.55, shut: 4.05, done: 3.8, pkt: 3.9, pktEnd: 4.4 };

const ORDER = [opus, nbp, blender, deepseek, eleven, renderNode];
const RUNS = ORDER.map((m, i) => ({ m, i, s: RUN0 + i * D }));
const T_FILM = RUNS[5].s + D_R;            // the film leaves the render monitor and takes the frame
const T_END = T_FILM + FILM_DUR;

// the graph, in canvas px: three lanes (visuals, 3D, words) into the render node
const NODE = { opus: [30, 36], nbp: [300, 36], blender: [300, 200], deepseek: [30, 364], eleven: [300, 364], render: [620, 170] };
const NW = 200, NH = 132, RW = 270, RH = 196;
const EDGES = [
  ['opus', 'nbp', [230, 102, 265, 102, 265, 102, 300, 102]],
  ['opus', 'render', [230, 140, 300, 186, 540, 184, 620, 210]],
  ['nbp', 'render', [500, 102, 575, 102, 560, 192, 620, 192]],
  ['blender', 'render', [500, 266, 560, 266, 570, 250, 620, 250]],
  ['deepseek', 'eleven', [230, 430, 265, 430, 265, 430, 300, 430]],
  ['deepseek', 'render', [230, 384, 290, 346, 540, 346, 620, 300]],
  ['eleven', 'render', [500, 430, 575, 430, 560, 334, 620, 334]],
];

let el$ = null;

const runOf = (k) => RUNS.find((r) => r.m.key === k);
const bump = (p) => Math.sin(Math.PI * clamp(p));

function mountHub(section) {
  const markup = hubMarkup(asset).replace(/one window/g, 'pocketsflow launch').replace('8 agents wired in', '6 models wired in');
  section.innerHTML = `<div class="ask-root"><div class="sbsite ask fg"><div class="stage"><div class="body"><div class="arena">${markup}</div></div></div></div><div class="fg-film"></div><svg width="0" height="0" style="position:absolute" aria-hidden="true">${SYMBOLS}</svg></div>`;
  const q = (s) => section.querySelector(s);
  const hub = q('.sbsite .hub');
  const main = hub.querySelector('.main');
  const hero = el(`<div class="ask-hero"><img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1></div>`);
  main.appendChild(hero);
  hub.querySelector('.rc-super').innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
  return { section, root: q('.ask-root'), site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), feed: hub.querySelector('.feed') };
}

// the thread before the flow: sam's ask, superbot's plan
function mountThread(e) {
  const inner = el('<div class="feed-in"></div>');
  while (e.feed.firstChild) inner.appendChild(e.feed.firstChild);
  e.feed.appendChild(inner);
  const sb = `<span class="avatar sb"><img src="${asset('tile.svg')}" alt=""/></span>`;
  e.ask = inner.appendChild(el(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(ASK)}</div></div></div>`));
  e.plan = inner.appendChild(el(`<div class="msg qc-m">${sb}<div class="m-main"><span class="qc-sw">${tile('render')}<span class="qc-swl">Planning it as a flow</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>
    <div class="m-text fg-plan">Six models, seven hand-offs. Opus builds the page, Nano Banana Pro shoots it, Blender models the mark, DeepSeek pulls the numbers, ElevenLabs voices them, I cut the film.</div></div></div>`));
  e.planSw = e.plan.querySelector('.qc-sw');
  e.planTx = e.plan.querySelector('.fg-plan');
}

// the composer's model chip names superbot, then whichever model the flow is on
function mountPlat(e) {
  const plat = e.hub.querySelector('.rc-plat');
  const icon = el('<span class="qc-pi"></span>');
  plat.querySelector('.rc-cat').replaceWith(icon);
  const img = el('<img alt="" style="display:none"/>');
  const mark = el(`<span class="qc-pi-sb" style="display:block">${SB_MARK}</span>`);
  icon.append(img, mark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const name = el('<span>superbot</span>');
  label.replaceWith(name);
  e.plat = { plat, img, mark, name, app: 'superbot' };
  e.ph = e.hub.querySelector('.rc-ph');
  e.phText = e.ph.textContent;
  e.send = e.hub.querySelector('.rc-send');
}

function nodeHtml(m, i) {
  const [x, y] = NODE[m.key];
  const big = m.key === 'render';
  return `<div class="fg-node${big ? ' fg-big' : ''}" data-k="${m.key}" style="left:${x}px;top:${y}px;width:${big ? RW : NW}px;height:${big ? RH : NH}px">
    <div class="fg-nh"><span class="fg-step">${i + 1}</span>${tile(m.key)}<b>${esc(APPS[m.key].name)}</b><span class="fg-ns"><i class="fg-spin"></i>${OK}</span></div>
    <div class="fg-task">${esc(APPS[m.key].task)}</div>
    <div class="fg-tw"><div class="fg-wait"><i></i>queued</div>${m.thumb()}</div>
    <div class="fg-nf"><span class="fg-run">running</span><span class="fg-dn">${esc(m.done)}</span></div>
  </div>`;
}

function mountFlow(e) {
  const d = (p) => `M${p[0]},${p[1]} C${p[2]},${p[3]} ${p[4]},${p[5]} ${p[6]},${p[7]}`;
  const flow = el(`<div class="fg-flow">
    <div class="fg-bar"><span class="fg-fi">${SB_MARK}</span><b>Flow</b><span class="fg-fn">pocketsflow launch film</span><span class="fg-pill">6 models</span><span class="fg-pill">7 hand-offs</span><span class="fg-stat">queued</span></div>
    <svg class="fg-edges" width="936" height="530">${EDGES.map((ed) => `<g class="fg-eg"><path class="fg-e" d="${d(ed[2])}"/><circle class="fg-port" cx="${ed[2][0]}" cy="${ed[2][1]}" r="3.2"/><circle class="fg-port" cx="${ed[2][6]}" cy="${ed[2][7]}" r="3.2"/></g><path class="fg-el" d="${d(ed[2])}"/>`).join('')}</svg>
    ${ORDER.map(nodeHtml).join('')}
    ${EDGES.map(() => '<i class="fg-pk"></i>').join('')}
  </div>`);
  e.main.appendChild(flow);
  // the routing chips live in the composer, on the line the placeholder uses
  const sws = el(`<div class="fg-sws">${RUNS.map((r) => `<span class="qc-sw fg-sw">${tile(r.m.key)}<span class="qc-swl">${esc(APPS[r.m.key].chip)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>`).join('')}</div>`);
  e.hub.querySelector('.rc').appendChild(sws);
  e.flow = flow;
  e.bar = flow.querySelector('.fg-bar');
  e.stat = flow.querySelector('.fg-stat');
  e.edges = EDGES.map((ed, i) => ({ from: ed[0], to: ed[1], base: flow.querySelectorAll('.fg-eg')[i], lit: flow.querySelectorAll('.fg-el')[i], pk: flow.querySelectorAll('.fg-pk')[i], len: 0 }));
  e.nodes = Object.fromEntries([...flow.querySelectorAll('.fg-node')].map((n) => [n.dataset.k, n]));
  e.sws = [...sws.querySelectorAll('.fg-sw')];
  // one stage per node: its panel chrome around the model's own UI
  e.stages = RUNS.map((r) => {
    const st = el(`<div class="fg-stage fg-s-${r.m.key}"><div class="fg-sh">${tile(r.m.key)}<b>${esc(APPS[r.m.key].name)}</b><span>${esc(r.m.head)}</span><em>${esc(r.m.meta)}</em></div><div class="fg-sb"></div></div>`);
    flow.appendChild(st);
    return { st, s: r.m.mount(st.querySelector('.fg-sb')) };
  });
}

// geometry, measured once from layout (offset* ignore the camera's transform)
function geo(e) {
  if (e.g) return e.g;
  let x = 0, y = 0, n = e.flow;
  while (n && n !== e.site) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  const cw = e.flow.offsetWidth, ch = e.flow.offsetHeight;
  if (!cw) return null;
  const sx = Math.round((cw - SW) / 2), sy = Math.round((ch - SH) / 2);
  e.stages.forEach(({ st }) => { st.style.left = sx + 'px'; st.style.top = sy + 'px'; });
  e.edges.forEach((ed) => { ed.len = ed.lit.getTotalLength(); ed.lit.style.strokeDasharray = `${ed.len} ${ed.len}`; });
  e.g = { fx: x, fy: y, sx, sy, cw, ch };
  return e.g;
}

// the camera: where it looks (design px) and how far in
function camAt(t, g) {
  const empty = { cx: DW - DW / (2 * 1.08), cy: DH / 2, z: 1.08 }; // pushed in on the composer, right edge pinned
  const over = { cx: DW / 2, cy: DH / 2, z: 1 };
  const stage = { cx: g.fx + g.sx + SW / 2, cy: g.fy + g.sy + SH / 2, z: 1840 / (SW * 1.6) };
  const mix = (a, b, f) => ({ cx: lerp(a.cx, b.cx, f), cy: lerp(a.cy, b.cy, f), z: lerp(a.z, b.z, f) });
  let c = mix(empty, over, inOutCubic(seg(t, T_SEND - 0.1, T_OPEN_END)));
  RUNS.forEach((r) => {
    const u = t - r.s;
    const into = inOutCubic(seg(u, U.open, U.play));
    const back = r.m.key === 'render' ? 0 : inOutCubic(seg(u, U.close, U.shut));
    if (u > U.open && into - back > 0) c = mix(c, stage, into - back);
  });
  return c;
}

export default {
  id: 'tabs',
  dur: T_END + 0.2,

  mount(section) {
    const e = mountHub(section);
    mountThread(e);
    mountPlat(e);
    mountFlow(e);
    const film = mountFilm(section.querySelector('.fg-film'));
    el$ = { ...e, film, filmBox: section.querySelector('.fg-film'), g: null, lift: null, lastApp: null };
  },

  render(lt, ctx) {
    const e = el$;
    if (!e) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const k = Math.min(W / DW, H / DH);
    e.site.style.width = DW + 'px';
    e.site.style.height = DH + 'px';
    e.site.style.setProperty('--dw', DW + 'px');
    const g = geo(e);
    if (!g) return;

    renderAsk(e, t);
    renderFlow(e, t);
    renderRuns(e, t);

    const c = camAt(t, g);
    e.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(k * c.z).toFixed(5)}) translate(${(-c.cx).toFixed(2)}px,${(-c.cy).toFixed(2)}px)`;
    renderTakeover(e, t, W);
  },
};

function lift(e) {
  if (e.lift !== null) return e.lift;
  const m = e.main.getBoundingClientRect();
  if (!m.height) return 0;
  const s = m.height / e.main.offsetHeight;
  const comp = e.composer.getBoundingClientRect(), hero = e.hero.getBoundingClientRect();
  const compH = comp.height / s, heroH = hero.height / s, mh = e.main.offsetHeight;
  const top = (mh - (heroH + 34 + compH)) / 2;
  e.hero.style.top = top.toFixed(2) + 'px';
  e.lift = (comp.top - m.top) / s - (top + heroH + 34);
  return e.lift;
}

// empty state, typing, send, the plan
function renderAsk(e, t) {
  const typing = t >= T_TYPE && t < T_SEND;
  const n = Math.round(ASK.length * seg(t, T_TYPE, T_TYPE + ASK.length / CPS));
  const ph = typing ? `<span class="qc-typed">${esc(ASK.slice(0, n))}</span><i class="qc-caret"></i>` : esc(e.phText);
  if (ph !== e.lastPh) { e.ph.innerHTML = ph; e.lastPh = ph; }
  e.send.classList.toggle('qc-on', typing);
  e.send.style.transform = `scale(${(1 - 0.16 * bump(seg(t, T_SEND - 0.12, T_SEND + 0.2))).toFixed(4)})`;

  const up = lift(e);
  const drop = inOutCubic(seg(t, T_SEND - 0.08, T_SEND + 0.42));
  e.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
  const heroIn = outCubic(seg(t, 0.15, 0.8)), heroOut = outCubic(seg(t, T_SEND - 0.1, T_SEND + 0.3));
  e.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
  e.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

  appear(e.ask, t, T_SEND + 0.05);
  appear(e.plan, t, T_PLAN);
  const sw = e.planSw;
  sw.classList.toggle('qc-done', t >= T_PLAN_OK);
  sw.style.setProperty('--sh', `${(100 - ((t - T_PLAN) * 140) % 200).toFixed(1)}%`);
  spinOk(sw, t, T_PLAN, T_PLAN_OK);
  appear(e.planTx, t, T_PLAN_OK + 0.1, 6);
  // the thread hands the chat over to the flow
  const out = inOutCubic(seg(t, T_OPEN, T_OPEN + 0.5));
  e.feed.style.opacity = (1 - out).toFixed(3);
  e.feed.style.transform = `translateY(${(-out * 30).toFixed(2)}px)`;
}

function appear(n, t, a, dy = 12) {
  const p = outCubic(seg(t, a, a + 0.5));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translate3d(0,${((1 - p) * dy).toFixed(2)}px,0)`;
}

function spinOk(sw, t, a, done) {
  const spin = sw.querySelector('.qc-spin'), ok = sw.querySelector('.qc-st .qc-ok');
  spin.style.opacity = (1 - seg(t, done - 0.08, done + 0.06)).toFixed(3);
  spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
  const o = seg(t, done, done + 0.3);
  ok.style.opacity = o.toFixed(3);
  ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
}

// the canvas assembling, then each node's state and the edges' hand-offs
function renderFlow(e, t) {
  const on = seg(t, T_OPEN + 0.2, T_OPEN + 0.6);
  e.flow.style.opacity = on.toFixed(3);
  e.flow.style.visibility = on > 0 ? 'visible' : 'hidden';
  appear(e.bar, t, T_OPEN + 0.25, 8);
  ORDER.forEach((m, i) => {
    const n = e.nodes[m.key];
    const p = outBack(seg(t, T_OPEN + 0.35 + i * 0.09, T_OPEN + 0.8 + i * 0.09));
    const r = runOf(m.key), u = t - r.s;
    const state = u >= U.done ? 'done' : u >= 0 ? 'run' : 'wait';
    if (n.dataset.st !== state) n.dataset.st = state;
    n.style.opacity = clamp(p * 1.2).toFixed(3);
    n.style.transform = `scale(${lerp(0.88, 1, p).toFixed(4)})`;
    n.style.setProperty('--ring', state === 'run' ? (0.55 + 0.45 * Math.sin((t - r.s) * 6)).toFixed(3) : '0');
    n.querySelector('.fg-spin').style.transform = `rotate(${((t - r.s) * 420).toFixed(1)}deg)`;
    const ok = n.querySelector('.fg-ns .qc-ok');
    const o = seg(u, U.done, U.done + 0.3);
    ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  });
  e.edges.forEach((ed, i) => {
    const draw = inOutCubic(seg(t, T_OPEN + 0.55 + i * 0.05, T_OPEN + 1.05 + i * 0.05));
    ed.base.style.opacity = draw.toFixed(3);
    const r = runOf(ed.from);
    const f = inOutCubic(seg(t - r.s, U.pkt, U.pktEnd));
    ed.lit.style.strokeDashoffset = (ed.len * (1 - f)).toFixed(2);
    const vis = f > 0 && f < 1;
    ed.pk.style.opacity = vis ? '1' : '0';
    if (vis) {
      const pt = ed.lit.getPointAtLength(ed.len * f);
      ed.pk.style.transform = `translate(${pt.x.toFixed(2)}px, ${(pt.y + 0).toFixed(2)}px)`;
    }
  });
  const cur = RUNS.filter((r) => t >= r.s).length;
  const stat = t < RUN0 ? 'queued' : t >= RUNS[5].s + 3.35 ? 'done · 6/6' : `running ${cur}/6`;
  if (e.stat.textContent !== stat) e.stat.textContent = stat;
}

// each run: switch chip, model chip, the stage opening onto the model's output and closing again
function renderRuns(e, t) {
  let app = 'superbot', swapAt = -1, chip = 0;
  RUNS.forEach((r, i) => {
    const u = t - r.s;
    if (u >= U.swap) { app = r.m.key; swapAt = r.s + U.swap; }
    const sw = e.sws[i];
    const vis = outCubic(seg(u, 0, 0.3)) * (1 - seg(u, 3.7, 4.0));
    chip = Math.max(chip, vis);
    sw.style.opacity = vis.toFixed(3);
    sw.style.visibility = vis > 0 ? 'visible' : 'hidden';
    if (vis > 0) {
      sw.classList.toggle('qc-done', u >= 0.55);
      sw.style.setProperty('--sh', `${(100 - (u * 140) % 200).toFixed(1)}%`);
      spinOk(sw, u, 0, 0.55);
      const tp = outBack(seg(u, 0.05, 0.45));
      sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
      sw.style.transform = `translateY(${((1 - outCubic(seg(u, 0, 0.3))) * 8).toFixed(2)}px)`;
    }
    // the stage: grows out of its node, plays, folds back in (the render node's never folds: the film leaves it)
    const { st, s } = e.stages[i];
    const open = inOutCubic(seg(u, U.open, U.play));
    const shut = r.m.key === 'render' ? 0 : inOutCubic(seg(u, U.close, U.shut));
    const f = open * (1 - shut);
    st.style.visibility = f > 0.001 ? 'visible' : 'hidden';
    if (f <= 0.001) return;
    const [nx, ny] = NODE[r.m.key];
    const nw = r.m.key === 'render' ? RW : NW, nh = r.m.key === 'render' ? RH : NH;
    const g = e.g;
    const s0 = nw / SW;
    const x0 = nx + nw / 2 - (SW * s0) / 2 - g.sx, y0 = ny + nh / 2 - (SH * s0) / 2 - g.sy;
    st.style.transform = `translate(${lerp(x0, 0, f).toFixed(2)}px, ${lerp(y0, 0, f).toFixed(2)}px) scale(${lerp(s0, 1, f).toFixed(5)})`;
    st.style.opacity = clamp(f * 6).toFixed(3);
    r.m.render(s, Math.max(0, u - U.play));
  });
  if (t >= T_SEND) e.ph.style.opacity = (1 - chip).toFixed(3);
  // composer model chip: dips, swaps, pops
  if (app !== e.lastApp) {
    const mark = app === 'superbot' || app === 'render';
    e.plat.img.style.display = mark ? 'none' : '';
    e.plat.mark.style.display = mark ? 'block' : 'none';
    if (!mark) { e.plat.img.src = APPS[app].logo; e.plat.img.dataset.app = app; }
    e.plat.name.textContent = app === 'superbot' ? 'superbot' : APPS[app].name;
    e.lastApp = app;
  }
  e.plat.plat.style.opacity = swapAt < 0 ? '1' : (1 - 0.85 * bump(seg(t, swapAt - 0.14, swapAt + 0.14))).toFixed(3);
  const pop = swapAt < 0 ? 1 : 1 + 0.1 * bump(seg(t, swapAt, swapAt + 0.4));
  e.plat.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the film leaves the render monitor and fills the frame
function renderTakeover(e, t, W) {
  const box = e.filmBox;
  if (t < T_FILM - 0.05) { box.style.visibility = 'hidden'; return; }
  box.style.visibility = 'visible';
  const mon = e.stages[5].st.querySelector('.rn-mon');
  if (!e.monBox || e.monBox.W !== W) {
    const b = boxIn(mon, e.root);
    e.monBox = { ...b, W };
  }
  const m = e.monBox;
  const f = inOutCubic(seg(t, T_FILM, T_FILM + 0.7));
  const x = lerp(m.x, 0, f), y = lerp(m.y, 0, f), w = lerp(m.w, W, f), h = lerp(m.h, H, f);
  box.style.left = x.toFixed(2) + 'px';
  box.style.top = y.toFixed(2) + 'px';
  box.style.width = w.toFixed(2) + 'px';
  box.style.height = h.toFixed(2) + 'px';
  box.style.borderRadius = `${lerp(10, 0, f).toFixed(2)}px`;
  // a non-16:9 frame letterboxes the film inside the box
  const fw = Math.min(w, (h * 16) / 9);
  fitFilm(e.film, fw);
  e.film.root.style.left = ((w - fw) / 2).toFixed(2) + 'px';
  e.film.root.style.top = ((h - (fw * 9) / 16) / 2).toFixed(2) + 'px';
  renderFilm(e.film, t - T_FILM);
}
