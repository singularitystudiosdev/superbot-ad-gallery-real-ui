// An image bot inside a Poe chat (poe.com, 'FLUX-pro'; YouTube poNZBfX5GDw, Carleton Torpin, 2024-08-21, t=13:48-14:19; spec
// .tmp/clone-9e82faf1/reveal-refs/poe/spec.json, confidence 0.72; frames t_002.png, t_003.png, t_004.png, t_005.png, t_006.png). A dark two-column
// app: a narrow left rail of past chats and nav rows, and a chat column with the bot's name on top, a violet user bubble, the bot's reply
// and a rounded composer. The reply has no placeholder tile at all: it shows the line 'Generating image (Ns elapsed)' above ONE large
// cog-shaped ring (a scalloped circle, ~24 teeth) whose centre counts the elapsed seconds ('01 SEC' ... '19 SEC', ticking once a second)
// while a thin multicolour arc inside it grows clockwise, and a 'Stop' button below. When the image is ready the whole timer is removed
// and the finished image is dropped into the bubble in one step (no blur, no fade, no percentage, no queue label).
// Adapted to ten images: the bubble's image area is a 5 x 2 block of ten slots; the ring counts 01 to 19 SEC over the first part of the
// beat (the footage's ~19 s compressed), then the timer, the line and Stop go and the ten pictures hard-swap into their slots one by one
// in reading order (an unfilled slot is a bare reserved cell, as the footage shows no tile). Omitted: the Poe logo and badge, the bot's
// own avatar (a neutral disc), the hover toolbar, the caption and the Resend / Upscale / Animate row; the footage's pictures are never
// reproduced, every slot is our own meme.
import { seg, press, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-poe';
const ROOT_H = 440, RAIL_W = 118, COLS = 5, GAP = 5, AREA_H = 190, TEETH = 24;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0e0f12; color: #e8e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1e23; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 10px 7px; gap: 3px; background: #101114; box-shadow: inset -1px 0 0 #1b1c20; }
.${P}-mark { display: flex; align-items: center; gap: 5px; height: 18px; margin-bottom: 4px; font-size: 9px; font-weight: 700; color: #e8e9ec; }
.${P}-mark i { display: block; width: 9px; height: 9px; border-radius: 3px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); }
.${P}-nv { display: flex; align-items: center; gap: 5px; height: 16px; padding: 0 4px; font-size: 7px; color: #b4b6bc; white-space: nowrap; }
.${P}-nv i { flex: none; display: block; width: 7px; height: 7px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #70737b; }
.${P}-cv { box-sizing: border-box; display: flex; flex-direction: column; gap: 1px; padding: 5px 6px; border-radius: 6px; font-size: 7px; color: #d9dade; white-space: nowrap; overflow: hidden; }
.${P}-cv.on { background: #1d1e23; }
.${P}-cv small { font-size: 5.5px; color: #7f828a; overflow: hidden; text-overflow: ellipsis; }
.${P}-sp { flex: 1; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 0 14px 10px; }
.${P}-hd { flex: none; display: flex; align-items: center; justify-content: space-between; height: 34px; }
.${P}-hd b { font-size: 8px; font-weight: 600; color: #e8e9ec; }
.${P}-hd small { display: block; font-size: 6px; font-weight: 400; color: #7f828a; }
.${P}-hd span { height: 14px; padding: 0 6px; border-radius: 7px; background: #1d1e23; font-size: 6.5px; line-height: 14px; color: #b4b6bc; }
.${P}-msgs { position: relative; flex: 1; min-height: 0; }
.${P}-user { position: absolute; right: 0; top: 4px; box-sizing: border-box; max-width: 300px; padding: 6px 9px; border-radius: 10px 10px 3px 10px; background: #4f46e5; font-size: 7.5px; line-height: 10.5px; color: #fff; }
.${P}-bot { position: absolute; left: 0; right: 0; top: 52px; }
.${P}-who { display: flex; align-items: center; gap: 5px; height: 16px; font-size: 7px; color: #b4b6bc; }
.${P}-who i { display: block; width: 12px; height: 12px; border-radius: 50%; background: linear-gradient(135deg, #3b3d46, #23242a); box-shadow: inset 0 0 0 1px #4a4c55; }
.${P}-line { display: inline-block; box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 8px; background: #1b1c20; font-size: 7.5px; line-height: 20px; color: #e2e3e6; white-space: nowrap; }
.${P}-area { position: relative; width: 100%; height: ${AREA_H}px; margin-top: 8px; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; overflow: hidden; border-radius: 6px; background: #15161a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; border-radius: 6px; background: #15161a; box-shadow: inset 0 0 0 1px #202127; }
.${P}-timer { position: absolute; left: 0; right: 0; top: 0; height: ${AREA_H}px; display: grid; place-items: center; }
.${P}-cog { position: relative; width: 130px; height: 130px; }
.${P}-cog svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.${P}-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
.${P}-num b { font-size: 32px; font-weight: 700; color: #e8e9ec; }
.${P}-num span { margin-top: 3px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #6b6e76; }
.${P}-stop { display: flex; align-items: center; justify-content: center; gap: 4px; width: 46px; height: 18px; margin: 6px auto 0; font-size: 7.5px; color: #c4c6cc; }
.${P}-stop i { display: block; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #c4c6cc; }
.${P}-cmp { flex: none; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 28px; padding: 0 5px 0 10px; border-radius: 14px; background: #1b1c20; box-shadow: inset 0 0 0 1px #2a2b31; font-size: 7.5px; color: #7f828a; white-space: nowrap; overflow: hidden; }
.${P}-cmp span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-cmp.on span { color: #e2e3e6; }
.${P}-send { flex: none; display: block; width: 19px; height: 19px; border-radius: 50%; background: #4f46e5; position: relative; }
.${P}-send::after { content: ""; position: absolute; left: 6px; top: 6px; width: 5px; height: 5px; border-top: 1.5px solid #fff; border-right: 1.5px solid #fff; transform: rotate(45deg); }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes, happy.';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses send
const ASK = 0.12;                                  // the user's bubble is in, the bot's reply starts at 0s elapsed
const RING_END = 1.0;                              // the timer reads 19 SEC and is removed
const LAND = Array.from({ length: 10 }, (_, i) => 1.06 + i * 0.0865);   // slot i is filled (reading order), the last at 1.84
const SECS = 19;                                   // the footage's counter ran 01 .. 19
const R = 56, R_IN = 49, ARC_R = 40, CIRC = 2 * Math.PI * ARC_R;

// the cog: a scalloped circle outline of TEETH teeth
const cogPath = () => {
  const pts = [];
  for (let k = 0; k < TEETH; k++) {
    const a = (k * 360) / TEETH;
    for (const [d, r] of [[-5.5, R_IN], [-3.5, R], [3.5, R], [5.5, R_IN]]) {
      const rad = ((a + d - 90) * Math.PI) / 180;
      pts.push(`${(60 + r * Math.cos(rad)).toFixed(2)} ${(60 + r * Math.sin(rad)).toFixed(2)}`);
    }
  }
  return `M${pts.join('L')}Z`;
};

export default {
  id: 'poe',
  label: 'Poe (FLUX bot, 2024)',
  source: {
    platform: "an image bot ('FLUX-pro') in a Poe chat, poe.com (desktop browser, dark theme; a third-party screen recording on YouTube, 2024-08-21)",
    feature: "a chat reply 'Generating image (Ns elapsed)' above one large cog-shaped ring whose centre counts elapsed seconds ('01 SEC' to '19 SEC') with a growing gradient arc and a 'Stop' button, then the images hard-swapping into the bubble (adapted to 10: a 5 x 2 block of slots filled one by one in reading order after the ring phase)",
    refs: [{ url: 'https://www.youtube.com/watch?v=poNZBfX5GDw', retrieved: '2026-10-14' }],
    extrapolated: "the footage's single image lands after ~19 s of counting and the counter's whole run is compressed into the beat; the ten slots, the bare reserved cells between the timer and the pictures and the landing in reading order are not in the footage (one image per message)",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'poe');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const conv = (title, sub, on) => `<div class="${P}-cv${on ? ' on' : ''}">${title}<small>${sub}</small></div>`;
    const nv = (t) => `<div class="${P}-nv"><i></i>${t}</div>`;
    const cog = `<svg viewBox="0 0 120 120"><defs><linearGradient id="${P}-gr" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="100" y2="100"><stop offset="0" stop-color="#d946ef"/><stop offset="0.4" stop-color="#8b5cf6"/><stop offset="0.75" stop-color="#3b82f6"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs><path d="${cogPath()}" fill="#14151a" stroke="#6b6e76" stroke-width="1.6" stroke-linejoin="round"/><circle cx="60" cy="60" r="${ARC_R}" fill="none" stroke="#25262c" stroke-width="3"/><circle class="${P}-arc" cx="60" cy="60" r="${ARC_R}" fill="none" stroke="url(#${P}-gr)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 ${CIRC.toFixed(2)}" transform="rotate(-90 60 60)"/></svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-rail"><div class="${P}-mark"><i></i>Chats</div>${nv('Explore')}${nv('Create bot')}${conv('New chat', 'Generating image...', true)}${conv('Colorful Arrangement', 'A cylindrical glass vase')}${conv('Happy Walker LA', 'A happy person walking down')}${conv('Doggy', 'A fluffy dog on a beach')}<div class="${P}-sp"></div>${nv('All chats')}${nv('Your bots')}${nv('Creators')}${nv('Profile')}${nv('Settings')}</div><div class="${P}-main"><div class="${P}-hd"><div><b>New chat</b><small>FLUX-pro</small></div><span>Share</span></div><div class="${P}-msgs"><div class="${P}-user" style="visibility: hidden">${x.esc(PROMPT)}</div><div class="${P}-bot" style="visibility: hidden"><div class="${P}-who"><i></i>FLUX-pro</div><div class="${P}-line">Generating image (0s elapsed)</div><div class="${P}-area"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-timer"><div class="${P}-cog">${cog}<div class="${P}-num"><b>01</b><span>SEC</span></div></div></div></div><div class="${P}-stop"><i></i>Stop</div></div></div><div class="${P}-cmp on"><span>${x.esc(PROMPT)}</span><i class="${P}-send"></i></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const user = q(`.${P}-user`), bot = q(`.${P}-bot`), line = q(`.${P}-line`), grid = q(`.${P}-g`), timer = q(`.${P}-timer`), arc = q(`.${P}-arc`), num = q(`.${P}-num b`), stop = q(`.${P}-stop`), cmp = q(`.${P}-cmp`), cmpT = q(`.${P}-cmp span`), send = q(`.${P}-send`);
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

        // send is pressed: the prompt leaves the composer and shows as the user's bubble
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { send.style.transform = gp > 0 ? `scale(${(1 - 0.12 * gp).toFixed(4)})` : 'none'; });
        put('ask', s >= ASK, (v) => {
          user.style.visibility = v ? '' : 'hidden';
          bot.style.visibility = v ? '' : 'hidden';
          cmp.classList.toggle('on', !v);
          cmpT.textContent = v ? 'Talk to FLUX-pro or @ a bot' : PROMPT;
        });

        // the timer: the elapsed seconds, the big counter and the arc grow with t; a function of s alone
        const f = seg(s, ASK, RING_END);
        const n = Math.min(SECS, Math.floor(f * (SECS + 0.99)));
        put('sec', n, (v) => { line.textContent = `Generating image (${v}s elapsed)`; num.textContent = String(Math.max(1, v)).padStart(2, '0'); });
        const frac = clamp(n / (SECS + 1) + (f > 0 ? 0.02 : 0), 0, 0.98);
        put('arc', frac.toFixed(3), () => { arc.setAttribute('stroke-dasharray', `${(CIRC * frac).toFixed(2)} ${CIRC.toFixed(2)}`); });
        const ring = s < RING_END;
        put('ring', ring, (v) => { timer.style.display = v ? '' : 'none'; stop.style.visibility = v ? '' : 'hidden'; line.style.visibility = v ? '' : 'hidden'; grid.style.visibility = v ? 'hidden' : ''; });

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
