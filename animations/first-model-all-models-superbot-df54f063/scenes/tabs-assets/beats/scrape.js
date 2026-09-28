// DeepSeek: the scrape. A tool chip counts the files it pulls, then two source lists land: four textures (a swatch, its
// name, the site it came from) and four ambient sounds (a play glyph, the file, a short waveform drawing in, its length
// and its library). The swatches are close crops of real frames of the ride (gen/clip-poster.jpg, gen/ride/meshy-torii.png)
// standing in for the scraped maps; the site names, sizes and lengths are made up. Pure function of t.
import { seg, lerp, rand } from '../../../lib.js';
import { sayer, rise, setText, gen } from './kit.js';

// [name, site, the frame crop that stands in for the map: gen/ file, background-size, background-position]
const TEX = [
  ['Dirt road', 'Poly Haven', 'clip-poster.jpg', '500%', '44% 100%'],
  ['Torii lacquer', 'ambientCG', 'ride/meshy-torii.png', '700%', '21% 62%'],
  ['Leaf canopy', 'Poly Haven', 'clip-poster.jpg', '500%', '61% 27%'],
  ['Grass field', 'ambientCG', 'clip-poster.jpg', '500%', '100% 64%'],
];
// [file, library, length, waveform character: base level, busyness]
const AUD = [
  ['cicadas.ogg', 'Freesound', '0:24', 0.62, 0.9],
  ['wind_chimes.ogg', 'Freesound', '0:12', 0.35, 0.3],
  ['stream.ogg', 'Sonniss', '0:30', 0.5, 0.55],
  ['bike_freewheel.ogg', 'Freesound', '0:08', 0.42, 0.75],
];
const BARS = 34;
const PLAY = '<svg class="ds-pl" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.8v8.4l6.6-4.2z"/></svg>';
// a short waveform, fixed per sound (seeded), drawn as rounded bars
function wave(i, base, busy) {
  return Array.from({ length: BARS }, (_, j) => {
    const env = Math.sin(Math.PI * (j + 0.5) / BARS) ** 0.45;
    const h = Math.max(0.12, Math.min(1, env * (base + busy * 0.5 * (rand(i * 97 + j) - 0.35) + 0.18 * Math.sin(j * (0.7 + i * 0.31)))));
    return `<i style="height:${(h * 100).toFixed(1)}%"></i>`;
  }).join('');
}

export default {
  times(r, next, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.02, chip: r + 0.08 * p };
    T.tex = TEX.map((_, i) => r + (0.2 + i * 0.06) * p);
    T.aud = AUD.map((_, i) => r + (0.44 + i * 0.08) * p);
    T.done = T.aud[AUD.length - 1] + 0.32 * p;
    T.end = next;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.scrape, 110);
    const chip = x.el('<div class="ds-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping textures and audio</span><b class="ds-count">0 files</b></div></div>');
    const card = x.el(`<div class="ds-card">
  <div class="ds-cap">Textures</div>
  <div class="ds-sws">${TEX.map(([n, s, f, sz, pos]) => `<span class="ds-t"><i class="ds-sw" style="background-image:url('${gen(f)}');background-size:${sz};background-position:${pos}"><em>2K</em></i><b>${x.esc(n)}</b><small>${x.esc(s)}</small></span>`).join('')}</div>
  <div class="ds-cap">Ambient audio</div>
  <div class="ds-aus">${AUD.map(([f, s, len, b, v], i) => `<div class="ds-au"><span class="ds-pb">${PLAY}</span><b>${x.esc(f)}</b><span class="ds-wv">${wave(i, b, v)}</span><em>${len}</em><small>${x.esc(s)}</small></div>`).join('')}</div>
</div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), count = chip.querySelector('.ds-count');
    const caps = [...card.querySelectorAll('.ds-cap')];
    const tex = [...card.querySelectorAll('.ds-t')];
    const aud = [...card.querySelectorAll('.ds-au')].map((n) => ({ n, wv: n.querySelector('.ds-wv') }));
    return {
      nodes: [say.node, chip, card],
      marks: [[T.chip, chip], [T.tex[0], card]],
      render(t) {
        say.render(t, T.say);
        rise(chip, seg(t, T.chip, T.chip + 0.24), 8, 1);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 480) % 360).toFixed(1)}deg)`;
        setText(clab, done ? 'Scraped 6 sources' : 'Scraping textures and audio');
        let n = 0;
        card.style.opacity = t >= T.tex[0] - 0.06 ? '1' : '0';
        rise(caps[0], seg(t, T.tex[0] - 0.04, T.tex[0] + 0.2), 6, 1);
        tex.forEach((s, i) => {
          rise(s, seg(t, T.tex[i], T.tex[i] + 0.24), 10, 0.9);
          if (t >= T.tex[i] + 0.12) n++;
        });
        rise(caps[1], seg(t, T.aud[0] - 0.04, T.aud[0] + 0.2), 6, 1);
        aud.forEach(({ n: row, wv }, i) => {
          rise(row, seg(t, T.aud[i], T.aud[i] + 0.24), 8, 1);
          // the waveform draws in left to right as the file downloads
          const f = seg(t, T.aud[i] + 0.06, T.aud[i] + 0.36);
          wv.style.clipPath = `inset(0 ${(lerp(100, 0, f)).toFixed(2)}% 0 0)`;
          if (f >= 1) n++;
        });
        setText(count, `${n} file${n === 1 ? '' : 's'}`);
      },
    };
  },
};
