// ui.0cecc5e4.js: product surfaces the films animate. Builders only create DOM; the films
// write every moving value from t.
import { h, at, put, tile, mark, driveMark, chip, ICON, M, AGENTS, sp, P, clamp, win, blinkOn } from './core.0cecc5e4.js';

// ---- browser frame (traffic lights, tab, url) ----
export function browser({ url, tab }) {
  const el = h('div', 'browser');
  el.innerHTML = `<div class="b-bar"><div class="lights"><i></i><i></i><i></i></div>
    <div class="b-tab"><span class="tm"></span><span>${tab}</span></div>
    <div class="b-url">${ICON.lock}<span class="u">${url}</span></div><div style="width:170px"></div></div>
    <div class="b-body"></div>`;
  el.querySelector('.tm').appendChild(mark(20).host);
  return { el, body: el.querySelector('.b-body'), url: el.querySelector('.u') };
}

// ---- superbot hub: sidebar + main (assets/hub-real.css at 2x) ----
export function hub(active) {
  const el = h('div', 'hub');
  const side = h('div', 'side');
  const head = h('div', 'side-head');
  const m = mark(30);
  head.appendChild(m.host);
  head.appendChild(h('span', '', 'superbot'));
  side.appendChild(head);
  side.appendChild(h('div', 'seg2', `<span class="on">Chat</span><span>Code</span>`));
  side.appendChild(h('div', 'newchat', '+ New chat'));
  const nav = h('div', 'nav');
  for (const n of ['Chats', 'API keys', 'Usage', 'Settings']) nav.appendChild(h('div', n === active ? 'on' : '', `<span class="ico"></span>${n}`));
  side.appendChild(nav);
  side.appendChild(h('div', 'side-label', 'Earlier'));
  for (const x of ['Fix flaky cart test', 'Migrate auth to OAuth', 'Postgres index review']) side.appendChild(h('div', 'hist', x));
  const main = h('div', 'main');
  el.appendChild(side);
  el.appendChild(main);
  return { el, main, mark: m };
}

// ---- composer (.rc at 2x: draft on top; + | chat/build ... SUPER | superbot v | computer | mic | send) ----
export function composer() {
  const el = h('div', 'rc2');
  el.innerHTML = `<div class="ph"></div><div class="row">
    <span class="plus">${ICON.plus}</span>
    <span class="segc"><span class="on">${ICON.chat}</span><span>${ICON.code}</span></span>
    <span class="super">SUPER<i></i></span>
    <span class="plat"><span class="pm"></span>superbot${ICON.chev}</span>
    <span class="comp">${ICON.comp}</span>
    <span class="mic">${ICON.mic}</span>
    <span class="send"><span class="on"></span>${ICON.up}</span></div>`;
  el.querySelector('.pm').appendChild(mark(26).host);
  const ph = el.querySelector('.ph');
  const sendOn = el.querySelector('.send .on');
  const send = el.querySelector('.send');
  return {
    el,
    set(text, t, { caret = true, press = 0 } = {}) {
      const empty = !text;
      ph.className = 'ph' + (empty ? ' empty' : '');
      ph.innerHTML = (empty ? 'Ask superbot anything' : text.replace(/&/g, '&amp;').replace(/</g, '&lt;')) + (caret && blinkOn(t) ? '<span class="caret"></span>' : '');
      sendOn.style.opacity = empty ? 0 : 1;
      send.style.color = empty ? '' : '#fff';
      send.style.transform = `scale(${(1 - 0.16 * press).toFixed(3)})`;
    },
  };
}

// ---- plan card (keys page) ----
export function planCard(a) {
  const el = h('div', 'plan');
  el.appendChild(tile(a.logo));
  el.appendChild(h('div', 'pn', a.plan));
  el.appendChild(h('div', 'pv', a.via || `via ${a.name}`));
  const tog = h('div', 'tog', '<span class="fill"></span><i></i>');
  el.appendChild(tog);
  const st = h('div', 'st', '<span class="dot"></span><span class="sx">Not connected</span>');
  el.appendChild(st);
  const fill = tog.querySelector('.fill'), knob = tog.querySelector('i'), dot = st.querySelector('.dot'), sx = st.querySelector('.sx');
  return {
    el,
    paint(u) { // u: toggle spring 0..1 (snappy)
      fill.style.opacity = clamp(u).toFixed(3);
      knob.style.transform = `translateX(${(u * 20).toFixed(2)}px)`;
      const on = u > 0.5;
      dot.style.background = on ? '#2ea56b' : '#3a3a3e';
      sx.textContent = on ? 'Connected' : 'Not connected';
      st.style.color = on ? '#7ee2a8' : '#6a6d7a';
    },
  };
}

