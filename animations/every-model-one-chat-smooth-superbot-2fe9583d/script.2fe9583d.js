// The film: three asks, each routed to what is built for it.
//   "make me a muse meme"            -> Switching to Nano Banana 2 (Gemini's flash image model) -> image
//   "Scrape reddit and look for more" -> Connecting to Reddit (site switch) -> live tab -> gallery
//   "Winning, order me a burger."     -> Connecting to DoorDash (service switch) -> live tab -> order
// Copy, pill states and timings follow superbot-desktop's learned-provider-switch rule.
import { PRESETS, track, mulberry32 } from './lib/motion.mjs';
import { EASE, prog, lerp } from './ease.2fe9583d.js';
import { mascot, geminiMark, superbotMark } from './icons.2fe9583d.js';
import { buildShell, h } from './shell.2fe9583d.js';
import { createThread, userBubble, switchPill, whoRow, stepRow, mediaCard, answer, liveEmbed, galleryEmbed } from './thread.2fe9583d.js';
import { buildReddit } from './site-reddit.2fe9583d.js';
import { buildDoorDash } from './site-doordash.2fe9583d.js';

export const DUR = 28.4;

const T = {
  type1: 0.9, send1: 2.35, pill1: 2.6, done1: 3.75, chip1: 2.72, chip1Back: 7.0, who1: 3.95, media1: 4.1, resolve1: 5.6, ans1: 6.35, title: 2.95,
  type2: 7.55, send2: 9.1, pill2: 9.35, done2: 10.2, who2: 10.4, s2a: 10.55, s2aDone: 11.75, live2: 10.7, s2b: 11.75, s2bDone: 13.35, ans2: 13.55, gal2: 13.75,
  type3: 15.55, send3: 17.0, pill3: 17.25, done3: 18.1, who3: 18.3, s3a: 18.45, s3aDone: 19.1, live3: 18.6, s3b: 19.1, s3bDone: 20.1, s3c: 20.1, s3cDone: 22.1, ans3: 22.35,
  wide: 23.55, exit: 24.35, end: 24.6, fade: 27.95,
};

const ASKS = [
  { text: 'make me a muse meme', at: T.type1, send: T.send1, seed: 3 },
  { text: 'Scrape reddit and look for more', at: T.type2, send: T.send2, seed: 7 },
  { text: 'Winning, order me a burger.', at: T.type3, send: T.send3, seed: 11 },
];

const tileImg = (src) => `<img src="${src}" alt="">`;
const geminiTile = () => geminiMark('');

/** Keystroke times for an ask: ~58 ms a key with seeded jitter, a beat longer after spaces and commas. */
function keystrokes(ask) {
  const rnd = mulberry32(ask.seed);
  const times = [];
  let at = ask.at;
  for (const ch of ask.text) {
    times.push(at);
    at += 0.042 + rnd() * 0.034 + (ch === ' ' ? 0.03 : 0) + (ch === ',' ? 0.12 : 0);
  }
  return times;
}

