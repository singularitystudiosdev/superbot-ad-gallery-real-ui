// The pitch, "is mayonnaise an instrument" — a deterministic seekable render.
// Scene 1: Patrick asks "Is mayonnaise an instrument?" with the ChatGPT icon
// on his head (clip-gpt.mp4, the icon composited offline from hand
// keyframes; the last Patrick frame is held under the tail of the line, the
// episode cuts to Squidward mid-word). Scene 2: the ChatGPT-like screen
// (favorite-color's copy of the reference) is asked the same, streams an
// opener, then a tirade about organology and emulsions that never stops and
// keeps speeding up, the text wall fills the frame, and the camera flies
// down through it under a motion blur. Scene 3: the same clip, the superbot
// icon on his head (clip-sb.mp4). Scene 4: the same frontend re-skinned in
// blue, pink and purple answers "No." and the camera punches in on it.
// Scene 5: Stop burning tokens. Scene 6: the superbot.gg end card.
// render(t) rebuilds every scene from t, so ?t=SECONDS freeze-frames exactly;
// the clips seek to their offset in freeze mode and play in real time live.

const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };

const SPEED = 1;                  // real time: the clips carry their own clock

/* ---- scene 1: "is mayonnaise an instrument?" (ChatGPT) ---- */
const CLIP_LEN = 2.68;            // 0.20 to 2.88 of the source (the shot holds from 2.46; Squidward's "No" starts at 3.00)
const A_AT = 0, A_END = A_AT + CLIP_LEN;

