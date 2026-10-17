// Stable Assistant (2024), Stability AI's chat product, the 'Chat' tab (Monzon Media 'First Look At Stable Assistant Featuring
// Stable Diffusion 3', YouTube pNbEdIimf0s, 2024-06-01, t~139.8-143.4 s; spec .tmp/clone-9e82faf1/reveal-refs/stable-assistant/spec.json,
// confidence 0.62; frames s_01_pending_running_pill_full.png, s_02_running_pill_zoom.png, s_06_swap_30fps_sheet.png). A flat dark chat
// shell: a #212121 top bar with 'Chat' (selected) and 'About' tabs and an outlined 'New Chat' button, a 'Past Chats' rail, a #363636
// conversation (user and assistant messages each headed by a name and a time, a copy / thumbs row under the reply) and a round
// composer 'Type your message here or upload one image' with an up-arrow send button. After a prompt is sent the assistant's reply
// opens with a small dark rounded pill holding a white open-arc spinner and the bold word 'Running' (no percentage, queue position or
// bar), and when rendering ends the pill is swapped in the same message for the finished image in one frame.
// Adapted to ten images: the reply carries the 'Running' pill until the last picture has landed and opens ten image slots under it,
// the pictures dropping into them one at a time in strict order (a hard swap each; an unlanded slot is just the message band), the
// action row appearing under the reply with the last. Omitted: the 'S.' mark, the 'M' avatar's letter, the red badge dots, the footer
// links and the creator's webcam overlay. The footage's picture is never reproduced: every tile is our own meme, and no logo,
// wordmark or platform font is drawn (a plain ring, plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sas';
const ROOT_H = 396, RAIL_W = 112, COLS = 5, GAP = 5;   // px
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #363636; color: #f2f2f2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; background: #212121; }
.${P}-tab { box-sizing: border-box; height: 22px; padding: 0 9px; border-radius: 6px; font-size: 9.5px; font-weight: 600; line-height: 22px; color: #d8d8d8; }
.${P}-tab.on { background: #4a4a4a; color: #fff; }
.${P}-new { display: flex; align-items: center; gap: 5px; margin-left: auto; box-sizing: border-box; height: 22px; padding: 0 9px; border-radius: 6px; box-shadow: inset 0 0 0 1px #8a8a8a; font-size: 9px; font-weight: 600; color: #f2f2f2; white-space: nowrap; }
.${P}-new svg { width: 9px; height: 9px; fill: none; stroke: #f2f2f2; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-av { flex: none; width: 20px; height: 20px; border-radius: 50%; background: #7c5cc4; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; width: ${RAIL_W}px; padding: 12px 8px; background: #212121; }
.${P}-rail b { display: block; font-size: 10px; font-weight: 700; color: #f2f2f2; }
.${P}-rail small { display: block; margin-top: 9px; font-size: 7.5px; color: #a8a8a8; }
.${P}-rail span { display: block; margin-top: 6px; font-size: 8px; line-height: 12px; color: #dcdcdc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-chat { flex: 1; min-height: 0; overflow: hidden; }
.${P}-msg { box-sizing: border-box; padding: 9px 14px; }
.${P}-msg.bot { background: #424242; }
.${P}-hd { display: flex; align-items: center; gap: 6px; height: 16px; font-size: 9.5px; font-weight: 700; color: #f6f6f6; white-space: nowrap; }
.${P}-hd i { flex: none; display: block; width: 14px; height: 14px; border-radius: 50%; background: #5e5e5e; }
.${P}-hd .bot { background: #7c5cc4; }
.${P}-hd small { font-size: 8px; font-weight: 400; color: #bdbdbd; }
.${P}-tx { margin-top: 4px; padding-left: 20px; font-size: 9.5px; line-height: 14px; color: #eaeaea; }
.${P}-run { display: flex; align-items: center; gap: 7px; box-sizing: border-box; width: 66px; height: 24px; margin: 5px 0 0 20px; padding: 0 9px; border-radius: 8px; background: #212121; font-size: 9.5px; font-weight: 700; color: #fff; white-space: nowrap; }
.${P}-arc { display: block; flex: none; box-sizing: border-box; width: 11px; height: 11px; border-radius: 50%; border: 1.6px solid rgba(255, 255, 255, .22); border-top-color: #fff; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin: 7px 0 0 20px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #424242; }
.${P}-acts { display: flex; gap: 9px; height: 14px; margin: 6px 0 0 20px; }
.${P}-acts svg { width: 11px; height: 11px; fill: none; stroke: #c4c4c4; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-comp { flex: none; display: flex; align-items: center; gap: 7px; box-sizing: border-box; height: 34px; margin: 8px 12px 10px; padding: 0 6px 0 10px; border-radius: 12px; background: #2b2b2b; box-shadow: inset 0 0 0 1px #4a4a4a; }
.${P}-comp svg { flex: none; width: 11px; height: 11px; fill: none; stroke: #b0b0b0; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-in { flex: 1; min-width: 0; font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #9a9a9a; }
.${P}-send { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: #d8d8d8; }
.${P}-send svg { width: 11px; height: 11px; stroke: #212121; stroke-width: 1.7; }
`;

const PROMPT = 'generate 10 images of a legendary meme, studio lighting, high detail';
const PLACEHOLDER = 'Type your message here or upload one image';
const SEND_AT = 0.04;    // the cursor presses the send arrow
const SHOWN = 0.12;      // the prompt moves into the conversation and the reply opens with its 'Running' pill
const ICON = {
  clip: '<svg viewBox="0 0 12 12"><path d="M9.5 5.5 5.2 9.8a2.1 2.1 0 0 1-3-3l4.6-4.6a1.4 1.4 0 0 1 2 2L4.4 8.7a.7.7 0 0 1-1-1l4-4"/></svg>',
  tune: '<svg viewBox="0 0 12 12"><path d="M1.5 3.5h4M8.5 3.5h2M1.5 8.5h2M6.5 8.5h4"/><circle cx="7" cy="3.5" r="1.3"/><circle cx="5" cy="8.5" r="1.3"/></svg>',
  copy: '<svg viewBox="0 0 12 12"><rect x="3.5" y="3.5" width="6" height="7" rx="1"/><path d="M2.5 8.5V2.5a1 1 0 0 1 1-1h4"/></svg>',
  up: '<svg viewBox="0 0 12 12"><path d="M3 6.5v3.5h5l1.5-3.5V5H6.3l.4-2.2a.8.8 0 0 0-1.4-.5L3 5"/></svg>',
  down: '<svg viewBox="0 0 12 12"><path d="M3 5.5V2h5l1.5 3.5V7H6.3l.4 2.2a.8.8 0 0 1-1.4.5L3 7"/></svg>',
  send: '<svg viewBox="0 0 12 12" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10V2.5M2.8 5.5 6 2.3l3.2 3.2"/></svg>',
  pen: '<svg viewBox="0 0 12 12"><path d="M8.5 1.8 10.2 3.5 4.6 9.1 2.5 9.5l.4-2.1zM2.5 3H1.5v7.5H9V9.5"/></svg>',
};

export default {
  id: 'stable-assistant',
  label: 'Stable Assistant (2024)',
  source: {
    platform: "Stable Assistant web chat (Stability AI, the 'Chat' tab; desktop browser, dark theme; a first-look screen recording on YouTube, 2024-06-01)",
    feature: "flat dark chat: a top bar with Chat / About tabs and a New Chat button, a Past Chats rail, user and assistant messages headed by a name and a time, a round composer 'Type your message here or upload one image' with an up-arrow send button; the assistant's reply opens with a dark rounded pill of a white arc spinner and 'Running' (no percentage, queue position or bar) and is then swapped in place for the finished image (adapted to 10: the pill stays until the last of ten pictures has dropped into the reply, one at a time in strict order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=pNbEdIimf0s', retrieved: '2026-10-14' }],
    extrapolated: "the ten-image reply (the footage's message holds one image), the pill staying while the batch lands and the pictures arriving one at a time rather than the message body swapping once, the prompt text (the footage's names its creator), the user message and Past Chats entries' wording",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'stable-assistant');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-tab on">Chat</div><div class="${P}-tab">About</div><div class="${P}-new">${ICON.pen}New Chat</div><i class="${P}-av"></i></div><div class="${P}-body"><div class="${P}-rail"><b>Past Chats</b><small>Previous 7 days</small><span>Generate an image of cute…</span></div><div class="${P}-main"><div class="${P}-chat"><div class="${P}-msg" style="visibility: hidden"><div class="${P}-hd"><i></i>You<small>10:36 PM</small></div><div class="${P}-tx">${x.esc(PROMPT)}</div></div><div class="${P}-msg bot" style="visibility: hidden"><div class="${P}-hd"><i class="bot"></i>Stable Assistant<small>10:36 PM</small></div><div class="${P}-run"><i class="${P}-arc"></i>Running</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-acts" style="visibility: hidden">${ICON.copy}${ICON.up}${ICON.down}</div></div></div><div class="${P}-comp">${ICON.clip}${ICON.tune}<div class="${P}-in">${x.esc(PROMPT)}</div><div class="${P}-send">${ICON.send}</div></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const [user, bot] = [...root.querySelectorAll(`.${P}-msg`)];
    const run = q(`.${P}-run`), arc = q(`.${P}-arc`), acts = q(`.${P}-acts`), input = q(`.${P}-in`), send = q(`.${P}-send`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const ends = tiles.map((_, i) => ctx.seq(i)[1]);   // picture i drops into the reply here: ten non-overlapping windows

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = t - ctx.cardIn;

        // the send arrow is pressed, and the composer empties into its placeholder as the message goes out
        const sp = press(s, SEND_AT, 0.05, 0.04, 0.12);
        put('send', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.1 * sp).toFixed(4)})` : 'none'; });
        const out = s >= SHOWN;
        put('out', out, (v) => {
          input.textContent = v ? PLACEHOLDER : PROMPT;
          input.style.color = v ? '' : '#eaeaea';
          user.style.visibility = v ? '' : 'hidden';
          bot.style.visibility = v ? '' : 'hidden';
        });

        // the reply's 'Running' pill stays until the last picture has dropped in; its arc turns with t
        const done = t >= ends[9];
        put('run', done, (v) => { run.style.visibility = v ? 'hidden' : ''; acts.style.visibility = v ? '' : 'hidden'; });
        const deg = (((t * 520) % 360) + 360) % 360;
        put('arc', deg.toFixed(0), (d) => { arc.style.transform = `rotate(${d}deg)`; });

        cells.forEach((c, i) => {
          put(`i${i}`, t >= ends[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
