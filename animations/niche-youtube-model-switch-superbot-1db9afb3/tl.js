// The spot's clock. Every visible change is placed here, in seconds, so the beats only read times.
// One ask, six hand-offs in the order the work needs them; each hand-off is the real switch pill
// ("Switching to X" with the spinner, then "Switched to X" with the check; services read "Connecting to" /
// "Connected to"), and the camera pushes in on every pill: PUSH in, HOLD while the label lands and the
// spinner resolves, PULL back while the routed tool starts answering.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
export const lerp = (a, b, p) => a + (b - a) * p;
export const outCubic = (p) => 1 - (1 - p) ** 3;
export const outQuint = (p) => 1 - (1 - p) ** 5;
export const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const inOutSine = (p) => -(Math.cos(Math.PI * p) - 1) / 2;

export const ASK = 'Turn my most-asked comment into a 3D Short and reply with it';
export const TYPE_CPS = 50; /* deliberate */ // one character every 0.02 s
export const PUSH = 0.5; /* deliberate */    // push-in onto the pill
export const HOLD = 1.0; /* deliberate */    // parked on the pill: the label is legible for >= 0.8 s
export const PULL = 0.5; /* deliberate */    // pull back while the reply starts
export const CHECK = 0.45; /* deliberate */  // after the push lands, the spinner resolves to the check
export const GAP = 0.2; /* deliberate */     // the user: "it should be like 0.2"
export const APPEAR = 0.3;                   // a row rising into the thread

const T0 = 0.35;
const typeEnd = T0 + ASK.length / TYPE_CPS;
const send = typeEnd + 0.17;

// each hand-off: its pill time and how long its own work runs after the pull-back
const BEATS = [
  ['deepseek', 6.0],
  ['blender', 5.0],
  ['eleven', 3.2],
  ['opus', 5.8],
  ['nano', 2.8],
  ['youtube', 6.4],
];

let at = send + 0.85;
export const T = { open: 0.3, type: T0, typeEnd, send, swap: send + 0.05 };
export const B = {};
for (const [id, work] of BEATS) {
  const sw = at;
  const landed = sw + PUSH;
  const done = landed + CHECK;
  const pull = landed + HOLD;
  const back = pull + PULL;
  const reply = pull + 0.05;
  const end = back + work;
  B[id] = { id, sw, landed, done, pull, back, reply, end, work };
  at = end + GAP;
}
export const CHAT_END = at - GAP;
export const CARD = CHAT_END + 0.4;          // the end card fades up
export const DUR = CARD + 3.0;
