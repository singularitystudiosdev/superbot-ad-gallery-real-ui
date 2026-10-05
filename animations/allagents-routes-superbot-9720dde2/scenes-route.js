// scenes-route.js: one request in, the router reads what it needs and hands it to Opus 5.5, Gemini or DeepSeek.
import { W, H, el, put, box, pose, fade, seg, sp, ez, lerp, ease, PRESETS, mascot, tile, tileHTML, esc, ICON, MODELS, caption, camera, applyCam, typed, switchPill } from './core.js';
import { shell, composer } from './ui.js';

const LANES = ['opus', 'gemini', 'deepseek'];

/** the hub chat, full frame: each request is typed, routed (three lanes scored), switched, billed to a plan */
export function routeChat({ reqs, caps }) {
  const { root, cam, over } = shell();
  const CX = 330, CW = 1260, BH = 760, T = 3.05, b0 = 0.35;
  const feed = put(cam, 'div', 'feed');
  const comp = composer(cam, CX, 852, CW);
  const blocks = reqs.map((r, i) => {
    const top = i * BH + 150;
    const bub = put(feed, 'div', 'ubub'); bub.textContent = r.q;
    bub.style.right = `${W - (CX + CW)}px`; bub.style.top = `${top}px`;
    const card = put(feed, 'div', 'rcard'); box(card, CX, top + 104, 900);
    const m = mascot(30);
    const head = put(card, 'div', 'rc-h'); head.appendChild(m.el);
    head.insertAdjacentHTML('beforeend', `<b>Routing</b><span class="rc-need">needs <b>${esc(r.need)}</b></span>`);
    const lanes = LANES.map((k, j) => {
      const M = MODELS[k];
      const ln = put(card, 'div', 'lane');
      ln.innerHTML = `${tileHTML(M.logo, 40)}<span class="ln-n"><b>${esc(M.name)}</b><i>on your ${esc(M.plan)} plan</i></span><span class="ln-gap"></span><span class="ln-best">best fit</span><span class="ln-bar"><span></span></span>`;
      return { el: ln, bar: ln.querySelector('.ln-bar > span'), best: ln.querySelector('.ln-best'), fit: r.fit[j], win: k === r.m };
    });
    const pill = switchPill(r.m);
    feed.appendChild(pill.el); box(pill.el, CX, top + 452);
    const rep = put(feed, 'div', 'reply'); box(rep, CX, top + 528, CW);
    rep.innerHTML = `<div class="rp-h">${tileHTML(MODELS[r.m].logo, 30)}<b>${esc(MODELS[r.m].name)}</b><span class="mut">· billed to your ${esc(MODELS[r.m].plan)} plan</span></div><div class="rp-t"></div>`;
    const b = b0 + i * T;
    return { r, bub, card, m, lanes, pill, rep, rpt: rep.querySelector('.rp-t'), b, top };
  });
  // timings within a request (relative to b)
  const S = { send: 0.78, card: 0.95, bars: 1.1, pick: 1.62, pill: 1.86, done: 2.24, reply: 2.38 };
  const dur = b0 + reqs.length * T + 0.5;
  const scrollKeys = [[0, { y: 0 }]];
  const camKeys = [[0, { x: W / 2, y: 560, s: 1 }]];
  blocks.forEach((B, i) => {
    if (i) scrollKeys.push([B.b + S.send, { y: -i * BH }]);
    const cardY = 150 + 104 + 150; // card centre on screen once scrolled
    camKeys.push([B.b + S.card, { x: W / 2, y: cardY - 80, s: i === 0 ? 1.32 : 1.2 }]);
    camKeys.push([B.b + S.pill - 0.05, { x: CX + 560, y: 150 + 452 + 30 - 60, s: i === 0 ? 1.5 : 1.38, preset: PRESETS.default }]);
    camKeys.push([B.b + S.reply + 0.15, { x: W / 2, y: 560, s: 1, preset: PRESETS.default }]);
  });
  const cam1 = camera(camKeys);
  const scroll = camera(scrollKeys.map(([t, v]) => [t, { y: v.y }]), PRESETS.default);
  const capA = caption(over, [{ text: caps[0] }], { size: 52, y: 64 });
  const capB = caption(over, [{ text: caps[1] }], { size: 52, y: 64 });
  const cues = [];
  blocks.forEach((B) => {
    cues.push({ t: B.b + 0.05, type: 'tick', gain: 0.2 }, { t: B.b + S.send, type: 'click', gain: 0.6 }, { t: B.b + S.card, type: 'whoosh', gain: 0.3 });
    cues.push({ t: B.b + S.pick, type: 'pop', gain: 0.6 }, { t: B.b + S.done, type: 'click', gain: 0.55 });
  });

  function render(t) {
    applyCam(cam, cam1(t));
    feed.style.transform = `translateY(${scroll(t).y.toFixed(2)}px)`;
    let typing = '', model = 'auto', pop = 0, press = 0;
    blocks.forEach((B, i) => {
      const lt = t - B.b, r = B.r;
      if (lt >= 0 && lt < S.send) typing = typed(r.q, lt, 0.02, r.q.length / 0.66);
      press = Math.max(press, seg(lt, S.send, S.send + 0.2) * (lt < S.send + 0.2 ? 1 : 0));
      if (lt >= S.pill) { model = r.m; pop = seg(lt, S.pill, S.pill + 0.3); }
      const kb = sp(lt, S.send, PRESETS.snappy);
      pose(B.bub, { y: (1 - kb) * 50, s: 0.96 + 0.04 * kb, o: seg(lt, S.send, S.send + 0.12) });
      const kc = sp(lt, S.card, PRESETS.default);
      pose(B.card, { y: (1 - kc) * 30, o: seg(lt, S.card, S.card + 0.15) });
      B.m.render(t);
      B.lanes.forEach((L, j) => {
        const kf = sp(lt, S.bars + j * 0.06, PRESETS.default);
        L.bar.style.transform = `scaleX(${(L.fit * kf).toFixed(4)})`;
        const pk = seg(lt, S.pick, S.pick + 0.18);
        L.el.classList.toggle('pick', L.win && lt >= S.pick);
        fade(L.el, L.win ? 1 : 1 - 0.6 * pk);
        const kw = sp(lt, S.pick, PRESETS.playful);
        pose(L.best, { s: 0.5 + 0.5 * kw, o: L.win ? seg(lt, S.pick, S.pick + 0.1) : 0 });
      });
      const kp = sp(lt, S.pill, PRESETS.snappy);
      pose(B.pill.el, { y: (1 - kp) * 16, s: 0.94 + 0.06 * kp, o: seg(lt, S.pill, S.pill + 0.12) });
      B.pill.render(lt, S.done);
      const kr = sp(lt, S.reply, PRESETS.default);
      pose(B.rep, { y: (1 - kr) * 14, o: seg(lt, S.reply, S.reply + 0.15) });
      const v = typed(r.a, lt, S.reply + 0.15, 70);
      if (B.rpt.textContent !== v) B.rpt.textContent = v;
    });
    comp.render(t, { text: typing, model, pop, press });
    capA.render(t, 0.15, blocks[1].b - 0.2);
    capB.render(t, blocks[1].b + 0.05);
  }
  return { dur, root, render, cues };
}

