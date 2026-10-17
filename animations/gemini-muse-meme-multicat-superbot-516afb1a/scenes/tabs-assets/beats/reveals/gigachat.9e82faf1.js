// GigaChat ГигаЧат (Sber), the image flow of its VKontakte mini-app, a chat thread inside the VK web messenger (YouTube MsUYSP62awQ,
// 'Нейросеть Гигачат рисует картинку в соцсети ВКонтакте, в Телеграме, в MAX', channel Надежда Широбокова, 2025-07-26, t~74-96 s,
// frames ah_msu_z74 / z76 / z80 / z85 / z90 / z96 and ah_msu_tile_70-100; second source YouTube 92xN7j4v6dk, channel All_Office,
// 2025-09-01, t~15-34 s, ah_92x_tile_18-34 (the same bot's image flow in a Telegram chat; it corroborates the flow, the wait caption is
// not legible there); spec .tmp/clone-9e82faf1/reveal-refs/gigachat/spec.json, confidence 0.62). A light messenger page: a simplified
// VK left navigation and, in a white rounded column, the user's prompt as a message, then the compose card (format cards 'Квадрат |
// Альбом | Портрет', the field 'Стиль: Не выбран') and a blue 'Нарисовать' button. Pressing it replaces the card by the posted
// message itself: a large flat grey panel holding a two-arc ring spinner with the fixed line 'Рисую несколько вариантов…' under it, a
// strip of variant slots below (the first outlined in blue, the others flat grey) and a bar with a pencil, a regenerate button and a
// pale-blue disabled 'Поделиться'. There is no percentage, bar, queue label or blur. On completion the spinner and caption vanish,
// the picture fills the panel, the slots take the variants and 'Поделиться' turns solid blue.
// Adapted to ten images: the strip is extended to ten slots that hard-swap in reading order, the large panel showing the selected
// (first) variant as soon as it lands, in the same picture at a larger size; 'Поделиться' turns solid after the last. Omitted: the
// VK logo and the nav entries that are payment or marketing surfaces, the page footer, the OS taskbar and every banner. The footage's
// pictures are never reproduced: every picture is our own meme, system type only.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gch';
const ROOT_H = 396, NAV_W = 116, SLOTS = 10, SLOT_W = 34, SLOT_GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ebedf0; color: #1f2430; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdfe4; }
.${P}-nav { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${NAV_W}px; padding: 8px 6px 0 10px; }
.${P}-nav div { flex: none; display: flex; align-items: center; gap: 6px; height: 24px; font-size: 7.6px; font-weight: 500; color: #2c3140; white-space: nowrap; }
.${P}-nav svg { flex: none; display: block; width: 11px; height: 11px; fill: none; stroke: #3f7fd6; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-nav hr { flex: none; width: 100%; height: 1px; margin: 4px 0; border: 0; background: #dcdfe5; }
.${P}-main { position: relative; flex: 1; min-width: 0; margin: 8px 8px 8px 0; border-radius: 10px; background: #fbfbfa; overflow: hidden; }
.${P}-stage { position: absolute; left: 12px; right: 12px; top: 12px; height: 312px; }
.${P}-view { position: absolute; inset: 0; }
.${P}-me { display: flex; justify-content: flex-end; }
.${P}-me div { box-sizing: border-box; max-width: 78%; padding: 6px 9px; border-radius: 10px 10px 3px 10px; background: #e5eefc; font-size: 7.8px; line-height: 11px; color: #1f2430; }
.${P}-fmt { display: flex; gap: 10px; margin-top: 16px; }
.${P}-fc { display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 7.4px; color: #2c3140; }
.${P}-fc i { display: grid; place-items: center; box-sizing: border-box; width: 60px; height: 48px; border-radius: 8px; background: #eeeeec; }
.${P}-fc i b { display: block; background: #d3d3d1; border-radius: 2px; }
.${P}-fc .${P}-on { box-shadow: inset 0 0 0 1.5px #2c7bea; }
.${P}-sty { margin-top: 14px; font-size: 7.6px; color: #2c3140; }
.${P}-field { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; height: 26px; margin-top: 5px; padding: 0 10px; border-radius: 8px; background: #eeeeec; font-size: 8.2px; color: #2c3140; }
.${P}-field svg { display: block; width: 7px; height: 7px; fill: none; stroke: #6a7080; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-panel { position: relative; height: 256px; border-radius: 9px; background: #ecece9; overflow: hidden; }
.${P}-panel img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cover { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 11px; background: #ecece9; }
.${P}-ring { display: block; width: 30px; height: 30px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(58, 58, 58, 0) 0deg, #3a3a3a 250deg, rgba(58, 58, 58, 0) 300deg), #d9d9d6; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px)); }
.${P}-cover span { font-size: 8.4px; color: #3a3a3a; white-space: nowrap; }
.${P}-strip { display: flex; gap: ${SLOT_GAP}px; margin-top: 10px; }
.${P}-slot { position: relative; flex: none; box-sizing: border-box; width: ${SLOT_W}px; height: ${SLOT_W}px; border-radius: 6px; background: #ecece9; overflow: hidden; }
.${P}-slot img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #ecece9; }
.${P}-sel { position: absolute; inset: 0; border-radius: 6px; box-shadow: inset 0 0 0 1.5px #2c7bea; }
.${P}-foot { position: absolute; left: 12px; right: 12px; bottom: 12px; height: 34px; }
.${P}-bar { position: absolute; inset: 0; display: flex; gap: 8px; }
.${P}-sq { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: #f0f0ee; }
.${P}-sq svg { display: block; width: 12px; height: 12px; fill: none; stroke: #2c3140; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-share { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; border-radius: 8px; background: #a9c5f7; font-size: 8.6px; font-weight: 600; color: #ffffff; }
.${P}-share svg { display: block; width: 11px; height: 11px; fill: #ffffff; }
.${P}-draw { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 8px; background: #2c7bea; font-size: 8.8px; font-weight: 600; color: #ffffff; }
`;

const PROMPT = 'Муза держит рукописную записку в аудитории, стиль мем, яркие цвета';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.04;                              // the cursor presses 'Нарисовать'
const ISSUE = 0.14;                               // the compose card gives way to the posted message: grey panel, ring, caption, strip
const LAND = Array.from({ length: SLOTS }, (_, i) => 0.4 + i * 0.1425);   // slot i fills (reading order), the last at 1.68; the large panel takes the first one

const NAV = [
  ['Звонки', '<path d="M3 2.4h2l.8 2-1.2.8a5.6 5.6 0 002.2 2.2l.8-1.2 2 .8v2c0 .6-.5 1-1 1A7.6 7.6 0 012 3.4c0-.6.4-1 1-1z"/>'],
  ['Друзья', '<circle cx="4.4" cy="4.2" r="1.7"/><circle cx="8.4" cy="4.8" r="1.4"/><path d="M1.4 9.6c0-1.8 1.4-2.8 3-2.8s3 1 3 2.8M7.6 7c1.6-.2 3 .6 3 2.2"/>'],
  ['Сообщества', '<circle cx="6" cy="4.2" r="1.7"/><circle cx="2.8" cy="5.2" r="1.2"/><circle cx="9.2" cy="5.2" r="1.2"/><path d="M3 10c0-1.8 1.4-2.8 3-2.8s3 1 3 2.8"/>'],
  ['Фото', '<rect x="1.6" y="2" width="8.8" height="8" rx="1.6"/><circle cx="4.4" cy="4.6" r="1"/><path d="M1.8 9l2.6-2.4 2 1.8 1.4-1.2 2.6 2"/>'],
  ['Музыка', '<rect x="1.6" y="1.8" width="8.8" height="8.4" rx="1.8"/><path d="M4 8.4V6M6 8.4V4M8 8.4V5.4"/>'],
  ['Видео', '<rect x="1.6" y="1.8" width="8.8" height="8.4" rx="1.8"/><path d="M5 4.4l2.4 1.6L5 7.6z"/>'],
  ['Клипы', '<path d="M3.6 2.2v3M6 1.8v3.6M8.4 2.4v3M2.8 6.2c0 2.4 1.4 3.8 3.2 3.8s3.2-1.4 3.2-3.8"/>'],
  ['Игры', '<path d="M3.4 3.4h5.2c1.2 0 2 1 2.2 2.4l.2 2c.1 1-1 1.4-1.6.6L8 7H4l-1.4 1.4c-.6.8-1.7.4-1.6-.6l.2-2c.2-1.4 1-2.4 2.2-2.4zM4 4.8v1.4M3.3 5.5h1.4"/>'],
  ['Стикеры', '<circle cx="6" cy="6" r="4.4"/><path d="M4.2 7.2c.5.7 1 1 1.8 1s1.3-.3 1.8-1M4.6 4.8v.4M7.4 4.8v.4"/>'],
  ['Маркет', '<path d="M2.4 4h7.2l-.6 5.8H3zM4.4 4V3.2a1.6 1.6 0 013.2 0V4"/>'],
  null,
  ['Сервисы', '<rect x="1.8" y="1.8" width="3.4" height="3.4" rx="1"/><rect x="6.8" y="1.8" width="3.4" height="3.4" rx="1"/><rect x="1.8" y="6.8" width="3.4" height="3.4" rx="1"/><rect x="6.8" y="6.8" width="3.4" height="3.4" rx="1"/>'],
  null,
  ['Закладки', '<path d="M3 1.8h6v8.4L6 8.2 3 10.2z"/>'],
  ['Файлы', '<path d="M3 1.8h3.6L9 4.2v6H3z"/>'],
  ['Помощь', '<circle cx="6" cy="6" r="4.4"/><path d="M4.8 4.8a1.3 1.3 0 112 1.1c-.5.3-.8.6-.8 1.1M6 8.4v.1"/>'],
];
const ICON = {
  pencil: '<svg viewBox="0 0 12 12"><path d="M2.2 9.8l.5-2.3 5.4-5.4 1.8 1.8-5.4 5.4zM7 3.3l1.8 1.8"/></svg>',
  again: '<svg viewBox="0 0 12 12"><path d="M9.6 6a3.6 3.6 0 11-1.1-2.6M9.8 1.8v2.2H7.6"/></svg>',
  chev: '<svg viewBox="0 0 8 8"><path d="M2.6 1l3 3-3 3"/></svg>',
  share: '<svg viewBox="0 0 12 12"><path d="M7.2 1.6l4 3.7-4 3.7V6.8C4.6 6.8 3 7.6 1.8 9.4c.2-2.8 1.8-4.6 5.4-5z"/></svg>',
};

export default {
  id: 'gigachat',
  label: 'GigaChat ГигаЧат (2025)',
  source: {
    platform: "GigaChat (Sber) bot in the VKontakte web messenger, a VK mini-app chat thread (desktop browser, light theme; a screen recording on YouTube, MsUYSP62awQ, 2025-07-26; corroborated by YouTube 92xN7j4v6dk, 2025-09-01, the same bot's image flow in Telegram)",
    feature: "VK messenger page: simplified left navigation and a white column with the user's prompt, the compose card ('Квадрат | Альбом | Портрет', 'Стиль: Не выбран') and a blue 'Нарисовать' button; pressing it posts a large flat grey panel with a two-arc ring spinner and 'Рисую несколько вариантов…', a variant strip below it (first slot outlined blue) and a pencil / regenerate / pale-blue disabled 'Поделиться' bar; the images then land, the first filling the panel, and 'Поделиться' turns solid blue (adapted to 10: a strip of ten slots filling in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=MsUYSP62awQ', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=92xN7j4v6dk', retrieved: '2026-10-14' },
    ],
    extrapolated: "the source shows a strip of FOUR slots whose pictures all land together; ten slots filling one at a time in strict reading order (the large panel taking the first variant as it lands) is extrapolated, as is 'Поделиться' turning solid only after the last. The prompt text and the message bubble around it are our own (the footage shows the compose card, not the sent prompt); the format cards are drawn as plain grey shapes.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'gigachat');
    const srcMain = ownSrc(ctx.src, 'gigachat-main');
    const slot = (g, i) => `<div class="${P}-slot"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const nav = NAV.map((n) => (n ? `<div><svg viewBox="0 0 12 12">${n[1]}</svg>${n[0]}</div>` : `<hr/>`)).join('');
    const fc = (label, w, h, on) => `<div class="${P}-fc"><i${on ? ` class="${P}-on"` : ''}><b style="width: ${w}px; height: ${h}px"></b></i>${label}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav">${nav}</div><div class="${P}-main"><div class="${P}-stage"><div class="${P}-view ${P}-compose"><div class="${P}-me"><div>${x.esc(PROMPT)}</div></div><div class="${P}-fmt">${fc('Квадрат', 28, 28, true)}${fc('Альбом', 32, 20)}${fc('Портрет', 20, 32)}</div><div class="${P}-sty">Стиль:</div><div class="${P}-field">Не выбран${ICON.chev}</div></div><div class="${P}-view ${P}-post" style="visibility: hidden"><div class="${P}-panel"><img src="${srcMain}" width="870" height="1024" decoding="sync" alt="Selected variant" style="visibility: hidden; transform-origin: ${tiles[0].origin}"/><div class="${P}-cover"><i class="${P}-ring"></i><span>Рисую несколько вариантов…</span></div></div><div class="${P}-strip">${tiles.map(slot).join('')}</div></div></div><div class="${P}-foot"><div class="${P}-draw">Нарисовать</div><div class="${P}-bar" style="visibility: hidden"><div class="${P}-sq">${ICON.pencil}</div><div class="${P}-sq">${ICON.again}</div><div class="${P}-share">${ICON.share}Поделиться</div></div></div></div></div>`);
    const q = (c) => root.querySelector(`.${P}-${c}`);
    const compose = q('compose'), post = q('post'), draw = q('draw'), bar = q('bar'), share = q('share'), ring = q('ring'), cover = q('cover'), main = q('panel').querySelector('img');
    const slots = [...root.querySelectorAll(`.${P}-slot`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    const sel = x.el(`<div class="${P}-sel"></div>`);
    root.querySelectorAll(`.${P}-slot`)[0].appendChild(sel);
    ctx.gate([...slots.map((c) => c.im), main]);
    // each picture rests at its crop's own CSS (set once; render never touches it)
    slots.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
    main.style.filter = restFilter(tiles[0]);
    main.style.transform = restTransform(tiles[0]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Нарисовать' is pressed (it never changes label); the compose card gives way to the posted message
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.1);
        put('draw', gp.toFixed(3), () => { draw.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });
        const issued = s >= ISSUE;
        put('iss', issued, (v) => {
          compose.style.visibility = v ? 'hidden' : '';
          post.style.visibility = v ? '' : 'hidden';
          draw.style.visibility = v ? 'hidden' : '';
          bar.style.visibility = v ? '' : 'hidden';
        });

        // the large panel shows the selected (first) variant once it has landed; the spinner and caption go with it
        put('main', s >= LAND[0], (v) => { main.style.visibility = v ? '' : 'hidden'; cover.style.display = v ? 'none' : ''; });
        // the ring turns with t alone, shown or not
        const deg = (((t * 380) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // hard per-slot swap, strictly in reading order
        slots.forEach((c, i) => {
          put(`l${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });

        // 'Поделиться' stays pale and disabled until the last picture has landed
        put('share', s >= LAND[SLOTS - 1], (v) => { share.style.background = v ? '#2c7bea' : ''; });
      },
    };
  },
};
