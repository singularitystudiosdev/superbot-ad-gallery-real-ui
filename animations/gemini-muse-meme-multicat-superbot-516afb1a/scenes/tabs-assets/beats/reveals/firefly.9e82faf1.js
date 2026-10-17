// A light-theme 'Generate' page of a creative-suite text-to-image tool (the screen recordings under
// .tmp/clone-9e82faf1/reveal-refs/firefly, spec confidence 0.50): a cream #FCF6EE page, a left 'General settings' rail
// (a model dropdown, aspect ratio, a visual-intensity slider and a dashed 'Reference images' add tile), a result canvas in the
// middle and a bottom prompt bar with a 'Complimentary' chip and a blue Generate button that dims while a job runs. While it
// generates the canvas holds FLAT light-grey rounded rectangles (#E2E2E2) exactly where the images will land, with no
// shimmer, glyph, text, spinner or percentage, and they are replaced by the images in one frame (no fade). For ten images the
// canvas is a grid of ten such slots that swap in reading order. The product name is plain text; no logo is drawn. Omitted: the top bar's 'Upgrade' pill (an upsell control, pin p5), so the three tabs sit centred in the bar. The tab classes are prefixed because the host's `#s-tabs .tab` browser-tab rules would otherwise pin them.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ff';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 0 12px 12px; border-radius: 12px; background: #fcf6ee; color: #2c2c2c; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px #eadfce; }
.${P}-top { display: flex; align-items: center; gap: 12px; height: 30px; font-size: 10px; color: #6e6e6e; white-space: nowrap; }
.${P}-top b { font-size: 11px; color: #2c2c2c; }
.${P}-bk, .${P}-sp { flex: 1; min-width: 0; }
.${P}-tb { margin: 0 6px; }
.${P}-tb-on { color: #2c2c2c; font-weight: 600; box-shadow: 0 2px 0 #2c2c2c; }
.${P}-body { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 10px; }
.${P}-rail { box-sizing: border-box; padding: 9px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #eadfce; font-size: 9px; color: #6e6e6e; }
.${P}-rail h5 { margin: 0 0 7px; font: 600 10px/13px ${UI_FONT}; color: #2c2c2c; }
.${P}-f { margin-bottom: 7px; }
.${P}-f u { display: block; text-decoration: none; margin-top: 2px; height: 19px; padding: 0 7px; border-radius: 5px; background: #f4f0ea; box-shadow: inset 0 0 0 1px #e1d9cd; font-size: 8.5px; line-height: 19px; color: #2c2c2c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-f i { display: block; position: relative; height: 3px; margin: 8px 0 3px; border-radius: 2px; background: #e1d9cd; }
.${P}-f i::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 40%; border-radius: 2px; background: #2c2c2c; }
.${P}-add { display: grid; place-items: center; height: 34px; margin-top: 4px; border-radius: 6px; border: 1.5px dashed #cfc5b6; font-size: 14px; color: #9a9184; }
.${P}-cv { min-width: 0; box-sizing: border-box; padding: 9px; border-radius: 14px; background: #fff; box-shadow: 0 0 0 1px #eadfce; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-s { position: relative; aspect-ratio: 870 / 1024; border-radius: 8px; overflow: hidden; background: #e2e2e2; }
.${P}-s img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-bar { display: flex; align-items: center; gap: 8px; height: 36px; margin-top: 10px; padding: 0 5px 0 12px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px #e1d9cd; }
.${P}-pt { flex: 1; min-width: 0; font-size: 10px; color: #2c2c2c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-ch { flex: none; padding: 3px 8px; border-radius: 999px; background: #f1ece3; font-size: 8.5px; color: #6e6e6e; }
.${P}-go { flex: none; height: 26px; padding: 0 13px; border-radius: 13px; background: #3b63fb; font-size: 10px; font-weight: 600; line-height: 26px; color: #fff; }
.${P}-go.busy { background: #aebdf6; }
`;

export default {
  id: 'firefly',
  label: 'Firefly',
  source: {
    platform: 'Adobe Firefly web app, Generate image page (2026 light theme)',
    feature: 'Text-to-image: the result canvas holds flat grey rounded placeholders with no text or spinner, which hard-swap to the images (adapted to 10)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=-Vk7h_URJTs', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=7CS_CEouqo0', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'firefly');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-bk">‹ Generate image</span><span class="${P}-tb">Gallery</span><span class="${P}-tb ${P}-tb-on">Generate</span><span class="${P}-tb">Edit</span><span class="${P}-sp"></span></div><div class="${P}-body"><div class="${P}-rail"><h5>General settings</h5><div class="${P}-f">Model<u>Image model 5</u></div><div class="${P}-f">Aspect ratio<u>Portrait (870:1024)</u></div><div class="${P}-f">Visual intensity<i></i></div><div class="${P}-f">Reference images (0/4)<div class="${P}-add">+</div></div></div><div class="${P}-cv"><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-s"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`).join('')}</div></div></div><div class="${P}-bar"><span class="${P}-pt">a cheerful ghost holding a handwritten note in a lecture hall</span><span class="${P}-ch">Complimentary</span><span class="${P}-go">Generate</span></div></div>`);
    const go = root.querySelector(`.${P}-go`);
    const slots = [...root.querySelectorAll(`.${P}-s img`)].map((im) => ({ im, shown: null }));
    ctx.gate(slots.map((s) => s.im));
    let busy = null;

    return {
      root,
      render(t) {
        slots.forEach((s, i) => {
          // one frame from the grey rectangle to the image, at the end of the slot
          const on = t >= ctx.seq(i)[1];
          if (on !== s.shown) { s.im.style.display = on ? 'block' : 'none'; s.shown = on; }
          s.im.style.filter = restFilter(tiles[i]);
          s.im.style.transform = restTransform(tiles[i]);
        });
        const b = t < ctx.lastLand;
        if (b !== busy) { go.classList.toggle('busy', b); busy = b; }
      },
    };
  },
};
