// V3 keycard (39b5ad8c): black title card -> a wall of four scrolling provider consoles with
// error toasts -> the four plan cards fan out like a hand, stack, and flip into one superbot
// keycard whose key etches in -> settings.json: four provider blocks collapse into one line, key
// pasted once -> superbot chat: three asks, each routed (Opus 5.5 / Gemini / DeepSeek) -> bars -> end.
import {
  clamp, lerp, smooth, inOutCubic, sp, win, seg, h, $, $$, op, tf, typed, track,
  PRESETS, PLANS, PLAN, KEY_FULL, BASE_URL, REQS, ROUTE_MODELS, tile,
  makeMark, camera, makeCaption, makeChrome, makeConsole, makeBars, makeEnd, boot, pressScale,
} from './kit.js';

const DUR = 27.2;
const T = {
  wall: 1.6, toasts: [2.4, 3.2, 4.0, 4.8], fan: 6.4, stack: 8.0, flip: 8.4, etch: 8.8, inc: 9.2, kOut: 10.2,
  ed: 10.4, sel: 10.8, col: 11.2, type: 11.4, paste: 12.8, more: 13.1, chat: 13.6, req: [14.0, 16.4, 18.8], bars: 21.6, end: 23.6,
}; // 150 BPM grid: beat 0.4 s, bar 1.6 s
const COLW = 440, GAP = 26, X0 = (1920 - (4 * COLW + 3 * GAP)) / 2;
const STEP = 392, WCS = 0.49, WCW = Math.round(440 / WCS), WCH = Math.round(372 / WCS);
const SPEED = [210, 280, 240, 300], PHASE = [0, 180, 90, 260], WALL_PAGES = [0, 1, 2, 3, 0, 1, 2];
const TOASTS = [['Rate limit reached', 'Requests are being throttled'], ['Low credit balance', 'Add credits to keep using the API'],
  ['Billing account required', 'Link a billing account to continue'], ['Insufficient balance', 'Top up to continue']];
