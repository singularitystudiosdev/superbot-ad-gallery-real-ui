// stop-api-pricing-superbot-e65959ff: STOP PAYING API PRICING.
// Same engine contract as ../every-model-one-chat-superbot-efa8df82/timeline.js: the frame is a pure function of t
// on a 60 fps quantised clock, ?t=<s> freezes a frame (?t=<s>&play=1 plays on), space pauses, arrows step 0.25 s,
// R restarts, and window.__AD = { CYCLE, ready, seek(t) } drives the frame-exact renderer (render.e65959ff.mjs).
// ?v=a|b|c picks the variant. The beats and their copy are the same in all three; only motion, layout and
// pacing differ:
//   1. STOP PAYING API PRICING over a plain pay-per-token key
//   2. at the same moment, the key turns into the superbot key (storm gradient + shine) with the mascot landing
//      to its right, and the headline turns into SUPERBOT REROUTES TO SUBSCRIPTION
//   3. superbot.gg with the mascot to its right (the reference end card)

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = (x) => 1 - (1 - x) ** 3;
const outQuint = (x) => 1 - (1 - x) ** 5;
const inCubic = (x) => x ** 3;
const inOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const inOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };

// ---------- copy (verbatim in every variant) ----------
const HL1 = ['STOP', 'PAYING', 'API', 'PRICING'];
const HL2 = ['SUPERBOT', 'REROUTES', 'TO', 'SUBSCRIPTION'];
const END_TEXT = 'superbot.gg';
// masked placeholders, never a real key; one length, so both keys share one geometry
const KEY_PLAIN = 'sk-proj-' + '•'.repeat(22) + 'Qx7f';
const KEY_SHINE = 'sbc_' + '•'.repeat(26) + '7f3a';

const GRAD_P = 900, GRAD_V = 110; // storm tile width and drift, px and px/s (reference timeline.js)
const ROW_MARK = 180, END_MARK = 220, KEY_SCALE = ROW_MARK / END_MARK;
const DIP = 0.35, SWEEP_W = 170;
// Lucide key-round and copy (ISC), stroked by the stylesheet
const ICON_KEY = '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5"/>';
const ICON_COPY = '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>';

const q = new URLSearchParams(location.search);
const V = ['a', 'b', 'c'].includes(q.get('v')) ? q.get('v') : 'a';
document.documentElement.classList.add('v-' + V);
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');
const R = {};

// ---------- build ----------
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function buildHeadline(words, cls, brAfter, gradWord) {
  const p = el('p', 'hl ' + cls);
  const spans = words.map((word, i) => {
    const w = el('span', 'w');
    if (word === gradWord) w.appendChild(el('span', 'gt', word));
    else w.textContent = word;
    p.appendChild(w);
    if (i < words.length - 1) p.appendChild(i === brAfter ? el('br') : document.createTextNode(' '));
    return w;
  });
  return { el: p, words: spans, grad: p.querySelector('.gt') };
}

function buildKey(kind, text) {
  const k = el('div', 'key ' + kind,
    `<div class="chrome"></div><svg class="ico" viewBox="0 0 24 24">${ICON_KEY}</svg><span class="txt"></span><svg class="ico2" viewBox="0 0 24 24">${ICON_COPY}</svg>`);
  const txt = k.querySelector('.txt');
  const chars = [...text].map((ch) => txt.appendChild(el('span', 'c', ch)));
  return { el: k, chrome: k.querySelector('.chrome'), ico: k.querySelector('.ico'), ico2: k.querySelector('.ico2'), txt, chars };
}

