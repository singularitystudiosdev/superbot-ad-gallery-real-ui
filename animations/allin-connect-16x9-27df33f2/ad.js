// allin-connect-16x9-27df33f2: "Superbot is all your agents in one", connect cut (32 s, 16:9).
// 1) superbot Keys page: four subscriptions connect, each key part flies into one sk-superbot key.
// 2) Playground: three requests on that key, the router scores Opus 5.5 / Gemini / DeepSeek, picks one.
// 3) Desk: Claude Code, Codex, Gemini CLI and Cursor each hit their own limit, then merge into one
//    superbot agent that labels every step with the model it routed to. 4) cost bars. 5) end line.
import { h, $, $$, op, tf, clamp, lerp, smooth, outCubic, inOutCubic, sp, PRESETS, tile, PLANS, PLAN, KEY_PRE, REQS, ROUTE_MODELS, scramble, typed, makeMark, makeCursor, placeCursor, pressScale, camera, makeCaption, makeChrome, makeBars, makeEnd, boot, win } from './kit.js';
import { LINE, AGENTS, makeAgentWin, limAt, makeSbAgent, posIn, arc, tokChip } from './allin.js';

export const DUR = 32;
export const T = {
  conn: [1.0, 1.75, 2.5, 3.25], link: 0.35, fly: 0.6,
  full: 4.25, copy: 5.55, tabB: 7.7, req: [8.25, 10.3, 12.35],
  desk: 14.6, run0: 15.15, runGap: 0.2, merge: 18.0, sba0: 18.45, bars: 25.0, end: 28.4,
};
const CH = { x: 210, y: 60, w: 1500, h: 900 };
const GRID = [[140, 80], [980, 80], [140, 560], [980, 560]];
const FROM = [[-900, -300], [900, -300], [-900, 400], [900, 400]];
const SBA_POS = { x: 210, y: 100, w: 1500, h: 840 };

let S = null;

function side() {
  return `<div class="side"><div class="brand"><span class="bmk"></span><b>superbot</b></div>
    ${['Chat', 'Agent', 'Playground', 'API keys', 'Usage', 'Settings'].map((n) => `<div class="ni" data-n="${n}"><i></i>${n}</div>`).join('')}</div>`;
}

