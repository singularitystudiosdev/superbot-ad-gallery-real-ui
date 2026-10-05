// engine.mjs: one cinematic ad engine, three cuts. The whole spot is a pure function
// of time: subscriptions stream into a single sbc_ key, requests route through an
// OpenRouter-style panel that bills every route to a plan you already pay for, the
// subscription meter holds at $0.00 while a pay-per-token counter climbs, and it ends
// on "Open router for your subscriptions."
//
// Beats (seconds):
//   0.0-3.9   headline, four subscription orbs materialise
//   3.4-7.3   orbs stream into the key; sbc_ assembles segment by segment
//   7.3-17.8  router panel: three requests route to Opus 5.5 / Gemini 3.1 Pro / DeepSeek
//   17.8-21.0 subscription meter flat at $0.00 vs the climbing per-token counter
//   21.0-24.0 end card
import {
  W, H, clamp, lerp, seg, smooth, outCubic, inOutCubic, sp, win, h, op, tf, money, typed,
  PLANS, KEY_FULL, KEY_MASK, BASE_URL, listCost, tile, makeMark, makeCursor, placeCursor,
  pressScale, camera, makePlanMeter, makeTokenMeter, makeEnd, boot, PRESETS, track, spring,
} from './kit.mjs';

// selector-first DOM helpers (kit ships root-first)
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const DUR = 24;
const T = { head: 0.35, orb: 0.95, orbStep: 0.15, beam: 3.4, key: 3.9, keyType: 4.25, toRouter: 7.3, req: [8.6, 11.6, 14.6], meters: 17.8, end: 21.0 };
const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1000) + 'k');

// ---- the three routed requests -----------------------------------------------------
const REQS = [
  { t: T.req[0], ask: 'Refactor the checkout flow to strict TypeScript', tin: 142000, tout: 9000, fit: [0.97, 0.85, 0.8, 0.51], win: 0 },
  { t: T.req[1], ask: 'Summarize 14 earnings calls into one comparison table', tin: 610000, tout: 6000, fit: [0.82, 0.78, 0.96, 0.65], win: 2 },
  { t: T.req[2], ask: 'Classify 5,000 support tickets by intent', tin: 2100000, tout: 160000, fit: [0.61, 0.69, 0.73, 0.95], win: 3 },
];
REQS.forEach((r) => { r.cost = listCost(PLANS[r.win], r.tin, r.tout); });
const BASE_SPEND = REQS.reduce((a, r) => a + r.cost, 0);
const AVG = BASE_SPEND / REQS.length;
const spendAt = (t) => BASE_SPEND + (t <= T.meters ? 0 : 60 * (t - T.meters) + 140 * (t - T.meters) ** 2);

// ---- per-cut treatment -------------------------------------------------------------
export const CUTS = {
  1: {
    key: 'beam',
    kicker: 'SUPERBOT ROUTER',
    headline: ['Every AI subscription you pay for,', 'behind one API key.'],
    sub: 'Point your SDK at superbot. It routes each request to the best model across the plans you already have.',
    accent: ['#22d3ee', '#5b8dff', '#8b5cf6'],
    glow: 'rgba(91,141,255,.22)',
    bg: 'radial-gradient(1000px 620px at 20% 8%, rgba(34,211,238,.14), transparent 60%), radial-gradient(1100px 700px at 85% 20%, rgba(139,92,246,.16), transparent 62%), #07080c',
  },
  2: {
    key: 'stack',
    kicker: 'ONE KEY · MANY PLANS',
    headline: ['Four subscriptions.', 'One bill you already pay.'],
    sub: 'Not a new token bill. superbot spreads each request across the plans on your account.',
    accent: ['#8b5cf6', '#d946ef', '#fb7185'],
    glow: 'rgba(217,70,239,.2)',
    bg: 'radial-gradient(1100px 660px at 12% 12%, rgba(217,70,239,.16), transparent 62%), radial-gradient(1000px 620px at 88% 24%, rgba(251,113,133,.13), transparent 60%), #0a070c',
  },
  3: {
    key: 'terminal',
    kicker: 'DROP-IN ROUTER',
    headline: ['One key. Every model', 'you already pay for.'],
    sub: 'Swap three lines in your SDK. Every call routes to Opus 5.5, Gemini, DeepSeek or GPT on the plan behind it.',
    accent: ['#34d399', '#22d3ee', '#60a5fa'],
    glow: 'rgba(34,211,238,.2)',
    bg: 'radial-gradient(1000px 620px at 18% 10%, rgba(52,211,153,.13), transparent 60%), radial-gradient(1100px 700px at 86% 22%, rgba(96,165,250,.15), transparent 62%), #060a0b',
  },
};

