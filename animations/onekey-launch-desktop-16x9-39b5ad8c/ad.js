// V2 desktop (39b5ad8c): a desktop fills with sixteen console windows, one per beat (four logins,
// four dashboards, four bills, four key pages) -> everything implodes into one key whose bow holds
// the four subscriptions and grows a tooth per plan -> one `export` line in a terminal, key pasted
// once -> a router graph sends three requests to Opus 5.5 / Gemini / DeepSeek -> cost bars -> end line.
import {
  clamp, lerp, smooth, outCubic, inCubic, inOutCubic, sp, win, seg, h, $, $$, op, tf, typed, scramble, mulberry32,
  PRESETS, PLANS, PLAN, KEY_PRE, KEY_FULL, BASE_URL, REQS, ROUTE_MODELS, tile,
  makeMark, camera, makeCaption, makeChrome, makeConsole, makeBars, makeEnd, boot,
} from './kit.js';

const DUR = 27.2;
const T = {
  implode: 6.4, key: 7.2, dock: [8.0, 8.4, 8.8, 9.2], label: 9.6, keyOut: 10.0,
  term: 10.4, cat: 10.6, env: 11.0, strike: 11.6, col: 12.0, exp: 12.2, paste: 13.2, enter: 13.6, ok: 14.0,
  rt: 14.4, req: [14.8, 17.2, 19.6], bars: 21.6, end: 23.6,
}; // 150 BPM grid: beat 0.4 s, bar 1.6 s; one window lands per beat from 0.0
const WW = 900, WH = 560, CSC = 0.62;
const CW = Math.round(WW / CSC), CH = Math.round((WH - 98) / CSC);
const PAGE_PATH = ['/login', '/usage', '/billing', '/api-keys'];
const PERM = [5, 10, 0, 15, 6, 3, 12, 9, 1, 14, 7, 4, 11, 2, 13, 8];
const LABELS = ['login', 'dashboard', 'bill', 'API key'];
const MT = [40, 230, 420]; // model node tops in the router body
const PR = '<span class="pr">~/my-app $</span> ';
const EXP = `export OPENAI_BASE_URL=${BASE_URL} OPENAI_API_KEY=`;

function rel(el, ref) {
  const a = el.getBoundingClientRect(), b = ref.getBoundingClientRect();
  const s = b.width / ref.offsetWidth;
  return { cx: (a.left - b.left + a.width / 2) / s, cy: (a.top - b.top + a.height / 2) / s };
}
const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(n / 1000) + 'k');
// shell colouring, token by token (a keyword lights up once it is complete, as in zsh)
function sh(s) {
  return s.split(/( )/).map((tok) => {
    if (tok === ' ' || !tok) return tok;
    if (/^(export|cat|npm)$/.test(tok)) return `<span class="k">${tok}</span>`;
    const eq = tok.indexOf('=');
    if (eq > 0) return `<span class="a">${tok.slice(0, eq)}</span>=<span class="s">${tok.slice(eq + 1)}</span>`;
    return tok;
  }).join('');
}

