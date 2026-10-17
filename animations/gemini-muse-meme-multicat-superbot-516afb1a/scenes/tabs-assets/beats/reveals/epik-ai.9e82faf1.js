// EPIK AI yearbook (2023), the '90s Throwback' AI Yearbook flow in EPIK, SNOW Corporation's photo editor (YouTube euQTVVelvX4,
// mrhackio, 2023-10-07; also uJtvKl3xBcM 2023-10-07 and IHLHDVfzCpc 2023-10-01; spec .tmp/clone-9e82faf1/reveal-refs/epik-ai/spec.json;
// frames an_epik_waiting_208s.png, an_epik_waiting_232s.png, an_epik_result_150s.png, an_epik_option_uploading_202s.png). After the
// run is started the phone shows a pure black wait screen: a thin green arc spinner, 'Waiting.' with its dots cycling one at a time,
// a green '1011 people in queue' line (the one live number, unchanged across the ~25 s the screen is held), the bell note 'You will
// receive a notification when the photos are finished.' / 'You can quit the app to do other things!' and a dark 'Hide screen' bar.
// There is no percentage, bar or countdown. The recording cuts away before any result lands; the 'My Yearbook' page (a black page, a
// close X and a link glyph, the title, the FAQ line and the package card) is filmed from an earlier take.
// Adapted to ten images: the black wait screen (spinner and dots turning from t) gives way to 'My Yearbook', whose package card holds
// ten tiles in two rows of five, filling one at a time in reading order. Omitted: the option screen ('Sold Out', the Express plan,
// 'Ready in 2 hours' and every price or plan tag), the 'Yearbook Templates' card, the image count and the new-images button, the
// status bar, and the app's logo. Every tile is our own meme; no platform font is drawn (system type).
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-epk';
const ROOT_H = 470, COLS = 5, GAP = 8;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #000000; color: #ffffff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1c1c1f; }
.${P}-pane { position: absolute; inset: 0; box-sizing: border-box; }
.${P}-wait { display: flex; flex-direction: column; align-items: center; padding: 0 28px 24px; text-align: center; }
.${P}-sp { position: relative; flex: none; width: 28px; height: 28px; margin-top: 150px; }
.${P}-trk { position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 0 2px #1d1f1d; }
.${P}-arc { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, rgba(150, 240, 110, 0) 0deg, #9af06e 40deg, #9af06e 110deg, rgba(150, 240, 110, 0) 112deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); }
.${P}-wait h2 { flex: none; margin: 26px 0 0; font-size: 20px; font-weight: 600; line-height: 26px; color: #ffffff; }
.${P}-q { flex: none; margin: 12px 0 0; font-size: 13px; line-height: 18px; color: #9af06e; }
.${P}-note { flex: none; margin: auto 0 0; font-size: 12.5px; line-height: 18px; color: #c9c9cc; }
.${P}-note svg { display: inline-block; width: 13px; height: 13px; margin: 0 5px -2px 0; fill: none; stroke: #e8b84a; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hide { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 100%; height: 46px; margin-top: 16px; border-radius: 8px; background: #161618; font-size: 14.5px; font-weight: 600; color: #ffffff; }
.${P}-done { padding: 0 20px; }
.${P}-top { display: flex; align-items: center; justify-content: space-between; height: 44px; }
.${P}-top svg { display: block; width: 18px; height: 18px; fill: none; stroke: #ffffff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-done h1 { margin: 10px 0 0; font-size: 27px; font-weight: 700; line-height: 34px; color: #ffffff; }
.${P}-faq { margin: 10px 0 0; font-size: 12.5px; line-height: 18px; color: #8a8a90; }
.${P}-faq span { color: #4a7dff; }
.${P}-cap { margin: 14px 0 0; height: 22px; font-size: 14.5px; font-weight: 700; line-height: 22px; color: #ffffff; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; background: #121214; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const OPEN = 0.62;                                // the black wait screen gives way to 'My Yearbook'
const LAND = Array.from({ length: 10 }, (_, i) => 0.78 + i * 0.1);   // tile i fills (reading order), the last at 1.68
const CLOSE = '<svg viewBox="0 0 18 18"><path d="M3.5 3.5l11 11M14.5 3.5l-11 11"/></svg>';
const LINK = '<svg viewBox="0 0 18 18"><path d="M7.6 10.4a3.2 3.2 0 0 0 4.5 0l2.4-2.4a3.2 3.2 0 0 0-4.5-4.5l-.8.8M10.4 7.6a3.2 3.2 0 0 0-4.5 0L3.5 10a3.2 3.2 0 0 0 4.5 4.5l.8-.8"/></svg>';
const BELL = '<svg viewBox="0 0 16 16"><path d="M3.8 11.4h8.4M4.6 11.4V7.2a3.4 3.4 0 0 1 6.8 0v4.2M6.8 13.4h2.4"/></svg>';

export default {
  id: 'epik-ai',
  label: 'EPIK AI yearbook (2023)',
  source: {
    platform: "EPIK - AI Photo Editor phone app (SNOW Corporation), the '90s Throwback' AI Yearbook flow (iOS portrait screen recordings on YouTube, 2023-10)",
    feature: "pure black wait screen: a thin green arc spinner, 'Waiting.' with its dots cycling, a green '1011 people in queue' line, the bell note 'You will receive a notification when the photos are finished.' / 'You can quit the app to do other things!' and a dark 'Hide screen' bar (no percentage, bar or countdown); the 'My Yearbook' page follows with its package card (adapted to 10: the wait screen gives way to the page, whose ten tiles fill one at a time in reading order; the option screen and every price or plan tag are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=euQTVVelvX4', title: '90s AI YEARBOOK in EPIK app - how to create? Full guide (mrhackio)', published: '2023-10-07', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=uJtvKl3xBcM', title: 'How to generate 90s AI Yearbook photos in EPIK app? Guide (mrhackio)', published: '2023-10-07', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=IHLHDVfzCpc', title: 'AI YEARBOOK APP - EPIK - HOW TO USE? FULL OVERVIEW', published: '2023-10-01', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "the landing: the recording cuts away to another app before any result shows, and the 'My Yearbook' page is filmed from an earlier take, so the swap from the wait screen to the page, its timing and ten pictures landing one at a time in reading order are invented; the footage's one package card holds a single large portrait",
      "the package card is reflowed as ten tiles in two rows of five with the caption 'Yearbook package #1' above them (the footage shows one full-width picture and an image count, which is omitted)",
      "'1011 people in queue' is held for the whole wait (it did not change across the ~16 s of footage compared, and no step is invented); the dots cycle 1 -> 3 and the arc turns with t until the last tile lands, then both hold, so the landed state is static (the footage's rates are only described: the arc advances between frames 4 s apart)",
      "the portrait phone screens are reflowed into the 560 px column: the wait screen is stretched to the card width, the page sits on the same black, and the bottom bar of the page is not drawn",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'epik-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-pane ${P}-wait"><div class="${P}-sp"><i class="${P}-trk"></i><i class="${P}-arc"></i></div><h2>Waiting.</h2><div class="${P}-q">1011 people in queue</div><div class="${P}-note">${BELL}You will receive a notification when the photos are finished.<br>You can quit the app to do other things!</div><div class="${P}-hide">Hide screen</div></div><div class="${P}-pane ${P}-done" style="visibility: hidden"><div class="${P}-top">${CLOSE}${LINK}</div><h1>My Yearbook</h1><div class="${P}-faq">Why does my image generation keep failing? - <span>Check the FAQ</span></div><div class="${P}-cap">Yearbook package #1</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const wait = q('wait'), done = q('done'), arc = q('arc'), head = wait.querySelector('h2');
    const thumbs = [...root.querySelectorAll(`.${P}-t img`)];
    ctx.gate(thumbs);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the black wait screen gives way to 'My Yearbook'
        put('open', s >= OPEN, (v) => { wait.style.visibility = v ? 'hidden' : ''; done.style.visibility = v ? '' : 'hidden'; });

        // the arc turns and the dots cycle with t until the last tile lands, then both hold what they reached, so the landed state is static; a function of t alone, shown or not
        const tg = Math.min(t, ctx.cardIn + LAND[LAND.length - 1] * k);
        const deg = Math.round((((tg * 300) % 360) + 360) % 360);
        put('deg', deg, (d) => { arc.style.transform = `rotate(${d}deg)`; });
        const n = (Math.floor(Math.max(0, tg) * 3.4) % 3) + 1;
        put('dots', n, (v) => { head.textContent = 'Waiting' + '.'.repeat(v); });

        // the tiles fill in reading order, each a hard swap
        thumbs.forEach((im, i) => put(`i${i}`, s >= LAND[i], (v) => { im.style.visibility = v ? '' : 'hidden'; }));
      },
    };
  },
};