const FAN = [-21, -7, 7, 21], PIVOT = [960, 1560], RAD = 1020;
const REPLIES = [
  'Done. auth/ is now session.ts, tokens.ts and guards.ts, and every test is green.',
  'Summary ready: revenue themes, guidance changes and risks across all 14 calls.',
  'Tagged all 5,000 tickets by intent: billing, bugs, how-to and feature requests.',
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// JSON colouring: a quoted string followed by a colon is a key (handles an unclosed string)
function jhl(src) {
  const re = /("[^"]*"?)(\s*:)?/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    out += m[2] ? `<span class="a">${esc(m[1])}</span>${m[2]}` : `<span class="s">${esc(m[1])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
const ROWS = [
  ['k', '{'],
  ['o', '  "providers": {'],
  ...PLANS.map((p) => ['o', `    ${pad(`"${p.id === 'claude' ? 'anthropic' : p.id === 'gemini' ? 'google' : p.id}":`, 13)}{ ${p.id === 'deepseek' ? '"baseURL": "https://api.deepseek.com", ' : ''}"apiKey": "${p.keyMask}" },`]),
  ['o', '  },'],
  ['n', ''],
  ['o', '  "model": "claude-opus-5.5"'],
  ['m', '  "model": "auto"'],
  ['k', '}'],
];
const CFG = 7;
const P1 = `  "provider": { "baseURL": "${BASE_URL}", "apiKey": "`, P2 = '" },';
const P2H = '<span class="s">"</span> },';

const S = {};
async function mount(stage) {
  // ---- title card
  S.ttl = h(`<div class="ttl-card"><h2>${'Four AI subscriptions.'.split(' ').map((w) => `<span>${w}</span>`).join('')}</h2></div>`);
  stage.appendChild(S.ttl);
  S.ttlW = $$(S.ttl, 'h2 span');

  // ---- console wall
  S.L1 = h('<div class="layer"></div>');
  S.w1 = h('<div class="world"></div>');
  S.L1.appendChild(S.w1);
  S.cols = PLANS.map((p, i) => {
    const col = h(`<div class="wcol" style="left:${X0 + i * (COLW + GAP)}px"><div class="hd">${tile(p.id)}${p.console}</div><div class="vp"><div class="strip"></div></div>
      <div class="toast"><span class="ic">!</span><div><b>${TOASTS[i][0]}</b><span>${TOASTS[i][1]}</span></div></div></div>`);
    const strip = $(col, '.strip');
    WALL_PAGES.forEach((pg, j) => {
      const scr = h(`<div class="scr" style="top:${j * STEP}px"></div>`);
      const c = makeConsole(p, 70 + i * 10 + j, WCW, WCH);
      const holder = h('<div class="cxh"></div>');
      tf(holder, `scale(${WCS})`);
      holder.appendChild(c.el);
      scr.appendChild(holder);
      strip.appendChild(scr);
      c.set(pg, 1);
      c.login(12, 6);
      c.emph(pg === 2 ? 0.5 : 0, pg === 3 ? 1 : 0);
    });
    S.w1.appendChild(col);
    return { col, strip, toast: $(col, '.toast') };
  });
  stage.appendChild(S.L1);

  // ---- plan cards -> keycard
  S.L2 = h('<div class="cards"></div>');
  S.cards = PLANS.map((p) => {
    const el = h(`<div class="pcard" style="--c:${p.color}"><div class="r1">${tile(p.id)}<b>${p.plan}</b><small>${p.vendor}</small></div>
      <div class="kl2">API key</div><div class="kv">${p.keyMask}</div><div class="r3"><span>Subscription · active</span><span>${p.console}</span></div></div>`);
    S.L2.appendChild(el);
    return el;
  });
  S.kcard = h(`<div class="kcard sbkey"><div class="r1"><span class="m"></span>superbot<span class="lbl">API key</span></div>
    <div class="etch"><span class="key">${KEY_FULL}</span><span class="scan"></span></div>
    <div class="inc"><small>Includes your subscriptions</small><div class="row">${PLANS.map((p) => `<span class="chip">${tile(p.id)}${p.plan}</span>`).join('')}</div></div></div>`);
  S.L2.appendChild(S.kcard);
  S.kmark = makeMark(56);
  $(S.kcard, '.r1 .m').appendChild(S.kmark.el);
  S.incs = $$(S.kcard, '.inc .chip');
  stage.appendChild(S.L2);

  // ---- settings.json
  S.L3 = h('<div class="layer"></div>');
  S.w3 = h('<div class="world"></div>');
  S.L3.appendChild(S.w3);
  S.ide = h(`<div class="win ide2"><div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><span class="ttl"><b>settings.json</b> · my-agent</span></div>
    <div class="tabs"><span class="on">settings.json</span><span>agent.ts</span></div>
    <div class="code">${ROWS.map(() => '<div class="ln"><span class="no"></span><span class="tx"></span><div class="sel"></div><div class="hl"></div></div>').join('')}</div></div>`);
  S.w3.appendChild(S.ide);
  S.rows = $$(S.ide, '.ln').map((ln, i) => {
    const r = { ln, no: $(ln, '.no'), tx: $(ln, '.tx'), sel: $(ln, '.sel'), hl: $(ln, '.hl'), kind: ROWS[i][0], src: ROWS[i][1] };
    if (r.kind !== 'n') r.tx.innerHTML = jhl(r.src) || ' ';
    return r;
  });
  S.kcap = h('<div class="kcap"><span>⌘</span><span>V</span></div>');
  S.ok = h('<div class="okchip"><span class="ck"></span>Saved. One key, every model.</div>');
  S.w3.append(S.kcap, S.ok);
  stage.appendChild(S.L3);

  // ---- superbot chat
  S.L4 = h('<div class="layer"></div>');
  S.w4 = h('<div class="world"></div>');
  S.L4.appendChild(S.w4);
  S.cchr = makeChrome([{ id: null, title: 'superbot', host: 'superbot.gg/chat' }], 1760, 940);
  const rw = h('<div class="rtw"></div>');
  rw.appendChild(S.cchr.el);
  S.w4.appendChild(rw);
  const app = h(`<div class="ch-app">
    <div class="ch-side"><div class="brand"><span class="m"></span>superbot</div>
      ${['Chat', 'Router', 'Usage', 'Keys', 'Subscriptions'].map((n) => `<div class="nav ${n === 'Chat' ? 'on' : ''}"><span class="ic ${n === 'Chat' ? 'round' : ''}"></span>${n}</div>`).join('')}</div>
    <div class="ch-main"><div class="ch-msgs">${REQS.map((r, i) => { const p = PLAN[r.plan]; return `<div class="ex"><div class="ub">${r.text}</div>
        <div class="ab"><div class="hd"><span class="m"></span><span class="mbadge">${tile(p.id)}${p.model}<span class="via">· via ${p.plan}</span></span></div><div class="txt">${REPLIES[i]}</div></div></div>`; }).join('')}</div>
      <div class="cmp"><div class="in"></div><span class="auto"><span class="gd"></span>Auto</span><span class="send"></span></div>
      <div class="pop3"><div class="t">Routing</div><div class="hlb"></div>${ROUTE_MODELS.map((id) => { const m = PLAN[id]; return `<div class="it">${tile(id)}<div>${m.model}<small>via ${m.plan}</small></div><span class="ck"></span></div>`; }).join('')}</div>
    </div></div>`);
  S.cchr.body.appendChild(app);
  S.cmark = makeMark(34);
  $(app, '.ch-side .brand .m').appendChild(S.cmark.el);
  S.exs = $$(app, '.ex').map((ex) => {
    const m = makeMark(36);
    $(ex, '.ab .hd .m').appendChild(m.el);
    return { ex, ub: $(ex, '.ub'), ab: $(ex, '.ab'), badge: $(ex, '.mbadge'), txt: $(ex, '.txt'), mark: m };
  });
  S.cin = $(app, '.cmp .in');
  S.send = $(app, '.cmp .send');
  S.pop = $(app, '.pop3');
  S.hlb = $(S.pop, '.hlb');
  S.pits = $$(S.pop, '.it');
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
    [1.8, 3.9, 'Four consoles to log into.'], [4.1, 6.3, 'Four keys. Four bills. Four limits.'],
    [6.6, 10.2, 'Pack all four into one key.'],
    [10.6, 12.4, 'Four provider blocks become one line.'], [12.6, 13.7, 'Paste once.'],
    [14.2, 16.2, 'Opus 5.5 takes the code.'], [16.6, 18.6, 'Gemini takes the long read.'], [19.0, 21.4, 'DeepSeek takes the bulk job.'],
  ]);
  stage.appendChild(S.cap.el);
}

