// Deploy beat: Vercel builds Inkwave and ships it to inkwave-six.vercel.app. The line streams, the "Deploying to
// Production" chip lands and spins, the deployment card rises, its build log types itself out line by line while the
// status pill walks QUEUED -> BUILDING -> READY, and the domain row lands with its preview thumb and Ready badge.
// The mark is the Vercel logo from brand/; the only image is the preview thumb, the real capture's in match HUD frame
// (img/ink/hud.jpg, see INDEX.txt). No clock, no logo animation, no rAF state: every moving value is written from t,
// so ?t= freezes the frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Shipping it.';
const RUN = 'Deploying to Production';
const DONE = 'Deployed to Production';
const DOMAIN = 'inkwave-six.vercel.app';
const HUD = 'ink/hud.jpg';
const CPS = 130;               // the build log types fast, like a real build
const PHASE = ['QUEUED', 'BUILDING', 'READY'];
// the vite build's own output, typed a line at a time; at = seconds after the log opens
const LOG = [
  { at: 0.00, s: '$ vite build' },
  { at: 0.16, s: 'vite v5.4.11 building for production' },
  { at: 0.32, s: 'transforming 214 modules' },
  { at: 0.50, s: 'rendering chunks' },
  { at: 0.66, s: 'dist/assets/inkwave-Bs3fKq1a.js   182.4 kB | gzip: 61.2 kB' },
  { at: 0.82, s: 'dist/assets/inkwave-9qXt2mZc.css    38.7 kB | gzip: 9.4 kB' },
  { at: 1.00, s: 'Compressing textures' },
  { at: 1.18, s: 'Build completed in 18s' },
  { at: 1.36, s: 'Deploying outputs' },
];

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.chipDone = T.chip + 0.4;
    T.card = r + 0.4;
    T.build = T.card + 0.34;      // QUEUED -> BUILDING
    T.log = LOG.map((l) => r + 0.56 + l.at);
    T.dom = r + 1.88;             // the domain row slides in under the log
    T.ready = r + 2.15;           // BUILDING -> READY, the badge flips
    T.end = T.ready + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Deploying to Production</span></div></div>');
    const card = x.el(`<div class="dp-card">
      <div class="dp-hd">
        <span class="dp-mark"><img src="${x.brand('vercel-logo.svg')}" alt="Vercel" draggable="false"/></span>
        <b class="dp-name">inkwave</b>
        <span class="dp-branch">production</span>
        <span class="dp-st"><i class="dp-dot"></i><em>QUEUED</em></span>
      </div>
      <div class="dp-log">${LOG.map(() => '<div class="dp-line"><span class="dp-tx"></span><i class="dp-c"></i></div>').join('')}</div>
      <div class="dp-dom">
        <span class="dp-thumb"><img src="${x.img(HUD)}" alt="Inkwave preview frame" draggable="false"/></span>
        <span class="dp-host">${x.esc(DOMAIN)}</span>
        <span class="dp-badge">Building</span>
      </div>
    </div>`);
    const lines = [...card.querySelectorAll('.dp-line')].map((node) => ({ node, tx: node.firstElementChild, c: node.lastElementChild, n: -1 }));
    const dot = card.querySelector('.dp-dot'), stx = card.querySelector('.dp-st em');
    const dom = card.querySelector('.dp-dom'), badge = card.querySelector('.dp-badge'), host = card.querySelector('.dp-host');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, phase = -1, ready = null;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.dom, dom]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = chipDone ? DONE : RUN;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the status pill walks QUEUED -> BUILDING -> READY; the dot breathes while the build runs
        const ph = t >= T.ready ? 2 : t >= T.build ? 1 : 0;
        if (ph !== phase) {
          phase = ph;
          stx.textContent = PHASE[ph];
          card.classList.toggle('dp-run', ph === 1);
          card.classList.toggle('dp-ready', ph === 2);
        }
        dot.style.opacity = ph === 1 ? (0.4 + 0.6 * Math.abs(Math.sin(t * 5))).toFixed(3) : '1';

        // the build log types out, line by line; a caret rides the line currently being written
        let active = -1;
        for (let i = 0; i < LOG.length; i++) if (t >= T.log[i] && streamCount(LOG[i].s, T.log[i], CPS, t) < LOG[i].s.length) active = i;
        lines.forEach((L, i) => {
          const a = T.log[i];
          L.node.style.opacity = outCubic(seg(t, a, a + 0.14)).toFixed(3);
          const c = streamCount(LOG[i].s, a, CPS, t);
          if (c !== L.n) { L.n = c; L.tx.textContent = LOG[i].s.slice(0, c); }
          L.c.style.opacity = i === active ? (((t % 0.8) < 0.5 ? 0.9 : 0.15)).toFixed(3) : '0';
        });

        // the domain row lands, then its badge flips from Building to Ready and the host goes live-white
        const di = outCubic(seg(t, T.dom, T.dom + 0.35));
        dom.style.opacity = di.toFixed(3);
        dom.style.transform = di >= 1 ? 'none' : `translateY(${((1 - di) * 8).toFixed(2)}px)`;
        const isReady = t >= T.ready;
        if (isReady !== ready) {
          ready = isReady;
          badge.textContent = isReady ? 'Ready' : 'Building';
          dom.classList.toggle('dp-on', isReady);
          host.classList.toggle('dp-on', isReady);
        }
        badge.style.opacity = isReady ? (0.82 + 0.18 * Math.abs(Math.sin(t * 5))).toFixed(3) : '0.75';
        const bp = isReady ? lerp(1, 1.04, seg(t, T.ready, T.ready + 0.3) * (1 - seg(t, T.ready + 0.3, T.ready + 0.6))) : lerp(0.92, 1, outBack(seg(t, T.dom, T.dom + 0.4)));
        badge.style.transform = `scale(${bp.toFixed(4)})`;
      },
    };
  },
};