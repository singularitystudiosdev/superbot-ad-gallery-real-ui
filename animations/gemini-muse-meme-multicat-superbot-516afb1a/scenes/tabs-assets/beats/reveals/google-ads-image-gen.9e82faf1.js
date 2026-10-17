// The 'Edit image' studio's 'Generate background' flow in the Google Ads web UI, ads.google.com (YouTube 9texdp4yZXg, official Google Ads
// channel, 2024-09-30, t~58-115 s; spec .tmp/clone-9e82faf1/reveal-refs/google-ads-image-gen/spec.json, confidence 0.68; frames
// ac_gads_idle_t8.png, ac_gads_pending_t41.png, ac_gads_pending_t42.png, ac_gads_pending_t44.png, ac_gads_pending_toast_t47.png,
// ac_gads_landing_t52.png). A white three-column editor: a left rail ('Edit main image', 'Aspect ratios' with Horizontal 1.91:1,
// Square 1:1 and Vertical 4:5 thumbnails), the artboard on a light grey stage with a toolbar of undo/redo and a '100%' zoom, and a right
// 'Generate background' panel (a textarea labelled 'Describe the kind of background you want', a blue full-width button). Pressing the
// button turns it into a 'Generating...' bar (pale text on the blue), the variant slots under it go blank (flat #F8F8F8 squares with a
// hairline) with the status line 'Generating <your prompt>' above them, and - on the same surface, in frame t44 - the artboard is veiled
// and a grey toast at its foot reads 'Adding object...This could take up to (60) seconds.' (a fixed ceiling, no countdown). There is no
// percentage, bar or shimmer; the slots hard-swap to the finished variants, the veil and toast clear and the button reads 'Generate more'
// with 'Cancel' / 'Apply' under the slots.
// Adapted to ten images: the footage's four variants (2x2) become ten (4 + 4 + 2) landing one at a time in reading order, each fading in
// over its blank slot; the first variant takes the blue selection outline once it lands. Omitted: the product wordmark in the header,
// the help and account cluster and the footage's product artwork (the artboard is drawn from plain shapes). The footage's pictures are never reproduced: every image is our own meme, and no logo or platform font is
// drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gai';
const FONT = `Roboto, ${UI_FONT}`;
const ROOT_H = 400, RAIL_W = 80, PANEL_W = 196, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ffffff; color: #3c4043; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dadce0; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 12px; box-shadow: 0 1px 0 #e8eaed; font-size: 12px; color: #5f6368; }
.${P}-top b { font-size: 11px; font-weight: 400; color: #3c4043; }
.${P}-tool { flex: none; display: flex; align-items: center; gap: 12px; height: 22px; padding: 0 12px; box-shadow: 0 1px 0 #e8eaed; font-size: 9px; color: #5f6368; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 3px; width: ${RAIL_W}px; padding: 8px 0 0; background: #ffffff; font-size: 6.5px; text-align: center; }
.${P}-rail h6 { margin: 0 0 1px; font-size: 7.5px; font-weight: 500; color: #3c4043; }
.${P}-th { box-sizing: border-box; width: 52px; height: 30px; border-radius: 2px; background: linear-gradient(180deg, #e8eaee 0 62%, #b9bcc4 62% 100%); position: relative; }
.${P}-th::after { content: ""; position: absolute; left: 24px; top: 6px; width: 5px; height: 18px; background: linear-gradient(180deg, #5bbf8b 0 28%, #cfdcf8 28% 100%); }
.${P}-th.${P}-on { height: 38px; box-shadow: 0 0 0 1.5px #1a73e8; }
.${P}-th.${P}-sq { width: 36px; height: 36px; }
.${P}-th.${P}-vt { width: 28px; height: 36px; }
.${P}-stage { position: relative; flex: 1; min-width: 0; background: #f8f8f8; }
.${P}-art { position: absolute; left: 50%; top: 50%; width: 262px; height: 262px; margin: -131px 0 0 -131px; overflow: hidden; background: #e9ebef; box-shadow: 0 0 0 1px #8a8d94; }
.${P}-art i { position: absolute; display: block; }
.${P}-veil { position: absolute; inset: 0; background: rgba(248, 248, 248, .74); }
.${P}-toast { position: absolute; left: 50%; bottom: 14px; box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 2px; background: #9aa0a6; transform: translateX(-50%); font-size: 7.5px; line-height: 20px; color: #ffffff; white-space: nowrap; }
.${P}-pn { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; padding: 12px 12px 0; background: #ffffff; box-shadow: -1px 0 0 #e8eaed; }
.${P}-pn h5 { display: flex; align-items: center; gap: 5px; margin: 0; height: 14px; font-size: 9.5px; font-weight: 500; color: #3c4043; }
.${P}-pn h5 i { display: grid; place-items: center; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 .8px #80868b; font-style: normal; font-size: 6px; font-weight: 400; color: #5f6368; }
.${P}-ta { position: relative; margin-top: 12px; box-sizing: border-box; height: 52px; padding: 8px 6px; border-radius: 2px; box-shadow: inset 0 0 0 1px #1a73e8; font-size: 8px; line-height: 11px; color: #5f6368; }
.${P}-ta em { position: absolute; left: 6px; top: -4px; padding: 0 3px; background: #ffffff; font-style: normal; font-size: 6.5px; line-height: 8px; color: #1a73e8; white-space: nowrap; }
.${P}-btn { margin-top: 5px; display: grid; place-items: center; height: 17px; border-radius: 2px; background: #1a73e8; font-size: 8.5px; color: #ffffff; }
.${P}-btn.${P}-busy { color: #a8c7fa; }
.${P}-st { margin-top: 10px; height: 10px; font-size: 6.5px; line-height: 10px; color: #5f6368; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-g { margin-top: 3px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 2px; overflow: hidden; background: #f8f8f8; box-shadow: inset 0 0 0 1px #dadce0; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #f8f8f8; box-shadow: inset 0 0 0 1px #dadce0; }
.${P}-sel { position: absolute; inset: 0; border-radius: 2px; box-shadow: inset 0 0 0 1.5px #1a73e8; }
.${P}-act { margin-top: auto; display: flex; justify-content: flex-end; align-items: center; gap: 16px; height: 30px; font-size: 8.5px; color: #1a73e8; }
.${P}-act b { display: grid; place-items: center; box-sizing: border-box; height: 17px; padding: 0 9px; border-radius: 2px; background: #1a73e8; font-size: 8.5px; font-weight: 400; color: #ffffff; }
.${P}-ft { flex: none; display: flex; align-items: center; gap: 12px; height: 30px; padding: 0 12px; box-shadow: 0 -1px 0 #e8eaed; font-size: 8.5px; color: #1a73e8; }
.${P}-ft b { display: grid; place-items: center; box-sizing: border-box; height: 17px; padding: 0 10px; border-radius: 2px; background: #1a73e8; font-size: 8.5px; font-weight: 400; color: #ffffff; }
`;

const PROMPT = 'A muse holding a handwritten note, meme style';
const SHORT = 'a muse holding a handwritten note';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the blue button
const ISSUE = 0.16;                               // the button reads 'Generating...', the slots go blank, the artboard is veiled
const LAND = Array.from({ length: 10 }, (_, i) => 0.42 + i * 0.14);   // slot i takes its variant (reading order), the last at 1.68
const FADE = 0.06;                                // the blank slot's cover thins away over this long before the variant lands

export default {
  id: 'google-ads-image-gen',
  label: 'Google Ads image editor (2024)',
  source: {
    platform: "Google Ads web UI, ads.google.com, the ad-image editor 'Edit image' studio with its right-hand 'Generate background' panel (desktop browser, light theme; the official Google Ads channel on YouTube, 2024-09-30)",
    feature: "white three-column editor (left aspect-ratio rail, artboard, 'Generate background' panel): the blue button turns into a pale-text 'Generating...' bar, the variant slots go blank under the status line 'Generating <your prompt>' and, in the same frame, the artboard is veiled with a grey toast 'Adding object...This could take up to (60) seconds.' (fixed ceiling, no percentage or bar); the slots then hard-swap to the finished variants, the button reads 'Generate more' with 'Cancel' / 'Apply' (adapted to 10: a 4 + 4 + 2 block of slots resolving in reading order, the first variant taking the blue selection outline)",
    refs: [{ url: 'https://www.youtube.com/watch?v=9texdp4yZXg', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten variants (the footage's four, 2x2) as a 4 + 4 + 2 block of slots landing one at a time in reading order (the footage hard-swaps the four at once)",
      "each variant fades in over its blank slot (the footage swaps hard)",
      "the prompt in the textarea and the status line is our own text; the artboard is a plain-shape studio scene, not the footage's product artwork",
      "the toast stays up for the whole generation and clears with the last variant (the spec places it on this surface in frame t44; whether it is always shown for a background run is not confirmed)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-ads-image-gen');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const th = (cls, lab) => `<div class="${P}-th ${cls}"></div>${lab ? `<span>${lab}</span>` : ''}`;
    const art = `<i style="left: 0; right: 0; bottom: 0; height: 34px; background: #b9bcc4"></i><i style="left: 56px; right: 56px; top: 0; bottom: 34px; background: linear-gradient(110deg, #f6f7fb 0 58%, #eceef3 58% 100%)"></i><i style="left: 70px; right: 70px; top: 18px; height: 12px; background: #dcdee4"></i><i style="left: 20px; top: 62px; width: 36px; height: 20px; background: #d3d5db"></i><i style="left: 36px; top: 80px; width: 2px; height: 130px; background: #d8dae0"></i><i style="right: 14px; top: 90px; width: 14px; height: 18px; background: #d3d5db"></i><i style="left: 100px; top: 150px; width: 28px; height: 78px; background: #cfdcf8"></i><i style="left: 105px; top: 104px; width: 18px; height: 44px; border-radius: 3px; background: linear-gradient(180deg, #7bc99a 0 62%, #f3b942 62% 100%)"></i>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">✕<b>Edit image</b></div><div class="${P}-tool"><span>↶</span><span>↷</span><span>⟳</span><span>100% ▾</span></div><div class="${P}-body"><div class="${P}-rail"><h6>Edit main image</h6>${th(`${P}-on`)}<h6 style="margin-top: 5px">Aspect ratios</h6>${th('', 'Horizontal 1.91:1')}${th(`${P}-sq`, 'Square 1:1')}${th(`${P}-vt`, 'Vertical 4:5')}</div><div class="${P}-stage"><div class="${P}-art">${art}<div class="${P}-veil" style="display: none"></div><div class="${P}-toast" style="display: none">Adding object...This could take up to (60) seconds.</div></div></div><div class="${P}-pn"><h5>Generate background<i>?</i></h5><div class="${P}-ta"><em>Describe the kind of background you want</em>${x.esc(PROMPT)}</div><div class="${P}-btn">Generate</div><div class="${P}-st" style="visibility: hidden">Generating ${x.esc(SHORT)}</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-act"><span style="display: none">Cancel</span><b style="display: none">Apply</b></div></div></div><div class="${P}-ft"><b>Save</b>Cancel</div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const veil = q('veil'), toast = q('toast'), btn = q('btn'), st = q('st'), grid = q('g'), act = q('act');
    const cancel = act.children[0], apply = act.children[1];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    const sel = document.createElement('div'); sel.className = `${P}-sel`; sel.style.display = 'none'; cells[0].im.parentNode.appendChild(sel);
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the blue button is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { btn.style.filter = gp > 0 ? `brightness(${(1 - 0.12 * gp).toFixed(3)})` : 'none'; });

        // the button reads 'Generating...', the slots go blank under the status line, the artboard is veiled with the toast
        const on = s >= ISSUE, done = s >= LAND[9];
        put('btn', on ? (done ? 2 : 1) : 0, (v) => { btn.textContent = v === 0 ? 'Generate' : v === 1 ? 'Generating...' : 'Generate more'; btn.classList.toggle(`${P}-busy`, v === 1); });
        put('st', on, (v) => { st.style.visibility = v ? '' : 'hidden'; grid.style.visibility = v ? '' : 'hidden'; });
        put('veil', on && !done, (v) => { const d = v ? '' : 'none'; veil.style.display = d; toast.style.display = d; });
        put('act', on, (v) => { cancel.style.display = v ? '' : 'none'; });
        put('apply', done, (v) => { apply.style.display = v ? '' : 'none'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          put(`f${i}`, 1, () => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
        put('sel', s >= LAND[0], (v) => { sel.style.display = v ? '' : 'none'; });
      },
    };
  },
};