// The assets/sb-mark-live mascot frozen off the wall clock (reference shell.js makeMark): its CSS loops are paused
// and seeked to t, it blinks on a fixed schedule, and `happy` swaps its eyes for the source's happy arcs.
function makeMark(size) {
  const host = el('span', 'markhost');
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  const tmp = el('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const svg = wrap.querySelector('svg');
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null;
  return {
    el: host,
    render(t, happy = false) {
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { a.pause(); a.currentTime = Math.max(0, t) * 1000; }
      svg.classList.toggle('is-happy', happy);
      // a 0.12 s blink every 3.6 s, every third one a one-eye wink
      const k = Math.floor(t / 3.6), ph = t - k * 3.6, shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

function build() {
  const scn = el('div', 'layer scn'), cam = el('div', 'cam'), hlWrap = el('div', 'hl-wrap');
  const brAfter = V === 'c' ? 1 : -1;
  const hl1 = buildHeadline(HL1, 'hl1', brAfter, null);
  const hl2 = buildHeadline(HL2, 'hl2', brAfter, V === 'a' ? 'SUBSCRIPTION' : null);
  const hlSweep = el('i', 'sweep');
  hlWrap.append(hl1.el, hl2.el, hlSweep);
  const row = el('div', 'row'), keyslot = el('div', 'keyslot'), faceAnchor = el('div', 'face-anchor');
  const plain = buildKey('plain', KEY_PLAIN), shine = buildKey('shine', KEY_SHINE);
  const caret = plain.txt.appendChild(el('i', 'caret'));
  const keySweep = el('i', 'sweep');
  keyslot.append(plain.el, shine.el, keySweep);
  row.append(keyslot, faceAnchor);
  cam.append(hlWrap, row);
  const mascot = el('div', 'mascot');
  const mark = makeMark(END_MARK);
  mascot.appendChild(mark.el);
  scn.append(cam, mascot);
  const end = el('div', 'layer end',
    `<div class="lock"><div class="words"><div class="end-slide"><h1>${END_TEXT}</h1></div></div><div class="face"></div></div>`);
  const endFace = end.querySelector('.face');
  const endMark = makeMark(END_MARK);
  if (V !== 'b') endFace.appendChild(endMark.el); // b flies the one mascot onto this seat instead
  const stageSweep = el('i', 'sweep');
  stage.insertBefore(scn, dip); stage.insertBefore(end, dip); stage.insertBefore(stageSweep, dip);
  Object.assign(R, { scn, cam, hlWrap, hl1, hl2, hlSweep, row, faceAnchor, plain, shine, caret, keySweep, mascot, mark,
    end, endFace, endMark, endSlide: end.querySelector('.end-slide'), stageSweep });
}

// layout positions in stage px, read off the offset chain so in-flight transforms never skew them
function posIn(e) {
  let x = 0, y = 0;
  while (e && e !== stage) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y };
}

function measure() {
  const c0 = R.plain.chars[0], last = R.plain.chars[R.plain.chars.length - 1];
  R.charX = R.plain.chars.map((c) => c.offsetLeft - c0.offsetLeft);
  R.textW = R.charX[R.charX.length - 1] + last.offsetWidth;
  R.keyW = R.plain.el.offsetWidth;
  const fa = posIn(R.faceAnchor);
  R.anchorKey = { x: fa.x + R.faceAnchor.offsetWidth / 2, y: fa.y + R.faceAnchor.offsetHeight / 2 };
  R.rowHalf = (R.faceAnchor.offsetWidth + parseFloat(getComputedStyle(R.faceAnchor).marginLeft)) / 2;
  const ef = posIn(R.endFace);
  R.anchorEnd = { x: ef.x + END_MARK / 2, y: ef.y + END_MARK / 2 };
  R.hlW = R.hlWrap.offsetWidth;
  R.hlH = R.hlWrap.offsetHeight;
  R.gradW = R.hl2.grad ? R.hl2.grad.offsetWidth : 0;
}

// ---------- per-frame helpers ----------
function put(e, { o = 1, x = 0, y = 0, s = 1, r = 0, blur = 0 } = {}) {
  e.style.opacity = clamp(o).toFixed(3);
  e.style.transform = x || y || s !== 1 || r
    ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)` : 'none';
  e.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';
}

// the reference card motion: each word rises 18 px out of an 8 px blur (outQuint .55 s, .06 s stagger);
// with outAt set it lifts away the same way
function wordsRise(words, t, inAt, outAt) {
  words.forEach((w, i) => {
    const pIn = outQuint(seg(t, inAt + i * 0.06, inAt + i * 0.06 + 0.55));
    const pOut = outAt == null ? 0 : inCubic(seg(t, outAt + i * 0.04, outAt + i * 0.04 + 0.35));
    put(w, { o: clamp(pIn * 1.15) * (1 - pOut), y: (1 - pIn) * 18 - pOut * 22, blur: (1 - pIn) * 8 + pOut * 8 });
  });
}

const driftAt = (t) => ((t * GRAD_V) % GRAD_P + GRAD_P) % GRAD_P;
// the storm tile drifting left plus a white shine band that crosses once per [start, end] sweep; dx is the
// element's offset inside the phrase, so the colours run on across separate glyph boxes
function paintGrad(e, t, dx, W, sweeps) {
  const band = W * 0.55;
  let sx = -band * 2;
  for (const [a, b] of sweeps) if (t >= a && t <= b) sx = lerp(-band, W, inOutCubic(seg(t, a, b)));
  e.style.backgroundSize = `${band.toFixed(1)}px 100%, ${GRAD_P}px 100%`;
  e.style.backgroundPosition = `${(sx - dx).toFixed(1)}px 0, ${(-driftAt(t) - dx).toFixed(1)}px 0`;
}
function paintShineKey(t, sweeps) {
  R.shine.chars.forEach((c, i) => paintGrad(c, t, R.charX[i], R.textW, sweeps));
  R.shine.chrome.style.backgroundPosition = `0 0, ${(-driftAt(t)).toFixed(1)}px 0`;
}

function placeMark(cx, cy, s, o, r = 0) {
  R.mascot.style.opacity = clamp(o).toFixed(3);
  R.mascot.style.transform = `translate(${(cx - END_MARK / 2).toFixed(2)}px, ${(cy - END_MARK / 2).toFixed(2)}px) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
}
function setCam(s, o = 1) {
  R.cam.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(5)})`;
  R.cam.style.opacity = clamp(o).toFixed(3);
}
const camMap = (p, s) => ({ x: 960 + (p.x - 960) * s, y: 540 + (p.y - 540) * s });

// the reference end card: the mascot pops, then the line slides out from behind it
function endRef(t, t0) {
  const lt = t - t0;
  R.end.style.visibility = lt >= 0 ? 'visible' : 'hidden';
  if (lt < 0) return;
  const f = seg(lt, 0, 0.5), w = seg(lt, 0.3, 1.0);
  R.endFace.style.opacity = outCubic(f).toFixed(3);
  R.endFace.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  R.endSlide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  R.endSlide.style.opacity = w.toFixed(3);
  R.endMark.render(t);
}

// a light sweep crossing [0, W] of a pair stacked in one box: left of the band is `inEl`, right of it `outEl`
function wipe(outEl, inEl, band, t, a, b, W) {
  const p = inOutSine(seg(t, a, b)), X = lerp(-SWEEP_W, W + SWEEP_W, p);
  band.style.opacity = t > a && t < b ? clamp(Math.min(p, 1 - p) * 7).toFixed(3) : '0';
  band.style.left = `${(X - SWEEP_W / 2).toFixed(1)}px`;
  const pad = 260; // keeps glows and blur outside the box un-clipped
  outEl.style.clipPath = p <= 0 ? 'none' : p >= 1 ? 'inset(0 0 0 100%)' : `inset(-${pad}px -${pad}px -${pad}px ${X.toFixed(1)}px)`;
  inEl.style.clipPath = p >= 1 ? 'none' : p <= 0 ? 'inset(0 100% 0 0)' : `inset(-${pad}px ${(W - X).toFixed(1)}px -${pad}px -${pad}px)`;
}
// when the band (moving over [a, b] across W) reaches x
const sweepReach = (a, b, W, x) => a + (b - a) * Math.acos(1 - 2 * clamp((x + SWEEP_W) / (W + 2 * SWEEP_W))) / Math.PI;

// ---------- variant a, Rise: the reference motion throughout, centred ----------
function renderA(t) {
  // beat 1 (0.15 s): the headline rises in word by word, the plain key under it
  R.hl1.el.style.opacity = '1';
  R.hl2.el.style.opacity = '1';
  const kIn = outQuint(seg(t, 0.75, 1.35)), kOut = inOutCubic(seg(t, 2.6, 3.0));
  put(R.plain.el, { o: kIn * (1 - kOut), y: (1 - kIn) * 18, s: lerp(1, 0.97, kOut), blur: (1 - kIn) * 8 + kOut * 10 });
  // beats 2 + 3 together (2.6 s): the plain key blurs away and the superbot key resolves in its place while the
  // old line lifts away word by word (gone by 3.07 s) and SUPERBOT REROUTES TO SUBSCRIPTION rises in from 3.07 s,
  // SUBSCRIPTION in the key's gradient, so the two lines never share a frame; the row re-centres as the mascot
  // pops in on the key's right
  wordsRise(R.hl1.words, t, 0.15, 2.6);
  wordsRise(R.hl2.words, t, 3.07, null);
  paintGrad(R.hl2.grad, t, 0, R.gradW, [[3.85, 4.75]]);
  const sIn = outCubic(seg(t, 2.75, 3.25));
  put(R.shine.el, { o: sIn, s: lerp(1.03, 1, sIn), blur: (1 - sIn) * 10 });
  paintShineKey(t, [[3.05, 3.95], [4.95, 5.85]]);
  const shift = lerp(R.rowHalf, 0, inOutCubic(seg(t, 3.0, 3.7)));
  R.row.style.transform = `translateX(${shift.toFixed(2)}px)`;
  // out (6.1 s): beats 1-3 leave on the reference card exit, then the reference end card
  const ex = inOutCubic(seg(t, 6.1, 6.45)), cs = lerp(1, 0.985, ex);
  setCam(cs, 1 - ex);
  const pop = seg(t, 3.15, 3.65), at = camMap({ x: R.anchorKey.x + shift, y: R.anchorKey.y }, cs);
  placeMark(at.x, at.y, KEY_SCALE * cs * lerp(0.5, 1, outBack(pop)), outCubic(clamp(pop * 2.2)) * (1 - ex));
  R.mark.render(t);
  endRef(t, 6.45);
}

// ---------- variant b, Decode: the key is typed, then decoded glyph by glyph; the headline rolls ----------
const B_TYPE = [0.8, 1.45], B_WAVE = 2.4, B_STEP = 0.02, B_SCR = 0.3;
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
const glyph = (i, k) => GLYPHS[((Math.imul(i + 1, 2654435761) ^ Math.imul(k + 7, 40503)) >>> 0) % GLYPHS.length];

function typeAndDecode(t) {
  const n = R.plain.chars.length, k = Math.floor(t * 30);
  const typed = Math.floor(seg(t, B_TYPE[0], B_TYPE[1]) * n);
  R.plain.chars.forEach((c, i) => {
    const s0 = B_WAVE + i * B_STEP, s1 = s0 + B_SCR;
    const want = t < s0 ? KEY_PLAIN[i] : glyph(i, k);
    if (c.textContent !== want) c.textContent = want;
    c.style.color = t < s0 ? '' : '#cdbfff';
    c.style.opacity = i < typed && t < s1 ? '1' : '0';
    const sc = R.shine.chars[i], p = seg(t, s1, s1 + 0.18);
    sc.style.opacity = t >= s1 ? '1' : '0';
    sc.style.transform = t >= s1 && p < 1 ? `scale(${lerp(1.3, 1, outCubic(p)).toFixed(3)})` : 'none';
  });
  // the caret rides the typing, then blinks until the decode wave starts
  const typing = t >= B_TYPE[0] && t < B_TYPE[1];
  const blinkOn = ((Math.floor((t - B_TYPE[1]) * 2.4) % 2) + 2) % 2 === 0;
  R.caret.style.opacity = t >= 0.6 && t < B_WAVE && (typing || blinkOn) ? '1' : '0';
  R.caret.style.left = `${(typed >= n ? R.textW + 4 : R.charX[typed] - 2).toFixed(1)}px`;
  // the field's chrome and icons cross over as the wave passes
  const waveEnd = B_WAVE + (n - 1) * B_STEP + B_SCR;
  const w = seg(t, B_WAVE, waveEnd), i1 = seg(t, B_WAVE, B_WAVE + 0.2), i2 = seg(t, waveEnd - 0.3, waveEnd);
  R.plain.chrome.style.opacity = (1 - w).toFixed(3);
  R.shine.chrome.style.opacity = w.toFixed(3);
  R.plain.ico.style.opacity = (1 - i1).toFixed(3);
  R.shine.ico.style.opacity = i1.toFixed(3);
  R.plain.ico2.style.opacity = (1 - i2).toFixed(3);
  R.shine.ico2.style.opacity = i2.toFixed(3);
}

function renderB(t) {
  // beat 1: the headline slams in whole; the key field opens and the key types in
  // beats 2 + 3 together (2.4 s): the headline rolls up and the new line rolls in under it as the decode wave
  // starts through the key
  const D = R.hlH, slam = outCubic(seg(t, 0.1, 0.48)), r1 = inOutCubic(seg(t, 2.4, 2.9));
  put(R.hl1.el, { o: clamp(slam * 1.4), s: lerp(1.14, 1, slam), blur: (1 - slam) * 14, y: -r1 * D });
  const r2in = outQuint(seg(t, 2.55, 3.15)), r2out = inOutCubic(seg(t, 6.0, 6.45));
  put(R.hl2.el, { o: t >= 2.55 ? 1 : 0, y: (1 - r2in) * D - r2out * D });
  const open = outCubic(seg(t, 0.6, 0.85)), outro = inOutCubic(seg(t, 6.1, 6.5));
  put(R.plain.el, { o: open * (1 - outro), y: (1 - open) * 12, s: lerp(1, 0.94, outro), blur: outro * 10 });
  put(R.shine.el, { o: 1 - outro, s: lerp(1, 0.94, outro), blur: outro * 10 });
  // the decode wave (2.4 s) turns the key into the superbot key; the mascot slides in from the right
  typeAndDecode(t);
  paintShineKey(t, [[3.45, 4.3], [4.95, 5.8]]);
  const shift = lerp(R.rowHalf, 0, inOutCubic(seg(t, 2.95, 3.6)));
  R.row.style.transform = `translateX(${shift.toFixed(2)}px)`;
  // beat 4 (6.15 s): the mascot flies onto the end card's seat and superbot.gg rolls up beside it
  const m = seg(t, 3.0, 3.65), fly = inOutCubic(seg(t, 6.15, 6.95));
  const fx = R.anchorKey.x + shift + lerp(320, 0, outQuint(m));
  const hop = Math.sin(Math.PI * seg(t, 7.0, 7.35)) * 22;
  const x = lerp(fx, R.anchorEnd.x, fly), y = lerp(R.anchorKey.y, R.anchorEnd.y, fly) - Math.sin(Math.PI * fly) * 70 - hop;
  placeMark(x, y, lerp(KEY_SCALE, 1, fly), outCubic(clamp(m * 2)), lerp(16, 0, outBack(m)));
  R.mark.render(t, t >= 7.0 && t < 7.9);
  R.end.style.visibility = t >= 6.4 ? 'visible' : 'hidden';
  R.endSlide.style.transform = `translateY(${((1 - outQuint(seg(t, 6.7, 7.3))) * 145).toFixed(2)}%)`;
}

// ---------- variant c, Sweep: left-set two-line headline, a slow push, light sweeps carry every change ----------
function renderC(t, tReal) {
  // the push runs on the real clock, so the beat-1 cut does not jolt it
  const cs = lerp(1, 1.04, seg(tReal, 0, 4.9 - VARIANTS.c.skip));
  setCam(cs);
  // beat 1: the words pop in one by one, the plain key slides in from the left
  R.hl1.el.style.opacity = '1';
  R.hl1.words.forEach((w, i) => {
    const p = seg(t, 0.1 + i * 0.09, 0.52 + i * 0.09);
    put(w, { o: outCubic(clamp(p * 2.2)), s: lerp(0.6, 1, outBack(p)), blur: (1 - outCubic(p)) * 6 });
  });
  const kIn = outQuint(seg(t, 0.6, 1.1));
  put(R.plain.el, { o: kIn, x: (1 - kIn) * -60 });
  put(R.shine.el, { o: 1 });
  // beats 2 + 3 together (2.0 s): one pass of the sweep crosses the headline and the key at once, leaving
  // SUPERBOT REROUTES TO SUBSCRIPTION and the superbot key behind it; the mascot pops in
  R.hl2.el.style.opacity = '1';
  wipe(R.hl1.el, R.hl2.el, R.hlSweep, t, 2.0, 2.65, R.hlW);
  wipe(R.plain.el, R.shine.el, R.keySweep, t, 2.0, 2.65, R.keyW);
  paintShineKey(t, [[3.4, 4.2]]);
  const pop = seg(t, 2.5, 2.95), at = camMap(R.anchorKey, cs);
  placeMark(at.x, at.y, KEY_SCALE * cs * lerp(0.4, 1, outBack(pop)), outCubic(clamp(pop * 2.2)), lerp(-14, 0, outBack(pop)));
  R.mark.render(t);
  // beat 4 (4.9 s): one sweep across the frame wipes to the end card; the mascot pops as the band reaches it
  R.end.style.visibility = t >= 4.9 ? 'visible' : 'hidden';
  wipe(R.scn, R.end, R.stageSweep, t, 4.9, 5.4, 1920);
  const reach = sweepReach(4.9, 5.4, 1920, R.anchorEnd.x - END_MARK / 2), f = seg(t, reach, reach + 0.45);
  R.endFace.style.opacity = outCubic(clamp(f * 2)).toFixed(3);
  R.endFace.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  R.endMark.render(t, t >= 5.65 && t < 6.35);
}

// Beat 1's hold is cut short: from `cut` on, the variant's timeline runs `skip` seconds ahead. Nothing on screen
// moves inside the skipped span (the plain key has landed, the shine key and the mascot are not on yet), so the
// swap to the superbot key just comes `skip` seconds sooner. `cycle` is the timeline's length before the cut.
const VARIANTS = {
  a: { cycle: 10.1, cut: 1.5, skip: 0.6, render: renderA },
  b: { cycle: 9.4, cut: 1.6, skip: 0.6, render: renderB },
  c: { cycle: 7.8, cut: 1.2, skip: 0.6, render: renderC },
};
const VV = VARIANTS[V];
const CYCLE = +(VV.cycle - VV.skip).toFixed(4);

function render(t) {
  VV.render(t < VV.cut ? t : t + VV.skip, t);
  // the dip at the loop: the end card goes to black over its last DIP seconds (t = 0 opens on black too)
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

// ---------- fit the 1920x1080 stage to the window ----------
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}

// ---------- boot and the clock (reference timeline.js) ----------
build();
fit();
addEventListener('resize', fit);
if (document.fonts && document.fonts.ready) await document.fonts.ready;
measure();

const FPS = 60;
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
const wrapT = (t) => ((t % CYCLE) + CYCLE) % CYCLE;
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') { offset = 0; t0 = performance.now(); paused = false; }
});
function frame() {
  if (!paused) render(Math.round(wrapT(clockNow()) * FPS) / FPS % CYCLE);
  requestAnimationFrame(frame);
}
render(wrapT(offset));
requestAnimationFrame(frame);
window.__AD = {
  variant: V, CYCLE, ready: true,
  // frame-exact export and QA: pause the clock and draw t now
  seek(t) { paused = true; offset = t; render(wrapT(t)); },
};
