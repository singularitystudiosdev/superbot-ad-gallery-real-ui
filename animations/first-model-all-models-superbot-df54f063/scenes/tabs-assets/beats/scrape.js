// DeepSeek: the scrape. One crawler card: a header with a live total ("Scraping 37 assets" counting up to "Scraped 148
// assets") and how many sources are in, then the five CC0 libraries it crawls, each ticking from queued to fetching
// (spinner, progress bar, its own count climbing) to done (check), then what landed in assets/: a sky HDRI and four
// texture swatches, then three sound files as chips, each tagged by type. The swatches are close crops of real frames of
// the ride (gen/clip-poster.jpg, gen/ride/meshy-torii.png) standing in for the scraped maps; the per-site counts and the
// file names are made up (they sum to 148). Pure function of t: every slot comes from times(), render() reads the clock
// and nothing else.
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise, setText, gen } from './kit.js';

// [domain, what it gave, how many]; the counts sum to the total the header lands on
const SRC = [
  ['polyhaven.com', 'HDRIs', 22],
  ['ambientcg.com', 'textures', 46],
  ['freesound.org', 'sounds', 38],
  ['opengameart.org', 'textures', 24],
  ['kenney.nl', 'sounds', 18],
];
const TOTAL = SRC.reduce((a, s) => a + s[2], 0); // 148

// what lands in assets/, in landing order: [name, type, source row, the frame crop: gen/ file, background-size, -position]
const IMG = [
  ['sky_dusk.hdr', 'HDRI', 0, 'clip-poster.jpg', '290%', '97% 0%'],
  ['dirt_road', 'texture', 0, 'clip-poster.jpg', '400%', '20% 100%'],
  ['torii_red', 'texture', 1, 'ride/meshy-torii.png', '760%', '21% 62%'],
  ['leaf_moss', 'texture', 1, 'clip-poster.jpg', '560%', '61% 27%'],
  ['grass', 'texture', 3, 'clip-poster.jpg', '560%', '100% 64%'],
];
// [file, source row]
const SND = [
  ['cicadas.ogg', 2],
  ['stream.ogg', 2],
  ['chimes.ogg', 4],
];
const TAG = { HDRI: 'ds-g-hdri', texture: 'ds-g-tex', audio: 'ds-g-aud' };
const tag = (k) => `<em class="ds-tg ${TAG[k]}">${k}</em>`;
const FOLDER = '<svg class="ds-fo" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.75 2.5h4.1c.4 0 .78.18 1.03.5l.84 1.05c.1.12.24.2.4.2h6.13c.69 0 1.25.56 1.25 1.25v7.75c0 .69-.56 1.25-1.25 1.25H1.75C1.06 14.5.5 13.94.5 13.25V3.75c0-.69.56-1.25 1.25-1.25Z"/></svg>';

export default {
  times(r, next, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.02, card: r + 0.06 * p, fetch: 0.3 * p };
    // the sources start one after another and each takes `fetch` to come in
    T.src = SRC.map((_, i) => r + (0.12 + i * 0.07) * p);
    // assets land one after another, each after the source it came from has started
    T.ast = [...IMG, ...SND].map((_, j) => r + (0.22 + j * 0.06) * p);
    T.done = T.src[SRC.length - 1] + T.fetch + 0.02 * p;
    T.end = next;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.scrape, 120);
    const card = x.el(`<div class="ds-card">
  <div class="ds-hd"><span class="spin"></span><span class="ds-hl"><span class="ds-verb">Scraping</span> <b class="ds-n">0</b> assets</span><small class="ds-of">0 of ${SRC.length} sources</small></div>
  <div class="ds-rows">${SRC.map(([d, what]) => `<div class="ds-row"><span class="spin ds-wait"></span><b>${x.esc(d)}</b><span class="ds-bar"><i></i></span><em>0</em><small>${x.esc(what)}</small></div>`).join('')}</div>
  <div class="ds-dir">${FOLDER}<b>assets/</b></div>
  <div class="ds-grid">${IMG.map(([n, ty, , f, sz, pos]) => `<span class="ds-a${ty === 'HDRI' ? ' ds-wide' : ''}"><i class="ds-im" style="background-image:url('${gen(f)}');background-size:${sz};background-position:${pos}">${tag(ty)}</i><b>${x.esc(n)}</b></span>`).join('')}</div>
  <div class="ds-snd">${SND.map(([n]) => `<span class="ds-s">${tag('audio')}<b>${x.esc(n)}</b></span>`).join('')}</div>
</div>`);
    const hspin = card.querySelector('.ds-hd .spin'), verb = card.querySelector('.ds-verb'), total = card.querySelector('.ds-n'), of = card.querySelector('.ds-of');
    const rows = [...card.querySelectorAll('.ds-row')].map((n) => ({ n, spin: n.querySelector('.spin'), bar: n.querySelector('.ds-bar i'), c: n.querySelector('em') }));
    const dir = card.querySelector('.ds-dir');
    const assets = [...card.querySelectorAll('.ds-a, .ds-s')];
    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, seg(t, T.card, T.card + 0.24), 10, 0.985);
        const done = t >= T.done;
        const spinAt = (n, t0, on) => { n.style.transform = on ? `rotate(${(((t - t0) * 480) % 360).toFixed(1)}deg)` : ''; };
        hspin.classList.toggle('done', done);
        spinAt(hspin, T.card, !done);
        // the sources tick through: queued (dim ring), fetching (spinner, bar, count climbing), done (check)
        let sum = 0, started = 0;
        rows.forEach((w, i) => {
          const a = T.src[i], f = seg(t, a, a + T.fetch);
          const on = t >= a, ok = f >= 1;
          if (on) started++;
          w.n.style.opacity = (0.4 + 0.6 * seg(t, a - 0.02, a + 0.06)).toFixed(3);
          w.spin.classList.toggle('ds-wait', !on);
          w.spin.classList.toggle('done', ok);
          spinAt(w.spin, a, on && !ok);
          w.bar.style.transform = `scaleX(${outCubic(f).toFixed(4)})`;
          const n = ok ? SRC[i][2] : Math.floor(SRC[i][2] * outCubic(f));
          setText(w.c, String(n));
          w.c.classList.toggle('ds-z', n === 0);
          sum += n;
        });
        setText(verb, done ? 'Scraped' : 'Scraping');
        setText(total, String(done ? TOTAL : sum));
        setText(of, done ? `${SRC.length} sources` : `${Math.max(1, started)} of ${SRC.length} sources`);
        // what landed in assets/
        rise(dir, seg(t, T.ast[0] - 0.06, T.ast[0] + 0.16), 6, 1);
        assets.forEach((n, j) => rise(n, seg(t, T.ast[j], T.ast[j] + 0.22), 10, 0.92));
      },
    };
  },
};
