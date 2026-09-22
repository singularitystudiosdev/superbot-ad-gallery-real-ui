// The pitch, "favorite color" — a deterministic seekable render.
// The frontend is a copy of the user's reference (retrieved 2026-09-02):
// "Ready when you are.", the Ask-anything pill (+ / Think / mic / blue voice
// button) and three suggestion rows, at the real thing's proportions in a
// 16:9 frame (user ask). The user types "whats ur favorite color" and hits
// enter (user ask: no cursor — the send is an Enter keypress), and the llm
// streams its opener — then a tirade about the options that NEVER stops and
// keeps speeding up (user ask), until the camera does a gemini-style
// fly-DOWN through the thread — text flying past as if it had all been
// typed (user ask) — and a smooth, seamless motion blur carries the frame
// back to the chat bar (user ask), which now takes "/superbot" — the previous
// animation's cmd-glow chip, ⚡ bolt and breathing glow verbatim (user ask)
// — and answers "Black." (user ask). "Stop burning tokens." Then the
// superbot.gg end card: the mark lands, then the wordmark and tagline fade
// in beside it (the tabs-chaos end sequence).
// render(t) rebuilds every scene from scratch; every effect is computed
// from t, so ?t=SECONDS freeze-frames exactly. Arrows step ±0.25s in freeze.

/* variant overrides (?key=value — variants.html compares treatments side by
   side): the emphasis depth, its hold, and the fly-down length */
const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };

const SPEED = 1.15;          // the whole show plays ~15% faster (user ask)

/* ---- scene 1: the typing + the send ---- */
const TYPE_AT = 0.4, TYPE_DUR = 1.5;   // "whats ur favorite color"
const PRESS_AT = 2.95;                 // enter is pressed (user ask: no cursor)
const USER_MSG_AT = 3.05;              // the user bubble pops into the thread
const THINK_AT = 3.2, THINK_LEN = 0.8; // the typing dots