let V = CUTS[1];
let R = {};

// geometry --------------------------------------------------------------------------
const ORB = (i) => ({ x: 480 + i * 320, y: 610 });
const KEY = { x: 560, y: 640, w: 800, h: 210 };
const ROW_Y = (i) => 424 + i * 100;
const RW = { x: 340, w: 1240 };
const REQ = { x: 340, y: 300, w: 1240, h: 104 };

function el(html, cls, style) { const b = h(html); if (cls) b.className += ' ' + cls; if (style) b.style.cssText += ';' + style; return b; }

// ---- background -------------------------------------------------------------------
function makeBg() {
  const b = h(`<div class="bgroot">
    <div class="bgglow"></div>
    <div class="bggrid"></div>
    <div class="bgraph"></div>
    <div class="bgdust"></div>
  </div>`);
  b.querySelector('.bgraph').textContent = 'sbc_ • route • plan • sbc_ • route • plan • sbc_ • route • plan • sbc_ • route • plan •';
  const dust = b.querySelector('.bgdust');
  const ns = b.querySelector('.bggrid');
  ns.style.backgroundImage = `linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)`;
  const dots = [];
  for (let i = 0; i < 46; i++) {
    const d = h('<i></i>');
    const x = (i * 137.5) % 100, y = (i * 61.8) % 100, s = 1 + (i % 3), sp = 6 + (i % 7);
    d.style.cssText = `left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:.28`;
    dust.appendChild(d); dots.push({ el: d, y, sp, s });
  }
  const glow = b.querySelector('.bgglow');
  return {
    el: b,
    render(t) {
      glow.style.transform = `translate(${Math.sin(t * 0.15) * 40}px, ${Math.cos(t * 0.12) * 26}px) scale(${1 + 0.05 * Math.sin(t * 0.2)})`;
      dots.forEach((d) => { d.el.style.transform = `translateY(${(-((t * d.sp) % 1300))}px)`; });
      ns.style.transform = `translateY(${(t * 8) % 64}px)`;
    },
  };
}

// ---- subscription orbs ------------------------------------------------------------
function makeOrbs() {
  const els = PLANS.map((p, i) => {
    const o = h(`<div class="orb" style="--c:${p.color}">
      <div class="oring"></div>
      <div class="otile">${tile(p.id)}</div>
      <div class="olbl"><b>${p.plan}</b><span>${p.vendor}</span></div>
    </div>`);
    return o;
  });
  return { els, render(t) {
    els.forEach((o, i) => {
      const pos = ORB(i);
      const k = sp(t, T.orb + i * T.orbStep, PRESETS.playful);
      const float = Math.sin(t * 0.9 + i * 1.7) * 9;
      const dive = smooth((t - (T.beam + i * 0.12)) / 0.42);
      const x = lerp(pos.x, KEY.x + KEY.w / 2, dive);
      const y = lerp(pos.y + float, KEY.y + 70, dive);
      const s = lerp(1, 0.34, dive) * (0.6 + 0.4 * k) * (1 + 0.03 * Math.sin(t * 2 + i));
      tf(o, `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${s})`);
      op(o, k * (1 - smooth((t - (T.beam + i * 0.12 + 0.3)) / 0.25)) * (t < T.toRouter + 0.4 ? 1 : 0));
      o.querySelector('.oring').style.transform = `scale(${1 + 0.12 * Math.sin(t * 2.4 + i * 2)})`;
      o.querySelector('.oring').style.opacity = (0.5 + 0.4 * Math.sin(t * 2.4 + i * 2)).toFixed(2);
    });
  } };
}

