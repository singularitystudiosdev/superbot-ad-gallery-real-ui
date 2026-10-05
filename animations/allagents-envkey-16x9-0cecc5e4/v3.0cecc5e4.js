// V3 "One .env line": five provider keys collapse into one Superbot key -> one request splits
// across Opus / Gemini / DeepSeek on a live wiring diagram -> four agent tabs fold into one ->
// a per-model timeline labels every step -> line. Scenes join with whip pans, not fades.
import { boot, h, at, sp, P, clamp, lerp, win, typed, smooth, eio, ramp, blinkOn, mark, driveMark, tile, caption, pill, M, AGENTS } from './core.0cecc5e4.js';
import { agentWin, sbWin, stepRow, endLock, codePanel } from './ui.0cecc5e4.js';

const DUR = 30;
const KEYS = [
  ['claude', 'ANTHROPIC_API_KEY', 'sk-ant-api03-••••••••••••'],
  ['openai', 'OPENAI_API_KEY', 'sk-proj-••••••••••••••••'],
  ['gemini', 'GEMINI_API_KEY', 'AIza••••••••••••••••••'],
  ['deepseek', 'DEEPSEEK_API_KEY', 'sk-••••••••••••••••••••'],
  ['cursor', 'CURSOR_API_KEY', 'key_••••••••••••••••••'],
];
const T_KEYS = 0.25, T_COLLAPSE = 2.75, T_NEWKEY = 3.75, T_BASE = 4.75;
const NEWKEY = 'sbc_live_7Hq2k9Vd3RmxLw8pTz4e';
const LH = 54;
const BASE = 'https://beta.superbot.gg/v1';
// flow geometry (stage px)
const REQ_C = [360, 540], RTR_C = [870, 540];
const NODES = [['opus', 300], ['gem', 540], ['ds', 780]];
const NODE_X = 1320;
const PACKETS = [
  { label: 'Plan the checkout flow', to: 0, t: 9.0 },
  { label: 'Read 41 payment files', to: 1, t: 9.55 },
  { label: 'Write the unit tests', to: 2, t: 10.1 },
];
const TRAVEL = 0.9;
const TAB_T = [13.35, 13.85, 14.35, 14.85];
const FOLD = 15.45;
const LANES = [
  ['opus', [['Plan checkout flow', 0, 0.17], ['Review the diff', 0.83, 1]]],
  ['gem', [['Read src/payments · 41 files', 0.12, 0.4]]],
  ['gpt', [['Stripe webhook handler', 0.34, 0.66]]],
  ['ds', [['24 unit tests', 0.43, 0.72], ['README', 0.7, 0.84]]],
];
const BLK = { opus: 'opus', gem: 'gem', gpt: 'gpt', ds: 'ds' };
const PH0 = 19.2, PH1 = 24.4, TRACK_W = 1180;

// whip pan: scene slides in from the right and out to the left with motion blur
function whip(el, t, a, b, d = 0.45) {
  const on = t >= a && t < b;
  el.style.display = on ? '' : 'none';
  if (!on) return false;
  const i = 1 - eio(ramp(t, a, a + d)), o = eio(ramp(t, b - d, b));
  const x = i * 420 - o * 420;
  const v = Math.max(Math.sin(Math.PI * clamp(ramp(t, a, a + d))) * (i > 0 ? 1 : 0), Math.sin(Math.PI * clamp(ramp(t, b - d, b))) * (o > 0 ? 1 : 0));
  el.style.transform = `translateX(${x.toFixed(2)}px)`;
  el.style.opacity = Math.min(1 - i * 0.9, 1 - o * 0.9).toFixed(3);
  el.style.filter = v > 0.02 ? `blur(${(v * 10).toFixed(2)}px)` : 'none';
  return true;
}
const bez = (p0, p1, p2, p3, u) => {
  const m = 1 - u;
  return [0, 1].map((k) => m * m * m * p0[k] + 3 * m * m * u * p1[k] + 3 * m * u * u * p2[k] + u * u * u * p3[k]);
};
const wire = (y) => [[RTR_C[0] + 130, RTR_C[1]], [1120, RTR_C[1]], [1120, y], [NODE_X, y]];

