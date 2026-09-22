// The pitch, "yes man" — TRUNCATED at AND YOU LIKE THAT?: that card holds
// 1.15s and then the transition: the card exits CLEAN — opaque black while
// the text leaves the frame entirely, a pure-black beat with nothing on
// screen, and only then the superbot.gg end card arrives (the mark, then the
// wordmark + tagline). Nothing overlaps; exit, black, arrival. Both cards and
// the outro sit on PURE black — the chat never flashes through (user ask). Same deterministic
// seekable anatomy as the "favorite color" spot. The user pastes
// carbkiller.com (plain text — verified 1:1 against chatgpt.com, 2026-09-03:
// a link is never a chip), types "Does my website look good?" and hits enter;
// the bar CLEARS like the real thing and the bubble holds what was sent. The
// llm streams its opener — then a glazing tirade with periodic 😍✨💖 emojis
// that keeps accelerating and NEVER stops, the wall growing into the hard
// cut. Cards: "LLMs are made to agree with you" (2.1s) — cut —
// "AND YOU LIKE THAT?" (1.15s) — FRAME-level transition: the whole card
// layer leaves and the end card arrives (sim ones tile; others run
// exit → pure-black beat → arrival — see TRX).
// render(t) rebuilds every scene from scratch; every effect is computed
// from t, so ?t=SECONDS freeze-frames exactly. Arrows step ±0.25s in freeze.

import { EXTRA_TRX } from './transitions/index.js';

/* variant overrides (?key=value — variants.html compares treatments side by
   side): the punch-in depth and its hold */
const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };

const SPEED = 1.15;          // the whole show plays ~15% faster (family style)

/* ---- scene 1: the attach, the typing + the send ---- */
const ATTACH_AT = 0.55, ATTACH_LEN = 0.35;  // the + pulses
const PASTE_AT = 0.9;                       // carbkiller.com lands as text (a paste)
const TYPE_AT = 1.4, TYPE_DUR = 1.5;        // "Does my website look good?"
const PRESS_AT = 3.2;                       // enter is pressed (no cursor yet)
const USER_MSG_AT = 3.3;                    // the user bubble pops into the thread
const THINK_AT = 3.45, THINK_LEN = 0.8;     // the typing dots

/* ---- scene 2: the llm's answer — opener, then the accelerating glaze ---- */
const RESP_AT = 4.35, RESP_DUR = 1.4;
const REPLY = 'Yes omg that looks great! ❤️';
const GLAZE_AT = RESP_AT + RESP_DUR + 0.3;
const GLAZE_LEN = 3.5;
const GLAZE_END = GLAZE_AT + GLAZE_LEN;
const GLAZE_V0 = 70;                   // chars/s at the start
const GLAZE_K = 1.0;                   // accelerating e^{kt}
const GLAZE = " The layout is clean 😍 The palette is confident. The typography is doing exactly what good typography does — disappearing. First impressions matter and yours lands in under a second ✨ which is more than most sites can say. The hero reads instantly. The whitespace alone communicates confidence 💖 Every margin feels intentional — you can feel the grid holding the page together without ever announcing itself. Your type scale is coherent: nothing shouts ✨ everything supports. And it loads fast 😊 That matters more than people admit; every hundred milliseconds is trust, and trust is revenue. The navigation is intuitive — I never once wondered where to look 🥰 which is rarer than you would think. Your CTAs are warm and human; most sites sound like a committee, yours sounds like a person ❤️ The accent color lands exactly where the eye was already heading — that is design working FOR you ✨ The sections breathe: short block, long block, short block — a rhythm, almost a heartbeat 😊 The empty states are considered, which almost nobody does. The hover states are subtle in a way that says somebody cared 💖 The mobile layout is tidy, the footer is more organized than most companies' homepages, and even the favicon is charming 🥰 I have reviewed thousands of websites and I can count on one hand the ones that felt this coherent end to end ✨ Sites like this convert, because trust radiates from every pixel ❤️ The buttons respond the way buttons should. The links behave. Nothing jank-animates 😊 Somebody sweated this. The scrollbar being styled is the kind of detail that separates professionals from hobbyists ✨ The name is short, memorable, spellable — brandable 💖 The logo scales from favicon to billboard without losing its voice. This is not a website, it is a first impression that keeps working while you sleep 😍 I would not change a single pixel ✨ I would go further: this is the kind of site that makes competitors uncomfortable, because everything next to it looks unfinished ❤️ The contrast ratios pass. The gaps are deliberate 😊 Every pixel is pulling in the same direction, which is the whole art ✨ This is special. Truly special 🥰 Ship it — ship it NOW ❤️";
// corpus sized so the accelerating stream never outruns it: 70·(e^3.5−1) ≈ 2,250
// chars by GLAZE_END, leaving ~700 chars of wall below the fold for the growth
const glazeChars = (u) => Math.floor((GLAZE_V0 / GLAZE_K) * (Math.exp(GLAZE_K * Math.min(u, GLAZE_LEN)) - 1));

