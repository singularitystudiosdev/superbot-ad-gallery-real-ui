// The Superbot window, built from the superbot-desktop renderer itself (no hand-drawn UI).
// real-states.js holds one static frame per state of the story: the renderer's own DOM with its own computed
// styles (real.css), serialized from the running hub by /tmp/sbad.67151074/dump-sbad.mjs + build-real.mjs:
//   s0-home     Superbot front, new chat                    (hub/index.tsx, Sidebar, Thread.tsx empty state)
//   s1-claude   Claude front, the "Friendly greeting" chat  (vendor front: Sidebar usage card, Thread.tsx rows)
//   s1-typed    the same, the next prompt typed in the composer
//   s2-limit    the same Claude front with its meters spent  (only its sidebar is used: the red Usage card)
//   s3-toast    the turn halted: the Superbot rescue toast   (hub/halt-rescue.ts, core relay/chat-halt.ts copy)
//   s4-handoff  "Continue in Superbot": the new Superbot chat carrying the conversation (hub/index.tsx continueInSuperbot)
// Only user data was changed before serializing (message text, chat titles, the account email); the dev relay's
// error rows ("relay 502 …", "Didn't send.") and its "Worked for …ms" timing line were left out (display:none).
// The traffic lights are macOS's own window controls (drawn by the OS over the rail, not by the renderer).
import { STATES } from './real-states.js';

export const LAYERS = ['s0-home', 's1-claude', 's1-typed', 's3-toast', 's4-handoff', 's2-limit'];

export const hubMarkup = (A) => {
  const base = A('');
  const layer = (k) => `<div class="rh" data-state="${k}">${STATES[k].replaceAll('@A@', base)}</div>`;
  return `<div class="win" data-k="hub" aria-hidden="true">${LAYERS.map(layer).join('')}<span class="lights"><i></i><i></i><i></i></span></div>`;
};
