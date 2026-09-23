// waffles-website-superbot: the whole spot is a pure function of t.
//   0.0  ChatGPT home, the prompt is typed and sent 0.1s after the last key
//   ~4   ChatGPT answers with a code block and a list of chores
//   8.7  Superbot builds the same ask: steps + code stream from site/build-steps.json
//  14.5  build done, the real site (site/index.html?ad=1) runs in the project preview
//  15.8  the camera pushes into the real desktop Publish button, a cursor presses it
//  18.4  "Live in one click."   20.1 end card with the live mascot (assets/sb-mark-live)
// ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there; arrows step, space pauses.

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outQuint = (x) => 1 - Math.pow(1 - x, 5);
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const op = (el, v) => { el.style.opacity = v.toFixed(3); };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// ---------- the script ----------
const PROMPT = 'Make me a website where people can rate waffle pics';
const TYPE0 = 0.8;
const keyAt = [];                 // time each character lands
{ let k = TYPE0; for (let i = 0; i < PROMPT.length; i++) { keyAt.push(k); k += 0.043 * (0.7 + 0.6 * hash(i)) + (PROMPT[i] === ' ' ? 0.018 : 0); } }
const TYPE1 = keyAt[keyAt.length - 1];
const SEND = TYPE1 + 0.1;         // the send lands 0.1s after the last character

const ANSWER = [                  // what ChatGPT gives you: code and chores
  { el: 'c-p1', kind: 'p', text: "Sure! Here's a simple starting point. Save this as `index.html`:", cps: 150 },
  { el: 'c-code', kind: 'code', cps: 230, text:
`<!DOCTYPE html>
<html>
<head>
  <title>Waffle Ratings</title>
  <style>
    .grid { display: grid; gap: 16px; }
    .stars span { cursor: pointer; }
  </style>
</head>
<body>
  <h1>Rate the Waffles</h1>
  <input type="file" id="upload">
  <div class="grid" id="gallery"></div>
  <script src="app.js"></script>
</body>
</html>` },
  { el: 'c-p2', kind: 'p', text: "Next, you'll need to:", cps: 150 },
  { el: 'c-list', kind: 'list', cps: 170, text: [
    'Write `app.js` to handle uploads and star ratings',
    'Set up a backend and a database to store them',
    'Buy a domain and deploy it to a host',
  ] },
  { el: 'c-p3', kind: 'p', text: 'Want me to walk you through the backend setup?', cps: 150 },
];
const T = {
  dots0: SEND + 0.35, ans0: SEND + 1.15,
  dip1: 8.3, app: 8.7, b0: 9.2, b1: 14.4, ready: 14.5,
  scroll0: 14.95, scroll1: 15.75,
  z0: 15.8, z1: 17.0, c0: 16.55, c1: 17.3, press: 17.45,
  dip2: 18.1, line: 18.4, lineOut: 19.85, end: 20.1, word: 20.4,
};
const CYCLE = 24.5;
{ let k = T.ans0; for (const a of ANSWER) { const n = a.kind === 'list' ? a.text.join('').length : a.text.length; a.t0 = k; a.t1 = k + n / a.cps; k = a.t1 + 0.12; } }