function buildTurns(thread) {
  // Turn 1: an image ask goes to the image model.
  thread.add(userBubble('make me a muse meme'), T.send1 + 0.04);
  thread.add(switchPill({ tile: geminiTile(), a: 'Switching to Nano Banana 2', b: 'Switched to Nano Banana 2' }, { in: T.pill1, done: T.done1 }), T.pill1, { gap: 16 });
  thread.add(whoRow({ tile: geminiTile(), name: 'Nano Banana 2' }), T.who1, { gap: 8 });
  thread.add(mediaCard({ src: 'img/muse-meme.jpg', w: 380, hgt: 295, tile: geminiTile() }, { in: T.media1, resolve: T.resolve1 }), T.media1, { gap: 10, dur: 0.55 });
  thread.add(answer('Here’s your Muse meme.', T.ans1), T.ans1, { gap: 10 });

  // Turn 2: a site ask connects to the site and reads it in a live tab.
  thread.add(userBubble('Scrape reddit and look for more'), T.send2 + 0.04, { gap: 26 });
  thread.add(switchPill({ tile: tileImg('img/reddit.png'), a: 'Connecting to Reddit', b: 'Connected to Reddit' }, { in: T.pill2, done: T.done2 }), T.pill2, { gap: 16 });
  thread.add(whoRow({ tile: tileImg('img/reddit.png'), name: 'Reddit' }), T.who2, { gap: 8 });
  thread.add(stepRow({ run: 'Searching Reddit for Muse memes', done: 'Searched Reddit for Muse memes', detail: 'reddit.com/search?q=muse+meme' }, { done: T.s2aDone }), T.s2a, { gap: 8, dur: 0.35 });
  thread.add(stepRow({ run: 'Reading posts in 6 communities', done: 'Read 48 posts in 6 communities', detail: 'r/memes, r/ProgrammerHumor, r/me_irl +3' }, { done: T.s2bDone }), T.s2b, { gap: 4, dur: 0.35 });
  const reddit = buildReddit();
  thread.add(liveEmbed({ page: reddit, lead: 'reddit.com', device: 'MacBook Pro', urls: [[0, 'reddit.com/search/?q=muse+meme']] }, { in: T.live2, load: T.live2 + 0.3, read0: T.live2 + 1.1, read1: T.s2bDone - 0.05 }), T.live2, { gap: 10, dur: 0.6 });
  thread.add(answer('Found 3 more Muse memes climbing this week:', T.ans2), T.ans2, { gap: 12 });
  thread.add(galleryEmbed({
    title: 'Muse memes on Reddit',
    note: 'Top 3 of 48',
    items: [
      { src: 'img/meme-bed.jpg', sub: 'r/memes', stat: '12K votes' },
      { src: 'img/meme-desk.jpg', sub: 'r/ProgrammerHumor', stat: '8.1K votes' },
      { src: 'img/meme-notes.jpg', sub: 'r/me_irl', stat: '5.6K votes' },
    ],
  }, T.gal2), T.gal2, { gap: 10, dur: 0.6 });

  // Turn 3: a food order connects to DoorDash and checks out in a live tab.
  thread.add(userBubble('Winning, order me a burger.'), T.send3 + 0.04, { gap: 26 });
  thread.add(switchPill({ tile: tileImg('img/doordash.png'), a: 'Connecting to DoorDash', b: 'Connected to DoorDash' }, { in: T.pill3, done: T.done3 }), T.pill3, { gap: 16 });
  thread.add(whoRow({ tile: tileImg('img/doordash.png'), name: 'DoorDash' }), T.who3, { gap: 8 });
  thread.add(stepRow({ run: 'Opening DoorDash', done: 'Opened DoorDash', detail: 'doordash.com' }, { done: T.s3aDone }), T.s3a, { gap: 8, dur: 0.35 });
  thread.add(stepRow({ run: 'Adding a Double Smash Burger to your cart', done: 'Added a Double Smash Burger to your cart', detail: 'Smash Club Burgers · $12.49' }, { done: T.s3bDone }), T.s3b, { gap: 4, dur: 0.35 });
  thread.add(stepRow({ run: 'Checking out with your saved card', done: 'Checked out with your saved card', detail: 'Visa •••• 4242' }, { done: T.s3cDone }), T.s3c, { gap: 4, dur: 0.35 });
  const doordash = buildDoorDash();
  thread.add(liveEmbed({ page: doordash, lead: 'doordash.com', device: 'MacBook Pro', urls: [[0, 'doordash.com/store/smash-club-burgers'], [T.s3c + 0.25, 'doordash.com/consumer/checkout'], [T.s3cDone - 0.2, 'doordash.com/orders/track']] }, { in: T.live3, add: T.s3bDone - 0.35, checkout: T.s3c + 0.25, place: T.s3cDone - 0.55, placed: T.s3cDone - 0.2 }), T.live3, { gap: 10, dur: 0.6 });
  thread.add(answer('Ordered. Your *Double* *Smash* *Burger* arrives around *7:42* *PM.*', T.ans3), T.ans3, { gap: 12 });
}

/** The composer: typing, caret, send button, and the model chip that briefly shows the routed model. */
function composerMotion(t, ui, strokes) {
  let ask = null;
  for (const a of ASKS) if (t >= a.at) ask = a;
  let text = '';
  let lastKey = -Infinity;
  let clearing = 0;
  if (ask && t < ask.send + 0.16) {
    const times = strokes.get(ask);
    const n = times.filter((x) => x <= t).length;
    text = ask.text.slice(0, n);
    if (n) lastKey = times[n - 1];
    clearing = prog(t, ask.send, 0.16, EASE.standard);
  }
  const line = ui.typed.parentElement;
  ui.typed.textContent = text;
  line.style.opacity = (1 - clearing).toFixed(3);
  line.style.transform = `translateY(${(-6 * clearing).toFixed(2)}px)`;
  ui.ph.style.opacity = text ? clearing.toFixed(3) : '1';
  ui.caret.style.opacity = t - lastKey < 0.5 || Math.floor(t / 0.53) % 2 === 0 ? '1' : '0';

  // Send lights once there is text and goes dark as the message leaves; it dips on the press.
  const lit = text ? prog(t, strokes.get(ask)[0], 0.15, EASE.standard) * (1 - clearing) : 0;
  ui.send.style.background = `rgb(${Math.round(lerp(35, 230, lit))},${Math.round(lerp(35, 232, lit))},${Math.round(lerp(38, 238, lit))})`;
  ui.send.style.color = lit > 0.5 ? '#0d0d0d' : '#5d6068';
  const at = ask?.send ?? -10;
  const press = prog(t, at - 0.07, 0.07, EASE.standard) * (1 - prog(t, at, 0.25, EASE.outCubic));
  ui.send.style.transform = `scale(${(1 - 0.12 * press).toFixed(4)})`;

  // Model chip: dip to 0.15 over 140 ms, swap face, pop from 1.08 over 400 ms (switch-dip / switch-pop).
  let face = 'a';
  let opacity = 1;
  let scale = 1;
  for (const [swapAt, next] of [[T.chip1, 'b'], [T.chip1Back, 'a']]) {
    if (t >= swapAt - 0.14 && t < swapAt) opacity = 1 - 0.85 * prog(t, swapAt - 0.14, 0.14, EASE.standard);
    if (t >= swapAt) {
      face = next;
      opacity = lerp(0.15, 1, prog(t, swapAt, 0.22, EASE.standard));
      scale = lerp(1.08, 1, prog(t, swapAt, 0.4, EASE.outCubic));
    }
  }
  ui.chip.style.opacity = opacity.toFixed(3);
  ui.chip.style.transform = `scale(${scale.toFixed(4)})`;
  ui.faceA.style.opacity = face === 'a' ? '1' : '0';
  ui.faceB.style.opacity = face === 'b' ? '1' : '0';
}