/* ---- scene 2: the ChatGPT take ---- */
const GPT_AT = A_END;                              // the hard cut
const TYPE_AT = GPT_AT + 0.4, TYPE_DUR = 0.8;      // "Is mayonnaise an instrument?" (faster, user ask)
// the text types with ceil, so the last character lands at at + dur*(n-1)/n
const lastCharAt = (at, dur, n) => at + dur * (n - 1) / n;
const Q_TEXT = 'Is mayonnaise an instrument?';
const SEND_GAP = 0.1;                             // the send lands 100ms after the last key
// the send: the user bubble pops AND the bar clears on this one frame (user ask)
const USER_MSG_AT = lastCharAt(TYPE_AT, TYPE_DUR, Q_TEXT.length) + SEND_GAP;
const THINK_AT = USER_MSG_AT + 0.15, THINK_LEN = 0.8;
const RESP_AT = THINK_AT + THINK_LEN, RESP_DUR = 1.1;   // the opener streams
const TIRADE_AT = RESP_AT + 1.2;                        // the tirade begins...
const TIRADE_END = TIRADE_AT + 4.2;                     // ...and never stops until the fly-down
const TIRADE_V0 = 90;                                   // chars/s at the start
const TIRADE_K = 1.0;                                   // accelerating e^{kt}
const TIRADE = " To answer properly I want to be careful about both halves of the question, because mayonnaise and instrument are each doing more work than they look like they are doing. Start with instrument. The field that classifies musical instruments is called organology, and its standard scheme is the Hornbostel-Sachs system from 1914, which sorts instruments by how they produce sound: idiophones, where the body itself vibrates, like a xylophone or a triangle; membranophones, where a stretched skin vibrates, like a drum; chordophones, where a string vibrates, like a violin or a guitar; aerophones, where a column of air vibrates, like a trumpet or a flute; and, added later, electrophones, where the sound is generated or shaped electronically, like a synthesizer. So the honest question is whether a jar of mayonnaise fits any of those five categories. Let us go through them. Idiophone: could mayonnaise vibrate as a body and produce a pitched or unpitched tone? Mayonnaise is a viscous emulsion, not a rigid solid, so it does not ring, but it can be slapped, squelched or stirred, and a squelch is technically a sound. Whether a squelch is music is a question for John Cage, who wrote a piece consisting of four minutes and thirty-three seconds of the performer not playing, and who would probably say yes. Membranophone: no membrane, unless you count the skin that forms on the surface of an open jar, which is thin and not stretched over a resonator. Chordophone: no strings, though I suppose you could dip a string in mayonnaise, which would change its mass and therefore its pitch, so mayonnaise could be a modifier of a chordophone, the way a mute modifies a trumpet, and modifiers are not instruments but they are accessories to instruments, which is an interesting middle category. Aerophone: mayonnaise does not have a column of air, but the jar it comes in does, and blowing across the mouth of an empty mayonnaise jar produces a note, in exactly the way blowing across a bottle does, so an empty mayonnaise jar is arguably a vessel flute, which is an aerophone. The question then becomes whether we are asking about the mayonnaise or the jar. Electrophone: a jar of mayonnaise contains water, salt, lecithin from egg yolk and acid from vinegar or lemon juice, which means it conducts electricity, which means it could in principle be wired as a resistive element in a circuit that controls an oscillator, at which point the mayonnaise is a component of an electrophone. People have done this with fruit. Nobody, to my knowledge, has published a mayonnaise theremin, but I would not rule it out. Now the other half. Mayonnaise is an emulsion of oil in water, stabilized by lecithin, typically made from egg yolk, oil, an acid and salt, and its defining physical property is that it is a non-Newtonian fluid, which means its viscosity changes under stress. It is a Bingham plastic, roughly: it holds its shape at rest and flows when pushed. That matters acoustically, because a material that changes stiffness with force will change its response to a mallet, which is the beginning of a percussion instrument with a variable timbre. I am not saying it is a good one. I am saying the door is not fully closed. Historically, the question has a serious answer and a famous one. The serious answer is that instrument-makers have used food and food-adjacent materials for a long time: gourds for resonators, gut for strings, animal skin for drumheads, beeswax for sealing, rice inside shakers, and, in the case of the carrot clarinet, an actual vegetable, played on stage by a man in Vienna. The famous answer is that the question was asked by Patrick Star to Squidward Tentacles in the SpongeBob SquarePants episode Band Geeks, from 2001, and the reply was no, followed by a second question about horseradish, which also received a no. That clip is the reason you are asking, I suspect, and I want to honor both the question and its context. So: in the Hornbostel-Sachs sense, mayonnaise as a substance is not an instrument, but a jar of it is a vessel aerophone, a bowl of it is a marginal idiophone, and a wire through it is a component of an electrophone. In the everyday sense, the sense in which a band director would let you sit in the brass section, no, mayonnaise is not an instrument, and neither is horseradish. In the broadest sense, the sense in which anything that makes a sound on purpose can be music, the answer depends on intent, and intent is not something I can see from here. Let me also consider what an instrument is outside music, because the word is not only musical. A surgical instrument is a tool. A financial instrument is a contract, a bond or a derivative. A legal instrument is a document. A scientific instrument is a measuring device. Mayonnaise is none of those, though it has been used as a financial instrument in the loose sense that a fifty-five-gallon drum of it has a commodity price, and it has been used as a scientific instrument in the loose sense that food scientists measure emulsion stability with it. I mention this because a complete answer should not assume the musical sense without asking, and you did not specify. There is also a linguistic point. In some languages, instrument and tool are the same word, and in those languages the question becomes whether mayonnaise is a tool, which it is, for making sandwiches. In English we keep the words apart, and the musical sense is the one the SpongeBob clip relies on, so I will assume that is what you meant, while noting the assumption. And I want to say something about why this question is funny, because that is part of answering it. It is funny because it takes the form of a sincere question and applies it to a category error, and because Patrick asks it with total confidence in a room full of people holding real instruments, and because Squidward answers it seriously, which is what I am doing right now, which is either a tribute or a symptom. Comedy theorists call this incongruity resolution: the joke sets up a mismatch and the listener resolves it. The resolution here is that mayonnaise is not an instrument, and the extra beat with horseradish shows that Patrick has not resolved it, and will not, and that is the whole bit. So, to summarize, and I am aware this has become long: mayonnaise is not a musical instrument in the ordinary sense; a jar of it can be played as a vessel flute; it could be part of an electronic instrument with some wiring; it is a tool in the culinary sense; it is not a financial or legal instrument; the question comes from Band Geeks, 2001; the canonical answer is no; horseradish is also not an instrument; and if you would like, I can go deeper on any of these, or on the physics of emulsions, or the history of the carrot clarinet, or draft a short scene in which Patrick asks a third question, and I can keep going, and the list of things that are not instruments is very long, and I have only started it, and…";