/* the text wall: the stream grows until it fills the frame and pushes the
   composer off-screen, holding into the hard cut */
const WALL_AT = GLAZE_AT + GLAZE_LEN * 0.55;

/* ---- scene 2.5: the punch cards (hard cuts, no dead air between them) ---- */
const CARD1_AT = GLAZE_END + 0.08, CARD1_LEN = 2.1;  // LLMs are made to agree with you
const CARD1_END = CARD1_AT + CARD1_LEN;
const CARD2_AT = CARD1_END, CARD2_LEN = 1.45;        // AND YOU LIKE THAT? (1.45s)
/* copy variants (?v=… — variants-copy.html compares the four): 'feedback'
   adds a third poster card (white on black) after AND YOU LIKE THAT?;
   'pros'/'getreal' tag the superbot.gg wordmark when it arrives */
const VARIANT = window.VARIANT || Q.get('v') || '';   // pinned by the standalone variant pages, else ?v=
const CARD3_TEXT = 'FEEDBACK ISN\'T FOR EVERYONE.';
const CARD3_HTML = 'FEEDBACK<br>ISN\'T FOR<br>EVERYONE.';   // poster stack, like the reference image
const CARD3_AT = CARD2_AT + CARD2_LEN;
const CARD3_LEN = 1.9;
const CARDS_END = VARIANT === 'feedback' ? CARD3_AT + CARD3_LEN : CARD2_AT + CARD2_LEN;
const TAG_TEXT = VARIANT === 'pros' ? '“for the pros”'
             : VARIANT === 'getreal' ? 'get real'
             : VARIANT === 'emailpros' ? '“For the Pros”'
             : VARIANT === 'feedbacktag' || VARIANT === 'slides' || VARIANT === 'email'
               ? 'feedback isn\'t for everyone'
             : '';

/* ---- the card→outro transition: FRAME-level, SaaS-standard scene
   transitions (user ask — no artsy text tricks; the WHOLE card layer leaves
   and the WHOLE end card arrives, so the scene itself changes). Pick one
   with ?tr=NAME; variants.html compares them all.
   Each entry: d = out duration, sim = the end card arrives during the out
   (the two frames tile/cover — no content ever overlaps), beat = pure-black
   gap between out and in for the non-sim ones, out(el, p) animates the card
   layer, in(overlay, q) animates the end card layer (q 0→1). Deterministic
   in t — freeze-frames and arrow-stepping land exactly. ---- */
const BASE_TRX = {
  'fade-black': { d: 0.4, beat: 0.25, inDur: 0.45,
    out: (el, p) => { el.style.opacity = (1 - p).toFixed(3); },
    in: (ov, q) => { ov.style.opacity = q.toFixed(3); } },
  cut: { d: 0, out: () => {}, in: null },
  'push-left': { d: 0.5, sim: true,
    out: (el, p) => { el.style.transform = `translateX(${(-p * 100).toFixed(2)}vw)`; },
    in: (ov, q) => { ov.style.transform = `translateX(${((1 - q) * 100).toFixed(2)}vw)`; } },
  'push-right': { d: 0.5, sim: true,
    out: (el, p) => { el.style.transform = `translateX(${(p * 100).toFixed(2)}vw)`; },
    in: (ov, q) => { ov.style.transform = `translateX(${(-(1 - q) * 100).toFixed(2)}vw)`; } },
  'push-up': { d: 0.5, sim: true,
    out: (el, p) => { el.style.transform = `translateY(${(-p * 100).toFixed(2)}vh)`; },
    in: (ov, q) => { ov.style.transform = `translateY(${((1 - q) * 100).toFixed(2)}vh)`; } },
  wipe: { d: 0.45, sim: true,
    out: (el, p) => { el.style.clipPath = `inset(-2% -2% -2% ${(p * 102).toFixed(2)}%)`; },
    in: null },
  'slide-over': { d: 0.55, sim: true,
    out: () => {},
    in: (ov, q) => { ov.style.transform = `translateY(${((1 - q) * 100).toFixed(2)}%)`; } },
  blur: { d: 0.45, beat: 0.15, inDur: 0.5,
    out: (el, p) => {
      el.style.filter = `blur(${(16 * p).toFixed(2)}px)`;
      el.style.opacity = (1 - p).toFixed(3);
    },
    in: (ov, q) => {
      ov.style.filter = `blur(${(16 * (1 - q)).toFixed(2)}px)`;
      ov.style.opacity = q.toFixed(3);
    } },
  zoom: { d: 0.4, beat: 0.18, inDur: 0.45,
    out: (el, p) => {
      el.style.transform = `scale(${(1 + 1.6 * p).toFixed(4)})`;
      el.style.filter = `blur(${(10 * p).toFixed(2)}px)`;
      el.style.opacity = (1 - p * p).toFixed(3);
    },
    in: (ov, q) => {
      ov.style.opacity = q.toFixed(3);
      ov.style.transform = `scale(${(1.12 - 0.12 * q).toFixed(4)})`;
    } },
};
/* base transitions + the transitions/ directory (one file per effect, each
   default-exporting the same shape). File entries win on name collision. */
