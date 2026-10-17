// Mistral's 'all new Le Chat' as its launch film shows it (the @MistralAI launch post on X, 2025-02-06, t=29.0-33.0 s; spec
// .tmp/clone-9e82faf1/reveal-refs/mistral-le-chat/spec.json, confidence 0.6; frames o_mistral_prompt_t29.0, o_mistral_pending_a/b/c,
// o_mistral_land_t31.25, o_mistral_result_t33.0). A dark chat window: the composer holds the typed prompt with the tool chips
// 'Canvas | Web search | Image generation' under it, the last one highlighted, and a round send button. After sending, the
// assistant's reply is a wide dark rounded bubble (#3A3A3A) with a square avatar at its left and three small dots that blink in a
// travelling wave: no text, no percentage, no bar, no skeleton. About 1.3 s later the assistant's line is written out and the picture
// lands inside the same bubble. The source is a produced brand film (its timing may be compressed), so only what is on screen is drawn.
// Adapted to ten images: the reply bubble holds a 5 x 2 grid of ten slots, each showing its own three-dot state until its picture
// lands, strictly one after another; the bubble's header row keeps the dots until the first picture lands and then reads the
// assistant's line. Omitted: the film's perspective tilt and glow, the orange 'M' mark (a neutral square avatar instead), the user's
// photo (a neutral round avatar), and the rest of the app (sidebar, history). The footage's picture is never reproduced: every slot
// is our own meme; no logo, wordmark or platform font is drawn (system type, plain line icons).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mlc';
const ROOT_H = 520;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #161616; color: #ececec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a2a2a; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 14px; }
.${P}-hd svg { display: block; flex: none; width: 15px; height: 15px; fill: none; stroke: #9a9a9a; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd b { font-size: 12px; font-weight: 500; color: #bdbdbd; }
.${P}-chat { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; padding: 4px 16px 0; overflow: hidden; }
.${P}-me { flex: none; display: flex; justify-content: flex-end; align-items: flex-start; gap: 8px; }
.${P}-ub { max-width: 330px; padding: 8px 12px; border-radius: 12px 12px 3px 12px; background: #262626; font-size: 13px; line-height: 18px; color: #f1f1f1; }
.${P}-me i { flex: none; display: block; width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 50% 38%, #cfcfcf 0 22%, transparent 24%), radial-gradient(ellipse at 50% 100%, #cfcfcf 0 48%, transparent 50%), #5a5a5a; }
.${P}-rp { flex: none; box-sizing: border-box; padding: 12px; border-radius: 14px; background: #3a3a3a; }
.${P}-rh { position: relative; height: 26px; }
.${P}-av { position: absolute; left: 0; top: 0; display: block; width: 24px; height: 24px; border-radius: 6px; background: #8c8c8c; box-shadow: inset 0 0 0 5px #6f6f6f; }
.${P}-dots { position: absolute; left: 36px; top: 0; display: flex; align-items: center; gap: 6px; height: 24px; }
.${P}-dots i { display: block; width: 5px; height: 5px; border-radius: 1.5px; background: #ffffff; }
.${P}-say { position: absolute; left: 36px; right: 0; top: 0; font-size: 13.5px; line-height: 24px; color: #f4f4f4; white-space: nowrap; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 7px; overflow: hidden; background: #2c2c2c; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: grid; place-items: center; background: #2c2c2c; }
.${P}-c .${P}-dots { position: static; }
.${P}-cp { flex: none; box-sizing: border-box; margin: 12px 16px 14px; padding: 10px 12px 10px 14px; border-radius: 16px; background: #232323; box-shadow: 0 0 0 1px #343434; }
.${P}-in { height: 22px; font-size: 13.5px; line-height: 22px; color: #f1f1f1; white-space: nowrap; overflow: hidden; }
.${P}-in span { color: #7a7a7a; }
.${P}-row { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
.${P}-row em { font-style: normal; display: flex; align-items: center; height: 26px; padding: 0 9px; border-radius: 6px; font-size: 12px; color: #a3a3a3; white-space: nowrap; }
.${P}-row em.on { background: rgba(255, 138, 40, .26); color: #ffb06a; box-shadow: inset 0 0 0 1px rgba(255, 138, 40, .35); }
.${P}-send { margin-left: auto; flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: #2fb8a8; }
.${P}-send svg { display: block; width: 14px; height: 14px; fill: none; stroke: #052a26; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'Generate ten Muse memes for my friends. They love late-night study sessions.';
const SAY = 'Here are ten Muse memes for your friends.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SEND_AT = 0.1;                              // the cursor presses send
const SENT = 0.22;                                // the message moves out of the composer into the chat
const REPLY = 0.34;                               // the reply bubble appears, every slot at its dots state
const LAND = Array.from({ length: 10 }, (_, i) => 0.52 + i * 0.1422);   // slot i lands in reading order, the last at 1.80
const FADE = 0.05;                                // a slot's dots cover thins away over this long before the picture lands
const WAVE = 1.5;                                 // dot-wave cycles per second

export default {
  id: 'mistral-le-chat',
  label: 'Mistral Le Chat (2025)',
  source: {
    platform: "Mistral AI 'all new Le Chat' web app (dark theme), as shown in Mistral's own launch film on X, 2025-02-06",
    feature: "dark chat window: a composer with the typed prompt, tool chips 'Canvas | Web search | Image generation' (the last highlighted) and a round send button; the reply is a wide dark rounded bubble (#3A3A3A) with a square avatar and three animated dots (no text, percentage or bar) until the picture lands in it (adapted to 10: the reply bubble holds a 5 x 2 grid of ten slots, each showing the three-dot state until its picture lands, strictly one after another; the film's perspective tilt, the orange M avatar and the user's photo are replaced by neutral stand-ins; the source is a produced brand film, so its timing may be compressed)",
    refs: [{ url: 'https://x.com/MistralAI/status/1887517520040448510', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-slot grid inside one reply bubble (the film shows a single picture)', 'the per-slot dots state', "the prompt and the assistant's line (the film's own wording is about a birthday card)"],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'mistral-le-chat');
    const dots3 = '<i></i><i></i><i></i>';
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-c"><div class="${P}-dots">${dots3}</div></div></div>`;
    const menu = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7"/></svg>';
    const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.6 7.2 8 2.8l4.4 4.4"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${menu}<b>New chat</b></div><div class="${P}-chat"><div class="${P}-me" style="visibility: hidden"><div class="${P}-ub">${x.esc(PROMPT)}</div><i></i></div><div class="${P}-rp" style="visibility: hidden"><div class="${P}-rh"><i class="${P}-av"></i><div class="${P}-dots">${dots3}</div><div class="${P}-say" style="visibility: hidden">${x.esc(SAY)}</div></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div><div class="${P}-cp"><div class="${P}-in"><b style="font-weight: 400">${x.esc(PROMPT)}</b><span style="display: none">Ask Le Chat anything</span></div><div class="${P}-row"><em>Canvas</em><em>Web search</em><em class="on">Image generation</em><div class="${P}-send">${arrow}</div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const me = q('me'), rp = q('rp'), say = q('say'), send = q('send'), typed = q('in').firstElementChild, ph = q('in').lastElementChild;
    const head = q('rh').querySelector(`.${P}-dots`);
    const wave = [...head.children];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-c`), dots: [...n.querySelectorAll(`.${P}-dots i`)], g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    // three dots blinking in a travelling wave: dot j peaks a third of a cycle after dot j-1; a function of t alone
    const beat = (key, ds, phase) => ds.forEach((d, j) => {
      const w = 0.5 + 0.5 * Math.sin(2 * Math.PI * (phase - j / 3));
      const a = (0.28 + 0.72 * w).toFixed(2), y = (-1.5 * w).toFixed(1);
      put(`${key}${j}`, a + y, () => { d.style.background = `rgba(255, 255, 255, ${a})`; d.style.transform = `translateY(${y}px)`; });
    });

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // send is pressed; the prompt then moves from the composer into the chat as the user's message
        const sp = press(s, SEND_AT, 0.06, 0.06, 0.14);
        put('snd', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.1 * sp).toFixed(4)})` : 'none'; });
        put('sent', s >= SENT, (v) => { me.style.visibility = v ? '' : 'hidden'; typed.style.display = v ? 'none' : ''; ph.style.display = v ? '' : 'none'; });

        // the reply bubble: avatar and three dots at the start (the header row), ten slots each at its own dots state
        put('rep', s >= REPLY, (v) => { rp.style.visibility = v ? '' : 'hidden'; });
        const said = s >= LAND[0] - FADE;
        put('say', said, (v) => { say.style.visibility = v ? '' : 'hidden'; head.style.visibility = v ? 'hidden' : ''; });
        beat('h', wave, t * WAVE);

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cov.style.display = 'none'; c.cov.style.opacity = ''; } else { c.cov.style.display = ''; c.cov.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          beat(`d${i}-`, c.dots, t * WAVE - i * 0.11);   // each slot's wave is offset from its neighbour's
        });
      },
    };
  },
};
