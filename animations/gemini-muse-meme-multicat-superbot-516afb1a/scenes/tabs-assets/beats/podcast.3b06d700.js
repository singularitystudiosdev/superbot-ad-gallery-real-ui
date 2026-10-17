// The 'podcast' variant's answer to "Make a podcast episode about space": Gemini hands back a two-host episode, the
// shape of its Audio Overview (two AI hosts talking a topic through). An episode row (cover, title, show and hosts as
// two avatars that light while they talk), a player (play/pause, a speaker-tinted waveform of the whole episode,
// elapsed time, stop), a chapter-segmented progress line, the four chapters as show notes, and the transcript as
// speaker turns with a highlight that follows the spoken word. In the spot it is a pure function of t: "Generating
// audio" over a flat waveform, the waveform draws itself in, the play button presses and Nova starts the cold open,
// squeezed into the window the Gemini beat leaves (times(r, end)) so every variant loops the same length.
// The play button is real: clicking it holds the spot's clock on the card (window.__AD.seek) and performs the whole
// episode with the browser's speechSynthesis, one voice per host (one sentence per utterance so Chrome never cuts a
// long one off), the highlight following each voice's word boundary events. Pause, play and stop work; stop, the end
// of the episode, or anyone moving the clock (space, an arrow, R, a variant pick) hands the spot back its loop.
// Its stylesheet (../podcast.3b06d700.css) loads with the module. Cover: Earthrise, Apollo 8, NASA, public domain
// (img/podcast.3b06d700/CREDITS.txt); the script is original and its facts are checked.
import { clamp, lerp, seg, outCubic, streamCount, esc, rand } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
// the Share control every output card carries (share.29a362ea.js), at the head's right end
import { SHARE_GLYPH, shareAttrs } from './share.29a362ea.js';