// ---------- a tiny highlighter (html / css / js) for both code panes ----------
const TOK = /(<!--.*?(?:-->|$)|\/\*.*?(?:\*\/|$)|\/\/.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`[^`]*`?)|(<\/?[a-zA-Z][\w-]*|\/?>)|\b(function|var|let|const|return|if|else|for|while|new|true|false|null|this|typeof|document|window)\b|\b(\d+(?:\.\d+)?(?:px|rem|em|s|ms|%)?)\b|([a-z-]+)(?=\s*:\s*[^;{]*;)/g;
function hl(line) {
  let out = '', last = 0, m;
  TOK.lastIndex = 0;
  while ((m = TOK.exec(line))) {
    if (m[0] === '') { TOK.lastIndex++; continue; }
    out += esc(line.slice(last, m.index));
    const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'tag' : m[4] ? 'kw' : m[5] ? 'num' : 'prop';
    out += `<span class="hl-${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last));
}
const inlineCode = (s) => esc(s).replace(/`([^`]*)`?/g, (_, c) => `<code>${c}</code>`);

// ---------- scene 1: ChatGPT ----------
const chat = $('chat'), hello = $('c-hello'), dock = $('c-dock'), sugs = $('c-sugs');
const typed = $('c-typed'), caret = $('c-caret'), ph = $('c-ph'), field = typed.parentElement;
const thread = $('c-thread-in'), cUser = $('c-user'), cDots = $('c-dots'), cAi = $('c-ai'), codebox = $('c-codebox');
const dockTop = () => 1080 - 104 - 64;

let lastTyped = -1;
function drawChat(t) {
  // the composer: typing, then the send clears it
  const n = t >= SEND ? 0 : keyAt.filter((k) => k <= t).length;
  if (n !== lastTyped) {
    typed.textContent = PROMPT.slice(0, n);
    field.style.justifyContent = typed.offsetWidth + 6 > field.clientWidth ? 'flex-end' : '';
    lastTyped = n;
  }
  op(ph, n === 0 ? 1 : 0);
  ph.style.visibility = n === 0 ? 'visible' : 'hidden';
  const typing = t >= TYPE0 - 0.05 && t < SEND;
  caret.style.visibility = (t < SEND && (typing || Math.floor(t * 1.8) % 2 === 0)) || (t >= SEND && t < T.dip1 && Math.floor(t * 1.8) % 2 === 0) ? 'visible' : 'hidden';
  ph.style.left = n === 0 ? '6px' : '0';

  // the send: the home state lifts away, the composer docks to the bottom
  const s = seg(t, SEND, SEND + 0.45), se = outCubic(s);
  op(hello, 1 - seg(t, SEND, SEND + 0.2));
  op(sugs, 1 - seg(t, SEND, SEND + 0.15));
  dock.style.top = lerp(404, dockTop(), se).toFixed(1) + 'px';

  // the thread
  const u = seg(t, SEND + 0.1, SEND + 0.4);
  op(cUser, u); cUser.style.transform = `translateY(${((1 - outCubic(u)) * 18).toFixed(1)}px)`;
  const dotsOn = t >= T.dots0 && t < T.ans0;
  cDots.style.display = dotsOn ? 'flex' : 'none';
  if (dotsOn) { const pz = 0.8 + 0.2 * Math.sin((t - T.dots0) * 7); cDots.firstElementChild.style.transform = `scale(${pz.toFixed(3)})`; }
  cAi.style.display = t >= T.ans0 ? 'block' : 'none';
  for (const a of ANSWER) {
    const el = $(a.el), f = seg(t, a.t0, a.t1);
    if (a.kind === 'p') {
      el.innerHTML = inlineCode(a.text.slice(0, Math.round(a.text.length * f)));
      el.style.display = t >= a.t0 ? 'block' : 'none';
    } else if (a.kind === 'code') {
      const txt = a.text.slice(0, Math.round(a.text.length * f));
      el.innerHTML = txt.split('\n').map(hl).join('\n');
      codebox.style.display = t >= a.t0 ? 'block' : 'none';
    } else {
      let left = Math.round(a.text.join('').length * f), html = '';
      for (const item of a.text) { if (left <= 0) break; html += `<li>${inlineCode(item.slice(0, left))}</li>`; left -= item.length; }
      el.innerHTML = html;
      el.style.display = t >= a.t0 ? 'block' : 'none';
    }
  }
  // keep the newest line in view, like the real page does while it streams
  const room = dockTop() - 40 - 120;
  const over = Math.max(0, thread.offsetHeight - room);
  thread.style.transform = `translate(-50%, ${(-over).toFixed(1)}px)`;
}

// ---------- scene 2: Superbot builds it ----------
const app = $('app'), cam = $('cam'), pubBtn = $('pub-btn'), pubState = $('pub-state');
const bSpin = $('b-spin'), bTitle = $('b-title'), bCount = $('b-count'), bSteps = $('b-steps');
const eTabs = $('e-tabs'), eCode = $('e-code'), pvSkel = $('pv-skel'), pvFrame = $('pv-frame'), pvState = $('pv-state');
const siteFrame = $('site'), cursor = $('cursor'), ripple = $('ripple'), rowDot = $('row-dot');
let STEPS = [];
fetch('site/build-steps.json').then((r) => r.json()).then((d) => { STEPS = d.steps || d; lastBuild = ''; }).catch(() => { STEPS = []; });

let lastBuild = '';
function drawBuild(t) {
  const N = STEPS.length || 22;
  const dur = (T.b1 - T.b0) / N;
  const i = t < T.b0 ? -1 : Math.min(N, Math.floor((t - T.b0) / dur));
  const done = t >= T.ready;
  const p = i >= 0 && i < N ? seg(t, T.b0 + i * dur, T.b0 + (i + 0.82) * dur) : 0;
  const key = `${i}|${(p * 60) | 0}|${done}|${STEPS.length}`;
  if (key === lastBuild) return;
  lastBuild = key;

  bSpin.classList.toggle('done', done);
  bTitle.textContent = done ? 'Built Waffle Rank' : 'Building Waffle Rank';
  bCount.textContent = `${Math.max(0, Math.min(N, done ? N : i))} / ${N}`;
  rowDot.style.visibility = done ? 'visible' : 'hidden';
  if (!STEPS.length) { bSteps.innerHTML = ''; eCode.innerHTML = ''; eTabs.innerHTML = ''; return; }

  // the step list: the last six, the current one spinning
  const top = Math.min(i, N - 1);
  let li = '';
  for (let k = Math.max(0, top - 5); k <= top && k >= 0; k++) {
    const st = STEPS[k], cls = k < i || done ? 'done' : 'cur';
    li += `<li class="${cls}"><i></i><span>${esc(st.title)}</span><code>${esc(st.file)}</code></li>`;
  }
  bSteps.innerHTML = li;

  // the editor: the current step's code, typed in
  const cur = STEPS[Math.max(0, Math.min(i, N - 1))];
  const files = [];
  for (let k = Math.max(0, Math.min(i, N - 1)); k >= 0 && files.length < 3; k--) if (!files.includes(STEPS[k].file)) files.push(STEPS[k].file);
  files.reverse();
  eTabs.innerHTML = files.map((f) => `<span class="${f === cur.file ? 'on' : ''}">${esc(f)}</span>`).join('');
  if (i < 0) { eCode.innerHTML = ''; return; }
  const full = cur.snippet || '';
  const shown = i >= N || done ? full : full.slice(0, Math.round(full.length * p));
  const lines = shown.split('\n');
  const first = Math.max(0, lines.length - 27);
  let html = '';
  for (let k = first; k < lines.length; k++) {
    const caretHere = k === lines.length - 1 && !done && i < N;
    html += `<span class="ln"><b>${(cur.startLine || 1) + k}</b>${hl(lines[k])}${caretHere ? '<i class="cur-caret"></i>' : ''}</span>`;
  }
  eCode.innerHTML = html;
}

// where the Publish button sits in the un-zoomed stage (stage px), cached per layout
let pubAt = null, pubKey = '';
function measurePub() {
  const key = `${innerWidth}x${innerHeight}|${window.AR && AR.key}`;
  if (pubAt && key === pubKey) return pubAt;
  const prev = cam.style.transform; cam.style.transform = 'none';
  const sr = stage.getBoundingClientRect(), k = sr.width / ((window.AR && AR.w) || 1920);
  const r = pubBtn.getBoundingClientRect();
  cam.style.transform = prev;
  if (!r.width) return null;
  pubAt = { x: (r.left - sr.left + r.width / 2) / k, y: (r.top - sr.top + r.height / 2) / k, w: r.width / k, h: r.height / k };
  pubKey = key;
  return pubAt;
}

let scrolled = -1;
function drawApp(t) {
  drawBuild(t);
  const W = (window.AR && AR.w) || 1920;
  // the finished build: readiness lands, the preview swaps its skeleton for the running site
  op(pubState, seg(t, T.ready, T.ready + 0.3));
  const pv = seg(t, T.ready + 0.1, T.ready + 0.5);
  op(pvFrame, pv); op(pvSkel, 1 - pv);
  pvState.textContent = t < T.b0 ? 'Waiting for the build' : t < T.ready + 0.1 ? 'Building' : 'Running';
  const sy = Math.round(lerp(0, 420, inOutCubic(seg(t, T.scroll0, T.scroll1))));
  if (sy !== scrolled) {
    try { siteFrame.contentWindow.scrollTo(0, sy); scrolled = sy; } catch (e) { scrolled = sy; }
  }

  // the camera: in from a slight push at the cut, then into the Publish button
  const P = measurePub();
  const inF = outCubic(seg(t, T.app, T.app + 0.6));
  const z0 = lerp(1.035, 1, inF);
  let tx = (1 - z0) * W / 2, ty = (1 - z0) * 540, z = z0;
  let zf = 0;
  if (P) {
    zf = inOutCubic(seg(t, T.z0, T.z1));
    const Z = Math.min(4.4, (0.42 * W) / P.w);
    z = lerp(z0, Z, zf);
    const sx = lerp(P.x, W / 2, zf), syy = lerp(P.y, 500, zf);
    tx = sx - P.x * z; ty = syy - P.y * z;
    if (zf === 0) { tx = (1 - z0) * W / 2; ty = (1 - z0) * 540; }
    // never show past the window's edges: the app fills the whole frame
    tx = clamp(tx, W - W * z, 0); ty = clamp(ty, 1080 - 1080 * z, 0);
  }
  cam.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(4)})`;

  // the press
  const down = seg(t, T.press - 0.06, T.press + 0.04) * (1 - seg(t, T.press + 0.1, T.press + 0.24));
  pubBtn.style.transform = `scale(${(1 - 0.05 * down).toFixed(4)})`;
  const cv = seg(t, T.c0, T.c0 + 0.2);
  op(cursor, cv * (1 - seg(t, T.dip2, T.dip2 + 0.1)));
  if (P && cv > 0) {
    const bx = P.x * z + tx, by = P.y * z + ty;            // the button on screen
    const aim = { x: bx - P.w * z * 0.1, y: by + P.h * z * 0.12 };
    const m = inOutCubic(seg(t, T.c0, T.c1));
    const fx = lerp(W * 0.86, aim.x, m) + Math.sin(m * Math.PI) * -40;
    const fy = lerp(1000, aim.y, m) + Math.sin(m * Math.PI) * 30;
    cursor.style.transform = `translate(${(fx - 17).toFixed(1)}px, ${(fy - 11).toFixed(1)}px) scale(${(1 - 0.12 * down).toFixed(3)})`;
    const rp = seg(t, T.press, T.press + 0.55);
    op(ripple, rp > 0 ? (1 - rp) * 0.9 : 0);
    const rs = lerp(10, 260, outCubic(rp));
    ripple.style.width = ripple.style.height = rs.toFixed(1) + 'px';
    ripple.style.transform = `translate(${(aim.x - rs / 2).toFixed(1)}px, ${(aim.y - rs / 2).toFixed(1)}px)`;
  } else op(ripple, 0);
}

