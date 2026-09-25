// agent-switch: the landed hub's chat, drawn ONLY with the superbot-desktop renderer's own frames (hub-markup.js /
// real-states.js / real.css). The story is the real Claude -> Superbot rescue:
//   the pointer opens Claude on the rail (the Claude front, an existing "Hello" / "Hi!" chat), types the next prompt,
//   sends it; the vendor turn halts on the usage limit, the Usage card's meters read spent and the Superbot rescue
//   toast rises (hub/halt-rescue.ts, copy from packages/core/src/relay/chat-halt.ts); the pointer presses
//   "Continue in Superbot" and the hub lands on a new Superbot chat carrying the conversation
//   (hub/index.tsx continueInSuperbot). The timeline cuts to the "Context carries" card over [T.aEnd, T.bStart];
//   after it Superbot answers the carried prompt.
// Everything is a pure function of t (scene-local seconds), like the rest of the spot.
import { clamp, seg, outCubic, inOutCubic, boxIn, placeCursor, lerp } from '../../lib.js';
import { makeCursor } from '../../shell.js';

const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 7.75; // the hub has landed (tabs T.msg = 7.62)
export const T = {
  sel: 8.35,                  // the pointer presses Claude on the rail -> the Claude front
  typeS: 9.2, typeE: 10.85,   // "Rewrite the release notes for Claude users" is typed
  send: 11.1,                 // sent: the prompt lands in the thread
  halt: 11.8,                 // the turn halts on the usage limit: meters spent, the rescue toast rises
  press: 14.5,                // the pointer presses "Continue in Superbot"
  sw: 14.56,                  // the Superbot front, the new chat carrying the conversation
  aEnd: 16.6,                 // window A ends: the "Context carries" card
  bStart: 18.9,               // window B opens on the same Superbot chat
  ans: 19.35, ansEnd: 21.1,   // Superbot answers the carried prompt
};
export const CHAT_END = 22.4;
// the two stretches of this scene the timeline plays, either side of the "Context carries" card
export const CHAT_WINDOWS = [[0, T.aEnd], [T.bStart, CHAT_END + 0.2]];

const PROMPT = 'Rewrite the release notes for Claude users';

const q = (n, s) => n.querySelector(s);
const pathOf = (n, root) => { const p = []; while (n && n !== root) { p.unshift([...n.parentNode.children].indexOf(n)); n = n.parentNode; } return p; };
const nodeAt = (root, p) => p.reduce((n, i) => (n ? n.children[i] : null), root);
function textNode(root, needle) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) if (w.currentNode.nodeValue.includes(needle)) return w.currentNode;
  return null;
}

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const L = Object.fromEntries([...hub.querySelectorAll(':scope > .rh')].map((n) => [n.dataset.state, n]));

  // s1-typed was serialized with its thread scrolled to 0; the Claude front's own offset (s1-claude) is kept so
  // nothing jumps while the prompt is typed
  const st1 = q(L['s1-claude'], '[data-st]');
  if (st1 && !q(L['s1-typed'], '[data-st]')) {
    const twin = nodeAt(L['s1-typed'], pathOf(st1, L['s1-claude']));
    if (twin) twin.setAttribute('data-st', st1.getAttribute('data-st'));
  }
  const typed = textNode(q(L['s1-typed'], '[data-k="cin"]'), PROMPT);

  // the halted turn: the prompt row, the toast, and the Usage card read from the meters-spent frame (s2-limit)
  const s3 = L['s3-toast'];
  const pill = q(s3, '[data-row="2"]');
  const toast = q(s3, '[data-k="toast"]');
  const cont = q(s3, '[data-k="cont"]');
  const side3 = q(s3, '[data-k="side"]');
  const side2 = q(L['s2-limit'], '[data-k="side"]').cloneNode(true);
  side2.style.display = 'none';
  side3.after(side2);

  // Superbot's answer streams in word by word (its row is laid out in full, so nothing reflows)
  const s4 = L['s4-handoff'];
  const answer = q(s4, '[data-answer]');
  const aText = answer && textNode(answer, 'Here’s the rewrite');
  const words = [];
  if (aText) {
    const frag = document.createDocumentFragment();
    aText.nodeValue.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
      const s = document.createElement('span');
      s.className = 'as-w';
      s.textContent = w;
      words.push(s);
      frag.appendChild(s);
    });
    aText.replaceWith(frag);
  }
  // the new chat's sidebar row previews its last message (the renderer cuts it to a fixed length + "..."): the
  // prompt until the answer lands, then the answer. The frame was serialized with the dev relay's reply there.
  const preview = textNode(q(s4, '[data-k="side"]'), 'Continued on the fake relay');
  const cut = preview && preview.nodeValue.endsWith('...') ? preview.nodeValue.length - 3 : 999;
  const ans = aText ? words.map((w) => w.textContent).join(' ') : '';
  const previewAns = ans.length > cut ? ans.slice(0, cut) + '...' : ans;

  return {
    hub, pointer, L, cur: null, scrolled: new Set(),
    claude: q(L['s0-home'], '[data-k="claude"]'),
    typed, pill, toast, cont, side2, side3, answer, words, preview, previewAns, lastPrev: null, lastTyped: null,
  };
}

