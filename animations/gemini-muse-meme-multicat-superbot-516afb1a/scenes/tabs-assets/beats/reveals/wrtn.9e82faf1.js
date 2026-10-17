// Image generation in Wrtn's (뤼튼) Android chat (YouTube cNtTUtSu4Gg, 정말쉬운디지털, 2024-10-02; the third generation, send t=269.9 s ->
// answer text t=274.5 s -> picture t~275.8 s, with the regenerate at 209.4-210.8 s; spec .tmp/clone-9e82faf1/reveal-refs/wrtn/spec.json,
// confidence 0.60; frames wz2_wrtn_composer_zoom_t270.5.png, wz2_wrtn_pending_status_t272.6.png, wz2_wrtn_answer_text_t274.3.png,
// wz2_wrtn_landed_t275.8.png, wz2_wrtn_sheet_10fps_269-276.png). A pure white phone chat page. There is NO image-shaped placeholder
// tile and no spinner or percentage: tapping the red send arrow collapses the keyboard and turns the composer's arrow into a black
// round stop button (a white rounded square) for about 2.4 s; a new chat turn then appears - a bold black user heading ('달에 있는
// 우주인'), a row with the bold label '답변' and, underneath, one grey line '좋은 답변을 위해 정보를 찾고 있어요...' for about 2.0 s;
// the line is then replaced in place by the black '이미지를 다음과 같이 그려봤어요!' and the finished picture (a full-width rounded image
// with a '저장하기' pill beneath) is revealed by the page scrolling. The composer pill reads '만들고 싶은 이미지를 설명해 주세요'.
// Adapted to ten images: the picture block is a five-by-two grid of rounded portrait images under the answer line, each appearing in
// strict reading order in its reserved (white) slot, the '저장하기' pill filed under the block once the tenth is there and the stop
// button turning back into the red send arrow. Omitted: the six-petal flower mark beside '답변' (a plain coral dot stands in), the
// bottom tab bar, the keyboard, the presenter and the captions burned into the footage. The footage's pictures are never reproduced:
// every image is our own meme, and no logo or platform font is drawn (plain shapes, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wrt';
const FONT = `${UI_FONT}, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR', sans-serif`;
const ROOT_H = 500, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ffffff; color: #111111; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #ececec; }
.${P}-chat { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 26px 24px 0; }
.${P}-turn { flex: none; display: flex; flex-direction: column; }
.${P}-user { margin: 0; font-size: 17px; font-weight: 700; line-height: 24px; color: #111111; }
.${P}-lbl { display: flex; align-items: center; gap: 8px; margin-top: 16px; height: 22px; font-size: 15px; font-weight: 700; color: #111111; }
.${P}-lbl i { display: block; width: 14px; height: 14px; border-radius: 50%; background: #f2553c; box-shadow: 0 0 0 3px #fde5e1; }
.${P}-say { margin-top: 12px; height: 20px; font-size: 14px; line-height: 20px; white-space: nowrap; }
.${P}-say.${P}-wait { color: #9c9c9c; }
.${P}-say.${P}-done { color: #111111; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 14px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; overflow: hidden; background: #ffffff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-save { flex: none; align-self: flex-end; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 28px; margin-top: 10px; padding: 0 12px; border-radius: 14px; box-shadow: inset 0 0 0 1px #e2e2e2; font-size: 11.5px; font-weight: 500; color: #222222; white-space: nowrap; }
.${P}-save svg { width: 10px; height: 11px; fill: none; stroke: #f2553c; stroke-width: 1.7; stroke-linejoin: round; }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 10px; padding: 10px 14px 16px 14px; }
.${P}-pill { flex: 1; box-sizing: border-box; display: flex; align-items: center; height: 42px; padding: 0 18px; border-radius: 21px; background: #f5f5f5; font-size: 14px; white-space: nowrap; overflow: hidden; }
.${P}-pill.${P}-ph { color: #b3b3b3; font-weight: 500; }
.${P}-pill.${P}-typed { color: #222222; }
.${P}-btn { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: #f2553c; }
.${P}-btn.${P}-stop { background: #111111; }
.${P}-btn svg { width: 16px; height: 16px; fill: none; stroke: #ffffff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-btn b { display: none; width: 13px; height: 13px; border-radius: 3px; background: #ffffff; }
.${P}-btn.${P}-stop b { display: block; }
.${P}-btn.${P}-stop svg { display: none; }
`;

const USER = '달에 있는 우주인';
const WAIT = '좋은 답변을 위해 정보를 찾고 있어요...';
const DONE = '이미지를 다음과 같이 그려봤어요!';
const HOLD = '만들고 싶은 이미지를 설명해 주세요';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the finger taps the red send arrow
const STOP = 0.12;                                // the arrow turns into the black stop button, the composer clears
const ISSUE = 0.22;                               // the new chat turn appears with the grey status line
const ANSWER = 0.36;                              // the grey line is replaced by the black answer line
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // image i appears (reading order), the last at 1.68
const SEND = '<svg viewBox="0 0 16 16"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>';
const MARK = '<svg viewBox="0 0 10 11"><path d="M1.5 1h7v9L5 7.4 1.5 10z"/></svg>';

export default {
  id: 'wrtn',
  label: 'Wrtn 뤼튼 (2024)',
  source: {
    platform: "Wrtn (뤼튼) Android chat app, image generation by chat (a phone mirrored beside the presenter in a Korean tutorial on YouTube, 2024-10-02)",
    feature: "white phone chat: tap the red send arrow -> the composer's arrow becomes a black round stop button -> a chat turn appears (bold user heading, '답변' label, one grey status line '좋은 답변을 위해 정보를 찾고 있어요...') -> the line is replaced in place by '이미지를 다음과 같이 그려봤어요!' and the finished picture with a '저장하기' pill is revealed (no image placeholder tile, spinner or percentage anywhere; adapted to 10: a five-by-two block of images appearing one by one in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=cNtTUtSu4Gg', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten images in a five-by-two block (the footage answers with one full-width picture)",
      "one-by-one landing in reading order, each in a blank reserved slot (the footage has no placeholder: the picture is revealed by scrolling)",
      "one '저장하기' pill for the whole block, filed when the tenth has appeared (the footage shows one pill under its single picture)",
      "the compressed timings (the footage holds the stop button about 2.4 s and the grey line about 2.0 s) and the red send arrow returning when the answer is complete",
      "the coral dot beside '답변' (the footage has the brand's flower mark there, omitted)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'wrtn');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-chat"><div class="${P}-turn" style="visibility: hidden"><h3 class="${P}-user">${x.esc(USER)}</h3><div class="${P}-lbl"><i></i>답변</div><div class="${P}-say ${P}-wait">${x.esc(WAIT)}</div></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-save" style="visibility: hidden">${MARK}저장하기</div></div><div class="${P}-bar"><div class="${P}-pill ${P}-typed">${x.esc(USER)}</div><div class="${P}-btn">${SEND}<b></b></div></div></div>`);
    const turn = root.querySelector(`.${P}-turn`), say = root.querySelector(`.${P}-say`), save = root.querySelector(`.${P}-save`), pill = root.querySelector(`.${P}-pill`), btn = root.querySelector(`.${P}-btn`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the red send arrow is tapped; the composer clears and the arrow is a black stop button until the answer is complete
        const gp = press(s, GEN_AT, 0.05, 0.05, 0.12);
        put('gp', gp.toFixed(3), () => { btn.style.transform = gp > 0 ? `scale(${(1 - 0.08 * gp).toFixed(4)})` : 'none'; });
        const mode = s >= LAND[9] ? 2 : s >= STOP ? 1 : 0;
        put('mode', mode, (m) => {
          btn.className = `${P}-btn${m === 1 ? ` ${P}-stop` : ''}`;
          pill.className = `${P}-pill ${m === 0 ? `${P}-typed` : `${P}-ph`}`;
          pill.textContent = m === 0 ? USER : HOLD;
        });

        // the chat turn appears with the grey status line, which is replaced in place by the black answer line
        put('turn', s >= ISSUE, (v) => { turn.style.visibility = v ? '' : 'hidden'; });
        put('say', s >= ANSWER, (v) => { say.className = `${P}-say ${v ? `${P}-done` : `${P}-wait`}`; say.textContent = v ? DONE : WAIT; });

        // each image is there from its moment on, in its reserved slot (no placeholder is drawn)
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });

        put('save', s >= LAND[9], (v) => { save.style.visibility = v ? '' : 'hidden'; });
      },
    };
  },
};