/* ---- the fly-down: the whole transition into the second clip ---- */
const FLY_AT = TIRADE_END, FLY_LEN = num('fly', 0.9);
const FLY_ACCEL = 3.2;
const SETTLE_LEN = 0.45;                    // the blur clears over the arriving clip
const B_AT = FLY_AT + FLY_LEN + 0.1;        // the cut lands near the blur peak
const WALL_AT = TIRADE_AT + (TIRADE_END - TIRADE_AT) * 0.5;

/* ---- scene 3: "is mayonnaise an instrument?" (superbot) ---- */
const B_END = B_AT + CLIP_LEN;

/* ---- scene 4: the superbot take ---- */
const SB_AT = B_END;                                   // the hard cut
const SB_TYPE_AT = SB_AT + 0.4, SB_TYPE_DUR = 0.8; // faster, same as take 1
const SB_MSG_AT = lastCharAt(SB_TYPE_AT, SB_TYPE_DUR, Q_TEXT.length) + SEND_GAP;
const SB_THINK_AT = SB_MSG_AT + 0.15, SB_THINK_LEN = 0.6;
const ANSWER_AT = SB_THINK_AT + SB_THINK_LEN, ANSWER_DUR = 0.25;   // "No."
/* the answer emphasis: a beat after the answer lands the camera punches in
   on the sentence, holds, and relaxes before the cut */
const EMPH_DELAY = num('delay', 0.8);
const EMPH_IN = 0.28, EMPH_HOLD = num('hold', 1.1), EMPH_OUT = 0.45;
// the punch-in depth per frame: the sentence must still fit the width
const EMPH_MAX = num('emph', { '16x9': 7, '4x3': 6, '1x1': 5, '4x5': 4.5 }[window.AR ? window.AR.key : '16x9'] || 7);   // a one-word answer: the favorite-color "Black." punch
const EMPH_END = ANSWER_AT + ANSWER_DUR + EMPH_DELAY + EMPH_IN + EMPH_HOLD + EMPH_OUT;

/* ---- scene 5: stop burning tokens. ---- */
const SIMPLE_AT = EMPH_END + 0.35;

/* ---- scene 6: the superbot.gg end card ---- */
const END_AT = SIMPLE_AT + 1.7;
const DRIFT_AT = 0.7;
const LOGO_GAP = 44;
const END_LEN = 4.8;
const CYCLE = END_AT + END_LEN + 1.8;
window.CYCLE = CYCLE;

const OPENER = "Great question! It sounds silly, but it actually touches on how we define an instrument at all.";
const ANSWER = "No.";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOutQuint = (p) => 1 - Math.pow(1 - p, 5);
const easeOutBack = (p) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);
const easeInOutSine = (p) => -(Math.cos(Math.PI * p) - 1) / 2;
const inP = (p, dur) => clamp(p / dur, 0, 1);

/* ---- the stage: a 720-high design frame scaled to fill the viewport ---- */
const STAGE_H = 720;
const stageEl = document.querySelector('.stage');
let K = 1;
function fitStage() {
  const ar = window.AR ? window.AR.ratio : 16 / 9;
  const w = Math.round(STAGE_H * ar);
  K = Math.min(innerWidth / w, innerHeight / STAGE_H);
  document.documentElement.style.setProperty('--stage-w', w + 'px');
  document.documentElement.style.setProperty('--stage-k', K.toFixed(5));
}
fitStage();
addEventListener('resize', fitStage);
addEventListener('archange', fitStage);
if (window.self !== window.top || Q.get('ar') !== null) document.body.classList.add('embedded');