// ---------- scenes 3 + 4 ----------
const line = $('line'), lineP = $('line-p'), end = $('end'), endFace = $('end-face'), endSlide = $('end-slide');
if (window.sbMarkLive) { sbMarkLive(endFace, { size: 220 }); sbMarkLive($('side-mark'), { size: 16 }); }
function drawLine(t) {
  const a = seg(t, T.line + 0.05, T.line + 0.45), o = seg(t, T.lineOut, T.lineOut + 0.25);
  op(lineP, a * (1 - o));
  lineP.style.transform = `translateY(${((1 - outQuint(a)) * 18).toFixed(1)}px) scale(${lerp(0.97, 1, outQuint(a)).toFixed(3)})`;
}
function drawEnd(t) {
  const f = seg(t, T.end, T.end + 0.5), w = seg(t, T.word, T.word + 0.7);
  op(endFace, f); endFace.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(3)})`;
  endSlide.style.transform = `translateX(${((1 - outQuint(w)) * -110).toFixed(1)}%)`;
  op(endSlide, w);
}

// ---------- the frame ----------
const dip = $('dip');
function show(el, on) { el.classList.toggle('on', on); el.style.opacity = on ? '1' : '0'; }
function render(t) {
  show(chat, t < T.app);
  show(app, t >= T.app && t < T.line);
  show(line, t >= T.line && t < T.end);
  show(end, t >= T.end);
  if (t < T.app) drawChat(t);
  if (t >= T.app - 0.01 && t < T.line) drawApp(t);
  if (t >= T.line && t < T.end) drawLine(t);
  if (t >= T.end) drawEnd(t);
  // dips: into the app, into the line, and out at the loop
  const d = Math.max(
    seg(t, T.dip1, T.app) * (1 - seg(t, T.app, T.app + 0.3)),
    seg(t, T.dip2, T.line) * (t < T.line ? 1 : 0),
    seg(t, CYCLE - 0.35, CYCLE),
    1 - seg(t, 0, 0.3),
  );
  op(dip, d);
}

// ---------- fit the stage to the viewport ----------
function fit() {
  const W = (window.AR && AR.w) || 1920, H = 1080;
  const k = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
  pubAt = null;
}
addEventListener('resize', fit); fit();

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
function frame() {
  let t = clockNow();
  if (!freeze) t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
siteFrame.addEventListener('load', () => { scrolled = -1; });
