// Voila AI Artist, the cartoon-render wait and result screen (Voila AI Artist, iPhone, 2021; YouTube qzTi_PxbeVw 'Voilà AI Artist app -
// how to use? Complete overview', mrhackio, 2021-06-06, t=245-281 s; spec .tmp/clone-9e82faf1/reveal-refs/voila-ai-artist/spec.json;
// frames an_voila_processing_245s.png, an_voila_result_281s.png). Submitting a photo darkens the screen to a near-black veil over a
// blurred copy of the photo, with a close X top-left, the line 'Processing image with standard speed...' centred in white over a thin
// determinate bar (white fill on a #3C3C3C track) that fills in a few seconds. The result then arrives on a black 'Save & Share'
// screen: a back arrow, the title, a home glyph, the picture, and under it 'SHARE TO' over a grid of dark rounded buttons.
// Adapted to ten images: the veil (a plain dark gradient: no photo is reproduced) is up from the card's entrance while the bar fills
// from render(t); it then lifts onto the 'Save & Share' screen, whose picture area is a 5 + 5 block of ten dark panels, and the ten
// pictures land in strict reading order (row 1 left to right, then row 2). The bar is the only thing that moves from t and it is
// full before the first picture lands, so the landed state is static.
// Extrapolated (not witnessed): the ten-picture 5 + 5 block (the app shows one picture with page dots), the veil lifting before the
// pictures rather than the picture simply appearing, and the pictures landing one by one.
// Omitted on purpose: the upsell block under the bar (heading, pitch and the orange pill) and the interstitial the app
// shows before the result (commercial chrome, not the reveal), the app's watermark on the picture and its status bar, and the share
// targets' logos and brand names (the buttons are neutral round glyphs: save, mail, link, message, more).
import { seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-vla';
const ROOT_H = 372, COLS = 5, GAP = 6;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #000000; color: #ffffff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262626; }
.${P}-top { flex: none; position: relative; display: flex; align-items: center; justify-content: space-between; height: 36px; padding: 0 14px; }
.${P}-top svg { display: block; width: 14px; height: 14px; fill: none; stroke: #ffffff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ttl { position: absolute; left: 0; right: 0; top: 0; line-height: 36px; text-align: center; font-size: 13px; font-weight: 700; }
.${P}-main { flex: none; display: flex; justify-content: center; padding: 4px 0 0; }
.${P}-g { width: 448px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; background: #1a1a1a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #1a1a1a; }
.${P}-sh { flex: none; display: flex; align-items: center; gap: 10px; margin: 10px 24px 0; font-size: 10.5px; font-weight: 700; letter-spacing: .4px; }
.${P}-sh i { flex: 1; height: 1px; background: #2a2a2a; }
.${P}-btns { flex: none; display: flex; justify-content: center; gap: 22px; margin-top: 10px; }
.${P}-b { display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 7.5px; font-weight: 700; letter-spacing: .3px; }
.${P}-b i { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #1a1a1a; }
.${P}-b svg { display: block; width: 15px; height: 15px; fill: none; stroke: #ffffff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-veil { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 38%, #262626 0%, #121212 55%, #080808 100%); }
.${P}-x { position: absolute; left: 18px; top: 14px; }
.${P}-x svg { display: block; width: 12px; height: 12px; fill: none; stroke: #bdbdbd; stroke-width: 1.8; stroke-linecap: round; }
.${P}-msg { position: absolute; left: 50%; top: 50%; width: 360px; margin: -26px 0 0 -180px; }
.${P}-msg p { margin: 0 0 12px; text-align: center; font-size: 14px; letter-spacing: .2px; color: #ffffff; }
.${P}-bar { height: 3px; border-radius: 2px; background: #3c3c3c; overflow: hidden; }
.${P}-bar i { display: block; height: 100%; width: 0; border-radius: 2px; background: #ffffff; }
`;

const q3 = (v) => Math.round(v * 1000) / 1000;   // memo keys and the writes they guard use the same rounded value
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const BAR = [0.04, 0.62];                         // the bar fills
const LIFT = [0.72, 0.86];                        // the veil lifts onto the result screen
const LAND = Array.from({ length: 10 }, (_, i) => 0.86 + i * 0.0913);  // tile i is finished (reading order), the last at 1.6817
const FADE = 0.05;                                // a panel's cover thins away over this long before the picture shows
const ICON = {
  save: '<svg viewBox="0 0 16 16"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10"/></svg>',
  mail: '<svg viewBox="0 0 16 16"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5L8 9l5.5-4.5"/></svg>',
  link: '<svg viewBox="0 0 16 16"><path d="M7 9a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4L8.5 3.5M9 7a3 3 0 0 0-4 0L3 9a3 3 0 0 0 4 4l.5-.5"/></svg>',
  msg: '<svg viewBox="0 0 16 16"><path d="M2.5 3.5h11v7h-6L4.5 13v-2.5h-2z"/></svg>',
  more: '<svg viewBox="0 0 16 16"><path d="M3.5 8h.01M8 8h.01M12.5 8h.01" stroke-width="2.6"/></svg>',
};

export default {
  id: 'voila-ai-artist',
  label: 'Voila AI Artist (2021)',
  source: {
    platform: 'Voila AI Artist app, iPhone, cartoon render wait and Save & Share result screen (phone screen recording on YouTube, 2021-06-06)',
    feature: "near-black veil with the line 'Processing image with standard speed...' centred over a determinate white bar on a #3C3C3C track and a close X top-left, lifting onto a black 'Save & Share' screen with a 'SHARE TO' row of dark round buttons (adapted to 10: the picture area is a 5 + 5 block of panels whose pictures land in reading order after the veil lifts; the upsell block, its pill, the interstitial that precedes the result, the watermark and the share targets' logos are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=qzTi_PxbeVw', video: 'qzTi_PxbeVw', published: '2021-06-06', retrieved: '2026-10-14', note: 't=245 s processing veil (bar ~40%), t=250 s (bar ~85%), t=281 s Save & Share screen' }],
    extrapolated: [
      'the ten-picture 5 + 5 landing block and its strict reading order (the app shows one picture with page dots)',
      'the veil lifting before the pictures, and the pictures landing one by one',
      'the blurred photo behind the veil, drawn as a plain dark gradient (no photo is reproduced)',
      'the share row drawn with five neutral round buttons (the app shows six, with the share targets logos)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'voila-ai-artist');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const btn = (n, ic) => `<div class="${P}-b"><i>${ic}</i>${n}</div>`;
    const back = '<svg viewBox="0 0 14 14"><path d="M12.5 7H2M6.5 2.5L2 7l4.5 4.5"/></svg>';
    const home = '<svg viewBox="0 0 14 14"><path d="M1.5 7L7 2l5.5 5M3 6v6h3V9h2v3h3V6"/></svg>';
    const xs = '<svg viewBox="0 0 12 12"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top">${back}<div class="${P}-ttl">Save &amp; Share</div>${home}</div><div class="${P}-main"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-sh"><i></i>SHARE TO<i></i></div><div class="${P}-btns">${btn('SAVE', ICON.save)}${btn('MAIL', ICON.mail)}${btn('LINK', ICON.link)}${btn('MESSAGE', ICON.msg)}${btn('MORE', ICON.more)}</div><div class="${P}-veil"><div class="${P}-x">${xs}</div><div class="${P}-msg"><p>Processing image with standard speed...</p><div class="${P}-bar"><i></i></div></div></div></div>`);
    const veil = root.querySelector(`.${P}-veil`), fill = root.querySelector(`.${P}-bar i`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the determinate bar fills with t
        const f = seg(s, BAR[0], BAR[1]);
        put('bar', (f * 100).toFixed(1), (v) => { fill.style.width = `${v}%`; });

        // the veil lifts onto the result screen
        const lift = q3(outCubic(seg(s, LIFT[0], LIFT[1])));
        put('veil', lift.toFixed(3), () => { if (lift >= 1) { veil.style.display = 'none'; veil.style.opacity = ''; } else { veil.style.display = ''; veil.style.opacity = lift > 0 ? (1 - lift).toFixed(3) : ''; } });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const g = q3(seg(s, a - FADE, a));
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, g.toFixed(3), () => {
            if (g >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = g > 0 ? (1 - g).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