function stateAt(t) {
  if (t < T.sel + 0.05) return 's0-home';
  if (t < T.typeS) return 's1-claude';
  if (t < T.send) return 's1-typed';
  if (t < T.sw) return 's3-toast';
  return 's4-handoff';
}

function show(c, k) {
  const n = c.L[k];
  if (c.cur !== k) {
    Object.values(c.L).forEach((l) => l.classList.toggle('on', l === n));
    c.cur = k;
  }
  // restore the renderer's scroll offsets once the frame is laid out
  if (!c.scrolled.has(k) && n.offsetWidth) {
    n.querySelectorAll('[data-st]').forEach((e) => { const [a, b] = e.dataset.st.split(','); e.scrollTop = +a; e.scrollLeft = +b; });
    c.scrolled.add(k);
  }
}

// the pointer's two presses
function pointers(c) {
  return [
    { n: c.claude, a: 7.8, at: 8.28, press: T.sel, gone: 8.95, dx: 300, dy: 40 },
    { n: c.cont, a: 13.35, at: 14.3, press: T.press, gone: 15.1, dx: 170, dy: 130 },
  ];
}

export function renderChat(c, t) {
  if (!c) return;
  show(c, stateAt(t));

  // typing: the composer's own text node grows (s1-typed is the renderer's frame with the prompt in the composer)
  if (c.typed) {
    const n = Math.max(1, Math.round(PROMPT.length * seg(t, T.typeS, T.typeE)));
    const v = PROMPT.slice(0, n);
    if (v !== c.lastTyped) { c.typed.nodeValue = v; c.lastTyped = v; }
  }

  // the halted turn
  if (c.pill) c.pill.style.visibility = t >= T.send ? '' : 'hidden';
  const spent = t >= T.halt;
  c.side3.style.display = spent ? 'none' : '';
  c.side2.style.display = spent ? '' : 'none';
  if (c.toast) {
    // the toast's own entrance (packages/ui toast.tsx: @starting-style opacity 0, translateY(--spacing-8), 200ms ease)
    const k = seg(t, T.halt, T.halt + 0.2);
    const e = k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 2);
    c.toast.style.opacity = e.toFixed(3);
    c.toast.style.transform = e >= 1 ? '' : `translateY(${(8 * (1 - e)).toFixed(2)}px)`;
  }

  // Superbot's answer
  if (c.answer) {
    c.answer.style.visibility = t >= T.ans ? '' : 'hidden';
    const k = Math.ceil(c.words.length * seg(t, T.ans, T.ansEnd));
    c.words.forEach((w, i) => w.classList.toggle('as-hid', i >= k));
  }
  if (c.preview) {
    const v = t >= T.ansEnd ? c.previewAns : PROMPT;
    if (v !== c.lastPrev) { c.preview.nodeValue = v; c.lastPrev = v; }
  }

  const pt = pointers(c).find((p) => p.n && t >= p.a && t < p.gone);
  if (pt) {
    const bx = boxIn(pt.n, c.pointer.parentNode);
    const k = inOutCubic(seg(t, pt.a, pt.at));
    const x = lerp(bx.cx + pt.dx, bx.cx, k), y = lerp(bx.cy + pt.dy, bx.cy, k);
    const v = seg(t, pt.a, pt.a + 0.2) * (1 - seg(t, pt.gone - 0.25, pt.gone));
    placeCursor(c.pointer, x, y, bump(seg(t, pt.press - 0.07, pt.press + 0.14)), v);
  } else c.pointer.style.opacity = '0';
}