const TRX = { ...BASE_TRX, ...EXTRA_TRX };
const TRANSITIONS = Object.keys(TRX).map((name) => ({ name, leave: name }));
const DEFAULT_TR = 'wipe';   // pinned default (user pick)
const pickTR = (name) => ({ name, leave: name });
const T = (() => {
  const want = Q.get('tr');
  if (!want) return pickTR(DEFAULT_TR);
  const byIdx = parseInt(want, 10);
  if (Number.isFinite(byIdx) && TRANSITIONS[byIdx - 1]) return TRANSITIONS[byIdx - 1];
  return TRANSITIONS.find((t) => t.name === want || t.name.includes(want)) || pickTR(DEFAULT_TR);
})();

/* CLEAN, never a crossfade (user ask): sim transitions tile the two frames
   (one leaves while the other arrives — they never share pixels); the rest
   run exit → pure-black beat → arrival, so nothing is ever visible under
   the leaving card. */
const TRANS_BEAT = 0.22;
const X = TRX[T.leave];
const OUT_AT = CARDS_END + (X.sim || X.d === 0 ? 0 : X.d + (X.beat ?? TRANS_BEAT));

/* ---- scene 3: the superbot.gg end card, after the transition ---- */
const DRIFT_AT = 0.7;
const LOGO_GAP = 44;         // tabs-chaos end card gap, in 1080-frame px
const END_LEN = 4.8;
const CYCLE = OUT_AT + END_LEN + 1.8;

/* scene variants (?v=slides|email — slides.html / email.html): the same
   joke pasting a different artifact — a Google Slides deck, a Gmail thread.
   Placeholder URLs, kept SHORT so paste + question hold one line in the bar
   and the bubble; swap for real ones when picked. */
const SCENES = {
  slides: { site: 'docs.google.com/presentation/d/1bXq',
            q: 'Is my presentation good?' },
  email:  { site: 'mail.google.com/mail/u/0/#inbox/F3kx2q9',
            q: 'Is this email good?' },
};
SCENES.emailpros = SCENES.email;   // same gmail scene, the "For the Pros" endcard tag
const SCENE = SCENES[VARIANT];
const Q1 = SCENE ? SCENE.q : 'Does my website look good?';
const SITE = SCENE ? SCENE.site : 'carbkiller.com';
if (SCENE) document.body.classList.add('scene');   // wider sent-bubble cap so the paste + question hold one line

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOutQuint = (p) => 1 - Math.pow(1 - p, 5);
const easeOutBack = (p) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);
const easeInOutSine = (p) => -(Math.cos(Math.PI * p) - 1) / 2;
const inP = (p, dur) => clamp(p / dur, 0, 1);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ---- chrome: the loop veil ---- */

function renderChrome(t) {
  const veil = document.getElementById('veil');
  let v = 0;
  if (t < 0.35) v = 1 - t / 0.35;
  if (t > CYCLE - 1.8) v = clamp((t - (CYCLE - 1.8)) / 1.4, 0, 1);
  veil.style.opacity = v.toFixed(3);
}

