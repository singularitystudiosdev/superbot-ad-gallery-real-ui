// V1 workspace (39b5ad8c): four provider consoles in browser tabs -> 2x2 clutter -> the four
// keys pop out and pack into one sk-superbot key -> four SDK clients collapse to one config
// line and the key is pasted once -> the router sends three requests to Opus 5.5, Gemini and
// DeepSeek -> cost bars -> "One API key for all your subscriptions."
import {
  clamp, lerp, smooth, inOutCubic, sp, win, seg, h, $, $$, op, tf, typed, scramble,
  PRESETS, PLANS, PLAN, KEY_PRE, KEY_FULL, BASE_URL, REQS, ROUTE_MODELS, tile,
  makeMark, makeCursor, placeCursor, pressScale, camera, makeCaption, makeChrome, makeConsole, makeBars, makeEnd, boot,
} from './kit.js';

const DUR = 28;
const T = {
  tabs: [0, 1.6, 3.2, 4.8], grid: 6.4, keysOn: [7.15, 7.3, 7.45], pop: 8.0, card: 8.8,
  fly: [9.6, 10.0, 10.4, 10.8], copy: 11.6, ed: 12.0, sel: 12.4, col: 12.8, type: 13.0, paste: 14.0, more: 14.4,
  rt: 15.2, req: [15.6, 18.0, 20.4], bars: 22.8, end: 24.8,
}; // 150 BPM grid: beat 0.4 s, bar 1.6 s
const BW = 1600, BH = 900, CS = 1.15;
const CW = Math.round(BW / CS), CH = Math.round((BH - 98) / CS);
const CELLS = [[520, 300], [1400, 300], [520, 780], [1400, 780]]; // claude, openai, gemini, deepseek
const FROM = [[-1500, -760], [1500, -760], [-1500, 760]];
const REST = [[300, 190], [1100, 190], [300, 890], [1100, 890]];
const PATHS = { claude: '/login', openai: '/usage', gemini: '/billing', deepseek: '/api_keys' };

// position of el in ref's untransformed coordinates
function rel(el, ref) {
  const a = el.getBoundingClientRect(), b = ref.getBoundingClientRect();
  const s = b.width / ref.offsetWidth;
  return { x: (a.left - b.left) / s, y: (a.top - b.top) / s, cx: (a.left - b.left + a.width / 2) / s, cy: (a.top - b.top + a.height / 2) / s };
}
const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(n / 1000) + 'k');

