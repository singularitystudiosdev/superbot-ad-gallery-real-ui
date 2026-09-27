// DeepSeek V4 Flash, the decal scrape (../../every-model-one-chat scrape.js): a tool chip sweeps six texture sites,
// each pill lighting in turn and counting its textures while the chip's total climbs, and the block references it
// kept land as a result grid: twelve square, full-bleed swatches of CC0 photoscanned PBR materials from ambientCG and
// Poly Haven (img/CREDITS.txt), each badged with the site it came from and its size, then the six block references
// the model keeps are ringed and checked while the rest dim. A second chip then searches four sound libraries for
// Minecraft sounds and five hits land as rows, each with a play button, its name and file, and a waveform a playhead
// sweeps as the row lands. The bars are measured from the CC0 clips in ../../../gen/sfx (make-peaks.mjs,
// CREDITS.txt), so they are data, and the whole beat is a pure function of t. Texture and library counts are made up.
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise, setText, fmt, gen } from './kit.js';
import SFX from '../../../gen/sfx/peaks.js?v=2';

const SITES = [['OpenGameArt', 412], ['Kenney', 238], ['Poly Haven', 186], ['ambientCG', 173], ['itch.io', 151], ['r/PixelArt', 124]];
const TOTAL = SITES.reduce((s, [, n]) => s + n, 0);
// the six references decal-gen.js turns into 16x16 blocks: ../../../gen/ref/<file>.jpg
export const DECALS = [['grass_top', 'Grass'], ['grass_side', 'Grass side'], ['dirt', 'Dirt'], ['oak_log', 'Oak log'], ['oak_bark', 'Oak bark'], ['oak_leaves', 'Leaves']];
// the result grid in reading order: [file, name, the site it was found on, the map size taken, kept]. Kept files are
// DECALS'; the six passed over live in gen/ref/extra. Each is a CC0 photoscanned material's colour map from the site
// its badge names (img/CREDITS.txt has the asset ids), at the resolution it was downloaded.
const TILES = [
  ['grass_top', 'Grass', 'ambientCG', '1K', 1], ['grass_side', 'Grass side', 'ambientCG', '1K', 1], ['extra/cobblestone', 'Cobblestone', 'Poly Haven', '1K', 0],
  ['dirt', 'Dirt', 'ambientCG', '1K', 1], ['extra/sand', 'Sand', 'Poly Haven', '1K', 0], ['extra/planks', 'Planks', 'ambientCG', '1K', 0],
  ['oak_log', 'Oak log', 'ambientCG', '2K', 1], ['extra/gravel', 'Gravel', 'ambientCG', '1K', 0], ['oak_bark', 'Oak bark', 'Poly Haven', '1K', 1],
  ['extra/rock', 'Rock', 'ambientCG', '1K', 0], ['oak_leaves', 'Leaves', 'ambientCG', '2K', 1], ['extra/snow', 'Snow', 'ambientCG', '1K', 0],
];
const KEPT = TILES.map((d, i) => (d[4] ? i : -1)).filter((i) => i >= 0);
// a filled check badge: DeepSeek blue disc, white tick
const CHECK = '<svg class="ds-cks" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/><path d="M4.7 8.3l2.2 2.2 4.5-4.7"/></svg>';

// the sound libraries the second chip sweeps, and the five hits it keeps: the clip id in ../../../gen/sfx/peaks.js
// (its file name there too) and the Minecraft sound the row names
const SSITES = [['Freesound', 612], ['Kenney Audio', 190], ['OpenGameArt', 388], ['Sonniss GDC', 402]];
const STOTAL = SSITES.reduce((s, [, n]) => s + n, 0);
const SOUNDS = [['footstep_grass_000', 'Grass footstep'], ['impactMining_000', 'Stone break'], ['chop', 'Wood chop'], ['impactSoft_heavy_000', 'Block place'], ['doorOpen_1', 'Wooden door']];

