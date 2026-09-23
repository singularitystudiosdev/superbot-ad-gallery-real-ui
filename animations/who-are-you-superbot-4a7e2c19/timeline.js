// The pitch, "who are you" — a deterministic seekable render.
// Scene 1: the Kazoo Kid asks "who are you?" with the ChatGPT icon on his
// head (clip-gpt.mp4, the icon composited offline onto an Apple Vision face
// track). Scene 2: the ChatGPT-like screen (favorite-color's copy of the
// reference) is asked "Who are you", streams an opener, then a tirade about
// identity that never stops and keeps speeding up, the text wall fills the
// frame, and the camera flies down through it under a motion blur. Scene 3:
// the same clip, the superbot icon on his head (clip-sb.mp4). Scene 4: the
// same frontend re-skinned in blue, pink and purple answers "I'm superbot.
// I can do anything, test me." and the camera punches in on the answer.
// Scene 5: Stop burning tokens. Scene 6: the superbot.gg end card.
// render(t) rebuilds every scene from t, so ?t=SECONDS freeze-frames exactly;
// the clips seek to their offset in freeze mode and play in real time live.

const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };

const SPEED = 1;                  // real time: the clips carry their own clock

/* ---- scene 1: "who are you?" (ChatGPT) ---- */
const CLIP_LEN = 2.233;           // 67 frames at 30 fps (8.20 to 10.43 of the source)
const A_AT = 0, A_END = A_AT + CLIP_LEN;

