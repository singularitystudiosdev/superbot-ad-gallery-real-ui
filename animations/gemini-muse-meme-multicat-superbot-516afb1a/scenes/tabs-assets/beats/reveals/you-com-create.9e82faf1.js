// You.com, the 'Imagine' tab of its search/chat results page (a 1280x720 Windows desktop-browser screen recording on YouTube,
// 'AI Search Engine: Explore, Chat, Create | Introducing YOU.COM', published 2023-07-30, t~238-252 s; spec
// .tmp/clone-9e82faf1/reveal-refs/you-com-create/spec.json, confidence 0.70; frames x_you_idle_t239.png, x_you_generating_t245.png,
// x_you_landed_t252.png). A light page: a nav row (Chat / All / Images / Videos / News / Maps / Social / Imagine with a blue underline /
// More; a 'Plans' link at the right), a title row for the image generator, then two cards side by side: on the left a model drop-down, the label
// 'Describe the image to be created*', the prompt box, a green-ringed 'N / 10 generations left' counter and a full-width solid blue
// primary button; on the right a result card showing a green 'Create stunning images from text with AI' illustration while idle. Clicking
// the button turns it into a disabled light-periwinkle 'Generating image...' pill and the card swaps its illustration for an animated
// multi-colour stacked-gem glyph (layered rounded diamonds in teal, mint, purple and pink that open from one diamond into a layered gem
// and close again; no percentage, no bar, no text on the card); about eight seconds later the first image drops into the card (a plain
// swap, no blur), the button reverts and the counter reads '9 / 10 generations left'. The chat bar with the query stays at the foot.
// Adapted to ten images: the result card holds ten slots in a 5 x 2 block, each showing its own small stacked-gem glyph (the gems open and
// close from render(t), a phase apart) until its picture replaces it, strictly one after another in reading order; the counter ticks
// down by one as each image lands (the footage's one image used one generation, so ten images end on '0 / 10 generations left'), and the
// button stays 'Generating image...' until the tenth has landed. Omitted: the browser chrome, the page's multicolour wordmark, the
// plan upsell links (the nav's 'Plans' and the title's '(Plans)'), the 'Choose a model' emoji, the floating side buttons and the taskbar. The footage's pictures and the product's own glyph are never
// reproduced: every slot shows our own meme, the gem is a plain stack of rounded diamonds of my own, and no logo, wordmark or platform font
// is drawn (plain text in the system stack).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ycc';
const ROOT_H = 352, COLS = 5, GAP = 5;
const BLUE = '#2f6fe4';
const GEM = ['#f06aa8', '#b44be0', '#3574cc', '#55bba4', '#65e1be'];   // bottom layer to top
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fff; color: #1b1d21; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dfe2e8; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 13px; height: 30px; padding: 0 14px; box-shadow: 0 1px 0 #eceef2; font-size: 8px; color: #4a4f58; white-space: nowrap; }
.${P}-nav span { position: relative; display: flex; align-items: center; gap: 3px; height: 30px; }
.${P}-nav span::before { content: ""; width: 6px; height: 6px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #7d838d; }
.${P}-nav .on { color: ${BLUE}; font-weight: 600; box-shadow: inset 0 -2px 0 ${BLUE}; }
.${P}-nav .on::before { box-shadow: inset 0 0 0 1.2px ${BLUE}; }
.${P}-ttl { flex: none; display: flex; align-items: center; gap: 6px; height: 28px; margin-top: 8px; padding: 0 14px; font-size: 10px; font-weight: 600; color: #1b1d21; white-space: nowrap; }
.${P}-ttl i { display: block; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 1.6px #55bba4; }
.${P}-cards { flex: none; display: flex; gap: 10px; padding: 0 14px; }
.${P}-form { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: 200px; padding: 10px 12px 12px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #e4e6ea; }
.${P}-lab { flex: none; height: 14px; font-size: 8px; line-height: 14px; font-weight: 600; color: #1b1d21; white-space: nowrap; }
.${P}-lab b { color: #e0334f; font-weight: 600; }
.${P}-dd { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 24px; margin: 3px 0 8px; padding: 0 9px; border-radius: 7px; box-shadow: inset 0 0 0 1px #d7dbe2; font-size: 7.5px; color: #2c3038; white-space: nowrap; }
.${P}-dd::after { content: ""; width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 4px solid #3a3f48; }
.${P}-ta { flex: none; box-sizing: border-box; height: 44px; margin: 3px 0 8px; padding: 7px 9px; border-radius: 7px; box-shadow: inset 0 0 0 1px #d7dbe2; font-size: 8px; line-height: 11px; color: #2c3038; overflow: hidden; }
.${P}-cnt { flex: none; display: flex; align-items: center; gap: 6px; height: 16px; margin-bottom: 8px; font-size: 7.5px; font-weight: 600; color: #1b1d21; white-space: nowrap; }
.${P}-cnt i { display: block; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 1.8px #55bba4; }
.${P}-go { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 28px; border-radius: 7px; font-size: 8.5px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-res { position: relative; flex: 1; min-width: 0; box-sizing: border-box; padding: 10px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #e4e6ea; }
.${P}-idle { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; font-size: 8.5px; font-weight: 600; color: #3f8f7d; }
.${P}-idle i { display: block; position: relative; width: 74px; height: 50px; border-radius: 9px; background: #d9f3ec; box-shadow: inset 0 0 0 1.5px #55bba4; }
.${P}-idle i::before { content: ""; position: absolute; left: 12px; top: 12px; width: 17px; height: 17px; border-radius: 50%; background: #65e1be; }
.${P}-idle i::after { content: ""; position: absolute; left: 30px; right: 10px; bottom: 9px; height: 16px; border-radius: 3px; background: #55bba4; }
.${P}-g { position: absolute; left: 10px; right: 10px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 6px; overflow: hidden; background: #f4f6fa; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; background: #f4f6fa; }
.${P}-gem { position: absolute; left: 50%; top: 50%; display: block; width: 0; height: 0; }
.${P}-gem i { position: absolute; left: -7px; top: -7px; display: block; width: 14px; height: 14px; border-radius: 3px; }
.${P}-bar { flex: none; position: relative; display: flex; align-items: center; box-sizing: border-box; height: 34px; margin: 0 70px 10px; padding: 0 5px 0 14px; border-radius: 17px; background: #fff; box-shadow: 0 0 0 1px #d7dbe2, 0 2px 8px rgba(28, 33, 45, .1); font-size: 9px; color: #1b1d21; white-space: nowrap; }
.${P}-bar span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-bar b { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: ${BLUE}; }
.${P}-bar b i { display: block; width: 8px; height: 8px; border-top: 1.8px solid #fff; border-right: 1.8px solid #fff; transform: rotate(45deg) translate(-1px, 1px); }
.${P}-std { flex: none; align-self: flex-end; margin: auto 70px 4px; height: 14px; padding: 0 8px; border-radius: 7px; background: #e9edf5; font-size: 7px; line-height: 14px; color: #5a6270; }
`;

const PROMPT = 'a muse holding a handwritten note, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the primary button
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1489);   // slot i's picture lands (reading order, strictly one after another), the last at 1.84
const FADE = 0.05;                                // the gem's cover thins away over this long before the picture lands
const NAV = ['Chat', 'All', 'Images', 'Videos', 'News', 'Maps', 'Social', 'Imagine', 'More'];

export default {
  id: 'you-com-create',
  label: 'You.com Create (2025)',
  source: {
    platform: "You.com web app, the 'Imagine' tab (a Windows desktop-browser screen recording on YouTube, published 2023-07-30; light theme, model 'SD XL (faster, medium quality)')",
    feature: "the primary button turning into a disabled periwinkle 'Generating image...' pill while the result card shows an animated multi-colour stacked-gem placeholder, then the image and the '10 / 10 generations left' counter ticking down (adapted to 10: ten slots in a 5 x 2 block, each with its own gem until its picture lands, strictly one after another, the counter ticking down per image)",
    refs: [{ url: 'https://www.youtube.com/watch?v=2cJkDkmE-H4', retrieved: '2026-10-14' }],
    extrapolated: "The footage generates ONE image after about eight seconds and then fills a 2 x 2 grid: the block of ten slots, a gem in every slot (the footage has one gem in the card), the strict one-by-one landing order, the counter reaching '0 / 10' (the footage's one image used one generation, so ten images use ten) and every timing (the press at 0.06 s, the first landing at 0.5 s, the last at 1.84 s) are extrapolated. The gem is a neutral stack of rounded diamonds of my own in the footage's four colours, not the product's glyph; its opening-and-closing pace is a guess.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'you-com-create');
    const gem = `<span class="${P}-gem">${GEM.map((c) => `<i style="background: ${c}"></i>`).join('')}</span>`;
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cov">${gem}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav">${NAV.map((n) => `<span${n === 'Imagine' ? ' class="on"' : ''}>${n}</span>`).join('')}</div><div class="${P}-ttl"><i></i>Imagine - AI Image Generator (Beta)</div><div class="${P}-cards"><div class="${P}-form"><div class="${P}-lab">Choose a model</div><div class="${P}-dd">SD XL (faster, medium quality)</div><div class="${P}-lab">Describe the image to be created<b>*</b></div><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-cnt"><i></i><span class="${P}-cn"></span></div><div class="${P}-go"></div></div><div class="${P}-res"><div class="${P}-idle"><i></i>Create stunning images from text with AI</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div><div class="${P}-std">Standard</div><div class="${P}-bar"><span>${x.esc(PROMPT)}</span><b><i></i></b></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), cn = q(`.${P}-cn`), idle = q(`.${P}-idle`), grid = q(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-cov`), layers: [...n.querySelectorAll(`.${P}-gem i`)], g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the primary button: pressed, disabled periwinkle 'Generating image...' until the tenth lands, then back to itself
        const phase = s >= LAND[9] ? 2 : s >= GEN_AT ? 1 : 0;
        const pp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', `${phase}|${pp.toFixed(3)}`, () => {
          go.style.transform = pp > 0 ? `scale(${(1 - 0.04 * pp).toFixed(4)})` : 'none';
          go.textContent = phase === 1 ? 'Generating image...' : 'Use AI to generate image';
          go.style.background = phase === 1 ? '#cad2e2' : BLUE;
        });

        // the illustration gives way to the ten slots once the button is pressed
        const on = s >= GEN_AT;
        put('on', on, (v) => { idle.style.display = v ? 'none' : ''; grid.style.visibility = v ? 'visible' : 'hidden'; });

        // the counter ticks down as each image lands
        let landed = 0;
        for (let i = 0; i < LAND.length; i++) if (s >= LAND[i]) landed++;
        put('cn', landed, (n) => { cn.textContent = `${10 - n} / 10 generations left`; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`c${i}`, `${f.toFixed(3)}|${s >= a ? 1 : 0}`, () => {
            c.im.style.transform = restTransform(c.g);
            c.im.style.filter = restFilter(c.g);
            if (s >= a) { c.im.style.visibility = 'visible'; c.cov.style.display = 'none'; c.cov.style.opacity = ''; return; }
            c.im.style.visibility = f > 0 ? 'visible' : 'hidden';
            c.cov.style.display = '';
            c.cov.style.opacity = f > 0 ? (1 - f).toFixed(3) : '';
          });
          // the gem opens from one diamond into a layered gem and closes again (a phase apart per slot), from t alone
          const open = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 0.8 + i * 0.11));
          const gap = (open * 4.4).toFixed(1);
          put(`g${i}`, gap, (v) => {
            c.layers.forEach((l, j) => { l.style.transform = `translateY(${((j - 2) * v).toFixed(1)}px) scale(1, 0.58) rotate(45deg)`; });
          });
        });
      },
    };
  },
};
