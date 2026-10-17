// HuggingChat's image-generation tool call (huggingface.co/chat v0.9.0, a YouTube tutorial 'Tools Available Now In HuggingChat',
// TgcgRo_HrHg, 2024-06-01, t~4:43-4:59; spec .tmp/clone-9e82faf1/reveal-refs/huggingchat/spec.json, confidence 0.62; frames t_003-t_005).
// A near-black chat page: a left rail with a new-chat button and the day's conversations, the thread in the centre, a 'Tools (1)' pill,
// the 'Ask anything' box and a 'Stop generating' button at the bottom. With the Image Generation tool switched on, the assistant's reply
// first shows a small bubble of three animated dots, then a tool-call chip reading 'Calling tool Image Generation' (its label carrying a
// moving sheen), which turns into 'Called tool Image Generation' as the finished picture simply appears in the reply, with the model's
// caption below. There is no placeholder tile, skeleton, blur, percentage or bar.
// Adapted to ten images: the chip is followed by ten pictures landing one after another in a 5 x 2 block (each simply appears, as in the
// footage; a faint empty slot holds its place), the caption and the end of 'Stop generating' arriving after the last. Omitted: the model
// selector and the examples of the empty chat, the presenter's webcam inset and the tools popup. The service's logo and emoji are not
// drawn (the rail has none; the avatar is a plain violet dot), the pictures are never reproduced (every slot is our own meme), the face
// is the system UI face.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hgc';
const COLS = 5, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: 372px; border-radius: 12px; background: #0e1320; color: #dde3ee; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a2232; }
.${P}-side { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: 118px; padding: 10px 8px; background: #0a0e17; }
.${P}-new { flex: none; display: grid; place-items: center; height: 20px; border-radius: 6px; background: #1a2232; font-size: 8px; font-weight: 600; color: #e6ebf5; }
.${P}-day { margin: 12px 0 4px 4px; font-size: 7px; color: #6f7a8f; }
.${P}-conv { flex: none; display: flex; align-items: center; gap: 5px; height: 20px; padding: 0 6px; border-radius: 5px; font-size: 8px; color: #aab3c5; white-space: nowrap; }
.${P}-conv i { flex: none; display: block; width: 7px; height: 7px; border-radius: 2px; background: #3b4560; }
.${P}-conv.on { background: #1c2535; color: #f0f4fb; }
.${P}-conv.on i { background: #7c6cf5; }
.${P}-foot { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-left: 4px; font-size: 7.5px; color: #8d97ab; }
.${P}-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-chat { flex: 1; min-height: 0; box-sizing: border-box; padding: 14px 14px 0 16px; }
.${P}-user { height: 14px; font-size: 8.5px; line-height: 14px; color: #c6cddb; white-space: nowrap; overflow: hidden; }
.${P}-row { position: relative; display: flex; gap: 6px; margin-top: 14px; }
.${P}-av { flex: none; display: block; width: 8px; height: 8px; margin: 6px 0 0 -9px; border-radius: 50%; background: #7c6cf5; }
.${P}-body { position: relative; flex: 1; min-width: 0; }
.${P}-think { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 10px; background: #172033; }
.${P}-think i { display: block; width: 4px; height: 4px; border-radius: 50%; background: #8d97ab; }
.${P}-msg { box-sizing: border-box; padding: 8px; border-radius: 10px; background: #111827; box-shadow: inset 0 0 0 1px #1b2538; }
.${P}-chip { display: flex; align-items: center; gap: 6px; box-sizing: border-box; width: fit-content; height: 20px; padding: 0 8px 0 4px; border-radius: 6px; background: #172033; box-shadow: inset 0 0 0 1px #26324a; font-size: 8px; color: #8b95a9; white-space: nowrap; }
.${P}-chip > i { flex: none; display: block; width: 12px; height: 12px; border-radius: 4px; background: linear-gradient(135deg, #7c3aed, #2563eb); }
.${P}-chip b { font-weight: 700; color: #e9eef8; }
.${P}-chip .calling { background-image: linear-gradient(100deg, #8b95a9 0%, #8b95a9 38%, #f4f7fd 50%, #8b95a9 62%, #8b95a9 100%); background-size: 320% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.${P}-chip .calling b { -webkit-text-fill-color: transparent; color: transparent; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 7px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #131b2b; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #131b2b; }
.${P}-cap { height: 22px; margin-top: 7px; font-size: 8px; line-height: 11px; color: #c1c9d8; overflow: hidden; }
.${P}-bar { flex: none; position: relative; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; padding: 0 12px 10px 14px; }
.${P}-tools { display: flex; align-items: center; justify-content: space-between; height: 16px; font-size: 7.5px; color: #8d97ab; }
.${P}-tools span { display: flex; align-items: center; gap: 4px; }
.${P}-tools span i { display: block; width: 6px; height: 6px; border-radius: 50%; background: #7c6cf5; }
.${P}-stop { box-sizing: border-box; display: flex; align-items: center; gap: 4px; height: 16px; padding: 0 7px; border-radius: 5px; background: #1a2232; box-shadow: inset 0 0 0 1px #2a3550; font-size: 7.5px; color: #dbe2ef; }
.${P}-stop i { display: block; width: 5px; height: 5px; border-radius: 1px; background: #dbe2ef; }
.${P}-in { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 24px; padding: 0 8px; border-radius: 8px; background: #141b2a; box-shadow: inset 0 0 0 1px #232e45; font-size: 8px; color: #6f7a8f; }
.${P}-in i { display: block; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 1.3px #3b4560; }
`;

const USER = 'generate ten images of a muse holding a handwritten note';
const CAPTION = 'Here are ten images of a muse holding a handwritten note in a lecture hall, drawn as meme panels.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const THINK = 0.12;                               // the three-dot bubble appears
const CALLING = 0.44;                             // the reply card opens with 'Calling tool Image Generation'
const CALLED = 0.72;                              // the chip turns to 'Called tool Image Generation' as the first picture is about to land
const STEP = (1.68 - CALLED) / 10;                // picture i lands at CALLED + (i + 1) * STEP: strict order, the last at 1.68
const L = (i) => CALLED + (i + 1) * STEP;
const FADE = 0.05;                                // the slot's cover thins away over this long before the picture lands (the source cuts; this is a hair of softening)

export default {
  id: 'huggingchat',
  label: 'HuggingChat (2024)',
  source: {
    platform: 'HuggingChat web app, huggingface.co/chat v0.9.0, the Image Generation tool (desktop browser, dark theme; a tutorial screen recording on YouTube, 2024-06-01)',
    feature: "dark chat page: after the prompt the assistant shows a three-dot '•••' bubble, then a tool-call chip 'Calling tool Image Generation' with a moving sheen that becomes 'Called tool Image Generation' as the picture appears in the reply (no placeholder, percentage or bar; 'Stop generating' at the bottom-right throughout) (adapted to 10: ten pictures landing in strict order under the chip in a 5 + 5 block; no logo or emoji mark, a plain violet dot as avatar)",
    refs: [{ url: 'https://www.youtube.com/watch?v=TgcgRo_HrHg', retrieved: '2026-10-14' }],
    extrapolated: ['ten pictures in a 5 x 2 block under the chip (the footage shows one square picture above the chip)', 'the faint empty slots that hold the pictures places', 'the caption text, which the footage streams in below the picture'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'huggingchat');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-side"><div class="${P}-new">New chat</div><div class="${P}-day">Today</div><div class="${P}-conv on"><i></i>Muse meme</div><div class="${P}-conv"><i></i>Study notes</div><div class="${P}-foot"><span>Theme</span><span>Models</span><span>Assistants</span><span>Settings</span></div></div><div class="${P}-main"><div class="${P}-chat"><div class="${P}-user">${x.esc(USER)}</div><div class="${P}-row"><i class="${P}-av"></i><div class="${P}-body"><div class="${P}-think" style="display: none"><i></i><i></i><i></i></div><div class="${P}-msg" style="visibility: hidden"><div class="${P}-chip"><i></i><span class="calling">Calling tool <b>Image Generation</b></span><span class="called" style="display: none">Called tool <b>Image Generation</b></span></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-cap" style="visibility: hidden">${x.esc(CAPTION)}</div></div></div></div></div><div class="${P}-bar"><div class="${P}-tools"><span><i></i>Tools (1)</span><div class="${P}-stop"><i></i>Stop generating</div></div><div class="${P}-in">Ask anything<i></i></div></div></div></div>`);
    const think = root.querySelector(`.${P}-think`), dots = [...think.querySelectorAll('i')], msg = root.querySelector(`.${P}-msg`);
    const calling = root.querySelector('.calling'), called = root.querySelector('.called'), cap = root.querySelector(`.${P}-cap`), stop = root.querySelector(`.${P}-stop`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the three-dot bubble, until the reply card opens with the tool chip
        const thinking = s >= THINK && s < CALLING;
        put('thk', thinking, (v) => { think.style.display = v ? '' : 'none'; });
        dots.forEach((d, i) => {
          const a = 0.3 + 0.6 * Math.max(0, Math.sin(((t * 1.5 - i * 0.2) % 1) * Math.PI * 2));
          put(`d${i}`, a.toFixed(2), (v) => { d.style.opacity = v; });
        });
        put('msg', s >= CALLING, (v) => { msg.style.visibility = v ? '' : 'hidden'; });

        // 'Calling tool' (its label carries a sheen sweeping with t) turns to 'Called tool'
        const done = s >= CALLED;
        put('chip', done, (v) => { calling.style.display = v ? 'none' : ''; called.style.display = v ? '' : 'none'; });
        const sh = (((t * 0.9) % 1) + 1) % 1;
        put('sh', sh.toFixed(2), (v) => { calling.style.backgroundPosition = `${(v * 100).toFixed(0)}% 0`; });

        cells.forEach((c, i) => {
          const a = L(i), f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.backgroundColor = ''; } else { c.cv.style.display = ''; c.cv.style.backgroundColor = f > 0 ? `rgba(19, 27, 43, ${(1 - f).toFixed(3)})` : ''; }
          });
        });

        // the caption and the end of 'Stop generating' follow the last picture
        const end = s >= L(9);
        put('end', end, (v) => { cap.style.visibility = v ? '' : 'hidden'; stop.style.visibility = v ? 'hidden' : ''; });
      },
    };
  },
};
