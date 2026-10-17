// The 'bedtime' variant's answer to "Read this bedtime story out loud": Gemini reads the story aloud in a read-along
// card. A cover and title row, a player (play/pause, a voice-level waveform, elapsed time, stop, a progress line) and
// the story page in a serif, where a highlight glides from word to word as it is spoken (synchronized word
// highlighting, the read-along convention of Apple Books' Read Aloud and Kindle's Immersion Reading). In the spot it is
// a pure function of t: "Preparing audio" over the waveform, the play button presses, the waveform wakes and the
// highlight starts down the first line, squeezed into the window the Gemini beat leaves (times(r, end)) so every
// variant loops the same length.
// The play button is real: clicking it holds the spot's clock on the card (window.__AD.seek) and reads the whole story
// aloud with the browser's speechSynthesis (a calm on-device voice, one sentence per utterance so Chrome never cuts a
// long one off), the highlight following the voice's word boundary events. Pause, play and stop work; stop, the end
// of the story, or anyone moving the clock (space, an arrow, R, a variant pick) hands the spot back its loop.
// Its stylesheet (../bedtime.b60749a3.css) loads with the module. Cover: a public-domain NPS photo
// (img/bedtime.b60749a3/CREDITS.txt); the story is original.
import { clamp, lerp, seg, outCubic, streamCount, esc, rand } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
// the Share control every output card carries (share.29a362ea.js), at the head's right end
import { SHARE_GLYPH, shareAttrs } from './share.29a362ea.js';

