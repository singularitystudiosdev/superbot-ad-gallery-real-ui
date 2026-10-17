// Shutterstock's 2023 AI image generate view (shutterstock.com generate, two YouTube screen recordings: rUpCe57YDuQ 2023-03-09, t~144-149 s,
// and dmUx6MGqYnU 2023-04-22, t~33-35 s; spec .tmp/clone-9e82faf1/reveal-refs/shutterstock-ai/spec.json, confidence 0.60; frames
// s_002_prompt_submitted, s_003_pending, s_004_pending_card_zoom, s_005_pending_tip2, s_006_partial, s_007_complete). A white page: a top
// navigation bar, a left rail (Home / Generate / Catalog / Create / Predict / Plan, Account / Help), a dark navy prompt bar with the
// query, a clear (x) and a white 'Generate' pill above a row of style chips, and a white canvas. Pressing Generate puts a dark navy card
// in the middle of the canvas, 'Bringing your description to life! Please allow 10-15 seconds.', with a thin crimson progress bar filling
// left to right on a grey track and a tip beside a small preview picture (the tip rotates: 'Your imagery is ethical and inclusive...',
// 'Hold on just a moment. AI is analyzing billions of creative data points...'). The card then gives way to 'Freshly AI-generated images
// showing <prompt>' and the result tiles, which fill from a top band downward one by one, under a 'More AI-generated images' strip.
// Adapted to ten images: the card, then ten tiles in a 5 x 2 block decoding one after another in strict order, each from its top edge
// downward (a cover that recedes). Omitted: the wordmark, the nav's 'Pricing' link, the banner and the account controls' details. The source's pictures are never
// reproduced (the card's preview is a plain grey gradient, every tile is our own meme), the tips are shortened and carry no brand name,
// and the face is the system UI face.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sst';
const COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: 384px; border-radius: 12px; background: #fff; color: #11151f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dde0e6; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 11px; height: 26px; padding: 0 12px; box-shadow: 0 1px 0 #e8eaee; font-size: 6.5px; font-weight: 600; letter-spacing: .02em; color: #1d2230; white-space: nowrap; }
.${P}-nav .${P}-sp { flex: 1; }
.${P}-nav .${P}-av { display: block; width: 14px; height: 14px; border-radius: 50%; background: #d7dae0; }
.${P}-wrap { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 9px; width: 40px; padding: 10px 0; box-shadow: 1px 0 0 #eceef1; }
.${P}-rail span { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 5.5px; color: #4a5162; }
.${P}-rail span i { display: block; width: 9px; height: 9px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #4a5162; }
.${P}-rail .${P}-on { color: #11151f; font-weight: 700; box-shadow: -1.5px 0 0 #11151f; }
.${P}-rail .${P}-on i { box-shadow: inset 0 0 0 1.3px #11151f; }
.${P}-rail .${P}-gap { flex: 1; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-bar { flex: none; box-sizing: border-box; height: 64px; padding: 9px 14px 0; background: #0b101c; }
.${P}-q { display: flex; align-items: center; gap: 10px; height: 20px; box-shadow: 0 1px 0 #4a5162; padding-bottom: 6px; font-size: 9px; color: #fff; }
.${P}-q em { flex: 1; font-style: normal; white-space: nowrap; overflow: hidden; }
.${P}-q .${P}-qx { flex: none; width: 8px; height: 8px; position: relative; }
.${P}-q .${P}-qx::before, .${P}-q .${P}-qx::after { content: ""; position: absolute; left: 3.5px; top: -1px; width: 1.4px; height: 10px; border-radius: 1px; background: #cfd3dc; transform: rotate(45deg); }
.${P}-q .${P}-qx::after { transform: rotate(-45deg); }
.${P}-go { flex: none; display: grid; place-items: center; height: 18px; padding: 0 11px; border-radius: 9px; background: #fff; font-size: 7.5px; font-weight: 700; color: #11151f; }
.${P}-chips { display: flex; gap: 5px; margin-top: 8px; }
.${P}-chips span { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 7px 0 0; border-radius: 3px; box-shadow: inset 0 0 0 1px #2c3447; font-size: 6.5px; font-weight: 600; color: #e8ebf2; white-space: nowrap; }
.${P}-chips span i { display: block; width: 18px; height: 18px; border-radius: 3px 0 0 3px; }
.${P}-chips span:nth-child(1) { box-shadow: inset 0 0 0 1.4px #fff; }
.${P}-chips span.${P}-cn { padding-left: 7px; }
.${P}-cv { position: relative; flex: 1; min-height: 0; box-sizing: border-box; padding: 10px 14px 0; }
.${P}-res { visibility: hidden; }
.${P}-h { height: 16px; font-size: 10px; font-weight: 700; line-height: 16px; color: #11151f; white-space: nowrap; overflow: hidden; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: #eceef2; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; background: #eceef2; }
.${P}-cov::before { content: ""; position: absolute; left: 0; right: 0; bottom: 100%; height: 8px; background: linear-gradient(0deg, rgba(236, 238, 242, .8), rgba(236, 238, 242, 0)); }
.${P}-more { position: absolute; left: 14px; right: 14px; bottom: 0; box-sizing: border-box; height: 44px; padding: 8px 8px 0; border-radius: 3px 3px 0 0; background: #fafbfc; box-shadow: inset 0 0 0 1px #eef0f3; font-size: 7px; color: #3b4254; }
.${P}-more div { display: flex; gap: 5px; margin-top: 6px; }
.${P}-more i { flex: 1; display: block; height: 14px; border-radius: 2px; background: #eceef2; }
.${P}-card { position: absolute; left: 50%; top: 18px; width: 304px; margin-left: -152px; box-sizing: border-box; border-radius: 4px; background: #0b101c; color: #fff; box-shadow: 0 6px 18px rgba(16, 22, 38, .28); overflow: hidden; }
.${P}-card b { display: block; padding: 11px 14px 9px; text-align: center; font-size: 8.5px; font-weight: 700; line-height: 12px; }
.${P}-trk { height: 1.5px; background: #4a5162; }
.${P}-trk i { display: block; height: 100%; background: #d01f3b; transform-origin: 0 50%; transform: scaleX(0); }
.${P}-tip { display: flex; align-items: center; gap: 14px; padding: 14px 14px 16px; }
.${P}-th { flex: none; display: block; width: 54px; height: 54px; border-radius: 3px; background: radial-gradient(circle at 50% 38%, #e3e6ec 0 14%, rgba(227, 230, 236, 0) 15%), linear-gradient(165deg, #aeb4c0, #5a6275); }
.${P}-tx { min-width: 0; }
.${P}-tx span { display: block; font-size: 7px; line-height: 10px; color: #9aa2b3; }
.${P}-tx p { margin: 2px 0 0; font-size: 7.5px; line-height: 10.5px; color: #f3f5f9; }
`;

const PROMPT = 'muse holding a handwritten note';
const TIPS = [
  ['Your imagery is ethical and inclusive.', 'When you combine a diverse team of engineers, ethically sourced data and creativity, the result is the most responsible and imaginative AI on the planet.'],
  ['Hold on just a moment...', 'AI is analyzing billions of creative data points to generate your images! Pretty cool that it can do all that in just 15 seconds, huh?'],
];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const CARD_IN = 0.16, CARD_OUT = 0.68;            // the 'Bringing your description to life!' card
const FILL_END = 0.64;                            // the crimson bar reaches the end of its track
const TIP2 = 0.4;                                 // the tip line rotates
const STEP = (1.68 - CARD_OUT) / 10;              // tile i decodes over [CARD_OUT + i * STEP, CARD_OUT + (i + 1) * STEP]: strict, non-overlapping, the last landing at 1.68
const A = (i) => CARD_OUT + i * STEP;
const CHIPS = [['All styles', 'linear-gradient(135deg, #ff5f6d, #ffc371, #47c9e5, #7b4cf0)'], ['Photo', 'linear-gradient(135deg, #8a4fd8, #d85a9b)'], ['Art', 'linear-gradient(135deg, #3b86d1, #e8a13a)'], ['Digital', 'linear-gradient(135deg, #f26bb5, #6a8bf5)'], ['3D', 'linear-gradient(135deg, #7a4be0, #e87ab0)']];
const RAIL = ['Home', 'Generate', 'Catalog', 'Create', 'Predict', 'Plan'];

export default {
  id: 'shutterstock-ai',
  label: 'Shutterstock AI (2023)',
  source: {
    platform: 'Shutterstock AI image generator, the 2023 generate view at shutterstock.com (desktop browser, light page with a dark prompt bar; two tutorial screen recordings on YouTube, 2023-03-09 and 2023-04-22)',
    feature: "white page with a top nav, a left rail and a dark prompt bar with a white 'Generate' pill; the pending state is a centred dark navy card 'Bringing your description to life! Please allow 10-15 seconds.' with a thin crimson progress bar filling left to right on a grey track and a rotating tip beside a preview picture, then the card gives way to the result tiles, which decode one by one (adapted to 10: ten tiles in a 5 + 5 block decoding in strict order, each from its top edge down; the wordmark is omitted and the preview picture is a plain gradient)",
    refs: [{ url: 'https://www.youtube.com/watch?v=rUpCe57YDuQ', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=dmUx6MGqYnU', retrieved: '2026-10-14' }],
    extrapolated: ['ten tiles in a 5 x 2 block (the footage shows four in a row)', 'the strict one-after-another decoding order (the footage shows tiles filling out of order)', 'the exact fill pace of the crimson bar'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'shutterstock-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cov"></div></div>`;
    const nav = ['IMAGES', 'VIDEO', 'MUSIC', 'EDITORIAL', '3D MODELS', 'CREATIVE FLOW', 'BLOG', 'ENTERPRISE'].map((n) => `<span>${n}</span>`).join('');
    const rail = RAIL.map((n) => `<span${n === 'Generate' ? ` class="${P}-on"` : ''}><i></i>${n}</span>`).join('') + `<span class="${P}-gap"></span><span><i></i>Account</span><span><i></i>Help</span>`;
    const chips = CHIPS.map(([n, bg]) => `<span><i style="background: ${bg}"></i>${n}</span>`).join('') + `<span class="${P}-cn">No styles</span>`;
    const tip = TIPS.map(([a, b], i) => `<div class="${P}-tx"${i ? ' style="display: none"' : ''}><span>${x.esc(a)}</span><p>${x.esc(b)}</p></div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-nav">${nav}<span class="${P}-sp"></span><i class="${P}-av"></i></div><div class="${P}-wrap"><div class="${P}-rail">${rail}</div><div class="${P}-main"><div class="${P}-bar"><div class="${P}-q"><em>${x.esc(PROMPT)}</em><i class="${P}-qx"></i><div class="${P}-go">Generate</div></div><div class="${P}-chips">${chips}</div></div><div class="${P}-cv"><div class="${P}-res"><div class="${P}-h">Freshly AI-generated images showing ${x.esc(PROMPT)}</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-more">More AI-generated images from the library.<div><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="${P}-card" style="display: none"><b>Bringing your description to life! Please allow 10-15 seconds.</b><div class="${P}-trk"><i></i></div><div class="${P}-tip"><i class="${P}-th"></i>${tip}</div></div></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), res = root.querySelector(`.${P}-res`), card = root.querySelector(`.${P}-card`), fill = root.querySelector(`.${P}-trk i`);
    const tips = [...root.querySelectorAll(`.${P}-tx`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cov`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // the pending card: the crimson bar fills left to right, the tip line rotates, then the card gives way to the results
        const showCard = s >= CARD_IN && s < CARD_OUT;
        put('card', showCard, (v) => { card.style.display = v ? '' : 'none'; });
        const p = seg(s, CARD_IN, FILL_END);
        put('fill', p.toFixed(3), () => { fill.style.transform = p > 0 ? `scaleX(${p.toFixed(3)})` : ''; });
        put('tip', s >= TIP2, (v) => { tips[0].style.display = v ? 'none' : ''; tips[1].style.display = v ? '' : 'none'; });
        put('res', s >= CARD_OUT, (v) => { res.style.visibility = v ? 'visible' : ''; });

        cells.forEach((c, i) => {
          const a = A(i), f = seg(s, a, a + STEP);
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the cover recedes downward: the tile decodes from its top edge
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.transform = ''; } else { c.cv.style.display = ''; c.cv.style.transform = f > 0 ? `translateY(${(f * 100).toFixed(2)}%)` : ''; }
          });
        });
      },
    };
  },
};