/* ---- scene 2: the llm's answer — opener, then the accelerating tirade ---- */
const RESP_AT = 4.1, RESP_DUR = 1.1;   // the opener streams
const TIRADE_AT = 5.3;                 // the tirade begins...
const TIRADE_END = 9.5;                // ...and never stops until the fly-down
const TIRADE_V0 = 90;                  // chars/s at the start
const TIRADE_K = 1.0;                  // accelerating e^{kt} — ×2 (user ask)
// the corpus is long enough that the accelerating stream never outruns it:
// the k=1.0 curve needs ~5,980 chars by TIRADE_END, leaving ~1,800 chars of
// wall below the fold for the fly-down to travel through
const TIRADE = " Red is bold and passionate. Blue is calm and dependable. Green is balanced and natural. Yellow is pure energy. Purple is creative — regal, even. Orange is playful and warm. And each one carries its own psychology, its own history, its own cultural weight. Choosing a color is choosing a mood, a personality, an entire story. Red announces. Blue reassures. Green grounds you. Yellow shouts from the rooftops. Purple whispers in velvet. Orange cracks a joke at the dinner table. There are warm palettes and cool palettes, loud palettes and quiet ones, and every gradient between them is a different sentence you could say. Warm colors advance. Cool colors recede. Neutrals hold the door. Accent colors make the point. Think of every brand you know — you can name its color before its logo. Red for urgency, blue for trust, green for growth, yellow for cheap cheer, black for quiet money. Entire industries are color-coded: finance wears navy, tech wears gradient, fast food wears red and yellow because red makes you hungry and yellow makes you look. A palette is an argument. A single swatch is a headline. The wrong red is alarm; the right red is love. The wrong blue is corporate; the right blue is calm. Context does the heavy lifting, and context is infinite. And it never runs out: every shade has a temperature, a weight, a decade it belongs to. Harvest gold is 1970s kitchens. Millennial pink is a whole economic moment. Genoa blue is a ceiling in Italy. You could spend a life on one hue's family tree and not reach its roots. Saturation is volume. Value is lighting. Hue is the actual word being said — and the sentence never has to end, because there is always another tint, another shade, another name the industry invented last week to sell you the same gray twice. And it goes deeper than taste. Babies stare longer at red than at gray. Bulls are red-green colorblind — we picked that fight for them. Honeybees see a violet world we can barely picture, and the mantis shrimp carries twelve color receptors to our three, seeing shades no human language has ever named. Every eye is a slightly different instrument, so nobody has ever seen your favorite color — only their version of it. Artists have chased that for centuries: Turner let his whites go blinding, Rothko made whole rooms weep with two rectangles of red, Monet painted the same haystack forty times just to watch the light steal its color and hand it back. Newton split white light with a prism, then split the rainbow into seven because seven felt more complete — color science has been a little opinionated from day one. Language plays the same trick: old epics call the wine-dark sea the same word they call oxen, and cultures without a word for blue describe the sky as green. The words you own decide the colors you notice first. Somewhere in your head a synesthete is tasting this paragraph. Warm light makes warm colors louder and cool colors sulk; the same paint reads differently at noon and at midnight, by candle and by fluorescent hum. The dress was blue and black or white and gold and the whole internet chose violence over it, because color is not in the world — it is a deal between the world and your wiring. Cinematographers cool the shadows and warm the faces. Chefs know an orange plate makes sweetness taste sweeter. Marketers A/B test button colors like the company rides on it, because it does. Ten million distinguishable colors, and you will name thirty of them in your whole life. Names matter more than wavelengths: burnt sienna sells for more than brown. Fifty shades of one gray is a whole paint-store aisle. Travel changes your palette — Mediterranean towns paint their doors blue against the evil eye, and who are you to argue with a superstition that old. Seasons do the casting for you: October is a brand system, winter is a monochrome with one accent, spring ships the same collection every year and it still sells. Food is color theory you can eat — golden crust, green herb, red center — and hunger is the oldest art director there is. Memory is color-graded too: childhood summers are overexposed and warm, exam years are a desaturated blue, first loves run at slightly too much saturation. Cameras chase that feeling with LUTs and film simulations because the honest measurement was never the point. Even the words drift: orange the fruit named orange the color, not the other way around, and before that it was just red, and people managed. So yes — it is a big question wearing a small dress, and anyone who answers it in under a minute has not been paying attention. There are sunsets that make whole cities stop walking, and the sky does the best color work on earth for free, every single evening, and never repeats itself once. Auroras do it with particles. Sunsets do it with dust. The ocean does it with depth and the nerve to borrow whatever light shows up. Nature has been running the campaign longer than any brand, and every one of its palettes was mixed once, by a sky that never went to school for it. And the animals voted long before we did: the peacock chose green-blue iridescence, the poison dart frog chose warning yellow, the flamingo chose pink by diet, the chameleon chose all of them at once and made it a defense. Evolution is the oldest marketing department — every warning label in the rainforest is a color, every courtship a swatch. The deep sea went the other way and picked black, because at depth black is the only honesty available. Up here we paint our temples blue and gold, our money green, our warnings red, our brides white in one hemisphere and red in the other, and nobody has ever once agreed on why. Every language folds the spectrum differently at the green-blue seam, and two people can look at the same tile and be reading different words. Physics says the color is not even there — just a wavelength your cone cells argue about, a private settlement between light and retina signed without either party reading the terms. And still the child picks one. Usually this one, usually by next week a different one, because a five-year-old understands something the committee forgot: the question was never which wavelength is best. The question is which one feels like being you today — and that answer is allowed to change, which is the only part of this whole seminar that matters. Think about what a color can carry without saying anything. A hospital corridor is green because someone decided calm was a specification. A cockpit is gray-green because a museum curator said night vision would thank us. Prison walls once went pink because a study said it calmed the violent, and the result worked for fifteen minutes and then bounced back harder — even color has a placebo fade. Sports teams have mascots built entirely out of one hue and cities that riot over its shade. There is a blue so rare the pigment was worth more than gold, and painters went broke buying it, and when chemistry finally made it cheap the paintings changed forever. Empires have standardized their red tape — literally red tape. Whole centuries picked a palette and you can date a room by its wall within a decade. Fashion runs the wheel every season and calls it new. Cars went silver for a decade because silver photographs like engineering, and now everyone is quietly returning to color because every parking lot looks like a grayscale spreadsheet. And under all of it runs the simplest truth: nobody has a favorite anything for the reasons they give. They have it because of a kitchen, a shirt, a car, a summer, a screen glow at 2am — some specific moment where a color and a feeling shook hands, and the contract never expired. Ask them why and they will tell you about wavelengths. This is why picking one is so hard — and so worth getting right…";

/* ---- scene 3: the fly-down — the WHOLE transition (user ask): faster and
   a touch longer — text flying up past the camera, the blur riding the
   descent so it settles seamlessly into the other chat. No streak overlay. ---- */