/* ---- chrome: the loop veil ---- */
function renderChrome(t) {
  const veil = document.getElementById('veil');
  let v = 0;
  if (t < 0.3) v = 1 - t / 0.3;
  if (t > CYCLE - 1.8) v = clamp((t - (CYCLE - 1.8)) / 1.4, 0, 1);
  veil.style.opacity = v.toFixed(3);
}

/* ---- the clips: real-time playback live, a seek in freeze mode ---- */
const FREEZE = Q.get('t') !== null;
const clips = [
  { box: document.getElementById('clipA'), vid: document.getElementById('vidA'), at: A_AT, end: A_END, started: false },
  { box: document.getElementById('clipB'), vid: document.getElementById('vidB'), at: B_AT, end: B_END, started: false },
];
// sound: the clips try to play unmuted; a browser that refuses (no user
// activation in this document: Safari, or Chrome before a click) gets a muted
// fallback and the "tap for sound" pill, and the first gesture anywhere in the
// frame (or a click in the gallery, forwarded as a message) unmutes. Renders
// (top-level, ?ar=) never show the pill.
const EMBEDDED = window.self !== window.top;
const soundHint = document.getElementById('soundHint');
let soundOn = null;   // null = not tried yet, true = playing with sound, false = muted fallback
function setSound(on) {
  soundOn = on;
  if (soundHint) soundHint.style.display = (on === false && EMBEDDED && !FREEZE) ? '' : 'none';
}
function playClip(c) {
  c.vid.currentTime = 0;
  c.vid.muted = soundOn === false;
  const p = c.vid.play();
  if (!p) return;
  p.then(() => { if (!c.vid.muted) setSound(true); })
   .catch(() => { c.vid.muted = true; setSound(false); c.vid.play().catch(() => {}); });
}
function unmute() {
  if (soundOn === true) return;
  for (const c of clips) c.vid.muted = false;
  const live = clips.find(c => c.started && !c.vid.paused);
  if (!live) { setSound(true); return; }
  live.vid.play().then(() => setSound(true)).catch(() => { for (const c of clips) c.vid.muted = true; setSound(false); });
}
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, unmute, { passive: true });
window.addEventListener('message', (e) => { if (e.data && e.data.type === 'unmute') unmute(); });
function renderClips(t, wrapped) {
  for (const c of clips) {
    if (wrapped) c.started = false;
    const live = t >= c.at && t < c.end + 0.05;
    c.box.style.display = live ? 'block' : 'none';
    if (!live) {
      if (c.started && !c.vid.paused) c.vid.pause();
      if (t < c.at) c.started = false;
      continue;
    }
    const off = clamp(t - c.at, 0, CLIP_LEN - 0.001);
    if (FREEZE) {
      if (Math.abs(c.vid.currentTime - off) > 0.02) c.vid.currentTime = off;
    } else if (!c.started) {
      c.started = true;
      playClip(c);
    } else if (Math.abs(c.vid.currentTime - off) > 0.18 && c.vid.readyState >= 2) {
      c.vid.currentTime = off;   // resync if the decoder drifted
    }
    // the arriving second clip clears from under the fly-down's blur
    let blur = 0;
    if (c.at === B_AT && t < B_AT + SETTLE_LEN) blur = 8 * (1 - easeOutQuint(inP(t - B_AT, SETTLE_LEN)));
    c.box.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  }
}

/* ---- the accelerating tirade: chars(u) = v0/k · (e^{ku} − 1) ---- */
const tiradeChars = (u) => Math.floor((TIRADE_V0 / TIRADE_K) * (Math.exp(TIRADE_K * Math.min(u, TIRADE_END - TIRADE_AT)) - 1));

