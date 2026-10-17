// Zhipu Qingyan (智谱清言, ChatGLM) mobile app, the built-in 'AI画图' tool page (bilibili BV14WB4YdEfM, 2024-11-24, a live 864x1920 phone recording,
// t~38.5-45.5 s; spec .tmp/clone-9e82faf1/reveal-refs/zhipu-qingyan/spec.json, confidence 0.70; frames p_typing_stop.png, p_generating_placeholder.png,
// p_complete.png, p_card_sequence.png). A white chat page: a header row (back chevron, a round gradient avatar, the title 'AI画图' over a grey
// '来自：智谱清言', speaker / share / kebab icons), a pale-lavender user bubble on the right, and the assistant's image card on the left: a rounded
// pale-grey (#F5F7F9) card whose header reads 'CogView3-Plus AI绘画...' (indigo, bold, a small glyph cycling in front of it) over a square body that is a
// soft, slowly drifting pastel gradient (#D0E5FA -> #D5F1FC -> #D6F5F6, the stops sliding frame to frame, no percentage, bar or blur). A white
// '停止生成' pill with a stop square sits centred under the card for the whole wait; then, in one cut, the header becomes '✓ CogView3-Plus
// AI绘画：已完成' and the gradient is swapped in place for the finished picture. Under the card the page has a chip row (风格 / 比例1:1 / + 咒语 / 场景 /
// 高清), the composer ('输入你的问题或需求', a camera at the left, a mic) and the micro-copy '内容由AI生成，请勿从事违法活动'.
// Adapted to ten images: ten square placeholders in a 5 x 2 grid inside the ONE card, each drifting on its own phase of the gradient and each cut
// to its picture on ctx.seq(i) in strict sequence; the header flips to '：已完成' and the 停止生成 pill goes only when the tenth has landed.
// Omitted: the sparkle 'CogView3 Plus' watermark in the placeholder's centre (the platform's mark), the platform's avatar mark, the typing dots and
// the caption bubble. Plain text in the system UI face, our own line glyphs, our own prompt; every picture is OUR meme.
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-zq';
const CJK = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC'";
const ROOT_H = 516;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 18px; overflow: hidden; background: #fff; color: #1d1f28; font-family: ${UI_FONT}, ${CJK}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px rgba(0, 0, 0, .09); }
.${P} svg { display: block; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 14px 0 12px; background: linear-gradient(180deg, #eceefb 0%, #fff 100%); }
.${P}-hd > svg { width: 18px; height: 18px; }
.${P}-av { flex: none; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #3d2ec4 0%, #8b3fe0 55%, #f08a5d 100%); }
.${P}-ht { flex: 1 1 auto; min-width: 0; }
.${P}-ht b { display: block; font-size: 13px; line-height: 15px; font-weight: 600; color: #14161d; }
.${P}-ht span { display: block; font-size: 9px; line-height: 12px; color: #9c9fa9; }
.${P}-ic { display: flex; align-items: center; gap: 14px; color: #1d1f28; }
.${P}-ic svg { width: 16px; height: 16px; }
.${P}-user { flex: none; align-self: flex-end; max-width: 70%; box-sizing: border-box; margin: 6px 14px 0; padding: 8px 14px; border-radius: 14px 14px 3px 14px; background: #e7eaff; font-size: 12px; line-height: 17px; color: #14161d; }
.${P}-card { flex: none; box-sizing: border-box; margin: 10px 14px 0; padding: 10px 12px 12px; border-radius: 14px; background: #f5f7f9; }
.${P}-ch { display: flex; align-items: center; gap: 6px; height: 20px; font-size: 12px; line-height: 20px; font-weight: 700; color: #3e407f; white-space: nowrap; }
.${P}-gl { position: relative; flex: none; width: 13px; height: 13px; }
.${P}-gl > * { position: absolute; inset: 0; }
.${P}-spin { box-sizing: border-box; border-radius: 50%; border: 1.7px solid rgba(110, 100, 220, .22); border-top-color: #6d63dc; }
.${P}-ok svg { width: 13px; height: 13px; stroke-width: 1.9; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #d5eefd; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background-color: #d5eefd; background-image: radial-gradient(circle at 30% 20%, rgba(208, 229, 250, .95), rgba(208, 229, 250, 0) 62%), radial-gradient(circle at 78% 70%, rgba(214, 245, 246, .95), rgba(214, 245, 246, 0) 58%), linear-gradient(135deg, #d0e5fa 0%, #d5f1fc 48%, #d6f5f6 100%); background-size: 230% 230%, 230% 230%, 260% 260%; }
.${P}-stopw { flex: none; display: flex; justify-content: center; height: 34px; margin-top: 10px; }
.${P}-stop { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 30px; padding: 0 14px; border-radius: 15px; background: #fff; font-size: 12px; font-weight: 500; color: #1d1f28; box-shadow: 0 1px 4px rgba(20, 20, 60, .12), 0 0 0 1px rgba(20, 20, 60, .04); }
.${P}-stop i { display: grid; place-items: center; width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #1d1f28; }
.${P}-stop i::after { content: ""; display: block; width: 4.6px; height: 4.6px; border-radius: 1px; background: #1d1f28; }
.${P}-fl { flex: 1 1 auto; }
.${P}-chips { flex: none; display: flex; gap: 6px; margin: 0 14px 8px; }
.${P}-c { box-sizing: border-box; display: flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 13px; background: #f3f4f7; font-size: 10.5px; color: #1d1f28; white-space: nowrap; }
.${P}-in { flex: none; display: flex; align-items: center; gap: 10px; margin: 0 14px; }
.${P}-in > svg { flex: none; width: 22px; height: 22px; color: #1d1f28; }
.${P}-box { flex: 1 1 auto; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 40px; padding: 0 12px 0 14px; border-radius: 12px; background: #fff; box-shadow: 0 1px 6px rgba(20, 20, 60, .1), 0 0 0 1px rgba(20, 20, 60, .04); font-size: 12px; color: #a4a7b0; }
.${P}-box svg { width: 16px; height: 16px; color: #1d1f28; }
.${P}-end { flex: none; width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #5a3fe0, #8b3fe0); }
.${P}-note { flex: none; margin: 8px 0 10px; text-align: center; font-size: 9px; line-height: 12px; color: #b3b6be; }
`;

const ICONS = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M14 5l6 5.5-6 5.5v-3.3C9.5 12.7 6.5 14 4.5 18c.4-5 3-8.6 9.5-9z"/></svg>',
  kebab: '<svg viewBox="0 0 24 24"><path d="M12 5.5v.01M12 12v.01M12 18.5v.01"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.4 12.2l2.5 2.5 4.7-5"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8.5A2 2 0 0 1 6 6.5h1.8l1.2-2h6l1.2 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5V20"/></svg>',
};
const PROMPT = '画十张梗图：缪斯在阶梯教室里举着手写便条';

export default {
  id: 'zhipu-qingyan',
  label: 'Zhipu Qingyan (2024)',
  source: {
    platform: 'Zhipu Qingyan (智谱清言, ChatGLM) mobile app, the built-in AI画图 tool page (light chat shell; a live phone screen recording on Bilibili, 2024-11-24)',
    feature: "chat turn with a pale-grey image card headed 'CogView3-Plus AI绘画...' (a small glyph cycling in front) over a soft drifting pastel-gradient placeholder (no percentage, bar or blur) with a '停止生成' pill beneath; the header flips to '✓ CogView3-Plus AI绘画：已完成' and the gradient is swapped in place for the finished picture (adapted to 10: ten square placeholders in a 5 x 2 grid inside the one card, each cut to its picture in strict sequence; the header flips and the pill goes when the tenth lands; the sparkle watermark in the placeholder's centre is omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV14WB4YdEfM', retrieved: '2026-10-14' }],
    // the footage is ONE card, ~7 s long: placeholder, then the flip to done and the image
    extrapolated: [
      'ten placeholders in a 5 x 2 grid inside one card, and their one-at-a-time landing order (the footage has a single square image per turn)',
      'the wait compressed from ~7 s to the beat, and the per-tile phase of the gradient drift (the footage gives drifting stops, no curve)',
      'the header flipping only when the tenth picture lands (the footage flips with its single picture)',
      'the user bubble prompt text (our own) and the 5-column shell sized to a 560 px column (the footage is a 864 x 1920 phone screen)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'zhipu-qingyan');
    const tile = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-ph"></div></div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-hd">${ICONS.back}<span class="${P}-av"></span><span class="${P}-ht"><b>AI画图</b><span>来自：智谱清言</span></span><span class="${P}-ic">${ICONS.mute}${ICONS.share}${ICONS.kebab}</span></div>
<div class="${P}-user">${x.esc(PROMPT)}</div>
<div class="${P}-card"><div class="${P}-ch"><span class="${P}-gl"><i class="${P}-spin"></i><span class="${P}-ok">${ICONS.check}</span></span><span class="${P}-htx"></span></div>
<div class="${P}-grid">${tiles.map(tile).join('')}</div></div>
<div class="${P}-stopw"><span class="${P}-stop"><i></i>停止生成</span></div>
<div class="${P}-fl"></div>
<div class="${P}-chips"><span class="${P}-c">风格</span><span class="${P}-c">比例1:1</span><span class="${P}-c">+ 咒语</span><span class="${P}-c">场景</span><span class="${P}-c">高清</span></div>
<div class="${P}-in">${ICONS.cam}<span class="${P}-box">输入你的问题或需求${ICONS.mic}</span><span class="${P}-end"></span></div>
<div class="${P}-note">内容由AI生成，请勿从事违法活动</div>
</div>`);

    const htx = root.querySelector(`.${P}-htx`), spin = root.querySelector(`.${P}-spin`), ok = root.querySelector(`.${P}-ok`), stop = root.querySelector(`.${P}-stop`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`) }));
    ctx.gate(cells.map((c) => c.im));
    // each placeholder drifts on its own seeded phase and direction of the gradient
    const phase = cells.map((_, i) => ({ a: hash(61, i) * Math.PI * 2, b: hash(62, i) * Math.PI * 2, r: 0.8 + 0.4 * hash(63, i) }));

    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const done = t >= ctx.seq(count - 1)[1];
        put('hd', done, (v) => {
          htx.textContent = v ? 'CogView3-Plus AI绘画：已完成' : 'CogView3-Plus AI绘画...';
          spin.style.visibility = v ? 'hidden' : 'visible';
          ok.style.visibility = v ? 'visible' : 'hidden';
          stop.style.visibility = v ? 'hidden' : 'visible';
        });
        // the header glyph turns with t
        put('sp', Math.round(t * 420) % 360, (d) => { spin.style.transform = `rotate(${d}deg)`; });
        cells.forEach((c, i) => {
          const landed = t >= ctx.seq(i)[1];
          put(`l${i}`, landed, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.ph.style.visibility = v ? 'hidden' : 'visible'; });
          const p = phase[i], w = t * 1.15 * p.r;
          // two soft colour pools orbit across the tile and the base gradient slides: the stops drift frame to frame
          const pos = `${(50 + 50 * Math.sin(w + p.a)).toFixed(1)}% ${(50 + 50 * Math.cos(w * 0.8 + p.b)).toFixed(1)}%, ${(50 + 50 * Math.cos(w * 0.9 + p.b)).toFixed(1)}% ${(50 + 50 * Math.sin(w * 0.7 + p.a)).toFixed(1)}%, ${(50 + 50 * Math.sin(w * 0.5 + p.a + p.b)).toFixed(1)}% ${(50 + 50 * Math.cos(w * 0.5 + p.a)).toFixed(1)}%`;
          put(`g${i}`, pos, (v) => { c.ph.style.backgroundPosition = v; });
        });
      },
    };
  },
};
