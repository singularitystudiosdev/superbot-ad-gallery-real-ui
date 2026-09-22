const $ = (id) => document.getElementById(id);
const PROMPT = 'Write a email back to my boss quickly, tell him I am sorry I missed the meeting and I have the finalized report ready to go';
const ACK = 'Sure can do! Here is that email!';
const QUESTION = 'I see chat gpt has 43 unused rules that are slowing it down and unused memory storage as well! Want me to remove?';
const EMAIL = 'Hi Alex,\n\nI am sorry I missed the meeting today. I have the finalized report ready to go and can send it over right away.\n\nPlease let me know if there is anything else you need.\n\nBest,\nJamie';
const DURATION = 54;
const TIMES = { submit: 5.8, ack: 6.5, stream: 8.3, ramp: 10.3, crawl: 12.3, popup: 13.4, click: 18.5, intro: 19, hub: 27.1, question: 27.7, choices: 34.8, yes: 37.5, title: 39, rescue: 45.4, end: 49.2 };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const part = (t, start, end) => clamp((t - start) / (end - start));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = (p) => 1 - (1 - p) ** 4;
const opacity = (el, value) => { el.style.opacity = clamp(value); };
const visible = (el, yes) => { el.style.visibility = yes ? 'visible' : 'hidden'; el.setAttribute('aria-hidden', String(!yes)); };
const sceneIds = ['gpt', 'superbot', 'slow-title', 'rescue-title', 'end-card'];
const appNames = ['chatgpt.webp', 'claude.png', 'gemini-app-icon.png', 'cursor.png', 'devin.png', 'hermes.png', 'grok.png', 'copilot.svg', 'kiro.ico', 'vscode.png', 'replit.png', 'lovable.png', 'jetbrains.png', 'bolt.png', 'base44.png', 'v0.svg'];
const asset = (name) => `assets/${name.replace(/(\.[^.]+)$/, '.2ae2e42b$1')}`;
const tiles = appNames.map((name, i) => {
  const tile = document.createElement('div');
  tile.className = 'sphere-tile';
  const image = document.createElement('img');
  image.src = asset(name);
  image.alt = name.split('.')[0];
  tile.append(image);
  $('sphere').append(tile);
  if (i < 8) { const railImage = image.cloneNode(); railImage.className = 'rail-app'; $('rail-apps').append(railImage); }
  const y = 1 - (2 * i + 1) / appNames.length;
  const r = Math.sqrt(1 - y * y);
  return { tile, x: Math.cos(2.399963 * i) * r, y, z: Math.sin(2.399963 * i) * r };
});
const railChildren = [...$('rail-apps').children];
// The only creative source: cloned-xdxdxd's sphere-intro-28.js, retrieved 2026-09-09.
// Preserve its Fibonacci sphere, exponential angular acceleration, 450ms merge,
// mascot flip, shrink, rail cascade and glide; derive every state for replay/seek.
const angleTable = [0];
for (let ms = 1; ms <= 4000; ms++) {
  const rate = (s) => .35 * Math.exp(Math.log(21 / .35) * (s / 4000) ** 1.55);
  angleTable.push(angleTable[ms - 1] + (rate(ms - 1) + rate(ms)) / 2000);
}
const spinAngle = (seconds) => {
  const ms = clamp(seconds * 1000, 0, 4000);
  const whole = Math.floor(ms);
  return lerp(angleTable[whole], angleTable[Math.min(4000, whole + 1)], ms - whole);
};
function renderSphere(t) {
  const spin = spinAngle(t);
  const merge = part(t, 3.55, 4) ** 1.7;
  tiles.forEach(({ tile, x, y, z }, i) => {
    const rx = x * Math.cos(spin) + z * Math.sin(spin);
    const rz = -x * Math.sin(spin) + z * Math.cos(spin);
    const depth = (rz * 175 + 190) / 380;
    const pop = ease(part(t, .12 + i * .06, .42 + i * .06));
    tile.style.transform = `translate3d(${203 + rx * 175 * (1 - merge)}px,${203 + y * 175 * (1 - merge)}px,${rz * lerp(175, 10, merge)}px) scale(${pop})`;
    opacity(tile, pop * (.16 + .84 * depth) * (1 - part(t, 4, 4.22)));
    tile.style.filter = `blur(${part(t, 2.48, 4) ** 2 * 3.6 + Math.max(0, .5 - depth) * 3}px)`;
  });
  visible($('sphere'), t >= 0 && t < 4.22);
  opacity($('sphere'), 1);
}
function renderHandoff(t) {
  // the reference's own sequence, retargeted to this stage: flip 4.0–4.92
  // (180°→0°, 0.76 overshoot), shrink to the rail head 4.92–5.54 mid-stage,
  // icons cascade 5.54+, glide home 6.86–7.5, hub grows in 7.5–8.1. The
  // bloom lands exactly on the rail's superbot slot (38,42).
  const shrink = ease(part(t, 4.92, 5.54));
  const glide = ease(part(t, 6.86, 7.5));
  const flip = ease(part(t, 4, 4.92));
  const flipScale = t < 4.7 ? lerp(.216, 1.05, ease(part(t, 4, 4.7))) : lerp(1.05, 1, part(t, 4.7, 4.92));
  const bx = lerp(0, -722, glide);
  const by = lerp(lerp(0, -184, shrink), -408, glide);
  visible($('bloom'), t >= 4 && t < 7.5);
  opacity($('bloom'), 1);
  $('bloom').style.transform = `translate(${bx}px,${by}px) perspective(900px) rotateY(${180 * (1 - flip)}deg) scale(${lerp(flipScale, .176, shrink)})`;
  $('bloom').style.filter = `brightness(${lerp(.5, 1, flip)})`;
  visible($('rail'), t >= 5.54);
  opacity($('rail'), 1);
  $('rail').style.transform = `translate(${lerp(722, 0, glide)}px,${lerp(224, 0, glide)}px)`;
  $('rail').style.background = `rgba(12,12,16,${glide})`;
  opacity($('rail').querySelector('.rail-mark'), t >= 7.5 ? 1 : 0);
  railChildren.forEach((el, i) => {
    const p = ease(part(t, 5.54 + i * .09, 6.02 + i * .09));
    opacity(el, p);
    el.style.transform = `translateY(${-34 * (1 - p)}px)`;
  });
  $('rail').querySelectorAll('.rail-divider,.rail-add').forEach((el) => opacity(el, part(t, 6.45, 6.85)));
  opacity($('hub-shell'), part(t, 7.5, 8.1));
}
// Exact rate integral: 300 WPM for 2s, linear 300→10 WPM for 2s, then 10 WPM.
// A word occupies its full measured span, so the final crawl remains visibly live.
function wordsAt(t) {
  if (t <= 0) return 0;
  if (t <= 2) return t * 5;
  const ramp = Math.min(t - 2, 2);
  return 10 + 5 * ramp - (29 / 24) * ramp ** 2 + Math.max(0, t - 4) / 6;
}
const wordEnds = [...EMAIL.matchAll(/\S+\s*/g)].map((match) => ({ start: match.index, end: match.index + match[0].length }));
function streamText(t) {
  const words = clamp(wordsAt(t), 0, wordEnds.length);
  const whole = Math.floor(words);
  if (whole >= wordEnds.length) return EMAIL;
  const word = wordEnds[whole];
  return EMAIL.slice(0, Math.floor(lerp(word.start, word.end, words - whole)));
}
function renderChat(t) {
  const sent = t >= TIMES.submit;
  visible($('welcome'), !sent);
  opacity($('welcome'), 1);
  visible($('recent'), sent);
  visible($('user-message'), sent);
  $('user-message').textContent = PROMPT;
  opacity($('user-message'), ease(part(t, TIMES.submit, TIMES.submit + .3)));
  $('user-message').style.transform = `translateY(${12 * (1 - ease(part(t, TIMES.submit, TIMES.submit + .3)))}px)`;
  $('gpt-composer').style.bottom = sent ? '71px' : '220px';
  $('prompt-input').textContent = sent ? 'Ask anything' : PROMPT.slice(0, Math.floor(PROMPT.length * part(t, .5, 4.7)));
  $('prompt-input').style.color = sent ? '#999' : '#ececec';
  visible($('typing-status'), t >= TIMES.ack);
  const streamT = t - TIMES.stream;
  const wpm = streamT < 0 ? null : streamT < 2 ? 300 : streamT < 4 ? lerp(300, 10, part(streamT, 2, 4)) : 10;
  $('typing-status').textContent = wpm === null ? 'generating…' : 'typing at ' + Math.round(wpm) + ' words per minute…';
  $('send').textContent = t >= TIMES.ack ? '■' : '↑';
  $('send').style.transform = `scale(${t >= 5.6 && t < 5.8 ? .92 : 1})`;
  visible($('assistant-message'), t >= TIMES.ack);
  $('acknowledgement').textContent = ACK.slice(0, Math.floor(ACK.length * part(t, TIMES.ack, 7.8)));
  visible($('email'), t >= TIMES.stream);
  $('email-text').textContent = streamText(t - TIMES.stream);
  opacity($('email').querySelector('.stream-caret'), Math.sin(t * 7) > -.3 ? 1 : .18);
}
function renderQuestion(t) {
  visible($('question-text'), t >= TIMES.question);
  $('question-text').textContent = QUESTION.slice(0, Math.floor(QUESTION.length * part(t, TIMES.question, 33.7)));
  const card = ease(part(t, TIMES.choices, TIMES.choices + .35));
  visible($('choice-card'), t >= TIMES.choices);
  opacity($('choice-card'), card);
  $('choice-card').style.transform = `translateY(${10 * (1 - card)}px)`;
  $('yes-choice').style.transform = `scale(${t >= TIMES.yes && t < TIMES.yes + .2 ? .98 : 1})`;
  $('yes-choice').setAttribute('aria-pressed', String(t >= TIMES.yes));
  $('yes-choice').querySelector('.choice-check').textContent = t >= TIMES.yes ? '✓' : '↵';
  visible($('selected-reply'), t >= TIMES.yes + .25);
}
function cursorAt(x, y, shown) {
  visible($('cursor'), shown);
  opacity($('cursor'), 1);
  $('cursor').style.transform = `translate(${x}px,${y}px)`;
}
function renderCursor(t) {
  const popup = ease(part(t, TIMES.popup, TIMES.popup + .5));
  visible($('popup'), t >= TIMES.popup && t < TIMES.intro);
  opacity($('popup'), popup);
  $('popup').style.transform = `translateY(${28 * (1 - popup)}px)`;
  $('chat-button').style.transform = `scale(${t >= TIMES.click && t < TIMES.click + .22 ? .95 : 1})`;
  let click = -10;
  if (t >= 5 && t < 6.2) {
    const p = ease(part(t, 5, 5.6));
    cursorAt(lerp(1190, 1252, p), lerp(710, 552, p), true);
    click = t - 5.6;
  } else if (t >= 16.6 && t < TIMES.intro) {
    const p = ease(part(t, 16.6, 18.3));
    cursorAt(lerp(1080, 1360, p), lerp(775, 662, p), true);
    click = t - TIMES.click;
  } else if (t >= 36 && t < 38.6) {
    const p = ease(part(t, 36, 37.3));
    cursorAt(lerp(1160, 636, p), lerp(720, 515, p), true);
    click = t - TIMES.yes;
  } else cursorAt(0, 0, false);
  const transform = $('cursor').style.transform;
  $('click-ring').style.transform = `${transform} translate(-23px,-23px) scale(${lerp(.25, 1.3, part(click, 0, .45))})`;
  visible($('click-ring'), click >= 0 && click < .45);
  opacity($('click-ring'), 1 - part(click, 0, .45));
}
function renderTitles(t) {
  const titleTime = t - TIMES.title;
  const charTimes = [.65, .81, 1.05, 1.5, 2.3, 3.6];
  const count = charTimes.filter((time) => titleTime >= time).length;
  $('slow-word').textContent = 'slowww'.slice(0, count);
  const blue = part(titleTime, .65, 4.2);
  $('slow-word').style.color = `rgb(${lerp(255, 31, blue)},${lerp(255, 71, blue)},${lerp(255, 161, blue)})`;
  visible($('slow-question'), titleTime >= 4.2);
  visible($('title-caret'), titleTime < 4.6);
  opacity($('title-caret'), Math.sin(t * 7) > 0 ? 1 : .15);
  const slide = ease(part(t, 50.2, 51.5));
  const pop = ease(part(t, TIMES.end, TIMES.end + .65));
  const lockup = $('end-lockup'), mascot = $('end-mascot'), wordmark = $('wordmark');
  const centre = (lockup.offsetWidth - mascot.offsetWidth) / 2; // the mark alone sits centred until the words slide in
  mascot.style.transform = `translateX(${centre * (1 - slide)}px) scale(${lerp(.8, 1, pop)})`;
  opacity(mascot, pop);
  wordmark.style.transform = `translateX(${-(wordmark.offsetWidth + 20) * (1 - slide)}px)`;
  opacity(wordmark, slide);
}
const stamp = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
function render(t) {
  const scene = t < TIMES.intro ? 'gpt' : t < TIMES.title ? 'superbot' : t < TIMES.rescue ? 'slow-title' : t < TIMES.end ? 'rescue-title' : 'end-card';
  sceneIds.forEach((id) => { visible($(id), id === scene); opacity($(id), id === scene ? 1 : 0); });
  renderChat(t);
  renderSphere(t - TIMES.intro);
  renderHandoff(t - TIMES.intro);
  renderQuestion(t);
  renderCursor(t);
  renderTitles(t);
  $('scrub').value = t;
  $('clock').value = `${stamp(t)} / ${stamp(DURATION)}`;
  $('stage').dataset.scene = scene;
  $('stage').dataset.time = t.toFixed(3);
}
const params = new URLSearchParams(location.search);
if (params.has('clean')) document.body.classList.add('clean');
let current = clamp(Number(params.get('t') || 0), 0, DURATION);
let playing = !params.has('t');
let previous = null;
function seek(t) { current = clamp(t, 0, DURATION); previous = null; render(current); }
function setPlaying(value) { playing = value; previous = null; $('play').textContent = playing ? 'Ⅱ' : '▶'; $('play').setAttribute('aria-label', playing ? 'Pause ad' : 'Play ad'); }
function frame(now) {
  if (playing && previous !== null) current = (current + (now - previous) / 1000) % DURATION;
  previous = now;
  render(current);
  requestAnimationFrame(frame);
}
function fit() { const box = $('viewport').getBoundingClientRect(); $('stage').style.transform = `scale(${Math.min(box.width / 1600, box.height / 900)})`; }
$('play').addEventListener('click', () => setPlaying(!playing));
$('replay').addEventListener('click', () => { seek(0); setPlaying(true); });
$('scrub').addEventListener('input', (event) => { setPlaying(false); seek(Number(event.target.value)); });
$('chat-button').addEventListener('click', () => { seek(TIMES.click); setPlaying(true); });
$('yes-choice').addEventListener('click', () => { seek(TIMES.yes); setPlaying(true); });
$('fullscreen').addEventListener('click', () => { const action = document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen(); action.catch((error) => console.error('Fullscreen unavailable:', error)); });
document.addEventListener('keydown', (event) => { if (event.code === 'Space' && event.target === document.body) { event.preventDefault(); setPlaying(!playing); } });
document.addEventListener('visibilitychange', () => { previous = null; });
addEventListener('resize', fit);
window.ad = { seek: (t) => { setPlaying(false); seek(t); }, play: () => setPlaying(true), pause: () => setPlaying(false), render, wordsAt, duration: DURATION, times: TIMES, prompt: PROMPT, acknowledgement: ACK, question: QUESTION };
await Promise.all([...document.images].map((image) => image.decode().catch((error) => { console.error(`Image failed: ${image.src}`, error); })));
fit();
setPlaying(playing);
render(current);
requestAnimationFrame(frame);