/* ---- the chat interface ---- */
function renderChat(t) {
  const chat = document.getElementById('chatui');
  const head = document.getElementById('gptHead');
  const msgArea = document.getElementById('msgArea');
  const pill = document.getElementById('pill');
  const inputText = document.getElementById('inputText');
  const caret = document.getElementById('caret');
  const placeholder = document.getElementById('placeholder');
  const msgUser = document.getElementById('msgUser');
  const msgAi = document.getElementById('msgAi');
  const dots = document.getElementById('typingDots');
  const suggestions = document.getElementById('suggestions');
  const gptLive = t >= GPT_AT && t < B_AT;
  const sbTake = t >= SB_AT && t < SIMPLE_AT + 0.6;
  const live = gptLive || sbTake;
  chat.style.display = live ? '' : 'none';
  chat.classList.toggle('sb', sbTake);
  if (!live) return;

  const typeAt = sbTake ? SB_TYPE_AT : TYPE_AT;
  const typeDur = sbTake ? SB_TYPE_DUR : TYPE_DUR;
  const msgAt = sbTake ? SB_MSG_AT : USER_MSG_AT;
  const thinkAt = sbTake ? SB_THINK_AT : THINK_AT;
  const thinkLen = sbTake ? SB_THINK_LEN : THINK_LEN;
  const respAt = sbTake ? ANSWER_AT : RESP_AT;

  // during the fly-down the pill gets out of the way
  pill.style.opacity = !sbTake && t >= FLY_AT ? clamp(1 - (t - FLY_AT) / 0.35, 0, 1).toFixed(3) : '1';

  // home state (greeting, composer, suggestions) until the message pops
  const convo = t >= msgAt;
  chat.classList.toggle('home', !convo);
  head.style.opacity = convo ? '0' : '1';
  head.style.filter = convo ? 'blur(3px)' : 'none';
  suggestions.style.display = convo ? 'none' : '';

  // the composer text: the question types, and the bar clears the moment the
  // message pops into the thread (both takes; the real frontend empties the
  // composer on send)
  let txt = Q_TEXT.slice(0, Math.ceil(inP(t - typeAt, typeDur) * Q_TEXT.length));
  if (t >= msgAt) txt = '';
  inputText.textContent = txt;
  placeholder.style.display = txt.length === 0 ? '' : 'none';
  caret.style.opacity = (Math.floor(t * 2.6) % 2 === 0 ? 1 : 0.15).toFixed(2);
  caret.style.display = txt.length > 0 ? '' : 'none';

  // the message area
  const mp = t - msgAt;
  msgUser.textContent = Q_TEXT;
  msgUser.style.opacity = mp > 0 ? inP(mp, 0.18).toFixed(3) : '0';
  msgUser.style.transform = mp > 0 ? `scale(${(0.94 + 0.06 * easeOutBack(inP(mp, 0.28))).toFixed(3)})` : 'none';
  const think = t - thinkAt;
  const thinking = think > 0 && think < thinkLen;
  dots.style.display = thinking ? 'flex' : 'none';
  dots.querySelectorAll('i').forEach((d, i) => {
    d.style.opacity = (0.3 + 0.7 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2);
    d.style.transform = `translateY(${(-3 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2)}px)`;
  });

  // the response: opener + the accelerating tirade (take 1), the one-line
  // answer (take 2)
  const fp = t - FLY_AT;
  const inDesc = !sbTake && fp >= 0 && fp < FLY_LEN;
  const rsp = t - respAt;
  if (rsp <= 0) {
    msgAi.textContent = '';
    msgAi.style.opacity = '0';
    msgArea.scrollTop = 0;
  } else if (sbTake) {
    msgAi.textContent = ANSWER.slice(0, Math.ceil(inP(rsp, ANSWER_DUR) * ANSWER.length));
    msgAi.style.opacity = '1';
    msgArea.scrollTop = 0;
  } else {
    const streaming = t < TIRADE_END + 0.01;
    msgAi.textContent = t < TIRADE_AT
      ? OPENER.slice(0, Math.ceil(inP(rsp, RESP_DUR) * OPENER.length))
      : OPENER + TIRADE.slice(0, t < TIRADE_END ? Math.min(TIRADE.length, tiradeChars(t - TIRADE_AT)) : TIRADE.length);
    msgAi.style.opacity = '1';
    if (!inDesc) msgArea.scrollTop = streaming ? 1e6 : 1e6;
  }

  // the text wall: the streaming block grows until it fills the frame and
  // pushes the composer off-screen; it holds through the fly-down
  const wallP = sbTake || t <= WALL_AT ? 0 : Math.pow(inP(t - WALL_AT, TIRADE_END - WALL_AT), 1.5);
  if (wallP > 0) {
    msgArea.style.flex = `0 0 ${(56 + 44 * wallP).toFixed(1)}%`;
    msgArea.style.maxHeight = 'none';
    chat.style.justifyContent = wallP >= 1 ? 'flex-start' : '';
    chat.style.paddingBottom = wallP >= 1 ? '0px' : '';
  } else {
    msgArea.style.flex = '';
    msgArea.style.maxHeight = '';
    chat.style.justifyContent = '';
    chat.style.paddingBottom = '';
  }

  // the fly-down: 0.9s of accelerating descent, the text flying up past the
  // camera, the blur riding the descent into the cut
  if (inDesc) {
    const fly = Math.pow(inP(fp, FLY_LEN), FLY_ACCEL);
    const streamed = OPENER.length + tiradeChars(FLY_AT - TIRADE_AT);
    const full = msgArea.scrollHeight - msgArea.clientHeight;
    const start = Math.max(0, full * streamed / (OPENER.length + TIRADE.length));
    msgArea.scrollTop = (start + (full - start) * fly).toFixed(1);
  }
  if (!sbTake && fp >= 0) {
    const smear = fp < FLY_LEN ? 3.2 * Math.pow(inP(fp, FLY_LEN), 2) : 3.2 + 5.8 * inP(fp - FLY_LEN, 0.1);
    chat.style.filter = `blur(${smear.toFixed(2)}px)`;
  } else {
    chat.style.filter = 'none';
  }

  // the answer emphasis: the camera punches in on the sentence, its centre
  // solved to land at the frame's centre at full zoom
  chat.style.transform = 'none';
  const empStart = ANSWER_AT + ANSWER_DUR + EMPH_DELAY;
  if (sbTake && t >= empStart && t < EMPH_END) {
    const e = t < empStart + EMPH_IN ? easeOutQuint(inP(t - empStart, EMPH_IN))
      : t < empStart + EMPH_IN + EMPH_HOLD ? 1
      : 1 - easeInOutSine(inP(t - empStart - EMPH_IN - EMPH_HOLD, EMPH_OUT));
    const range = document.createRange();
    range.selectNodeContents(msgAi);
    const ar = range.getBoundingClientRect();
    const cr = chat.getBoundingClientRect();
    const px = ar.left + ar.width / 2 - cr.left;
    const py = ar.top + ar.height / 2 - cr.top;
    const ox = (cr.width / 2 - EMPH_MAX * px) / (1 - EMPH_MAX) / K;
    const oy = (cr.height / 2 - EMPH_MAX * py) / (1 - EMPH_MAX) / K;
    chat.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
    chat.style.transform = `scale(${(1 + (EMPH_MAX - 1) * e).toFixed(4)})`;
    const dim = 1 - e;
    pill.style.opacity = dim.toFixed(3);
    msgUser.style.opacity = (parseFloat(msgUser.style.opacity || '1') * dim).toFixed(3);
  } else {
    chat.style.transformOrigin = '';
  }
}