function chrome(t, ui) {
  // First send names the chat: the title swaps and the row opens under Today.
  const k = prog(t, T.title, 0.5, EASE.outCubic);
  ui.newRow.style.height = `${(44 * k).toFixed(2)}px`;
  ui.newRow.style.opacity = prog(t, T.title + 0.1, 0.35, EASE.standard).toFixed(3);
  const swap = prog(t, T.title, 0.3, EASE.standard);
  ui.titleA.style.opacity = (1 - swap).toFixed(3);
  ui.titleB.style.opacity = prog(t, T.title + 0.1, 0.3, EASE.standard).toFixed(3);
  const g = prog(t, T.send1, 0.4, EASE.standard);
  ui.greet.style.opacity = (1 - g).toFixed(3);
  ui.greet.style.transform = `translateY(${(-18 * g).toFixed(2)}px)`;
  const used = t < T.send1 ? 2 : t < T.ans1 ? 3 : t < T.send2 ? 4 : t < T.ans2 ? 7 : t < T.send3 ? 9 : t < T.ans3 ? 11 : 13;
  ui.meterN.textContent = `${used}k of 1m`;
  ui.meterBar.style.width = `${Math.max(3, used * 0.9)}px`;
}

/** Camera over the 1680x880 window: wide while you ask, in on each answer, wide again, then out. */
function camera(t) {
  const W = [1.12, 840, 440];
  const IN = [1.39, 982, 481];
  const IN2 = IN;
  const keyframes = [
    [0, [1.04, 840, 440]], [0.02, W],
    [T.send1 + 0.05, IN], [T.chip1Back + 0.15, W],
    [T.send2 + 0.05, IN2], [T.type3 - 0.25, W],
    [T.send3 + 0.05, IN2], [T.wide, W],
    [T.exit, [0.96, 840, 440]],
  ];
  const axis = (i) => track(t, keyframes.map(([at, v]) => [at, v[i]]), PRESETS.default.k, PRESETS.default.d);
  return { s: axis(0), fx: axis(1), fy: axis(2) };
}

function endCard(t, end) {
  const heavy = (at) => track(t, [[0, 0], [at, 1]], PRESETS.heavy.k, PRESETS.heavy.d);
  const m = heavy(T.end);
  end.mark.style.opacity = prog(t, T.end, 0.5, EASE.standard).toFixed(3);
  end.mark.style.transform = `scale(${lerp(0.86, 1, m).toFixed(4)})`;
  end.words.forEach((w, i) => {
    const at = T.end + 0.22 + i * 0.12;
    w.style.opacity = prog(t, at, 0.45, EASE.standard).toFixed(3);
    w.style.transform = `translateY(${lerp(36, 0, heavy(at)).toFixed(2)}px)`;
  });
  end.url.style.opacity = prog(t, T.end + 1.0, 0.5, EASE.standard).toFixed(3);
}

export function buildFilm(stage) {
  const cam = h('<div id="cam"></div>');
  stage.appendChild(cam);
  const ui = buildShell(cam);
  const thread = createThread(ui.col);
  buildTurns(thread);
  const endEl = h(`<div id="end">${superbotMark('mark')}<h2><span>EVERY</span><span>MODEL.</span><span>ONE</span><span>CHAT.</span></h2><div class="url">superbot.gg</div></div>`);
  stage.appendChild(endEl);
  const end = { mark: endEl.querySelector('.mark'), words: [...endEl.querySelectorAll('h2 span')], url: endEl.querySelector('.url') };
  const strokes = new Map(ASKS.map((a) => [a, keystrokes(a)]));

  function seek(t) {
    const c = camera(t);
    cam.style.transform = `translate(${(960 - c.fx * c.s).toFixed(2)}px, ${(540 - c.fy * c.s).toFixed(2)}px) scale(${c.s.toFixed(5)})`;
    const winIn = prog(t, 0, 0.6, EASE.standard);
    const winOut = prog(t, T.exit, 0.7, EASE.standard);
    cam.style.opacity = (winIn * (1 - winOut)).toFixed(3);
    cam.style.visibility = winIn * (1 - winOut) < 0.002 ? 'hidden' : 'visible';
    if (t < T.exit + 0.75) {
      chrome(t, ui);
      composerMotion(t, ui, strokes);
      thread.layout(t);
    }
    endCard(t, end);
    endEl.style.opacity = (1 - prog(t, T.fade, 0.45, EASE.standard)).toFixed(3);
  }

  return { seek, measure: () => thread.measure() };
}

export { mascot };
