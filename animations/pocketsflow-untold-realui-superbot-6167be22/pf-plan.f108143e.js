// pf-plan: the thread's copy and its clock (act 3 of pocketsflow-untold, real UI). One ask, routed the way
// superbot-desktop main routes it (packages/core/src/switch/provider-switch.ts, learned-provider-switch.mdc):
//   1. the website the ask names is a SERVICE switch: "Connecting to Pocketsflow" -> "Connected to Pocketsflow",
//      its browse steps nested under it and the turn's page shots after the block (hub/turn-inline.tsx);
//   2-4. each piece of media is a MEDIA switch: "Switching to {model}" -> "Switched to {model}", the who header,
//      the pending surface naming the work (switchGeneratingLabel), then the media card in the same box;
//   5. the code is a CHAT model's work: main draws no switch pill for it, only the composer chip naming the
//      routed model and the live step rows (hub/StepList.tsx).
// Every time here is seconds into the thread scene.

export const ASK = 'make a launch video for pocketsflow.com starring our mascot';
export const SAY = 'Here is your Pocketsflow launch film.';
export const BODY = 'Meshy 7.1 turned your mascot into a 3D model, MiniMax H3 animated it, Eleven Music v2.5 scored it, and Claude Opus 5.5 cut the film together in code.';

const asset = (f) => new URL('./media/' + f, import.meta.url).href;
export const MEDIA = {
  mascot: { src: asset('mascot.png'), w: 256, h: 256, name: 'mascot.png' },
  glb: asset('prop.glb'), still: asset('prop-still.webp'),
  h3: { src: asset('clip-h3.mp4'), poster: asset('h3-poster.jpg'), len: 5 },
  film: { src: asset('launch.mp4'), poster: asset('launch-poster.jpg'), len: 15, from: 0.8, name: 'pocketsflow-launch.mp4' },
  shots: ['pf-home.webp', 'pf-courses.webp', 'pf-digital.webp'].map((f) => asset('shots/' + f)),
};
// switch tiles, as main resolves them (switch-mark.tsx): the site's favicon on the neutral ground, the app's own
// tile files for MiniMax and ElevenLabs (packages/ui/src/marks/tiles), and the generic glyph (lucide Cpu) for
// Meshy, which main ships no mark for
export const TILE = {
  pocketsflow: { site: asset('tiles/pocketsflow.png') },
  meshy: { img: asset('tiles/generic-cpu.svg') },
  generic: { img: asset('tiles/generic-cpu.svg') },
  minimax: { img: asset('tiles/minimax.svg') },
  elevenlabs: { img: asset('tiles/elevenlabs.svg') },
  anthropic: { img: asset('tiles/anthropic.png') },
};

// [running label, done label, detail], worded the way the edge words them (superbot edge/src/provider-switch.ts):
// an unknown host is named by its host without www (siteServiceOf), the first visit "Opening {name}", a later one
// "Going to the {phrase} page" (pageOfUrl + verbLabels('go')); detail is host + path, omitted for a root page
export const SITE = {
  name: 'pocketsflow.com', tile: 'pocketsflow',
  steps: [
    ['Opening pocketsflow.com', 'Opened pocketsflow.com', ''],
    ['Going to the courses page', 'Went to the courses page', 'pocketsflow.com/courses'],
    ['Going to the digital products page', 'Went to the digital products page', 'pocketsflow.com/digital-products'],
  ],
  host: 'pocketsflow.com',
};
// the media switches: label = target.label, task = the pending surface's kind
export const SWITCHES = [
  { key: 'mesh', label: 'Meshy 7.1', tile: 'meshy', task: 'model3d', make: 1.0, hold: 2.1 },
  { key: 'clip', label: 'MiniMax H3', tile: 'minimax', task: 'video', make: 1.0, hold: 2.3 },
  { key: 'score', label: 'Eleven Music v2.5', tile: 'elevenlabs', task: 'audio', make: 0.9, hold: 1.4 },
];
export const PENDING = { model3d: 'Creating 3D model', video: 'Creating video', audio: 'Creating audio' };
export const SCORE = { title: 'Pocketsflow launch theme', source: 'via Superbot · Eleven Music v2.5', len: 15 };
// the code leg's live step rows (step-line.tsx: verb, target; args and the clock are Developer Mode only):
// [running verb, done verb, target, seconds]. The first row is the hand-off: the three media switches' files
// land in the Remotion project before the code that uses them.
export const CODE = {
  model: 'Claude Opus 5.5', tile: 'anthropic',
  steps: [
    ['Saving', 'Saved', 'mascot.glb, mascot.mp4 and theme.mp3', 0.55],
    ['Writing', 'Wrote', 'LaunchFilm.tsx', 0.5],
    ['Writing', 'Wrote', 'Storefront.tsx', 0.45],
    ['Writing', 'Wrote', 'Checkout.tsx', 0.45],
    ['Running', 'Ran', 'npx remotion render', 1.0],
  ],
};

// ---- the clock -----------------------------------------------------------------------------------------------
const r3 = (x) => Math.round(x * 1000) / 1000;
const K = {
  TYPE_AT: 0.35, KEY: 0.032, SEND_AFTER: 0.15, ROW: 0.3, SW_AFTER: 0.3, SPIN: 0.65, STEP_IN: 0.2, STEP: 0.5,
  SITE_HOLD: 0.55, NEXT: 0.0, CODE_AFTER: 0.2, SAY_CPS: 70, BODY_AFTER: 0.15, FILM_AFTER: 0.4, PUSH_AFTER: 2.6, FILM_HOLD: 4.2,
  PULL: 0.6, TAIL: 0.4,
};
export function plan() {
  const T = {};
  T.keys = [...ASK].map((_, i) => r3(K.TYPE_AT + i * K.KEY));
  T.send = r3(T.keys[T.keys.length - 1] + K.SEND_AFTER);
  T.row = r3(T.send + K.ROW);
  const site = { sw: r3(T.row + K.SW_AFTER) };
  site.ok = r3(site.sw + K.SPIN);
  let c = site.ok + K.STEP_IN;
  site.steps = SITE.steps.map(() => { const a = { in: r3(c), done: r3(c + K.STEP) }; c = a.done; return a; });
  site.shots = site.steps.map((a) => a.done);              // a page shot lands as each visit settles
  site.end = r3(c);
  T.site = site;
  c = site.end + K.SITE_HOLD;
  T.media = SWITCHES.map((d) => {
    const m = { sw: r3(c) };
    m.ok = r3(m.sw + K.SPIN);
    m.done = r3(m.ok + d.make);
    m.end = r3(m.done + d.hold);
    c = m.end + K.NEXT;
    return m;
  });
  const code = { at: r3(c + K.CODE_AFTER) };
  c = code.at + 0.2;
  code.steps = CODE.steps.map((s) => { const a = { in: r3(c), done: r3(c + s[3]) }; c = a.done; return a; });
  code.end = r3(c);
  T.code = code;
  T.say = r3(code.end + 0.15);
  T.sayEnd = r3(T.say + 0.06 + SAY.length / K.SAY_CPS);
  T.body = r3(T.sayEnd + K.BODY_AFTER);
  T.film = r3(T.body + K.FILM_AFTER);                     // the film card lands under the answer and plays
  T.settled = r3(T.film + 0.4);
  T.push = r3(T.film + K.PUSH_AFTER);                     // the answer has been read: the camera pushes into the film
  T.pull = r3(T.push + K.FILM_HOLD);
  T.dur = r3(T.pull + K.PULL + K.TAIL);
  return T;
}
