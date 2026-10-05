// Beat 1 of 6, DeepSeek V4 Flash: it reads pocketsflow.com and writes the launch script the rest of the chat builds.
// The card is the script document itself: five source sections it read, a 15s shot bar, and six rows of timecode,
// shot, what is on screen and the voiceover line (typed in as it is written; the product facts it pulled get a dashed
// underline once the line lands). Every row comes from film.f2628f01.js SHOTS, so the script, the storyboard, the voice,
// the cut and the final film all say the same thing.
import { seg, outCubic } from '../../../lib.js';
import { SHOTS, tc } from '../../../film/film.f2628f01.js';
import { sayLine, renderSay, toolChip, renderChip, head, cardIn, rise, setText } from './pf-kit.f2628f01.js';

const SAY = 'Read pocketsflow.com and wrote the script: 15 seconds, six shots.';
const SOURCES = ['Home', 'Create', 'Checkout', 'Merchant of record', 'Dashboard'];
const FACTS = ['live in minutes', 'Apple Pay', '160 countries', 'Get paid', 'payment infrastructure'];
const WORDS = SHOTS.reduce((s, x) => s + x.vo.split(' ').length, 0);
const WPM = Math.round(WORDS / 15 * 60);
const CPS = 72;

const factHtml = (x, vo) => FACTS.reduce((h, f) => h.replace(f, `<u class="pfs-fact">${x.esc(f)}</u>`), x.esc(vo));

export default {
  times(r) {
    const T = { r };
    T.chip = [r + 0.12, r + 0.8];
    T.card = r + 0.5;
    T.src = r + 0.7;
    T.row = SHOTS.map((_, i) => r + 1.0 + i * 0.42);
    T.end = r + 4.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = toolChip(x, 'Reading pocketsflow.com', 'Read 5 sections of pocketsflow.com');
    const pf = x.brand('pocketsflow-icon.png');
    const card = x.el(`<div class="pfc pfs">
      ${head(x, 'deepseek', 'launch-script.md', 'script', `<span class="pfc-meta">15.0s</span><span class="pfc-meta">6 shots</span><span class="pfc-meta">${WORDS} words</span>`)}
      <div class="pfs-src"><span class="pfs-lab">Sources</span>${SOURCES.map((s) => `<span class="pfs-pill"><img src="${pf}" alt=""/>${x.esc(s)}</span>`).join('')}</div>
      <div class="pfs-bar">${SHOTS.map((s, i) => `<span style="flex:${(s.t1 - s.t0).toFixed(1)}"><i></i><b>0${i + 1}</b></span>`).join('')}</div>
      <div class="pfs-rows">${SHOTS.map((s, i) => `<div class="pfs-row"><span class="pfs-tc">${tc(s.t0)}</span>
        <div class="pfs-shot"><b>0${i + 1} ${x.esc(s.name)}</b><small>${x.esc(s.see)}</small></div>
        <p class="pfs-vo"><span class="pfs-q">“</span><span class="pfs-vis"></span><span class="pfs-hid">${x.esc(s.vo)}</span><span class="pfs-q">”</span></p></div>`).join('')}</div>
      <div class="pfs-ft"><span>${WORDS} words at ${WPM} wpm, fits 15.0s</span><span>Tone: confident, plain, no hype</span></div>
    </div>`);
    const q = (s) => [...card.querySelectorAll(s)];
    const pills = q('.pfs-pill'), segs = q('.pfs-bar > span'), rows = q('.pfs-row');
    const vos = rows.map((r) => ({ p: r.querySelector('.pfs-vo'), vis: r.querySelector('.pfs-vis'), hid: r.querySelector('.pfs-hid'), n: -1, done: false }));
    return {
      nodes: [say.n, chip.row, card],
      marks: [[T.r, say.n], [T.chip[0], chip.row], [T.card, card], [T.row[3], card]],
      render(t) {
        renderSay(say, t, T.r + 0.05);
        renderChip(chip, t, T.chip[0], T.chip[1]);
        cardIn(card, t, T.card, T.end);
        pills.forEach((p, i) => rise(p, seg(t, T.src + i * 0.09, T.src + i * 0.09 + 0.3), 5));
        SHOTS.forEach((s, i) => {
          const a = T.row[i];
          // a row waits as skeleton bars (the row's own anatomy) until DeepSeek writes it
          const w = t < a;
          rows[i].classList.toggle('pfs-wait', w);
          if (w) { rows[i].style.opacity = '1'; rows[i].style.transform = ''; } else rise(rows[i], seg(t, a, a + 0.32), 8);
          segs[i].classList.toggle('on', t >= a + 0.1);
          const v = vos[i], len = s.vo.length;
          const n = Math.max(0, Math.min(len, Math.floor((t - a - 0.08) * CPS)));
          if (n >= len) {
            if (!v.done) { v.vis.innerHTML = factHtml(x, s.vo); v.hid.textContent = ''; v.done = true; v.n = len; }
          } else if (n !== v.n || v.done) {
            v.done = false; v.n = n;
            setText(v.vis, s.vo.slice(0, n)); v.hid.textContent = s.vo.slice(n);
          }
          v.p.classList.toggle('pfs-typing', n > 0 && n < len);
        });
        q('.pfs-ft')[0].style.opacity = outCubic(seg(t, T.row[5] + 0.6, T.row[5] + 1.0)).toFixed(3);
      },
    };
  },
};