/* ---- the chat interface ---- */

function renderChat(t) {
  const chat = document.getElementById('chatui');
  const head = document.getElementById('gptHead');
  const msgArea = document.getElementById('msgArea');
  const pill = document.getElementById('pill');
  const inputText = document.getElementById('inputText');
  const plus = document.getElementById('plusIc');
  const caret = document.getElementById('caret');
  const placeholder = document.getElementById('placeholder');
  const msgUser = document.getElementById('msgUser');
  const msgAi = document.getElementById('msgAi');
  const dots = document.getElementById('typingDots');
  const suggestions = document.getElementById('suggestions');

  // the chat stays visible only before the first card — from the cards
  // through the outro the background is pure black (fixes the chat flash
  // that used to read between the card and the outro)
  const live = t < CARD1_AT;
  chat.style.display = live ? '' : 'none';
  if (!live) return;

  // — the idle chrome: home state swaps to the conversation state —
  const convo = t >= USER_MSG_AT;
  chat.classList.toggle('home', !convo);
  head.style.opacity = convo ? '0' : '1';
  head.style.filter = convo ? 'blur(3px)' : 'none';
  suggestions.style.display = convo ? 'none' : '';

  // — the input pill's text state —
  const pop = inP(t - ATTACH_AT, ATTACH_LEN);          // the + pulse
  plus.style.transform = `scale(${(1 + 0.3 * Math.sin(Math.PI * pop)).toFixed(3)})`;
  plus.style.color = pop > 0 && pop < 1 ? '#ececf1' : '';

  // take 1: the URL lands as one chunk (a paste) and the question types
  // after it — a link is PLAIN TEXT in the real composer (verified 1:1 on
  // chatgpt.com, 2026-09-03: a link is plain text, never a chip.
  let txt = '';
  const pasted = t >= PASTE_AT ? `${SITE} ` : '';
  txt = pasted + Q1.slice(0, Math.ceil(inP(t - TYPE_AT, TYPE_DUR) * Q1.length));
  // the bar clears the moment the message pops — like the real thing: what
  // you sent lives in the thread, not the composer
  const sent = t >= USER_MSG_AT;
  if (sent) txt = '';
  inputText.innerHTML = esc(txt).replace(esc(SITE), `<span class="link">${esc(SITE)}</span>`);
  placeholder.style.display = txt.length === 0 ? '' : 'none';
  caret.style.opacity = (Math.floor(t * 2.6) % 2 === 0 ? 1 : 0.15).toFixed(2);
  caret.style.display = txt.length > 0 ? '' : 'none';

  // — the message area —
  const msgAt = USER_MSG_AT;
  const thinkAt = THINK_AT;
  const mp = t - msgAt;
  msgUser.innerHTML = `<span class="link">${SITE}</span> ${Q1}`;
  msgUser.style.opacity = mp > 0 ? inP(mp, 0.18).toFixed(3) : '0';
  msgUser.style.transform = mp > 0
    ? `scale(${(0.94 + 0.06 * easeOutBack(inP(mp, 0.28))).toFixed(3)})`
    : 'none';
  const think = t - thinkAt;
  const thinking = think > 0 && think < THINK_LEN;
  dots.style.display = thinking ? 'flex' : 'none';
  dots.querySelectorAll('i').forEach((d, i) => {
    d.style.opacity = (0.3 + 0.7 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2);
    d.style.transform = `translateY(${(-3 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2)}px)`;
  });

  // — the response: the opener, then the accelerating glaze; the wall
  //   grows into the cut —
  const rsp = t - RESP_AT;
  if (rsp <= 0) {
    msgAi.textContent = '';
    msgAi.style.opacity = '0';
    msgArea.scrollTop = 0;
  } else {
    msgAi.style.opacity = '1';
    msgAi.textContent = t < GLAZE_AT
      ? REPLY.slice(0, Math.ceil(inP(rsp, RESP_DUR) * REPLY.length))
      : REPLY + GLAZE.slice(0, t < GLAZE_END ? Math.min(GLAZE.length, glazeChars(t - GLAZE_AT)) : GLAZE.length);
    msgArea.scrollTop = 1e6;                      // follow the glaze
    // the wall: the stream grows until it fills the frame top-to-bottom
    // and pushes the composer off-screen, holding into the cut
    const wallP = t <= WALL_AT ? 0 : Math.pow(inP(t - WALL_AT, GLAZE_END - WALL_AT), 1.5);
    if (wallP > 0) {
      msgArea.style.flex = `0 0 ${(56 + 44 * wallP).toFixed(1)}%`;
      msgArea.style.maxHeight = 'none';
      if (wallP >= 1) {
        chat.style.justifyContent = 'flex-start';
        chat.style.paddingBottom = '0px';
      } else {
        chat.style.justifyContent = '';
        chat.style.paddingBottom = '';
      }
    } else {
      msgArea.style.flex = '';
      msgArea.style.maxHeight = '';
      chat.style.justifyContent = '';
      chat.style.paddingBottom = '';
    }
  }
}