const SAY = 'Here’s your episode: two hosts, four chapters, about space and the photo that changed how we see it.';
const CSS = new URL('../podcast.3b06d700.css?v=1', import.meta.url).href;
const TITLE = 'Earthrise: The Photo That Changed Space';
const SHOW = 'Deep Field · Episode 1 · with Nova and Theo';
const HOSTS = { a: 'Nova', b: 'Theo' };
// [chapter title, [speaker, line]...]
const SCRIPT = [
  ['Christmas Eve, 1968', [
    ['a', 'Welcome to Deep Field. I’m Nova.'],
    ['b', 'And I’m Theo. Today we’re talking about one photo that changed how we see space.'],
    ['a', 'It’s Christmas Eve, 1968. Apollo 8 is the first crewed spacecraft ever to orbit the Moon.'],
    ['b', 'On their fourth orbit, the Earth rises over the lunar horizon. Bill Anders asks for a roll of color film and starts shooting.'],
    ['a', 'That shot is Earthrise. A half-lit blue Earth, hanging over a gray and empty Moon.'],
  ]],
  ['The overview effect', [
    ['b', 'Astronauts describe a feeling when they see the whole planet at once. The writer Frank White named it the overview effect, in 1987.'],
    ['a', 'Borders disappear. You just see one small, fragile world.'],
    ['b', 'Anders said it best. We came all this way to explore the Moon, and the most important thing is that we discovered the Earth.'],
  ]],
  ['A pale blue dot', [
    ['a', 'Fast forward to 1990. Voyager 1 is about six billion kilometers from home.'],
    ['b', 'Carl Sagan asks NASA to turn the camera around for one last look.'],
    ['a', 'And Earth shows up as a single pale blue dot, less than one pixel wide.'],
    ['b', 'Every person who ever lived, on a mote of dust suspended in a sunbeam.'],
  ]],
  ['Looking further', [
    ['a', 'Then on Christmas Day 2021, fifty three years after Earthrise, the James Webb Space Telescope launched.'],
    ['b', 'Now we see galaxies whose light left them more than thirteen billion years ago.'],
    ['a', 'Every time we go further out, we learn a little more about home.'],
    ['b', 'That’s our episode. Thanks for listening to Deep Field.'],
  ]],
];
const SPOKEN_WPS = 2.7; // the voices' pace in words a second, for the time labels and the no-boundary fallback
const WPS = 3.4;        // the spot's read-along pace: brisker than speech, so the highlight visibly travels
const BARS = 46;
const LINE = 20;        // the transcript's line height in px (podcast.3b06d700.css .pc-page)
const PLAY = '<svg class="pc-i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
const PAUSE = '<svg class="pc-i-pause" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
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
    sheet.onerror = () => { console.error(new Error(`podcast variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// The script as utterance-sized sentences of words (each word's index in the episode, its character offset in its
// sentence, since a boundary event reports one), plus each word's speaker and each chapter's first word.
function tokenize(script) {
  const sentences = [], speakers = [], chapters = [], html = [];
  let n = 0;
  script.forEach(([title, turns]) => {
    chapters.push({ title, first: n });
    turns.forEach(([who, line]) => {
      const spans = [];
      (line.match(/[^.!?]+[.!?]+\s*/g) || [line]).forEach((raw) => {
        const s = { who, text: raw.trim(), words: [] };
        for (const m of s.text.matchAll(/\S+/g)) {
          s.words.push({ i: n++, at: m.index });
          speakers.push(who);
          spans.push(`<span class="pc-w">${esc(m[0])}</span>`);
        }
        sentences.push(s);
      });
      html.push(`<p class="pc-turn pc-${who}"><b class="pc-who">${HOSTS[who]}</b>${spans.join(' ')}</p>`);
    });
  });
  chapters.forEach((c, i) => { c.end = i + 1 < chapters.length ? chapters[i + 1].first : n; });
  return { sentences, speakers, chapters, html: html.join(''), count: n, len: Math.round(n / SPOKEN_WPS) };
}

// one English voice per host, preferring on-device ones: they fire word boundaries, network voices may not
const VOICES = {
  a: ['Samantha', 'Karen', 'Moira', 'Tessa', 'Serena', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny'],
  b: ['Daniel', 'Alex', 'Rishi', 'Oliver', 'Fred', 'Google UK English Male', 'Microsoft Guy', 'Microsoft Davis'],
};
function castVoices() {
  const en = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const pick = (names) => names.map((name) => en.find((v) => v.name.startsWith(name))).find(Boolean);
  const a = pick(VOICES.a) || en.find((v) => v.localService) || en[0] || null;
  const b = pick(VOICES.b) || en.find((v) => v.localService && v !== a) || a;
  // one voice for both hosts: pitch keeps them apart
  return { a: { voice: a, pitch: b === a ? 1.12 : 1 }, b: { voice: b, pitch: b === a ? 0.82 : 1 } };
}
// Chrome fills getVoices() asynchronously: wait for the list, but never longer than a beat
const voicesLoaded = () => (speechSynthesis.getVoices().length ? Promise.resolve() : new Promise((done) => {
  const late = setTimeout(done, 1200);
  speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(late); done(); }, { once: true });
}));

// Performs sentences[from..] aloud, one utterance each in its host's voice, then calls onDone. word() is the word being
// spoken: from the boundary events when the voice sends them, else paced from the utterance's start.
function makeReader(sentences, onDone) {
  let run = 0, cast = null;
  const cur = { si: 0, t0: 0, word: 0, bounded: false };
  const speak = (si, id) => {
    if (id !== run) return;
    if (si >= sentences.length) { onDone(); return; }
    const s = sentences[si];
    Object.assign(cur, { si, t0: performance.now(), word: s.words[0].i, bounded: false });
    const u = new SpeechSynthesisUtterance(s.text);
    const { voice, pitch } = cast[s.who];
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-US';
    u.rate = 1;
    u.pitch = pitch;
    u.onstart = () => { if (id === run) cur.t0 = performance.now(); };
    u.onboundary = (e) => {
      if (id !== run || e.name !== 'word') return;
      cur.bounded = true;
      cur.word = s.words.reduce((w, x) => (x.at <= e.charIndex ? x.i : w), s.words[0].i);
    };
    u.onend = () => speak(si + 1, id);
    u.onerror = (e) => {
      if (id !== run || e.error === 'interrupted' || e.error === 'canceled') return;
      console.error(new Error(`podcast playback failed on sentence ${si}: ${e.error}`));
      run++;
      onDone();
    };
    speechSynthesis.speak(u);
  };
  return {
    start(si) {
      const id = ++run;
      speechSynthesis.cancel();
      voicesLoaded().then(() => { cast = castVoices(); speak(si, id); });
    },
    stop() { run++; speechSynthesis.cancel(); },
    get sentence() { return cur.si; },
    word() {
      if (cur.bounded) return cur.word;
      const s = sentences[cur.si];
      const k = Math.floor(((performance.now() - cur.t0) / 1000) * SPOKEN_WPS);
      return s.words[Math.min(s.words.length - 1, k)].i;
    },
  };
}

function cardHtml(x, ep) {
  const bars = Array.from({ length: BARS }, (_, i) => `<i class="pc-${ep.speakers[Math.floor((i / BARS) * ep.count)]}"></i>`).join('');
  const segs = ep.chapters.map((c) => `<span class="pc-seg" style="flex:${c.end - c.first}"><i></i></span>`).join('');
  const chaps = ep.chapters.map((c, i) => `<li class="pc-ch"><time>${clock(c.first / SPOKEN_WPS)}</time><span>${i + 1}. ${x.esc(c.title)}</span></li>`).join('');
  return `<div class="pc">
    <div class="pc-head">
      <img class="pc-cover" src="${x.img('podcast.3b06d700/earthrise.jpg')}" width="320" height="320" alt="Earthrise: the Earth rising over the Moon's horizon, photographed from Apollo 8"/>
      <div class="pc-meta"><b>${x.esc(TITLE)}</b><small>${x.esc(SHOW)}</small></div>
      <span class="pc-hosts" aria-label="Hosts: Nova and Theo"><i class="pc-av pc-a">N</i><i class="pc-av pc-b">T</i></span>
      <button class="pc-share" type="button" ${shareAttrs('Podcast episode')}>${SHARE_GLYPH}</button>
    </div>
    <div class="pc-player">
      <button class="pc-play" type="button" aria-label="Play the episode">${PLAY}${PAUSE}</button>
      <div class="pc-wave"><span class="pc-bars">${bars}</span><span class="qc-genl pc-prep">${x.tile('gemini')}Generating audio</span></div>
      <span class="pc-time"></span>
      <button class="pc-stop" type="button" aria-label="Stop the episode" disabled>${STOP}</button>
    </div>
    <div class="pc-track">${segs}</div>
    <ol class="pc-chs">${chaps}</ol>
    <div class="pc-view"><div class="pc-page"><i class="pc-hl"></i>${ep.html}</div></div>
  </div>`;
}

// a word's highlight box in the transcript's px (offsets ignore the stage's scale transform)
const boxOf = (w) => ({ x: w.offsetLeft - 3, y: w.offsetTop - 1, w: w.offsetWidth + 6, h: w.offsetHeight + 2 });
const mixBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

// The live episode: the play button's clicks, held on the spot's clock. state() is what the card draws while live.
function makeLive(T, ep, ui) {
  const ad = () => window.__AD;
  const sec = () => performance.now() / 1000;
  const live = { on: false, playing: false, done: false, at: 0, spoke: 0, since: 0, word: 0 };
  const reader = 'speechSynthesis' in window ? makeReader(ep.sentences, () => finish()) : null;
  const end = (resume) => {
    if (!live.on) return;
    reader.stop();
    live.on = false;
    if (resume) ad().play(live.at);
  };
  const finish = () => {
    if (live.playing) live.spoke += sec() - live.since;
    Object.assign(live, { playing: false, done: true, word: ep.count - 1 });
    setTimeout(() => { if (live.done) end(true); }, 1500);
  };
  const toggle = () => {
    if (!reader) { console.error(new Error('podcast playback: this browser has no speechSynthesis')); return; }
    if (!live.on) {
      // hold the spot on the card, already playing, then perform from the top
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
      const word = live.done ? ep.count : live.playing ? reader.word() : live.word;
      return { word, playing: live.playing, elapsed: live.spoke + (live.playing ? sec() - live.since : 0), phase: sec() };
    },
  };
}

// The episode's moving parts other than the transcript: avatars, play button, waveform, time, chapter track and list.
function makePlayerView(ep, ui, live) {
  const heights = ui.bars.map((_, i) => 5 + 19 * (0.3 + 0.7 * rand(i + 7)) * (0.65 + 0.35 * Math.sin(i * 0.55)));
  let playOn = null, secShown = -1, chShown = -1, litBars = -1;
  return ({ playing, word, phase, grow, elapsed }) => {
    if (playing !== playOn) {
      ui.play.classList.toggle('on', playing);
      ui.play.setAttribute('aria-label', playing ? 'Pause the episode' : 'Play the episode');
      playOn = playing;
    }
    ui.stop.disabled = !live.on;
    const w = clamp(word, 0, ep.count - 1);
    const who = word < 0 ? null : ep.speakers[w];
    const wob = reduced() ? 0.5 : 0.5 + 0.5 * Math.sin(phase * 9);
    ui.avs.forEach((av) => {
      const talk = playing && av.classList.contains(`pc-${who}`);
      av.classList.toggle('talk', talk);
      av.style.boxShadow = talk ? `0 0 0 2px var(--raised), 0 0 0 ${(3.5 + 1.5 * wob).toFixed(2)}px currentColor` : '';
    });
    const prog = word < 0 ? 0 : clamp((word + 1) / ep.count);
    const lit = Math.floor(prog * ui.bars.length);
    ui.bars.forEach((bar, i) => {
      const g = grow(i);
      bar.style.height = `${(3 + (heights[i] - 3) * g).toFixed(2)}px`;
      if (litBars !== lit) bar.classList.toggle('on', i < lit);
    });
    litBars = lit;
    const s = Math.floor(elapsed);
    if (s !== secShown) { ui.time.textContent = `${clock(s)} / ${clock(ep.len)}`; secShown = s; }
    const ch = word < 0 ? 0 : ep.chapters.findIndex((c) => w < c.end);
    ep.chapters.forEach((c, i) => {
      ui.segs[i].style.width = `${(clamp(((word + 1) - c.first) / (c.end - c.first)) * 100).toFixed(3)}%`;
    });
    if (ch !== chShown) { ui.chs.forEach((li, i) => li.classList.toggle('on', i === ch)); chShown = ch; }
  };
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.prep = r + 0.32;
    T.draw = r + 0.62;
    T.play = r + 1.0;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const ep = tokenize(SCRIPT);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(cardHtml(x, ep));
    const $ = (s) => block.querySelector(s);
    const all = (s) => [...block.querySelectorAll(s)];
    const ui = {
      block, play: $('.pc-play'), stop: $('.pc-stop'), prep: $('.pc-prep'), time: $('.pc-time'),
      page: $('.pc-page'), view: $('.pc-view'), hl: $('.pc-hl'), cover: $('.pc-cover'),
      bars: all('.pc-bars i'), words: all('.pc-w'), avs: all('.pc-av'), segs: all('.pc-seg i'), chs: all('.pc-ch'),
    };
    const live = makeLive(T, ep, ui);
    const drawPlayer = makePlayerView(ep, ui, live);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lit = -1, decoding = false, hlBox = null, hlWho = null, scroll = 0;

    // words up to `cur` read bright; only the ones that changed since the last frame are touched
    const drawWords = (cur) => {
      if (cur === lit) return;
      const [a, b] = [Math.min(cur, lit), Math.max(cur, lit)];
      for (let i = Math.max(0, a + 1); i <= Math.min(b, ep.count - 1); i++) ui.words[i].classList.toggle('on', i <= cur);
      lit = cur;
    };
    const placeHl = (bx, o, who) => {
      ui.hl.style.opacity = o.toFixed(3);
      if (who !== hlWho) { ui.hl.className = `pc-hl pc-${who}`; hlWho = who; }
      if (!bx) return;
      ui.hl.style.transform = `translate(${bx.x.toFixed(2)}px, ${bx.y.toFixed(2)}px)`;
      ui.hl.style.width = `${bx.w.toFixed(2)}px`;
      ui.hl.style.height = `${bx.h.toFixed(2)}px`;
    };
    // the spot: the waveform draws in left to right, then the highlight glides into each word from the first line
    const drawLoop = (t) => {
      const f = (t - T.play) * WPS;
      const cur = t < T.play ? -1 : Math.min(ep.count - 1, Math.floor(f));
      drawWords(cur);
      const p = outCubic(clamp((f - cur) / 0.35));
      const bx = cur < 0 ? null : cur === 0 ? boxOf(ui.words[0]) : mixBox(boxOf(ui.words[cur - 1]), boxOf(ui.words[cur]), p);
      placeHl(bx, outCubic(seg(t, T.play, T.play + 0.15)), ep.speakers[Math.max(0, cur)]);
      hlBox = bx; scroll = 0;
      ui.page.style.transform = 'none';
      const grow = (i) => outCubic(seg(t, T.draw + (i / BARS) * 0.3, T.draw + (i / BARS) * 0.3 + 0.12));
      drawPlayer({ playing: t >= T.play, word: cur, phase: t, grow, elapsed: Math.max(0, t - T.play) });
    };
    // live: the highlight follows the voices and the transcript scrolls to keep its line second from the top
    const drawLive = () => {
      const st = live.state();
      const cur = Math.min(st.word, ep.count - 1);
      drawWords(cur);
      const to = boxOf(ui.words[cur]);
      hlBox = reduced() || !hlBox ? to : mixBox(hlBox, to, 0.35);
      placeHl(hlBox, st.word >= ep.count ? 0 : 1, ep.speakers[cur]);
      const max = Math.max(0, ui.page.offsetHeight - ui.view.clientHeight);
      const want = clamp(to.y - LINE, 0, max);
      scroll = reduced() ? want : lerp(scroll, want, 0.12);
      ui.page.style.transform = scroll < 0.05 ? 'none' : `translateY(${(-scroll).toFixed(2)}px)`;
      drawPlayer({ playing: st.playing, word: cur, phase: st.phase, grow: () => 1, elapsed: st.elapsed });
    };

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the cover; decode() only works once the nodes have left the template's inert
        // document, which they have by the first render
        if (!decoding) {
          decoding = true;
          track(ui.cover.decode().catch((e) => console.error(new Error(`podcast cover failed to decode: ${ui.cover.src}`, { cause: e }))));
        }
        live.check(t);
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        ui.prep.style.opacity = live.on ? '0' : (seg(t, T.prep, T.prep + 0.2) * (1 - seg(t, T.draw - 0.12, T.draw + 0.05))).toFixed(3);
        const press = live.on ? 0 : seg(t, T.play - 0.12, T.play) * (1 - seg(t, T.play, T.play + 0.1));
        ui.play.style.transform = press ? `scale(${(1 - 0.12 * press).toFixed(4)})` : 'none';
        if (live.on) drawLive(); else drawLoop(t);
      },
    };
  },
};
