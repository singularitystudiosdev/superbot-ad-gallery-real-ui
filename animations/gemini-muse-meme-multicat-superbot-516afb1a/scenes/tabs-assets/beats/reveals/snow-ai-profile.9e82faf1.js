// SNOW AIアバター (2023), the AI avatar mode of SNOW, SNOW Corporation's camera app (YouTube -sdi0bghEFA, KAMyu´z チャンネル, 2023-04-01;
// also 6-5WNVtl314, さちえるチャンネル, 2023-01-31; spec .tmp/clone-9e82faf1/reveal-refs/snow-ai-profile/spec.json; frames
// an_snow_wait_186s.png, an_snow_myavatar_190s.png, an_snow_options_184s.png). After 'アバター生成' the phone shows a white sheet: the
// heading 'アバター作成中..', the three-line line 'アバターを作成中です。完了したらSNOWから通知が届きます。', a pale square holding a ghost of the
// selfie with a large blue circular arc on a grey ring track, '残り時間 20分' under it, a blue pill '完了したら通知する' and a grey pill
// '画面を閉じる'. The wait is held only ~4 s of the edited footage (the minute figure never changes), then the sheet becomes 'MYアバター'
// ('マイアバター') with the pack 'アバターパック#1'.
// Adapted to ten images: the wait sheet (the arc filling from t) gives way to the 'MYアバター' page, whose pack card holds ten square
// tiles in two rows of five, filling one at a time in reading order. Omitted: the option screen (the 50 / 100 / 240 packs and every
// price or sale tag), the pack's tier line, the new-avatar button, the system navigation bar and SNOW's logo. The ghost and every tile are
// our own meme; no platform font is drawn (system type with a Japanese fallback).
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sna';
const FONT = `${UI_FONT}, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans CJK JP', sans-serif`;
const ROOT_H = 520, COLS = 5, GAP = 8, SQ = 214, RING = 184;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #ffffff; color: #1d2024; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e3e7ec; }
.${P}-pane { position: absolute; inset: 0; box-sizing: border-box; }
.${P}-wait { display: flex; flex-direction: column; align-items: center; padding: 0 130px 22px; text-align: center; }
.${P}-wait h2 { flex: none; margin: 46px 0 0; font-size: 20px; font-weight: 700; line-height: 28px; color: #1d2024; white-space: nowrap; }
.${P}-wait p { flex: none; width: 190px; margin: 10px 0 0; font-size: 10.5px; line-height: 14px; color: #555b63; }
.${P}-sq { position: relative; flex: none; width: ${SQ}px; height: ${SQ}px; margin-top: 18px; border-radius: 10px; background: #f2f6f9; overflow: hidden; }
.${P}-sq img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; opacity: .05; }
.${P}-ring { position: absolute; left: ${(SQ - RING) / 2}px; top: ${(SQ - RING) / 2}px; width: ${RING}px; height: ${RING}px; border-radius: 50%; background: #e4e8ec; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10.5px)); }
.${P}-fill { background: conic-gradient(from 0deg, #2ab9ff 0deg, #2ab9ff 0deg, transparent 0deg); }
.${P}-left { flex: none; margin-top: 12px; font-size: 11.5px; font-weight: 700; line-height: 16px; color: #1d2024; }
.${P}-notify { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 340px; height: 44px; margin-top: auto; border-radius: 22px; background: linear-gradient(90deg, #1ab0ff, #38c6ff); font-size: 12.5px; font-weight: 700; color: #ffffff; white-space: nowrap; }
.${P}-close { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 340px; height: 44px; margin-top: 10px; border-radius: 22px; background: #e8f1f8; font-size: 12.5px; font-weight: 700; color: #3b4148; white-space: nowrap; }
.${P}-done { padding: 0 20px; }
.${P}-top { display: flex; align-items: center; justify-content: space-between; height: 44px; }
.${P}-top i { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #b9bec4; }
.${P}-top svg { display: block; width: 18px; height: 18px; fill: none; stroke: #1d2024; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top i svg { width: 10px; height: 10px; stroke: #ffffff; stroke-width: 1.8; }
.${P}-done h1 { margin: 10px 0 0; text-align: center; font-size: 22px; font-weight: 700; line-height: 30px; color: #1d2024; }
.${P}-sub { margin: 8px 0 0; text-align: center; font-size: 12px; line-height: 18px; color: #555b63; }
.${P}-pack { margin-top: 22px; box-sizing: border-box; padding: 14px; border-radius: 14px; background: linear-gradient(160deg, #e9cfd9, #d6cde3); }
.${P}-cap { height: 22px; font-size: 14px; font-weight: 700; line-height: 22px; color: #ffffff; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1 / 1; border-radius: 8px; background: rgba(255, 255, 255, .42); overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const OPEN = 0.62;                                // the wait sheet gives way to the page
const LAND = Array.from({ length: 10 }, (_, i) => 0.78 + i * 0.1);   // tile i fills (reading order), the last at 1.68
const ARC = 190;                                  // the arc's fill (degrees) when the sheet gives way: a bit over half, as the footage's frame shows
const CLOSE = '<svg viewBox="0 0 18 18"><path d="M3.5 3.5l11 11M14.5 3.5l-11 11"/></svg>';
const LINK = '<svg viewBox="0 0 18 18"><path d="M7.6 10.4a3.2 3.2 0 0 0 4.5 0l2.4-2.4a3.2 3.2 0 0 0-4.5-4.5l-.8.8M10.4 7.6a3.2 3.2 0 0 0-4.5 0L3.5 10a3.2 3.2 0 0 0 4.5 4.5l.8-.8"/></svg>';

export default {
  id: 'snow-ai-profile',
  label: 'SNOW AIアバター (2023)',
  source: {
    platform: "SNOW phone app (SNOW Corporation, Android), the AIアバター mode (a screen recording on YouTube with the app in a phone frame, 2023-04)",
    feature: "white wait sheet: 'アバター作成中..', 'アバターを作成中です。完了したらSNOWから通知が届きます。', a pale square holding a ghost of the selfie with a blue circular arc on a grey ring track, '残り時間 20分', a blue '完了したら通知する' pill and a grey '画面を閉じる' pill; the 'MYアバター' page follows with its pack card (adapted to 10: the sheet gives way to the page, whose ten tiles fill one at a time in reading order; the option screen, its pack tiers and every price are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=-sdi0bghEFA', title: "スマホアプリ『SNOW』でAIアバターを作ってみました！(KAMyu´z チャンネル)", published: '2023-04-01', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=6-5WNVtl314', title: 'AIアバターの作り方 SNOWで誰でも簡単♪ (さちえるチャンネル)', published: '2023-01-31', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "the swap from the wait sheet to the 'MYアバター' page and its timing: the edited footage holds the wait for ~4 s and cuts to the finished page, so ten pictures landing one at a time in reading order are invented (the footage's pack shows a single portrait filling its card)",
      "the arc fills with t, from empty to a little over half by the time the sheet gives way (the footage shows one frame of the arc, never its motion, and the app's own wait is ~20 minutes); the fill holds once the last tile lands",
      "'残り時間 20分' is held (the minute figure never changes in the footage, so no 20 -> 19 step is invented)",
      "the pack card is reflowed as ten square tiles in two rows of five under the caption 'アバターパック#1' on a pale rose card (the footage's pack is one large portrait with its tier line, which is omitted); the portrait phone sheet is stretched into the 560 px column",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'snow-ai-profile');
    const ghostSrc = ownSrc(ctx.src, 'snow-ai-profile-ghost');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-pane ${P}-wait"><h2>アバター作成中..</h2><p>アバターを作成中です。完了したらSNOWから通知が届きます。</p><div class="${P}-sq"><img src="${ghostSrc}" width="870" height="1024" decoding="sync" alt=""/><i class="${P}-ring"></i><i class="${P}-ring ${P}-fill"></i></div><div class="${P}-left">残り時間 20分</div><div class="${P}-notify">完了したら通知する</div><div class="${P}-close">画面を閉じる</div></div><div class="${P}-pane ${P}-done" style="visibility: hidden"><div class="${P}-top"><i>${CLOSE}</i>${LINK}</div><h1>MYアバター</h1><div class="${P}-sub">新しい写真でアバターを今すぐ作ってみましょう！</div><div class="${P}-pack"><div class="${P}-cap">アバターパック#1</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const wait = q('wait'), done = q('done'), fill = q('fill');
    const thumbs = [...root.querySelectorAll(`.${P}-t img`)];
    ctx.gate([...thumbs, root.querySelector(`.${P}-sq img`)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the wait sheet gives way to the 'MYアバター' page
        put('open', s >= OPEN, (v) => { wait.style.visibility = v ? 'hidden' : ''; done.style.visibility = v ? '' : 'hidden'; });

        // the determinate arc fills with t (empty at the card's entrance, ARC degrees when the sheet gives way) and holds once the last tile lands; a function of t alone, shown or not
        const tg = Math.min(s, LAND[LAND.length - 1]);
        const deg = Math.round(ARC * Math.max(0, Math.min(1, tg / OPEN)));
        put('deg', deg, (d) => { fill.style.background = `conic-gradient(from 0deg, #2ab9ff 0deg, #2ab9ff ${d}deg, transparent ${d}deg)`; });

        // the tiles fill in reading order, each a hard swap
        thumbs.forEach((im, i) => put(`i${i}`, s >= LAND[i], (v) => { im.style.visibility = v ? '' : 'hidden'; }));
      },
    };
  },
};