async function build(stage) {
  // ---- S0 .env ----
  const s0 = h('div', 'layer'); stage.appendChild(s0);
  const E = codePanel('<span style="color:#d8d8dc">.env</span><span class="em" style="margin-left:auto;color:#6e6e76">5 keys</span>',
    KEYS.map(([, k, v], i) => ({ no: i + 1, html: `<span class="vr">${k}</span>=<span class="st">${v}</span>` })).concat([
      { no: 1, html: '<span class="vr">SUPERBOT_API_KEY</span>=<span class="st nk"></span>' },
      { no: 2, html: '<span class="vr">OPENAI_BASE_URL</span>=<span class="st bu"></span>' },
    ]), 1240);
  at(E.el, 290, 360); s0.appendChild(E.el);
  E.el.style.width = '1340px';
  const cpb = E.el.querySelector('.cp-b');
  cpb.style.position = 'relative';
  cpb.style.fontSize = '30px';
  cpb.style.lineHeight = LH + 'px';
  E.lines.forEach((ln, i) => { ln.style.position = 'absolute'; ln.style.left = '0'; ln.style.right = '0'; ln.style.top = 20 + (i % 5) * LH + 'px'; ln.style.paddingLeft = '104px'; });
  const em = E.el.querySelector('.em');
  const gut = KEYS.map(([lg], i) => { const x = tile(lg, 38); x.style.position = 'absolute'; at(x, 290 + 26, 360 + 50 + 20 + i * LH + (LH - 38) / 2); s0.appendChild(x); return x; });
  const nk = E.el.querySelector('.nk'), bu = E.el.querySelector('.bu');
  const keyBadge = h('div', 'tile superbot'); keyBadge.style.cssText += ';position:absolute;width:38px;height:38px;border-radius:10px';
  const kbm = mark(28); keyBadge.appendChild(kbm.host); at(keyBadge, 290 + 26, 360 + 50 + 20 + (LH - 38) / 2); s0.appendChild(keyBadge);

  // ---- S1 flow ----
  const s1 = h('div', 'layer'); stage.appendChild(s1);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'wires'); s1.appendChild(svg);
  const mkPath = (d, stroke, w) => { const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', d); p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', w); svg.appendChild(p); return p; };
  const wIn = mkPath(`M${REQ_C[0] + 230} ${REQ_C[1]} L${RTR_C[0] - 130} ${RTR_C[1]}`, '#34343c', 3);
  const wires = NODES.map(([, y]) => { const [a, b, c, d] = wire(y); return mkPath(`M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`, '#34343c', 3); });
  const hots = NODES.map(([, y]) => { const [a, b, c, d] = wire(y); return mkPath(`M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`, '#6f86ff', 3); });
  const req = h('div', 'bubble'); req.style.cssText += ';width:460px;left:130px;top:470px;font-size:24px;box-shadow:inset 0 0 0 1.5px #2c4596';
  req.innerHTML = '<div style="font-size:15px;font-weight:700;letter-spacing:.12em;color:#6a6d7a;margin-bottom:8px">YOUR REQUEST</div><span class="rq"></span>';
  s1.appendChild(req);
  const rq = req.querySelector('.rq');
  const RQ = 'Add Stripe checkout, read the payments code, write the tests.';
  const rtr = h('div', 'node'); rtr.style.cssText += ';left:740px;top:490px;height:100px;padding:0 26px 0 18px;border-radius:24px';
  const rm = mark(64); rtr.appendChild(rm.host); rtr.appendChild(h('span', '', 'Superbot router'));
  s1.appendChild(rtr);
  const nodes = NODES.map(([k, y]) => {
    const n = h('div', 'node'); n.appendChild(tile(M[k].logo)); n.appendChild(h('span', '', M[k].name)); n.appendChild(h('span', 'np', `$${M[k].out.toFixed(2)}/1M`));
    at(n, NODE_X, y - 38); s1.appendChild(n); return n;
  });
  const packets = PACKETS.map((p) => { const c = h('div', 'chip', p.label); c.style.cssText += ';position:absolute;left:0;top:0;padding:0 16px;height:40px;font-size:17px;background:#232637;box-shadow:inset 0 0 0 1.5px #5d78e8'; s1.appendChild(c); return c; });

  // ---- S2 tabs fold ----
  const s2 = h('div', 'layer'); stage.appendChild(s2);
  const tabs = h('div', 'tabs'); at(tabs, 0, 150); tabs.style.left = '50%'; s2.appendChild(tabs);
  const tabEls = AGENTS.map((a) => { const x = h('div', 'tabx'); x.appendChild(tile(a.logo)); x.appendChild(h('span', '', a.name)); x.appendChild(h('span', 'x', '×')); tabs.appendChild(x); return x; });
  const sbTab = h('div', 'tabx'); const sbt = mark(30); sbTab.appendChild(sbt.host); sbTab.appendChild(h('span', '', 'Superbot')); sbTab.style.cssText += ';position:absolute;left:50%;top:150px;box-shadow:inset 0 0 0 1.5px #5d78e8;background:#1d1f2b';
  s2.appendChild(sbTab);
  const ind = h('div', ''); ind.style.cssText = 'position:absolute;top:218px;height:3px;border-radius:2px;background:linear-gradient(90deg,#5d91ec,#866cf6)'; s2.appendChild(ind);
  const wins = AGENTS.map((a) => { const w = agentWin(a.key); at(w.el, 960 - 430, 250); w.el.style.transform = 'scale(1.18)'; w.el.style.transformOrigin = '50% 0'; s2.appendChild(w.el); return w; });
  const SB = sbWin({ sub: 'one tab · one key · every step routed' }); at(SB.el, 370, 250); SB.el.style.height = '560px'; s2.appendChild(SB.el);
  const sbSteps = [['Plan the checkout flow', 'opus', 16.9], ['Read src/payments · 41 files', 'gem', 17.25], ['Write the unit tests', 'ds', 17.6]].map(([tx, m, ti]) => { const r = stepRow(tx, m, ''); SB.steps.appendChild(r.el); return { r, ti }; });

  // ---- S3 lanes ----
  const s3 = h('div', 'layer'); stage.appendChild(s3);
  const lh = h('div', ''); lh.style.cssText = 'position:absolute;left:220px;top:205px;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:650;letter-spacing:-.01em;color:#f2f2f4';
  const lhm = mark(44); lh.appendChild(lhm.host); lh.appendChild(h('span', '', 'ship stripe checkout with tests and docs'));
  s3.appendChild(lh);
  const clock = h('div', 'mono'); clock.style.cssText = 'position:absolute;right:220px;top:214px;font-size:22px;color:#8e8e93'; s3.appendChild(clock);
  const lanes = LANES.map(([k, blocks], i) => {
    const ln = h('div', 'lane'); at(ln, 220, 330 + i * 110);
    const ll = h('div', 'll'); ll.appendChild(tile(M[k].logo)); ll.appendChild(h('span', '', M[k].name)); ln.appendChild(ll);
    const trk = h('div', 'track'); ln.appendChild(trk);
    const bl = blocks.map(([label, a, b]) => { const x = h('div', 'blk ' + BLK[k], label); x.style.left = a * TRACK_W + 'px'; trk.appendChild(x); return { x, a, b }; });
    s3.appendChild(ln);
    return { ln, bl };
  });
  const ph = h('div', 'playhead'); ph.style.left = 220 + 300 + 'px'; ph.style.top = '300px'; s3.appendChild(ph);

  // ---- S4 end ----
  const s4 = h('div', 'layer'); stage.appendChild(s4);
  const END = endLock('One API key · drop-in replacement · <b>beta.superbot.gg</b>'); s4.appendChild(END.el);

  const pillP = pill(stage, 'Superbot, all your agents in one');
  const cap = caption(stage, [
    [0.35, 2.7, 'Five providers. Five keys. Five bills.'],
    [2.9, 4.65, 'Superbot packs every plan into <b>one key</b>.'],
    [4.8, 6.3, 'A drop-in replacement. Nothing else changes.'],
    [6.95, 8.95, 'One request. Superbot splits it up.'],
    [9.05, 12.8, 'Each part goes to the model that fits it.'],
    [13.4, 15.35, 'Four agents. Four tabs. Four logins.'],
    [15.6, 18.6, 'Now <b>one tab</b> runs all of them.'],
    [19.1, 21.9, 'Every step, labeled by the model that ran it.'],
    [22.0, 25.4, 'Opus 5.5 plans and reviews. Cheaper models do the rest.'],
  ]);

  let tabBox = [];
  const paint = (t) => {
    // S0 .env
    if (whip(s0, t, -1, 6.6)) {
      const pu = sp(t, 0, P.heavy);
      E.el.style.transform = `translateY(${((1 - pu) * 40).toFixed(2)}px)`;
      const cu = eio(ramp(t, T_COLLAPSE, T_COLLAPSE + 0.6));
      KEYS.forEach((_, i) => {
        const ln = E.lines[i];
        const ti = T_KEYS + i * 0.28;
        ln.style.opacity = (win(t, ti, Infinity, 0.2) * (1 - cu)).toFixed(3);
        ln.style.clipPath = `inset(0 ${((1 - eio(ramp(t, ti, ti + 0.35))) * 100).toFixed(2)}% 0 0)`;
        ln.style.transform = `translateY(${(-cu * i * LH).toFixed(2)}px) scaleX(${(1 - 0.3 * cu).toFixed(4)})`;
        ln.style.transformOrigin = '0 50%';
        const g = gut[i];
        g.style.opacity = (win(t, ti, Infinity, 0.2) * (1 - smooth((t - T_COLLAPSE - 0.45) / 0.2))).toFixed(3);
        g.style.transform = `translateY(${(-cu * i * LH).toFixed(2)}px) scale(${(1 - 0.3 * cu).toFixed(3)})`;
      });
      cpb.style.height = lerp(5 * LH + 40, 2 * LH + 40, eio(ramp(t, T_COLLAPSE + 0.5, T_COLLAPSE + 1.1))).toFixed(1) + 'px';
      em.textContent = t < T_COLLAPSE + 0.5 ? '5 keys' : '1 key';
      const nu = sp(t, T_COLLAPSE + 0.55, P.playful);
      keyBadge.style.opacity = t >= T_COLLAPSE + 0.55 ? 1 : 0;
      keyBadge.style.transform = `scale(${(0.3 + 0.7 * nu).toFixed(4)})`;
      driveMark(kbm, t);
      E.lines[5].style.opacity = t >= T_COLLAPSE + 0.6 ? 1 : 0;
      nk.textContent = typed(NEWKEY, t, T_NEWKEY - 0.3, 36);
      E.lines[6].style.opacity = t >= T_BASE ? 1 : 0;
      E.lines[6].style.top = 20 + LH + 'px';
      bu.textContent = typed(BASE, t, T_BASE, 34);
      const z = sp(t, T_COLLAPSE + 0.6, P.heavy);
      E.el.style.transform += ` scale(${(1 + 0.08 * z).toFixed(4)})`;
    }
    // S1 flow
    if (whip(s1, t, 6.4, 13.25)) {
      rq.textContent = typed(RQ, t, 6.9, 40);
      const ru = sp(t, 6.75, P.default);
      req.style.transform = `translateY(${((1 - ru) * 30).toFixed(2)}px)`;
      const rtu = sp(t, 7.2, P.heavy);
      rtr.style.opacity = clamp(rtu * 1.5).toFixed(3);
      rtr.style.transform = `scale(${(0.8 + 0.2 * rtu).toFixed(4)})`;
      driveMark(rm, t, { happy: t > 10.9 && t < 11.6, glitch: t > 8.55 && t < 8.75 ? 1 : 0 });
      const wl = (p, u) => { const L = p.getTotalLength(); p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${(L * (1 - u)).toFixed(1)}`; };
      wl(wIn, eio(ramp(t, 8.3, 8.6)));
      wires.forEach((w, i) => wl(w, eio(ramp(t, 7.5 + i * 0.12, 8.2 + i * 0.12))));
      nodes.forEach((n, i) => {
        const u = sp(t, 7.6 + i * 0.12, P.default);
        n.style.opacity = clamp(u * 1.5).toFixed(3);
        n.style.transform = `translateX(${((1 - u) * 40).toFixed(2)}px)`;
        const arrive = PACKETS.find((p) => p.to === i).t + TRAVEL;
        const hu = sp(t, arrive, P.snappy);
        n.classList.toggle('hot', t >= arrive);
        if (t >= arrive) n.style.transform += ` scale(${(1 + 0.06 * Math.sin(Math.PI * clamp((t - arrive) / 0.35))).toFixed(4)})`;
        n.style.opacity = (clamp(u * 1.5) * (t >= arrive ? 1 : t > 8.9 ? 0.55 + 0.45 * hu : 1)).toFixed(3);
      });
      hots.forEach((w, i) => { const p = PACKETS.find((q) => q.to === i); wl(w, eio(ramp(t, p.t, p.t + TRAVEL))); w.style.opacity = t >= p.t ? 1 : 0; });
      packets.forEach((c, j) => {
        const p = PACKETS[j];
        const on = t >= p.t - 0.25 && t < p.t + TRAVEL;
        c.style.display = on ? '' : 'none';
        if (!on) return;
        const u = 0.12 + eio(ramp(t, p.t, p.t + TRAVEL)) * 0.68;
        const [x, y] = bez(...wire(NODES[p.to][1]), u);
        const w = c.offsetWidth;
        const o = win(t, p.t - 0.25, p.t + TRAVEL, 0.2, 0.28);
        c.style.opacity = o.toFixed(3);
        c.style.transform = `translate(${(x - w / 2).toFixed(2)}px,${(y - 20).toFixed(2)}px) scale(${(0.8 + 0.2 * o).toFixed(3)})`;
      });
    }
    // S2 tabs fold into one
    if (whip(s2, t, 13.05, 18.85)) {
      const tw = tabs.offsetWidth;
      tabs.style.marginLeft = (-tw / 2).toFixed(1) + 'px';
      const active = TAB_T.reduce((a, tt, i) => (t >= tt ? i : a), 0);
      const fu = sp(t, FOLD, P.default);
      tabEls.forEach((x, i) => {
        const e = sp(t, 13.15 + i * 0.08, P.default);
        const cx = tabBox[i] ? tabBox[i][0] + tabBox[i][1] / 2 : 0;
        const dx = (tw / 2 - cx) * fu;
        x.style.opacity = (clamp(e * 1.5) * (1 - smooth((t - FOLD - 0.15) / 0.3))).toFixed(3);
        x.style.transform = `translate(${dx.toFixed(2)}px,${((1 - e) * -20).toFixed(2)}px) scaleX(${(1 - 0.6 * fu).toFixed(4)})`;
        x.style.background = i === active && t >= TAB_T[0] ? '#25252b' : '';
        x.style.color = i === active ? '#fff' : '#9a9aa2';
      });
      // sliding underline between tabs (stiff leading edge, soft trailing edge)
      if (tabBox.length) {
        let L = tabBox[0][0], R = L + tabBox[0][1];
        for (let i = 1; i < TAB_T.length; i++) {
          const [pl, pw] = tabBox[i - 1], [nl, nw] = tabBox[i];
          L += (nl - pl) * sp(t, TAB_T[i], { k: 140, d: 22 });
          R += (nl + nw - pl - pw) * sp(t, TAB_T[i], P.snappy);
        }
        const base = 960 - tw / 2;
        ind.style.left = (base + L).toFixed(2) + 'px';
        ind.style.width = (R - L).toFixed(2) + 'px';
        ind.style.opacity = (win(t, TAB_T[0], Infinity, 0.2) * (1 - fu)).toFixed(3);
      }
      const su = sp(t, FOLD + 0.2, P.playful);
      sbTab.style.display = t >= FOLD + 0.2 ? '' : 'none';
      sbTab.style.transform = `translateX(-50%) scale(${(0.5 + 0.5 * su).toFixed(4)})`;
      sbTab.style.opacity = clamp(su * 1.5).toFixed(3);
      driveMark(sbt, t);
      wins.forEach((w, i) => {
        const on = i === active && t < FOLD + 0.45;
        w.el.style.display = on ? '' : 'none';
        if (!on) return;
        const e = sp(t, 13.2, P.default);
        const fo = smooth((t - FOLD) / 0.4);
        w.el.style.opacity = (clamp(e * 1.4) * (1 - fo)).toFixed(3);
        w.el.style.transform = `translateY(${((1 - e) * 30).toFixed(2)}px) scale(${(1.18 - 0.2 * fo).toFixed(4)})`;
        w.inEl.textContent = typed(['plan the checkout', 'write the webhook', 'read src/payments', 'refactor the cart'][i], t, TAB_T[i] + 0.1, 30);
        w.cur.style.opacity = blinkOn(t) ? 1 : 0;
      });
      const sbu = sp(t, FOLD + 0.3, P.heavy);
      SB.el.style.display = t >= FOLD + 0.25 ? '' : 'none';
      SB.el.style.opacity = clamp((t - FOLD - 0.25) / 0.3).toFixed(3);
      SB.el.style.transform = `translateY(${((1 - sbu) * 30).toFixed(2)}px) scale(${(0.9 + 0.1 * sbu).toFixed(4)})`;
      SB.tiles.forEach((x, j) => { const u = sp(t, FOLD + 0.6 + j * 0.1, P.snappy); x.style.opacity = clamp(u * 1.5).toFixed(3); x.style.transform = `scale(${(0.4 + 0.6 * u).toFixed(3)})`; });
      driveMark(SB.mark, t, { happy: t > FOLD + 0.9 && t < FOLD + 1.6 }); driveMark(SB.titleMark, t);
      SB.inEl.textContent = typed('ship stripe checkout with tests and docs', t, FOLD + 0.7, 38);
      SB.cur.style.opacity = blinkOn(t) ? 1 : 0;
      sbSteps.forEach(({ r, ti }) => r.paint(t, ti, ti + 0.9));
    }
    // S3 lanes
    if (whip(s3, t, 18.65, 25.75)) {
      driveMark(lhm, t);
      const pu = eio(ramp(t, PH0, PH1));
      ph.style.transform = `translateX(${(pu * TRACK_W).toFixed(2)}px)`;
      ph.style.opacity = win(t, PH0 - 0.2, 25.2, 0.2, 0.3).toFixed(3);
      const secs = Math.floor(pu * 41);
      clock.textContent = `elapsed 0:${String(secs).padStart(2, '0')}`;
      lanes.forEach((l, i) => {
        const e = sp(t, 18.85 + i * 0.1, P.default);
        l.ln.style.opacity = clamp(e * 1.5).toFixed(3);
        l.ln.style.transform = `translateX(${((1 - e) * 30).toFixed(2)}px)`;
        l.bl.forEach((b) => {
          const grown = clamp((pu - b.a) / (b.b - b.a));
          b.x.style.width = (grown * (b.b - b.a) * TRACK_W).toFixed(2) + 'px';
          b.x.style.opacity = pu > b.a ? 1 : 0;
          b.x.style.color = grown > 0.35 ? '#fff' : 'transparent';
        });
      });
    }
    // S4 end
    if (whip(s4, t, 25.5, DUR + 1, 0.5)) END.paint(t, 25.7);
    pillP(t, win(t, 6.8, 25.3, 0.3, 0.3));
    cap(t);
  };
  paint.measure = () => { tabBox = tabEls.map((x) => [x.offsetLeft, x.offsetWidth]); };
  return paint;
}

boot({ dur: DUR, build });