// ---- the superbot key card: plan tiles dock on the rail, the key string grows ----
export function keyCard(groups, logos) {
  const el = h('div', 'key');
  el.innerHTML = `<div class="k-ring"></div><div class="k-shine"></div>
    <div class="k-top"><span class="km"></span>Superbot API key</div>
    <div class="k-tag"><span class="kt">0 plans</span></div>
    <div class="k-str"><span class="ks"></span><span class="caret"></span></div>
    <div class="k-copy">${ICON.copy}<span class="cx">Copy</span></div>
    <div class="k-rail"></div><div class="k-meta"></div>`;
  const m = mark(30);
  el.querySelector('.km').appendChild(m.host);
  const rail = el.querySelector('.k-rail');
  const slots = logos.map((lg) => {
    const s = h('span', 'slot');
    s.style.position = 'relative';
    const tl = tile(lg, 44);
    tl.style.position = 'absolute'; tl.style.left = '0'; tl.style.top = '0';
    s.appendChild(tl);
    rail.appendChild(s);
    return { s, tl };
  });
  const ks = el.querySelector('.ks'), caret = el.querySelector('.caret'), kt = el.querySelector('.kt');
  const meta = el.querySelector('.k-meta'), shine = el.querySelector('.k-shine'), cx = el.querySelector('.cx'), copy = el.querySelector('.k-copy');
  return {
    el, mark: m, slots, copy,
    // docked: array of 0..1 per plan; seal 0..1; t for caret blink
    paint(t, docked, { seal = 0, copied = false, meta: metaText = '' } = {}) {
      let n = 0, str = 'sbc_live_';
      docked.forEach((u, i) => {
        slots[i].tl.style.opacity = clamp(u * 1.4).toFixed(3);
        slots[i].tl.style.transform = `scale(${(0.4 + 0.6 * u).toFixed(3)})`;
        if (u > 0.5) { n++; str += groups[i]; }
      });
      ks.textContent = str;
      caret.style.opacity = seal > 0.5 ? 0 : blinkOn(t) ? 1 : 0;
      kt.textContent = `${n} plan${n === 1 ? '' : 's'} inside`;
      meta.textContent = metaText;
      shine.style.transform = `translateX(${(-220 + seal * 1400).toFixed(1)}px) skewX(-18deg)`;
      shine.style.opacity = seal > 0 && seal < 1 ? 1 : 0;
      cx.textContent = copied ? 'Copied' : 'Copy';
      copy.style.color = copied ? '#7ee2a8' : '';
      driveMark(m, t, { happy: seal > 0.6 });
    },
  };
}

