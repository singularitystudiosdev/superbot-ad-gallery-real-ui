// Photoroom's mobile app, light theme, the 2025 build (official channel video 'How to use Photoroom in 2025', 2025-07-21, t~150.6-153.2 s
// and t~220.4-222.4 s; spec .tmp/clone-9e82faf1/reveal-refs/photoroom/spec.json, confidence 0.62; frames w_mobile_scanning_t150.6,
// w_mobile_removing_bg_t152.4, w_mobile_aibg_panel_t160.0, w_mobile_aibg_blank_tiles_t220.4, w_mobile_aibg_filled_t222.4). The wait is
// three screens, none of which has a number: (1) a full-bleed 'Scanning' screen, the uploaded photo with a purple reading line sweeping
// it, a grey spinner and the word 'Scanning', a lilac 'Skip background removal' pill above the home indicator and 'Cancel' top-left;
// (2) 'Removing background', the cut-out subject alone on white, a hairline purple bar, the same spinner and the same pill; (3) the
// 'AI Backgrounds' panel, whose result tiles start as near-white rounded tiles holding only a faint ghost of the product and fill with the
// generated scene one by one, under a 'Generate more' row, a strip of background thumbnails and 'Customize this background'.
// Adapted to ten images: the panel's result grid is ten tiles filling in strict reading order. The footage shows a 2 x 2 grid in a
// phone column; a column that narrow would show only four of the ten, so the screen is drawn full-bleed at 560 px with the grid five
// wide and two high (the same 3:4 tiles, the same 8 px gap). Omitted: the status bar, the camera-roll upload before the scan, the style
// tags on the filled tiles and the preset strip's real photographs (our own colour swatches stand in), and nothing here carries the
// product's logo, wordmark or typeface (system type, our own meme for the uploaded photo).
import { seg, lerp, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-phr';
const ROOT_H = 500, PH_W = 336, PH_H = 330, COLS = 5, GAP = 8;
const PUR = '#5a31f4', LILAC = '#eeeafb', MIST = '#f6f4fb', GREY = '#8e8e93';
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fff; color: #1c1c1e; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e8e6ef; }
.${P}-scr, .${P}-pan { position: absolute; inset: 0; background: #fff; }
.${P}-cx { position: absolute; left: 20px; top: 15px; font-size: 13px; font-weight: 500; color: ${PUR}; }
.${P}-ph { position: absolute; left: ${(560 - PH_W) / 2}px; top: 46px; width: ${PH_W}px; height: ${PH_H}px; }
.${P}-ph img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.${P}-sk { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #c9c9ce; }
.${P}-ln { position: absolute; left: -6px; right: -6px; top: 0; height: 2px; background: ${PUR}; box-shadow: 0 0 6px rgba(90, 49, 244, .35); }
.${P}-bar { position: absolute; left: ${(560 - PH_W) / 2}px; top: 396px; width: ${PH_W}px; height: 1px; background: #ece9f8; }
.${P}-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: ${PUR}; transform-origin: 0 50%; }
.${P}-st { position: absolute; left: 0; right: 0; top: 410px; display: flex; align-items: center; justify-content: center; gap: 8px; height: 22px; font-size: 13px; color: #6e6e73; }
.${P}-sp { display: block; width: 12px; height: 12px; box-sizing: border-box; border-radius: 50%; border: 1.6px solid #d6d6db; border-top-color: ${GREY}; }
.${P}-skip { position: absolute; left: 112px; right: 112px; top: 448px; display: grid; place-items: center; height: 38px; border-radius: 10px; background: ${LILAC}; font-size: 13px; font-weight: 500; color: #3d2bb8; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 0; height: 44px; }
.${P}-bk { position: absolute; left: 18px; top: 14px; font-size: 14px; color: ${PUR}; }
.${P}-ttl { position: absolute; left: 0; right: 0; top: 13px; display: flex; justify-content: center; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; }
.${P}-ttl span { padding: 1px 6px; border-radius: 8px; background: ${MIST}; font-size: 11px; font-weight: 500; color: ${PUR}; }
.${P}-g { position: absolute; left: 16px; right: 16px; top: 54px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 10px; overflow: hidden; background: ${MIST}; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: ${MIST}; }
.${P}-cv i { position: absolute; left: 50%; top: 52%; width: 26%; height: 46%; margin: -23% 0 0 -13%; border-radius: 6px 6px 3px 3px; background: #efecf7; }
.${P}-mo { position: absolute; right: 5px; top: 5px; display: grid; place-items: center; width: 20px; height: 14px; border-radius: 7px; background: rgba(255, 255, 255, .86); font-size: 11px; line-height: 14px; font-weight: 700; letter-spacing: 1px; color: #3a3a3c; }
.${P}-gm { position: absolute; left: 16px; right: 16px; top: 342px; display: grid; place-items: center; height: 34px; border-radius: 10px; background: ${MIST}; font-size: 13px; font-weight: 500; color: #3d2bb8; }
.${P}-pre { position: absolute; left: 16px; right: 16px; top: 390px; display: flex; gap: 8px; }
.${P}-pre i { display: block; flex: 1; height: 56px; border-radius: 8px; }
.${P}-cu { position: absolute; left: 16px; right: 16px; top: 452px; display: flex; align-items: center; justify-content: center; gap: 6px; height: 34px; border-radius: 10px; background: #f4f4f6; font-size: 13px; font-weight: 500; color: #1c1c1e; }
.${P}-cu svg { width: 13px; height: 13px; fill: none; stroke: #1c1c1e; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SCAN_END = 0.34;                             // 'Scanning' gives way to 'Removing background'
const CUT = 0.06;                                  // the photo's background drops away over this long
const REMOVE_END = 0.72;                           // the panel takes over
const SWAP = 0.08;                                 // ...over this long
const LAND = Array.from({ length: 10 }, (_, i) => 0.9 + i * 0.0867);   // tile i fills with its scene (reading order), the last at 1.68
const FADE = 0.07;                                 // a tile fills in over this long
const SWATCH = ['#f2c98f,#f3a6a1', '#9fd8e8,#3aa6c9', '#7bc48a,#2f7f55', '#f0d9b5,#c58f5c', '#b6c4f2,#6a78d8', '#f4b8d0,#d4668e'];
const PRE = SWATCH.map((c) => `<i style="background: linear-gradient(160deg, ${c.split(',')[0]}, ${c.split(',')[1]})"></i>`).join('');
const SPECKS = Array.from({ length: 14 }, (_, i) => ({ x: 20 + hash(5, i) * 60, y: 12 + hash(6, i) * 78, ph: hash(7, i) }));

export default {
  id: 'photoroom',
  label: 'Photoroom AI Backgrounds (2025)',
  source: {
    platform: "Photoroom's mobile app (iOS, light theme, the 2025 build; official Photoroom channel screen recording 'How to use Photoroom in 2025', 2025-07-21)",
    feature: "a full-bleed 'Scanning' screen (a purple reading line sweeping the photo, a grey spinner, a lilac 'Skip background removal' pill) then 'Removing background' (the cut-out on white, a hairline purple bar, the same pill), then the 'AI Backgrounds' panel whose result tiles start as near-white tiles holding a faint ghost of the product and fill with the generated scene one at a time (adapted to 10: a five-wide, two-high grid of 3:4 tiles filling in reading order; the footage's 2 x 2 phone grid, the style tags and the real preset photographs are not reproduced)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=pQLb6oqPERk', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=VcNWFaPX5RM', retrieved: '2026-10-14' },
    ],
    extrapolated: 'The footage shows four result tiles (a 2 x 2 grid in the phone column) filling with the scene over ~1.5 s; the ten here are the same tile and the same fill, five wide and two high, one after another in reading order. The generation itself shows no spinner in the footage (the blank tiles are its only pending state), so there is none here either. The cut-out is an oval crop of our own picture, standing in for the segmented subject.',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'photoroom');
    const srcScan = ownSrc(ctx.src, 'photoroom-scan');   // the uploaded photo at 336 x 330, a different decode size from the 99 x 132 tiles
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"><i></i></div><span class="${P}-mo">···</span></div>`;
    const specks = SPECKS.map((p) => `<i class="${P}-sk" style="left: ${p.x.toFixed(1)}%; top: ${p.y.toFixed(1)}%; opacity: 0"></i>`).join('');
    const pencil = '<svg viewBox="0 0 16 16"><path d="M2.5 13.5l.8-3.2 7.4-7.4a1.4 1.4 0 012 2l-7.4 7.4-2.8 1.2z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-scr"><div class="${P}-cx">Cancel</div><div class="${P}-ph"><img src="${srcScan}" width="870" height="1024" decoding="sync" alt="Uploaded photo"/>${specks}<div class="${P}-ln"></div></div><div class="${P}-bar" style="visibility: hidden"><i></i></div><div class="${P}-st"><i class="${P}-sp"></i><b style="font-weight: 400">Scanning</b></div><div class="${P}-skip">Skip background removal</div></div><div class="${P}-pan" style="visibility: hidden; opacity: 0"><div class="${P}-hd"><div class="${P}-bk">‹ Back</div><div class="${P}-ttl">AI Backgrounds<span>v3</span></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-gm">Generate more</div><div class="${P}-pre">${PRE}</div><div class="${P}-cu">${pencil}Customize this background</div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const scr = q('scr'), pan = q('pan'), photo = q('ph').querySelector('img'), line = q('ln'), bar = q('bar'), barFill = bar.querySelector('i');
    const spin = q('sp'), label = q('st').querySelector('b');
    const sks = [...root.querySelectorAll(`.${P}-sk`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), mo: n.querySelector(`.${P}-mo`), g: tiles[i] }));
    ctx.gate([photo, ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Scanning': the reading line goes down the photo and back; 'Removing background': the subject alone on white, the bar fills
        const removing = s >= SCAN_END;
        put('lab', removing, (v) => { label.textContent = v ? 'Removing background' : 'Scanning'; });
        put('bar', removing, (v) => { bar.style.visibility = v ? '' : 'hidden'; });
        const p = clamp(s / SCAN_END);
        const ly = p < 0.5 ? p * 2 : 2 - p * 2;
        put('ln', (removing ? -1 : ly).toFixed(3), () => { line.style.visibility = removing ? 'hidden' : ''; line.style.top = `${(ly * (PH_H - 2)).toFixed(1)}px`; });
        const cut = seg(s, SCAN_END, SCAN_END + CUT);
        // the cut-out: an oval of the picture, the rest of the field gone to white (radius in % of the box, 150 = the whole photo)
        put('cut', cut.toFixed(3), () => {
          const rx = lerp(150, 36, cut), ry = lerp(150, 44, cut);
          const m = `radial-gradient(ellipse ${rx.toFixed(1)}% ${ry.toFixed(1)}% at 50% 47%, #000 ${cut >= 1 ? 92 : 98}%, transparent 100%)`;
          photo.style.webkitMaskImage = m; photo.style.maskImage = m;
        });
        put('bf', clamp((s - SCAN_END) / (REMOVE_END - SCAN_END)).toFixed(3), (v) => { barFill.style.transform = `scaleX(${v})`; });
        sks.forEach((e, i) => {
          const o = removing ? 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 7 + SPECKS[i].ph * 6.283)) : 0;
          put(`k${i}`, o.toFixed(2), (v) => { e.style.opacity = v; });
        });
        const deg = Math.floor((t * 540) % 360);
        put('spin', deg, (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // the AI Backgrounds panel takes the screen
        const sw = seg(s, REMOVE_END, REMOVE_END + SWAP);
        put('sw', sw.toFixed(3), () => {
          scr.style.visibility = sw >= 1 ? 'hidden' : '';
          scr.style.opacity = sw > 0 ? (1 - sw).toFixed(3) : '';
          pan.style.visibility = sw > 0 ? '' : 'hidden';
          pan.style.opacity = sw > 0 ? sw.toFixed(3) : '0';
        });

        // the result tiles fill with the scene, one by one
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.opacity = ''; } else { c.cv.style.display = ''; c.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