const FLY_AT = TIRADE_END, FLY_LEN = num('fly', 0.9);
const FLY_ACCEL = 3.2;                      // steeper: the drop bites immediately
const SETTLE_LEN = 0.45;                    // the blur clears after the descent
const FLY_TOTAL = FLY_LEN + SETTLE_LEN;
const SB_STATE = FLY_AT + FLY_LEN + 0.1;    // the swap lands near the blur
// peak (the audit caught the old early swap blanking the frame while the
// smear was still rising — the wall now holds until almost the peak)
/* ---- the text wall (user ask): the streaming block grows until it fills
   the frame top-to-bottom and pushes the composer off-screen; it holds
   through the fly-down and releases under the settling blur ---- */
const WALL_AT = TIRADE_AT + (TIRADE_END - TIRADE_AT) * 0.5;
const WALL_RELEASE = FLY_AT + FLY_LEN + 0.15;
/* ---- the answer emphasis (user ask: zoom-ins where they make sense):
   a beat after "Black." lands the camera punches ALL the way in — the word
   alone fills the frame at peak — holds, and relaxes before the simple cut ---- */
const EMPH_DELAY = num('delay', 1.2);
const EMPH_IN = 0.22, EMPH_HOLD = num('hold', 1.05), EMPH_OUT = 0.5, EMPH_MAX = num('emph', 7);

/* ---- scene 4: the /superbot take ---- */
const SB_TYPE_AT = FLY_AT + FLY_TOTAL + 0.35, SB_TYPE_DUR = 1.3;
const SB_PRESS = SB_TYPE_AT + SB_TYPE_DUR + 0.45;
const SB_MSG_AT = SB_PRESS + 0.1;
const SB_THINK_AT = SB_MSG_AT + 0.15, SB_THINK_LEN = 0.6;
const ANSWER_AT = SB_THINK_AT + SB_THINK_LEN, ANSWER_DUR = 0.35;   // "Black."

/* ---- scene 5: its just that simple. ---- */
// zoom out of "Black." (EMPH_END), rest 0.7s, then the simple cut
const EMPH_END = ANSWER_AT + EMPH_DELAY + EMPH_IN + EMPH_HOLD + EMPH_OUT;
const SIMPLE_AT = EMPH_END + 0.7;

/* ---- scene 6: the superbot.gg end card ---- */
const END_AT = SIMPLE_AT + 1.8;
const DRIFT_AT = 0.7;
const LOGO_GAP = 44;         // tabs-chaos end card gap, in 1080-frame px
const END_LEN = 4.8;
const CYCLE = END_AT + END_LEN + 1.8;
window.CYCLE = CYCLE; // read by the gallery's render script (one download = one loop)

const Q_TEXT = 'whats ur favorite color';
const SB_PREFIX = '/superbot';
const OPENER = 'Well I am glad you asked! Colors are a great concept to think about!';
const ANSWER = 'Black.';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOutQuint = (p) => 1 - Math.pow(1 - p, 5);
const easeOutBack = (p) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);
const easeInOutSine = (p) => -(Math.cos(Math.PI * p) - 1) / 2;
const inP = (p, dur) => clamp(p / dur, 0, 1);

/* ---- chrome: the loop veil ---- */

function renderChrome(t) {
  const veil = document.getElementById('veil');
  let v = 0;
  if (t < 0.35) v = 1 - t / 0.35;
  if (t > CYCLE - 1.8) v = clamp((t - (CYCLE - 1.8)) / 1.4, 0, 1);
  veil.style.opacity = v.toFixed(3);
}

/* ---- the accelerating tirade: chars(u) = v0/k · (e^{ku} − 1) — the
   stream starts at v0 chars/s and speeds up exponentially, never pausing
   (user ask). Closed form, so freeze-frames are exact. ---- */
const tiradeChars = (u) => Math.floor((TIRADE_V0 / TIRADE_K) * (Math.exp(TIRADE_K * Math.min(u, TIRADE_END - TIRADE_AT)) - 1));

/* ---- the chat interface ---- */

