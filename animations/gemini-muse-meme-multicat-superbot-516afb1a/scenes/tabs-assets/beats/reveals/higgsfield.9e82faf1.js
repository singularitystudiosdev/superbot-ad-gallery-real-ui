// Higgsfield Katana's launch films on X (spec .tmp/clone-9e82faf1/reveal-refs/higgsfield/spec.json, confidence 0.6; frames in
// reveal-refs/higgsfield/x1/card/sheet.png). The ads show NO generation state: no grid, bar, spinner, timer or status string. What
// they show is the brief being written and sent, then a cut: a warm off-white rounded composer card (placeholder 'Describe
// your idea', a thin '+', a mint rounded-square tool mark + 'Higgsfield Katana', a model chip and a coral round send button
// with a white up-arrow); a reference thumbnail pops in top-left and the prompt types in; the camera pushes in on the send
// button, which blooms magenta; the card collapses to a short pill; then a HARD CUT (no fade, no blur resolve) to the
// finished footage, each clip stamped with a lime 'KATANA MODE' badge.
// Adapted to ten images inside the beat window: the same flow, then the ten images snap in one after another in reading
// order, each stamped with that badge (text only), under the collapsed pill. The mint mark is a plain stand-in shape and the
// face is the system UI stack: none of the platform's glyph, logo or fonts is drawn or shipped.
import { clamp, seg, outCubic, outBack, lerp, typed } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hf';
const CARD_H = 270, PILL_H = 50;   // the drafting card's height and the collapsed pill's, px
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; min-height: ${CARD_H + 24}px; padding: 12px; border-radius: 28px; background: #eeeeee; color: #1b1b1b; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-cp { position: relative; height: ${CARD_H}px; border-radius: 28px; background: #f6f4f4; box-shadow: 0 0 0 1px rgba(0, 0, 0, .07), 0 12px 32px rgba(0, 0, 0, .09); overflow: hidden; transform-origin: 90% 86%; }
.${P}-full { position: absolute; left: 0; top: 0; right: 0; height: ${CARD_H}px; box-sizing: border-box; display: flex; flex-direction: column; padding: 22px 22px 20px; }
.${P}-th { flex: none; width: 64px; height: 64px; border-radius: 12px; overflow: hidden; background: #dcdad9; box-shadow: 0 6px 16px rgba(0, 0, 0, .14); transform-origin: 0 0; }
.${P}-th img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-tx { flex: none; margin-top: 16px; min-height: 26px; font-size: 18px; line-height: 26px; color: #1b1b1b; white-space: nowrap; overflow: hidden; }
.${P}-ph { color: #a2a2a2; }
.${P}-tx i { display: inline-block; width: 1.5px; height: 19px; margin-left: 1px; vertical-align: -3px; background: #1b1b1b; }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 12px; height: 40px; margin-top: auto; white-space: nowrap; }
.${P}-plus { flex: none; width: 16px; height: 16px; stroke: #8f8d8d; stroke-width: 1.3; stroke-linecap: round; fill: none; }
.${P}-chip { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #111; }
.${P}-mk { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: #57ffbf; }
.${P}-mk::after { content: ""; width: 9px; height: 9px; border-radius: 3px; background: #0d0d0d; transform: rotate(45deg); }
.${P}-sp { flex: 1; }
.${P}-model { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #656565; }
.${P}-model i { width: 8px; height: 8px; border-radius: 50%; background: #e8825f; }
.${P}-go { flex: none; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: #ebcfc7; }
.${P}-go svg, .${P}-pgo svg { width: 18px; height: 18px; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pill { position: absolute; left: 0; top: 0; right: 0; height: ${PILL_H}px; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 0 10px 0 15px; opacity: 0; white-space: nowrap; }
.${P}-pill .${P}-chip { font-size: 13px; }
.${P}-pill .${P}-mk { width: 20px; height: 20px; border-radius: 5px; }
.${P}-pq { flex: 1; min-width: 0; font-size: 13px; color: #8f8d8d; overflow: hidden; text-overflow: ellipsis; }
.${P}-pgo { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: #ee4ba1; box-shadow: 0 0 0 4px rgba(238, 75, 161, .16); }
.${P}-pgo svg { width: 15px; height: 15px; }
.${P}-gr { display: none; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-bd { position: absolute; left: 5px; bottom: 5px; display: none; height: 14px; padding: 0 5px; border-radius: 4px; background: #ecff35; color: #0b0b0b; font-size: 7.5px; line-height: 14px; font-weight: 800; letter-spacing: .02em; transform-origin: 0 100%; }
`;

const PROMPT = 'Aura farming edit of my meme';
const BADGE = 'KATANA MODE';
// the beat in seconds from the card's entrance, laid out for a window of REF seconds (cardIn .. lastLand) and stretched with it
const REF = 1.84;
const THUMB = [0.03, 0.2];     // the reference thumbnail pops in
const TYPE0 = 0.14, CPS = 56;  // the brief types in
const BLOOM = [0.66, 0.9];     // the camera pushes in on the send button, which blooms magenta
const COLLAPSE = [0.9, 1.1];   // the card collapses to a pill
const CUT = 1.12;              // the hard cut to the results; the ten images land from here to the window's end
const PUSH = 0.04;             // the push-in's extra scale
const CORAL = [243, 143, 122], MAGENTA = [238, 75, 161], DIM = [235, 207, 199];
const mix = (a, b, f) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], f))).join(',')})`;
const ARROW = '<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>';

export default {
  id: 'higgsfield',
  label: 'Higgsfield Katana',
  source: {
    platform: "Higgsfield Katana, the Claude/MCP skill's launch films on X (composer card with the Higgsfield tool chip)",
    feature: 'Composer brief typed and sent (tool chip, send button blooming magenta, card collapsing to a pill), then a hard cut to the results stamped with a KATANA MODE badge (adapted to 10 images)',
    refs: [
      { url: 'https://x.com/higgsfield/status/2108294775644585998', retrieved: '2026-10-14' },
      { url: 'https://x.com/higgsfield/status/2109728823017365536', retrieved: '2026-10-14' },
      { url: 'https://higgsfield.ai/blog/higgsfield-katana', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'higgsfield');
    const chip = `<span class="${P}-chip"><i class="${P}-mk"></i>Higgsfield Katana</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-cp"><div class="${P}-full"><div class="${P}-th"><img src="${src}" width="870" height="1024" decoding="sync" alt="Reference"/></div><div class="${P}-tx"><span class="${P}-ph">Describe your idea</span><span class="${P}-ty"></span><i></i></div><div class="${P}-bar"><svg class="${P}-plus" viewBox="0 0 16 16"><path d="M8 2v12M2 8h12"/></svg>${chip}<span class="${P}-sp"></span><span class="${P}-model"><i></i>Opus 5.5</span><span class="${P}-go">${ARROW}</span></div></div><div class="${P}-pill">${chip}<span class="${P}-pq">${x.esc(PROMPT)}</span><span class="${P}-pgo">${ARROW}</span></div></div><div class="${P}-gr">${tiles.map((g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><span class="${P}-bd">${BADGE}</span></div>`).join('')}</div></div>`);
    const cp = root.querySelector(`.${P}-cp`), full = root.querySelector(`.${P}-full`), pill = root.querySelector(`.${P}-pill`);
    const th = root.querySelector(`.${P}-th`), ph = root.querySelector(`.${P}-ph`), ty = root.querySelector(`.${P}-ty`), caret = root.querySelector(`.${P}-tx i`);
    const go = root.querySelector(`.${P}-go`), gr = root.querySelector(`.${P}-gr`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), bd: n.querySelector(`.${P}-bd`), g: tiles[i], shown: false, bdOn: false }));
    ctx.gate([th.querySelector('img'), ...cells.map((c) => c.im)]);

    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        const L = ctx.lastLand - ctx.cardIn, k = L / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                     // layout seconds since the card entered
        const cut = s >= CUT;

        // the reference thumbnail pops in, top-left inside the composer
        const tp = seg(s, ...THUMB);
        th.style.opacity = clamp(tp * 3).toFixed(3);
        th.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.7, 1, outBack(tp)).toFixed(4)})`;

        // the brief types in; the placeholder goes with the first character
        const ty0 = typed(PROMPT, ctx.cardIn + TYPE0 * k, CPS / k, t);
        put('ty', ty0.text, (v) => { ty.textContent = v; });
        put('ph', ty0.n > 0, (on) => { ph.style.display = on ? 'none' : ''; });
        put('caret', !ty0.done || s < BLOOM[0] ? 'visible' : 'hidden', (v) => { caret.style.visibility = v; });

        // the send button: dim until there is a brief, coral once there is, then the push-in blooms it magenta
        const b = outCubic(seg(s, ...BLOOM));
        const live = clamp(ty0.n / 3);
        const glow = b > 0 && !cut
          ? `0 0 0 ${(7 * b).toFixed(1)}px rgba(238, 75, 161, ${(0.26 * b).toFixed(3)}), 0 0 ${(30 * b).toFixed(1)}px ${(8 * b).toFixed(1)}px rgba(238, 75, 161, ${(0.55 * b).toFixed(3)})`
          : 'none';
        go.style.background = b > 0 ? mix(CORAL, MAGENTA, b) : mix(DIM, CORAL, live);
        go.style.boxShadow = glow;
        go.style.transform = b > 0 && b < 1 ? `scale(${(1 + 0.12 * Math.sin(Math.PI * b)).toFixed(4)})` : 'none';
        cp.style.transform = !cut && b > 0 ? `scale(${(1 + PUSH * b).toFixed(4)})` : 'none';

        // the card collapses to a short pill (its drafting face gives way to the pill's)
        const c = cut ? 1 : outCubic(seg(s, ...COLLAPSE));
        cp.style.height = c >= 1 ? `${PILL_H}px` : `${lerp(CARD_H, PILL_H, c).toFixed(2)}px`;
        cp.style.borderRadius = `${lerp(28, PILL_H / 2, c).toFixed(2)}px`;
        full.style.opacity = (1 - clamp(c * 2)).toFixed(3);
        full.style.visibility = c >= 0.5 ? 'hidden' : '';
        pill.style.opacity = clamp((c - 0.4) / 0.6).toFixed(3);

        // the hard cut: the results grid is simply there, then each image snaps in, in reading order, stamped with the badge
        put('gr', cut, (on) => { gr.style.display = on ? 'grid' : 'none'; });
        const step = (L / k - CUT) / cells.length;
        cells.forEach((cell, i) => {
          const a = CUT + i * step;
          const on = s >= a;
          if (cell.shown !== on) { cell.im.style.display = on ? 'block' : 'none'; cell.shown = on; }
          cell.im.style.filter = restFilter(cell.g);
          cell.im.style.transform = restTransform(cell.g);
          // the stamp lands a beat after its image, from a touch oversize, and rests at 'none'
          const bp = seg(s, a + 0.03, a + 0.03 + 0.06);
          const bdOn = s >= a + 0.03;
          if (cell.bdOn !== bdOn) { cell.bd.style.display = bdOn ? 'block' : 'none'; cell.bdOn = bdOn; }
          cell.bd.style.transform = bp >= 1 || !bdOn ? 'none' : `scale(${lerp(1.5, 1, outCubic(bp)).toFixed(4)})`;
        });
      },
    };
  },
};
