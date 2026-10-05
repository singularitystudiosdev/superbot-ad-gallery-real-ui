// The superbot end card: the wordmark, then the real mascot (assets/sb-mark-live.*) to its right. The mascot's CSS
// loops are paused and seeked to t, its blink and its happy face are scheduled, so every frame is reproducible.
import { seg, lerp, outCubic, outQuint, inOutCubic, el } from './lib.js';
import { T } from './timing.js';

const BLINK = [T.endIn + 1.1, T.endIn + 1.56];          // eyes shut for 0.1 s at each
const HAPPY = [T.endIn + 1.22, T.endIn + 1.72];          // the happy face (task done) between these

export function mountEnd(root) {
  const sec = el(`<section id="end" class="scene"><div class="lock"><div class="words"><h1>superbot</h1></div><div class="face"></div></div><p class="tag">Every model. One chat.</p></section>`);
  root.appendChild(sec);
  const face = sec.querySelector('.face');
  // sbMarkLive builds the markup; its own timers are random, so keep only the markup and drive it from t
  const live = window.sbMarkLive(document.createElement('div'), { size: 220, interactive: false });
  const html = live.html.split('sb-gate-mark').join('sb-end-mark');
  live.destroy();
  face.innerHTML = `<span class="mark-wrap">${html}</span>`;
  const svg = face.querySelector('svg.sb-mark');
  svg.style.width = svg.style.height = '220px';
  const eyes = [...svg.querySelectorAll('.mark-eye')];
  return { sec, face, words: sec.querySelector('.words h1'), tag: sec.querySelector('.tag'), svg, eyes, base: eyes.map((e) => ({ cx: +e.getAttribute('cx'), ry: +e.getAttribute('ry') })) };
}

export function renderEnd(n, t) {
  const on = t >= T.endIn;
  n.sec.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  const lt = t - T.endIn;
  const bg = inOutCubic(seg(lt, 0, 0.32));
  n.sec.style.opacity = bg.toFixed(3);
  const f = outQuint(seg(lt, 0.24, 0.7));
  n.face.style.opacity = f.toFixed(3);
  n.face.style.transform = `scale(${lerp(0.5, 1, f).toFixed(4)})`;
  const w = outQuint(seg(lt, 0.24, 0.7));
  n.words.style.opacity = w.toFixed(3);
  n.words.style.transform = w >= 1 ? 'none' : `translateX(${((1 - w) * 70).toFixed(2)}px)`;
  const g = outCubic(seg(lt, 0.5, 0.85));
  n.tag.style.opacity = g.toFixed(3);
  n.tag.style.transform = g >= 1 ? 'none' : `translateY(${((1 - g) * 12).toFixed(2)}px)`;
  // the eyes glance at the wordmark, then back
  const look = seg(t, T.endIn + 0.94, T.endIn + 1.08) * (1 - seg(t, T.endIn + 1.4, T.endIn + 1.54));
  const shut = BLINK.some((b) => t >= b && t < b + 0.1);
  n.eyes.forEach((e, i) => {
    e.setAttribute('cx', (n.base[i].cx - 3.2 * outCubic(look)).toFixed(2));
    e.setAttribute('ry', shut ? '1' : String(n.base[i].ry));
  });
  const happy = t >= HAPPY[0] && t < HAPPY[1];
  n.svg.classList.toggle('is-happy', happy);
  for (const a of n.face.getAnimations({ subtree: true })) {
    a.pause();
    a.currentTime = (a.animationName === 'mark-happy-bob' ? t - HAPPY[0] : t) * 1000;
  }
}
