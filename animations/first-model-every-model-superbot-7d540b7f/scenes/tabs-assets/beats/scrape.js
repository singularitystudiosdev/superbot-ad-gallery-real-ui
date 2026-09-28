// DeepSeek beat: "Scraping assets and audio." over a card whose rows stream in (kind glyph, file, source, size,
// check), closing on a counter line "Scraped 26 files from 9 sources". Pure function of t (scene-local time).
import { seg, outCubic, clamp } from '../../../lib.js';

const SAY = 'Scraping assets and audio.';
const WAVE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const PIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 17l5-5 3.5 3.5 2.5-2.5 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="9.5" r="1.6" fill="currentColor"/></svg>';
const ROWS = [
  ['au', 'koto-lofi-loop.mp3', 'freesound.org', '3.1 MB'],
  ['au', 'cicadas-dusk.wav', 'bbcsfx.co.uk', '5.8 MB'],
  ['au', 'bike-freewheel.wav', 'freesound.org', '1.2 MB'],
  ['au', 'wind-chime.wav', 'sonniss.com', '0.9 MB'],
  ['im', 'washi-texture.jpg', 'unsplash.com', '2.4 MB'],
  ['im', 'golden-hour-sky.hdr', 'polyhaven.com', '8.6 MB'],
];
const STAG = 0.06;

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.08, row: ROWS.map((_, i) => r + 0.12 + i * STAG) };
    T.foot = T.row[T.row.length - 1] + 0.1;
    T.end = T.foot + 0.2;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.sayEl(SAY);
    const card = x.el(`<div class="sx-card"><div class="sx-rows">${ROWS.map(([kind, n, src, size]) => `
      <div class="sx-row sx-${kind}"><span class="sx-k">${kind === 'au' ? WAVE : PIC}</span><span class="sx-n">${x.esc(n)}</span>
        <span class="sx-src">${x.esc(src)}</span><span class="sx-sz">${size}</span>${x.OK}</div>`).join('')}</div>
      <div class="sx-foot"><span class="sx-dot"></span><span>Scraped <b class="sx-c">0</b> files from <b class="sx-s">0</b> sources</span></div></div>`);
    const rows = [...card.querySelectorAll('.sx-row')].map((r) => ({ r, ok: r.querySelector('.qc-ok') }));
    const foot = card.querySelector('.sx-foot'), cN = card.querySelector('.sx-c'), sN = card.querySelector('.sx-s');
    let last = '';
    return {
      nodes: [say.n, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say, 110);
        x.rise(card, t, T.card, 0.24, 8);
        rows.forEach((o, i) => {
          x.rise(o.r, t, T.row[i], 0.2, 7);
          const d = seg(t, T.row[i] + 0.1, T.row[i] + 0.26);
          o.ok.style.opacity = d > 0 ? '1' : '0';
          o.ok.style.transform = `scale(${(0.5 + 0.5 * outCubic(d)).toFixed(4)})`;
        });
        x.rise(foot, t, T.foot, 0.2, 5);
        const p = outCubic(seg(t, T.foot, T.foot + 0.2));
        const s = `${Math.round(26 * p)}|${Math.round(9 * p)}`;
        if (s !== last) { const [a, b] = s.split('|'); cN.textContent = a; sN.textContent = b; last = s; }
        foot.classList.toggle('on', p >= 1);
      },
    };
  },
};