// ---- router card: one row per subtask, a selection pill slides to the picked model ----
export function router(rows, title = 'Superbot router') {
  const el = h('div', 'router');
  const hd = h('div', 'r-h');
  const m = mark(30);
  hd.appendChild(m.host);
  hd.appendChild(h('span', '', title));
  hd.appendChild(h('span', 'r-n', `${rows.length} subtasks`));
  el.appendChild(hd);
  const R = rows.map((r) => {
    const row = h('div', 'r-row');
    row.appendChild(h('div', 'r-task', r.task));
    const why = h('div', 'r-why', r.why);
    row.appendChild(why);
    const pick = h('div', 'r-pick');
    row.appendChild(pick);
    const opts = h('div', 'r-opts');
    const optEls = r.opts.map((k) => { const o = h('span', 'r-opt'); o.appendChild(tile(M[k].logo)); o.appendChild(h('span', '', M[k].name)); opts.appendChild(o); return o; });
    row.appendChild(opts);
    const price = h('div', 'r-price', `$${M[r.opts[r.pick]].out.toFixed(2)} / 1M out`);
    row.appendChild(price);
    el.appendChild(row);
    return { row, why, pick, optEls, price, r, box: [] };
  });
  return {
    el, mark: m, rows: R,
    measure() { for (const x of R) x.box = x.optEls.map((o) => [o.offsetLeft + 22, o.offsetWidth]); },
    // tIn: row appears; tScan: pill sweeps the options; tPick: lands on r.pick
    paintRow(i, t, tIn, tPick) {
      const x = R[i];
      const a = sp(t, tIn, P.default);
      x.row.style.opacity = win(t, tIn, Infinity, 0.25).toFixed(3);
      x.row.style.transform = `translateY(${((1 - a) * 22).toFixed(2)}px)`;
      // the pill visits each option, then settles on the pick (indicator-like, two springs)
      const seq = x.r.scan || [0, 1, 2];
      const stops = [];
      const span = (tPick - tIn - 0.25) / seq.length;
      seq.forEach((k, j) => stops.push([tIn + 0.25 + j * span, k]));
      stops.push([tPick, x.r.pick]);
      let L = x.box[seq[0]][0], Rr = L + x.box[seq[0]][1];
      for (let j = 1; j < stops.length; j++) {
        const [ts, k] = stops[j];
        const [pl, pw] = x.box[stops[j - 1][1]], [nl, nw] = x.box[k];
        const dir = Math.sign(nl - pl);
        const lead = sp(t, ts, P.snappy), trail = sp(t, ts, { k: 140, d: 22 });
        L += (nl - pl) * (dir > 0 ? trail : lead);
        Rr += (nl + nw - (pl + pw)) * (dir > 0 ? lead : trail);
      }
      x.pick.style.left = L.toFixed(2) + 'px';
      x.pick.style.width = Math.max(0, Rr - L).toFixed(2) + 'px';
      x.pick.style.opacity = win(t, tIn + 0.2, Infinity, 0.2).toFixed(3);
      const done = t >= tPick;
      const pu = sp(t, tPick, P.snappy);
      x.pick.style.background = done ? '#262a44' : '#202027';
      x.pick.style.boxShadow = done ? `inset 0 0 0 ${(1.5 + pu * 0.5).toFixed(2)}px #6f86ff` : 'inset 0 0 0 1.5px #3a3a44';
      x.optEls.forEach((o, k) => { o.style.color = done && k === x.r.pick ? '#ffffff' : '#9a9aa2'; });
      x.why.style.opacity = win(t, tPick + 0.05, Infinity, 0.25).toFixed(3);
      x.price.style.opacity = win(t, tPick + 0.15, Infinity, 0.25).toFixed(3);
      x.why.style.transform = `translateX(${((1 - sp(t, tPick, P.default)) * 14).toFixed(2)}px)`;
    },
  };
}

// ---- agent windows: Claude Code, Codex, Gemini CLI, Cursor, and the merged Superbot ----
const GEM_ASCII = [
  ' ██      ██████  ███████ ███    ███ ██ ███    ██ ██',
  '  ██    ██       ██      ████  ████ ██ ████   ██ ██',
  '   ██   ██   ███ █████   ██ ████ ██ ██ ██ ██  ██ ██',
  '  ██    ██    ██ ██      ██  ██  ██ ██ ██  ██ ██ ██',
  ' ██      ██████  ███████ ██      ██ ██ ██   ████ ██',
].join('\n');

