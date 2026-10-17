// Shedevrum Шедеврум (Yandex, YandexART), the free text-to-image page shedevrum.ai/text-to-image (YouTube J12XxiPVCok, 'Создание
// изображений с помощью нейросети Шедеврум', channel Заметки AI-Архитектора, 2025-08-03, t~86.5-93 s; spec
// .tmp/clone-9e82faf1/reveal-refs/shedevrum/spec.json, confidence 0.60; frames ah_j12_f89.6 / f89.9 / f90.1 / f90.3 / f90.5 / f90.8,
// ah_j12_left_pending, ah_j12_panel_pending, ah_j12_tile_10fps). A light page: slim nav links and a black 'Создать' pill, a bold
// two-line headline with the YandexART sub-line, then one rounded card split in two. The left half carries the pill tabs
// 'Картинки | Раскраска | Видео', the 'Модель v.2.5' label and the prompt in large bold type; the right half is a pale flat panel.
// Pressing the black button turns its row into a grey pill, 'До завершения меньше 9 сек' with an alarm-clock glyph and a grey
// 'Отменить' button, while the right panel shows nothing but one thin black arc spinner. The wait is a sentence, not a bar: no
// percentage, no queue position, no blur. When the picture lands the spinner goes in one step and the row becomes the result
// controls (trash, pencil, regenerate, sparkle) above a black 'Опубликовать' button.
// Adapted to ten images: the panel's single picture becomes ten tiles (4 + 4 + 2) that hard-swap in reading order, and the pill gives
// way to the result controls after the last. The countdown holds the one value the footage records (9) for the whole wait.
// Omitted on purpose: every commercial or branding element of the page (the full-page sponsor interstitial, the badges on the tabs,
// the studio pill, the daily-quota line, the app-download line, the wordmark, the account icons) and the browser chrome. The footage's picture
// is never reproduced: every tile is our own meme, and no logo is drawn (plain type, plain shapes).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-shd';
const ROOT_H = 440, COLS = 4, GAP = 5;
const FONT = `${UI_FONT}, 'Helvetica Neue', Arial, sans-serif`;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 16px; border-radius: 12px; background: #ffffff; color: #111111; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #ececec; }
.${P}-nav { display: flex; align-items: center; gap: 12px; height: 34px; padding-top: 4px; font-size: 7.5px; font-weight: 500; color: #8c8c8c; white-space: nowrap; }
.${P}-new { margin-left: auto; box-sizing: border-box; display: grid; place-items: center; height: 17px; padding: 0 9px; border-radius: 9px; background: #000000; font-size: 7.5px; font-weight: 700; color: #ffffff; }
.${P}-h1 { margin: 6px 0 0; font-size: 19px; line-height: 21px; font-weight: 800; letter-spacing: -0.2px; color: #000000; }
.${P}-sub { margin: 7px 0 0; font-size: 7.4px; line-height: 10px; color: #222222; }
.${P}-card { position: absolute; left: 16px; right: 16px; bottom: 14px; top: 114px; display: flex; gap: 12px; box-sizing: border-box; padding: 8px; border-radius: 16px; background: #ffffff; box-shadow: 0 1px 10px rgba(0, 0, 0, .10), 0 0 0 1px rgba(0, 0, 0, .04); }
.${P}-left { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-tabs { flex: none; display: flex; gap: 2px; box-sizing: border-box; height: 18px; padding: 2px; border-radius: 7px; background: #f1f1f1; font-size: 6.6px; font-weight: 600; color: #444444; }
.${P}-tabs span { flex: 1; display: grid; place-items: center; border-radius: 5px; white-space: nowrap; }
.${P}-tabs .${P}-on { background: #ffffff; color: #000000; box-shadow: 0 0 1px rgba(0, 0, 0, .25); }
.${P}-model { flex: none; margin-top: 12px; font-size: 6.4px; color: #a8a8a8; white-space: nowrap; }
.${P}-model b { margin-left: 4px; font-weight: 600; color: #8a8a8a; }
.${P}-prompt { flex: none; margin-top: 5px; font-size: 11.4px; line-height: 14.6px; font-weight: 800; letter-spacing: -0.1px; color: #000000; }
.${P}-act { position: relative; flex: none; height: 98px; margin-top: auto; }
.${P}-layer { position: absolute; left: 0; right: 0; }
.${P}-go { top: 44px; display: grid; place-items: center; height: 30px; border-radius: 10px; background: #000000; font-size: 8.6px; font-weight: 700; color: #ffffff; }
.${P}-wait { top: 44px; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 30px; padding: 0 5px 0 9px; border-radius: 10px; background: #f1f1f1; font-size: 7.2px; font-weight: 500; color: #111111; white-space: nowrap; }
.${P}-wait span { display: flex; align-items: center; gap: 3px; }
.${P}-wait svg { display: block; width: 8px; height: 8px; }
.${P}-wait b { box-sizing: border-box; display: grid; place-items: center; height: 20px; padding: 0 9px; border-radius: 8px; background: #d9d9d9; font-size: 7.6px; font-weight: 700; color: #000000; }
.${P}-ico { top: 0; display: flex; gap: 6px; }
.${P}-ico i { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 9px; background: #eeeeee; }
.${P}-ico svg { display: block; width: 11px; height: 11px; fill: none; stroke: #1a1a1a; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pub { top: 44px; display: grid; place-items: center; height: 30px; border-radius: 10px; background: #000000; font-size: 8.6px; font-weight: 700; color: #ffffff; }
.${P}-lic { top: 82px; text-align: center; font-size: 6px; line-height: 8px; color: #8f8f8f; white-space: nowrap; }
.${P}-lic em { font-style: normal; color: #2a7fd4; }
.${P}-right { position: relative; flex: none; width: 248px; border-radius: 12px; background: #f2f2f2; overflow: hidden; }
.${P}-spin { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; }
.${P}-ring { display: block; width: 22px; height: 22px; border-radius: 50%; background: conic-gradient(from 0deg, #000000 0deg, #000000 96deg, rgba(0, 0, 0, 0) 100deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 7px; overflow: hidden; background: #e3e3e3; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #e3e3e3; }
`;

const PROMPT = 'Нарисуй музу в аудитории с рукописной запиской, стиль мем, яркие цвета, солнечный день';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.04;                              // the cursor presses 'Создать шедевр'
const ISSUE = 0.12;                               // its row becomes the countdown pill; the panel shows the arc spinner
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i is hard-swapped for its picture (reading order), the last at 1.68

const ICON = {
  clock: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6.6" r="4.2" fill="#f3f3f3" stroke="#e5483c" stroke-width="1.3"/><path d="M6 4.4v2.4l1.5 1" fill="none" stroke="#e5483c" stroke-width="1.1" stroke-linecap="round"/><path d="M1.6 3.2L3.4 1.6M10.4 3.2L8.6 1.6" stroke="#e5483c" stroke-width="1.5" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 12 12"><path d="M2.5 3.3h7M4.7 3.3V2h2.6v1.3M3.5 3.3l.4 6.4h4.2l.4-6.4M5 5v3M7 5v3"/></svg>',
  pencil: '<svg viewBox="0 0 12 12"><path d="M2.2 9.8l.5-2.3 5.4-5.4 1.8 1.8-5.4 5.4zM7 3.3l1.8 1.8"/></svg>',
  again: '<svg viewBox="0 0 12 12"><path d="M9.6 6a3.6 3.6 0 11-1.1-2.6M9.8 1.8v2.2H7.6"/></svg>',
  spark: '<svg viewBox="0 0 12 12"><path d="M6 1.6l1.1 2.9 2.9 1.1-2.9 1.1L6 9.6 4.9 6.7 2 5.6l2.9-1.1z"/></svg>',
};

export default {
  id: 'shedevrum',
  label: 'Shedevrum Шедеврум (2025)',
  source: {
    platform: "Shedevrum (Yandex, YandexART) free text-to-image web page, shedevrum.ai/text-to-image (desktop browser, light theme; a tutorial screen recording on YouTube, J12XxiPVCok, 2025-08-03)",
    feature: "light page with one rounded card: left half with the tabs 'Картинки | Раскраска | Видео', 'Модель v.2.5' and the big bold prompt, right half a pale flat panel; on press the black button row becomes a grey pill 'До завершения меньше 9 сек' + 'Отменить' while the panel shows only a thin black arc spinner (no percentage, bar or blur); the picture then lands and the row becomes the result controls + a black 'Опубликовать' button (adapted to 10: a 4 + 4 + 2 tile block filling in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=J12XxiPVCok', retrieved: '2026-10-14' }],
    extrapolated: "the source shows ONE picture landing in the panel in one step; ten tiles (a 4 + 4 + 2 block) hard-swapping one at a time in strict reading order, the pill staying until the last and then giving way to the result controls, and the pale placeholder tiles are extrapolated. The countdown only ever reads 9 in the footage, so it is held at 9 for the whole wait (the wording of the later steps is unknown). The prompt and the pre-press button label 'Создать шедевр' are read from soft frames; the prompt is our own text.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'shedevrum');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><span>недавнее</span><span>подписки</span><span>лучшее</span><span>раскраски</span><span>альбомы</span><div class="${P}-new">Создать</div></div><h2 class="${P}-h1">Создавайте шедевры<br/>с нейросетью Яндекса</h2><p class="${P}-sub">Нейросеть YandexART бесплатно сгенерирует картинку и видео онлайн.</p><div class="${P}-card"><div class="${P}-left"><div class="${P}-tabs"><span class="${P}-on">Картинки</span><span>Раскраска</span><span>Видео</span></div><div class="${P}-model">Модель<b>v.2.5</b></div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-act"><div class="${P}-layer ${P}-go">Создать шедевр</div><div class="${P}-layer ${P}-wait" style="visibility: hidden"><span>До завершения меньше 9 сек${ICON.clock}</span><b>Отменить</b></div><div class="${P}-layer ${P}-ico" style="visibility: hidden"><i>${ICON.trash}</i><i>${ICON.pencil}</i><i>${ICON.again}</i><i>${ICON.spark}</i></div><div class="${P}-layer ${P}-pub" style="visibility: hidden">Опубликовать</div><div class="${P}-layer ${P}-lic" style="visibility: hidden">Публикуя, вы принимаете условия <em>Лицензионного Соглашения</em></div></div></div><div class="${P}-right"><div class="${P}-spin" style="visibility: hidden"><i class="${P}-ring"></i></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const q = (c) => root.querySelector(`.${P}-${c}`);
    const go = q('go'), wait = q('wait'), ico = q('ico'), pub = q('pub'), lic = q('lic'), spin = q('spin'), ring = q('ring'), grid = q('g');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    // each picture rests at its crop's own CSS (set once; render never touches it)
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const vis = (el) => (v) => { el.style.visibility = v ? '' : 'hidden'; };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Создать шедевр' is pressed; its row gives way to the countdown pill
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });
        const issued = s >= ISSUE, finished = s >= LAND[9];
        put('btn', issued, (v) => { go.style.visibility = v ? 'hidden' : ''; });
        put('wait', issued && !finished, vis(wait));
        put('done', finished, (v) => { vis(ico)(v); vis(pub)(v); vis(lic)(v); });

        // the panel: only the arc spinner until the first picture, then the tile block
        const spinning = issued && s < LAND[0];
        put('spin', spinning, vis(spin));
        put('grid', s >= LAND[0], vis(grid));
        // the arc turns with t alone, shown or not
        const deg = (((t * 400) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // hard per-tile swap, strictly in reading order
        cells.forEach((c, i) => {
          put(`l${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
