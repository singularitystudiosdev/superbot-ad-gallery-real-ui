// Lovart, the AI design agent, generating a poster in its web canvas workspace (lovart.ai; a desktop Chrome screen recording on YouTube,
// 'Design Agent Walkthrough - Lovart AI', WhsyuggYep0, published 2025-05-16, t~136-158 s; spec .tmp/clone-9e82faf1/reveal-refs/lovart/spec.json,
// confidence 0.62; frames aq_lovart_t143/t148/t152/t157/t158). A light two-pane workspace: on the left the design canvas, a pale grey field with
// 'Untitled' (a chevron) in the top bar and one blank white artboard card; on the right the agent chat panel, a white column carrying the agent's
// restated brief as a pale bubble, then the tool card: a pale-green rounded panel with a green pill ('Poster Gen' with a small palette glyph), the
// state word under it ('Executing', then 'Generating image: <poster title>', then 'Thinking ...'), a portrait sage-green (#B7C79E) tile with a soft
// diagonal gradient (no spinner, no percentage, no text) and, under the card, a footer: a small round agent dot that turns beside 'Generating
// Posters ...', and a right-aligned line with a live mm:ss timer counting up next to the static 'Estimated time: 2 minutes'. The composer
// ('Please enter your design requirements...', a + and a globe button, a black square stop/send button) sits at the bottom. The canvas artboard stays
// blank until the poster is done; then it fills.
// Adapted to ten images: the wait is the footage's pending screen from render(t) (the state word advancing, the timer counting 00:01 -> 01:24 and the
// agent dot turning), then the artboard fills with a 5 x 2 board of ten posters landing one after another in strict reading order while the timer
// holds its last reading and the dot stops turning once the last one is down. Omitted: the logo, the 'Discord' button, the account avatar, any plan or
// credit chrome, the browser window, and the zoom readout (it is the canvas zoom, not progress, and is not drawn). The footage's poster is never
// reproduced: every cell is our own meme, and no logo, wordmark or platform font is drawn (plain glyphs, plain boxes, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lov';
const ROOT_H = 392, PANE_W = 224, COLS = 5;
const INK = '#1d1f1c', MUTED = '#8a8d86', GREEN = '#6f8f35';
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #efeff3; color: ${INK}; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e1e1e8; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-top { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 12px; font-size: 8px; font-weight: 500; color: #2c2e2a; white-space: nowrap; }
.${P}-top svg { flex: none; width: 7px; height: 7px; fill: none; stroke: #6b6e68; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top svg.${P}-chev { width: 6px; height: 6px; }
.${P}-art { position: absolute; left: 12px; right: 12px; top: 50%; box-sizing: border-box; height: 168px; margin-top: -76px; padding: 8px; border-radius: 6px; background: #fff; box-shadow: 0 0 0 1px #e4e4ea, 0 1px 4px rgba(30, 30, 50, .05); display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 5px; }
.${P}-c { position: relative; min-width: 0; min-height: 0; border-radius: 3px; overflow: hidden; }
.${P}-c img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-wh { position: absolute; inset: 0; background: #fff; }
.${P}-pane { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANE_W}px; padding: 8px 10px 10px; background: #fff; box-shadow: -1px 0 0 #e6e6ec; }
.${P}-ph { flex: none; display: flex; align-items: center; gap: 5px; height: 14px; font-size: 7.5px; font-weight: 700; color: #232521; white-space: nowrap; }
.${P}-ph i { flex: none; width: 3px; height: 3px; border-radius: 50%; background: #1d1f1c; }
.${P}-ph b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
.${P}-ph svg { flex: none; width: 7px; height: 7px; fill: none; stroke: #4a4d47; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-say { flex: none; box-sizing: border-box; height: 50px; margin-top: 6px; padding: 5px 7px; border-radius: 7px; background: #f6f6f7; font-size: 7px; line-height: 10px; color: #2c2e2a; overflow: hidden; }
.${P}-card { flex: none; box-sizing: border-box; height: 168px; margin-top: 8px; padding: 7px 8px 0; border-radius: 8px; background: #f4f7ef; box-shadow: inset 0 0 0 1px #e7eddc; }
.${P}-pill { display: inline-flex; align-items: center; gap: 4px; height: 13px; padding: 0 7px 0 5px; border-radius: 7px; background: #fff; font-size: 7.5px; font-weight: 600; color: ${GREEN}; white-space: nowrap; }
.${P}-pill svg { width: 7px; height: 7px; fill: none; stroke: ${GREEN}; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-state { height: 12px; margin-top: 6px; padding-left: 2px; font-size: 7.3px; line-height: 12px; font-weight: 600; color: #888b84; white-space: nowrap; overflow: hidden; }
.${P}-state b { font-weight: 700; color: #2a2c28; }
.${P}-ph1 { box-sizing: border-box; width: 88px; height: 105px; margin-top: 6px; border-radius: 7px; background: linear-gradient(135deg, #c6d3b0 0%, #b7c79e 48%, #a9bc8c 100%); }
.${P}-note { margin-top: 8px; padding: 0 2px; font-size: 7px; line-height: 10px; color: #2c2e2a; overflow: hidden; }
.${P}-foot { flex: none; display: flex; align-items: center; gap: 5px; height: 14px; margin: 9px 0 0 2px; font-size: 8px; font-weight: 700; color: ${INK}; white-space: nowrap; }
.${P}-dot { flex: none; position: relative; display: block; width: 11px; height: 11px; border-radius: 50%; background: #1d1f1c; }
.${P}-dot::after { content: ""; position: absolute; left: 2px; top: 2px; width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.3px solid transparent; border-top-color: #eceee8; border-right-color: #9a9d97; }
.${P}-eta { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 4px; height: 12px; margin: 3px 0 0; font-size: 7px; color: ${MUTED}; white-space: nowrap; }
.${P}-eta em { font-style: normal; }
.${P}-eta span { font-variant-numeric: tabular-nums; color: #2c2e2a; }
.${P}-comp { flex: none; box-sizing: border-box; margin-top: auto; height: 48px; padding: 7px 8px 0; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #e8e8ee, 0 1px 3px rgba(30, 30, 50, .05); }
.${P}-comp > span { display: block; height: 11px; font-size: 7px; line-height: 11px; color: #b0b2ab; white-space: nowrap; }
.${P}-cb { display: flex; align-items: center; gap: 5px; height: 16px; margin-top: 5px; }
.${P}-cb i { display: grid; place-items: center; box-sizing: border-box; width: 13px; height: 13px; border-radius: 50%; box-shadow: 0 0 0 1px #e1e1e7; }
.${P}-cb i svg { width: 7px; height: 7px; fill: none; stroke: #6b6e68; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cb u { margin-left: auto; display: grid; place-items: center; width: 13px; height: 13px; border-radius: 4px; background: #111; text-decoration: none; }
.${P}-cb u::after { content: ""; display: block; width: 4px; height: 4px; border-radius: 1px; background: #fff; }
`;

const PROMPT = 'Create a poster set of a muse holding a handwritten note, meme style';
const TITLE = 'Muse Meme Poster Set';
const REPLY = "I'll create a set of ten meme posters of a muse holding a handwritten note. The design keeps a bright, bold meme look with limited colours.";
const DONE_MSG = "I've created ten meme posters of a muse holding a handwritten note. They are on the canvas, ready to review.";
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const CARD_AT = 0.04;                             // the tool card (pill, state word, tile, footer) appears
const GEN_AT = 0.34;                              // 'Executing' gives way to 'Generating image: <title>'
const DONE_AT = 0.98;                             // generation is done: 'Thinking ...', the timer holds its last reading, the artboard starts to fill
const LAND = Array.from({ length: 10 }, (_, i) => 1.04 + i * 0.0889);   // poster i lands on the artboard (reading order, row by row), the last at 1.84
const FADE = 0.06;                                // a poster fades up over this long before it rests
const T0 = 1, T1 = 84;                            // the timer: 00:01 at the card, 01:24 when generation is done (the footage's clock runs ~4.2x its footage seconds)
const SPIN = 520;                                 // degrees per layout second of the agent dot

const mmss = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

export default {
  id: 'lovart',
  label: 'Lovart design agent (2025)',
  source: {
    platform: "Lovart web app (lovart.ai) in desktop Chrome (light canvas workspace with a right-hand agent chat panel; a YouTube screen-recording walkthrough, 'Design Agent Walkthrough - Lovart AI', 1920x1080, t~136-158 s)",
    feature: "the agent's 'Poster Gen' tool card in the chat: a green pill, the state word advancing 'Executing' -> 'Generating image: <title>' -> 'Thinking ...', a portrait sage-green (#B7C79E) gradient tile (no spinner or percentage), the footer 'Generating Posters ...' with a turning agent dot and a right-aligned mm:ss timer beside the static 'Estimated time: 2 minutes'; the canvas artboard stays a blank white card until the poster lands; 'Please enter your design requirements...' composer with + / globe / send",
    refs: [{ url: 'https://www.youtube.com/watch?v=WhsyuggYep0', retrieved: '2026-10-14' }],
    videoIds: ['WhsyuggYep0'],
    dates: { published: '2025-05-16', retrieved: '2026-10-14' },
    extrapolated: [
      'ten posters instead of the footage\'s one: the artboard becomes a 5 x 2 board of ten cells, each landing in strict reading order (row by row), extrapolated from the single poster that lands on the footage\'s artboard',
      'the timer holds its last reading (01:24) from the moment generation is done instead of being replaced by a fresh 00:00 timer for the next agent step',
      "the footage's second status ('Thinking ...') sits under the pill here, and the footer flips to it once the last poster is down; the footage shows the footer flip",
      "the pale-green card keeps its tool pill after landing and the sage tile gives way to the agent's completion line, since the finished poster itself lives on the canvas",
      "the poster title under 'Generating image:' is our own prompt as a title; the timer's pace (00:01 -> 01:24) is the footage's, and its true wall-clock rate is unknown",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'lovart');
    const cell = (g, i) => `<div class="${P}-c"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-wh"></div></div>`;
    const sv = (d) => `<svg viewBox="0 0 12 12">${d}</svg>`;
    const palette = sv('<path d="M6 1.4a4.6 4.6 0 1 0 0 9.2c.9 0 1.2-.6.9-1.2-.4-.8.1-1.5.9-1.5h1a1.5 1.5 0 0 0 1.5-1.5C10.3 3.3 8.5 1.4 6 1.4z"/><circle cx="3.8" cy="5.3" r=".5"/><circle cx="5.7" cy="3.6" r=".5"/><circle cx="8" cy="4.2" r=".5"/>');
    const globe = sv('<circle cx="6" cy="6" r="4.6"/><path d="M1.4 6h9.2M6 1.4c-2.2 2.4-2.2 6.8 0 9.2M6 1.4c2.2 2.4 2.2 6.8 0 9.2"/>');
    const plus = sv('<path d="M6 2.4v7.2M2.4 6h7.2"/>');
    const file = sv('<path d="M3 1.6h4l2.2 2.2v6.6H3z"/>');
    const chev = `<svg class="${P}-chev" viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>`;
    const hd = sv('<circle cx="6" cy="6" r="4.6"/><path d="M6 3.6V6l1.6 1"/>') + sv('<circle cx="3" cy="6" r="1.2"/><circle cx="9" cy="3" r="1.2"/><circle cx="9" cy="9" r="1.2"/><path d="M4 5.4l4-1.8M4 6.6l4 1.8"/>');
    const root = x.el(`<div class="${P}"><div class="${P}-cv"><div class="${P}-top">${file}<span>Untitled</span>${chev}</div><div class="${P}-art">${tiles.map(cell).join('')}</div></div><div class="${P}-pane"><div class="${P}-ph"><i></i><b>${x.esc(PROMPT)}</b>${hd}</div><div class="${P}-say">${x.esc(REPLY)}</div><div class="${P}-card" style="visibility: hidden"><span class="${P}-pill">${palette}<span>Poster Gen</span></span><div class="${P}-state"></div><div class="${P}-ph1"></div><div class="${P}-note" style="display: none">${x.esc(DONE_MSG)}</div></div><div class="${P}-foot" style="visibility: hidden"><i class="${P}-dot"></i><span>Generating Posters ...</span></div><div class="${P}-eta" style="visibility: hidden"><span>00:01</span><em>Estimated time: 2 minutes</em></div><div class="${P}-comp"><span>Please enter your design requirements...</span><div class="${P}-cb"><i>${plus}</i><i>${globe}</i><u></u></div></div></div></div>`);
    const q = (sel) => root.querySelector(sel);
    const card = q(`.${P}-card`), state = q(`.${P}-state`), tile = q(`.${P}-ph1`), note = q(`.${P}-note`);
    const foot = q(`.${P}-foot`), dot = q(`.${P}-dot`), footTxt = foot.querySelector('span'), eta = q(`.${P}-eta`), tm = eta.querySelector('span');
    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({ im: n.querySelector('img'), wh: n.querySelector(`.${P}-wh`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const sc = Math.min(Math.max(s, 0), LAND[9]);  // the agent dot turns until the last poster lands, then stops

        // the tool card and its footer appear; the state word advances Executing -> Generating image -> Thinking
        const on = s >= CARD_AT;
        put('card', on, (v) => { const vis = v ? 'visible' : 'hidden'; card.style.visibility = vis; foot.style.visibility = vis; eta.style.visibility = vis; });
        const st = s >= DONE_AT ? 2 : s >= GEN_AT ? 1 : 0;
        put('state', st, (v) => { state.innerHTML = v === 0 ? 'Executing' : v === 1 ? `Generating image: <b>${x.esc(TITLE)}</b>` : 'Thinking ...'; });

        // the sage tile is the placeholder until the posters are down; then the agent's completion line stands in its place
        const fin = s >= LAND[9];
        put('fin', fin, (v) => { tile.style.display = v ? 'none' : ''; note.style.display = v ? '' : 'none'; footTxt.textContent = v ? 'Thinking ...' : 'Generating Posters ...'; });

        // the timer counts up from the card and holds its last reading once generation is done
        const n = T0 + Math.floor(seg(s, CARD_AT, DONE_AT) * (T1 - T0));
        put('tm', n, (v) => { tm.textContent = mmss(v); });

        // the agent dot turns with t (a function of t alone); it stops with the last poster
        const deg = ((sc * SPIN) % 360).toFixed(1);
        put('dot', deg, (d) => { dot.style.transform = `rotate(${d}deg)`; });

        // the artboard: blank white until generation is done, then each poster's white cover thins away in reading order
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.wh.style.display = 'none'; c.wh.style.opacity = ''; } else { c.wh.style.display = ''; c.wh.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
