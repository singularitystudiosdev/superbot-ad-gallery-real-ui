/* ghx7 beat D, THE RACE: three models, one failing test, three patches. A pure function of t.
   window.seek(t) draws local time t (0 to 5.2 s; spot time 2.90 to 8.10). No Math.random, no wall clock in a seeked
   frame: every opacity, transform, typed character and line of output is computed from t, and the superbot mark's own
   CSS keyframes are paused and pinned to t (pinAnimations). ?t=<s> freezes one frame; no query plays a live loop.
   window.__ready resolves once the avatars, logos and fonts are in, so the renderer never captures a half-loaded page.

   Story facts are the design bible's (SCRATCH/bible.c76daf74.txt): kitebase/web, issue #482, branch
   fix/482-session-refresh, the command pnpm vitest run src/auth/session.test.ts -t "Remember me", the first run
   "Tests 1 failed | 2 passed (3)", Gemini patches cookies.ts maxAge, GPT-6 Astra refreshes early in session.ts with no
   cross-tab lock, Claude Opus 5.5 refreshes early (session.ts) and shares one refresh across tabs with a
   BroadcastChannel (refresh.ts) and passes (3 passed). */
(function () {
  'use strict';
  const DUR = 5.2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (x) => 1 - Math.pow(1 - x, 3);
  const eBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const mix = (a, b, x) => a + (b - a) * x;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixc = (a, b, x) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], x))).join(',')})`; };

  /* Octicons (GitHub, MIT), path data verbatim from ../../niche-github-model-switch-superbot-0cb69286/scenes/tabs-assets/
     beats/gh-icons.js (fetched there from the Iconify API on 2026-10-03). */
  const P = (d) => `<path fill="currentColor" d="${d}"/>`;
  const OCT = {
    'issue-opened': P('M8 9.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3') + P('M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M1.5 8a6.5 6.5 0 1 0 13 0a6.5 6.5 0 0 0-13 0'),
    'git-branch': P('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.5 2.5 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25m-6 0a.75.75 0 1 0 1.5 0a.75.75 0 0 0-1.5 0m8.25-.75a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5M4.25 12a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5'),
    'check-circle-fill': P('M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16m3.78-9.72a.75.75 0 0 0-.018-1.042a.75.75 0 0 0-1.042-.018L6.75 9.19L5.28 7.72a.75.75 0 0 0-1.042.018a.75.75 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z'),
  };
  const oct = (name) => `<svg viewBox="0 0 16 16" aria-hidden="true">${OCT[name]}</svg>`;

  /* ---------------- syntax colouring for the editor panes ---------------- */
  const KW = new Set('import from export const let function return async await if new type null undefined true false typeof as'.split(' '));
  const TY = new Set('Session Promise ReturnType BroadcastChannel'.split(' '));
  function hl(src) {
    let out = '', m;
    const re = /(\/\/.*$)|("[^"]*"?)|(\b\d[\d_]*\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;
    while ((m = re.exec(src))) {
      if (m[1]) out += `<span class="c">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="n">${m[3]}</span>`;
      else if (m[4]) {
        const w = m[4], next = src[re.lastIndex];
        const cls = KW.has(w) ? 'k' : TY.has(w) ? 't' : next === '(' ? 'f' : 'v';
        out += `<span class="${cls}">${w}</span>`;
      } else out += esc(m[0]);
    }
    return out;
  }

  /* ---------------- the three racers ---------------- */
  const T1 = 'keeps Remember me sessions alive past 15 minutes';
  const T2 = 'Remember me survives a reload';
  const T3 = 'second tab keeps the session';
  const CMD = 'pnpm vitest run src/auth/session.test.ts -t "Remember me"';
  const PUSH = 'git push origin fix/482-session-refresh';
  const PROMPT = '<span class="pu">mira@kitebase-web</span> <span class="pb">fix/482-session-refresh</span> <span class="pp">%</span> ';

  const RACERS = [
    { name: 'Gemini', logo: 'brand/gemini-logo.svg', lc: '', x: 48,
      files: [{ name: 'cookies.ts', dir: 'src/auth', start: 14, lines: [
        [' ', 'export const SESSION_COOKIE = "kb_session";'],
        [' ', 'const MINUTE = 60;'],
        [' ', ''],
        [' ', 'export function sessionCookie(remember: boolean) {'],
        [' ', '  return {'],
        [' ', '    httpOnly: true,'],
        [' ', '    sameSite: "lax",'],
        ['-', '    maxAge: remember ? 15 * MINUTE : undefined,'],
        ['+', '    // Remember me: keep the cookie for 30 days'],
        ['+', '    maxAge: remember ? 30 * 24 * 60 * MINUTE : undefined,'],
        [' ', '    path: "/",'],
        [' ', '  };'],
      ] }],
      segs: [{ f: 0, a: 1.34, b: 2.46 }],
      rerun: { end: 3.86, pass: false, failName: T1, msg: 'refresh still scheduled after expiry', at: ':57:38', marks: ['x', 'v', 'v'], ms: '44ms', dur: '1.09s' } },
    { name: 'Claude Opus 5.5', logo: 'brand/claude-logo.svg', lc: 'claude', x: 666,
      files: [
        { name: 'session.ts', dir: 'src/auth', start: 83, lines: [
          [' ', 'let timer: ReturnType<typeof setTimeout> | undefined;'],
          ['+', 'const REFRESH_LEAD_MS = 60_000;'],
          [' ', ''],
          [' ', 'export function scheduleRefresh(s: Session) {'],
          [' ', '  clearTimeout(timer);'],
          [' ', '  const ttl = s.expiresAt - Date.now();'],
          ['-', '  timer = setTimeout(refreshSession, ttl);'],
          ['+', '  // refresh before expiry, once for every open tab'],
          ['+', '  const at = Math.max(ttl - REFRESH_LEAD_MS, 0);'],
          ['+', '  timer = setTimeout(refreshShared, at);'],
          [' ', '}'],
          [' ', ''],
        ] },
        { name: 'refresh.ts', dir: 'src/auth', start: 36, lines: [
          [' ', 'import { postRefresh, waitForPeer } from "./api";'],
          ['+', 'const tabs = new BroadcastChannel("kb-auth");'],
          ['+', 'let inflight: Promise<Session> | null = null;'],
          ['+', 'tabs.onmessage = () => (inflight ??= waitForPeer());'],
          [' ', ''],
          ['-', 'export async function refreshSession() {'],
          ['-', '  return postRefresh();'],
          ['+', 'export function refreshShared(): Promise<Session> {'],
          ['+', '  if (inflight) return inflight;'],
          ['+', '  tabs.postMessage("refresh");'],
          ['+', '  inflight = postRefresh();'],
          ['+', '  return inflight.finally(() => (inflight = null));'],
        ] },
      ],
      segs: [{ f: 0, a: 1.36, b: 2.12 }, { f: 1, a: 2.22, b: 3.24 }],
      rerun: { end: 4.06, pass: true, marks: ['v', 'v', 'v'], ms: '47ms', dur: '1.14s' } },
    { name: 'GPT-6 Astra', logo: 'brand/openai-logo.svg', lc: 'openai', x: 1284,
      files: [{ name: 'session.ts', dir: 'src/auth', start: 83, lines: [
        [' ', 'let timer: ReturnType<typeof setTimeout> | undefined;'],
        [' ', ''],
        [' ', 'export function scheduleRefresh(s: Session) {'],
        [' ', '  clearTimeout(timer);'],
        [' ', '  const ttl = s.expiresAt - Date.now();'],
        ['-', '  timer = setTimeout(refreshSession, ttl);'],
        ['+', '  // refresh one minute before the token expires'],
        ['+', '  const lead = Math.max(ttl - 60_000, 0);'],
        ['+', '  timer = setTimeout(refreshSession, lead);'],
        [' ', '}'],
        [' ', ''],
        [' ', 'export function clearSession() {'],
      ] }],
      segs: [{ f: 0, a: 1.38, b: 2.76 }],
      rerun: { end: 3.96, pass: false, failName: T3, msg: "expected 'signed-out' to be 'active'", at: ':84:31', marks: ['v', 'v', 'x'], ms: '52ms', dur: '1.16s' } },
  ];
  const OPUS = 1;

  /* the shared beats (local t) */
  const B = {
    type1: [0.44, 0.92], enter1: 0.96, run1: [0.98, 1.22], prompt1: 1.25,
    recall: 3.36, enter2: 3.46, run2: 3.48,
    green: [4.06, 4.24], kept: [4.30, 4.52], dim: [4.30, 4.60],
    push: [4.36, 4.60], pushEnter: 4.66, pushOut: [4.70, 5.00], prompt3: 5.04,
  };

  /* each file's changes, timed across its segment by weight (a removed line is marked fast, an added one is typed) */
  for (const r of RACERS) {
    for (const f of r.files) f.ev = f.lines.map(() => null);
    for (const s of r.segs) {
      const f = r.files[s.f];
      const idx = f.lines.map((l, i) => (l[0] === ' ' ? -1 : i)).filter((i) => i >= 0);
      const w = idx.map((i) => (f.lines[i][0] === '-' ? 9 : Math.max(8, f.lines[i][1].length)));
      const tot = w.reduce((a, b) => a + b, 0);
      let acc = 0;
      idx.forEach((i, k) => {
        const ta = s.a + (s.b - s.a) * (acc / tot);
        acc += w[k];
        f.ev[i] = { ta, tb: s.a + (s.b - s.a) * (acc / tot) };
      });
    }
  }

  /* ---------------- vitest output ---------------- */
  const FILE = '<span class="dim">src/auth/</span>session.test.ts';
  function runLines(o) {
    // o: { pass, failName, msg, at, marks, ms, dur }
    const L = [];
    L.push('');
    L.push(' <span class="br2"> RUN </span> <span class="cyn">v3.2.4</span> <span class="dim">/Users/mira/kitebase-web</span>');
    L.push('');
    L.push(o.pass
      ? ` <span class="grn">✓</span> ${FILE} <span class="dim">(3 tests)</span> <span class="dim">${o.ms}</span>`
      : ` <span class="red">❯</span> ${FILE} <span class="dim">(3 tests | </span><span class="red">1 failed</span><span class="dim">)</span> <span class="dim">${o.ms}</span>`);
    [T1, T2, T3].forEach((n, i) => {
      if (o.marks[i] === 'v') L.push(`   <span class="grn">✓</span> session &gt; ${esc(n)}`);
      else { L.push(`   <span class="red">×</span> session &gt; ${esc(n)}`); L.push(`     <span class="red">→ ${esc(o.msg)}</span>`); }
    });
    if (!o.pass) {
      L.push('');
      L.push({ rule: 'Failed Tests 1' });
      L.push('');
      L.push(`<span class="bf"> FAIL </span> ${FILE} &gt; session &gt; ${esc(o.failName)}`);
      L.push(`<span class="red"><b>AssertionError</b>: ${esc(o.msg)}</span>`);
      L.push(` <span class="cyn">❯</span> src/auth/session.test.ts<span class="dim">${o.at}</span>`);
    }
    L.push('');
    L.push(o.pass
      ? ' <span class="dim">Test Files</span>  <b class="grn">1 passed</b> <span class="dim">(1)</span>'
      : ' <span class="dim">Test Files</span>  <b class="red">1 failed</b> <span class="dim">(1)</span>');
    L.push(o.pass
      ? '      <span class="dim">Tests</span>  <b class="grn">3 passed</b> <span class="dim">(3)</span>'
      : '      <span class="dim">Tests</span>  <b class="red">1 failed</b> <span class="dim">|</span> <b class="grn">2 passed</b> <span class="dim">(3)</span>');
    L.push(`   <span class="dim">Duration</span>  ${o.dur}`);
    return L;
  }
  // timed: RUN at t0, then the report lands over the last 45% of the run, the summary at tEnd
  function timed(lines, t0, tEnd) {
    const out = [];
    const rest = lines.length - 3;
    lines.forEach((l, i) => {
      const at = i < 3 ? t0 : mix(t0 + (tEnd - t0) * 0.55, tEnd, (i - 3) / Math.max(1, rest - 1));
      out.push({ at, line: l });
    });
    return out;
  }
  const PUSH_OUT = [
    'Enumerating objects: 13, done.',
    'Counting objects: 100% (13/13), done.',
    'Compressing objects: 100% (7/7), done.',
    'Writing objects: 100% (7/7), 1.84 KiB | 1.84 MiB/s, done.',
    'Total 7 (delta 5), reused 0 (delta 0), pack-reused 0',
    'remote: Resolving deltas: 100% (5/5), completed with 5 local objects.',
    "remote: Create a pull request for 'fix/482-session-refresh' on GitHub by visiting:",
    'remote:      https://github.com/kitebase/web/pull/new/fix/482-session-refresh',
    'To github.com:kitebase/web.git',
    ' * [new branch]      fix/482-session-refresh -&gt; fix/482-session-refresh',
  ].map((s) => s.replace(/^(remote:)/, '<span class="dim">$1</span>').replace(/\[new branch\]/, '<span class="grn">[new branch]</span>'));

  // every racer's terminal script: prompt lines (typed) and output lines, each with the time it appears
  for (const [i, r] of RACERS.entries()) {
    const S = [];
    S.push({ at: 0, prompt: true, cmd: CMD, ta: B.type1[0], tb: B.type1[1], enter: B.enter1 });
    const first = { pass: false, failName: T1, msg: 'expected null to be truthy', at: ':57:38', marks: ['x', 'v', 'v'], ms: '41ms', dur: '1.12s' };
    S.push(...timed(runLines(first), B.run1[0], B.run1[1]));
    S.push({ at: B.prompt1, prompt: true, cmd: CMD, ta: B.recall, tb: B.recall + 0.02, enter: B.enter2 });
    S.push(...timed(runLines(r.rerun), B.run2, r.rerun.end));
    if (i === OPUS) {
      S.push({ at: r.rerun.end + 0.04, prompt: true, cmd: PUSH, ta: B.push[0], tb: B.push[1], enter: B.pushEnter });
      PUSH_OUT.forEach((l, k) => S.push({ at: mix(B.pushOut[0], B.pushOut[1], k / (PUSH_OUT.length - 1)), line: l }));
      S.push({ at: B.prompt3, prompt: true, cmd: '', ta: 99, tb: 99, enter: 99 });
    } else {
      S.push({ at: r.rerun.end + 0.04, prompt: true, cmd: '', ta: 99, tb: 99, enter: 99 });
    }
    r.script = S;
  }

  /* ---------------- DOM ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const wins = $('#wins');
  for (const r of RACERS) {
    const w = document.createElement('section');
    w.className = 'win';
    w.style.left = r.x + 'px';
    w.innerHTML = `
      <div class="tbar"><div class="lights"><i></i><i></i><i></i></div>
        <span class="logo ${r.lc}"><img src="${r.logo}" alt=""></span><span class="mname">${r.name}</span>
        <span class="tright"><span class="path">~/kitebase-web</span><span class="ok">${oct('check-circle-fill')}</span><span class="okt">Tests pass</span></span></div>
      <div class="ed"><div class="tabs">${r.files.map((f) => `<div class="tab"><span class="ts">TS</span><span>${f.name}</span><span class="path">${f.dir}</span><span class="dot"></span></div>`).join('')}</div>
        <div class="code"><div class="inner"></div></div></div>
      <div class="term"><div class="tclip"><div class="tin"></div></div></div>
      <div class="res"></div>`;
    wins.appendChild(w);
    r.el = w;
    r.tabs = [...w.querySelectorAll('.tab')];
    r.code = $('.code .inner', w);
    r.term = $('.tclip', w);
    r.tin = $('.tin', w);
    r.res = $('.res', w);
    r.ok = $('.tright .ok', w);
    r.okt = $('.tright .okt', w);
    r.path = $('.tright .path', w);
  }
  document.querySelectorAll('i.oct[data-oct]').forEach((i) => { i.innerHTML = oct(i.dataset.oct); });

  // avatars: the image agent's PNGs; a drawn initials disc only if one is missing
  const loads = [];
  document.querySelectorAll('.av[data-src]').forEach((el) => {
    const img = new Image();
    loads.push(new Promise((res) => {
      img.onload = () => { el.appendChild(img); res(); };
      img.onerror = () => { el.textContent = el.dataset.fb; el.style.background = el.dataset.fbc; el.classList.add('fb'); res(); };
    }));
    img.alt = '';
    img.src = el.dataset.src;
  });
  document.querySelectorAll('.logo img').forEach((img) => loads.push(img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })));

  // the superbot mark: the verbatim markup from assets/sb-mark-live.js, without its random blink timer (eyes from t)
  let markSvg = '';
  (function () {
    const tmp = document.createElement('div');
    const m = window.sbMarkLive(tmp, { size: 0, interactive: false });
    markSvg = m.html; m.destroy();
  })();
  let uid = 0;
  function mountMark(host, size) {
    const id = 'sb-race-mark-' + (++uid);
    host.innerHTML = `<span class="mark-wrap">${markSvg.split('sb-gate-mark').join(id)}</span>`;
    const svg = host.querySelector('svg');
    svg.style.width = size + 'px'; svg.style.height = size + 'px';
    return svg;
  }
  const stripMark = mountMark($('#stripMark'), 44);
  const keptMark = mountMark($('#keptMark'), 54);
  function eyes(svg, shut) {
    svg.querySelectorAll('.mark-eye').forEach((e) => e.setAttribute('ry', shut ? '1' : '11'));
  }

  /* ---------------- drawing ---------------- */
  function drawEditor(r, t) {
    // the active file: the one whose segment started last (the first file before any)
    let fi = r.segs[0].f;
    for (const s of r.segs) if (t >= s.a - 0.06) fi = s.f;
    r.tabs.forEach((tab, i) => {
      tab.classList.toggle('on', i === fi);
      const f = r.files[i];
      const touched = f.ev.some((e) => e && t >= e.ta);
      tab.querySelector('.dot').style.opacity = touched ? 1 : 0;
    });
    const f = r.files[fi];
    let no = f.start, html = '', rows = 0, caretRow = -1;
    f.lines.forEach(([k, src], i) => {
      const ev = f.ev[i];
      if (k === '+') {
        if (!ev || t < ev.ta) return;
        const n = Math.round(src.length * prog(t, ev.ta, ev.tb));
        const typing = t < ev.tb;
        if (typing) caretRow = rows;
        html += `<div class="ln add"><span class="no">${no++}</span><span class="gut">+</span><span class="src">${hl(src.slice(0, n))}${typing ? '<i class="caret"></i>' : ''}</span></div>`;
      } else if (k === '-' && ev && t >= ev.ta) {
        html += `<div class="ln del"><span class="no"></span><span class="gut">-</span><span class="src">${esc(src)}</span></div>`;
      } else {
        html += `<div class="ln"><span class="no">${no++}</span><span class="gut"></span><span class="src">${hl(src)}</span></div>`;
      }
      rows++;
    });
    r.code.innerHTML = html;
    const shift = Math.max(0, (caretRow >= 0 ? caretRow : rows - 1) - 11, rows - 12 > 0 && caretRow < 0 ? rows - 12 : 0);
    r.code.style.transform = `translateY(${-shift * 20}px)`;
  }

  function drawTerm(r, t) {
    let html = '';
    const S = r.script;
    let last = -1;
    S.forEach((e, i) => { if (t >= e.at) last = i; });
    for (let i = 0; i <= last; i++) {
      const e = S[i];
      if (e.prompt) {
        const n = Math.round(e.cmd.length * prog(t, e.ta, e.tb));
        const idle = t < e.enter;
        const typing = t >= e.ta && t < e.tb;
        const blinkOn = typing || Math.floor((t - e.at) / 0.5) % 2 === 0;
        html += `<div class="tl">${PROMPT}${esc(e.cmd.slice(0, n))}${idle && blinkOn ? '<i class="cur"></i>' : ''}</div>`;
      } else if (e.line && e.line.rule) {
        html += `<div class="tl rule"><span>${e.line.rule}</span></div>`;
      } else {
        html += `<div class="tl">${e.line}</div>`;
      }
    }
    r.tin.innerHTML = html;
    const avail = r.term.clientHeight;
    const over = r.tin.scrollHeight - avail;
    r.tin.style.transform = over > 0 ? `translateY(${-Math.ceil(over / 19) * 19}px)` : 'none';
  }

  function counts(pass) {
    return pass
      ? '<span class="badge pass">PASS</span><span class="counts"><span class="p">3 passed</span></span>'
      : '<span class="badge fail">FAIL</span><span class="counts"><span class="f">1 failed</span> <span class="sep">|</span> <span class="p">2 passed</span></span>';
  }
  function drawRes(r, t) {
    const seg0 = r.segs[0].a, segN = r.segs[r.segs.length - 1].b;
    const spin = (label) => `<span class="st"><i class="spin" style="transform:rotate(${Math.round(t * 540) % 360}deg)"></i>${label}</span>`;
    let h;
    if (t < B.enter1) h = `<span class="st"><i class="spin" style="border-top-color:#3a3a3f"></i>Ready</span>`;
    else if (t < B.run1[1]) h = spin('Running tests');
    else if (t < seg0) h = counts(false);
    else if (t < segN) h = spin('Writing a patch');
    else if (t < B.enter2) h = `<span class="st"><i class="oct okc">${oct('check-circle-fill')}</i>Patch ready</span>`;
    else if (t < r.rerun.end) h = spin('Running tests');
    else h = counts(r.rerun.pass);
    r.res.innerHTML = h;
  }

  function pinAnimations(t) {
    for (const a of document.getAnimations()) {
      a.pause();
      const name = a.animationName || '';
      a.currentTime = name === 'mark-happy-bob' ? Math.max(0, (t - 4.44) * 1000) : t * 1000;
    }
  }

  function seek(t) {
    t = clamp(+t || 0, 0, DUR);
    // top strip
    const ps = eOut(prog(t, -0.08, 0.24)); // already partly in at t = 0: the ad cuts straight in, never on an empty stage
    const strip = $('#strip');
    strip.style.opacity = ps;
    strip.style.transform = `translateY(${(1 - ps) * -12}px)`;
    eyes(stripMark, (t >= 1.95 && t < 2.07) || (t >= 3.70 && t < 3.82));

    RACERS.forEach((r, i) => {
      // slide in, staggered (the first already moving at t = 0), done by 0.36
      const p = eOut(prog(t, i * 0.06 - 0.06, i * 0.06 + 0.24));
      let op = p;
      if (i !== OPUS) op *= mix(1, 0.45, eOut(prog(t, B.dim[0], B.dim[1])));
      r.el.style.opacity = op.toFixed(3);
      r.el.style.transform = `translateY(${((1 - p) * 46).toFixed(2)}px) scale(${(0.97 + 0.03 * p).toFixed(4)})`;
      if (i === OPUS) {
        const g = eOut(prog(t, B.green[0], B.green[1]));
        r.el.style.setProperty('--ring', g > 0 ? mixc('#2c2c31', '#3ddc84', g) : '#2c2c31');
        r.el.style.setProperty('--ringw', (g * 3).toFixed(2) + 'px');
        r.el.style.setProperty('--hbg', mixc('#1b1b1e', '#123222', g));
        const on = t >= B.green[0] + 0.04;
        const pop = eBack(prog(t, B.green[0] + 0.04, B.green[0] + 0.22));
        r.ok.style.display = on ? 'block' : 'none';
        r.okt.style.display = on ? 'block' : 'none';
        r.ok.style.transform = `scale(${pop.toFixed(3)})`;
        r.okt.style.opacity = prog(t, B.green[0] + 0.08, B.green[0] + 0.2).toFixed(3);
        r.path.style.display = on ? 'none' : '';
      }
      drawEditor(r, t);
      drawTerm(r, t);
      drawRes(r, t);
    });

    // the Kept stamp lands on the Opus window's editor
    const kept = $('#kept');
    const pk = prog(t, B.kept[0], B.kept[1]);
    const sc = t < B.kept[0] ? 1.6 : mix(1.6, 1, eBack(pk));
    kept.style.opacity = eOut(prog(t, B.kept[0], B.kept[0] + 0.08)).toFixed(3);
    kept.style.left = (666 + 588 - 252) + 'px';
    kept.style.top = (120 + 56 + 132) + 'px';
    kept.style.transform = `rotate(-6deg) scale(${sc.toFixed(4)})`;
    keptMark.classList.toggle('is-happy', t >= 4.44);

    pinAnimations(t);
    window.__t = t;
    return t;
  }

  window.seek = seek;
  window.__DUR = DUR;
  window.__ready = Promise.all(loads).then(() => (document.fonts ? document.fonts.ready : null)).then(() => {
    const q = new URLSearchParams(location.search);
    if (q.has('t')) { document.body.classList.add('freeze'); seek(parseFloat(q.get('t'))); return; }
    // live preview only (never used by the renderer): loop with a short hold on the last frame
    let t0 = null;
    const loop = (now) => {
      if (t0 === null) t0 = now;
      const t = ((now - t0) / 1000) % (DUR + 0.8);
      seek(Math.min(t, DUR));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  seek(0);
})();