export function agentWin(kind) {
  const el = h('div', 'win ' + kind);
  const a = AGENTS.find((x) => x.key === kind);
  el.innerHTML = `<div class="w-bar"><div class="lights"><i></i><i></i><i></i></div></div><div class="w-title"></div><div class="w-body"></div>`;
  const title = el.querySelector('.w-title');
  title.appendChild(tile(a.logo));
  title.appendChild(h('span', '', { claude: 'claude — ~/shop', codex: 'codex — ~/shop', gemini: 'gemini — ~/shop', cursor: 'shop — Cursor' }[kind]));
  const body = el.querySelector('.w-body');
  if (kind === 'claude') {
    body.innerHTML = `<div class="box hello"><span class="acc">✻</span> Welcome to <b>Claude Code</b>!

  <span class="dim">/help for help, /status for your current setup</span>

  <span class="dim">cwd: ~/shop</span></div><div class="out"></div><div class="inbox">&gt; <span class="in"></span><span class="cur"></span></div>
<div class="foot"><span>? for shortcuts</span><span>Opus · Claude Max</span></div>`;
  } else if (kind === 'codex') {
    body.innerHTML = `<div class="box">&gt;_ <b>OpenAI Codex</b> <span class="dim">(v0.160.0)</span>

<span class="dim">model:</span>     gpt-6-sol   <span class="blu">/model</span> <span class="dim">to change</span>
<span class="dim">directory:</span> ~/shop</div><div class="dim">  To get started, describe a task or try one of these commands:</div><div class="out"></div>
<div>› <span class="in"></span><span class="cur"></span></div><div class="foot"><span>⏎ send   ⇧⏎ newline</span><span>ChatGPT Pro · 100% context left</span></div>`;
  } else if (kind === 'gemini') {
    body.innerHTML = `<div class="gem-logo"></div><div class="dim">Tips for getting started:
1. Ask questions, edit files, or run commands.
2. Be specific for the best results.</div><div class="out"></div><div class="inbox" style="margin-top:12px">&gt; <span class="in"></span><span class="cur"></span></div>
<div class="foot"><span>~/shop</span><span>no sandbox</span><span>gemini-3.8-flash (100% context left)</span></div>`;
    body.querySelector('.gem-logo').textContent = GEM_ASCII;
    body.querySelector('.gem-logo').style.fontSize = '12px';
  } else if (kind === 'cursor') {
    body.innerHTML = `<div class="ide"><div class="tree">▾ shop<br>&nbsp;▾ src<br>&nbsp;&nbsp;&nbsp;<span class="on">cart.tsx</span><br>&nbsp;&nbsp;&nbsp;checkout.ts<br>&nbsp;&nbsp;&nbsp;api.ts<br>&nbsp;▸ tests<br>&nbsp;package.json</div>
<div class="code"><span class="ln">1</span><span class="blu">export</span> <span class="blu">function</span> <span class="yel">Cart</span>({ items }) {
<span class="ln">2</span>  <span class="blu">const</span> total = items.reduce(
<span class="ln">3</span>    (s, i) =&gt; s + i.price * i.qty, 0)
<span class="ln">4</span>  <span class="blu">return</span> (
<span class="ln">5</span>    &lt;<span class="grn">section</span> className=<span class="yel">"cart"</span>&gt;
<span class="ln">6</span>      {items.map(Row)}
<span class="ln">7</span>      &lt;<span class="grn">Total</span> value={total} /&gt;
<span class="ln">8</span>    &lt;/<span class="grn">section</span>&gt;
<span class="ln">9</span>  )
<span class="ln">10</span>}</div>
<div class="agent"><div class="ah"><span>Agent</span><span style="color:#6e6e76">New chat</span></div><div class="out"></div>
<div class="inp"><div><span class="in"></span><span class="cur" style="width:7px;height:16px;background:#d8d8dc;display:inline-block;vertical-align:-3px"></span></div><div class="ctl"><span>∞ Agent ▾</span><span>Auto ▾</span></div></div></div></div>`;
  }
  return { el, kind, inEl: body.querySelector('.in'), cur: body.querySelector('.cur'), out: body.querySelector('.out'), body };
}

