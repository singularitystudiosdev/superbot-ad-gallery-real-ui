// Gencraft, gencraft.com/generate (a tutorial screen recording on YouTube, 2023-11-10, t~66.0-74.0 s; spec
// .tmp/clone-9e82faf1/reveal-refs/gencraft/spec.json, confidence 0.70; frames aa_generating_btn_zoom.png, aa_pending_t69.1.png,
// aa_pending_feed2_t70.5.png, aa_pending_sheet.png). A white app under a dark-navy top bar: a left settings column (prompt, styles,
// models, aspect ratio and a full-width blue GENERATE button) and a large right canvas whose idle state is five action cards. Pressing the
// button turns it pale blue with a spinner and the word 'GENERATING'; ~0.5 s later the canvas clears to a dark headline 'Generating your
// creation...' over a thin (4 px) blue determinate bar with NO percentage, then the line 'See what the community is generating...' and a
// carousel of community posts. The user's own result is not shown while waiting; the finished picture then hard-swaps in, the button
// is blue again and a green 'Successfully generated!' toast appears.
// Adapted to ten images: the finished canvas, a single 4:3 picture with a thumbnail strip in the footage, is a block of 4 + 4 + 2 landscape
// tiles that land one by one in reading order. The community carousel's cards are drawn as neutral gradient cards (never other people's
// pictures or names). Omitted: the logo and wordmark, the prompt meter, the Upgrade button, the Free Plan toast, the Publish / Magic Edit /
// Download action row and the browser chrome (the footage's pictures are never reproduced: every tile is our own meme).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gcf';
const ROOT_H = 424, COLS = 4, LEFT_W = 172, CARD_W = 100, CARD_GAP = 10;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #ffffff; color: #2b3140; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dfe3ea; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 14px; height: 30px; padding: 0 14px; background: #0c1220; font-size: 8px; font-weight: 500; color: #9ba3b4; white-space: nowrap; }
.${P}-top .${P}-cur { color: #ffffff; font-weight: 600; }
.${P}-top i { margin-left: auto; display: flex; align-items: center; box-sizing: border-box; width: 112px; height: 16px; padding: 0 8px; border-radius: 8px; background: #fff; font-style: normal; font-size: 6.5px; font-weight: 400; color: #8b93a3; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 8px 8px 10px; gap: 6px; background: #f5f6f9; }
.${P}-box { flex: none; box-sizing: border-box; padding: 6px 7px; border-radius: 3px; background: #fff; }
.${P}-lab { display: block; height: 9px; font-size: 6.5px; font-weight: 500; line-height: 9px; color: #4a5164; white-space: nowrap; }
.${P}-lab small { font-size: 5.5px; font-weight: 400; color: #98a0ae; }
.${P}-ta { box-sizing: border-box; height: 40px; margin-top: 4px; font-size: 7px; line-height: 10px; color: #2a3142; overflow: hidden; }
.${P}-sw { display: flex; gap: 3px; margin-top: 4px; }
.${P}-sw span { flex: 1; display: grid; place-items: end center; box-sizing: border-box; height: 26px; padding-bottom: 2px; border-radius: 2px; font-size: 4px; font-weight: 600; letter-spacing: -.01em; color: #fff; text-shadow: 0 0 2px rgba(0, 0, 0, .6); overflow: hidden; white-space: nowrap; }
.${P}-sw .${P}-sel { box-shadow: 0 0 0 1.5px #1a79e2; }
.${P}-asp { display: flex; gap: 3px; margin-top: 4px; }
.${P}-asp span { flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; height: 16px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 1px #dfe3ea; font-size: 5.5px; color: #4a5164; white-space: nowrap; }
.${P}-asp span::before { content: ""; width: 5px; height: 5px; box-sizing: border-box; border: 1px solid #5b6475; border-radius: 1px; }
.${P}-go { position: relative; margin-top: auto; flex: none; display: grid; place-items: center; box-sizing: border-box; height: 24px; border-radius: 4px; background: #1f7cf0; font-size: 8px; font-weight: 700; letter-spacing: .02em; color: #fff; }
.${P}-go b { grid-area: 1 / 1; display: flex; align-items: center; gap: 4px; font-weight: 700; }
.${P}-spin { display: block; box-sizing: border-box; width: 8px; height: 8px; border-radius: 50%; border: 1.4px solid rgba(255, 255, 255, .45); border-top-color: #fff; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-idle { position: absolute; left: 22px; right: 22px; top: 50%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; transform: translateY(-50%); }
.${P}-ic { box-sizing: border-box; height: 74px; padding: 9px 10px; border-radius: 4px; background: #fff; box-shadow: 0 1px 4px rgba(30, 40, 70, .14); font-size: 6px; line-height: 8px; color: #8b93a3; }
.${P}-ic b { display: block; margin-bottom: 3px; font-size: 7.5px; line-height: 10px; color: #3b4357; }
.${P}-ic i { display: block; width: 14px; height: 14px; margin-bottom: 6px; border-radius: 3px; box-shadow: inset 0 0 0 1.2px #b06fd8; }
.${P}-ic.${P}-hot { box-shadow: 0 0 0 1px #6cb3f5, 0 1px 4px rgba(30, 40, 70, .14); }
.${P}-pn { position: absolute; inset: 0; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 40px; text-align: center; font-size: 10px; font-weight: 600; line-height: 14px; color: #2b3140; }
.${P}-bar { position: absolute; left: 20px; right: 20px; top: 66px; height: 4px; border-radius: 2px; background: #f5f5f5; overflow: hidden; }
.${P}-bar i { display: block; height: 100%; width: 0; border-radius: 2px; background: #3e90de; }
.${P}-cm { position: absolute; left: 0; right: 0; top: 92px; text-align: center; font-size: 6.5px; line-height: 9px; color: #8b93a3; }
.${P}-vp { position: absolute; left: 50%; top: 110px; width: ${CARD_W * 3 + CARD_GAP * 2}px; height: 170px; margin-left: ${-(CARD_W * 3 + CARD_GAP * 2) / 2}px; overflow: hidden; }
.${P}-tr { display: flex; gap: ${CARD_GAP}px; }
.${P}-pc { flex: none; box-sizing: border-box; width: ${CARD_W}px; height: 166px; padding: 6px; border-radius: 4px; background: #fff; box-shadow: 0 1px 5px rgba(30, 40, 70, .16); }
.${P}-pc div { height: 100px; border-radius: 2px; }
.${P}-pc u { display: block; height: 5px; margin-top: 6px; border-radius: 3px; background: #e6e9ef; text-decoration: none; }
.${P}-pc s { display: block; height: 4px; margin-top: 5px; border-radius: 2px; background: #eef0f4; text-decoration: none; }
.${P}-ar { position: absolute; top: 187px; display: grid; place-items: center; width: 13px; height: 13px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px #dfe3ea, 0 1px 3px rgba(30, 40, 70, .14); font-size: 8px; line-height: 8px; color: #6b7384; }
.${P}-res { position: absolute; left: 16px; right: 16px; top: 22px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 3px; overflow: hidden; background: #f5f5f5; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #f5f5f5; }
.${P}-ok { position: absolute; right: 8px; top: 8px; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 18px; padding: 0 9px; border-radius: 3px; background: #ffffff; box-shadow: 0 0 0 1px #d8eadc, 0 2px 8px rgba(30, 60, 40, .18); font-size: 6.5px; color: #2f6b3d; white-space: nowrap; }
.${P}-ok::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #3fb865; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, bright colours';
const STYLES = [['Anime', '#c9774e', '#3b2a5a'], ['Cyberpunk', '#1fb5d8', '#6b2a8f'], ['Realistic', '#8a8f98', '#33363c'], ['Video Game', '#3a4a9a', '#12182e'], ['3D', '#d46ac4', '#4a2f8a'], ['Isometric', '#41c7c0', '#8a3a9c']];
const MODELS = [['#2d8a6a', '#12342a'], ['#e0885a', '#7a2f52'], ['#9a9288', '#4a443e'], ['#6a5a9a', '#2a2448']];
const CARDS = [['#e98f6a', '#7a3c6a'], ['#5fb5c9', '#2d4a8a'], ['#c9b05a', '#6a3a2a'], ['#8f6ad9', '#2a2a6a'], ['#6ac98f', '#2a5a5a'], ['#d96a8f', '#5a2a4a']];
const IDLE = [['Image Gen', 'Express your visuals'], ['My Models', 'Train your own models'], ['Add Image Reference', 'Mirror the structure of an uploaded image'], ['Photobooth', 'Upload a photo of yourself'], ['Magic Edit', 'Make changes to your generations']];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses GENERATE
const BTN = 0.12;                                 // the button turns pale blue and reads GENERATING with its spinner
const CLEAR = 0.3;                                // the five action cards give way to the headline, the bar and the carousel
const LAND = Array.from({ length: 10 }, (_, i) => 0.9 + i * (REF - 0.9) / 9);   // tile i lands in the canvas (reading order), the last at 1.84
const STEP = [0.5, 0.7];                          // the carousel advances by one post at each of these

export default {
  id: 'gencraft',
  label: 'Gencraft (2023)',
  source: {
    platform: 'Gencraft web app, gencraft.com/generate (desktop browser, light theme; a tutorial screen recording on YouTube, 2023-11-10)',
    feature: "GENERATE turns pale blue and reads 'GENERATING' with a spinner; the white canvas shows a dark headline 'Generating your creation...' over a thin blue determinate bar (no percentage), the line 'See what the community is generating...' and a carousel of cards, then the finished picture hard-swaps in with a green 'Successfully generated!' toast (adapted to 10: a 4 + 4 + 2 block of landscape tiles landing in reading order; the carousel cards are neutral gradient cards; the logo, prompt meter, Upgrade button and Free Plan toast are omitted)",
    refs: [{ url: 'https://gencraft.com/generate', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten tiles: the footage ends on one 4:3 picture with a thumbnail strip and a "1 of 2" control, so the 4 + 4 + 2 block of 4:3 tiles landing one by one in reading order is extrapolated; the slots not yet landed are faint #F5F5F5 rectangles',
      'the bar fill: it crawls left to right in the footage with no number; its mapping to the 0.9 s before the first tile (a smooth fill to ~96%) and the carousel advancing by one card at two set moments are drawn, not measured',
      "the carousel's cards: the footage shows other users' posts (picture, avatar, name, caption, Like and Comment buttons), drawn here as neutral gradient cards with grey skeleton lines",
      'the idle canvas of five action cards (Image Gen, My Models, Add Image Reference, Photobooth, Magic Edit) and the left column are drawn at reduced detail from the footage',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'gencraft');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-pend"></div></div>`;
    const gr = (a, b) => `background: linear-gradient(160deg, ${a}, ${b})`;
    const styleSw = STYLES.map(([n, a, b]) => `<span style="${gr(a, b)}">${n}</span>`).join('');
    const modelSw = MODELS.map(([a, b], i) => `<span${i === 0 ? ` class="${P}-sel"` : ''} style="${gr(a, b)}"></span>`).join('');
    const idle = IDLE.map(([n, d], i) => `<div class="${P}-ic${i === 0 ? ` ${P}-hot` : ''}"><i></i><b>${n}</b>${d}</div>`).join('');
    const posts = CARDS.map(([a, b]) => `<div class="${P}-pc"><div style="${gr(a, b)}"></div><u></u><s></s><s style="width: 70%"></s></div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-cur">Generate</span><span>Explore</span><span>My Library</span><i>Look up username</i></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-box"><span class="${P}-lab">Describe your creation in detail</span><div class="${P}-ta">${x.esc(PROMPT)}</div></div><div class="${P}-box"><span class="${P}-lab">Select Style <small>(Optional)</small></span><div class="${P}-sw">${styleSw}</div></div><div class="${P}-box"><span class="${P}-lab">Select Model</span><div class="${P}-sw">${modelSw}</div></div><div class="${P}-box"><span class="${P}-lab">Aspect Ratio</span><div class="${P}-asp"><span>Square 1:1</span><span>Landscape 4:3</span><span>Portrait 3:4</span></div></div><div class="${P}-go"><b class="${P}-gl">GENERATE</b><b class="${P}-gp" style="display: none"><i class="${P}-spin"></i>GENERATING</b></div></div><div class="${P}-cv"><div class="${P}-idle">${idle}</div><div class="${P}-pn" style="display: none"><div class="${P}-hd">Generating your creation...</div><div class="${P}-bar"><i></i></div><div class="${P}-cm">See what the community is generating...</div><div class="${P}-vp"><div class="${P}-tr">${posts}</div></div><div class="${P}-ar" style="left: 16px">‹</div><div class="${P}-ar" style="right: 16px">›</div></div><div class="${P}-res" style="visibility: hidden"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-ok" style="display: none">Successfully generated!</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), gl = root.querySelector(`.${P}-gl`), gp = root.querySelector(`.${P}-gp`), spin = root.querySelector(`.${P}-spin`);
    const idleEl = root.querySelector(`.${P}-idle`), pn = root.querySelector(`.${P}-pn`), fill = root.querySelector(`.${P}-bar i`), tr = root.querySelector(`.${P}-tr`);
    const res = root.querySelector(`.${P}-res`), ok = root.querySelector(`.${P}-ok`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // GENERATE is pressed, then it reads GENERATING (pale blue, spinner) until the last tile has landed
        const pr = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', pr.toFixed(3), () => { go.style.transform = pr > 0 ? `scale(${(1 - 0.04 * pr).toFixed(4)})` : 'none'; });
        const busy = s >= BTN && s < LAND[9];
        put('btn', busy, (v) => { go.style.background = v ? '#afc6f9' : ''; gl.style.display = v ? 'none' : ''; gp.style.display = v ? '' : 'none'; });
        const deg = (((t * 540) % 360) + 360) % 360;   // the spinner turns with t alone
        put('deg', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // canvas: the five action cards, then the pending screen, then the finished tiles
        const waiting = s >= CLEAR && s < LAND[0];
        put('idle', s < CLEAR, (v) => { idleEl.style.display = v ? '' : 'none'; });
        put('pn', waiting, (v) => { pn.style.display = v ? '' : 'none'; });
        put('res', s >= LAND[0], (v) => { res.style.visibility = v ? '' : 'hidden'; });

        // the thin blue determinate bar crawls left to right (no number); the carousel moves on by one post twice
        const f = 0.04 + 0.92 * seg(s, CLEAR, LAND[0]);
        put('bar', f.toFixed(3), () => { fill.style.width = `${(f * 100).toFixed(1)}%`; });
        const idx = STEP.filter((a) => s >= a).length;
        put('car', idx, (v) => { tr.style.transform = v ? `translateX(${-v * (CARD_W + CARD_GAP)}px)` : 'none'; });

        // each tile lands in one step; the toast shows once the last has
        cells.forEach((c, i) => {
          const v = s >= LAND[i];
          put(`i${i}`, v, (d) => { c.im.style.visibility = d ? '' : 'hidden'; c.pend.style.display = d ? 'none' : ''; });
        });
        put('ok', s >= LAND[9], (v) => { ok.style.display = v ? '' : 'none'; });
      },
    };
  },
};