function pageA() {
  return `<div class="pg pgA">
    <h2>API key</h2>
    <div class="sbkey kc"><div class="lbl">Your superbot key</div>
      <div class="key"><span class="pre">${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}">····</span>`).join('')}</div>
      <div class="kc-ft"><span class="cnt num">0 of 4 subscriptions packed</span><span class="copy">Copy</span></div>
      <div class="toast">Copied to clipboard</div></div>
    <div class="subs-h">Subscriptions</div>
    ${PLANS.map((p, i) => `<div class="srow" style="--c:${p.color};top:${362 + i * 94}px">${tile(p.id)}<div class="sn"><b>${p.plan}</b><small>${p.vendor} · ${p.model}</small></div>
      <div class="cb"><span class="c0">Connect</span><span class="c1"><i class="spin"></i>Linking</span><span class="c2"><i class="okd"></i>Connected</span></div></div>`).join('')}
  </div>`;
}

function pageB() {
  return `<div class="pg pgB">
    <h2>Playground</h2><span class="auto">model: auto</span>
    <div class="req"><div><span class="k">POST</span> https://beta.superbot.gg/v1/chat/completions</div>
      <div><span class="dim">Authorization:</span> Bearer ${KEY_PRE}7Kq9xR2mLw4TpD8v</div>
      <div>{ <span class="s">"model"</span>: <span class="s">"auto"</span>, <span class="s">"messages"</span>: [ <span class="dim">…</span> ] }</div></div>
    <div class="pbar"><span class="ptx"></span><span class="pcaret"></span><span class="send">Send</span></div>
    <div class="scrimB"></div>
    <div class="pop rt"><div class="rt-h"><b>Router</b><span>scoring 3 models for this request</span></div>
      ${ROUTE_MODELS.map((id) => `<div class="mrow" style="--c:${PLAN[id].color}">${tile(id)}<div class="nm">${PLAN[id].model}<small>via ${PLAN[id].plan}</small></div><div class="bar"><i style="background:${PLAN[id].color}"></i></div><div class="sc num">0.00</div></div>`).join('')}
      ${REQS.map((r) => `<div class="rt-res"><span class="ar">→</span>${tile(r.plan, 'xs')}<b>${PLAN[r.plan].model}</b><span class="dim">billed to ${PLAN[r.plan].plan} · ${r.why}</span></div>`).join('')}
    </div>
  </div>`;
}

function mount(stage) {
  const wA = h(`<div class="world wA"></div>`);
  const chrome = makeChrome([{ title: 'superbot · API keys', host: 'beta.superbot.gg/keys' }, { title: 'superbot · Playground', host: 'beta.superbot.gg/playground' }], CH.w, CH.h);
  tf(chrome.el, ''); chrome.el.style.left = CH.x + 'px'; chrome.el.style.top = CH.y + 'px';
  chrome.body.innerHTML = side() + pageA() + pageB();
  const bmk = makeMark(30); $(chrome.body, '.bmk').appendChild(bmk.el);
  wA.appendChild(chrome.el);
  const toks = PLANS.map((p) => { const el = h(tokChip(p)); wA.appendChild(el); return el; });
  const cur = makeCursor(); wA.appendChild(cur);

  const wC = h(`<div class="world wC"></div>`);
  const wins = AGENTS.map((a, i) => { const w = makeAgentWin(a, 800, 440); w.el.style.left = GRID[i][0] + 'px'; w.el.style.top = GRID[i][1] + 'px'; wC.appendChild(w.el); return w; });
  const sba = makeSbAgent(SBA_POS.w, SBA_POS.h);
  sba.el.style.left = SBA_POS.x + 'px'; sba.el.style.top = SBA_POS.y + 'px';
  wC.appendChild(sba.el);
  const flash = h(`<div class="flash"></div>`); wC.appendChild(flash);
  const chips = AGENTS.map((a) => { const el = h(`<div class="achip">${tile(a.logo, 'sm')}<b>${a.name}</b></div>`); wC.appendChild(el); return el; });

  const sceneA = h(`<div class="scene"></div>`); sceneA.appendChild(wA);
  const sceneC = h(`<div class="scene"></div>`); sceneC.appendChild(wC);
  const bars = makeBars(), end = makeEnd(LINE);
  const cap = makeCaption([
    [0.35, 3.95, 'Connect the subscriptions you already pay for.'],
    [4.15, 7.45, 'Superbot packs all of them into one API key.'],
    [7.95, 10.35, 'Send any request with that one key.'],
    [10.55, 14.35, 'Superbot routes it to Opus 5.5, Gemini or DeepSeek.'],
    [14.95, 17.85, 'Four agents. Four bills. Four usage limits.'],
    [18.65, 21.45, 'Superbot merges them into one agent.'],
    [21.65, 24.75, 'Every step runs on the best model for it.'],
  ]);
  stage.append(sceneA, sceneC, bars.el, end.el, cap.el);
  S = { wA, chrome, bmk, toks, cur, wC, wins, sba, flash, chips, sceneA, sceneC, bars, end, cap, geo: null };
}

function geometry() {
  const { wA, chrome, sba, wC } = S;
  const b = chrome.body;
  const cbs = $$(b, '.cb').map((e) => posIn(e, wA));
  const sgs = $$(b, '.sg').map((e) => posIn(e, wA));
  const kc = posIn($(b, '.kc'), wA), copy = posIn($(b, '.copy'), wA), send = posIn($(b, '.send'), wA), rt = posIn($(b, '.rt'), wA);
  const rail = $$(sba.el, '.rrow').map((e) => { const p = posIn(e, sba.el); return { x: SBA_POS.x + p.x + 40, y: SBA_POS.y + p.cy }; });
  return { cbs, sgs, kc, copy, send, rt, rail };
}

function renderA(t) {
  const { chrome, toks, cur, wA, bmk } = S, g = S.geo, b = chrome.body;
  // camera: wide on the page, push into the key once all four are packed, back out for the playground
  const kcx = g.kc.cx, kcy = g.kc.cy;
  camera(wA, t, [[0, 960, 520, 0.94], [T.full + 0.05, 960, 520, 0.95], [T.full + 0.6, kcx, kcy + 40, 1.42], [T.tabB - 0.2, kcx + 30, kcy + 40, 1.46],
    [T.tabB + 0.1, 960, 540, 1.0], [T.req[0] + 0.7, g.rt.cx, g.rt.cy + 80, 1.12], [T.desk, g.rt.cx, g.rt.cy + 80, 1.15]]);
  const tab = chrome.setTab(t, [[0, 0], [T.tabB, 1]]);
  $$(b, '.ni').forEach((n) => n.classList.toggle('on', n.dataset.n === (t < T.tabB + 0.05 ? 'API keys' : 'Playground')));
  bmk.render(t);
  const fB = smooth((t - T.tabB) / 0.28);
  op($(b, '.pgA'), 1 - fB); op($(b, '.pgB'), fB);
  tf($(b, '.pgB'), `translateY(${(1 - fB) * 16}px)`);

  // connect buttons, tokens, key segments
  const rows = $$(b, '.srow'), segs = $$(b, '.sg');
  let packed = 0;
  PLANS.forEach((p, i) => {
    const c = T.conn[i], tl = c + T.link, ta = tl + T.fly;
    const cb = $(rows[i], '.cb');
    op($(cb, '.c0'), t < c + 0.05 ? 1 : 0);
    op($(cb, '.c1'), t >= c + 0.05 && t < tl ? 1 : 0);
    op($(cb, '.c2'), t >= tl ? 1 : 0);
    tf($(cb, '.spin'), `rotate(${t * 520}deg)`);
    cb.classList.toggle('on', t >= tl);
    tf(cb, `scale(${pressScale(t, [c])})`);
    rows[i].classList.toggle('lit', t >= tl);
    // token: pops out of the button, arcs into its segment
    const tk = toks[i];
    if (t >= tl - 0.05 && t < ta + 0.12) {
      const u = inOutCubic((t - tl) / T.fly), pos = arc(u, { x: g.cbs[i].cx, y: g.cbs[i].cy }, { x: g.sgs[i].cx, y: g.sgs[i].cy }, 160);
      const kin = sp(t, tl - 0.05, PRESETS.playful);
      tf(tk, `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) scale(${(0.5 + 0.5 * kin) * (1 - 0.45 * smooth((u - 0.7) / 0.3))})`);
      op(tk, Math.min(smooth((t - tl + 0.05) / 0.1), 1 - smooth((t - ta) / 0.12)));
    } else op(tk, 0);
    const sg = segs[i];
    sg.textContent = t < ta ? '····' : scramble(p.seg, t, ta, 0.3, 11 + i);
    sg.classList.toggle('in', t >= ta);
    sg.style.setProperty('--u', outCubic((t - ta) / 0.4).toFixed(3));
    if (t >= ta) packed++;
  });
  $(b, '.cnt').textContent = packed === 4 ? '4 subscriptions · 1 key' : `${packed} of 4 subscriptions packed`;
  const kc = $(b, '.kc'), glow = Math.exp(-Math.max(0, t - T.full) * 1.6) * (t >= T.full ? 1 : 0);
  kc.style.setProperty('--glow', glow.toFixed(3));
  tf(kc, `scale(${1 + 0.025 * glow * Math.sin(clamp((t - T.full) / 0.5) * Math.PI)})`);
  const copy = $(b, '.copy');
  tf(copy, `scale(${pressScale(t, [T.copy])})`);
  copy.classList.toggle('done', t >= T.copy + 0.05);
  const tst = $(b, '.toast'), kt = sp(t, T.copy + 0.08, PRESETS.snappy);
  op(tst, smooth((t - T.copy - 0.08) / 0.12) * (1 - smooth((t - T.copy - 1.5) / 0.25)));
  tf(tst, `translateY(${(1 - kt) * 14}px)`);

  // playground: three requests through one router card
  const ptx = $(b, '.ptx'), pcar = $(b, '.pcaret');
  let ri = 0; for (let i = 0; i < 3; i++) if (t >= T.req[i] - 0.1) ri = i;
  const r = REQS[ri], tq = T.req[ri];
  const cps = r.text.length / 0.6;
  ptx.textContent = t < tq ? '' : (t < tq + 0.7 ? typed(r.text, t, tq, cps) : r.text);
  ptx.style.opacity = t > tq + 0.75 ? 0.45 : 1;
  pcar.style.opacity = t > tq + 0.7 ? '0' : (Math.floor(t * 2.4) % 2 ? '0.25' : '1');
  tf($(b, '.send'), `scale(${pressScale(t, T.req.map((q) => q + 0.68))})`);
  const rt = $(b, '.rt'), k0 = sp(t, T.req[0] + 0.78, PRESETS.snappy);
  op(rt, smooth((t - T.req[0] - 0.78) / 0.14));
  tf(rt, `translateY(${(1 - k0) * 30}px) scale(${0.94 + 0.06 * k0})`);
  op($(b, '.scrimB'), 0.62 * smooth((t - T.req[0] - 0.75) / 0.25));
  const mrows = $$(rt, '.mrow'), res = $$(rt, '.rt-res');
  ROUTE_MODELS.forEach((id, j) => {
    const prev = ri > 0 ? REQS[ri - 1].fit[j] : 0, kb = sp(t, tq + 0.82 + j * 0.05, PRESETS.default);
    const v = lerp(prev, r.fit[j], clamp(kb, 0, 1.08));
    $(mrows[j], '.bar i').style.width = (clamp(v) * 100).toFixed(2) + '%';
    $(mrows[j], '.sc').textContent = clamp(v).toFixed(2);
    const won = t >= tq + 1.28 && r.plan === id;
    mrows[j].classList.toggle('won', won);
    tf(mrows[j], `scale(${won ? 1 + 0.02 * Math.exp(-(t - tq - 1.28) * 4) : 1})`);
  });
  res.forEach((e, j) => {
    const a = j === ri ? smooth((t - T.req[j] - 1.3) / 0.16) : 0;
    op(e, a); tf(e, `translateY(${(1 - a) * 10}px)`);
  });

  // cursor: four connects, copy, three sends
  const keys = [[0, 1500, 980]];
  T.conn.forEach((c, i) => { keys.push([c - 0.42, g.cbs[i].cx + 6, g.cbs[i].cy + 4]); keys.push([c + 0.3, g.cbs[i].cx + 6, g.cbs[i].cy + 4]); });
  keys.push([T.copy - 0.55, g.copy.cx + 4, g.copy.cy + 4], [T.copy + 0.5, g.copy.cx + 4, g.copy.cy + 4]);
  T.req.forEach((q) => { keys.push([q + 0.2, g.send.cx, g.send.cy + 4]); keys.push([q + 1.1, g.send.cx, g.send.cy + 4]); });
  placeCursor(cur, t, keys, [...T.conn, T.copy, ...T.req.map((q) => q + 0.68)], smooth((t - 0.35) / 0.3) * (1 - smooth((t - T.desk + 0.5) / 0.3)));
}

function renderC(t) {
  const { wC, wins, sba, flash, chips } = S, g = S.geo;
  camera(wC, t, [[T.desk, 960, 540, 0.9], [T.merge, 960, 540, 0.9], [T.sba0 + 0.4, 960, 520, 0.98], [T.sba0 + 1.8, 830, 560, 1.06], [T.bars, 830, 560, 1.08]]);
  const mu = inOutCubic((t - T.merge) / 0.55);
  wins.forEach((w, i) => {
    const kin = sp(t, T.desk + i * 0.11, PRESETS.snappy);
    const ex = FROM[i][0] * (1 - kin), ey = FROM[i][1] * (1 - kin);
    const cx = GRID[i][0] + 400, cy = GRID[i][1] + 220;
    const mx = (960 - cx) * mu, my = (520 - cy) * mu, rot = (i % 2 ? 1 : -1) * 4 * mu;
    tf(w.el, `translate(${ex + mx}px, ${ey + my}px) rotate(${rot}deg) scale(${1 - 0.5 * mu})`);
    op(w.el, smooth((t - T.desk - i * 0.11) / 0.2) * (1 - smooth((t - T.merge - 0.35) / 0.2)));
    const run0 = T.run0 + i * T.runGap;
    w.render(t - run0);
    // the limit line flashes once when it lands
    const la = run0 + limAt(AGENTS[i]);
    w.el.style.setProperty('--hit', (t >= la ? Math.exp(-(t - la) * 3) : 0).toFixed(3));
  });
  // merge flash + superbot window
  const fk = t - (T.merge + 0.4);
  op(flash, fk > 0 ? Math.exp(-fk * 3.2) : 0);
  tf(flash, `translate(960px, 520px) translate(-50%, -50%) scale(${0.3 + 2.4 * outCubic(fk / 0.7)})`);
  const ks = sp(t, T.sba0, PRESETS.heavy);
  op(sba.el, smooth((t - T.sba0) / 0.18));
  tf(sba.el, `scale(${0.5 + 0.5 * ks})`);
  sba.render(t - T.sba0 - 0.35);
  // each agent's chip lands on the rail row of the plan it used to burn
  AGENTS.forEach((a, i) => {
    const t0 = T.sba0 + 0.15 + i * 0.07, u = inOutCubic((t - t0) / 0.6);
    const to = g.rail[PLANS.findIndex((p) => p.id === a.plan)];
    const p = arc(u, { x: 960, y: 520 }, to, 90);
    tf(chips[i], `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${1 - 0.35 * u})`);
    op(chips[i], smooth((t - t0) / 0.1) * (1 - smooth((t - t0 - 0.55) / 0.12)));
  });
}

function render(t) {
  if (!S.geo) S.geo = geometry();
  const aA = 1 - smooth((t - T.desk + 0.2) / 0.35);
  const aC = win(t, T.desk - 0.15, T.bars + 0.05, 0.3, 0.3);
  op(S.sceneA, aA); op(S.sceneC, aC);
  tf(S.sceneA, `scale(${1 - 0.05 * smooth((t - T.desk + 0.2) / 0.35)})`);
  if (aA > 0) renderA(t);
  if (aC > 0) renderC(t);
  const aB = win(t, T.bars - 0.1, T.end + 0.1, 0.3, 0.3);
  op(S.bars.el, aB); if (aB > 0) S.bars.render(t - T.bars);
  tf(S.bars.el, `scale(${1.03 - 0.03 * smooth((t - T.bars + 0.1) / 0.5)})`);
  const aE = smooth((t - T.end) / 0.3);
  op(S.end.el, aE); if (aE > 0) S.end.render(t - T.end);
  S.cap.render(t);
}

if (typeof document !== 'undefined') boot({ DUR, mount, render });
