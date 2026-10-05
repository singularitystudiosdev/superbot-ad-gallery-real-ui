// Step 3, Hailuo 2.3: image to video. Hailuo AI's create panel (dark, violet #7657ff): the first frame is Meshy's
// render of the mascot (img/gen/hl-first.jpg), the prompt types in, the model / resolution / length chips read
// Hailuo 2.3, 1080P, 6s, Generate is pressed, and both tiles count up and resolve into the REAL clips Hailuo 2.3
// generated from that frame (img/gen/hailuo-whisper.mp4, hailuo-wave.mp4, 6s each). Only the character moves in
// them: titles and UI are left to the code step, which is what a video model should not be asked to draw.
import { seg, clamp, outExpo, inOutSine, rise } from '../../../lib.js';
import { video, sync, shimmer } from './media.js';

const PROMPT = 'He leans in and whispers a secret, then waves hello. Static camera, studio light.';
const TYPE = [0.3, 1.35], GO = 1.55;
const CLIPS = [
  { src: 'gen/hailuo-whisper.mp4', gen: [1.7, 3.0], from: 1.3 },
  { src: 'gen/hailuo-wave.mp4', gen: [1.85, 3.2], from: 2.4 },
];

export default {
  id: 'hailuo', app: 'hailuo', model: 'Hailuo 2.3', logo: 'hailuo-favicon.png', dur: 4.6,
  summary: '2 clips from the 3D render, 1080p, 6s',

  build({ img, brand, el, esc }) {
    const n = el(`<div class="hl">
  <div class="hl-hd"><img src="${brand('hailuo-favicon.png')}" alt=""/><b>Hailuo AI</b><nav><span class="on">Image to Video</span><span>Text to Video</span></nav></div>
  <div class="hl-form">
    <div class="hl-ref"><img src="${img('gen/hl-first.jpg')}" alt=""/><span>First frame</span></div>
    <div class="hl-right">
      <div class="hl-prompt"><span class="hl-tx"></span><i class="hl-caret"></i><span class="hl-ghost">${esc(PROMPT)}</span></div>
      <div class="hl-opts"><span class="hl-chip hl-model"><i></i>Hailuo 2.3</span><span class="hl-chip">1080P</span><span class="hl-chip">6s</span><span class="hl-gen">Generate</span></div>
    </div>
  </div>
  <div class="hl-out">${CLIPS.map(() => `<div class="hl-tile"><div class="hl-ph"><span class="hl-sh">Generating</span><em>0%</em></div><span class="hl-dur">0:06</span></div>`).join('')}</div>
</div>`);
    const tx = n.querySelector('.hl-tx'), ghost = n.querySelector('.hl-ghost'), caret = n.querySelector('.hl-caret'), go = n.querySelector('.hl-gen');
    const tiles = [...n.querySelectorAll('.hl-tile')].map((tile, i) => {
      const v = video(img(CLIPS[i].src), 'hl-vid');
      tile.prepend(v);
      return { tile, v, ph: tile.querySelector('.hl-ph'), sh: tile.querySelector('.hl-sh'), pct: tile.querySelector('.hl-ph em'), dur: tile.querySelector('.hl-dur'), last: -1, ...CLIPS[i] };
    });
    let lastN = -1;
    return {
      el: n,
      render(lt, end) {
        const k = Math.round(PROMPT.length * seg(lt, TYPE[0], TYPE[1]));
        if (k !== lastN) { tx.textContent = PROMPT.slice(0, k); ghost.textContent = PROMPT.slice(k); lastN = k; }
        caret.style.opacity = lt >= TYPE[0] && lt < GO ? '1' : '0';
        const press = Math.sin(Math.PI * seg(lt, GO - 0.08, GO + 0.2));
        go.style.transform = press > 0 ? `scale(${(1 - 0.08 * press).toFixed(4)})` : 'none';
        go.classList.toggle('busy', lt >= GO);
        tiles.forEach((c, i) => {
          rise(c.tile, outExpo(seg(lt, 0.15 + i * 0.12, 0.8 + i * 0.12)), 10);
          const p = seg(lt, c.gen[0], c.gen[1]);
          const pct = Math.round(100 * p);
          if (pct !== c.last) { c.pct.textContent = `${pct}%`; c.last = pct; }
          c.sh.style.setProperty('--sh', shimmer(lt));
          c.ph.style.setProperty('--p', (p * 100).toFixed(2) + '%');
          const show = inOutSine(seg(lt, c.gen[1], c.gen[1] + 0.45));
          c.ph.style.opacity = (1 - show).toFixed(3);
          c.v.style.opacity = show.toFixed(3);
          c.v.style.transform = `scale(${(1.04 - 0.04 * show).toFixed(4)})`;
          c.dur.style.opacity = show.toFixed(3);
          sync(c.v, c.from + Math.max(0, lt - c.gen[1]), lt >= c.gen[1] && lt < end);
        });
      },
    };
  },
};
