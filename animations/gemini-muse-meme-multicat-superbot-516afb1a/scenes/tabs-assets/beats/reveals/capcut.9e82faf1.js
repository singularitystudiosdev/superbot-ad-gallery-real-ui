// CapCut desktop, the 'AI generated' media panel (Bilibili BV1yZLtz3EHA, 2025-04-29, t~62.5-64.4 s, secondary BV1HFyiYREH1; spec
// .tmp/clone-9e82faf1/reveal-refs/capcut/spec.json, confidence 0.5; frames m_pending_62.8s_panel, m_compose_settings_59.8s_panel,
// m_finished_65.8s_panel). A dark editor shell: an import/audio/text/... tab strip over a left media nav ('AI generated' selected),
// and a panel that stacks result batches, each captioned with a timestamp, a NN/NN counter and the prompt text. The composer sits at
// the bottom: the prompt box ('Describe the sticker you want to generate' with a 'Showcase' link), the 'Adjust' section (Styles
// General/Anime, Ratios, a Steps slider) and a cyan Generate button. Pressing Generate appends a batch of dark placeholder tiles,
// each with one small light-grey ring spinner (no percentage, no queue chip, no text); a tile is then swapped in place for the
// finished picture. Footage jump-cuts from spinner to finished, so there is no blur or partial render to copy.
// Adapted to ten images: three batches issued in turn (4, then 4, then 2), the panel stacking them downward, every tile landing in
// strict reading order (the spinners turn from render(t)). A batch gets its edit / regenerate icons once its last tile has landed.
// Omitted: the CapCut wordmark, the 'Free' tag on the button and the creator's burned-in subtitle. The footage's pictures are never
// reproduced: every tile is our own meme, and no logo or platform font is drawn (plain glyph squares, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cc';
const ROOT_H = 504, NAV_W = 100, TILE = 64;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #262629; color: #d9d9dd; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1b1b1d; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 10px; }
.${P}-menu { box-sizing: border-box; height: 18px; padding: 0 8px; border-radius: 5px; background: #38383b; font-size: 8.5px; font-weight: 700; line-height: 18px; color: #f2f2f4; }
.${P}-sv { display: flex; align-items: center; gap: 5px; font-size: 7.5px; color: #66666c; }
.${P}-sv i { display: block; width: 9px; height: 9px; border-radius: 50%; background: #1fb7d0; }
.${P}-tabs { flex: none; display: flex; box-sizing: border-box; height: 38px; margin: 0 6px; padding: 0 4px; border-radius: 8px 8px 0 0; background: #212123; }
.${P}-tabs span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 7.5px; color: #b9b9be; white-space: nowrap; }
.${P}-tabs span i { display: block; width: 11px; height: 9px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.2px #9d9da3; }
.${P}-tabs .on { color: #1fc3d9; }
.${P}-tabs .on i { box-shadow: inset 0 0 0 1.2px #1fc3d9; }
.${P}-body { flex: 1; min-height: 0; display: flex; margin: 0 6px 6px; border-radius: 0 0 8px 8px; background: #212123; }
.${P}-nav { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${NAV_W}px; padding: 8px 8px; box-shadow: 1px 0 0 #1a1a1c; }
.${P}-nav span { box-sizing: border-box; height: 22px; padding: 0 8px; border-radius: 4px; background: #2b2b2e; font-size: 8px; line-height: 22px; color: #c9c9ce; white-space: nowrap; overflow: hidden; }
.${P}-nav .on { color: #1fc3d9; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 8px 10px 8px 12px; }
.${P}-res { flex: none; display: flex; flex-direction: column; gap: 6px; height: 252px; }
.${P}-b { flex: none; display: flex; gap: 8px; height: 80px; }
.${P}-cap { flex: none; width: 40px; padding-top: 1px; }
.${P}-cap b { display: block; font-size: 12px; font-weight: 700; line-height: 14px; color: #f0f0f2; }
.${P}-cap em { display: block; margin-top: 1px; font-style: normal; font-size: 7.5px; color: #77777d; }
.${P}-bc { flex: 1; min-width: 0; }
.${P}-pr { height: 12px; font-size: 7.5px; line-height: 12px; color: #9a9aa0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-row { display: flex; align-items: flex-start; gap: 6px; margin-top: 4px; }
.${P}-t { position: relative; flex: none; width: ${TILE}px; height: ${TILE}px; border-radius: 6px; overflow: hidden; background: #2b2b2e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #2b2b2e; }
.${P}-ring { display: block; width: 13px; height: 13px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(226, 226, 226, 0) 0deg, #e2e2e2 40deg, #e2e2e2 300deg, rgba(226, 226, 226, 0) 345deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); }
.${P}-act { flex: none; display: flex; flex-direction: column; gap: 5px; margin-left: 2px; }
.${P}-act i { display: block; width: 14px; height: 14px; border-radius: 4px; background: #333336; box-shadow: inset 0 0 0 1.4px #4a4a4e; }
.${P}-set { flex: none; display: flex; gap: 12px; box-sizing: border-box; height: 56px; margin-top: 6px; padding: 6px 8px; border-radius: 7px; background: #161618; }
.${P}-sg { display: flex; flex-direction: column; gap: 4px; }
.${P}-sg > small { font-size: 7.5px; line-height: 9px; color: #b4b4ba; }
.${P}-sr { display: flex; gap: 3px; }
.${P}-sr span { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; height: 30px; min-width: 30px; padding: 0 4px; border-radius: 5px; background: #1d1d20; font-size: 6.5px; color: #a6a6ac; box-shadow: inset 0 0 0 1px #1d1d20; }
.${P}-sr .on { box-shadow: inset 0 0 0 1.2px #1fc3d9; color: #e8e8ea; }
.${P}-sr span i { display: block; width: 8px; height: 8px; border-radius: 50%; background: #5d6b4c; }
.${P}-sr span i.a { background: #c58b6e; }
.${P}-sr span u { display: block; width: 9px; height: 7px; border-radius: 1.5px; background: #777; }
.${P}-sr span u.w { width: 11px; height: 6px; }
.${P}-sr span u.n { width: 6px; height: 9px; }
.${P}-st { display: flex; align-items: center; gap: 5px; height: 14px; }
.${P}-trk { position: relative; width: 52px; height: 2px; border-radius: 1px; background: #e8e8ea; }
.${P}-trk b { position: absolute; right: -2px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #f2f2f4; }
.${P}-st span { box-sizing: border-box; height: 14px; min-width: 22px; padding: 0 5px; border-radius: 3px; background: #2e2e32; font-size: 7px; line-height: 14px; text-align: center; color: #d6d6da; }
.${P}-cmp { flex: none; box-sizing: border-box; margin-top: 6px; padding: 7px 9px 7px; border-radius: 8px; background: #1a1a1c; }
.${P}-lb { display: flex; align-items: center; justify-content: space-between; height: 16px; font-size: 8px; color: #b9b9be; }
.${P}-lb span { box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 4px; background: #2b2b2e; font-size: 7.5px; font-weight: 700; line-height: 15px; color: #f0f0f2; }
.${P}-pb { box-sizing: border-box; height: 32px; margin-top: 4px; padding: 5px 8px; border-radius: 5px; background: #0d0d0f; font-size: 8px; font-weight: 700; line-height: 12px; color: #f0f0f2; overflow: hidden; }
.${P}-ar { display: flex; align-items: center; justify-content: space-between; height: 22px; margin-top: 6px; }
.${P}-adj { box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 4px; background: #3a3a3d; font-size: 8px; font-weight: 700; line-height: 20px; color: #f0f0f2; }
.${P}-go { box-sizing: border-box; height: 20px; padding: 0 14px; border-radius: 4px; background: #08BED2; font-size: 8.5px; font-weight: 700; line-height: 20px; color: #06262b; }
`;

const PROMPT = 'a muse raising a handwritten note in a lecture hall, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const BATCHES = [
  { n: 4, at: 0.12, time: '10:41' },              // Generate is pressed 0.06 before each batch's tiles appear
  { n: 4, at: 0.62, time: '10:42' },
  { n: 2, at: 1.10, time: '10:43' },
];
const LAND = Array.from({ length: 10 }, (_, i) => 0.36 + i * 0.1472);   // tile i is swapped for its picture (reading order), the last at 1.68
const FADE = 0.06;                                // the spinner tile's cover thins away over this long before the picture lands
const PRESS = 0.06;

export default {
  id: 'capcut',
  label: 'CapCut (AI image)',
  source: {
    platform: 'CapCut desktop (PC app), the AI generated media panel (dark theme; a tutorial screen recording on Bilibili, 2025-04-29)',
    feature: "dark editor shell with the AI generated media panel: a prompt box ('Describe the sticker you want to generate', Showcase link), the Adjust section (Styles General/Anime, Ratios, Steps slider) and a cyan Generate button; results stack as batches captioned with a timestamp + the prompt, pending = dark placeholder tiles each with one light-grey ring spinner (no percentage, no queue chip) swapped in place for the finished image (adapted to 10: batches of 4 + 4 + 2 issued in turn, tiles landing in strict reading order; the wordmark and the Free tag are omitted)",
    refs: [
      { url: 'https://www.bilibili.com/video/BV1yZLtz3EHA', retrieved: '2026-10-14' },
      { url: 'https://www.bilibili.com/video/BV1HFyiYREH1', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'capcut');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i></div></div>`;
    let at = 0;
    const batchHtml = BATCHES.map((b, k) => {
      const first = at; at += b.n;
      const cells = Array.from({ length: b.n }, (_, j) => cell(tiles[first + j], first + j)).join('');
      return `<div class="${P}-b" style="visibility: hidden"><div class="${P}-cap"><b>${b.time}</b><em>0${k + 1}/03</em></div><div class="${P}-bc"><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-row">${cells}<div class="${P}-act" style="visibility: hidden"><i></i><i></i></div></div></div></div>`;
    }).join('');
    const tabs = ['Import', 'Audio', 'Text', 'Stickers', 'Effects', 'Transitions', 'Filters', 'Adjustment'].map((n, i) => `<span${i === 0 ? ' class="on"' : ''}><i></i>${n}</span>`).join('');
    const nav = ['Device', 'AI generated', 'Spaces', 'Stock material', 'Brand assets'].map((n, i) => `<span${i === 1 ? ' class="on"' : ''}>${n}</span>`).join('');
    const ratios = [['1:1', 'on', ''], ['4:3', '', ''], ['3:2', '', ''], ['16:9', '', 'w'], ['3:4', '', 'n'], ['2:3', '', 'n'], ['9:16', '', 'n']].map(([n, on, sh]) => `<span class="${on}"><u class="${sh}"></u>${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-menu">Menu</div><div class="${P}-sv"><i></i>Auto saved</div></div><div class="${P}-tabs">${tabs}</div><div class="${P}-body"><div class="${P}-nav">${nav}</div><div class="${P}-main"><div class="${P}-res">${batchHtml}</div><div class="${P}-set"><div class="${P}-sg"><small>Styles</small><div class="${P}-sr"><span class="on"><i></i>General</span><span><i class="a"></i>Anime</span></div></div><div class="${P}-sg"><small>Ratios</small><div class="${P}-sr">${ratios}</div></div><div class="${P}-sg"><small>Steps</small><div class="${P}-st"><div class="${P}-trk"><b></b></div><span>50</span></div></div></div><div class="${P}-cmp"><div class="${P}-lb">Describe the sticker you want to generate<span>Showcase</span></div><div class="${P}-pb">${x.esc(PROMPT)}</div><div class="${P}-ar"><div class="${P}-adj">Adjust</div><div class="${P}-go">Generate</div></div></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`);
    const batches = [...root.querySelectorAll(`.${P}-b`)].map((n) => ({ el: n, act: n.querySelector(`.${P}-act`) }));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const lastOf = []; { let a = 0; BATCHES.forEach((b) => { a += b.n; lastOf.push(a - 1); }); }

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed once per batch (it never changes label)
        const gp = Math.max(...BATCHES.map((b) => press(s, b.at - PRESS, PRESS, 0.06, 0.14)));
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // a batch's caption and its dark tiles appear when it is issued; its action icons come with its last picture
        batches.forEach((b, j) => {
          put(`b${j}`, s >= BATCHES[j].at, (v) => { b.el.style.visibility = v ? '' : 'hidden'; });
          put(`a${j}`, s >= LAND[lastOf[j]], (v) => { b.act.style.visibility = v ? '' : 'hidden'; });
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the spinner turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 540 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