/* ---- stop burning tokens. ---- */
function renderSimple(t) {
  const simple = document.getElementById('simple');
  if (t < SIMPLE_AT || t >= END_AT) {
    simple.style.opacity = '0';
    return;
  }
  const s = t - SIMPLE_AT;
  simple.style.opacity = easeOutQuint(clamp(s / 0.35, 0, 1)).toFixed(3);
  simple.style.transform = `scale(${(0.92 + 0.08 * easeOutBack(inP(s, 0.5))).toFixed(3)})`;
  simple.style.filter = s < 0.4 ? `blur(${(5 * (1 - inP(s, 0.4))).toFixed(2)}px)` : 'none';
}

// the live beta.superbot.gg mascot, mounted once into the old face's box
{ const m = window.sbMarkLive(document.getElementById('endBot'), { size: 220 }); m.svg.style.width = m.svg.style.height = '100%'; }

/* ---- the end card: the superbot.gg lockup ---- */
function renderEndcard(t) {
  const overlay = document.getElementById('endcard');
  const bot = document.getElementById('endBot');
  const word = document.getElementById('endWord');
  if (t < END_AT || t >= CYCLE) {
    overlay.style.display = 'none';
    return;
  }
  overlay.style.display = '';
  const s = t - END_AT;
  overlay.style.opacity = easeOutQuint(clamp(s / 0.5, 0, 1)).toFixed(3);
  const stage = { width: overlay.offsetWidth, height: overlay.offsetHeight };   // layout px (the stage is scaled by --k)
  const k = stage.height / 1080;
  overlay.style.setProperty('--k', k.toFixed(4));
  const gap = LOGO_GAP * k;
  const shift = easeOutQuint(clamp((s - DRIFT_AT) / 1.0, 0, 1));
  const w = bot.offsetWidth, h = bot.offsetHeight;
  const wordW = word.offsetWidth;
  const midY = stage.height / 2;
  word.style.opacity = shift.toFixed(3);
  word.style.filter = shift < 1 ? `blur(${(6 * (1 - shift)).toFixed(1)}px)` : 'none';
  const stacked = stage.width / stage.height < 1.2;
  overlay.classList.toggle('stacked', stacked);
  if (stacked) {
    const wordH = word.offsetHeight;
    const top = (stage.height - (h + gap + wordH)) / 2;
    const logoY = midY + (top + h / 2 - midY) * shift;
    bot.style.transform = `translate(${((stage.width - w) / 2).toFixed(1)}px, ${(logoY - h / 2).toFixed(1)}px)`;
    word.style.transform = `translate(${((stage.width - wordW) / 2).toFixed(1)}px, ${(top + h + gap - midY + 20 * (1 - shift)).toFixed(1)}px)`;
    return;
  }
  const total = w + gap + wordW;
  const left = (stage.width - total) / 2;
  const logoX = stage.width / 2 + (left + w / 2 - stage.width / 2) * shift;
  bot.style.transform = `translate(${(logoX - w / 2).toFixed(1)}px, ${(midY - h / 2).toFixed(1)}px)`;
  word.style.transform = `translate(${(left + w + gap + 20 * (1 - shift)).toFixed(1)}px, -50%)`;
}

/* ---- driving ---- */
let lastT = -1;
function render(t) {
  const wrapped = t < lastT;
  lastT = t;
  renderClips(t, wrapped);
  renderChat(t);
  renderSimple(t);
  renderEndcard(t);
  renderChrome(t);
}

const urlT = Q.get('t');
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
  // the clock starts once both clips can play through (capped at 6s on a cold
  // load from the network), so the first frame of scene 1 is the clip, not a
  // black decoder, and the sound starts with the picture
  const ready = () => clips.every(c => c.vid.readyState >= 3);
  const armed = performance.now();
  function tick(now) {
    if (t0 === null) {
      if (ready() || now - armed > 6000) t0 = now;
      else { requestAnimationFrame(tick); return; }
    }
    let t = ((now - t0) / 1000) * SPEED;
    if (t >= CYCLE) { t0 = now; t = 0; }
    render(t);
    requestAnimationFrame(tick);
  }
  t0 = null;
  render(0);
  requestAnimationFrame(tick);
}

// the recorder contract
window.__V7 = { CYCLE, SPEED };
window.__V7.restart = () => { t0 = performance.now(); lastT = -1; };