// tiny python highlighter for the editor rows (handles an unclosed string while typing)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function hl(src) {
  const re = /(#.*$)|("[^"]*"?)|\b(from|import)\b|([A-Za-z_][\w.]*)(?=\()|([A-Za-z_]\w*)(?==)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'f' : 'a';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}
const ROWS = [
  ['o', 'import os'],
  ['o', 'from anthropic import Anthropic'],
  ['k', 'from openai import OpenAI'],
  ['o', 'from google import genai'],
  ['k', ''],
  ['o', 'claude   = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])'],
  ['o', 'gpt      = OpenAI(api_key=os.environ["OPENAI_API_KEY"])'],
  ['o', 'gemini   = genai.Client(api_key=os.environ["GEMINI_API_KEY"])'],
  ['o', 'deepseek = OpenAI(base_url="https://api.deepseek.com", api_key=os.environ["DEEPSEEK_API_KEY"])'],
  ['n', ''],
  ['k', ''],
  ['o', '# four SDKs, four keys, four bills. which one is cheapest for this call?'],
  ['m', 'reply = client.chat.completions.create(model="auto", messages=chat)'],
];
const CFG = 9; // index of the one config line
const P1 = `client = OpenAI(base_url="${BASE_URL}", api_key="`, P2 = '")';
const P2H = '<span class="s">"</span><span class="p">)</span>';

const S = {};
async function mount(stage) {
  // ---- scene 1: browser of four consoles, then the 2x2 clutter grid
  S.L1 = h('<div class="layer"></div>');
  S.w1 = h('<div class="world"></div>');
  S.L1.appendChild(S.w1);
  S.main = makeChrome(PLANS.map((p) => ({ id: p.id, title: p.console, host: p.host + PATHS[p.id] })), BW, BH);
  S.mainWrap = h('<div class="bwrap"></div>');
  S.mainWrap.appendChild(S.main.el);
  S.cons = PLANS.map((p, i) => {
    const c = makeConsole(p, 11 + i, CW, CH);
    const holder = h('<div class="cxh"></div>');
    tf(holder, `scale(${CS})`);
    holder.appendChild(c.el);
    S.main.body.appendChild(holder);
    return { c, holder };
  });
  S.others = PLANS.slice(0, 3).map((p, i) => {
    const chr = makeChrome([{ id: p.id, title: p.console, host: p.host + PATHS[p.id] }], BW, BH);
    const wrap = h('<div class="bwrap"></div>');
    wrap.appendChild(chr.el);
    const c = makeConsole(p, 21 + i, CW, CH);
    const holder = h('<div class="cxh"></div>');
    tf(holder, `scale(${CS})`);
    holder.appendChild(c.el);
    chr.body.appendChild(holder);
    S.w1.appendChild(wrap);
    return { chr, wrap, c };
  });
  S.w1.appendChild(S.mainWrap);
  S.cur1 = makeCursor();
  S.w1.appendChild(S.cur1);
  stage.appendChild(S.L1);

  // ---- pack: key pills + the superbot key card
  S.fx = h('<div class="fx"></div>');
  S.card = h(`<div class="card1 sbkey">
    <div class="top"><span class="lbl">superbot key</span><span class="cnt"><b>0</b>/4 subscriptions packed</span></div>
    <div class="key"><span class="pre">${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}"></span>`).join('')}</div>
    <div class="bot"><div class="slots">${PLANS.map((p) => `<div class="sl"><div class="slot">${tile(p.id)}</div>${p.plan}</div>`).join('')}</div>
      <div class="copyb"><span class="ck"></span><span class="cl">Copy key</span></div></div></div>`);
  S.fx.appendChild(S.card);
  S.pills = PLANS.map((p) => {
    const el = h(`<div class="kp keypill">${tile(p.id)}<div class="kp-txt"><small>${p.console}</small><span>${p.keyMask}</span></div></div>`);
    S.fx.appendChild(el);
    return { el, txt: $(el, '.kp-txt') };
  });
  S.cur2 = makeCursor();
  S.fx.appendChild(S.cur2);
  stage.appendChild(S.fx);

  // ---- scene 3: editor, four clients collapse into one config line
  S.L3 = h('<div class="layer"></div>');
  S.w3 = h('<div class="world"></div>');
  S.L3.appendChild(S.w3);
  S.ide = h(`<div class="win ide"><div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><span class="ttl"><b>app.py</b> · my-app</span></div>
    <div class="tabs"><span class="on">app.py</span><span>requirements.txt</span><span>.env</span></div>
    <div class="code">${ROWS.map(() => '<div class="ln"><span class="no"></span><span class="tx"></span><div class="sel"></div><div class="hl"></div></div>').join('')}</div>
    <div class="stat"><span>Python 3.13</span><span>main</span><span>UTF-8</span></div></div>`);
  S.w3.appendChild(S.ide);
  S.rows = $$(S.ide, '.ln').map((ln, i) => {
    const r = { ln, no: $(ln, '.no'), tx: $(ln, '.tx'), sel: $(ln, '.sel'), hl: $(ln, '.hl'), kind: ROWS[i][0], src: ROWS[i][1] };
    if (r.kind !== 'n') r.tx.innerHTML = hl(r.src) || ' ';
    return r;
  });
  S.kcap = h('<div class="kcap"><span>⌘</span><span>V</span></div>');
  S.ok = h('<div class="okchip"><span class="ck"></span>One key. Every model.</div>');
  S.w3.append(S.kcap, S.ok);
  stage.appendChild(S.L3);

  // ---- scene 4: superbot router, live requests + routing decision
  S.L4 = h('<div class="layer"></div>');
  S.w4 = h('<div class="world"></div>');
  S.L4.appendChild(S.w4);
  S.rchr = makeChrome([{ id: null, title: 'superbot', host: 'superbot.gg/router' }], 1760, 940);
  const rw = h('<div class="rtw"></div>');
  rw.appendChild(S.rchr.el);
  S.w4.appendChild(rw);
  const app = h(`<div class="rt-app">
    <div class="rt-side"><div class="brand"><span class="m"></span>superbot</div>
      ${['Chat', 'Router', 'Usage', 'Keys', 'Subscriptions'].map((n) => `<div class="nav ${n === 'Router' ? 'on' : ''}"><span class="ic ${n === 'Chat' ? 'round' : ''}"></span>${n}</div>`).join('')}</div>
    <div class="rt-req"><div class="rt-h"><b>Live requests</b><span class="chip"><span class="dot"></span>app.py · model=auto</span></div><div class="rt-list"></div></div>
    <div class="rt-panel"></div></div>`);
  S.rchr.body.appendChild(app);
  S.rmark = makeMark(34);
  $(app, '.brand .m').appendChild(S.rmark.el);
  S.reqs = REQS.map((r) => {
    const p = PLAN[r.plan];
    const card = h(`<div class="rq"><div class="q">${r.text}</div><div class="meta"><span>model=auto</span><span>· ${fmtTok(r.tin)} tokens in</span>
      <span class="mbadge">${tile(p.id)}${p.short}<span class="via">· ${p.plan}</span></span></div></div>`);
    $(app, '.rt-list').appendChild(card);
    const dec = h(`<div class="rt-dec"><span class="lbl">Routing request</span><div class="q">${r.text}</div><span class="chip why">${r.why}</span>
      <div class="rows">${ROUTE_MODELS.map((id) => { const m = PLAN[id]; return `<div class="mrow">${tile(id)}<div class="nm">${m.model}<small>via ${m.plan}</small></div><div class="bar"><i style="background:${m.color}"></i></div><span class="sc">0.00</span>${id === r.plan ? '<span class="routed"><i></i>Routed</span>' : ''}</div>`; }).join('')}</div>
      <div class="foot">Billed to <span class="chip plan">${tile(p.id)}${p.plan}</span><span class="z">$0.00 extra</span></div></div>`);
    $(app, '.rt-panel').appendChild(dec);
    return { card, badge: $(card, '.mbadge'), dec, rows: $$(dec, '.mrow'), routed: $(dec, '.routed'), foot: $(dec, '.foot'), win: ROUTE_MODELS.indexOf(r.plan), r };
  });
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
    [0.15, 1.5, 'Four logins.'], [1.75, 3.1, 'Four dashboards.'], [3.35, 4.7, 'Four bills.'], [4.95, 6.35, 'Four API keys.'],
    [6.6, 7.9, 'Four of everything.'], [9.0, 11.8, 'Packed into one key.'],
    [12.2, 13.75, 'Four clients become one line.'], [13.95, 15.1, 'Paste it once.'],
    [15.75, 17.85, 'Code goes to Opus 5.5.'], [18.15, 20.25, 'Long context goes to Gemini.'], [20.55, 22.65, 'Bulk work goes to DeepSeek.'],
  ]);
  stage.appendChild(S.cap.el);
}

// measured once, on the first paint (fonts are ready, every transform still identity)
let M = null;
function measure() {
  const c0 = S.cons[0].c.el, c3 = S.cons[3].c.el;
  const probe = h('<span style="position:absolute;visibility:hidden">MMMMMMMMMMMMMMMMMMMM</span>');
  $(S.ide, '.code').appendChild(probe);
  const cw = probe.getBoundingClientRect().width / 20 / (S.ide.getBoundingClientRect().width / S.ide.offsetWidth);
  probe.remove();
  return {
    tabs: S.main.tabEls.map((e) => rel(e, S.w1)),
    cont: rel($(c0, '.cx-login .cx-btn'), S.w1),
    copy3: rel($(c3, '.cx-new .cp'), S.w1),
    slots: $$(S.card, '.slot').map((e) => rel(e, S.fx)),
    copyb: rel($(S.card, '.copyb'), S.fx),
    txtW: S.pills.map((p) => p.txt.offsetWidth),
    cw,
  };
}

function scene1(t) {
  camera(S.w1, t, [[0, 960, 600, 1.34], [1.3, 960, 560, 1.12], [3.0, 990, 580, 1.14], [4.6, 1000, 600, 1.2], [6.15, 960, 540, 1.0]]);
  const { f } = S.main.setTab(t, T.tabs.map((x, i) => [x, i]));
  S.cons.forEach(({ holder }, i) => op(holder, 1 - smooth(Math.abs(f - i) / 0.45)));
  const [c0, c1, c2, c3] = S.cons.map((x) => x.c);
  c0.set(0); c0.login((t - 0.1) * 30, (t - 0.9) * 14); c0.emph(0, 0);
  c1.set(1, smooth((t - 1.7) / 0.8)); c1.emph(0, 0);
  c2.set(2); c2.emph(seg(t, 3.55, 3.95), 0);
  c3.set(3); c3.emph(0, sp(t, 5.1, PRESETS.snappy));
  // grid: main browser shrinks into its cell, the other three windows fly in
  const km = sp(t, T.grid, PRESETS.default);
  tf(S.mainWrap, `translate(${lerp(0, CELLS[3][0] - 960, km)}px, ${lerp(0, CELLS[3][1] - 540, km)}px) scale(${lerp(1, 0.5, km)})`);
  S.others.forEach((o, i) => {
    const t0 = T.grid + 0.1 + i * 0.1, k = sp(t, t0, PRESETS.default);
    tf(o.wrap, `translate(${lerp(FROM[i][0], CELLS[i][0] - 960, k)}px, ${lerp(FROM[i][1], CELLS[i][1] - 540, k)}px) scale(${lerp(0.42, 0.5, k)})`);
    op(o.wrap, smooth((t - t0) / 0.2));
    if (t > t0) {
      o.chr.setTab(t, [[0, 0]]);
      if (i === 0) o.c.login(12, 6);
      o.c.mix(i, 3, seg(t, T.keysOn[i], T.keysOn[i] + 0.28));
      o.c.emph(0, sp(t, T.keysOn[i] + 0.25, PRESETS.snappy));
    }
  });
  // cursor: Continue, then each tab, then Copy on the new DeepSeek key
  const tb = M.tabs;
  placeCursor(S.cur1, t, [[0, 1250, 800], [0.25, M.cont.cx, M.cont.cy + 6], [1.15, tb[1].cx, tb[1].cy], [2.75, tb[2].cx, tb[2].cy], [4.35, tb[3].cx, tb[3].cy], [5.25, M.copy3.cx, M.copy3.cy]],
    [0.75, 1.6, 3.2, 4.8, 5.75], 1 - smooth((t - 6.0) / 0.25));
  // pack: world blurs and dims behind the pop-outs
  const b = smooth((t - T.pop) / 0.6);
  S.w1.style.filter = b > 0.002 ? `blur(${(10 * b).toFixed(2)}px) brightness(${(1 - 0.55 * b).toFixed(3)})` : 'none';
}

function pack(t) {
  const out = 1 - smooth((t - 11.76) / 0.2);
  const kc = sp(t, T.card, PRESETS.heavy);
  let bump = 0;
  T.fly.forEach((f) => { bump += Math.sin(Math.PI * clamp((t - f - 0.5) / 0.25)) * 0.012; });
  op(S.card, smooth((t - T.card) / 0.25) * out);
  tf(S.card, `translateY(${(1 - kc) * 30}px) scale(${(0.9 + 0.1 * kc + bump) * pressScale(t, [T.copy]) ** 0.2})`);
  const sgs = $$(S.card, '.key .sg'), sls = $$(S.card, '.sl');
  let n = 0;
  PLANS.forEach((p, i) => {
    const arrive = T.fly[i] + 0.5;
    if (t >= arrive) n++;
    sgs[i].textContent = t < arrive - 0.05 ? '····' : scramble(p.seg, t, arrive - 0.05, 0.3, 5 + i);
    sgs[i].classList.toggle('ph', t < arrive - 0.05);
    sgs[i].style.setProperty('--u', clamp((t - arrive) / 0.3).toFixed(3));
    sls[i].classList.toggle('in', t >= arrive);
    const st = $(sls[i], '.tile');
    op(st, t >= arrive ? 1 : 0);
    tf(st, `scale(${0.7 + 0.3 * sp(t, arrive, PRESETS.snappy)})`);
    // pill: pop out of its window, rest, then fly into its slot
    const pl = S.pills[i], t0 = T.pop + i * 0.12;
    const kp = sp(t, t0, PRESETS.snappy), u = inOutCubic(seg(t, T.fly[i], arrive));
    const rx = lerp(CELLS[i][0] - 200, REST[i][0], kp), ry = lerp(CELLS[i][1], REST[i][1], kp);
    const x = lerp(rx, M.slots[i].cx, u), y = lerp(ry, M.slots[i].cy, u) - Math.sin(Math.PI * u) * 60;
    pl.txt.style.width = (M.txtW[i] * (1 - smooth(u / 0.6))).toFixed(1) + 'px';
    op(pl.txt, 1 - smooth(u / 0.45));
    tf(pl.el, `translate(${x - 38}px, ${y - 38}px) scale(${(0.6 + 0.4 * kp) * (1 + 0.12 * u)})`);
    op(pl.el, t < arrive ? smooth((t - t0) / 0.15) : 0);
  });
  $(S.card, '.cnt b').textContent = n;
  const copied = t >= T.copy;
  $(S.card, '.cl').textContent = copied ? 'Copied' : 'Copy key';
  op($(S.card, '.copyb .ck'), copied ? 1 : 0);
  $(S.card, '.copyb .ck').style.width = copied ? '20px' : '0px';
  tf($(S.card, '.copyb'), `scale(${pressScale(t, [T.copy])})`);
  placeCursor(S.cur2, t, [[10.95, 1500, 980], [11.1, M.copyb.cx + 10, M.copyb.cy + 8]], [T.copy], win(t, 11.0, 11.92, 0.2, 0.2));
}

function editor(t) {
  camera(S.w3, t, [[11.9, 960, 540, 1.0], [12.4, 900, 450, 1.07], [13.2, 900, 380, 1.2], [13.9, 900, 345, 1.3], [14.65, 900, 430, 1.12]]);
  let num = 0;
  let oi = 0;
  S.rows.forEach((r, i) => {
    let ht = 42;
    if (r.kind === 'o') {
      const t0 = T.col + oi * 0.035;
      ht = 42 * (1 - smooth((t - t0) / 0.32));
      const ws = smooth((t - (T.sel + oi * 0.04)) / 0.18);
      r.sel.style.width = (ws * (r.src.length * M.cw + 10)).toFixed(1) + 'px';
      oi++;
    } else if (r.kind === 'n') ht = 42 * smooth((t - T.col - 0.12) / 0.3);
    else if (r.kind === 'm') ht = 42 * smooth((t - T.more) / 0.3);
    r.ln.style.height = ht.toFixed(2) + 'px';
    if (ht > 21) num++;
    r.no.textContent = ht > 21 ? num : '';
  });
  // the one config line: typed, caret waits in the quotes, key pasted once
  const cfg = S.rows[CFG];
  const full = P1 + P2;
  const caret = '<span class="caret"></span>';
  const blink = Math.floor((t - T.type) * 2.4) % 2 === 0 ? caret : '<span class="caret" style="opacity:0"></span>';
  if (t < T.type) cfg.tx.innerHTML = caret;
  else if (t < T.paste) {
    const s = typed(full, t, T.type, 90);
    cfg.tx.innerHTML = s.length < full.length ? hl(s) + caret : hl(P1) + blink + P2H;
  } else {
    const a = 1 - smooth((t - T.paste - 0.1) / 0.6);
    cfg.tx.innerHTML = hl(P1) + `<span class="s pk" style="background:rgba(91,141,255,${(0.38 * a).toFixed(3)})">${KEY_FULL}</span>` + P2H;
  }
  op(cfg.hl, 0.8 * smooth((t - T.paste - 0.15) / 0.3));
  // keycap and the result chip, in world coordinates of the editor
  const cx = 180 + 64 + P1.length * M.cw, rowTop = 110 + 118 + 2 * 42;
  const kk = sp(t, T.paste - 0.2, PRESETS.snappy), press = Math.sin(Math.PI * clamp((t - T.paste + 0.1) / 0.16));
  tf(S.kcap, `translate(${cx - 60}px, ${rowTop - 74 + press * 4}px) scale(${0.8 + 0.2 * kk})`);
  op(S.kcap, win(t, T.paste - 0.2, T.paste + 0.55, 0.12, 0.2));
  const ko = sp(t, T.more + 0.15, PRESETS.snappy);
  tf(S.ok, `translate(244px, ${110 + 118 + 5 * 42 + 24}px) scale(${0.85 + 0.15 * ko})`);
  op(S.ok, smooth((t - T.more - 0.15) / 0.2));
}

function router(t) {
  camera(S.w4, t, [[15.1, 960, 540, 0.97], [15.6, 960, 540, 1.0], [16.5, 1010, 545, 1.16], [18.0, 990, 540, 1.08], [18.8, 1010, 545, 1.16], [20.4, 990, 540, 1.08], [21.2, 1010, 545, 1.16], [22.4, 960, 540, 1.0]]);
  S.rchr.setTab(t, [[0, 0]]);
  S.rmark.render(t);
  S.reqs.forEach((q, i) => {
    const a = T.req[i], b = i < 2 ? T.req[i + 1] : T.bars + 0.3;
    const k = sp(t, a, PRESETS.snappy);
    let down = 0;
    for (let j = i + 1; j < 3; j++) down += 166 * sp(t, T.req[j], PRESETS.default);
    tf(q.card, `translateY(${down - 30 * (1 - k)}px) scale(${0.96 + 0.04 * k})`);
    op(q.card, smooth((t - a) / 0.2));
    op(q.badge, smooth((t - a - 1.3) / 0.2));
    tf(q.badge, `scale(${0.8 + 0.2 * sp(t, a + 1.3, PRESETS.snappy)})`);
    const kd = sp(t, a, PRESETS.default), ko = smooth((t - (b - 0.2)) / 0.2);
    op(q.dec, Math.min(smooth((t - a) / 0.25), 1 - ko));
    tf(q.dec, `translateY(${(1 - kd) * 40 - ko * 20}px)`);
    const tw = a + 1.05;
    q.rows.forEach((row, r) => {
      const kf = smooth((t - a - 0.3 - r * 0.1) / 0.55), fit = q.r.fit[r];
      $(row, '.bar i').style.width = (fit * 100 * kf).toFixed(2) + '%';
      $(row, '.sc').textContent = (fit * kf).toFixed(2);
      const isWin = r === q.win;
      row.classList.toggle('won', isWin && t >= tw);
      if (isWin) tf(row, `scale(${1 + 0.03 * Math.sin(Math.PI * clamp((t - tw) / 0.35))})`);
      else op(row, 1 - 0.55 * smooth((t - tw) / 0.3));
    });
    op(q.routed, smooth((t - tw) / 0.15));
    tf(q.routed, `scale(${0.7 + 0.3 * sp(t, tw, PRESETS.snappy)})`);
    op(q.foot, smooth((t - a - 1.3) / 0.25));
  });
}

function render(t) {
  if (!M) M = measure();
  const s1a = 1 - smooth((t - 11.76) / 0.24);
  op(S.L1, s1a);
  if (s1a > 0) scene1(t);
  const fxa = t >= T.pop - 0.1 && t < 12.2;
  op(S.fx, fxa ? 1 : 0);
  if (fxa) pack(t);
  const a3 = win(t, T.ed - 0.05, T.rt + 0.15, 0.25, 0.2);
  op(S.L3, a3);
  if (a3 > 0) { tf(S.L3, `scale(${0.965 + 0.035 * sp(t, T.ed - 0.05)})`); editor(t); }
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