let M = null;
function measure() {
  const probe = h('<span style="position:absolute;visibility:hidden">MMMMMMMMMMMMMMMMMMMM</span>');
  $(S.ide, '.code').appendChild(probe);
  const cw = probe.getBoundingClientRect().width / 20 / (S.ide.getBoundingClientRect().width / S.ide.offsetWidth);
  probe.remove();
  // lock each reply's final height so typing never reflows the stack
  const exH = S.exs.map((x) => { x.txt.style.height = x.txt.offsetHeight + 'px'; return x.ex.offsetHeight + 28; });
  return { cw, keyW: $(S.kcard, '.etch .key').offsetWidth, exH };
}

function title(t) {
  const out = smooth((t - 1.42) / 0.2);
  op(S.ttl, 1 - out);
  S.ttlW.forEach((w, i) => {
    const k = sp(t, 0.05 + i * 0.1, PRESETS.heavy);
    tf(w, `translateY(${(1 - k) * 60 - out * 24}px)`);
    op(w, smooth((t - 0.05 - i * 0.1) / 0.25));
  });
}

function wall(t) {
  const lt = Math.max(0, t - T.wall);
  const s = lerp(1.0, 1.045, smooth(lt / 4.8));
  tf(S.w1, `translate(960px, 540px) scale(${s}) translate(-960px, -540px)`);
  S.cols.forEach((c, i) => {
    const k = sp(t, T.wall + i * 0.08, PRESETS.default);
    tf(c.col, `translateY(${(1 - k) * 240}px)`);
    op(c.col, smooth((t - T.wall - i * 0.08) / 0.2));
    const y = (SPEED[i] * lt + PHASE[i]) % (4 * STEP);
    tf(c.strip, `translateY(${-y}px)`);
    const a = T.toasts[i], kt = sp(t, a, PRESETS.snappy), d = t - a;
    const shake = d > 0 ? Math.sin(d * 42) * 7 * Math.exp(-d * 7) : 0;
    tf(c.toast, `translate(${shake}px, ${(1 - kt) * -30}px) scale(${0.92 + 0.08 * kt})`);
    op(c.toast, smooth(d / 0.15));
  });
}

