// DeepSeek V4 Flash, the decal scrape (../../every-model-one-chat scrape.js): a tool chip sweeps six texture sites,
// each pill lighting in turn and counting its textures while the chip's total climbs, then the block references it
// kept land as a strip. Texture counts are made up; the reference crops are cut from the gameplay clip.
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise, setText, fmt, gen } from './kit.js';

const SITES = [['OpenGameArt', 412], ['Kenney', 238], ['Poly Haven', 186], ['ambientCG', 173], ['itch.io', 151], ['r/PixelArt', 124]];
const TOTAL = SITES.reduce((s, [, n]) => s + n, 0);
export const DECALS = [['grass_top', 'Grass'], ['grass_side', 'Grass side'], ['dirt', 'Dirt'], ['oak_log', 'Oak log'], ['oak_bark', 'Oak bark'], ['oak_leaves', 'Leaves']];

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.chip = r + 0.2 * p;
    T.site = SITES.map((_, i) => r + (0.35 + i * 0.2) * p);
    T.done = T.site[SITES.length - 1] + 0.55 * p;
    T.ref = DECALS.map((_, i) => T.done + (0.1 + i * 0.08) * p);
    T.end = T.ref[DECALS.length - 1] + 0.55 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.scrape, 80);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping for block textures</span><b class="yt-count">0 textures</b></div></div>');
    const sites = x.el(`<div class="sc-subs">${SITES.map(([s]) => `<span class="sc-sub"><img src="${x.brand('image-icon.svg')}" alt=""/>${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const refs = x.el(`<div class="mc-refs">${DECALS.map(([f, n]) => `<span class="mc-ref"><img src="${gen(`ref/${f}.jpg`)}" alt="${x.esc(n)}"/></span>`).join('')}<em class="mc-refl">6 block references kept</em></div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const pills = [...sites.children].map((p) => ({ p, n: p.querySelector('b') }));
    const rs = [...refs.querySelectorAll('.mc-ref')], rl = refs.querySelector('.mc-refl');
    return {
      nodes: [say.node, chip, sites, refs],
      marks: [[T.r, say.node], [T.chip, chip], [T.site[0], sites], [T.ref[0], refs]],
      render(t) {
        say.render(t, T.r + 0.06);
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
        rs.forEach((n, i) => rise(n, seg(t, T.ref[i], T.ref[i] + 0.3), 10, 0.85));
        rise(rl, seg(t, T.ref[DECALS.length - 1] + 0.1, T.ref[DECALS.length - 1] + 0.4), 4, 1);
      },
    };
  },
};
