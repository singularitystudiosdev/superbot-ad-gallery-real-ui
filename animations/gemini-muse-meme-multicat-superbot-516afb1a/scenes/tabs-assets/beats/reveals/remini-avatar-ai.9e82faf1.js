// Remini (mobile app), the 'Avatar AI' wait while fifty avatars are made, as screen-recorded on an Android phone in December 2022
// (YouTube tGWRtJmKfAA, Holik Akbar, 2022-12-19, Indonesian, t~279.5-301.5 s the wait and t~345-420 s the result; spec
// .tmp/clone-9e82faf1/reveal-refs/remini-avatar-ai/spec.json, confidence 0.70; frames ao_wait_screen_zoom_t286, ao_wait_grid_zoom_t286,
// ao_spinner_strip, ao_result_grid_t358). A black page: a back chevron and 'Avatar AI', then a 2 x 3 grid of empty dark rounded tiles,
// each with one faint outlined face glyph. Over the grid's middle row sits the status block: a small pink open arc that turns, the bold
// 'Membuat avatar...', the grey 'Siap sekitar' and, largest of the three, an ABSOLUTE clock '12:36 AM' (a wall-clock time, not a countdown
// and not a percentage; it never changes in the footage). Under the grid a three-line grey note ('Setelah selesai, Anda akan mendapatkan 50
// gambar ...') and two full-width pills, the filled 'Beritahu Saya Jika Sudah Selesai' and the outlined 'Sembunyikan Layar Ini'. There is no
// percentage and no bar; the only motion is the arc. The finished set then shows in a result grid with 'Simpan semua' in the header, the note
// 'Avatar disimpan selama 7 hari...', the pill 'Hasilkan lebih banyak' and a retry line.
// Adapted to ten avatars: the wait holds, the finger taps 'Sembunyikan Layar Ini', the screen is replaced in one frame by the result page
// (a 5 x 2 block of empty tiles, wider than the phone's two columns because the column is 560 wide), and the avatars land in strict reading
// order. The arc and the pill press move from t and are gone (or reset) by the time the last avatar lands, so the landed page is static.
// Omitted: the red 'WEB' pill and every plan or price mark, the Remini wordmark and the 'Remini' watermark on a result, the 'Bersembunyi'
// header label (unexplained chrome), the phone status bar and the footage's own faces: every tile is our own meme, and no logo, wordmark or
// platform font is drawn (plain shapes, system type). Distinct from the 'remini' module (the 'AI Photos' wait: one arc, a relative
// 'Estimated time: N minutes', no tiles).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rav';
const ROOT_H = 520, COL_W = 300, PAD = 16, TGAP = 8, TILE_H = 108, COLS = 5, GAP = 6;
const PINK = '#F9698C';
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #05060a; color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a1c22; }
.${P}-wt, .${P}-rs { position: absolute; inset: 0; }
.${P}-col { position: absolute; left: 50%; top: 0; bottom: 0; width: ${COL_W}px; margin-left: -${COL_W / 2}px; }
.${P}-bar { position: absolute; left: 0; right: 0; top: 0; height: 40px; display: flex; align-items: center; justify-content: center; }
.${P}-bar b { font-size: 13px; line-height: 16px; font-weight: 700; color: #fff; }
.${P}-bar svg { position: absolute; left: 12px; top: 12px; width: 16px; height: 16px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-gr { position: absolute; left: ${PAD}px; right: ${PAD}px; top: 40px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: ${TGAP}px; }
.${P}-pt { box-sizing: border-box; height: ${TILE_H}px; border-radius: 14px; background: #1c232d; display: grid; place-items: center; }
.${P}-gl { display: block; width: 26px; height: 26px; fill: none; stroke: rgba(154, 160, 170, .34); stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-st { position: absolute; left: 0; right: 0; top: ${40 + TILE_H + TGAP}px; height: ${TILE_H}px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.${P}-arc { display: block; width: 24px; height: 24px; fill: none; stroke: ${PINK}; stroke-width: 2.6; stroke-linecap: round; }
.${P}-st b { margin-top: 5px; font-size: 13px; line-height: 16px; font-weight: 700; color: #fff; white-space: nowrap; }
.${P}-st span { margin-top: 5px; font-size: 9px; line-height: 11px; color: #9aa0aa; }
.${P}-st strong { margin-top: 2px; font-size: 22px; line-height: 26px; font-weight: 800; letter-spacing: -.2px; color: #fff; white-space: nowrap; }
.${P}-nt { position: absolute; left: 28px; right: 28px; top: ${40 + 3 * TILE_H + 2 * TGAP + 12}px; text-align: center; font-size: 8.5px; line-height: 11px; color: #9aa0aa; }
.${P}-bt { position: absolute; left: ${PAD}px; right: ${PAD}px; box-sizing: border-box; height: 30px; border-radius: 15px; display: grid; place-items: center; font-size: 10px; font-weight: 700; white-space: nowrap; }
.${P}-fill { top: ${40 + 3 * TILE_H + 2 * TGAP + 12 + 33 + 11}px; background: #e6e8f0; color: #12131a; }
.${P}-line { top: ${40 + 3 * TILE_H + 2 * TGAP + 12 + 33 + 11 + 36}px; box-shadow: inset 0 0 0 1px #5d606b; color: #fff; }
.${P}-rbar { position: absolute; left: 0; right: 0; top: 0; height: 44px; display: flex; align-items: center; justify-content: center; }
.${P}-rbar b { font-size: 13px; line-height: 16px; font-weight: 700; color: #fff; }
.${P}-rbar svg { position: absolute; left: 14px; top: 14px; width: 16px; height: 16px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; }
.${P}-rbar em { position: absolute; right: 14px; top: 8px; box-sizing: border-box; height: 28px; padding: 0 12px; border-radius: 14px; background: #1b1d25; font-style: normal; font-size: 9.5px; line-height: 28px; font-weight: 700; color: #fff; white-space: nowrap; }
.${P}-rb { position: absolute; left: 0; right: 0; top: 44px; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.${P}-rg { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; width: 532px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 10px; overflow: hidden; background: #1c232d; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; display: grid; place-items: center; background: #1c232d; }
.${P}-dl { position: absolute; right: 5px; bottom: 5px; display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #fff; }
.${P}-dl svg { width: 9px; height: 9px; fill: none; stroke: #12131a; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-sv { margin-top: 14px; font-size: 9px; line-height: 12px; color: #9aa0aa; text-align: center; }
.${P}-more { margin-top: 12px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px; width: 300px; height: 34px; border-radius: 17px; background: #e6e8f0; font-size: 10.5px; font-weight: 700; color: #12131a; white-space: nowrap; }
.${P}-more svg { width: 13px; height: 13px; fill: none; stroke: #12131a; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-rt { margin-top: 12px; font-size: 8.5px; line-height: 11px; color: #7f8591; text-align: center; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const HIDE_AT = 0.8;                               // the finger taps 'Sembunyikan Layar Ini'
const SWAP = 0.98;                                 // the wait screen is replaced by the result page in one frame
const LAND = Array.from({ length: 10 }, (_, i) => 1.12 + i * 0.0715);   // avatar i lands (strict reading order), the last at 1.76
const FADE = 0.05;                                 // a tile's cover thins away over this long before its avatar lands
const SPIN = 0.85;                                 // seconds per turn of the arc
const BREATH = 1.3;                                // seconds per grow-and-shrink of the arc's length
const CIRC = 2 * Math.PI * 9;                      // the arc's circle (r 9 in a 24 box)
const GLYPH = '<svg class="' + P + '-gl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><path d="M8.3 12.2q3.7 3.6 7.4 0M8.8 9.8h.01M15.2 9.8h.01"/></svg>';
const BACK = '<svg viewBox="0 0 16 16"><path d="M10 2.5L4.5 8 10 13.5"/></svg>';
const CLOSE = '<svg viewBox="0 0 16 16"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';
const DOWN = '<svg viewBox="0 0 16 16"><path d="M8 2.5v8M4.8 7.6L8 10.8l3.2-3.2M3 13.5h10"/></svg>';
const REDO = '<svg viewBox="0 0 16 16"><path d="M13 7.5A5 5 0 1 0 11.6 11.6M13 3v4.5H8.5"/></svg>';

export default {
  id: 'remini-avatar-ai',
  label: 'Remini Avatar AI (2022)',
  source: {
    platform: "Remini mobile app (Android), the 'Avatar AI' wait and result screens (dark theme, Indonesian; one phone screen recording on YouTube, Holik Akbar, 2022-12-19)",
    feature: "a black phone page: a back chevron and 'Avatar AI', a 2 x 3 grid of empty dark rounded tiles with a faint face glyph, a small pink open arc turning over the bold 'Membuat avatar...', the grey 'Siap sekitar' above an absolute clock '12:36 AM' (no percentage, no bar), the '50 gambar' note and two pills 'Beritahu Saya Jika Sudah Selesai' / 'Sembunyikan Layar Ini'; then the result page with 'Simpan semua', the note 'Avatar disimpan selama 7 hari...' and 'Hasilkan lebih banyak' (adapted to 10: the wait holds, then the result page lands ten avatars one after another in reading order; the red WEB pill, plan and price chrome, wordmark, watermark, 'Bersembunyi' label and status bar are omitted)",
    video: 'tGWRtJmKfAA',
    date: '2022-12-19',
    refs: [{ url: 'https://www.youtube.com/watch?v=tGWRtJmKfAA', retrieved: '2026-10-14' }],
    extrapolated: [
      'the footage shows only the first ~22 s of the ~11-minute wait and never the avatars landing (the user left the app): the screen swap and the landing are built here, ten avatars in strict reading order',
      'the swap is preceded by a tap on Sembunyikan Layar Ini; in the footage that tap hides the screen while the job runs on, and the result page was opened by hand minutes later',
      "the result page is drawn 5 x 2 (the phone's own result grid is two columns and scrolls) so that ten tiles fit the 560-wide column; its tile glyph and the per-tile download button are taken from the result frame",
      "the clock '12:36 AM' is held for the whole beat as in the footage (it was never seen to change); six placeholders are shown while pending as in the footage, ten avatars arrive",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'remini-avatar-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv">${GLYPH}</div><i class="${P}-dl" style="display: none">${DOWN}</i></div>`;
    const arcSvg = `<svg class="${P}-arc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-dasharray="${(CIRC / 3).toFixed(2)} ${CIRC.toFixed(2)}"/></svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-wt"><div class="${P}-col"><div class="${P}-bar">${BACK}<b>Avatar AI</b></div><div class="${P}-gr">${Array.from({ length: 6 }, () => `<div class="${P}-pt">${GLYPH}</div>`).join('')}</div><div class="${P}-st">${arcSvg}<b>Membuat avatar...</b><span>Siap sekitar</span><strong>12:36 AM</strong></div><div class="${P}-nt">Setelah selesai, Anda akan mendapatkan 50 gambar yang dihasilkan untuk Anda. Jangan ragu untuk menutup aplikasi.</div><div class="${P}-bt ${P}-fill">Beritahu Saya Jika Sudah Selesai</div><div class="${P}-bt ${P}-line">Sembunyikan Layar Ini</div></div></div><div class="${P}-rs" style="visibility: hidden"><div class="${P}-rbar">${CLOSE}<b>Avatar AI</b><em>Simpan semua</em></div><div class="${P}-rb"><div class="${P}-rg">${tiles.map(cell).join('')}</div><div class="${P}-sv">Avatar disimpan selama 7 hari. Ingatlah untuk menyimpannya ke galeri Anda!</div><div class="${P}-more">${REDO}Hasilkan lebih banyak</div><div class="${P}-rt">Tidak mendapatkan hasil yang baik? Unggah foto baru dan mulai dari awal.</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const wt = q(`.${P}-wt`), rs = q(`.${P}-rs`), arcEl = q(`.${P}-arc`), arcC = arcEl.querySelector('circle'), hide = q(`.${P}-line`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-cv`), dl: n.querySelector(`.${P}-dl`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the arc turns and breathes with t alone; it is clamped at the swap so nothing keeps moving once the avatars land
        const tc = Math.min(Math.max(t, ctx.cardIn), ctx.cardIn + SWAP * k);
        const deg = (((tc * 360) / SPIN) % 360 + 360) % 360;
        const len = (0.17 + 0.5 * (0.5 - 0.5 * Math.cos((tc * 2 * Math.PI) / BREATH))) * CIRC;
        put('arc', `${deg.toFixed(0)}|${len.toFixed(1)}`, () => {
          arcEl.style.transform = `rotate(${deg.toFixed(0)}deg)`;
          arcC.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${CIRC.toFixed(2)}`);
        });
        // 'Sembunyikan Layar Ini' is tapped
        const hp = press(s, HIDE_AT, 0.05, 0.06, 0.1);
        put('hide', hp.toFixed(3), () => { hide.style.transform = hp > 0 ? `scale(${(1 - 0.04 * hp).toFixed(4)})` : 'none'; });

        // the hard swap to the result page
        put('swap', s >= SWAP, (v) => { wt.style.visibility = v ? 'hidden' : ''; rs.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cover.style.display = 'none'; c.cover.style.opacity = ''; } else { c.cover.style.display = ''; c.cover.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          put(`d${i}`, f >= 1, (v) => { c.dl.style.display = v ? '' : 'none'; });
        });
      },
    };
  },
};
