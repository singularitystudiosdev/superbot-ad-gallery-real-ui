// Tencent Yuanbao's in-chat image generation on mobile (spec .tmp/clone-9e82faf1/reveal-refs/yuanbao/spec.json, confidence 0.75;
// footage bilibili BV1V3Hj6xEmx published 2026-10-04, 720x1560, frames n_yb_pending_92pct.png, n_yb_pending_94pct.png,
// n_yb_pending_zoom.png, n_yb_generated.png). A light chat screen: a header (round menu button, a plain title, a pill of
// mute / call / new-chat icons), a grey user bubble on the right with the prompt, and an assistant turn on the left. The turn
// opens with a grey caption '正在生成图片，稍等一下 >' over a pale blue-green gradient placeholder card that shows a small wand
// glyph and a whole-number percentage (92%, then 94% a beat later); at the end the caption flips to '图片已生成 >' and the card
// is replaced by the finished image carrying a dark translucent chip bottom-left and a download glyph bottom-right, with a
// row of neutral line icons (retry, copy, thumbs up, thumbs down, speaker, share) under the turn. The composer is a pill with
// a camera, the hint text, and on the right a dark stop button while generating (a plus and a voice glyph once done), over the
// chips 快速 / AI创作 / 拍题. The frames show no ring around the percentage (the grey ring in them is the screen recorder's own
// touch dot, fixed at the right edge in every frame), so none is drawn. Nothing of Tencent's is shipped: the header title and
// strings are plain text in the system UI face, the glyphs are our own line icons, the prompt is our own, the attached-file
// chip is omitted and the picture inside the finished card is OUR meme, never the generated frame of the footage.
// Adapted to ten images: ten cards in a 5x2 grid inside the assistant turn, each with its own percentage, landing one at a time
// on ctx.seq(i); the caption flips only when the tenth lands. Everything is a pure function of t (no CSS animation or
// transition); every card <img> stays in flow with visibility toggled, never display:none.
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-yb';
const CJK = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC'";
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: 640px; border-radius: 22px; overflow: hidden; background: linear-gradient(180deg, #f1f2f8 0%, #fafafc 26%, #fbfbfd 100%); color: #20242b; font-family: ${UI_FONT}, ${CJK}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px rgba(0, 0, 0, .08); }
.${P} svg { display: block; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd { flex: none; display: flex; align-items: center; height: 60px; padding: 0 14px; }
.${P}-menu { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #fff; color: #20242b; box-shadow: 0 0 0 1px rgba(0, 0, 0, .04); }
.${P}-menu svg { width: 20px; height: 20px; }
.${P}-ttl { margin-left: 16px; font-size: 19px; line-height: 24px; font-weight: 700; color: #14171c; }
.${P}-pill { display: flex; align-items: center; gap: 18px; height: 40px; margin-left: auto; padding: 0 16px; border-radius: 20px; background: rgba(255, 255, 255, .85); color: #20242b; box-shadow: 0 0 0 1px rgba(0, 0, 0, .04); }
.${P}-pill svg { width: 20px; height: 20px; }
.${P}-user { flex: none; align-self: flex-end; box-sizing: border-box; max-width: 72%; margin: 8px 16px 0 16px; padding: 11px 17px; border-radius: 18px 18px 4px 18px; background: #e8e8ed; font-size: 16px; line-height: 22px; color: #14171c; }
.${P}-cap { flex: none; display: flex; align-items: center; gap: 3px; margin: 22px 18px 9px; font-size: 15px; line-height: 20px; color: #9a9faa; }
.${P}-cap svg { width: 13px; height: 13px; stroke-width: 1.9; }
.${P}-grid { flex: none; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin: 0 18px; }
.${P}-t { position: relative; aspect-ratio: .754; border-radius: 11px; overflow: hidden; background: #e4eef6; }
.${P}-t img { display: block; width: 100%; height: 100%; object-fit: cover; visibility: hidden; }
.${P}-ph { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; background: linear-gradient(158deg, #dde9f6 0%, #e5f1fa 42%, #ecf8f6 78%, #f2fbf4 100%); color: #8c9bb2; }
.${P}-ph svg { width: 15px; height: 15px; stroke-width: 1.5; }
.${P}-pc { font-size: 14px; line-height: 18px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: .01em; }
.${P}-chip { position: absolute; left: 6px; bottom: 6px; display: flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px 0 5px; border-radius: 10px; background: rgba(0, 0, 0, .46); color: #fff; font-size: 10px; line-height: 20px; font-weight: 600; visibility: hidden; }
.${P}-chip svg { width: 11px; height: 11px; stroke-width: 1.8; }
.${P}-dl { position: absolute; right: 6px; bottom: 6px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(0, 0, 0, .46); color: #fff; visibility: hidden; }
.${P}-dl svg { width: 11px; height: 11px; stroke-width: 2; }
.${P}-act { flex: none; display: flex; align-items: center; gap: 28px; margin: 15px 20px 0; color: #5a6069; }
.${P}-act svg { width: 20px; height: 20px; }
.${P}-sp { flex: 1 1 auto; }
.${P}-chips { flex: none; display: flex; gap: 8px; margin: 0 14px 10px; }
.${P}-c { display: flex; align-items: center; gap: 5px; height: 36px; padding: 0 14px; border-radius: 18px; background: rgba(255, 255, 255, .9); font-size: 15px; line-height: 20px; font-weight: 600; color: #20242b; box-shadow: 0 0 0 1px rgba(0, 0, 0, .04); white-space: nowrap; }
.${P}-c svg { width: 13px; height: 13px; stroke-width: 1.9; }
.${P}-c i { display: block; width: 18px; height: 18px; border-radius: 5px; background: linear-gradient(135deg, #8fb38f, #d7b98b); }
.${P}-in { flex: none; display: flex; align-items: center; gap: 12px; height: 56px; margin: 0 14px; padding: 0 12px 0 16px; border-radius: 28px; background: #fff; color: #20242b; box-shadow: 0 1px 0 rgba(0, 0, 0, .05), 0 0 0 1px rgba(0, 0, 0, .04); }
.${P}-in svg { width: 24px; height: 24px; }
.${P}-hint { flex: 1 1 auto; font-size: 16px; line-height: 22px; color: #9a9faa; white-space: nowrap; overflow: hidden; }
.${P}-end { position: relative; flex: none; width: 36px; height: 36px; }
.${P}-end > * { position: absolute; inset: 0; display: grid; place-items: center; }
.${P}-stop { border-radius: 50%; background: #14171c; }
.${P}-stop i { display: block; width: 12px; height: 12px; border-radius: 3px; background: #fff; }
.${P}-plus svg { width: 22px; height: 22px; }
.${P}-note { flex: none; margin: 8px 0 10px; text-align: center; font-size: 11px; line-height: 14px; color: #aeb2ba; }
`;

const ICONS = {
  menu: '<svg viewBox="0 0 24 24"><path d="M5 9h14M5 15h9"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>',
  call: '<svg viewBox="0 0 24 24"><path d="M7.5 4.5l2.2 4-1.7 1.6a11 11 0 0 0 5.9 5.9l1.6-1.7 4 2.2c-.4 2.3-2 3.5-4 3.5C10.5 20 4 13.5 4 8.5c0-2 1.2-3.6 3.5-4z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 1-4.3 14.7L4 20l1.4-3.4A8 8 0 0 1 12 4z"/><path d="M12 9v6M9 12h6"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  wand: '<svg viewBox="0 0 24 24"><path d="M5 19L15.5 8.5"/><path d="M14 5l1 2.2L17.2 8 15 9 14 11.2 13 9l-2.2-1L13 7z"/><path d="M19 12l.6 1.4 1.4.6-1.4.6L19 16l-.6-1.4-1.4-.6 1.4-.6z"/></svg>',
  sparkP: '<svg viewBox="0 0 24 24"><circle cx="11" cy="12" r="6.5"/><path d="M8.6 12.3l1.8 1.8 3.2-3.6"/><path d="M19 4.5v3M17.5 6h3"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v10M7.5 11l4.5 4.5 4.5-4.5M6 19h12"/></svg>',
  retry: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 1 0 2.2-5.1"/><path d="M4.5 5v4.5H9"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-6A2.5 2.5 0 0 0 5 6.5v6A2.5 2.5 0 0 0 7.5 15H8"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M8 11l3.2-6.2c1.6 0 2.6 1.2 2.2 3L13 10h5.2a1.8 1.8 0 0 1 1.8 2.2l-1.2 5.6A2 2 0 0 1 16.9 19H8z"/><path d="M4.5 11H8v8H4.5z"/></svg>',
  dn: '<svg viewBox="0 0 24 24"><path d="M16 13l-3.2 6.2c-1.6 0-2.6-1.2-2.2-3L11 14H5.8A1.8 1.8 0 0 1 4 11.8l1.2-5.6A2 2 0 0 1 7.1 5H16z"/><path d="M19.5 13H16V5h3.5z"/></svg>',
  spk: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M14 5l6 5.5-6 5.5v-3.3C9.5 12.7 6.5 14 4.5 18c.4-5 3-8.600 9.500-9z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 3.500L6.500 13H12l-1 7.500L17.500 11H12z"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8.500A2 2 0 0 1 6 6.500h1.800l1.200-2h6l1.200 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.500" r="3.500"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  wave: '<svg viewBox="0 0 24 24"><path d="M12 8v8M8.500 10.500v3M15.500 10.500v3M5 11.500v1M19 11.500v1"/></svg>',
  scan: '<svg viewBox="0 0 24 24"><path d="M5 9V6.500A1.500 1.500 0 0 1 6.500 5H9M15 5h2.500A1.500 1.500 0 0 1 19 6.500V9M19 15v2.500a1.500 1.500 0 0 1-1.500 1.500H15M9 19H6.500A1.500 1.500 0 0 1 5 17.500V15"/><path d="M9 12h6"/></svg>',
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
// a tile's percentage as a function of how far through its own ramp it is: the rise to 92 first, then the slow 92 -> 94 stretch
// the footage shows, then on to the high nineties as it lands. Whole numbers, monotonic, never 100 before the image is in
const percent = (u) => {
  if (u <= 0) return 0;
  if (u < 0.75) { const x = u / 0.75; return Math.floor(92 * (1 - (1 - x) * (1 - x))); }
  return Math.min(99, Math.floor(92 + 7 * ((u - 0.75) / 0.25)));
};

export default {
  id: 'yuanbao',
  label: 'Yuanbao (Tencent)',
  source: {
    platform: 'Tencent Yuanbao mobile app (腾讯元宝), in-chat image generation, light chat shell',
    feature: 'Chat turn with a caption ("正在生成图片，稍等一下 >", then "图片已生成 >") over pale gradient placeholder cards, each showing a wand glyph and a whole-number percentage (92%, then 94%) before the finished image replaces it with a bottom-left chip and a download glyph, an action row under the turn and a composer with 快速 / AI创作 / 拍题 chips (adapted to 10: ten cards in a 5x2 grid inside the one assistant turn, each with its own percentage, landing one at a time in strict sequence; the caption flips only when the tenth lands)',
    refs: [{ url: 'https://www.bilibili.com/video/BV1V3Hj6xEmx', retrieved: '2026-10-14' }],
    // the footage is a 9 s excerpt of ONE card: only 92% and 94% and the flip to done are observed
    extrapolated: [
      'the percentage ramp before 92% (a monotonic ease per card, already part-way when the turn appears)',
      'the 94% -> done stretch (the percentage climbing to 99% as each card lands)',
      'ten cards, their 5x2 grid and their one-at-a-time landing order',
      'the user bubble prompt text and the bubble-less assistant turn width',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'yuanbao');
    const tile = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-ph">${ICONS.wand}<span class="${P}-pc">0%</span></div><span class="${P}-chip">${ICONS.sparkP}智能P图</span><span class="${P}-dl">${ICONS.down}</span></div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-hd"><span class="${P}-menu">${ICONS.menu}</span><span class="${P}-ttl">元宝</span><span class="${P}-pill">${ICONS.mute}${ICONS.call}${ICONS.chat}</span></div>
<div class="${P}-user">帮我生成十张表情包</div>
<div class="${P}-cap"><span class="${P}-capt"></span>${ICONS.chev}</div>
<div class="${P}-grid">${tiles.map(tile).join('')}</div>
<div class="${P}-act">${ICONS.retry}${ICONS.copy}${ICONS.up}${ICONS.dn}${ICONS.spk}${ICONS.share}</div>
<div class="${P}-sp"></div>
<div class="${P}-chips"><span class="${P}-c">${ICONS.bolt}快速${ICONS.chev}</span><span class="${P}-c"><i></i>AI创作</span><span class="${P}-c">${ICONS.scan}拍题</span></div>
<div class="${P}-in">${ICONS.cam}<span class="${P}-hint"></span><span class="${P}-end"><span class="${P}-stop"><i></i></span><span class="${P}-plus">${ICONS.plus}</span></span></div>
<div class="${P}-note">内容由AI生成，注意核实</div>
</div>`);

    const cap = root.querySelector(`.${P}-capt`), hint = root.querySelector(`.${P}-hint`);
    const act = root.querySelector(`.${P}-act`), stop = root.querySelector(`.${P}-stop`), plus = root.querySelector(`.${P}-plus`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({
      im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), pc: n.querySelector(`.${P}-pc`),
      chip: n.querySelector(`.${P}-chip`), dl: n.querySelector(`.${P}-dl`),
    }));
    ctx.gate(cells.map((c) => c.im));

    const tStart = Math.min(ctx.cardIn, ctx.seq(0)[0]);
    // each card's ramp ends exactly when it lands and starts a seeded beat before the turn appears, so on entry the ten cards
    // already read at different, believable percentages
    const ramps = cells.map((_, i) => {
      const e = ctx.seq(i)[1];
      return { a: tStart - (0.9 + 0.9 * hash(71, i)), e };
    });
    const text = { cap: null, hint: null, pc: cells.map(() => null) };
    const put = (el, key, v, i) => {
      const cur = i === undefined ? text[key] : text[key][i];
      if (cur === v) return;
      el.textContent = v;
      if (i === undefined) text[key] = v; else text[key][i] = v;
    };

    return {
      root,
      render(t) {
        const done = t >= ctx.seq(count - 1)[1];
        put(cap, 'cap', done ? '图片已生成' : '正在生成图片，稍等一下');
        put(hint, 'hint', done ? '发消息或按住说话' : '发消息或按住');
        act.style.visibility = done ? 'visible' : 'hidden';
        stop.style.visibility = done ? 'hidden' : 'visible';
        plus.style.visibility = done ? 'visible' : 'hidden';
        cells.forEach((c, i) => {
          const landed = t >= ctx.seq(i)[1];
          c.im.style.visibility = landed ? 'visible' : 'hidden';
          c.ph.style.visibility = landed ? 'hidden' : 'visible';
          c.chip.style.visibility = landed ? 'visible' : 'hidden';
          c.dl.style.visibility = landed ? 'visible' : 'hidden';
          if (landed) return;
          const r = ramps[i];
          put(c.pc, 'pc', `${percent(clamp01((t - r.a) / (r.e - r.a)))}%`, i);
        });
      },
    };
  },
};