// ---- key card ---------------------------------------------------------------------
function makeKeyCard() {
  const card = h(`<div class="kcard">
    <div class="kc-head">
      <span class="kc-brand"><span class="kc-m"></span>superbot key</span>
      <span class="chip kc-count"><i class="dot"></i><span class="n">0</span>&nbsp;<span class="w">plans</span></span>
    </div>
    <div class="kc-monos"><span class="pre">sbc_</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}"></span>`).join('')}<span class="caret"></span></div>
    <div class="kc-foot"><span class="kc-hint mono">model: <b>auto</b> · base_url <b>${BASE_URL}</b></span><span class="kc-copy"><span class="cp">Copy key</span><span class="cpd">Copied</span></span></div>
  </div>`);
  const mark = makeMark(30);
  card.querySelector('.kc-m').appendChild(mark.el);
  return { el: card, mark,
    render(t) {
      const inn = sp(t, T.key, PRESETS.snappy);
      op(card, smooth((t - T.key) / 0.4));
      tf(card, `translateY(${(1 - inn) * 26}px) scale(${0.97 + 0.03 * inn})`);
      let landed = 0;
      $$('.sg', card).forEach((sg, i) => {
        const t0 = T.keyType + i * 0.3;
        if (t > t0) landed++;
        sg.textContent = typed(PLANS[i].seg, t, t0, 34);
        sg.style.setProperty('--u', smooth((t - t0) / 0.18).toFixed(3));
      });
      $('.kc-count .n', card).textContent = landed;
      $('.kc-count .w', card).textContent = landed === 1 ? 'plan' : 'plans';
      $('.caret', card).style.opacity = t > T.key + 0.1 && t < T.toRouter && Math.floor(t * 3.5) % 2 === 0 ? 1 : 0;
      $$('.kc-hint b', card).forEach((b) => { b.style.color = t > T.keyType + 1.3 ? 'var(--fg)' : 'var(--muted)'; });
      const copied = t > 6.7;
      $('.cp', card).style.display = copied ? 'none' : '';
      $('.cpd', card).style.display = copied ? '' : 'none';
      mark.render(t);
    },
  };
}

// ---- router panel -----------------------------------------------------------------
function makeRouter() {
  const panel = h(`<div class="router">
    <div class="reqcard">
      <div class="rq-l">Incoming request · model: auto</div>
      <div class="rq-t"><span class="txt"></span><span class="caret"></span></div>
      <div class="rq-tok mono"></div>
      <div class="rq-pill pill"><span class="ptile"></span><span class="plbl"></span><span class="spin"></span><span class="chk"></span></div>
    </div>
    <div class="thead"><span style="width:400px">Model</span><span style="width:120px">Context</span><span style="width:200px">List $ / 1M in · out</span><span style="width:220px">Fit</span><span>Billed to</span></div>
    <div class="tbody"></div>
    <div class="receipt">
      <span class="rc-l">This call</span>
      <span class="rc-list mono">list <span class="strike"><span class="v">$0.000</span></span></span>
      <span class="rc-arrow">→</span>
      <span class="rc-bill">$0.00 billed to <span class="chip plan rc-plan"></span></span>
      <span class="rc-save"><b>$0.00</b> extra</span>
    </div>
  </div>`);
  const body = $('.tbody', panel);
  const rows = PLANS.map((p, i) => {
    const r = h(`<div class="trow" style="--c:${p.color}">
      <div class="acc"></div>
      <div class="c-model">${tile(p.id, 'sm')}<div><b>${p.model}</b><span class="mono">${p.slug}</span></div></div>
      <div class="c-ctx">${p.ctx}</div>
      <div class="c-price mono"><span class="strike">$${p.pin} · $${p.pout}</span></div>
      <div class="c-fit"><div class="bar"><i></i></div><span class="sc mono">0.00</span></div>
      <div class="c-bill"><span class="chip plan">${tile(p.id)}${p.plan}</span><span class="inc">included</span></div>
      <div class="routed">Routed ✓</div>
    </div>`);
    body.appendChild(r); return r;
  });
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'conn'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '3'); path.setAttribute('pathLength', '1');
  path.setAttribute('stroke-dasharray', '1 1'); path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
  panel.appendChild(svg);
  return { el: panel, rows, path };
}

// ---- meters -----------------------------------------------------------------------
function makeMeters() {
  const wrap = h('<div class="layer meters"></div>');
  const cap = h(`<div class="m-cap">The same month of work: <b>your subscriptions</b> vs <b>paying per token</b></div>`);
  const pm = makePlanMeter('Billed to plans you already pay for');
  const tm = makeTokenMeter('What that work would cost per token');
  pm.el.style.cssText = 'position:absolute;left:150px;top:300px;width:780px;height:620px';
  tm.el.style.cssText = 'position:absolute;left:990px;top:300px;width:780px;height:620px';
  cap.style.cssText = 'position:absolute;left:150px;top:190px;width:1620px';
  wrap.append(cap, pm.el, tm.el);
  return { el: wrap, pm, tm };
}

// ---- mount ------------------------------------------------------------------------
function mount(stage) {
  stage.style.background = V.bg;
  const root = document.documentElement.style;
  root.setProperty('--grad', `linear-gradient(90deg, ${V.accent[0]} 0%, ${V.accent[1]} 50%, ${V.accent[2]} 100%)`);
  root.setProperty('--glow', V.glow);
  const world = h('<div class="world"></div>');
  const camEl = h('<div class="camroot"></div>');
  world.appendChild(camEl);
  stage.appendChild(world);

  const bg = makeBg();
  camEl.appendChild(bg.el);

  // headline block
  const head = h(`<div class="head">
    <div class="kicker"><i></i>${V.kicker}</div>
    <h1>${V.headline.map((l) => `<span>${l}</span>`).join('')}</h1>
    <p class="sub">${V.sub}</p>
  </div>`);
  camEl.appendChild(head);

  const orbs = makeOrbs();
  orbs.els.forEach((o) => camEl.appendChild(o));

  const key = makeKeyCard();
  key.el.style.cssText = `position:absolute;left:${KEY.x}px;top:${KEY.y}px;width:${KEY.w}px;height:${KEY.h}px`;
  camEl.appendChild(key.el);

  const router = makeRouter();
  router.el.style.cssText = `position:absolute;left:${RW.x}px;top:236px;width:${RW.w}px`;
  camEl.appendChild(router.el);

  const cursor = makeCursor();
  camEl.appendChild(cursor);

  const dim = h('<div class="layer dim"></div>');
  const meters = makeMeters();
  const end = makeEnd('Open router for your subscriptions.');
  stage.append(dim, meters.el, end.el);

  R = { world, camEl, bg, head, orbs, key, router, cursor, dim, meters, end };
}

// ---- render -----------------------------------------------------------------------
function render(t) {
  const { camEl, bg, head, orbs, key, router, cursor, dim, meters, end } = R;
  bg.render(t);

  // camera: ease into the key, push on each request, wide for meters/end
  const keyCx = KEY.x + KEY.w / 2, keyCy = KEY.y + 90;
  const cam = [
    [0, 960, 540, 1.0], [1.6, 960, 520, 1.03], [3.4, 960, 600, 1.1], [4.6, keyCx, keyCy + 30, 1.2], [6.6, keyCx, keyCy + 60, 1.12],
    [T.toRouter, 820, 300, 1.0], [T.toRouter + 0.6, 960, 540, 1.0],
  ];
  REQS.forEach((r, i) => {
    cam.push([r.t - 0.2, 960, 540, 1.0], [r.t + 1.2, 940, ROW_Y(r.win), 1.2], [r.t + 2.3, 960, 560, 1.1]);
    if (i === REQS.length - 1) cam.push([r.t + 2.9, 960, 560, 1.0]);
  });
  cam.push([T.meters, 960, 540, 0.98], [T.end, 960, 540, 1.0]);
  camera(camEl, t, cam);

  // headline
  op(head, smooth((t - T.head) / 0.5) * (1 - smooth((t - T.toRouter + 0.4) / 0.4)));
  head.querySelector('h1').style.transform = `translateY(${(1 - sp(t, T.head, PRESETS.heavy)) * 26}px)`;
  orbs.render(t);
  key.render(t);

  // transition to router: headline + key slide away
  const outHead = smooth((t - (T.toRouter - 0.5)) / 0.5);
  head.style.transform = `translateY(${-outHead * 60}px)`;
  const rIn = smooth((t - T.toRouter) / 0.5);
  op(router.el, (t > T.toRouter - 0.1 ? 1 : 0) * rIn * (1 - smooth((t - T.meters + 0.2) / 0.4)));
  tf(router.el, `translateY(${(1 - sp(t, T.toRouter, PRESETS.default)) * 40}px)`);
  const keyAway = smooth((t - T.toRouter) / 0.6);
  tf(key.el, `translateY(${keyAway * -220}px) scale(${1 - 0.25 * keyAway})`);
  op(key.el, (1 - keyAway) * smooth((t - T.key) / 0.4));

  // cursor choreography
  const cur = [[0, 1600, 1000], [2.0, 520, 900], [4.0, keyCx, KEY.y + 120], [6.9, 1560, 620], [T.toRouter + 0.4, 1500, 980], [T.req[0], 1000, 780], [T.meters, 1600, 980]];
  placeCursor(cursor, t, cur, [6.7], win(t, 1.4, T.toRouter + 0.5, 0.3, 0.3));

  routerPaint(t);

  // meters
  const mIn = smooth((t - T.meters) / 0.45);
  op(dim, mIn * (1 - smooth((t - T.end - 0.2) / 0.3)));
  op(meters.el, mIn * (1 - smooth((t - T.end) / 0.35)));
  tf(meters.el, `translateY(${(1 - sp(t, T.meters, PRESETS.default)) * 60}px) scale(${1 + 0.03 * seg(t, T.meters, T.end)})`);
  const mu = Math.max(0, t - T.meters);
  const use = [[0.2, 0.44], [0.1, 0.24], [0.14, 0.36], [0.08, 0.31]].map(([a, b]) => lerp(a, b, outCubic(mu / 3.2)));
  meters.pm.set(use);
  const spend = spendAt(Math.min(t, T.end + 1));
  const hist = [];
  for (let i = 0; i <= 40; i++) hist.push(spendAt(T.meters + (i / 40) * Math.max(0.01, Math.min(t, T.end + 1) - T.meters)));
  meters.tm.set(spend, spend / AVG, hist);

  // end
  op(end.el, smooth((t - T.end - 0.25) / 0.35));
  end.render(Math.max(0, t - T.end - 0.25));
}

function routerPaint(t) {
  const { router, key } = R;
  let cur = 0;
  REQS.forEach((r, i) => { if (t >= r.t - 0.1) cur = i; });
  const r = REQS[cur];
  const u = t - r.t;
  const p = PLANS[r.win];
  const req = $('.reqcard', router.el);
  $('.txt', req).textContent = typed(r.ask, t, r.t, 60);
  $('.caret', req).style.opacity = u > 0 && u < 1.1 && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  $('.rq-tok', req).textContent = u > 0.7 ? `${fmtTok(r.tin)} in · ${fmtTok(r.tout)} out` : '';
  op($('.rq-tok', req), smooth((u - 0.7) / 0.2));
  const pill = $('.rq-pill', req);
  const pk = sp(t, r.t + 0.9, PRESETS.snappy);
  op(pill, smooth((u - 0.9) / 0.15) * (1 - smooth((u - 2.7) / 0.12)));
  tf(pill, `translateY(-50%) scale(${0.86 + 0.14 * pk})`);
  $('.ptile', pill).innerHTML = tile(p.id);
  $('.plbl', pill).innerHTML = u < 1.3 ? `Trying <b>${p.model}</b>` : `Routed to <b>${p.model}</b>`;
  $('.spin', pill).style.display = u < 1.3 ? '' : 'none';
  $('.spin', pill).style.transform = `rotate(${t * 720}deg)`;
  $('.chk', pill).style.display = u < 1.3 ? 'none' : '';
  $('.rq-l', req).innerHTML = `Incoming request · <span class="mono">model: auto</span> · key <span class="mono">${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)}</span>`;

  router.rows.forEach((row, i) => {
    const f = r.fit[i];
    const fu = outCubic((u - 0.4 - i * 0.07) / 0.55);
    $('.bar i', row).style.width = (f * fu * 100).toFixed(1) + '%';
    $('.bar i', row).style.background = i === r.win && u > 1.2 ? 'var(--grad)' : '#5c5f69';
    $('.sc', row).textContent = (f * fu).toFixed(2);
    const isWin = i === r.win;
    const wk = isWin ? sp(t, r.t + 1.2, PRESETS.snappy) : 0;
    row.classList.toggle('win', isWin && u > 1.2);
    op(row, (cur === 0 ? sp(t, T.toRouter + 0.35 + i * 0.06) : 1) * (u > 1.2 && !isWin ? 0.4 : 1));
    tf(row, `translateX(${isWin ? wk * 6 : 0}px)`);
    $('.routed', row).style.opacity = isWin ? smooth((u - 1.25) / 0.15) : 0;
    $('.acc', row).style.transform = `scaleY(${isWin ? wk : 0})`;
    $('.strike', row).style.setProperty('--k', isWin ? outCubic((u - 1.6) / 0.3).toFixed(3) : 0);
    $('.c-bill .chip', row).classList.toggle('lit', isWin && u > 1.5);
    $('.c-bill .inc', row).style.opacity = isWin ? 0 : 0.6;
  });

  const y1 = 96, y2 = 189 + r.win * 100; // router-local: request card bottom → winner row centre
  router.path.setAttribute('d', `M 6 ${y1} C -74 ${y1 + 20}, -74 ${y2 - 20}, 6 ${y2}`);
  router.path.setAttribute('stroke', p.color);
  router.path.setAttribute('stroke-dashoffset', (1 - outCubic((u - 1.2) / 0.35)).toFixed(3));
  router.path.style.opacity = (1 - smooth((u - 2.6) / 0.15)).toFixed(3);

  const rec = $('.receipt', router.el);
  op(rec, smooth((u - 1.3) / 0.3));
  $('.rc-list .v', rec).textContent = u > 1.5 ? money(r.cost, 3) : '$0.000';
  $('.rc-list .strike', rec).style.setProperty('--k', outCubic((u - 1.8) / 0.3).toFixed(3));
  $('.rc-plan', rec).innerHTML = `${tile(p.id)}${p.plan}`;
  const saveK = smooth((u - 1.9) / 0.3);
  $('.rc-save', rec).style.opacity = saveK;
  $('.rc-save b', rec).textContent = money(r.cost, 3);
}

export function run(cut) {
  V = CUTS[cut] || CUTS[1];
  if (!CUTS[cut]) console.warn('unknown cut', cut, 'using 1');
  boot({ DUR, mount, render });
}

export { DUR };