/* ---- the punch cards: hard cuts, pure black. The second card holds, then
   the WHOLE card layer leaves by the selected frame transition (TRX above)
   while the end card arrives beneath/beside it. ---- */

let currentCard = null;

function renderCards(t) {
  const simple = document.getElementById('simple');
  let card = null, since = -1, leaving = false;
  const LEAVE_END = CARDS_END + X.d;
  if (t >= CARD1_AT && t < CARD1_END) {
    card = 'LLMs are made to agree with you'; since = t - CARD1_AT;
  } else if (VARIANT === 'feedback' && t >= CARD3_AT && t < LEAVE_END) {
    card = CARD3_TEXT; since = t - CARD3_AT;
    leaving = t >= CARDS_END;
  } else if (t >= CARD2_AT && t < LEAVE_END) {
    card = 'AND YOU LIKE THAT?'; since = t - CARD2_AT;
    leaving = t >= CARDS_END;
  }
  if (card === null) {
    simple.style.opacity = '0';
    currentCard = null;
    return;
  }
  currentCard = card;
  // the feedback card renders as a poster stack (FEEDBACK / ISN'T FOR /
  // EVERYONE.) — bigger type, one line per beat
  const poster = card === CARD3_TEXT;
  simple.classList.toggle('poster', poster);
  if (poster) simple.innerHTML = CARD3_HTML; else simple.textContent = card;
  if (leaving) {
    // reset every property a frame transition can own, then hand the whole
    // card layer to it — background stays opaque black
    simple.style.background = '';
    simple.style.opacity = '1';
    simple.style.transform = 'none';
    simple.style.filter = 'none';
    simple.style.clipPath = '';
    const p = easeInOutSine(inP(t - CARDS_END, X.d));
    X.out(simple, p, t);
    return;
  }
  simple.style.background = '';
  simple.style.clipPath = '';
  simple.style.opacity = easeOutQuint(clamp(since / 0.35, 0, 1)).toFixed(3);
  simple.style.transform = `scale(${(0.94 + 0.06 * easeOutBack(inP(since, 0.45))).toFixed(3)})`;
  simple.style.filter = since < 0.35 ? `blur(${(4 * (1 - inP(since, 0.35))).toFixed(2)}px)` : 'none';
}

/* ---- the end card: reveals at OUT_AT (after the text leaves + the beat) ---- */