// the merged agent: one window, the four agents' tiles inside its header
export function sbWin({ title = 'superbot — ~/shop', sub = 'one key · every step routed to the best model' } = {}) {
  const el = h('div', 'win sb');
  el.innerHTML = `<div class="w-bar"><div class="lights"><i></i><i></i><i></i></div></div><div class="w-title"></div><div class="w-body"></div>`;
  const title_ = el.querySelector('.w-title');
  const tm = mark(22);
  title_.appendChild(tm.host);
  title_.appendChild(h('span', '', title));
  const body = el.querySelector('.w-body');
  const head = h('div', 'sbhead');
  const m = mark(46);
  head.appendChild(m.host);
  head.appendChild(h('div', '', `<div class="t1">Superbot</div><div class="t2">${sub}</div>`));
  const inside = h('div', 'inside');
  const tiles = AGENTS.map((a) => { const x = tile(a.logo); inside.appendChild(x); return x; });
  head.appendChild(inside);
  body.appendChild(head);
  const prompt = h('div', '', '› <span class="in"></span><span class="cur"></span>');
  prompt.style.marginBottom = '10px';
  body.appendChild(prompt);
  const steps = h('div', 'steps');
  body.appendChild(steps);
  return { el, body, head, mark: m, titleMark: tm, tiles, inEl: prompt.querySelector('.in'), cur: prompt.querySelector('.cur'), steps };
}

// a plan step labelled with the model it was routed to
export function stepRow(text, model, ms) {
  const el = h('div', 'step');
  el.innerHTML = `<span class="ic"><span class="spin"></span><span class="ok">${ICON.ok}</span></span><span class="tx">${text}</span><span class="dots"></span>`;
  const c = chip(model);
  el.appendChild(c);
  el.appendChild(h('span', 'ms', ms || ''));
  const spin = el.querySelector('.spin'), ok = el.querySelector('.ok'), msEl = el.querySelector('.ms'), dots = el.querySelector('.dots');
  return {
    el, chip: c,
    paint(t, tIn, tDone) {
      const a = sp(t, tIn, P.default);
      el.style.opacity = win(t, tIn, Infinity, 0.22).toFixed(3);
      el.style.transform = `translateY(${((1 - a) * 18).toFixed(2)}px)`;
      const cu = sp(t, tIn + 0.18, P.snappy);
      c.style.opacity = clamp(cu * 1.3).toFixed(3);
      c.style.transform = `translateX(${((1 - cu) * 26).toFixed(2)}px) scale(${(0.9 + 0.1 * cu).toFixed(3)})`;
      dots.style.opacity = win(t, tIn + 0.1, Infinity, 0.3).toFixed(3);
      spin.style.opacity = t < tDone ? 1 : 0;
      spin.style.transform = `rotate(${((t - tIn) * 400).toFixed(1)}deg)`;
      const d = sp(t, tDone, P.snappy);
      ok.style.opacity = t >= tDone ? 1 : 0;
      ok.style.transform = `scale(${(0.5 + 0.5 * d).toFixed(3)})`;
      msEl.style.opacity = win(t, tDone, Infinity, 0.2).toFixed(3);
    },
  };
}

