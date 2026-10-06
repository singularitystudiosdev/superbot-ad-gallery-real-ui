// The output: the Pocketsflow launch film (12.2s), composed from every specialist's layer. S1 is built as a stack of
// planes (the layers the teardown separates); S2-S4 are flat shots. render(ft) is a pure function of film time.
import { E, tw, prog, clamp, lerp, keys, tc } from './ease.bd889861.js';
import { makeDither } from './dither.bd889861.js';

export const FILM_LEN = 12.2;
export const SHOT = { s1: [0, 3.7], s2: [3.7, 6.7], s3: [6.7, 9.6], s4: [9.6, 12.2] };
const BLUE = '#0072f5';

// words that rise out of a line mask, staggered
const words = (txt, cls = '') => txt.split(' ').map((w) => `<span class="fw"><span class="fwi ${cls}">${w}</span></span>`).join(' ');
const rise = (nodes, t, at, step = 0.06, dur = 0.55) => nodes.forEach((n, i) => {
  const p = tw(t, at + i * step, at + i * step + dur, E.outQuint);
  n.style.transform = `translateY(${((1 - p) * 105).toFixed(2)}%)`;
});
const sink = (nodes, t, at, dur = 0.35) => nodes.forEach((n, i) => {
  const p = tw(t, at + i * 0.025, at + i * 0.025 + dur, E.inCubic);
  if (p > 0) n.style.transform = `translateY(${(-p * 140).toFixed(2)}%)`;
});

