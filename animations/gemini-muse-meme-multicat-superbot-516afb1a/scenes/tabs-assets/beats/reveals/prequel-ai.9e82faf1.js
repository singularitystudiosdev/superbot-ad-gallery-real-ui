// Prequel AI Avatar, the Prequel photo editor's generation wait (Prequel Inc., Android, Feb 2023; YouTube Ojr5Jl8mdkI 'Ai Avatar photo
// Generator free 100% || ... prequel app', Awais, 2023-02-25, t=44-86 s; corroboration 6dji6m5mAgg, 2023-02-21; spec
// .tmp/clone-9e82faf1/reveal-refs/prequel-ai/spec.json, confidence 0.68; frames an_prequel_ai_avatar_tile_48s.png,
// an_prequel_polishing_62s.png, an_prequel_making_stuff_up_86s.png). The editor is a dark screen: a 'Next' chip top-left, a tool row
// (Filters / Adjust / Beauty / Canvas / Heal / Aa) and, on the right, a rail of AI tiles ('AI AVATAR', 'AI CARTOON', 'AI ARCANE',
// 'AI FANTASY'). Tapping AI AVATAR and generating blankets the whole editor in a near-black veil (the picture and chrome still faintly
// visible behind it): a big donut (a #3A3A3A track around a grey-and-white disc with a black hole) with a small orange dot orbiting
// its rim, a status line that rotates through 'Importing...' over '100 %', 'Effecting effects...', 'Polishing pixels to perfection...',
// 'Making stuff up…..', the fixed line 'Please don't close Prequel or lock your device' and a circular X at the bottom-left. The
// finished render replaces the veil: it simply lifts. There are no per-image placeholders and no bar.
// The footage is a landscape recording of a phone held sideways, so its status and warning lines run vertically; upright they are
// horizontal, and that is how they are drawn in this 560-wide column.
// Adapted to ten images: the editor canvas is a 5 + 5 block of ten dark panels; the veil rises over it at the tap, the status copy
// rotates from render(t) while the dot orbits, then the veil thins and the ten pictures land in strict reading order (row 1 left to
// right, then row 2) under it, the dot and the copy ending with the veil.
// Extrapolated (not witnessed): the order and timing of the four status lines (the clip caught them on different passes, in the order
// 'Importing...' t=44, 'Effecting effects...' t=17 of an earlier pass, 'Polishing...' t=62, 'Making stuff up…..' t=86), the ten-picture
// 5 + 5 block (the app shows one avatar photo), and the veil thinning away tile by tile (the clip shows it lifting at once).
// Omitted on purpose: the paid-tier countdown line the veil carries on some passes, and any logo or wordmark of the app; the pictures
// are our own memes, the tile art is plain gradients and system type.
import { seg, press, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pql';
const ROOT_H = 340, RAIL_W = 92, COLS = 5, GAP = 6;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #111111; color: #ffffff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262626; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 14px; height: 38px; padding: 0 10px; background: #1c1c1c; }
.${P}-next { flex: none; display: grid; place-items: center; height: 20px; padding: 0 11px; border-radius: 10px; background: #ffffff; font-size: 9.5px; font-weight: 700; color: #111111; }
.${P}-tools { flex: 1; display: flex; justify-content: space-around; padding: 0 6px; }
.${P}-tool { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 6.5px; color: #cfcfcf; }
.${P}-tool i { display: block; width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #e8e8e8; }
.${P}-tool b { font-size: 12px; font-weight: 600; line-height: 14px; color: #e8e8e8; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-g { position: absolute; left: 12px; right: 12px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; background: #232323; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #232323; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${RAIL_W}px; padding: 6px 12px 0 10px; background: #1c1c1c; overflow: hidden; }
.${P}-rh { flex: none; height: 12px; font-size: 7px; font-weight: 700; letter-spacing: .6px; line-height: 12px; color: #8c8c8c; }
.${P}-ai { flex: none; display: flex; flex-direction: column; gap: 2px; }
.${P}-art { position: relative; box-sizing: border-box; height: 48px; border-radius: 8px; }
.${P}-art em { position: absolute; left: 4px; top: 4px; font-style: normal; font-size: 5.5px; font-weight: 800; line-height: 8px; padding: 0 3px; border-radius: 3px; background: rgba(17, 17, 17, .7); color: #ffffff; }
.${P}-art span { position: absolute; left: 0; right: 0; bottom: 5px; text-align: center; font-size: 8px; font-weight: 800; letter-spacing: .3px; color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, .45); }
.${P}-ai.${P}-on .${P}-art { box-shadow: 0 0 0 2px #ffffff; }
.${P}-cap { height: 9px; font-size: 6px; line-height: 9px; color: #9a9a9a; white-space: nowrap; }
.${P}-veil { position: absolute; inset: 0; }
.${P}-vb { position: absolute; inset: 0; background: #000000; }
.${P}-vc { position: absolute; inset: 0; }
.${P}-donut { position: absolute; left: 50%; top: 122px; width: 120px; height: 120px; margin-left: -60px; }
.${P}-trk { position: absolute; inset: 0; border-radius: 50%; background: #3a3a3a; }
.${P}-disc { position: absolute; left: 10px; top: 10px; width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(90deg, #b8b8b8 0 50%, #ffffff 50% 100%); }
.${P}-hole { position: absolute; left: 36px; top: 36px; width: 48px; height: 48px; border-radius: 50%; background: #000000; }
.${P}-orb { position: absolute; inset: 0; }
.${P}-dot { position: absolute; left: 53px; top: -3px; width: 14px; height: 14px; border-radius: 50%; background: #f5a623; }
.${P}-st { position: absolute; left: 0; right: 0; top: 252px; display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 13px; letter-spacing: .3px; color: #ffffff; }
.${P}-st b { font-weight: 500; }
.${P}-st small { font-size: 11px; color: #d6d6d6; }
.${P}-warn { position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-size: 10.5px; color: #7a7a7a; }
.${P}-x { position: absolute; left: 12px; bottom: 10px; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #2c2c2c; }
.${P}-x svg { width: 10px; height: 10px; fill: none; stroke: #ffffff; stroke-width: 1.8; stroke-linecap: round; }
`;

const q3 = (v) => Math.round(v * 1000) / 1000;   // memo keys and the writes they guard use the same rounded value
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TAP_AT = 0.06;                              // AI AVATAR is tapped
const ISSUE = 0.16;                               // the veil rises
const RISE = 0.08;                                // ...over this long
const VEIL = 0.9;                                 // the veil's darkness (the picture stays faintly visible behind it)
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i is finished (reading order), the last at 1.6825
const FADE = 0.06;                                // a panel's cover thins away over this long before the picture shows
const THIN = [0.7, LAND[9]];                      // the veil thins from darkest to gone
const COPY = [                                    // the rotating status line, verbatim: [from, headline, second line]
  [0, 'Importing...', '100 %'],
  [0.5, 'Effecting effects...', ''],
  [0.86, 'Polishing pixels to perfection...', ''],
  [1.22, 'Making stuff up…..', ''],
];
const AI = [['AVATAR', 'linear-gradient(160deg, #ff7a59, #c23b8a)'], ['CARTOON', 'linear-gradient(160deg, #ffd166, #ef476f)'], ['ARCANE', 'linear-gradient(160deg, #36b5a8, #234e70)'], ['FANTASY', 'linear-gradient(160deg, #9b6bff, #2f2a6b)']];

export default {
  id: 'prequel-ai',
  label: 'Prequel AI avatar (2023)',
  source: {
    platform: 'Prequel photo editor (Prequel Inc.), Android app, AI Avatar generation wait (phone screen recordings on YouTube, Feb 2023)',
    feature: "dark editor ('Next' chip, tool row, right rail of AI tiles AI AVATAR / AI CARTOON / AI ARCANE / AI FANTASY) blanketed on tap by a near-black veil: a grey-and-white donut with a small orange dot orbiting its rim, a status line rotating 'Importing...' + '100 %' / 'Effecting effects...' / 'Polishing pixels to perfection...' / 'Making stuff up…..', the fixed line 'Please don't close Prequel or lock your device' and a circular X bottom-left; the veil then lifts (adapted to 10: a 5 + 5 canvas of panels whose pictures land in reading order as the veil thins; the footage's vertical text is drawn upright; the paid-tier countdown line is omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=Ojr5Jl8mdkI', video: 'Ojr5Jl8mdkI', published: '2023-02-25', retrieved: '2026-10-14', note: 'primary wait capture, t=44 s Importing + 100 %, t=48 s editor with the AI rail, t=62 s Polishing, t=86 s Making stuff up' },
      { url: 'https://www.youtube.com/watch?v=6dji6m5mAgg', video: '6dji6m5mAgg', published: '2023-02-21', retrieved: '2026-10-14', note: 'corroboration, the photo picker step before the wait' },
    ],
    extrapolated: [
      'the ten-picture 5 + 5 landing block and its strict reading order (the app applies one avatar to one photo)',
      'the veil thinning while pictures land (the footage shows it lifting at once)',
      'the order and the timing of the four status lines (caught on different passes), and that the orbit freezes when the veil is gone',
      'the status and warning lines drawn upright (the recording is of a sideways phone)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'prequel-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const tool = (n, ic) => `<div class="${P}-tool">${ic || '<i></i>'}${n}</div>`;
    const rail = AI.map(([n, bg], i) => `<div class="${P}-ai${i === 0 ? ` ${P}-on` : ''}"><div class="${P}-art" style="background: ${bg}"><em>AI</em><span>${n}</span></div><div class="${P}-cap">AI ${n}</div></div>`).join('');
    const xs = '<svg viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-next">Next</div><div class="${P}-tools">${tool('Filters')}${tool('Adjust')}${tool('Beauty')}${tool('Canvas')}${tool('Heal')}${tool('Text', `<b>Aa</b>`)}</div></div><div class="${P}-body"><div class="${P}-cv"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-rail"><div class="${P}-rh">FOR YOU</div>${rail}</div></div><div class="${P}-veil" style="display: none"><div class="${P}-vb"></div><div class="${P}-vc"><div class="${P}-donut"><div class="${P}-trk"></div><div class="${P}-disc"></div><div class="${P}-hole"></div><div class="${P}-orb"><div class="${P}-dot"></div></div></div><div class="${P}-st"><b>${COPY[0][1]}</b><small>${COPY[0][2]}</small></div><div class="${P}-warn">Please don't close Prequel or lock your device</div><div class="${P}-x">${xs}</div></div></div></div>`);
    const q = (c) => root.querySelector(`.${P}-${c}`);
    const aiOn = q('ai');
    const veil = q('veil'), vb = q('vb'), vc = q('vc'), orb = q('orb'), head = q('st').firstChild, sub = q('st').lastChild;
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
        const sc = Math.min(s, LAND[9]);               // everything that moves from t stops here, once the veil is gone

        // AI AVATAR is tapped
        const tp = q3(press(s, TAP_AT, 0.06, 0.06, 0.14));
        put('tap', tp.toFixed(3), () => { aiOn.style.transform = tp > 0 ? `scale(${(1 - 0.06 * tp).toFixed(4)})` : 'none'; });

        // the veil rises over the editor, thins as the pictures land, and is gone with the last one
        const rise = seg(s, ISSUE, ISSUE + RISE);
        const thin = outCubic(seg(s, THIN[0], THIN[1]));
        const bgA = s >= LAND[9] ? 0 : VEIL * rise * (1 - thin);
        const fgA = s >= LAND[9] ? 0 : rise * (1 - seg(s, 1.2, LAND[9] - 0.05));
        put('vis', bgA > 0, (v) => { veil.style.display = v ? '' : 'none'; });
        put('vb', bgA.toFixed(3), () => { vb.style.opacity = bgA.toFixed(3); });
        put('vc', fgA.toFixed(3), () => { vc.style.opacity = fgA.toFixed(3); });

        // the dot orbits the donut's rim with t
        const deg = (((sc - ISSUE) * 540) % 360 + 360) % 360;
        put('orb', deg.toFixed(0), (d) => { orb.style.transform = `rotate(${d}deg)`; });

        // the status line rotates
        let ci = 0;
        COPY.forEach((c, i) => { if (sc >= c[0]) ci = i; });
        put('copy', ci, (i) => { head.textContent = COPY[i][1]; sub.textContent = COPY[i][2]; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = q3(seg(s, a - FADE, a));
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