function cards(t) {
  const th = 180 * inOutCubic(seg(t, T.flip, T.flip + 0.6));
  PLANS.forEach((p, i) => {
    const el = S.cards[i], a = FAN[i] * Math.PI / 180;
    const fx = PIVOT[0] + RAD * Math.sin(a), fy = PIVOT[1] - RAD * Math.cos(a);
    const kf = sp(t, T.fan + i * 0.1, PRESETS.default), ks = sp(t, T.stack + i * 0.05, PRESETS.default);
    const sx = 960 + (i - 1.5) * 6, sy = 540 - (i - 1.5) * 6;
    const x = lerp(lerp(960, fx, kf), sx, ks), y = lerp(lerp(1500, fy, kf), sy, ks);
    const rot = lerp(FAN[i] * kf, (i - 1.5) * 1.2, ks);
    tf(el, `translate(${x - 260}px, ${y - 160}px) perspective(1800px) rotateY(${th}deg) rotate(${rot}deg) scale(${1 + 0.25 * (th / 180)})`);
    op(el, th < 90 ? smooth((t - T.fan - i * 0.1) / 0.2) : 0);
  });
  // keycard: back face of the deck, then a slow idle float until it leaves
  const kout = smooth((t - T.kOut) / 0.25), idle = smooth((t - 9.0) / 0.5);
  const rx = Math.sin((t - 9.0) * 1.6) * 3 * idle, ry = Math.cos((t - 9.0) * 1.3) * 4 * idle;
  tf(S.kcard, `perspective(1800px) rotateY(${th - 180 + ry}deg) rotateX(${rx}deg) scale(${(0.86 + 0.14 * (th / 180)) * (1 - 0.15 * kout)})`);
  op(S.kcard, (th >= 90 ? 1 : 0) * (1 - kout));
  S.kmark.render(t);
  const u = seg(t, T.etch, T.etch + 0.8);
  $(S.kcard, '.etch .key').style.clipPath = `inset(0 ${((1 - u) * 100).toFixed(2)}% 0 0)`;
  const scan = $(S.kcard, '.etch .scan');
  tf(scan, `translateX(${u * M.keyW}px)`);
  op(scan, u > 0 && u < 1 ? 1 : 0);
  S.incs.forEach((c, i) => {
    const k = sp(t, T.inc + i * 0.1, PRESETS.snappy);
    op(c, smooth((t - T.inc - i * 0.1) / 0.12));
    tf(c, `scale(${0.8 + 0.2 * k})`);
  });
}

function editor(t) {
  camera(S.w3, t, [[10.3, 960, 540, 1.0], [11.0, 900, 450, 1.06], [11.8, 900, 380, 1.18], [12.6, 900, 360, 1.26], [13.3, 940, 440, 1.1]]);
  let num = 0, oi = 0;
  S.rows.forEach((r) => {
    let ht = 42;
    if (r.kind === 'o') {
      ht = 42 * (1 - smooth((t - T.col - oi * 0.035) / 0.32));
      r.sel.style.width = (smooth((t - T.sel - oi * 0.04) / 0.18) * (r.src.length * M.cw + 10)).toFixed(1) + 'px';
      oi++;
    } else if (r.kind === 'n') ht = 42 * smooth((t - T.col - 0.12) / 0.3);
    else if (r.kind === 'm') ht = 42 * smooth((t - T.more) / 0.3);
    r.ln.style.height = ht.toFixed(2) + 'px';
    if (ht > 21) num++;
    r.no.textContent = ht > 21 ? num : '';
  });
  const cfg = S.rows[CFG], full = P1 + P2;
  const caret = '<span class="caret"></span>';
  const blink = Math.floor((t - T.type) * 2.4) % 2 === 0 ? caret : '<span class="caret" style="opacity:0"></span>';
  if (t < T.type) cfg.tx.innerHTML = caret;
  else if (t < T.paste) {
    const s = typed(full, t, T.type, 100);
    cfg.tx.innerHTML = s.length < full.length ? jhl(s) + caret : jhl(P1) + blink + P2H;
  } else {
    const a = 1 - smooth((t - T.paste - 0.1) / 0.6);
    cfg.tx.innerHTML = jhl(P1) + `<span class="s pk" style="border-radius:5px;background:rgba(91,141,255,${(0.38 * a).toFixed(3)})">${KEY_FULL}</span>` + P2H;
  }
  op(cfg.hl, 0.8 * smooth((t - T.paste - 0.15) / 0.3));
  const cx = 210 + 64 + P1.length * M.cw, rowTop = 130 + 118 + 42;
  const kk = sp(t, T.paste - 0.2, PRESETS.snappy), press = Math.sin(Math.PI * clamp((t - T.paste + 0.1) / 0.16));
  tf(S.kcap, `translate(${cx - 60}px, ${rowTop - 74 + press * 4}px) scale(${0.8 + 0.2 * kk})`);
  op(S.kcap, win(t, T.paste - 0.2, T.paste + 0.55, 0.12, 0.2));
  const ko = sp(t, T.more + 0.1, PRESETS.snappy);
  tf(S.ok, `translate(274px, ${130 + 118 + 4 * 42 + 30}px) scale(${0.85 + 0.15 * ko})`);
  op(S.ok, smooth((t - T.more - 0.1) / 0.2));
}

