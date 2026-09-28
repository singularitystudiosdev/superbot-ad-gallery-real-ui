// DeepSeek beat: "Scraping references, textures and ambience." over a card that shows the ACTUAL files scraped for
// the Japanese biking demo: a grid of asset-library swatches (real Japanese textures, patterns and a game sprite, each a
// square swatch beside its specs: kind tag, resolution, tiling; skeleton shimmer, then the swatch pops in, then a
// download check) and audio cards with real waveforms (peaks baked by ffmpeg into ../scraped/manifest.js) drawing left to right.
// It closes on a footer that counts exactly what is shown: "Scraped N files from M sources".
// Pure function of t (scene-local time): no timers, no transitions; seeded values only.
import { seg, outCubic, outBack, clamp } from '../../../lib.js';
import { IMAGES, AUDIO } from '../scraped/manifest.js?v=fm4';

const SAY = 'Scraping references, textures and ambience.';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.2v9.6a.8.8 0 0 0 1.2.7l7.6-4.8a.8.8 0 0 0 0-1.4L10.2 6.5A.8.8 0 0 0 9 7.2z" fill="currentColor"/></svg>';
const TAGC = { PBR: 'pbr', pattern: 'pat', sprite: 'spr' }; // tag chip colour per asset kind
const STAG = 0.033;                         // tile-to-tile stagger
const FILES = [...IMAGES.map((f) => ({ ...f, kind: 'im' })), ...AUDIO.map((f) => ({ ...f, kind: 'au' }))];
const N = FILES.length;
const SOURCES = [...new Set(FILES.map((f) => f.domain))];
const M = SOURCES.length;
const LIC = [...new Set(FILES.map((f) => f.lic))].join(', ');

