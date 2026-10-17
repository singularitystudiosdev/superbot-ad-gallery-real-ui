// Mage (mage.space), the web app's create surface (YouTube m3SFNxYvp18, a 2026-05-09 tutorial, t~670-730 s; spec
// .tmp/clone-9e82faf1/reveal-refs/mage-space/spec.json, confidence 0.55; frames r_mage_pending_panel.png, r_mage_pending_zoom.png,
// r_mage_current_composer.png, r_mage_result_and_strip.png). A dark shell: a model / aspect-ratio / resolution panel, a bottom
// composer (a '+', the prompt, an Image | Video toggle, a chip row Mango 2 / Fast / Character / Reference / Advanced and a solid
// orange circular Generate button that never changes) and, at the right, the collapsible 'Recent creations' panel. Pressing Generate
// does NOT draw a placeholder tile: the panel's header swaps to a spinner glyph with 'Generating: 1/10' and a caret, three full-width
// pills 'Cancel', 'Pause Queue' and 'Clear Queue' (red label) appear under it, and a plain '1 job running' line; when a job finishes
// its picture is filed at the top of the thumbnail strip and the header goes away.
// Adapted to ten: the header's k counts the job in flight (the landed count + 1, computed from t), and ten finished pictures fill the
// panel's strip in strict order (a 3-column grid read in order; the app's strip is a single column, newest first). Omitted: the
// 'Fast Mode' toggle and its upsell copy, the 'Run up to 4 gem generations concurrently.' line and the 1x/2x/4x chips (paid-plan
// promotion), the top navigation bar, the gem cost on the composer chip and the creator's channel badge. No Mage mark is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-msp';
const ROOT_H = 490, PANEL_W = 204;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #0b0b0c; color: #e6e6e9; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #212124; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 9px; padding: 10px 10px 10px 12px; }
.${P}-chips { flex: none; display: flex; gap: 6px; }
.${P}-chips span { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 10px; background: #161618; box-shadow: inset 0 0 0 1px #28282c; font-size: 7.5px; font-weight: 500; color: #d3d3d8; white-space: nowrap; }
.${P}-chips span i { display: block; width: 5px; height: 5px; border-radius: 50%; background: #e8912b; }
.${P}-lab { flex: none; font-size: 8.5px; font-weight: 700; letter-spacing: .02em; color: #f0f0f2; }
.${P}-models { flex: none; display: flex; gap: 7px; }
.${P}-mc { flex: 1; box-sizing: border-box; height: 74px; padding: 8px; border-radius: 8px; background: #151517; box-shadow: inset 0 0 0 1px #26262a; display: flex; flex-direction: column; gap: 3px; }
.${P}-mc.${P}-on { box-shadow: inset 0 0 0 1.2px #e6e6e9; }
.${P}-mc i { display: block; height: 28px; margin: -2px -2px 3px; border-radius: 5px; }
.${P}-mc b { font-size: 8px; font-weight: 600; color: #f0f0f2; }
.${P}-mc small { display: flex; gap: 3px; font-size: 5.5px; font-weight: 700; color: #b8b8bf; }
.${P}-mc small em { font-style: normal; padding: 1px 3px; border-radius: 2px; background: #232327; }
.${P}-asp { flex: none; display: flex; gap: 7px; }
.${P}-asp span { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 6.5px; color: #9a9aa2; }
.${P}-asp span i { display: block; box-sizing: border-box; border-radius: 2px; box-shadow: inset 0 0 0 1px #4a4a52; background: #111113; }
.${P}-asp span.${P}-on { color: #f0f0f2; }
.${P}-asp span.${P}-on i { box-shadow: inset 0 0 0 1.2px #e6e6e9; background: #1b1b1e; }
.${P}-res { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 22px; padding: 0 9px; border-radius: 6px; background: #151517; font-size: 7.5px; color: #cfcfd5; }
.${P}-comp { margin-top: auto; flex: none; box-sizing: border-box; padding: 8px 9px 7px; border-radius: 12px; background: #151517; box-shadow: inset 0 0 0 1px #2a2a2e; }
.${P}-ctop { display: flex; align-items: center; gap: 8px; font-size: 8px; color: #e6e6e9; }
.${P}-plus { flex: none; width: 12px; height: 12px; font-size: 12px; line-height: 11px; text-align: center; color: #9a9aa2; }
.${P}-ptxt { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-tog { flex: none; display: flex; height: 14px; border-radius: 7px; background: #0e0e10; font-size: 6.5px; line-height: 14px; color: #9a9aa2; }
.${P}-tog span { padding: 0 6px; border-radius: 7px; }
.${P}-tog .${P}-on { background: #2b2b30; color: #f0f0f2; }
.${P}-crow { display: flex; align-items: center; gap: 5px; margin-top: 9px; font-size: 6.5px; color: #b3b3ba; white-space: nowrap; }
.${P}-crow span { display: flex; align-items: center; height: 15px; padding: 0 6px; border-radius: 5px; background: #1d1d20; }
.${P}-crow .${P}-sp { flex: 1; background: none; padding: 0; }
.${P}-gen { position: relative; flex: none; width: 24px; height: 24px; border-radius: 50%; background: #e8912b; }
.${P}-gen::after { content: ""; position: absolute; left: 7.5px; top: 9.5px; width: 6px; height: 6px; box-sizing: border-box; border-left: 1.8px solid #1a1206; border-top: 1.8px solid #1a1206; transform: rotate(45deg); }
.${P}-pn { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${PANEL_W}px; margin: 8px 8px 8px 0; padding: 9px 8px; border-radius: 10px; background: #111113; box-shadow: inset 0 0 0 1px #212124; }
.${P}-ph { flex: none; display: flex; align-items: center; justify-content: space-between; height: 14px; font-size: 8.5px; font-weight: 700; color: #f4f4f6; }
.${P}-ph small { font-size: 7px; font-weight: 500; color: #a8a8b0; }
.${P}-q { flex: none; display: flex; flex-direction: column; gap: 5px; }
.${P}-gh { display: flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; height: 24px; border-radius: 7px; background: #1b1b1e; font-size: 8px; font-weight: 600; color: #d4d4da; font-variant-numeric: tabular-nums; white-space: nowrap; }
.${P}-spin { position: relative; display: block; width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #3a3a40; }
.${P}-spin::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, #bdbdc4 0deg, #bdbdc4 100deg, transparent 101deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.4px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.4px)); }
.${P}-pill { display: grid; place-items: center; box-sizing: border-box; height: 20px; border-radius: 6px; background: #1b1b1e; font-size: 7.5px; font-weight: 500; color: #d9d9de; }
.${P}-pill.${P}-red { background: #2a1517; color: #e8706c; }
.${P}-jobs { text-align: center; font-size: 6.5px; color: #8e8e96; }
.${P}-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 3px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 6px; overflow: hidden; background: #151517; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-slot { position: absolute; inset: 0; background: #151517; box-shadow: inset 0 0 0 1px #1d1d20; }
.${P}-end { flex: none; text-align: center; font-size: 6.5px; color: #6f6f77; }
`;

const PROMPT = 'A muse holding a handwritten note up in a lecture hall, meme style, bright colours';
const GEN_AT = 0.06;         // Generate is pressed this long after the card enters
const ISSUE = 0.16;          // the queue header takes over the panel
const FADE = 0.04;           // a strip slot thins away over this long before its picture is settled
const ASPECTS = [['1:1', 11, 11], ['4:5', 10, 12.5], ['9:16', 8, 14], ['16:9', 15, 8.5], ['3:2', 14, 9.5], ['2:3', 9.5, 14]];

export default {
  id: 'mage-space',
  label: 'Mage.space (2026)',
  source: {
    platform: 'Mage (mage.space), the web create surface (desktop browser, dark theme; a tutorial screen recording on YouTube, 2026-05-09)',
    feature: "bottom composer with the solid orange circular Generate button; the right 'Recent creations' panel's header swaps to a spinner glyph and 'Generating: k/10' with Cancel / Pause Queue / Clear Queue pills and a '1 job running' line, finished pictures filing into the panel's strip (adapted to 10: k counts the job in flight, ten pictures land in strict order; the Fast Mode upsell is omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=m3SFNxYvp18', retrieved: '2026-10-14' }],
    // the footage shows a single in-flight job and a single-column strip with the newest first; the ten-job counter and the 3-column in-order fill are ours
    extrapolated: ["'Generating: k/10' counting up through ten jobs", 'the strip as a 3-column grid filling in order (the app shows one column, newest first)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'mage-space');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-slot"></div></div>`;
    const models = [['Mango 2', 'linear-gradient(135deg, #5b3f2a, #c98a52)', true], ['Mango 3d', 'linear-gradient(135deg, #7a4a1c, #e6b066)'], ['Mango', 'linear-gradient(135deg, #3a4a5a, #8fa6b8)']];
    const mc = ([n, bg, on]) => `<div class="${P}-mc${on ? ` ${P}-on` : ''}"><i style="background: ${bg}"></i><b>${n}</b><small><em>BASE</em><em>PHOTOREALISM</em></small></div>`;
    const asp = ([n, w, h], i) => `<span${i === 1 ? ` class="${P}-on"` : ''}><i style="width: ${w * 1.4}px; height: ${h * 1.4}px"></i>${n}</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-main"><div class="${P}-chips"><span>Prompt Enhance</span><span><i></i>Prompt Flair</span><span>Dynamic Prompt</span></div><div class="${P}-lab">Model</div><div class="${P}-models">${models.map(mc).join('')}</div><div class="${P}-lab">Aspect Ratio</div><div class="${P}-asp">${ASPECTS.map(asp).join('')}</div><div class="${P}-lab">Resolution</div><div class="${P}-res">1K</div><div class="${P}-comp"><div class="${P}-ctop"><i class="${P}-plus">+</i><span class="${P}-ptxt">${x.esc(PROMPT)}</span><div class="${P}-tog"><span class="${P}-on">Image</span><span>Video</span></div></div><div class="${P}-crow"><span>Mango 2</span><span>Fast</span><span>Character</span><span>Reference</span><span>Advanced</span><span class="${P}-sp"></span><i class="${P}-gen"></i></div></div></div><div class="${P}-pn"><div class="${P}-ph">Recent creations<small>Hide &gt;&gt;</small></div><div class="${P}-q" style="display: none"><div class="${P}-gh"><i class="${P}-spin"></i><span class="${P}-gk"></span><small>&#8964;</small></div><div class="${P}-pill">Cancel</div><div class="${P}-pill">Pause Queue</div><div class="${P}-pill ${P}-red">Clear Queue</div><div class="${P}-jobs">1 job running</div></div><div class="${P}-strip">${tiles.map(cell).join('')}</div><div class="${P}-end">You've reached the end</div></div></div>`);
    const q = root.querySelector(`.${P}-q`), gk = root.querySelector(`.${P}-gk`), spin = root.querySelector(`.${P}-spin`), gen = root.querySelector(`.${P}-gen`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-slot`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        // the orange circle is pressed (it never changes)
        const gp = press(t, ctx.cardIn + GEN_AT, 0.05, 0.05, 0.12);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.12 * gp).toFixed(4)})` : 'none'; });

        // the queue header: k is the job in flight, the landed count + 1
        let done = 0;
        for (let i = 0; i < ctx.count; i++) if (t >= ctx.seq(i)[1]) done++;
        const on = t >= ctx.cardIn + ISSUE && done < ctx.count;
        put('q', on, (v) => { q.style.display = v ? '' : 'none'; });
        put('k', Math.min(ctx.count, done + 1), (v) => { gk.textContent = `Generating: ${v}/${ctx.count}`; });
        put('sp', Math.round(t * 540) % 360, (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // the strip: each finished picture is filed in order
        cells.forEach((c, i) => {
          const land = ctx.seq(i)[1];
          const f = seg(t, land - FADE, land);
          put(`i${i}`, t >= land - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cover.style.display = 'none'; c.cover.style.opacity = ''; } else { c.cover.style.display = ''; c.cover.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
