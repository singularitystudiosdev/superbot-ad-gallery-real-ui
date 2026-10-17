// Meta AI 'Imagine' inside a WhatsApp chat, the light theme on Android (YouTube 8TvniF22MyA, 2024-07-15, t=82.6-85.0 s; spec
// .tmp/clone-9e82faf1/reveal-refs/whatsapp-imagine/spec.json, confidence 0.6; frames m_wa_pending, m_wa_final, m_sheet_reveal). The
// user's 'Imagine ...' prompt is a green outgoing bubble; the reply is an ordinary incoming image bubble that arrives as a heavily
// blurred low-resolution picture with a small dark pill in its centre reading the download size ('71 kB'), then sharpens to full
// resolution over about 1.5-2.5 s while the pill goes away; the assistant's line under it reads 'Here's what I imagined for you. I'm
// also taking a few more seconds to generate a higher resolution image for you...'. No spinner, percentage or bar anywhere.
// Adapted to ten images: ONE album-style incoming bubble holding all ten thumbnails in a 5 x 2 grid, every one arriving blurred with
// its own size pill and then sharpening in strict sequence (one at a time, none overlapping, the finished prefix growing), the caption
// printed once the first one starts to sharpen. Omitted: WhatsApp's doodle wallpaper (a plain tint with a faint dot pattern of our
// own instead), its verified tick, the Meta ring avatar (a neutral round avatar) and the second 'higher resolution' bubble. The
// footage's picture is never reproduced: every tile is our own meme; no logo, wordmark or platform font is drawn (system type, line icons).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wa';
const ROOT_H = 452;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #efeae2; color: #111b21; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d9d4cc; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 8px; height: 52px; padding: 0 12px; background: #ffffff; box-shadow: 0 1px 0 #e4e0d9; }
.${P}-hd svg { display: block; flex: none; width: 18px; height: 18px; fill: none; stroke: #3b4a54; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-av { flex: none; display: block; width: 34px; height: 34px; border-radius: 50%; background: radial-gradient(circle at 36% 32%, #d6dcf5, #8d9ae0 70%, #7280d2); box-shadow: inset 0 0 0 5px #eef0fb; }
.${P}-nm { display: flex; flex-direction: column; gap: 1px; }
.${P}-nm b { font-size: 14.5px; font-weight: 600; line-height: 18px; color: #111b21; }
.${P}-nm span { font-size: 11px; line-height: 13px; color: #667781; }
.${P}-wall { position: relative; flex: 1; min-height: 0; padding: 10px 14px 0; overflow: hidden; background-color: #eee9e1; background-image: radial-gradient(rgba(60, 50, 30, .055) 1.1px, transparent 1.4px); background-size: 15px 15px; }
.${P}-day { display: block; width: fit-content; margin: 0 auto; padding: 3px 9px; border-radius: 7px; background: #ffffff; box-shadow: 0 1px 0 rgba(11, 20, 26, .08); font-size: 10.5px; line-height: 14px; color: #54656f; }
.${P}-me { display: flex; justify-content: flex-end; margin-top: 10px; }
.${P}-out { display: flex; align-items: flex-end; gap: 8px; padding: 5px 7px 4px 9px; border-radius: 8px 0 8px 8px; background: #d9fdd3; box-shadow: 0 1px 0 rgba(11, 20, 26, .1); font-size: 13.5px; line-height: 19px; color: #111b21; }
.${P}-tm { flex: none; display: flex; align-items: center; gap: 3px; font-size: 9.5px; line-height: 12px; color: #667781; white-space: nowrap; }
.${P}-tm svg { display: block; width: 13px; height: 9px; fill: none; stroke: #53bdeb; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-in { margin-top: 8px; width: 430px; max-width: 100%; box-sizing: border-box; padding: 4px; border-radius: 0 8px 8px 8px; background: #ffffff; box-shadow: 0 1px 0 rgba(11, 20, 26, .1); }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 5px; overflow: hidden; background: #c4cfd5; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-sz { position: absolute; inset: 0; display: grid; place-items: center; }
.${P}-sz span { display: flex; align-items: center; gap: 3px; height: 16px; padding: 0 7px 0 6px; border-radius: 8px; background: rgba(28, 30, 33, .66); font-size: 8.5px; font-weight: 500; color: #ffffff; white-space: nowrap; }
.${P}-sz svg { display: block; width: 8px; height: 8px; fill: none; stroke: #ffffff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ca { display: flex; align-items: flex-end; gap: 8px; padding: 5px 4px 1px 4px; font-size: 12.5px; line-height: 17px; color: #111b21; }
.${P}-ca span { flex: 1; }
.${P}-cp { flex: none; display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 10px; background: #efeae2; }
.${P}-cp svg { display: block; flex: none; width: 20px; height: 20px; fill: none; stroke: #667781; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-fl { flex: 1; display: flex; align-items: center; gap: 10px; box-sizing: border-box; height: 40px; padding: 0 12px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 rgba(11, 20, 26, .08); font-size: 14px; color: #667781; }
.${P}-fl b { flex: 1; font-weight: 400; }
.${P}-mic { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #25d366; }
.${P}-mic svg { stroke: #ffffff; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SENT_AT = 0.06;                             // the prompt bubble is sent
const ISSUE = 0.2;                                // the album bubble arrives: ten blurred thumbnails, each with its download pill
const SHARP0 = 0.46;                              // the first thumbnail starts to sharpen
const W = (1.8 - SHARP0) / 10;                    // each thumbnail sharpens over its own slot: ten non-overlapping windows, the last done at 1.8
const BLUR = 9;                                   // px, as drawn on a thumbnail of about 80 px
const SIZES = [71, 64, 58, 77, 69, 62, 73, 66, 60, 75];   // the size each pill reads, kB
const CAPTION = "Here's what I imagined for you. I'm also taking a few more seconds to generate a higher resolution image for you...";
const DL = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.5v6M3.4 5.2 6 7.8l2.6-2.6M1.8 10.2h8.4"/></svg>';
const TICKS = '<svg viewBox="0 0 16 11" aria-hidden="true"><path d="M1 6l3 3L10 2M6.2 8.6 7.4 9.6 14 2"/></svg>';

export default {
  id: 'whatsapp-imagine',
  label: 'WhatsApp Imagine (Meta AI)',
  source: {
    platform: "WhatsApp for Android, the 1:1 chat with the Meta AI assistant, light theme (a tutorial screen recording on YouTube, 2024-07-15)",
    feature: "Meta AI's chat thread in WhatsApp: a header with a round avatar and the assistant's name, a tinted chat wallpaper, the user's green outgoing prompt bubble, then the incoming image bubble arriving blurred and low-res with a centred dark pill reading the download size ('71 kB') and sharpening over ~1.5-2.5 s, with the caption 'Here's what I imagined for you. I'm also taking a few more seconds to generate a higher resolution image for you...' (adapted to 10: ONE album-style incoming bubble holding all ten thumbnails in a 5 x 2 grid, each arriving blurred with its own size pill and sharpening in strict sequence, one at a time; WhatsApp's doodle wallpaper, verified tick and Meta avatar are replaced by neutral stand-ins, and the follow-up higher-resolution bubble is omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=8TvniF22MyA', retrieved: '2026-10-14' },
      { url: 'https://faq.whatsapp.com/666225138813752/', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'whatsapp-imagine');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-sz"><span>${DL}${SIZES[i % SIZES.length]} kB</span></div></div>`;
    const back = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4.5M9.5 4.5 4 10l5.5 5.5"/></svg>';
    const emoji = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M6.6 11.6c.8 1.4 2 2.1 3.4 2.1s2.6-.7 3.4-2.1M7.4 7.6v.4M12.6 7.6v.4"/></svg>';
    const clip = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14.5 8.4 9 13.9a2.3 2.3 0 0 1-3.3-3.3l6-6a3.4 3.4 0 0 1 4.8 4.8l-6.1 6.1"/></svg>';
    const cam = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6.6h2.6L7 4.6h6l1.4 2h2.6V15H3z"/><circle cx="10" cy="10.6" r="2.7"/></svg>';
    const mic = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7.4" y="2.6" width="5.2" height="9" rx="2.6"/><path d="M4.6 9.6a5.4 5.4 0 0 0 10.8 0M10 15v2.6"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${back}<i class="${P}-av"></i><div class="${P}-nm"><b>Meta AI</b><span>with Llama 3</span></div></div><div class="${P}-wall"><span class="${P}-day">Today</span><div class="${P}-me" style="visibility: hidden"><div class="${P}-out">Imagine ten Muse memes<span class="${P}-tm">10:22 am${TICKS}</span></div></div><div class="${P}-in" style="visibility: hidden"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-ca" style="visibility: hidden"><span>${x.esc(CAPTION)}</span><span class="${P}-tm" style="flex: none">10:22 am</span></div></div></div><div class="${P}-cp"><div class="${P}-fl">${emoji}<b>Message</b>${clip}${cam}</div><div class="${P}-mic">${mic}</div></div></div>`);
    const me = root.querySelector(`.${P}-me`), inb = root.querySelector(`.${P}-in`), cap = root.querySelector(`.${P}-ca`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), sz: n.querySelector(`.${P}-sz`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        put('me', s >= SENT_AT, (v) => { me.style.visibility = v ? '' : 'hidden'; });
        put('in', s >= ISSUE, (v) => { inb.style.visibility = v ? '' : 'hidden'; });
        put('ca', s >= SHARP0, (v) => { cap.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          // thumbnail i: blurred with its pill from the album's arrival, then sharpening over its own slot; once sharp the
          // pill is gone (display none) and the image rests in its crop's own CSS
          const a = SHARP0 + i * W;
          const p = seg(s, a, a + W);
          put(`p${i}`, p.toFixed(3), () => {
            if (p >= 1) {
              c.im.style.filter = restFilter(c.g);
              c.im.style.transform = restTransform(c.g);
              c.sz.style.display = 'none'; c.sz.style.opacity = '';
            } else {
              const q = 1 - p;
              c.im.style.filter = `blur(${(BLUR * q).toFixed(2)}px)${c.g.grade ? ' ' + c.g.grade : ''}`;
              c.im.style.transform = `scale(${(c.g.zoom * (1 + 0.14 * q)).toFixed(4)})`;
              const po = 1 - seg(p, 0, 0.45);   // the pill thins away early in the sharpening
              c.sz.style.display = ''; c.sz.style.opacity = po >= 1 ? '' : po.toFixed(3);
            }
          });
        });
      },
    };
  },
};