const img = (f) => new URL('../scraped/' + f.file, import.meta.url).href;
const dur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
// the waveform: one rounded bar per baked peak, centred on the midline (viewBox units)
function wave(peaks) {
  const w = 2, h = 20;
  const bars = peaks.map((p, i) => {
    const bh = Math.max(1.4, p * (h - 2));
    return `<rect x="${(i * w + 0.3).toFixed(1)}" y="${((h - bh) / 2).toFixed(2)}" width="1.3" height="${bh.toFixed(2)}" rx=".65"/>`;
  }).join('');
  return `<svg class="sx-wv" viewBox="0 0 ${peaks.length * w} ${h}" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.08, tile: FILES.map((_, i) => r + 0.12 + i * STAG) };
    T.landed = T.tile[N - 1] + 0.13;          // the last tile's check has landed
    T.foot = T.tile[N - 1] + 0.03;            // the count line (its count-up ends at T.foot + 0.12, about r + 0.63)
    T.end = r + 0.9;                          // the beat window (chat.js chains the next chip from T.end)
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.sayEl(SAY);
    const tiles = FILES.map((f) => f.kind === 'im'
      ? `<div class="sx-t sx-im"><div class="sx-th"><div class="sx-sw"><i class="sx-sk"></i><img src="${img(f)}" alt="" decoding="sync"/><span class="sx-ck">${x.OK}</span></div>
          <div class="sx-sp"><b class="sx-tg ${TAGC[f.tag] || ''}">${x.esc(f.tag)}</b><span class="sx-rs">${x.esc(f.meta[0])}</span><span class="sx-ml">${x.esc(f.meta[1])}</span></div></div>
          <div class="sx-n">${x.esc(f.file)}</div><div class="sx-d">${x.esc(f.domain)}</div></div>`
      : `<div class="sx-t sx-au"><span class="sx-pl">${PLAY}</span><div class="sx-mid"><div class="sx-n">${x.esc(f.file)}</div>${wave(f.peaks)}</div>
          <div class="sx-rt"><span class="sx-du">${dur(f.dur)}${x.OK}</span><span class="sx-d">${x.esc(f.domain)}</span></div></div>`);
    const card = x.el(`<div class="sx-card">
      <div class="sx-hd"><img class="sx-logo" src="${x.brand('deepseek-logo.svg')}" alt=""/><span class="sx-lb">Scraping</span>
        <span class="sx-bar"><i></i></span><span class="sx-ct">0/${N}</span></div>
      <div class="sx-gi">${tiles.slice(0, IMAGES.length).join('')}</div>
      <div class="sx-ga">${tiles.slice(IMAGES.length).join('')}</div>
      <div class="sx-foot"><span class="sx-dot"></span><span>Scraped <b class="sx-c">0</b> files from <b class="sx-s">0</b> sources</span><span class="sx-lic">${x.esc(LIC)}</span></div></div>`);
    const ts = [...card.querySelectorAll('.sx-t')].map((n, i) => ({
      n, kind: FILES[i].kind,
      im: n.querySelector('.sx-th img'), sk: n.querySelector('.sx-sk'), sp: n.querySelector('.sx-sp'), wv: n.querySelector('.sx-wv'),
      ck: n.querySelector('.sx-ck') || n.querySelector('.sx-du .qc-ok'), last: '',
    }));
    const lb = card.querySelector('.sx-lb'), bar = card.querySelector('.sx-bar i'), ct = card.querySelector('.sx-ct');
    const hd = card.querySelector('.sx-hd');
    const foot = card.querySelector('.sx-foot'), cN = card.querySelector('.sx-c'), sN = card.querySelector('.sx-s');
    const ready = Promise.all(ts.filter((o) => o.im).map((o) => (o.im.decode ? o.im.decode() : Promise.resolve()).catch(() => {}))).then(() => {});
    let lastHd = '', lastFoot = '';
    return {
      nodes: [say.n, card],
      marks: [[T.card, card]],
      ready,
      render(t) {
        say.render(t, T.say, 110);
        x.rise(card, t, T.card, 0.24, 8);
        let done = 0;
        ts.forEach((o, i) => {
          const a = T.tile[i];
          const pop = seg(t, a + 0.04, a + 0.12), ck = seg(t, a + 0.07, a + 0.13);
          if (ck >= 0.5) done++;
          // one string per tile state, so the DOM is only written when something moved
          const key = `${(t < a ? 0 : Math.min(1, (t - a) / 0.16)).toFixed(3)}|${pop.toFixed(3)}|${ck.toFixed(3)}|${pop < 1 ? ((t * 2.2) % 1).toFixed(3) : ''}`;
          if (key === o.last) return;
          o.last = key;
          x.rise(o.n, t, a, 0.16, 6);
          if (o.kind === 'im') {
            const p = outCubic(pop);
            o.im.style.opacity = p.toFixed(3);
            o.im.style.transform = p >= 1 ? 'none' : `scale(${(1.08 - 0.08 * p).toFixed(4)})`;
            o.sk.style.opacity = (1 - p).toFixed(3);
            o.sp.style.opacity = p.toFixed(3);
            o.sk.style.backgroundPosition = `${(160 - ((t - a) * 2.2 % 1) * 320).toFixed(1)}% 0`;
          } else {
            o.wv.style.clipPath = pop >= 1 ? 'none' : `inset(0 ${(100 - 100 * outCubic(pop)).toFixed(2)}% 0 0)`;
          }
          const c = outBack(ck);
          o.ck.style.opacity = ck > 0 ? clamp(ck * 3).toFixed(3) : '0';
          o.ck.style.transform = ck >= 1 ? 'none' : `scale(${(0.4 + 0.6 * c).toFixed(4)})`;
        });
        // header: live label, progress bar and counter
        const h = `${done}`;
        if (h !== lastHd) {
          ct.textContent = `${done}/${N}`;
          lb.textContent = done >= N ? 'Scraped' : 'Scraping';
          hd.classList.toggle('on', done >= N);
          lastHd = h;
        }
        const bp = clamp(seg(t, T.tile[0], T.landed));
        bar.style.transform = `scaleX(${bp.toFixed(4)})`;
        // footer: the count line, true for what is shown
        x.rise(foot, t, T.foot, 0.16, 5);
        const p = outCubic(seg(t, T.foot, T.foot + 0.12));
        const s = `${Math.round(N * p)}|${Math.round(M * p)}`;
        if (s !== lastFoot) { const [a, b] = s.split('|'); cN.textContent = a; sN.textContent = b; lastFoot = s; }
        foot.classList.toggle('on', p >= 1);
      },
    };
  },
};