const SAY = 'Reading your story aloud now. Sweet dreams.';
const CSS = new URL('../bedtime.b60749a3.css?v=1', import.meta.url).href;
const TITLE = 'The Moon Who Couldn’t Sleep';
const STORY = [
  'Once upon a time, high above a quiet canyon, the Moon could not fall asleep. She counted the stars one by one, until the numbers grew too big to hold. She asked the owls for help, but they only said “who?” and never answered.',
  'Far below, the windows of a little lodge glowed gold. “What are they doing down there?” the Moon asked the wind. “Getting ready for bed,” the wind whispered. “They brush their teeth, they read a story, and someone says goodnight.”',
  'So the Moon pulled a soft cloud up to her chin and listened. Far below, someone began to read. Her silver eyes grew heavy, and heavier still. “Sleep well, little Moon,” said the canyon. And at last, the Moon slept.',
];
const LEN = 56;   // the narration's length in seconds, for the time label (about 2.3 words a second at rate 0.86)
const WPS = 3.4;  // the spot's read-along pace in words a second: brisker than speech, so the highlight visibly travels
const BARS = 28;
const LINE = 22;  // the story page's line height in px (bedtime.b60749a3.css .bs-page)
const PLAY = '<svg class="bs-i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
const PAUSE = '<svg class="bs-i-pause" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const STOP = '<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7z"/></svg>';
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`bedtime variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// the story as sentences of words: each word's index in the whole story and its character offset in its sentence
// (a boundary event reports a character offset into the utterance)
function tokenize(paras) {
  const sentences = [], html = [];
  let n = 0;
  paras.forEach((p) => {
    const spans = [];
    (p.match(/[^.!?]+[.!?]+[”"]?\s*/g) || [p]).forEach((raw) => {
      const s = { text: raw.trim(), words: [] };
      for (const m of s.text.matchAll(/\S+/g)) {
        s.words.push({ i: n++, at: m.index });
        spans.push(`<span class="bs-w">${esc(m[0])}</span>`);
      }
      sentences.push(s);
    });
    html.push(`<p class="bs-p">${spans.join(' ')}</p>`);
  });
  return { sentences, html: html.join(''), count: n };
}

const CALM = ['Samantha', 'Karen', 'Moira', 'Serena', 'Tessa', 'Google UK English Female', 'Microsoft Aria', 'Microsoft Jenny'];
// a calm English voice, preferring on-device ones: they fire word boundaries, network voices may not
function calmVoice() {
  const en = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  for (const name of CALM) { const v = en.find((x) => x.name.startsWith(name)); if (v) return v; }
  return en.find((v) => v.localService) || en[0] || null;
}
// Chrome fills getVoices() asynchronously: wait for the list, but never longer than a beat
const voicesLoaded = () => (speechSynthesis.getVoices().length ? Promise.resolve() : new Promise((done) => {
  const late = setTimeout(done, 1200);
  speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(late); done(); }, { once: true });
}));

// Reads sentences[from..] aloud, one utterance each, then calls onDone. word() is the word being spoken: from the
// boundary events when the voice sends them, else paced from the utterance's start. A stopped run's events are ignored.
function makeReader(sentences, onDone) {
  let run = 0;
  const cur = { si: 0, t0: 0, word: 0, bounded: false };
  const speak = (si, id) => {
    if (id !== run) return;
    if (si >= sentences.length) { onDone(); return; }
    const s = sentences[si];
    Object.assign(cur, { si, t0: performance.now(), word: s.words[0].i, bounded: false });
    const u = new SpeechSynthesisUtterance(s.text);
    const v = calmVoice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-US';
    u.rate = 0.86;
    u.pitch = 0.95;
    u.onstart = () => { if (id === run) cur.t0 = performance.now(); };
    u.onboundary = (e) => {
      if (id !== run || e.name !== 'word') return;
      cur.bounded = true;
      cur.word = s.words.reduce((w, x) => (x.at <= e.charIndex ? x.i : w), s.words[0].i);
    };
    u.onend = () => speak(si + 1, id);
    u.onerror = (e) => {
      if (id !== run || e.error === 'interrupted' || e.error === 'canceled') return;
      console.error(new Error(`bedtime read-aloud failed on sentence ${si}: ${e.error}`));
      run++;
      onDone();
    };
    speechSynthesis.speak(u);
  };
  return {
    start(si) { const id = ++run; speechSynthesis.cancel(); voicesLoaded().then(() => speak(si, id)); },
    stop() { run++; speechSynthesis.cancel(); },
    get sentence() { return cur.si; },
    word() {
      if (cur.bounded) return cur.word;
      const s = sentences[cur.si];
      const k = Math.floor(((performance.now() - cur.t0) / 1000) * 2.3);
      return s.words[Math.min(s.words.length - 1, k)].i;
    },
  };
}

function cardHtml(x, story) {
  const bars = Array.from({ length: BARS }, () => '<i></i>').join('');
  return `<div class="bs">
    <div class="bs-head">
      <img class="bs-cover" src="${x.img('bedtime.b60749a3/moonrise.jpg')}" width="320" height="320" alt="A full moon rising over a canyon lodge at dusk"/>
      <div class="bs-meta"><b>${x.esc(TITLE)}</b><small>Bedtime story, read by Gemini</small></div>
      <span class="bs-voice">Calm voice</span>
      <button class="bs-share" type="button" ${shareAttrs('Bedtime story')}>${SHARE_GLYPH}</button>
    </div>
    <div class="bs-player">
      <button class="bs-play" type="button" aria-label="Read the story aloud">${PLAY}${PAUSE}</button>
      <div class="bs-wave"><span class="bs-bars">${bars}</span><span class="qc-genl bs-prep">${x.tile('gemini')}Preparing audio</span></div>
      <span class="bs-time"></span>
      <button class="bs-stop" type="button" aria-label="Stop reading" disabled>${STOP}</button>
    </div>
    <div class="bs-track"><i class="bs-fill"></i></div>
    <div class="bs-view"><div class="bs-page"><i class="bs-hl"></i>${story.html}</div></div>
  </div>`;
}

// a word's highlight box in the story page's px (offsets ignore the stage's scale transform)
const boxOf = (w) => ({ x: w.offsetLeft - 3, y: w.offsetTop - 1, w: w.offsetWidth + 6, h: w.offsetHeight + 2 });
const mixBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

// The live read-aloud: the play button's clicks, held on the spot's clock. state() is what the card draws while live.
function makeLive(T, story, ui) {
  const ad = () => window.__AD;
  const sec = () => performance.now() / 1000;
  const live = { on: false, playing: false, done: false, at: 0, spoke: 0, since: 0, word: 0 };
  const reader = 'speechSynthesis' in window ? makeReader(story.sentences, () => finish()) : null;
  const end = (resume) => {
    if (!live.on) return;
    reader.stop();
    live.on = false;
    if (resume) ad().play(live.at);
  };
  const finish = () => {
    if (live.playing) live.spoke += sec() - live.since;
    Object.assign(live, { playing: false, done: true, word: story.count - 1 });
    setTimeout(() => { if (live.done) end(true); }, 1500);
  };
  const toggle = () => {
    if (!reader) { console.error(new Error('bedtime read-aloud: this browser has no speechSynthesis')); return; }
    if (!live.on) {
      // hold the spot on the card, already playing, then read from the top
      live.at = clamp(ad().now, T.play + 0.4, T.end - 0.1);
      ad().seek(live.at);
      Object.assign(live, { on: true, playing: true, done: false, spoke: 0, since: sec(), word: 0 });
      reader.start(0);
    } else if (live.playing) {
      live.word = reader.word();
      reader.stop();
      live.spoke += sec() - live.since;
      live.playing = false;
    } else {
      if (live.done) Object.assign(live, { done: false, spoke: 0 });
      reader.start(live.done ? 0 : reader.sentence);
      live.playing = true;
      live.since = sec();
    }
  };
  ui.play.addEventListener('click', toggle);
  ui.stop.addEventListener('click', () => end(true));
  // the spot's own keys (space, arrows, R) listen on window; a key pressed on these buttons is the button's
  ui.block.addEventListener('keydown', (e) => { if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) e.stopPropagation(); });
  addEventListener('variantchange', () => end(false));
  addEventListener('pagehide', () => end(false));
  return {
    get on() { return live.on; },
    // someone moved the spot's clock (space, an arrow, R, a variant pick): the loop takes the card back
    check(t) { if (live.on && Math.abs(t - live.at) > 0.06) end(false); },
    state() {
      const word = live.done ? story.count : live.playing ? reader.word() : live.word;
      return { word, playing: live.playing, elapsed: live.spoke + (live.playing ? sec() - live.since : 0), phase: sec() };
    },
  };
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.prep = r + 0.32;
    T.play = r + 1.0;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const story = tokenize(STORY);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(cardHtml(x, story));
    const $ = (s) => block.querySelector(s);
    const ui = {
      block, play: $('.bs-play'), stop: $('.bs-stop'), prep: $('.bs-prep'), time: $('.bs-time'), fill: $('.bs-fill'),
      page: $('.bs-page'), view: $('.bs-view'), hl: $('.bs-hl'), cover: $('.bs-cover'),
      bars: [...block.querySelectorAll('.bs-bars i')], words: [...block.querySelectorAll('.bs-w')],
    };
    const live = makeLive(T, story, ui);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lit = -1, secShown = -1, playOn = null, decoding = false, hlBox = null, scroll = 0;

    // words up to `cur` read bright; only the ones that changed since the last frame are touched
    const drawWords = (cur) => {
      if (cur === lit) return;
      const [a, b] = [Math.min(cur, lit), Math.max(cur, lit)];
      for (let i = Math.max(0, a + 1); i <= Math.min(b, story.count - 1); i++) ui.words[i].classList.toggle('on', i <= cur);
      lit = cur;
    };
    const placeHl = (bx, o) => {
      ui.hl.style.opacity = o.toFixed(3);
      if (!bx) return;
      ui.hl.style.transform = `translate(${bx.x.toFixed(2)}px, ${bx.y.toFixed(2)}px)`;
      ui.hl.style.width = `${bx.w.toFixed(2)}px`;
      ui.hl.style.height = `${bx.h.toFixed(2)}px`;
    };
    const drawPlayer = (playing, speaking, phase, ramp, elapsed, prog) => {
      if (playing !== playOn) {
        ui.play.classList.toggle('on', playing);
        ui.play.setAttribute('aria-label', playing ? 'Pause reading' : 'Read the story aloud');
        playOn = playing;
      }
      ui.stop.disabled = !live.on;
      const still = reduced() && live.on;
      ui.bars.forEach((bar, i) => {
        const wob = still ? 0.6 : 0.5 + 0.5 * Math.sin(phase * (5 + 4 * rand(i + 40)) + i * 1.3);
        const h = 3 + (speaking ? 19 * (0.35 + 0.65 * rand(i + 1)) * wob * ramp : 0);
        bar.style.height = `${h.toFixed(2)}px`;
        bar.classList.toggle('on', speaking);
      });
      const s = Math.floor(elapsed);
      if (s !== secShown) { ui.time.textContent = `${clock(s)} / ${clock(LEN)}`; secShown = s; }
      ui.fill.style.width = `${(clamp(prog) * 100).toFixed(3)}%`;
    };
    // the spot: the highlight glides into each word over the first third of its time, starting on the first line
    const drawLoop = (t) => {
      const f = (t - T.play) * WPS;
      const cur = t < T.play ? -1 : Math.min(story.count - 1, Math.floor(f));
      drawWords(cur);
      const p = outCubic(clamp((f - cur) / 0.35));
      const bx = cur < 0 ? null : cur === 0 ? boxOf(ui.words[0]) : mixBox(boxOf(ui.words[cur - 1]), boxOf(ui.words[cur]), p);
      placeHl(bx, outCubic(seg(t, T.play, T.play + 0.15)));
      hlBox = bx; scroll = 0;
      ui.page.style.transform = 'none';
      drawPlayer(t >= T.play, t >= T.play, t, outCubic(seg(t, T.play, T.play + 0.25)), Math.max(0, t - T.play), Math.max(0, f) / story.count);
    };
    // live: the highlight follows the voice and the page scrolls to keep its line second from the top
    const drawLive = () => {
      const st = live.state();
      const cur = Math.min(st.word, story.count - 1);
      drawWords(st.word >= story.count ? story.count - 1 : cur);
      const to = boxOf(ui.words[cur]);
      const snap = reduced() || !hlBox;
      hlBox = snap ? to : mixBox(hlBox, to, 0.35);
      placeHl(hlBox, st.word >= story.count ? 0 : 1);
      const max = Math.max(0, ui.page.offsetHeight - ui.view.clientHeight);
      const want = clamp(to.y - LINE, 0, max);
      scroll = reduced() ? want : lerp(scroll, want, 0.12);
      ui.page.style.transform = scroll < 0.05 ? 'none' : `translateY(${(-scroll).toFixed(2)}px)`;
      drawPlayer(st.playing, st.playing, st.phase, 1, st.elapsed, (st.word + 1) / story.count);
    };

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the cover; decode() only works once the nodes have left the template's inert
        // document, which they have by the first render
        if (!decoding) {
          decoding = true;
          track(ui.cover.decode().catch((e) => console.error(new Error(`bedtime cover failed to decode: ${ui.cover.src}`, { cause: e }))));
        }
        live.check(t);
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        ui.prep.style.opacity = live.on ? '0' : (seg(t, T.prep, T.prep + 0.2) * (1 - seg(t, T.play - 0.2, T.play))).toFixed(3);
        const press = live.on ? 0 : seg(t, T.play - 0.12, T.play) * (1 - seg(t, T.play, T.play + 0.1));
        ui.play.style.transform = press ? `scale(${(1 - 0.12 * press).toFixed(4)})` : 'none';
        if (live.on) drawLive(); else drawLoop(t);
      },
    };
  },
};