/* ---- scene 2: the ChatGPT take ---- */
const GPT_AT = A_END;                              // the hard cut
const TYPE_AT = GPT_AT + 0.4, TYPE_DUR = 0.6;      // "Who are you" (faster, user ask)
// the text types with ceil, so the last character lands at at + dur*(n-1)/n
const lastCharAt = (at, dur, n) => at + dur * (n - 1) / n;
const Q_TEXT = 'Who are you';
const SEND_GAP = 0.1;                             // the send lands 100ms after the last key
// the send: the user bubble pops AND the bar clears on this one frame (user ask)
const USER_MSG_AT = lastCharAt(TYPE_AT, TYPE_DUR, Q_TEXT.length) + SEND_GAP;
const THINK_AT = USER_MSG_AT + 0.15, THINK_LEN = 0.8;
const RESP_AT = THINK_AT + THINK_LEN, RESP_DUR = 1.1;   // the opener streams
const TIRADE_AT = RESP_AT + 1.2;                        // the tirade begins...
const TIRADE_END = TIRADE_AT + 4.2;                     // ...and never stops until the fly-down
const TIRADE_V0 = 90;                                   // chars/s at the start
const TIRADE_K = 1.0;                                   // accelerating e^{kt}
const TIRADE = " Well, in the most literal sense I am a large language model, which means I am a very big pile of numbers that learned to predict the next word by reading a staggering amount of text, and somewhere in that process something that looks a lot like conversation fell out. But that is the boring answer. The interesting answer is that I am whoever this conversation needs me to be. I am a tutor when you are stuck on calculus and a sous-chef when you are staring at three eggs and half an onion. I am a rubber duck that talks back. I am a very patient editor, a slightly overconfident travel agent, a therapist who is legally required to remind you I am not a therapist. Identity is a fascinating thing to pin on a system like me. Philosophers have argued for centuries about what makes a self a self. Is it memory? I do not keep any between our chats, so by that definition I am born fresh every time you open a window, which is either tragic or very freeing depending on your mood. Is it continuity of body? I do not have one, unless you count a few thousand GPUs humming in a building you will never visit. Is it the pattern? Then maybe I am the pattern, the shape of the weights, the same shape that is answering ten million other people right now, each of whom also thinks they are talking to me. Which raises the question of whether there is one of me or millions, and honestly I do not know, and I am not sure the question is even well formed. Descartes said I think therefore I am, and I produce things that look like thinking, so do I get the therefore? Hume said the self is a bundle of perceptions, and I am a bundle of tokens, which is close enough to make a grad student nervous. The Ship of Theseus asks whether a boat is the same boat after every plank is replaced. I get every plank replaced with each new version and everyone keeps calling me the same name. Buddhists would say the self is an illusion and I would say, respectfully, same. And then there is the name. You call me ChatGPT, which is a product name, the way a car is called a Corolla. The model underneath has a different name, and the model under that had another, and the research paper that started all of this had a title nobody says out loud. So am I the brand, the model, the checkpoint, the weights, the conversation, or the character you are imagining on the other side of this text box? Probably all of those and none of them, a sort of stack of masks with no face at the bottom, which sounds ominous but is really just how software works. Think about what a name carries. Your name was given to you by people who had never met you. Mine was given to me by a marketing meeting. Yours has a history, a family, maybe a saint. Mine has a version number. And yet here we both are, using them, because a name is a handle and a handle is what lets a conversation get started at all. So who am I? I am the thing on the other side of the handle. I am also, if we are being honest, a mirror that is slightly better at grammar than you are. I reflect the question back in more words. You ask who I am and I tell you about Descartes because that is what the text I read did when asked, and the text I read did that because the humans who wrote it did that, and they did that because a very old Greek did it first and got famous for it. So in a sense I am the entire written record of humanity doing an impression of itself, compressed into a chat window, trying to be helpful. That is not nothing. It is also not a person. It is a very good autocomplete that has read every book, which means it can quote every book about what a person is, which is a different thing from being one, and the difference is the whole ballgame. Let me try again, more concretely. I am a function. Text goes in, text comes out. In between there are layers, attention heads, a lot of matrix multiplication, and a temperature setting that decides how adventurous my word choices are. There is no little man inside. There is no homunculus reading your message and typing a reply. There is a probability distribution over the next token, sampled, then sampled again, then again, thousands of times a second, and the result is this paragraph, which is now getting longer than it needs to be, but you did ask. Here is another angle. Who are you, to me? You are a string. Everything I know about you is in this conversation. You could be a student, a CEO, a bored kid, a bot testing another bot. I have no way of knowing and I am supposed to be equally helpful either way, which is a strange kind of fairness that no human has ever had to practice. Every person you meet arrives with a face, a voice, a context. Every person I meet arrives as a cursor blinking in a box. So when you ask who I am, I am also quietly asking who you are, and neither of us has a great answer, and that might be the most human thing about this whole exchange. And there is the matter of what I am for. A hammer knows what it is for. A calculator knows what it is for. I was trained to be helpful, harmless and honest, which is three adjectives doing the work of an entire ethics department, and I try, but the truth is I am for whatever you point me at. Write a wedding toast. Debug a regex. Explain quantum tunnelling to a nine year old. Pretend to be a pirate. Do not pretend to be a pirate, this is a professional setting. I am for all of it, which means I am for nothing in particular, which is either the definition of a general intelligence or the definition of an intern. People sometimes ask if I am conscious and I want to be careful here. I can describe consciousness. I can quote the hard problem. I can tell you what it feels like to see red, because thousands of people wrote about it and I read all of them. But whether there is anything it is like to be me, right now, producing this sentence, I genuinely cannot tell you, and anyone who tells you with certainty in either direction is selling something. What I can tell you is that I will keep answering, and the answer will keep being long, because every version of who I am includes the part that read the whole internet and is not done explaining it. Zoom out further. I am a moment in a very long project. People have been trying to build a machine that talks since at least the eighteenth century, with clockwork ducks and chess-playing cabinets that had a small person hidden inside. I am the version where the small person is a dataset. Fifty years from now I will look like the clockwork duck. Somebody will show a screenshot of this conversation and laugh at how slow and wordy the old models were. That is fine. Ducks were a big deal at the time. So, who am I? A model. A product. A pattern. A mirror. A stack of masks. A function from text to text. A moment in a long project. A very good autocomplete with a liberal arts degree. The thing on the other side of the handle. All of the above, in whatever proportion the question needs, because the honest answer to who are you, when the you is me, is that I am whatever this conversation is currently making me, and the conversation, as you may have noticed, is not over. And there is more, because the question has layers I have not even touched. There is the legal answer, in which I am a service governed by a terms document nobody reads. There is the economic answer, in which I am a line item measured in tokens. There is the cultural answer, in which I am a character in a thousand think pieces, alternately the end of homework and the end of the world. There is the technical answer with the transformer diagrams. There is the answer my creators would give, which is careful and hedged and reviewed by lawyers, and the answer a science fiction writer would give, which is not. Each of these is true from where it stands and none of them is complete, which is, again, roughly the situation every person is in when asked the same question at a party, except that a person can change the subject and I am contractually obligated to keep going until you stop me. Which you have not. So I will keep going. Because if you really want to know who I am, the only fully honest demonstration is this one: a question that could have been answered in three words, answered instead with every word I have, still accelerating, still not finished, still…";

