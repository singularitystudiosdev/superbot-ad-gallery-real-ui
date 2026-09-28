// Opus 5.5 beat: "Building the ride." over a work readout (progress bar, eleven files landing with line counters,
// four steps resolving), then "Your Japanese biking demo is ready." and the preview card that tabs.js hands off
// to the next scene. Pure function of t (scene-local time).
import { seg, outCubic, clamp } from '../../../lib.js';

const SAY = 'Building the ride.';
const DONE = 'Your Japanese biking demo is ready.';
export const TITLE = 'Japanese relaxing biking demo';
const FILES = [
  ['src/ride/scene.ts', 184], ['src/ride/bike.ts', 142], ['src/ride/rider.ts', 118], ['src/ride/road.ts', 96],
  ['src/ride/sakura.ts', 131], ['src/ride/torii.ts', 64], ['src/ride/lanterns.ts', 72], ['src/ride/sky.ts', 88],
  ['src/ride/camera.ts', 57], ['src/audio/mix.ts', 109], ['src/main.ts', 41],
];
const STEPS = ['Loading 5 Meshy models', 'Mixing 6 audio tracks', 'Writing 11 files', 'Build OK'];

const PLAY = '<span class="pv-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.2v11.6c0 .7.8 1.1 1.4.7l9-5.8c.5-.3.5-1.1 0-1.4l-9-5.8c-.6-.4-1.4 0-1.4.7Z" fill="#fff"/></svg></span>';
// the preview card markup (em-based: font-size sets the whole card's scale, so tabs.js can lay a native-size twin).
// The poster fills the whole card rect; the footer, badge and play button sit over it, so fading them out leaves
// exactly the poster in the card's rounded rect (the hand-off frame).
export const cardHtml = (esc, cls = '') => `<div class="pv-card ${cls}"><div class="pv-media"><img src="img/ride-poster.jpg" alt="" onerror="this.style.visibility='hidden'"/></div>
  ${PLAY}<span class="pv-live">LIVE PREVIEW</span>
  <div class="pv-row"><span class="pv-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M4.4 7.6 12 12l7.6-4.4M12 12v8.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-opacity=".7"/></svg></span>
  <span class="pv-tx"><b>${esc(TITLE)}</b><small>three.js · 11 files · 60 fps</small></span><span class="pv-open">Open<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div><i class="pv-ring"></i></div>`;

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.07 };
    T.file = FILES.map((_, i) => r + 0.12 + i * 0.05);
    T.step = [r + 0.12, r + 0.34, r + 0.56, r + 0.9];
    T.stepDone = [r + 0.32, r + 0.54, r + 0.86, r + 0.98];
    T.bar = [r + 0.1, r + 0.96];
    T.say2 = 6.52; T.pv = 6.58; T.grow = 6.8;
    T.end = 7.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.sayEl(SAY), say2 = x.sayEl(DONE);
    say2.n.classList.add('cw-done');
    const card = x.el(`<div class="cw-card">
      <div class="cw-head"><span class="cw-ttl">Building <b>ride</b></span><span class="cw-pc">0%</span></div>
      <div class="cw-bar"><i></i></div>
      <div class="cw-files">${FILES.map(([f, n]) => `<div class="cw-f"><span>${x.esc(f)}</span><b data-n="${n}">+0</b></div>`).join('')}</div>
      <div class="cw-steps">${STEPS.map((s, i) => `<div class="cw-s${i === 3 ? ' cw-ok' : ''}"><span class="cw-st"><i class="qc-spin"></i>${x.OK}</span><span>${x.esc(s)}</span></div>`).join('')}</div></div>`);
    const pv = x.el(cardHtml(x.esc));
    const files = [...card.querySelectorAll('.cw-f')].map((f) => ({ f, b: f.querySelector('b'), n: +f.querySelector('b').dataset.n, last: -1 }));
    const steps = [...card.querySelectorAll('.cw-s')].map((s) => ({ s, spin: s.querySelector('.qc-spin'), ok: s.querySelector('.qc-ok') }));
    const bar = card.querySelector('.cw-bar i'), pc = card.querySelector('.cw-pc');
    let lastPc = -1;
    return {
      nodes: [say.n, card, say2.n, pv],
      marks: [[T.card, card], [T.say2 - 0.04, pv]],
      card: pv,
      render(t) {
        say.render(t, T.say, 110);
        x.rise(card, t, T.card, 0.24, 8);
        const bp = seg(t, T.bar[0], T.bar[1]);
        bar.style.transform = `scaleX(${bp.toFixed(4)})`;
        const p = Math.round(bp * 100);
        if (p !== lastPc) { pc.textContent = `${p}%`; lastPc = p; }
        card.classList.toggle('on', bp >= 1);
        files.forEach((o, i) => {
          x.rise(o.f, t, T.file[i], 0.18, 5);
          const c = Math.round(o.n * outCubic(seg(t, T.file[i], T.file[i] + 0.22)));
          if (c !== o.last) { o.b.textContent = `+${c}`; o.last = c; }
        });
        steps.forEach((o, i) => {
          x.rise(o.s, t, T.step[i], 0.16, 4);
          const done = t >= T.stepDone[i];
          o.s.classList.toggle('on', done);
          o.spin.style.opacity = done ? '0' : '1';
          o.spin.style.transform = `rotate(${((t - T.step[i]) * 420).toFixed(1)}deg)`;
          const d = seg(t, T.stepDone[i], T.stepDone[i] + 0.16);
          o.ok.style.opacity = done ? '1' : '0';
          o.ok.style.transform = `scale(${(0.5 + 0.5 * clamp(outCubic(d))).toFixed(4)})`;
        });
        x.rise(say2.n, t, T.say2, 0.22, 6);
        say2.render(t, T.say2, 170);
        x.rise(pv, t, T.pv, 0.26, 12);
      },
    };
  },
};