const S = {};
async function mount(stage) {
  // ---- scene 1: the desktop fills up
  S.L1 = h('<div class="layer"></div>');
  S.w1 = h('<div class="world"></div>');
  S.L1.appendChild(S.w1);
  S.wins = Array.from({ length: 16 }, (_, i) => {
    const r = mulberry32(400 + i), cell = PERM[i], p = PLANS[i % 4], page = Math.floor(i / 4);
    const x = 330 + (cell % 4) * 420 + (r() - 0.5) * 120, y = 300 + Math.floor(cell / 4) * 175 + (r() - 0.5) * 70;
    const chr = makeChrome([{ id: p.id, title: p.console, host: p.host + PAGE_PATH[page] }], WW, WH);
    const wrap = h('<div class="dw"></div>');
    wrap.appendChild(chr.el);
    const c = makeConsole(p, 50 + i, CW, CH);
    const holder = h('<div class="cxh"></div>');
    tf(holder, `scale(${CSC})`);
    holder.appendChild(c.el);
    chr.body.appendChild(holder);
    S.w1.appendChild(wrap);
    return { chr, wrap, c, p, page, x, y, rot: (r() - 0.5) * 7, s: 0.56 + r() * 0.14, t0: i * 0.4 };
  });
  // implosion order: nearest the centre goes first
  S.wins.map((w, i) => [Math.hypot(w.x - 960, w.y - 540), i]).sort((a, b) => a[0] - b[0])
    .forEach(([, i], rank) => { S.wins[i].imp = T.implode + rank * 0.022; });
  S.mbar = h('<div class="mbar"><b>Finder</b><span>File</span><span>Edit</span><span>View</span><span>Window</span><span class="clk">Mon 9:41</span></div>');
  S.tally = h(`<div class="tally">${LABELS.map(() => '<div class="tc"><b></b><span></span></div>').join('')}</div>`);
  S.L1.append(S.mbar, S.tally);
  S.tcs = $$(S.tally, '.tc').map((el) => ({ el, n: $(el, 'b'), l: $(el, 'span') }));
  stage.appendChild(S.L1);

  // ---- the key
  S.kl = h('<div class="kl"></div>');
  S.k2 = h(`<div class="k2">
    <div class="bow sbkey">${PLANS.map((p) => `<div class="slot">${tile(p.id)}</div>`).join('')}</div>
    <div class="blade sbkey"><div class="key"><span class="pre">${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}"></span>`).join('')}</div></div>
    <div class="teeth">${PLANS.map((p) => `<i style="--c:${p.color}"></i>`).join('')}</div>
    <div class="lab"><span class="l1"><b>0</b> of 4 subscriptions packed</span></div></div>`);
  S.kl.appendChild(S.k2);
  S.orbs = PLANS.map((p) => { const o = h(`<div class="orb">${tile(p.id)}</div>`); S.kl.appendChild(o); return o; });
  stage.appendChild(S.kl);

  // ---- terminal: four keys deleted, one export line, key pasted once
  S.L3 = h('<div class="layer"></div>');
  S.w3 = h('<div class="world"></div>');
  S.L3.appendChild(S.w3);
  S.term = h(`<div class="win term2"><div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><span class="ttl"><b>my-app</b> · zsh</span></div>
    <div class="tb term">${Array.from({ length: 9 }, () => '<div class="row"><span class="tx"></span></div>').join('')}</div></div>`);
  S.w3.appendChild(S.term);
  S.trows = $$(S.term, '.row').map((row) => ({ row, tx: $(row, '.tx') }));
  PLANS.forEach((p, i) => { S.trows[1 + i].row.classList.add('strike-row'); S.trows[1 + i].tx.innerHTML = sh(`${p.env}=${p.keyMask}`); });
  S.kcap = h('<div class="kcap"><span>⌘</span><span>V</span></div>');
  S.w3.appendChild(S.kcap);
  stage.appendChild(S.L3);

  // ---- router graph
  S.L4 = h('<div class="layer"></div>');
  S.w4 = h('<div class="world"></div>');
  S.L4.appendChild(S.w4);
  S.rchr = makeChrome([{ id: null, title: 'superbot', host: 'superbot.gg/router' }], 1760, 940);
  const rw = h('<div class="rtw"></div>');
  rw.appendChild(S.rchr.el);
  S.w4.appendChild(rw);
  const outD = (top) => `M980,305 C1130,305 1140,${top + 75} 1290,${top + 75}`;
  const IN_D = 'M550,305 C650,305 690,305 780,305';
  const rg = h(`<div class="rg">
    <svg width="1760" height="842" viewBox="0 0 1760 842"><defs><linearGradient id="g2" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
      <path class="edge" d="${IN_D}"/>${MT.map((tp) => `<path class="edge" d="${outD(tp)}"/>`).join('')}
      <path class="edge live li" d="${IN_D}"/>${MT.map((tp) => `<path class="edge live lo" d="${outD(tp)}"/>`).join('')}</svg>
    <div class="rq2"><div class="hd"><span class="chip"><span class="dot"></span>app.py</span><span>model=auto</span></div>
      ${REQS.map((r) => `<div class="rqt">${r.text}</div><div class="tok">${fmtTok(r.tin)} tokens in</div>`).join('')}</div>
    <div class="rnode"><div class="ring"></div><span class="m"></span><span class="nm">superbot router</span><span class="st"></span></div>
    ${ROUTE_MODELS.map((id, j) => { const m = PLAN[id]; return `<div class="mn" style="top:${MT[j]}px"><div class="r1">${tile(id)}${m.model}</div><div class="via">via ${m.plan}</div><span class="ok2"><i></i>$0.00 extra</span></div>`; }).join('')}
    ${ROUTE_MODELS.map(() => '<div class="fitc"></div>').join('')}
    <div class="pkt"></div><div class="pkt"></div>
    <div class="lg">${REQS.map((r) => { const m = PLAN[r.plan]; return `<div class="row"><span class="g">→</span> <span class="m">${m.slug}</span> <span class="d">via ${m.plan} · ${r.why} · $0.00 extra</span></div>`; }).join('')}</div></div>`);
  S.rchr.body.appendChild(rg);
  S.rmark = makeMark(110);
  $(rg, '.rnode .m').appendChild(S.rmark.el);
  S.rg = {
    li: $(rg, '.li'), lo: $$(rg, '.lo'), ring: $(rg, '.ring'), st: $(rg, '.rnode .st'),
    rqt: $$(rg, '.rqt'), tok: $$(rg, '.tok'), mn: $$(rg, '.mn'), fit: $$(rg, '.fitc'), pkt: $$(rg, '.pkt'), log: $$(rg, '.lg .row'),
  };
  stage.appendChild(S.L4);

  // ---- bars, end, caption
  S.bars = makeBars();
  S.Lb = h('<div class="layer"></div>');
  S.Lb.appendChild(S.bars.el);
  stage.appendChild(S.Lb);
  S.end = makeEnd();
  S.Le = h('<div class="layer"></div>');
  S.Le.appendChild(S.end.el);
  stage.appendChild(S.Le);
  S.cap = makeCaption([
    [0.1, 1.5, 'Log in four times.'], [1.7, 3.1, 'Watch four dashboards.'], [3.3, 4.7, 'Pay four bills.'], [4.9, 6.3, 'Juggle four API keys.'],
    [7.5, 9.9, 'Now all four fit in one key.'],
    [10.6, 12.0, 'Delete the four old keys.'], [12.2, 14.3, 'One line. Paste once.'],
    [15.0, 17.1, 'Refactors go to Opus 5.5.'], [17.4, 19.5, 'Huge documents go to Gemini.'], [19.8, 21.5, 'Bulk jobs go to DeepSeek.'],
  ]);
  stage.appendChild(S.cap.el);
}

let M = null;
function measure() {
  const probe = h('<span style="position:absolute;visibility:hidden">MMMMMMMMMMMMMMMMMMMM</span>');
  $(S.term, '.tb').appendChild(probe);
  const cw = probe.getBoundingClientRect().width / 20 / (S.term.getBoundingClientRect().width / S.term.offsetWidth);
  probe.remove();
  const paths = [S.rg.li, ...S.rg.lo].map((p) => ({ p, len: p.getTotalLength() }));
  return {
    cw, paths,
    slots: $$(S.k2, '.bow .slot').map((e) => rel(e, S.kl)),
    mids: S.rg.lo.map((p) => { const q = p.getPointAtLength(p.getTotalLength() / 2); return [q.x, q.y]; }),
  };
}

function desktop(t) {
  const s = lerp(1.06, 1.0, smooth(t / 6.4));
  tf(S.w1, `translate(960px, 540px) scale(${s}) translate(-960px, ${-560 + 20 * smooth(t / 6.4)}px)`);
  S.wins.forEach((w) => {
    if (t < w.t0) { op(w.wrap, 0); return; }
    const k = sp(t, w.t0, PRESETS.snappy);
    const e = inCubic(seg(t, w.imp, w.imp + 0.75));
    const vx = w.x - 960, vy = w.y - 540, th = 2.4 * e, R = 1 - e;
    const px = 960 + (vx * Math.cos(th) - vy * Math.sin(th)) * R;
    const py = 540 + (vx * Math.sin(th) + vy * Math.cos(th)) * R - (1 - k) * 120;
    tf(w.wrap, `translate(${px - WW / 2}px, ${py - WH / 2}px) rotate(${w.rot + 260 * e}deg) scale(${w.s * (1.12 - 0.12 * k) * (1 - 0.94 * e)})`);
    op(w.wrap, smooth((t - w.t0) / 0.12) * (1 - smooth((e - 0.7) / 0.3)));
    if (e >= 1) return;
    w.chr.setTab(t, [[0, 0]]);
    const lt = t - w.t0;
    if (w.page === 0) { w.c.set(0); w.c.login((lt - 0.05) * 30, (lt - 0.45) * 14); }
    else if (w.page === 1) w.c.set(1, smooth((lt - 0.1) / 0.7));
    else w.c.set(w.page);
    w.c.emph(w.page === 2 ? seg(lt, 0.25, 0.6) : 0, w.page === 3 ? sp(lt, 0.2, PRESETS.snappy) : 0);
  });
  const fade = 1 - smooth((t - T.implode) / 0.3);
  op(S.mbar, fade);
  op(S.tally, fade);
  S.tcs.forEach((tc, g) => {
    const n = clamp(Math.floor((t - g * 1.6) / 0.4) + 1, 0, 4);
    tc.n.textContent = n;
    tc.l.textContent = LABELS[g] + (n === 1 ? '' : 's');
    const tInc = g * 1.6 + (n - 1) * 0.4;
    op(tc.el, smooth((t - g * 1.6) / 0.15));
    tf(tc.el, `translateY(${(1 - sp(t, g * 1.6, PRESETS.snappy)) * -14}px) scale(${1 + 0.1 * Math.sin(Math.PI * clamp((t - tInc) / 0.25))})`);
  });
}

function key(t) {
  const kk = sp(t, T.key, PRESETS.heavy), kout = smooth((t - T.keyOut) / 0.4);
  let bump = 0;
  T.dock.forEach((d) => { bump += Math.sin(Math.PI * clamp((t - d) / 0.25)) * 0.015; });
  op(S.k2, smooth((t - T.key) / 0.25) * (1 - kout));
  tf(S.k2, `translateY(${(1 - kk) * 40 - kout * 70}px) scale(${(0.7 + 0.3 * kk) * (1 - 0.2 * kout) + bump})`);
  const sgs = $$(S.k2, '.key .sg'), slotTiles = $$(S.k2, '.bow .tile'), teeth = $$(S.k2, '.teeth i');
  let n = 0;
  PLANS.forEach((p, i) => {
    const dock = T.dock[i];
    if (t >= dock) n++;
    sgs[i].textContent = t < dock - 0.05 ? '····' : scramble(p.seg, t, dock - 0.05, 0.3, 9 + i);
    sgs[i].classList.toggle('ph', t < dock - 0.05);
    sgs[i].style.setProperty('--u', clamp((t - dock) / 0.3).toFixed(3));
    op(slotTiles[i], t >= dock ? 1 : 0);
    tf(slotTiles[i], `scale(${0.8 + 0.2 * sp(t, dock, PRESETS.snappy)})`);
    tf(teeth[i], `scaleY(${clamp(sp(t, dock, PRESETS.snappy), 0, 1.2).toFixed(3)})`);
    // orbit around the key, then dock into the bow
    const orbit = (tt) => {
      const a = i * Math.PI / 2 + (tt - T.key) * 2.4 - 0.6, r = 470 * outCubic(seg(tt, T.key - 0.15, T.key + 0.55));
      return [960 + Math.cos(a) * r * 1.3, 540 + Math.sin(a) * r * 0.62];
    };
    const [ox, oy] = orbit(Math.min(t, dock - 0.35));
    const u = inOutCubic(seg(t, dock - 0.35, dock));
    const x = lerp(ox, M.slots[i].cx, u), y = lerp(oy, M.slots[i].cy, u);
    tf(S.orbs[i], `translate(${x - 46}px, ${y - 46}px) scale(${0.6 + 0.4 * smooth((t - T.key + 0.15) / 0.4)})`);
    op(S.orbs[i], t < dock ? smooth((t - T.key + 0.15) / 0.2) : 0);
  });
  $(S.k2, '.lab').innerHTML = t < T.label ? `<b>${n}</b> of 4 subscriptions packed` : '4 subscriptions · <b>1 key</b>';
  op($(S.k2, '.lab'), smooth((t - T.dock[0] + 0.1) / 0.2));
}

function terminal(t) {
  camera(S.w3, t, [[10.3, 960, 540, 1.0], [11.0, 960, 500, 1.04], [12.1, 930, 380, 1.14], [13.0, 930, 300, 1.28], [13.8, 960, 420, 1.1]]);
  const caret = '<span class="caret"></span>';
  const blink = (t0) => (Math.floor((t - t0) * 2.4) % 2 === 0 ? caret : '<span class="caret" style="opacity:0"></span>');
  const R = S.trows;
  // row 0: cat .env, rows 1-4: the four old keys (struck, then collapsed)
  const cat = typed('cat .env', t, T.cat, 32);
  R[0].tx.innerHTML = PR + sh(cat) + (t < T.env ? caret : '');
  for (let j = 0; j < 5; j++) {
    const ht = 42 * (1 - smooth((t - T.col - j * 0.04) / 0.3));
    R[j].row.style.height = ht.toFixed(2) + 'px';
    if (j > 0) {
      op(R[j].tx, smooth((t - T.env - (j - 1) * 0.06) / 0.12));
      R[j].tx.style.setProperty('--k', smooth((t - T.strike - (j - 1) * 0.06) / 0.22).toFixed(3));
    }
  }
  // row 5: the one config line
  const ex = R[5];
  op(ex.row, t >= T.env + 0.3 ? 1 : 0);
  if (t < T.exp) ex.tx.innerHTML = PR + blink(T.env);
  else if (t < T.paste) {
    const s = typed(EXP, t, T.exp, 100);
    ex.tx.innerHTML = PR + sh(s) + (s.length < EXP.length ? caret : blink(T.exp));
  } else {
    const a = 1 - smooth((t - T.paste - 0.1) / 0.6);
    ex.tx.innerHTML = PR + sh(EXP) + `<span class="s pk" style="background:rgba(91,141,255,${(0.38 * a).toFixed(3)})">${KEY_FULL}</span>` + (t < T.enter ? caret : '');
  }
  // rows 6-8: npm start and the result
  op(R[6].row, t >= T.enter ? 1 : 0);
  R[6].tx.innerHTML = PR + sh(typed('npm start', t, T.enter + 0.05, 40)) + (t < T.ok ? caret : '');
  op(R[7].row, smooth((t - T.ok) / 0.12));
  R[7].tx.innerHTML = '<span class="ok">✓</span> ready · OpenAI-compatible · routing: auto';
  op(R[8].row, smooth((t - T.ok - 0.15) / 0.12));
  R[8].tx.innerHTML = '<span class="dim">  models: Opus 5.5 · GPT-6.1 · Gemini 3.1 Pro · DeepSeek V4.1, on your plans</span>';
  // ⌘V keycap above the caret
  const cx = 140 + 40 + (11 + EXP.length) * M.cw, rowTop = 120 + 86;
  const kk = sp(t, T.paste - 0.2, PRESETS.snappy), press = Math.sin(Math.PI * clamp((t - T.paste + 0.1) / 0.16));
  tf(S.kcap, `translate(${cx - 60}px, ${rowTop - 74 + press * 4}px) scale(${0.8 + 0.2 * kk})`);
  op(S.kcap, win(t, T.paste - 0.2, T.paste + 0.55, 0.12, 0.2));
}

function router(t) {
  camera(S.w4, t, [[14.3, 960, 540, 0.97], [14.8, 960, 540, 1.0], [15.9, 950, 500, 1.08], [17.2, 960, 540, 1.0], [18.3, 950, 500, 1.08], [19.6, 960, 540, 1.0], [20.7, 950, 500, 1.08], [21.4, 960, 540, 1.0]]);
  S.rchr.setTab(t, [[0, 0]]);
  S.rmark.render(t);
  const G = S.rg;
  let i = -1;
  T.req.forEach((a, j) => { if (t >= a) i = j; });
  let spin = t * 60;
  T.req.forEach((a) => { spin += 540 * smooth(seg(t, a + 0.55, a + 1.05)); });
  tf(G.ring, `rotate(${spin}deg)`);
  G.rqt.forEach((el, j) => {
    const a = T.req[j], b = j < 2 ? T.req[j + 1] : T.bars + 0.3;
    const v = Math.min(smooth((t - a) / 0.2), 1 - smooth((t - b + 0.15) / 0.15));
    op(el, v); op(G.tok[j], v);
    tf(el, `translateY(${(1 - sp(t, a, PRESETS.default)) * 16}px)`);
  });
  G.log.forEach((el, j) => { op(el, smooth((t - T.req[j] - 1.45) / 0.2)); tf(el, `translateY(${(1 - smooth((t - T.req[j] - 1.45) / 0.3)) * 10}px)`); });
  if (i < 0) {
    G.st.textContent = 'waiting for a request';
    [G.li, ...G.lo].forEach((p) => op(p, 0));
    G.pkt.forEach((p) => op(p, 0));
    G.fit.forEach((f) => op(f, 0));
    G.mn.forEach((m) => { m.classList.remove('won'); op(m, 1); op($(m, '.ok2'), 0); tf(m, 'none'); });
    return;
  }
  const a = T.req[i], b = i < 2 ? T.req[i + 1] : T.bars + 0.3, r = REQS[i], w = ROUTE_MODELS.indexOf(r.plan);
  const reset = smooth((t - b + 0.2) / 0.2);
  G.st.textContent = t < a + 0.55 ? 'request in' : t < a + 1.05 ? 'scoring 3 models' : `routed to ${PLAN[r.plan].short}`;
  // edge in draws as the packet travels
  const u0 = inOutCubic(seg(t, a + 0.15, a + 0.55));
  const [pin, ...pouts] = M.paths;
  op(G.li, 1 - reset);
  G.li.style.strokeDasharray = pin.len;
  G.li.style.strokeDashoffset = (pin.len * (1 - u0)).toFixed(1);
  const q0 = pin.p.getPointAtLength(pin.len * u0);
  tf(G.pkt[0], `translate(${q0.x}px, ${q0.y}px)`);
  op(G.pkt[0], u0 > 0 && u0 < 1 ? 1 : 0);
  // fit chips, then the winning edge draws and the packet rides it to the model
  const kf = smooth(seg(t, a + 0.55, a + 1.0));
  G.fit.forEach((f, j) => {
    f.textContent = (r.fit[j] * kf).toFixed(2);
    tf(f, `translate(${M.mids[j][0] - 30}px, ${M.mids[j][1] - 16}px)`);
    op(f, smooth((t - a - 0.55) / 0.2) * (1 - reset) * (t > a + 1.05 && j !== w ? 0.45 : 1));
    f.style.color = j === w && t > a + 1.05 ? '#fff' : '';
  });
  const u2 = inOutCubic(seg(t, a + 1.05, a + 1.45));
  G.lo.forEach((p, j) => {
    op(p, j === w ? 1 - reset : 0);
    p.style.strokeDasharray = pouts[j].len;
    p.style.strokeDashoffset = (pouts[j].len * (1 - (j === w ? u2 : 0))).toFixed(1);
  });
  const q2 = pouts[w].p.getPointAtLength(pouts[w].len * u2);
  tf(G.pkt[1], `translate(${q2.x}px, ${q2.y}px)`);
  op(G.pkt[1], u2 > 0 && u2 < 1 ? 1 : 0);
  G.mn.forEach((m, j) => {
    const won = j === w && t >= a + 1.45 && reset < 0.5;
    m.classList.toggle('won', won);
    op($(m, '.ok2'), j === w ? smooth((t - a - 1.45) / 0.15) * (1 - reset) : 0);
    tf($(m, '.ok2'), `scale(${0.7 + 0.3 * sp(t, a + 1.45, PRESETS.snappy)})`);
    if (j === w) { tf(m, `scale(${1 + 0.035 * Math.sin(Math.PI * clamp((t - a - 1.45) / 0.35))})`); op(m, 1); }
    else { tf(m, 'none'); op(m, 1 - 0.5 * smooth(seg(t, a + 1.05, a + 1.35)) * (1 - reset)); }
  });
}

function render(t) {
  if (!M) M = measure();
  const a1 = 1 - smooth((t - 7.3) / 0.1);
  op(S.L1, a1);
  if (a1 > 0) desktop(t);
  const ak = t >= 6.9 && t < 10.5;
  op(S.kl, ak ? 1 : 0);
  if (ak) key(t);
  const a3 = win(t, T.term - 0.05, T.rt + 0.15, 0.25, 0.2);
  op(S.L3, a3);
  if (a3 > 0) { tf(S.L3, `scale(${0.965 + 0.035 * sp(t, T.term - 0.05)})`); terminal(t); }
  const a4 = win(t, T.rt - 0.05, T.bars + 0.15, 0.25, 0.2);
  op(S.L4, a4);
  if (a4 > 0) { tf(S.L4, `scale(${0.965 + 0.035 * sp(t, T.rt - 0.05)})`); router(t); }
  const ab = win(t, T.bars - 0.05, T.end + 0.15, 0.25, 0.2);
  op(S.Lb, ab);
  if (ab > 0) S.bars.render(t - T.bars);
  const ae = smooth((t - T.end + 0.05) / 0.3);
  op(S.Le, ae);
  if (ae > 0) S.end.render(t - T.end);
  S.cap.render(t);
}

boot({ DUR, mount, render });