/** B: a switchboard. The request travels into the router, which reads what it needs and sends it down the wire to one model */
export function rails({ reqs, caps }) {
  const { root, cam, over } = shell();
  const RQ = { x: 110, y: 380, w: 540, h: 300 };
  const RT = { x: 930, y: 560, r: 92 };
  const MX = 1260, MW = 560, MH = 150, MY = [300, 560, 820];
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'wires'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  cam.appendChild(svg);
  const mk = (d) => { const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', d); svg.appendChild(p); return p; };
  const inD = `M ${RQ.x + RQ.w} ${RT.y} L ${RT.x - RT.r} ${RT.y}`;
  const outD = MY.map((y) => `M ${RT.x + RT.r} ${RT.y} C ${RT.x + RT.r + 150} ${RT.y} ${MX - 160} ${y} ${MX} ${y}`);
  const base = [mk(inD), ...outD.map(mk)];
  base.forEach((p) => p.setAttribute('class', 'w-base'));
  const live = [mk(inD), ...outD.map(mk)];
  live.forEach((p) => { p.setAttribute('class', 'w-live'); const L = p.getTotalLength(); p.style.strokeDasharray = `${L} ${L}`; p.dataset.len = L; });
  const packet = put(cam, 'div', 'packet');
  // request card
  const rq = put(cam, 'div', 'rqcard'); box(rq, RQ.x, RQ.y, RQ.w, RQ.h);
  rq.innerHTML = '<div class="rq-h"><span class="mut">POST</span> /v1/chat/completions</div><div class="rq-m"><span class="mut">"model":</span> <b>"auto"</b></div><div class="rq-q"></div>';
  const rqq = rq.querySelector('.rq-q');
  const qs = reqs.map((r) => { const q = put(rqq, 'div', 'rq-qi', `“${esc(r.q)}”`); return q; });
  // router node
  const rt = put(cam, 'div', 'router'); box(rt, RT.x - RT.r, RT.y - RT.r, RT.r * 2, RT.r * 2);
  const rm = mascot(104); rt.appendChild(rm.el);
  const ring = put(rt, 'span', 'r-ring');
  const need = put(cam, 'div', 'r-need'); box(need, RT.x - 220, RT.y + RT.r + 24, 440);
  const needs = reqs.map((r) => put(need, 'div', 'r-needi', `needs <b>${esc(r.need)}</b>`));
  // model nodes
  const nodes = LANES.map((k, j) => {
    const M = MODELS[k];
    const n = put(cam, 'div', 'mnode'); box(n, MX, MY[j] - MH / 2, MW, MH);
    n.innerHTML = `${tileHTML(M.logo, 64)}<div class="mn-t"><b>${esc(M.name)}</b><i>on your ${esc(M.plan)} plan</i></div><span class="mn-ok">${ICON.check}</span>`;
    return { el: n, ok: n.querySelector('.mn-ok'), k };
  });
  const T = 2.9, b0 = 0.55;
  const S = { qIn: 0, go: 0.45, at: 0.85, read: 0.85, out: 1.3, hit: 1.85, clear: 2.75 };
  const dur = b0 + reqs.length * T + 0.3;
  const cap1 = caption(over, [{ text: caps[0] }], { y: 64 });
  const cap2 = caption(over, [{ text: caps[1] }], { y: 64 });
  const cam1 = camera([[0, { x: W / 2, y: 600, s: 1.06 }], [0.5, { y: 570, s: 1, preset: PRESETS.heavy }], [b0 + T * 2 + S.hit, { x: W / 2 + 120, y: 640, s: 1.08, preset: PRESETS.heavy }]]);
  const cues = [];
  reqs.forEach((r, i) => { const b = b0 + i * T; cues.push({ t: b + S.go, type: 'whoosh', gain: 0.35 }, { t: b + S.read, type: 'tick', gain: 0.5 }, { t: b + S.out, type: 'whoosh', gain: 0.45 }, { t: b + S.hit, type: 'pop', gain: 0.75 }); });

  function render(t) {
    applyCam(cam, cam1(t));
    rm.render(t);
    const ke = sp(t, 0.05, PRESETS.default);
    pose(rq, { x: (1 - ke) * -80, o: seg(t, 0.05, 0.25) });
    pose(rt, { s: 0.6 + 0.4 * sp(t, 0.2, PRESETS.playful), o: seg(t, 0.2, 0.35) });
    nodes.forEach((n, j) => { const k = sp(t, 0.3 + j * 0.08, PRESETS.default); pose(n.el, { x: (1 - k) * 80, o: seg(t, 0.3 + j * 0.08, 0.5 + j * 0.08) }); });
    base.forEach((p, j) => p.style.opacity = seg(t, 0.35, 0.6).toFixed(3));
    let px = -100, py = -100, po = 0;
    const cur = Math.max(0, Math.min(reqs.length - 1, Math.floor((t - b0) / T)));
    reqs.forEach((r, i) => {
      const b = b0 + i * T, lt = t - b;
      const j = LANES.indexOf(r.m);
      // the request text swaps
      // slot swap inside the clipped prompt box: the old line lifts out as the new one rises in
      const last = i === reqs.length - 1;
      const qin = ease.outQuint(seg(lt, S.qIn + 0.08, S.qIn + 0.6)), qout = last ? 0 : ease.inCubic(seg(lt, T - 0.04, T + 0.26));
      pose(qs[i], { y: (1 - qin) * 170 - qout * 170, o: lt >= S.qIn ? 1 : 0 });
      const nin = seg(lt, S.read, S.read + 0.2), nout = last ? 0 : seg(lt, S.clear, S.clear + 0.2);
      pose(needs[i], { y: (1 - ease.outCubic(nin)) * 14, o: nin * (1 - nout) });
      if (i !== cur) return;
      // packet: in-wire, then out-wire j
      const f1 = ez(lt, S.go, S.at, ease.inOutCubic), f2 = ez(lt, S.out, S.hit, ease.inOutCubic);
      const Lin = +live[0].dataset.len, Lout = +live[1 + j].dataset.len;
      live[0].style.strokeDashoffset = `${(Lin * (1 - f1)).toFixed(1)}`;
      live[0].style.opacity = (1 - seg(lt, S.clear, S.clear + 0.2)).toFixed(3);
      LANES.forEach((k, jj) => { const p = live[1 + jj]; const L = +p.dataset.len; p.style.strokeDashoffset = `${(jj === j ? L * (1 - f2) : L).toFixed(1)}`; p.style.opacity = (1 - seg(lt, S.clear, S.clear + 0.2)).toFixed(3); });
      if (lt >= S.go && lt < S.at) { const pt = live[0].getPointAtLength(Lin * f1); px = pt.x; py = pt.y; po = 1; }
      else if (lt >= S.out && lt < S.hit + 0.05) { const pt = live[1 + j].getPointAtLength(Lout * f2); px = pt.x; py = pt.y; po = 1 - seg(lt, S.hit - 0.02, S.hit + 0.05); }
      // router reads
      const rd = seg(lt, S.at, S.out);
      ring.style.transform = `rotate(${(lt * 540).toFixed(1)}deg)`;
      fade(ring, rd > 0 && rd < 1 ? 1 : 0);
      rt.classList.toggle('busy', rd > 0 && rd < 1);
      nodes.forEach((n, jj) => {
        const hit = jj === j && lt >= S.hit && lt < S.clear + (last ? 9 : 0);
        n.el.classList.toggle('pick', hit);
        const dim = lt >= S.hit && jj !== j && lt < S.clear + (last ? 9 : 0) ? 0.4 : 1;
        n.el.style.opacity = (seg(t, 0.3 + jj * 0.08, 0.5 + jj * 0.08) * dim).toFixed(3);
        const kk = sp(lt, S.hit, PRESETS.playful);
        pose(n.ok, { s: 0.4 + 0.6 * kk, o: hit ? 1 : 0 });
        if (hit) n.el.style.transform = `scale(${(1 + 0.03 * Math.exp(-(lt - S.hit) * 6) * Math.sin((lt - S.hit) * 18)).toFixed(4)})`;
        else if (lt >= S.hit) n.el.style.transform = '';
      });
    });
    pose(packet, { x: px - 14, y: py - 14, o: po });
    cap1.render(t, 0.25, b0 + T * 2 - 0.1);
    cap2.render(t, b0 + T * 2 + 0.15);
  }
  return { dur, root, render, cues };
}
