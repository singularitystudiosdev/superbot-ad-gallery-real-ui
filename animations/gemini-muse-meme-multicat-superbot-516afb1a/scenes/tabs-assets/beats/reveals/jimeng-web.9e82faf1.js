// ByteDance Jimeng (即梦) on the WEB, jimeng.jianying.com/ai-tool/generate (a single 1080p screen recording, spec
// .tmp/clone-9e82faf1/reveal-refs/jimeng/spec.json variants[0], confidence 0.85; frames g3_web_pending_*.png and
// g3_web_label_sheet.png). Not the phone app (that is the 'jimeng' module): a near-black desktop page with a slim left icon rail
// (灵感 / 生成 / 资产 / 画布, 生成 selected), a '今天' feed, a bottom-centre composer pill and, over the feed, a small floating
// '(n/m) …个结果生成中…  回到顶部' pill. Submitting drops a card into the feed: the prompt line with a plain-text
// meta row (图片 3.1 | 2:3 | 1K), then FOUR square-cornered 2:3 tiles side by side separated by hairlines. Every pending tile is a
// soft, dark-to-pastel gradient that shimmers; the first one carries a small translucent label, '加速中 ▸▸▸' first, then
// '<N>%造梦中…' counting up (5, 12, 26 and 35 were read). There is no bar and no spinner on a tile. Tiles then sharpen
// INDIVIDUALLY: a finished picture can take the first slot while its neighbours are still gradients, and the recording jumps
// from a mid count straight to the sharp picture, so a count need not reach 100.
// Adapted to ten images: the feed holds two cards, the observed four-tile card and a second card of six tiles, all ten pending
// at once; the label sits on the first tile that has not started sharpening and the count carries on as the label hops along,
// the tiles sharpen in reading order (a blur melting off a faint cross-fade), and the floating pill counts '(n/10)'. The
// '会员加速已生效' line under the grid is not drawn (both captures are a paid account, the non-member wording is unobserved).
// The reference's tile pictures are never reproduced: the tiles show only our own meme, the prompt is our own ask, and no logo,
// wordmark or platform font is drawn (plain text in the system stack, a plain ring and chevrons).
import { clamp, seg, outCubic, lerp, outBack } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-jw';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; border-radius: 12px; background: #0d0d0f; color: #e9e9ec; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1f1f23; }
.${P}-rail { flex: none; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 40px; padding-top: 14px; background: #0b0b0d; box-shadow: 1px 0 0 #18181b; }
.${P}-ri { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 7.5px; line-height: 9px; color: #7f7f88; white-space: nowrap; }
.${P}-ri svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round; stroke-linecap: round; }
.${P}-ri.on { color: #fff; }
.${P}-ri.on svg { fill: currentColor; }
.${P}-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 12px 14px 0; }
.${P}-hd { display: flex; align-items: center; justify-content: space-between; height: 18px; }
.${P}-hd b { font-size: 13px; line-height: 18px; font-weight: 600; color: #fff; }
.${P}-flt { display: flex; gap: 10px; font-size: 8px; color: #8a8a93; white-space: nowrap; }
.${P}-card { margin-top: 9px; }
.${P}-card + .${P}-card { margin-top: 11px; }
.${P}-ch { display: flex; align-items: center; gap: 6px; height: 16px; margin-bottom: 4px; white-space: nowrap; }
.${P}-pr { flex: 0 1 auto; min-width: 0; font-size: 9.5px; font-weight: 600; color: #f1f1f3; overflow: hidden; text-overflow: ellipsis; }
.${P}-mt { flex: none; font-size: 8.5px; color: #85858e; }
.${P}-sp { flex: 1; }
.${P}-bt { flex: none; display: flex; gap: 5px; visibility: hidden; }
.${P}-bt span { height: 15px; padding: 0 6px; border-radius: 5px; background: #1c1c20; font-size: 8px; line-height: 15px; color: #a9a9b1; }
.${P}-row { display: grid; gap: 1px; }
.${P}-row.r4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.${P}-row.r6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.${P}-t { position: relative; aspect-ratio: 2 / 3; overflow: hidden; background: #17171b; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; overflow: hidden; }
.${P}-sh { position: absolute; left: 0; top: 0; bottom: 0; width: 60%; background: linear-gradient(100deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, .1) 50%, rgba(255, 255, 255, 0) 100%); }
.${P}-lb { position: absolute; left: 4px; top: 4px; display: none; max-width: calc(100% - 8px); box-sizing: border-box; height: 14px; padding: 0 5px; border-radius: 4px; background: rgba(20, 20, 24, .62); font-size: 7.5px; line-height: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; }
.${P}-lb em { font-style: normal; letter-spacing: -.5px; }
.${P}-feed { flex: 1; }
.${P}-fl { position: absolute; left: 50%; bottom: 62px; display: none; align-items: center; gap: 6px; height: 20px; padding: 0 9px; margin-left: -87px; width: 174px; box-sizing: border-box; border-radius: 10px; background: #26262b; box-shadow: 0 2px 10px rgba(0, 0, 0, .45); font-size: 8px; color: #d6d6db; white-space: nowrap; }
.${P}-ring { flex: none; display: block; width: 8px; height: 8px; box-sizing: border-box; border-radius: 50%; border: 1.4px solid #9a9aa3; border-top-color: transparent; }
.${P}-fl i { flex: none; width: 1px; height: 9px; background: #3b3b42; }
.${P}-fl s { flex: none; text-decoration: none; color: #9a9aa3; }
.${P}-fl svg { flex: none; width: 7px; height: 7px; margin-left: -3px; fill: none; stroke: #9a9aa3; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cmp { flex: none; display: flex; align-items: center; gap: 8px; height: 44px; margin: 0 -2px 10px; padding: 0 8px 0 8px; border-radius: 14px; background: #1a1a1e; box-shadow: 0 0 0 1px #26262b; }
.${P}-slot { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 6px; background: #26262b; font-size: 13px; line-height: 1; color: #8f8f98; }
.${P}-ct { flex: 1; min-width: 0; font-size: 9.5px; color: #ececef; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-chips { flex: none; display: flex; gap: 5px; }
.${P}-chips span { height: 18px; padding: 0 6px; border-radius: 6px; background: #232328; font-size: 8px; line-height: 18px; color: #b9b9c1; white-space: nowrap; }
.${P}-go { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #fff; }
.${P}-go svg { width: 11px; height: 11px; fill: none; stroke: #111; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = '把我的梗图做成氛围感海报，竖版构图';
const META = '图片 3.1 | 2:3 | 1K';
const N_CARD1 = 4;       // the observed card holds four tiles; a second card holds the other six
const ENTER = 0.07;      // the cards drop into the feed
const PRESS = 0.06;      // the send button's press
const ACC_END = 0.2;     // the first tile's '加速中' phase ends, the count starts
const START0 = 0.45;     // the first tile begins to sharpen; the rest follow STEP apart, the last one landing at the window's end
const SH = 0.1;          // one tile's sharpening
const BLUR = 22;         // a pending picture's blur, px (the spec reads 18-24)
const ARROW = '<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>';
const rail = (name, svg, on) => `<div class="${P}-ri${on ? ' on' : ''}"><svg viewBox="0 0 24 24">${svg}</svg>${name}</div>`;

// each pending tile's dark-to-pastel field (deterministic: seeded hash, no Math.random)
const field = (i) => {
  const h = (n) => hash(7, i * 8 + n);
  const hue = [214, 340, 18, 262, 200, 352, 28, 232, 188, 320][i % 10];
  const a = `hsl(${(hue + h(0) * 30).toFixed(0)} 26% ${(17 + h(1) * 9).toFixed(0)}%)`;
  const b = `hsl(${(hue + 50 + h(2) * 40).toFixed(0)} 22% ${(32 + h(3) * 14).toFixed(0)}%)`;
  const c = `hsl(${(hue - 40 + h(4) * 30).toFixed(0)} 24% ${(18 + h(5) * 10).toFixed(0)}%)`;
  return `radial-gradient(120% 80% at ${(20 + h(6) * 60).toFixed(0)}% ${(15 + h(7) * 30).toFixed(0)}%, ${b}, transparent 70%), linear-gradient(${(170 + h(4) * 40).toFixed(0)}deg, ${a}, ${c})`;
};

export default {
  id: 'jimeng-web',
  label: 'Jimeng (web)',
  source: {
    platform: 'ByteDance Jimeng (即梦) web app, jimeng.jianying.com image generation (desktop browser, dark theme)',
    feature: "'今天' feed card of 2:3 gradient tiles, the first labelled '加速中 ▸▸▸' then '<N>%造梦中…', a floating '(n/m) 个结果生成中…' pill, tiles sharpening one by one (adapted to 10: the observed four-tile card plus a second card of six, the label hopping along the tiles, the pill counting '(n/10)'; the '会员加速已生效' line is omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1eAkxBvEtm?p=3', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'jimeng-web');
    const tile = (g, i) => `<div class="${P}-t"><div class="${P}-ph" style="background: ${field(i)}"><i class="${P}-sh"></i></div><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><span class="${P}-lb"></span></div>`;
    const card = (from, to, cls) => `<div class="${P}-card"><div class="${P}-ch"><span class="${P}-pr">${x.esc(PROMPT)}</span><span class="${P}-mt">${x.esc(META)}</span><span class="${P}-sp"></span><span class="${P}-bt"><span>重新编辑</span><span>再次生成</span></span></div><div class="${P}-row ${cls}">${tiles.slice(from, to).map((g, j) => tile(g, from + j)).join('')}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-rail">${rail('灵感', '<path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z"/>', false)}${rail('生成', '<path d="M12 3l8 9-8 9-8-9z"/>', true)}${rail('资产', '<path d="M3 7h7l2 2h9v10H3z"/>', false)}${rail('画布', '<path d="M7 3v14h14M3 7h14v14"/>', false)}</div><div class="${P}-main"><div class="${P}-hd"><b>今天</b><span class="${P}-flt"><span>时间 ⌄</span><span>生成类型 ⌄</span><span>操作类型 ⌄</span></span></div><div class="${P}-feed">${card(0, N_CARD1, 'r4')}${card(N_CARD1, count, 'r6')}</div><div class="${P}-fl"><b class="${P}-ring"></b><span class="${P}-fn"></span><i></i><s>回到顶部</s><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div><div class="${P}-cmp"><span class="${P}-slot">+</span><span class="${P}-ct">${x.esc(PROMPT)}</span><span class="${P}-chips"><span>图片 3.1</span><span>2:3</span><span>标清 1K</span></span><span class="${P}-go">${ARROW}</span></div></div></div>`);
    const cards = [...root.querySelectorAll(`.${P}-card`)];
    const btns = cards.map((c) => c.querySelector(`.${P}-bt`));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), sh: n.querySelector(`.${P}-sh`), lb: n.querySelector(`.${P}-lb`), g: tiles[i],
      state: -1, lbKey: null,
    }));
    const pill = root.querySelector(`.${P}-fl`), ring = root.querySelector(`.${P}-ring`), pn = root.querySelector(`.${P}-fn`);
    const go = root.querySelector(`.${P}-go`);
    ctx.gate(cells.map((c) => c.im));

    // a tile's sharpening window, in the 0..1 beat clock
    const STEP = (1 - SH - START0) / (count - 1);
    const startOf = (i) => START0 + i * STEP;
    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        const L = ctx.lastLand - ctx.cardIn;
        const s = (t - ctx.cardIn) / L;

        // submit: the button presses, then the cards drop into the feed
        const pr = seg(s, 0, PRESS);
        put('go', pr > 0 && pr < 1 ? (1 - 0.14 * Math.sin(Math.PI * pr)).toFixed(4) : 'none', (v) => { go.style.transform = v === 'none' ? 'none' : `scale(${v})`; });
        const en = seg(s, 0.02, 0.02 + ENTER);
        cards.forEach((c, k) => {
          const e = clamp(en * 1.15 - k * 0.15);
          c.style.opacity = e >= 1 ? '1' : e.toFixed(3);
          c.style.transform = e >= 1 ? 'none' : `translateY(${(lerp(10, 0, outBack(e))).toFixed(2)}px)`;
        });

        // the first tile that has not begun to sharpen carries the label; the count is one monotone climb across the window
        let cur = -1;
        for (let i = 0; i < count; i++) if (s < startOf(i)) { cur = i; break; }
        const pct = Math.round(5 + 94 * Math.pow(seg(s, ACC_END, startOf(count - 1)), 1.35));
        let landed = 0;

        cells.forEach((c, i) => {
          const a = startOf(i);
          const p = seg(s, a, a + SH);
          const st = p >= 1 ? 2 : p > 0 ? 1 : 0;
          if (p >= 1) landed++;
          if (st !== c.state) {
            c.state = st;
            c.im.style.display = st === 0 ? 'none' : 'block';
            c.ph.style.display = st === 2 ? 'none' : '';
          }
          if (st === 0) {
            const ph = ((t * 0.75 + i * 0.17) % 1 + 1) % 1;
            c.sh.style.transform = `translateX(${lerp(-100, 270, ph).toFixed(1)}%)`;
          }
          if (st === 1) {
            const e = outCubic(p);
            c.im.style.filter = `blur(${((1 - e) * BLUR).toFixed(2)}px) saturate(${lerp(0.8, 1, e).toFixed(3)}) ${c.g.grade}`.trim();
            c.im.style.opacity = lerp(0.25, 1, e).toFixed(3);
            c.im.style.transform = `scale(${(c.g.zoom * lerp(1.06, 1, e)).toFixed(4)})`;
          } else if (st === 2) {
            c.im.style.filter = restFilter(c.g);
            c.im.style.opacity = '1';
            c.im.style.transform = restTransform(c.g);
          }
          // the label
          let key = '', html = '';
          if (i === cur && st === 0 && en > 0) {
            if (i === 0 && s < ACC_END) {
              const w = Math.floor(((s * L * 6) % 3 + 3) % 3);
              key = `a${w}`;
              html = `加速中 <em>${[0, 1, 2].map((j) => `<span style="opacity: ${j === w ? 1 : 0.4}">▸</span>`).join('')}</em>`;
            } else {
              key = `p${pct}`;
              html = `${pct}%造梦中...`;
            }
          }
          if (key !== c.lbKey) {
            c.lbKey = key;
            c.lb.style.display = key ? 'block' : 'none';
            if (key) c.lb.innerHTML = html;
          }
        });

        // the floating pill: counts the landed tiles, turns its ring, and goes when the last one lands
        const showPill = en >= 1 && landed < count;
        put('pill', showPill, (on) => { pill.style.display = on ? 'flex' : 'none'; });
        if (showPill) {
          put('pn', landed, (n) => { pn.textContent = `(${n}/${count}) ${count}个结果生成中...`; });
          ring.style.transform = `rotate(${(((t * 360) % 360 + 360) % 360).toFixed(1)}deg)`;
        }
        // each card gains its action buttons once its own tiles have landed
        const done0 = cells.slice(0, N_CARD1).every((c) => c.state === 2), done1 = cells.slice(N_CARD1).every((c) => c.state === 2);
        put('b0', done0, (on) => { btns[0].style.visibility = on ? 'visible' : 'hidden'; });
        put('b1', done1, (on) => { btns[1].style.visibility = on ? 'visible' : 'hidden'; });
      },
    };
  },
};