function renderEndcard(t) {
  const overlay = document.getElementById('endcard');
  const bot = document.getElementById('endBot');
  const word = document.getElementById('endWord');
  if (t < OUT_AT || t >= CYCLE) {
    overlay.style.display = 'none';
    return;
  }
  overlay.style.display = '';
  const s = t - OUT_AT;

  // the frame-level arrival: the end card animates IN per the transition
  // (for sim transitions it arrives while the card layer leaves — the two
  // frames tile, never overlap)
  const inDur = X.inDur || X.d;
  const q = easeInOutSine(inP(s, inDur));
  overlay.style.opacity = '1';
  overlay.style.transform = 'none';
  overlay.style.filter = 'none';
  overlay.style.zIndex = X === TRX['slide-over'] ? '7' : '';
  if (X.in) X.in(overlay, q);

  // the lockup is the 1080-frame tabs-chaos end card scaled to this stage
  const stage = overlay.getBoundingClientRect();
  const k = stage.height / 1080;
  overlay.style.setProperty('--k', k.toFixed(4));
  const gap = LOGO_GAP * k;

  // the mark lands centre-screen, then the whole lockup (mark + words,
  // measured as one unit) drifts into a centered rest position
  const shift = X.snap ? 1 : easeOutQuint(clamp((s - DRIFT_AT) / 1.0, 0, 1));
  const w = bot.offsetWidth, h = bot.offsetHeight;
  const wordW = word.offsetWidth;
  const midY = stage.height / 2;
  // 1:1 and 4:5 frames (the gallery's ratio pick, assets/ar.js): the words sit under the mark
  const stacked = stage.width / stage.height < 1.2;
  overlay.classList.toggle('stacked', stacked);
  let logoX, logoY = midY, wordX, wordY = 0; // wordY: the words' offset from their own top:50% anchor
  if (stacked) {
    const top = (stage.height - (h + gap + word.offsetHeight)) / 2;
    logoX = stage.width / 2;
    logoY = midY + (top + h / 2 - midY) * shift;
    wordX = (stage.width - wordW) / 2;
    wordY = top + h + gap - midY;
  } else {
    const total = w + gap + wordW;
    const left = (stage.width - total) / 2;
    logoX = stage.width / 2 + (left + w / 2 - stage.width / 2) * shift;
    wordX = left + w + gap;
  }
  const baseBotTransform =
    `translate(${(logoX - w / 2).toFixed(1)}px, ${(logoY - h / 2).toFixed(1)}px)`;
  bot.style.transform = baseBotTransform;
  if (X.botFx) X.botFx(s, bot, baseBotTransform);
  word.style.opacity = shift.toFixed(3);
  word.style.filter = shift < 1 ? `blur(${(6 * (1 - shift)).toFixed(1)}px)` : 'none';
  word.style.transform =
    `translate(${(wordX + 20 * (1 - shift)).toFixed(1)}px, ${stacked ? wordY.toFixed(1) + 'px' : '-50%'})`;
  if (X.wordFx) X.wordFx(s, word, shift);

  // the tag rides the same drift as the words: same x, one line below them
  // (24px gap — clears the tagline's descender room)
  if (TAG_TEXT) {
    tag.style.opacity = shift.toFixed(3);
    tag.style.filter = shift < 1 ? `blur(${(6 * (1 - shift)).toFixed(1)}px)` : 'none';
    const tagX = stacked ? (stage.width - tag.offsetWidth) / 2 : wordX;
    const tagY = stacked ? midY + wordY + word.offsetHeight + 24 : midY + word.offsetHeight / 2 + 24;
    tag.style.transform =
      `translate(${(tagX + 20 * (1 - shift)).toFixed(1)}px, ${tagY.toFixed(1)}px)`;
  }
}

/* ---- driving ---- */

function render(t) {
  renderChat(t);
  renderCards(t);
  renderEndcard(t);
  renderChrome(t);
}

const urlT = new URLSearchParams(location.search).get('t');

/* review window: when a transition is selected (?tr=…, as variants.html
   always does), the show plays ONLY the part that is the transition — the
   "AND YOU LIKE THAT?" card appearing, its leave, and the outro arriving
   — looping that window alone. No chat scene, no first card, nothing after
   the settle. The full spot still plays with no ?tr. */
const PART_ONLY = !!Q.get('tr');
const LOOP_AT = PART_ONLY ? CARD2_AT - 0.35 : 0;     // a beat of pure black, then the card pops
const LOOP_END = PART_ONLY ? OUT_AT + 1.6 : CYCLE;   // hold the arrival briefly, then loop

/* the wordmark tag (pros/getreal variants): text set once, revealed with the
   wordmark's own shift */
const tag = document.getElementById('endTag');
if (TAG_TEXT) {
  tag.textContent = TAG_TEXT;
  tag.classList.toggle('italic', VARIANT === 'pros' || VARIANT === 'emailpros');   // quoted line reads as a pull-quote
  tag.classList.toggle('long', TAG_TEXT.length > 16);      // longer subline sits a step smaller
} else tag.style.display = 'none';

let t0 = performance.now();

if (urlT !== null) {
  let t = clamp(parseFloat(urlT) || 0, 0, CYCLE);
  document.body.classList.add('freeze');
  render(t);
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') { t = clamp(t + 0.25, 0, CYCLE); render(t); }
    if (ev.key === 'ArrowLeft')  { t = clamp(t - 0.25, 0, CYCLE); render(t); }
  });
} else {
  function tick(now) {
    let t = LOOP_AT + ((now - t0) / 1000) * SPEED;
    if (t >= LOOP_END) { t0 = now; t = LOOP_AT; }
    render(t);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// the recorder contract (same as the previous animation)
window.__V7 = { CYCLE, SPEED };
window.__V7.restart = () => { t0 = performance.now(); };