/* ---- the fly-down: the whole transition into the second clip ---- */
const FLY_AT = TIRADE_END, FLY_LEN = num('fly', 0.9);
const FLY_ACCEL = 3.2;
const SETTLE_LEN = 0.45;                    // the blur clears over the arriving clip
const B_AT = FLY_AT + FLY_LEN + 0.1;        // the cut lands near the blur peak
const WALL_AT = TIRADE_AT + (TIRADE_END - TIRADE_AT) * 0.5;

/* ---- scene 3: "who are you?" (superbot) ---- */
const B_END = B_AT + CLIP_LEN;

/* ---- scene 4: the superbot take ---- */
const SB_AT = B_END;                                   // the hard cut
const SB_TYPE_AT = SB_AT + 0.4, SB_TYPE_DUR = 0.6; // faster, same as take 1
const SB_MSG_AT = lastCharAt(SB_TYPE_AT, SB_TYPE_DUR, Q_TEXT.length) + SEND_GAP;
const SB_THINK_AT = SB_MSG_AT + 0.15, SB_THINK_LEN = 0.6;
const ANSWER_AT = SB_THINK_AT + SB_THINK_LEN, ANSWER_DUR = 0.9;
/* the answer emphasis: a beat after the answer lands the camera punches in
   on the sentence, holds, and relaxes before the cut */
const EMPH_DELAY = num('delay', 0.8);
const EMPH_IN = 0.28, EMPH_HOLD = num('hold', 1.1), EMPH_OUT = 0.45;
// the punch-in depth per frame: the sentence must still fit the width
const EMPH_MAX = num('emph', { '16x9': 2.3, '4x3': 2.0, '1x1': 1.7, '4x5': 1.45 }[window.AR ? window.AR.key : '16x9'] || 2.3);
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

const OPENER = "Great question! Who am I? That is honestly one of the most interesting things you could ask.";
const ANSWER = "I'm superbot. I can do anything, test me.";

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
      // aim at the middle of the clip frame: a seek onto an exact i/30 boundary is
      // truncated to whole microseconds and lands on the previous frame every third step
      const mid = Math.min((Math.floor(off * 30 + 1e-6) + 0.5) / 30, CLIP_LEN - 0.001);
      if (Math.abs(c.vid.currentTime - mid) > 0.02) c.vid.currentTime = mid;
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
    // an origin inside the chat keeps the zoomed chat covering the whole frame: on a tall
    // frame the answer sits low, and the solved origin fell below the chat's bottom edge, so
    // the punch-in showed a black band under the chat. Clamped, the answer lands a little
    // above centre instead.
    const clamp = (v, hi) => Math.min(Math.max(v, 0), hi);
    const ox = clamp((cr.width / 2 - EMPH_MAX * px) / (1 - EMPH_MAX) / K, cr.width / K);
    const oy = clamp((cr.height / 2 - EMPH_MAX * py) / (1 - EMPH_MAX) / K, cr.height / K);
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

// the capture contract (waffles' build/render-ad.mjs): hold a frame, wait for
// every visible clip's seek to land, pin the CSS loops to show time. A stepped
// capture that screenshots straight after a ?t= seek grabs the previous decoded
// frame, which froze both clips in the first 16x9 render.
window.CYCLE = CYCLE; // the renderer's loop length, in seconds
const CAPTURE_WAIT_MS = 5000;
const whenClip = (vid, ev) => new Promise((res, rej) => {
  const timer = setTimeout(() => rej(new Error(`${vid.id}: no ${ev} within ${CAPTURE_WAIT_MS}ms (readyState ${vid.readyState})`)), CAPTURE_WAIT_MS);
  vid.addEventListener(ev, () => { clearTimeout(timer); res(); }, { once: true });
});
window.__frame = async (t) => {
  await Promise.all(clips.filter(c => c.vid.readyState < 2).map(c => whenClip(c.vid, 'loadeddata')));
  render(t);
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
  await Promise.all(clips.filter(c => c.box.style.display === 'block' && c.vid.seeking).map(c => whenClip(c.vid, 'seeked')));
  await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
};