// ---- bar chart: list price per 1M output tokens ----
export function priceChart(keys, { title, sub, hi, maxH = 420, bracket }) {
  const el = h('div', 'chart');
  el.appendChild(h('div', 'c-t', title));
  el.appendChild(h('div', 'c-s', sub));
  el.appendChild(h('div', 'axis'));
  const max = Math.max(...keys.map((k) => M[k].out));
  const gap = 1400 / keys.length;
  const bars = keys.map((k, i) => {
    const cx = gap * i + gap / 2;
    const hgt = (M[k].out / max) * maxH;
    const bar = h('div', 'bar ' + (hi.includes(k) ? 'hi' : 'lo'));
    at(bar, cx - 100, null, 200, hgt); bar.style.top = 'auto';
    const val = h('div', 'val', `$${M[k].out.toFixed(2)}`);
    val.style.left = cx - 100 + 'px'; val.style.bottom = 122 + hgt + 14 + 'px';
    const lab = h('div', 'lab');
    lab.appendChild(tile(M[k].logo));
    lab.appendChild(h('span', '', M[k].name));
    lab.style.left = cx - 130 + 'px';
    el.appendChild(bar); el.appendChild(val); el.appendChild(lab);
    return { bar, val, lab, hgt, cx, k };
  });
  let brk = null, brkT = null;
  if (bracket) {
    const a = bars[bracket.from], b = bars[bracket.to];
    const top = Math.max(a.hgt, b.hgt) + 122 + 70;
    brk = h('div', 'brk'); brk.style.left = a.cx - 110 + 'px'; brk.style.width = b.cx - a.cx + 220 + 'px'; brk.style.bottom = top + 'px';
    brkT = h('div', 'brk-t', bracket.text); brkT.style.left = a.cx - 110 + 'px'; brkT.style.width = b.cx - a.cx + 220 + 'px'; brkT.style.bottom = top + 40 + 'px';
    el.appendChild(brk); el.appendChild(brkT);
  }
  return {
    el,
    paint(t, t0) {
      bars.forEach((b, i) => {
        const ti = t0 + 0.35 + i * 0.22;
        const u = sp(t, ti, P.heavy);
        b.bar.style.transform = `scaleY(${clamp(u, 0, 1.2).toFixed(4)})`;
        b.val.style.opacity = win(t, ti + 0.35, Infinity, 0.25).toFixed(3);
        b.val.style.transform = `translateY(${((1 - u) * b.hgt).toFixed(1)}px)`;
        b.val.textContent = '$' + (M[b.k].out * clamp(u * 1.02)).toFixed(2);
        b.lab.style.opacity = win(t, t0 + 0.1 + i * 0.12, Infinity, 0.3).toFixed(3);
      });
      if (brk) {
        const tb = t0 + 0.35 + bars.length * 0.22 + 0.5;
        const u = sp(t, tb, P.default);
        brk.style.opacity = win(t, tb, Infinity, 0.25).toFixed(3);
        brk.style.transform = `scaleX(${(0.85 + 0.15 * u).toFixed(3)})`;
        brkT.style.opacity = win(t, tb + 0.12, Infinity, 0.25).toFixed(3);
        brkT.style.transform = `translateY(${((1 - u) * 10).toFixed(2)}px)`;
      }
    },
  };
}

// ---- end lockup: mark, the line, the sub line ----
export const END_LINE = 'Superbot is all your agents in one.';
export function endLock(sub) {
  const el = h('div', 'layer');
  const m = mark(150);
  m.host.classList.add('end-mk');
  m.host.style.position = 'absolute';
  el.appendChild(m.host);
  const line = h('div', 'end-line');
  const words = END_LINE.split(' ').map((w) => { const s = h('span', '', w); line.appendChild(s); line.appendChild(document.createTextNode(' ')); return s; });
  el.appendChild(line);
  const subEl = h('div', 'end-sub', sub);
  el.appendChild(subEl);
  return {
    el,
    paint(t, t0) {
      const mu = sp(t, t0, P.heavy);
      m.host.style.opacity = clamp(mu * 1.5).toFixed(3);
      m.host.style.transform = `translateY(${((1 - mu) * 40).toFixed(2)}px) scale(${(0.82 + 0.18 * mu).toFixed(4)})`;
      driveMark(m, t, { happy: t > t0 + 1.6 && t < t0 + 2.4 });
      words.forEach((w, i) => {
        const ti = t0 + 0.45 + i * 0.09;
        const u = sp(t, ti, P.heavy);
        w.style.opacity = clamp(u * 1.4).toFixed(3);
        w.style.transform = `translateY(${((1 - u) * 34).toFixed(2)}px)`;
        w.style.filter = u < 0.98 ? `blur(${((1 - u) * 8).toFixed(2)}px)` : 'none';
      });
      const su = sp(t, t0 + 1.4, P.default);
      subEl.style.opacity = clamp(su).toFixed(3);
      subEl.style.transform = `translateY(${((1 - su) * 14).toFixed(2)}px)`;
    },
  };
}

// ---- code panel with optional diff lines ----
export function codePanel(title, lines, w) {
  const el = h('div', 'code-panel');
  el.style.width = w + 'px';
  el.innerHTML = `<div class="cp-h">${title}</div><div class="cp-b"></div>`;
  const b = el.querySelector('.cp-b');
  const L = lines.map((ln, i) => {
    const d = h('div', 'ln' + (ln.sg === '-' ? ' del' : ln.sg === '+' ? ' add' : ''), `<span class="no">${ln.no ?? i + 1}</span><span class="sg">${ln.sg && ln.sg !== ' ' ? ln.sg : ''}</span>${ln.html}`);
    b.appendChild(d);
    return d;
  });
  return { el, lines: L };
}