export function buildFilm(host, M) {
  const el = document.createElement('div');
  el.className = 'film';
  el.innerHTML = `
  <div class="rig"><div class="rig-in">
    <div class="pl" data-p="paper"><div class="pl-fill"></div></div>
    <div class="pl" data-p="art"><img class="pl-art" src="${M.keyartCut}" alt=""/></div>
    <div class="pl" data-p="mesh"><canvas class="pl-mesh" width="760" height="760"></canvas></div>
    <div class="pl" data-p="motion"><canvas class="pl-motion" width="1920" height="1080"></canvas></div>
    <div class="pl" data-p="copy">
      <div class="f-label f1-label"><span class="fw"><span class="fwi">// for creators</span></span></div>
      <div class="f1-h"><div class="fl">${words('Got something')}</div><div class="fl">${words('to')} <span class="fw"><span class="fwi f-it f-blue">sell?</span></span></div>
        <svg class="f1-swash" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M6 26 C 90 8, 210 6, 394 22" fill="none" stroke="${BLUE}" stroke-width="7" stroke-linecap="round"/></svg></div>
    </div>
    <div class="pl" data-p="voice"><div class="pl-wave">${M.voEnv.map((h) => `<i style="--h:${h}"></i>`).join('')}</div><div class="pl-cap">“Got something to sell?”</div></div>
    <div class="pl" data-p="score"><div class="pl-wave pl-wave-s">${M.scoreEnv.map((h) => `<i style="--h:${h}"></i>`).join('')}</div><div class="pl-cap pl-cap-s">118 BPM</div></div>
  <div class="shot s2">
    <div class="f-label s2-label"><span class="fw"><span class="fwi">// your store</span></span></div>
    <div class="s2-h"><div class="fl">${words('Pocketsflow turns it into')}</div><div class="fl">${words('a store in')} <span class="fw"><span class="fwi f-it">minutes.</span></span></div></div>
    <div class="s2-form card"><img src="${M.pfForm}" alt=""/></div>
    <div class="s2-page card"><img src="${M.pfPage}" alt=""/></div>
    <div class="s2-phone"><img src="${M.pfPhone}" alt=""/></div>
  </div>

  <div class="shot s3">
    <div class="s3-bg"></div>
    <div class="f-label s3-label"><span class="fw"><span class="fwi">// merchant of record</span></span></div>
    <div class="s3-h"><div class="fl">${words('Checkout, tax')}</div><div class="fl">${words('and payouts,')}</div><div class="fl"><span class="fw"><span class="fwi f-it">handled.</span></span></div></div>
    <canvas class="s3-mesh" width="980" height="980"></canvas>
    <div class="s3-dash card"><img src="${M.pfDash}" alt=""/></div>
  </div>

  <div class="shot s4">
    <div class="s4-bg"></div>
    <div class="s4-mark"><span class="fw"><span class="fwi">Pocketsflow</span></span></div>
    <div class="s4-tag"><div class="fl">${words('The payment infrastructure that')} <span class="fw"><span class="fwi f-it">you deserve.</span></span></div></div>
    <div class="s4-stats">${['65K+ people', '160+ countries', '$70M+ processed'].map((s) => `<span class="fw"><span class="fwi">${s}</span></span>`).join('<span class="s4-dot">·</span>')}</div>
    <div class="s4-url"><span class="fw"><span class="fwi">pocketsflow.com</span></span></div>
  </div>
    <div class="pl" data-p="cut"><div class="pl-tag">LaunchFilm.tsx · halftone</div><div class="pl-tl"><span style="--w:27.9%">hook</span><span style="--w:24.6%">store</span><span style="--w:23.8%">handled</span><span style="--w:21.3%">end</span><i class="pl-ph"></i></div><div class="f-tc" hidden><span class="f-tcv"></span></div></div>
  </div></div>`;
  host.appendChild(el);
  const $ = (s) => el.querySelector(s), $$ = (s) => [...el.querySelectorAll(s)];
  const N = {
    rig: $('.rig-in'), planes: Object.fromEntries($$('.pl').map((p) => [p.dataset.p, p])),
    f1label: $$('.f1-label .fwi'), f1h: $$('.f1-h .fwi'), swash: $('.f1-swash path'), tcv: $('.f-tcv'), tc: $('.f-tc'),
    s2: $('.s2'), s2label: $$('.s2-label .fwi'), s2h: $$('.s2-h .fwi'), form: $('.s2-form'), page: $('.s2-page'), phone: $('.s2-phone'),
    s3: $('.s3'), s3bg: $('.s3-bg'), s3label: $$('.s3-label .fwi'), s3h: $$('.s3-h .fwi'), s3mesh: $('.s3-mesh'), dash: $('.s3-dash'),
    s4: $('.s4'), s4bg: $('.s4-bg'), mark: $$('.s4-mark .fwi'), tag: $$('.s4-tag .fwi'), stats: $$('.s4-stats .fwi'), url: $$('.s4-url .fwi'),
    meshPlane: $('.pl-mesh'), motionCv: $('.pl-motion'),
  };
  const swashLen = 410; N.swash.style.strokeDasharray = `${swashLen}`;
  const motion = makeDither($('.pl-motion'), { cell: 3, ink: '#0b0b0c', paperA: 0, contrast: 1.25, bias: 0.035, gamma: 1.05 });
  // lifted shadows for the blue duotone, so the face reads as the key art's (no dark patch at the mouth)
  const mesh3 = makeDither(N.s3mesh, { cell: 3, mode: 1, ink: '#06173a', hi: '#ffffff', paper: BLUE, paperA: 0, contrast: 1.0, bias: 0.12, gamma: 0.78 });

  // ft: film time. src: { video (Kling <video>), viewer (three canvas), angle } supplied by main after it seeks
  function render(ft, src) {
    const [a2, b2] = SHOT.s2, [a3] = SHOT.s3, [a4] = SHOT.s4;
    // S1 hook: label, headline, swash; the clip's halftone on the motion plane
    rise(N.f1label, ft, -0.1, 0.05, 0.45);
    rise(N.f1h, ft, -0.12, 0.05, 0.55);
    N.swash.style.strokeDashoffset = `${(swashLen * (1 - tw(ft, 0.35, 0.9, E.inOutCubic))).toFixed(1)}`;
    if (ft > a2 - 0.4) { sink(N.f1label, ft, a2 - 0.38); sink(N.f1h, ft, a2 - 0.34); }
    N.swash.parentNode.style.opacity = (1 - tw(ft, a2 - 0.35, a2 - 0.1)).toFixed(3);
    const mfade = 1 - tw(ft, a2 - 0.3, a2 + 0.05, E.inOutSine);
    // exploded, the dots and the type turn light so the layers read against the dark
    const sp = src.spread || 0, mix = (a, b) => '#' + [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], sp)).toString(16).padStart(2, '0')).join('');
    if (src.video && src.video.readyState >= 2 && ft < a2 + 0.1) motion.draw(src.video, { fade: mfade, ink: mix([11, 11, 12], [236, 237, 240]) });
    N.planes.copy.style.color = mix([10, 10, 10], [242, 243, 245]);
    if (ft >= a2 + 0.1) N.planes.motion.style.opacity = '0';
    N.motionCv.style.transform = `translateX(${(260 * E.inCubic(1 - mfade)).toFixed(1)}px)`;
    N.tcv.textContent = tc(Math.min(ft, FILM_LEN));

    // S2 store: form -> page in minutes, then the creator page on a phone
    const in2 = ft >= a2 - 0.05 && ft < a3 + 0.7;
    N.s2.style.visibility = in2 ? 'visible' : 'hidden';
    if (in2) {
      rise(N.s2label, ft, a2, 0.05, 0.5); rise(N.s2h, ft, a2 + 0.05, 0.06, 0.6);
      // one UI at a time: the product form, then the page it becomes, then the creator page on a phone
      const fi = tw(ft, a2 + 0.1, a2 + 0.7, E.outQuint), fo = tw(ft, a2 + 1.0, a2 + 1.5, E.inOutCubic);
      const gi = tw(ft, a2 + 1.0, a2 + 1.55, E.outQuint), go = tw(ft, a2 + 1.8, a2 + 2.15, E.inCubic);
      const hi = tw(ft, a2 + 2.0, a2 + 2.55, E.outQuint);
      N.form.style.transform = `translate(${(lerp(90, 0, fi) - 760 * fo).toFixed(1)}px, ${lerp(40, 0, fi).toFixed(1)}px) scale(${lerp(0.96, 1, fi).toFixed(4)})`;
      N.form.style.opacity = (fi * (1 - fo)).toFixed(3);
      N.page.style.transform = `translate(${(820 * (1 - gi) - 1500 * go).toFixed(1)}px, 0px)`;
      N.page.style.opacity = (clamp(gi * 1.6) * (1 - go)).toFixed(3);
      N.phone.style.transform = `translate(${(640 * (1 - hi)).toFixed(1)}px, ${lerp(30, 0, hi).toFixed(1)}px)`;
      N.phone.style.opacity = clamp(hi * 1.6).toFixed(3);
    }

    // S3 handled: Pocketsflow blue opens from the phone's buy button; the Rodin figure turns, halftoned
    const in3 = ft >= a3 - 0.05 && ft < a4 + 0.7;
    N.s3.style.visibility = in3 ? 'visible' : 'hidden';
    if (in3) {
      const wipe = tw(ft, a3 - 0.05, a3 + 0.6, E.inOutCubic);
      N.s3.style.clipPath = `circle(${(wipe * 2300).toFixed(1)}px at 1395px 720px)`;
      rise(N.s3label, ft, a3 + 0.25, 0.05, 0.5); rise(N.s3h, ft, a3 + 0.3, 0.08, 0.6);
      const d = tw(ft, a3 + 1.25, a3 + 1.95, E.outQuint);
      N.dash.style.transform = `translateY(${lerp(70, 0, d).toFixed(1)}px)`; N.dash.style.opacity = d.toFixed(3);
      const mp = tw(ft, a3 + 0.35, a3 + 1.1, E.outQuint);
      N.s3mesh.style.transform = `translateY(${lerp(50, 0, mp).toFixed(1)}px)`;
      if (src.viewer) mesh3.draw(src.viewer, { fade: mp });
    }

    // S4 end: the wordmark, the tagline, the numbers from pocketsflow.com
    const in4 = ft >= a4 - 0.05;
    N.s4.style.visibility = in4 ? 'visible' : 'hidden';
    if (in4) {
      const up = tw(ft, a4 - 0.05, a4 + 0.55, E.inOutCubic);
      N.s4.style.clipPath = `inset(${((1 - up) * 100).toFixed(2)}% 0 0 0)`;
      rise(N.mark, ft, a4 + 0.3, 0.05, 0.7); rise(N.tag, ft, a4 + 0.55, 0.05, 0.6);
      rise(N.stats, ft, a4 + 1.0, 0.1, 0.6); rise(N.url, ft, a4 + 1.3, 0.05, 0.6);
      N.s4.style.transform = `scale(${(1 + 0.035 * E.inOutSine(prog(ft, a4, FILM_LEN))).toFixed(4)})`;
    }
    N.tc.style.color = in3 && !in4 ? 'rgba(255,255,255,.72)' : '';
  }

  // the 3D plane of the stack shows the clean (un-halftoned) Rodin render
  const mctx = N.meshPlane.getContext('2d');
  function drawMeshPlane(viewerCanvas) { if (!viewerCanvas) return; mctx.clearRect(0, 0, 760, 760); mctx.drawImage(viewerCanvas, 0, 0, 760, 760); }

  return { el, N, render, drawMeshPlane };
}