function renderChat(t) {
  const chat = document.getElementById('chatui');
  const head = document.getElementById('gptHead');
  const msgArea = document.getElementById('msgArea');
  const pill = document.getElementById('pill') || document.querySelector('.input-pill');
  const inputText = document.getElementById('inputText');
  const chip = document.getElementById('inputChip');
  const caret = document.getElementById('caret');
  const placeholder = document.getElementById('placeholder');
  const msgUser = document.getElementById('msgUser');
  const msgAi = document.getElementById('msgAi');
  const dots = document.getElementById('typingDots');
  const suggestions = document.getElementById('suggestions');
  const live = t < SIMPLE_AT + 0.8;
  chat.style.display = live ? '' : 'none';
  if (!live) return;

  const sbTake = t >= SB_STATE; // after the blur, it's the /superbot take
  chat.classList.toggle('sb', sbTake); // take 2 runs in the real superbot composer

  // — during the fly-down the pill gets out of the way (the bar doesn't
  // ride the descent; it's already swapped when the blur clears) —
  pill.style.opacity = t >= FLY_AT && t < SB_STATE
    ? clamp(1 - (t - FLY_AT) / 0.35, 0, 1).toFixed(3)
    : '1';

  // — the idle chrome: chatgpt.com's home state (greeting → composer →
  // suggestions grouped upper-middle) swaps to the conversation state
  // (thread pinned to the top, composer at the bottom) —
  const convo = t >= USER_MSG_AT;
  chat.classList.toggle('home', !convo);
  head.style.opacity = convo ? '0' : '1';
  head.style.filter = convo ? 'blur(3px)' : 'none';
  suggestions.style.display = convo ? 'none' : '';

  // (the stage rect the keycap used to anchor to went with the keycap)

  // — the input pill's text state —
  // take 1: the question types; the ramp wipes it; take 2: the ⚡ /superbot
  // chip (previous animation's style, breathing glow) then the question
  const tp = t - TYPE_AT;
  let txt = '';
  if (sbTake) {
    const typed = Q_TEXT.slice(0, Math.ceil(inP(t - SB_TYPE_AT, SB_TYPE_DUR) * Q_TEXT.length));
    txt = typed;
  } else {
    // take 1: the question STAYS in the bar through the whole stream and
    // the fly-down (user ask: the bar never deletes fully) — only the
    // take-2 swap resets it
    txt = Q_TEXT.slice(0, Math.ceil(inP(tp, TYPE_DUR) * Q_TEXT.length));
  }
  // take 2 still clears its bar the moment its message pops
  const sent = sbTake && t >= SB_MSG_AT;
  if (sent) txt = '';
  const chipLive = false; // the real composer has no /superbot chip
  chip.style.display = chipLive ? 'inline-block' : 'none';
  if (chipLive) {
    // the bolt is the rule's ::before — the text is just the command
    chip.innerHTML = '/superbot';
    // the site's cmd-pop (race.css .cmd.lit), deterministic from t: a
    // one-shot ring spreads 12px and fades over 900ms as the chip lands
    const pop = inP(t - SB_TYPE_AT, 0.9);
    chip.style.boxShadow =
      `inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent), ` +
      `0 0 0 ${(12 * pop).toFixed(1)}px color-mix(in srgb, var(--accent) ${(70 * (1 - pop)).toFixed(0)}%, transparent)`;
  }
  inputText.textContent = txt;
  placeholder.style.display = (txt.length === 0 && !chipLive) ? '' : 'none';
  caret.style.opacity = (Math.floor(t * 2.6) % 2 === 0 ? 1 : 0.15).toFixed(2);
  caret.style.display = (txt.length > 0 || chipLive) ? '' : 'none';

  // — the send: an Enter keypress (user ask: no mouse cursor, and the
  // keycap UI is gone — the caret blink carries the beat) —
  const press = sbTake ? SB_PRESS : PRESS_AT;
  const cp = t - press;

  // — the message area —
  const msgAt = sbTake ? SB_MSG_AT : USER_MSG_AT;
  const thinkAt = sbTake ? SB_THINK_AT : THINK_AT;
  const respAt = sbTake ? ANSWER_AT : RESP_AT;
  const mp = t - msgAt;
  msgUser.textContent = 'whats ur favorite color';
  msgUser.style.opacity = mp > 0 ? inP(mp, 0.18).toFixed(3) : '0';
  msgUser.style.transform = mp > 0
    ? `scale(${(0.94 + 0.06 * easeOutBack(inP(mp, 0.28))).toFixed(3)})`
    : 'none';
  const think = t - thinkAt;
  const thinking = think > 0 && think < (sbTake ? SB_THINK_LEN : THINK_LEN);
  // the dots live IN the thread flow (between the bubbles) — they can never
  // collide with the composer by construction (the old absolute placement
  // overlapped the pill in both takes)
  dots.style.display = thinking ? 'flex' : 'none';
  dots.querySelectorAll('i').forEach((d, i) => {
    d.style.opacity = (0.3 + 0.7 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2);
    d.style.transform = `translateY(${(-3 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2)}px)`;
  });

  // — the response: opener + the accelerating tirade (take 1), "Black."
  // (take 2). The tirade never pauses and keeps speeding up (user ask) —
  // closed-form chars(u) = v0/k·(e^{ku}−1) keeps freeze-frames exact.
  const fp = t - FLY_AT;                       // the fly block below owns this
  const inDesc = fp >= 0 && fp < FLY_LEN;
  const rsp = t - respAt;
  if (rsp <= 0) {
    msgAi.textContent = '';
    msgAi.style.opacity = '0';
    msgArea.scrollTop = 0;
  } else if (sbTake) {
    msgAi.textContent = ANSWER.slice(0, Math.ceil(inP(rsp, ANSWER_DUR) * ANSWER.length));
    msgAi.style.opacity = '1';
    if (!inDesc) msgArea.scrollTop = 0;
  } else {
    const streaming = t < TIRADE_END + 0.01;
    msgAi.textContent = t < TIRADE_AT
      ? OPENER.slice(0, Math.ceil(inP(rsp, RESP_DUR) * OPENER.length))
      : OPENER + TIRADE.slice(0, t < TIRADE_END ? Math.min(TIRADE.length, tiradeChars(t - TIRADE_AT)) : TIRADE.length);
    msgAi.style.opacity = '1';
    // the auto-follow (the frame audit's dead-scroll bug: the fly block's
    // unconditional reset was zeroing this every pass — only this block
    // owns the scroll before the descent begins)
    if (!inDesc) msgArea.scrollTop = streaming || t < WALL_RELEASE ? 1e6 : 0;
  }

  // — the text wall (user ask): the streaming block grows until it fills
  // the frame top-to-bottom and pushes the composer off-screen; it holds
  // through the fly-down and releases under the settling blur —
  const wallP = t <= WALL_AT || t >= WALL_RELEASE ? 0
    : Math.pow(inP(t - WALL_AT, TIRADE_END - WALL_AT), 1.5);
  if (wallP > 0) {
    msgArea.style.flex = `0 0 ${(56 + 44 * wallP).toFixed(1)}%`;
    msgArea.style.maxHeight = 'none';
    // the wall keeps the column width (user ask: it does NOT get wider) —
    // it only grows up until the text spans the top of the screen
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

  // — the fly-down, the whole transition (user ask): 0.9s of hard descent,
  // the text flying up past the camera, the blur riding the descent so the
  // other chat arrives seamlessly. No streak overlay, no scale. —
  if (inDesc) {
    const fly = Math.pow(inP(fp, FLY_LEN), FLY_ACCEL);   // accelerating descent
    // where the auto-follow sat when the descent began (the streamed
    // prefix's share of the full text), so the drop starts where the eye is
    const streamed = OPENER.length + tiradeChars(FLY_AT - TIRADE_AT);
    const full = msgArea.scrollHeight - msgArea.clientHeight;
    const start = Math.max(0, full * streamed / (OPENER.length + TIRADE.length));
    msgArea.scrollTop = (start + (full - start) * fly).toFixed(1);
  }
  if (fp >= 0 && fp < FLY_TOTAL) {
    // the blur rises gently through the descent, peaks just after the swap
    // and clears — the cut never reads
    const smear = fp < FLY_LEN
      ? 3.2 * Math.pow(inP(fp, FLY_LEN), 2)
      : 3.2 + 5.8 * Math.sin(Math.PI * inP(fp - FLY_LEN, SETTLE_LEN));
    chat.style.filter = `blur(${smear.toFixed(2)}px)`;
  } else {
    chat.style.filter = 'none';
  }

  // — the answer emphasis (user ask: zoom-ins where they make sense): a
  // beat after "Black." lands the camera punches ALL the way in — the word
  // alone fills the frame at peak — holds, and relaxes. The transform
  // origin is SOLVED so the answer's center lands at the frame's center at
  // full zoom (origin-at-the-word just inflates the composer around it). —
  chat.style.transform = 'none';
  const empStart = ANSWER_AT + EMPH_DELAY;
  if (sbTake && t >= empStart && t < EMPH_END) {
    const e = t < empStart + EMPH_IN ? easeOutQuint(inP(t - empStart, EMPH_IN))
      : t < empStart + EMPH_IN + EMPH_HOLD ? 1
      : 1 - easeInOutSine(inP(t - empStart - EMPH_IN - EMPH_HOLD, EMPH_OUT));
    // the WORD's rect, not the block's — the ai block spans the whole
    // column while the word sits at its left edge
    const range = document.createRange();
    range.selectNodeContents(msgAi);
    const ar = range.getBoundingClientRect();   // transform reset above: clean
    const cr = chat.getBoundingClientRect();
    const px = ar.left + ar.width / 2 - cr.left;
    const py = ar.top + ar.height / 2 - cr.top;
    const ox = (cr.width / 2 - EMPH_MAX * px) / (1 - EMPH_MAX);
    const oy = (cr.height / 2 - EMPH_MAX * py) / (1 - EMPH_MAX);
    chat.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
    chat.style.transform = `scale(${(1 + (EMPH_MAX - 1) * e).toFixed(4)})`;
    // the frame empties as the camera pushes — the composer and the bubble
    // fading keeps the punch-in path clean (they used to slide giant
    // fragments across the frame on the way in and out)
    const dim = 1 - e;
    pill.style.opacity = (parseFloat(pill.style.opacity || '1') * dim).toFixed(3);
    msgUser.style.opacity = (parseFloat(msgUser.style.opacity || '1') * dim).toFixed(3);
  } else {
    chat.style.transformOrigin = '';
  }
}

/* ---- its just that simple. ---- */

function renderSimple(t) {
  const simple = document.getElementById('simple');
  if (t < SIMPLE_AT || t >= END_AT) {
    simple.style.opacity = '0';
    return;
  }
  const s = t - SIMPLE_AT;
  simple.style.opacity = easeOutQuint(clamp(s / 0.4, 0, 1)).toFixed(3);
  simple.style.transform = `scale(${(0.94 + 0.06 * easeOutBack(inP(s, 0.5))).toFixed(3)})`;
  simple.style.filter = s < 0.4 ? `blur(${(4 * (1 - inP(s, 0.4))).toFixed(2)}px)` : 'none';
}

/* ---- the end card: the superbot.gg lockup (the tabs-chaos end sequence) ---- */

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

  // the lockup is the 1080-frame end card scaled to this stage
  const stage = overlay.getBoundingClientRect();
  const k = stage.height / 1080;
  overlay.style.setProperty('--k', k.toFixed(4));
  const gap = LOGO_GAP * k;

  // the mark lands centre-screen, then the whole lockup (mark + words,
  // measured as one unit) drifts into a centered rest position
  const shift = easeOutQuint(clamp((s - DRIFT_AT) / 1.0, 0, 1));
  const w = bot.offsetWidth, h = bot.offsetHeight;
  const wordW = word.offsetWidth;
  const midY = stage.height / 2;
  word.style.opacity = shift.toFixed(3);
  word.style.filter = shift < 1 ? `blur(${(6 * (1 - shift)).toFixed(1)}px)` : 'none';
  // 1:1 and 4:5 frames (the gallery's ratio pick, assets/ar.js): the words sit under the mark
  const stacked = stage.width / stage.height < 1.2;
  overlay.classList.toggle('stacked', stacked);
  if (stacked) {
    const wordH = word.offsetHeight;
    const top = (stage.height - (h + gap + wordH)) / 2;
    const logoY = midY + (top + h / 2 - midY) * shift;
    bot.style.transform = `translate(${((stage.width - w) / 2).toFixed(1)}px, ${(logoY - h / 2).toFixed(1)}px)`;
    word.style.transform =
      `translate(${((stage.width - wordW) / 2).toFixed(1)}px, ${(top + h + gap - midY + 20 * (1 - shift)).toFixed(1)}px)`;
    return;
  }
  const total = w + gap + wordW;
  const left = (stage.width - total) / 2;
  const logoX = stage.width / 2 + (left + w / 2 - stage.width / 2) * shift;
  bot.style.transform = `translate(${(logoX - w / 2).toFixed(1)}px, ${(midY - h / 2).toFixed(1)}px)`;
  word.style.transform =
    `translate(${(left + w + gap + 20 * (1 - shift)).toFixed(1)}px, -50%)`;
}

/* ---- driving ---- */

function render(t) {
  renderChat(t);
  renderSimple(t);
  renderEndcard(t);
  renderChrome(t);
}

const urlT = new URLSearchParams(location.search).get('t');


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
    let t = ((now - t0) / 1000) * SPEED;
    if (t >= CYCLE) { t0 = now; t = 0; }
    render(t);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// the recorder contract (same as the previous animation)
window.__V7 = { CYCLE, SPEED };
window.__V7.restart = () => { t0 = performance.now(); };