function chat(t) {
  camera(S.w4, t, [[13.5, 960, 540, 0.97], [14.0, 960, 560, 1.02], [14.5, 960, 650, 1.12], [15.6, 960, 500, 1.06], [16.4, 960, 650, 1.12], [18.0, 960, 500, 1.06], [18.8, 960, 650, 1.12], [20.4, 960, 500, 1.06], [21.3, 960, 540, 1.0]]);
  S.cchr.setTab(t, [[0, 0]]);
  S.cmark.render(t);
  let i = -1;
  T.req.forEach((a, j) => { if (t >= a) i = j; });
  // composer: the current ask types in, clears on send
  const a = i >= 0 ? T.req[i] : 0;
  const caret = '<span class="caret"></span>';
  if (i < 0 || t >= a + 0.9) S.cin.innerHTML = `<span class="ph">Message superbot</span>`;
  else S.cin.innerHTML = esc(typed(REQS[i].text, t, a, 70)) + caret;
  tf(S.send, `scale(${pressScale(t, T.req.map((x) => x + 0.9))})`);
  // routing popover: scans the three models, lands on the winner
  if (i >= 0) {
    const w = ROUTE_MODELS.indexOf(REQS[i].plan);
    const v = win(t, a + 1.0, a + 1.7, 0.12, 0.15);
    op(S.pop, v);
    tf(S.pop, `scale(${0.94 + 0.06 * sp(t, a + 1.0, PRESETS.snappy)})`);
    const idx = track(t, [[a, 0], [a + 1.0, 0], [a + 1.08, 1], [a + 1.16, 2], [a + 1.24, (w + 1) % 3], [a + 1.3, w]], 900, 55);
    tf(S.hlb, `translateY(${44 + idx * 62}px)`);
    S.pits.forEach((it, j) => op($(it, '.ck'), j === w ? smooth((t - a - 1.45) / 0.1) : 0));
  } else op(S.pop, 0);
  // exchanges stack upward as new ones arrive
  S.exs.forEach((x, j) => {
    const s0 = T.req[j] + 0.9;
    let up = 0;
    for (let k = j + 1; k < 3; k++) up += M.exH[k] * sp(t, T.req[k] + 0.9, PRESETS.default);
    tf(x.ex, `translateY(${-up}px)`);
    op(x.ex, j + 2 < 3 ? 1 - smooth((t - T.req[j + 2] - 0.9) / 0.3) : 1);
    const ku = sp(t, s0, PRESETS.snappy);
    op(x.ub, smooth((t - s0) / 0.15));
    tf(x.ub, `translateY(${(1 - ku) * 20}px) scale(${0.95 + 0.05 * ku})`);
    const s1 = T.req[j] + 1.7;
    op(x.ab, smooth((t - s1) / 0.15));
    tf(x.badge, `scale(${0.8 + 0.2 * sp(t, s1, PRESETS.snappy)})`);
    x.txt.textContent = typed(REPLIES[j], t, s1 + 0.15, 75);
    x.mark.render(t);
  });
}

function render(t) {
  if (!M) M = measure();
  if (t < 1.7) title(t); else op(S.ttl, 0);
  const a1 = Math.min(smooth((t - T.wall + 0.1) / 0.2), 1 - smooth((t - 6.3) / 0.3));
  op(S.L1, a1);
  if (a1 > 0) wall(t);
  const a2 = t >= T.fan - 0.05 && t < 10.5;
  op(S.L2, a2 ? 1 : 0);
  if (a2) cards(t);
  const a3 = win(t, T.ed - 0.05, T.chat + 0.15, 0.25, 0.2);
  op(S.L3, a3);
  if (a3 > 0) { tf(S.L3, `scale(${0.965 + 0.035 * sp(t, T.ed - 0.05)})`); editor(t); }
  const a4 = win(t, T.chat - 0.05, T.bars + 0.15, 0.25, 0.2);
  op(S.L4, a4);
  if (a4 > 0) { tf(S.L4, `scale(${0.965 + 0.035 * sp(t, T.chat - 0.05)})`); chat(t); }
  const ab = win(t, T.bars - 0.05, T.end + 0.15, 0.25, 0.2);
  op(S.Lb, ab);
  if (ab > 0) S.bars.render(t - T.bars);
  const ae = smooth((t - T.end + 0.05) / 0.3);
  op(S.Le, ae);
  if (ae > 0) S.end.render(t - T.end);
  S.cap.render(t);
}

boot({ DUR, mount, render });