// UI glyphs drawn in code, like kit.js's TICK: a play triangle and the four-bar sound mark the library pills carry
const PLAY = '<svg class="sx-pg" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.2 2.9c0-.6.7-1 1.2-.7l6.6 4.3c.5.3.5 1 0 1.3l-6.6 4.3c-.5.3-1.2-.1-1.2-.7Z"/></svg>';
const WMARK = '<svg class="sx-wm" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="6" width="2" height="4" rx="1"/><rect x="5" y="3.5" width="2" height="9" rx="1"/><rect x="9" y="2" width="2" height="12" rx="1"/><rect x="13" y="5" width="2" height="6" rx="1"/></svg>';
const clock = (s) => `0:${s.toFixed(2).padStart(5, '0')}`;

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    // textures: the chip, six sites counting, the result grid landing tile by tile, then the six kept ones checked
    T.chip = r + 0.14 * p;
    T.site = SITES.map((_, i) => r + (0.24 + i * 0.11) * p);
    T.done = T.site[SITES.length - 1] + 0.26 * p;
    T.ref = TILES.map((_, i) => T.done + (0.02 + i * 0.022) * p);
    const lastRef = T.ref[TILES.length - 1];
    T.pick = KEPT.map((_, j) => lastRef + (0.05 + j * 0.035) * p);
    T.kept = T.pick[KEPT.length - 1] + 0.04 * p;
    // sounds: its own chip and four libraries, then five hits, each swept by its playhead as it lands. The chip
    // rises while the last picks land, so the grid costs no extra time.
    T.schip = lastRef + 0.2 * p;
    T.ssite = SSITES.map((_, i) => T.schip + (0.13 + i * 0.1) * p);
    T.sdone = T.ssite[SSITES.length - 1] + 0.3 * p;
    T.row = SOUNDS.map((_, i) => T.ssite[SSITES.length - 1] - 0.12 * p + i * 0.08 * p);
    T.sweep = SOUNDS.map((_, i) => [T.row[i] + 0.1 * p, T.row[i] + 0.52 * p]);
    T.end = T.sweep[SOUNDS.length - 1][1] + 0.2 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.scrape, 80);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping for block textures</span><b class="yt-count">0 textures</b></div></div>');
    const sites = x.el(`<div class="sc-subs">${SITES.map(([s]) => `<span class="sc-sub"><img src="${x.brand('image-icon.svg')}" alt=""/>${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const refs = x.el(`<div class="mc-refs ds-grid"><div class="ds-tiles">${TILES.map(([f, n, src, res, k]) => `<span class="mc-ref ds-t${k ? ' ds-k' : ''}"><img src="${gen(`ref/${f}.jpg`)}" alt="${x.esc(n)}"/><span class="ds-res">${res}</span><span class="ds-src">${x.esc(src)}</span>${k ? `<span class="ds-ring"></span><span class="ds-ck">${CHECK}</span>` : ''}</span>`).join('')}</div><div class="ds-foot"><span class="ds-kept">${CHECK}${KEPT.length} block references kept</span><span class="ds-meta">top ${TILES.length} of ${fmt(TOTAL)} · all CC0</span></div></div>`);
    const schip = x.el('<div class="dd-chiprow sx-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Searching for Minecraft sounds</span><b class="yt-count">0 sounds</b></div></div>');
    const ssubs = x.el(`<div class="sc-subs sx-subs">${SSITES.map(([s]) => `<span class="sc-sub sx-sub">${WMARK}${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const rows = x.el(`<div class="sx-rows">${SOUNDS.map(([f, n]) => {
      const d = SFX[f];
      return `<div class="sx-row"><span class="sx-play">${PLAY}</span><span class="sx-name"><b>${x.esc(n)}</b><small>${x.esc(d.file)} · Kenney · CC0</small></span><span class="sx-wave">${d.peaks.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}<b class="sx-head"></b></span><span class="sx-dur">${clock(d.dur)}</span></div>`;
    }).join('')}</div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const pills = [...sites.children].map((p) => ({ p, n: p.querySelector('b') }));
    const rs = [...refs.querySelectorAll('.ds-t')].map((n) => ({ n, ring: n.querySelector('.ds-ring'), ck: n.querySelector('.ds-ck') }));
    const rl = refs.querySelector('.ds-foot');
    const sspin = schip.querySelector('.spin'), sclab = schip.querySelector('.ch-tool-t'), sccount = schip.querySelector('.yt-count');
    const sp = [...ssubs.children].map((p) => ({ p, n: p.querySelector('b') }));
    const sr = [...rows.children].map((r, i) => ({ r, bars: [...r.querySelectorAll('.sx-wave i')], head: r.querySelector('.sx-head'), dur: r.querySelector('.sx-dur'), len: SFX[SOUNDS[i][0]].dur, lit: -1 }));
    return {
      nodes: [say.node, chip, sites, refs, schip, ssubs, rows],
      marks: [[T.r, say.node], [T.chip, chip], [T.site[0], sites], [T.ref[0], refs], [T.schip, schip], [T.ssite[0], ssubs], ...T.row.map((a, i) => [a, sr[i].r])],
      render(t) {
        say.render(t, T.r + 0.06);
        // textures
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8, 1);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        setText(clab, done ? 'Scraped for block textures' : 'Scraping for block textures');
        let sum = 0;
        sites.style.opacity = t >= T.site[0] - 0.05 ? '1' : '0';
        pills.forEach(({ p, n }, i) => {
          const a = T.site[i];
          rise(p, seg(t, a, a + 0.28), 6, 1);
          const c = SITES[i][1] * outCubic(seg(t, a + 0.05, a + 0.5));
          sum += c;
          setText(n, fmt(c));
          p.classList.toggle('on', t >= a + 0.5);
        });
        setText(ccount, `${fmt(done ? TOTAL : sum)} textures`);
        refs.style.opacity = t >= T.ref[0] - 0.05 ? '1' : '0';
        // the grid lands tile by tile; each kept tile then takes its ring and check while the others dim
        const dim = outCubic(seg(t, T.pick[0], T.kept + 0.12));
        rs.forEach(({ n, ring, ck }, i) => {
          rise(n, seg(t, T.ref[i], T.ref[i] + 0.24), 8, 0.9);
          const j = KEPT.indexOf(i);
          if (j < 0) { n.style.setProperty('--d', dim.toFixed(3)); return; }
          const e = outCubic(seg(t, T.pick[j], T.pick[j] + 0.16));
          ring.style.opacity = e.toFixed(3);
          ck.style.opacity = e.toFixed(3);
          ck.style.transform = e >= 1 ? 'none' : `scale(${(0.5 + 0.5 * e).toFixed(3)})`;
        });
        rise(rl, seg(t, T.kept, T.kept + 0.22), 4, 1);
        // sounds: the second chip, its libraries counting, then the five hits with a playhead sweeping each waveform
        rise(schip, seg(t, T.schip, T.schip + 0.3), 8, 1);
        const sdone = t >= T.sdone;
        sspin.classList.toggle('done', sdone);
        sspin.style.transform = sdone ? '' : `rotate(${(((t - T.schip) * 420) % 360).toFixed(1)}deg)`;
        setText(sclab, sdone ? 'Searched 4 libraries for Minecraft sounds' : 'Searching for Minecraft sounds');
        let ssum = 0;
        ssubs.style.opacity = t >= T.ssite[0] - 0.05 ? '1' : '0';
        sp.forEach(({ p, n }, i) => {
          const a = T.ssite[i];
          rise(p, seg(t, a, a + 0.28), 6, 1);
          const c = SSITES[i][1] * outCubic(seg(t, a + 0.05, a + 0.45));
          ssum += c;
          setText(n, fmt(c));
          p.classList.toggle('on', t >= a + 0.45);
        });
        setText(sccount, `${fmt(sdone ? STOTAL : ssum)} sounds`);
        rows.style.opacity = t >= T.row[0] - 0.05 ? '1' : '0';
        sr.forEach((o, i) => {
          rise(o.r, seg(t, T.row[i], T.row[i] + 0.26), 10, 0.96);
          const [w0, w1] = T.sweep[i];
          const p = seg(t, w0, w1), n = Math.round(p * o.bars.length);
          const playing = t >= w0 && t < w1;
          o.r.classList.toggle('playing', playing);
          o.head.style.left = `${(p * 100).toFixed(2)}%`;
          o.head.style.opacity = (t < w0 ? 0 : t <= w1 ? 1 : 1 - seg(t, w1, w1 + 0.16)).toFixed(3);
          setText(o.dur, clock(playing ? p * o.len : o.len));
          if (n !== o.lit) { o.bars.forEach((b, j) => b.classList.toggle('on', j < n)); o.lit = n; }
        });
      },
    };
  },
};
