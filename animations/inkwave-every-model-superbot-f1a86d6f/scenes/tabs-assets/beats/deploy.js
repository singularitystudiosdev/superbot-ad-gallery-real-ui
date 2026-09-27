// Deploy beat (beats/deploy.js), step 8 of the one routing: superbot hands the finished build to Vercel, and the
// deployment sheet for it rises. The sheet is Vercel's own deployment detail page as documented at
// vercel.com/docs/deployments/logs and /docs/deployments/overview: the project header with the Production badge and
// the status pill, the Deployment Summary / Build Logs / Domains / Source tab row with Build Logs open, the commit
// row it was built from, the streaming build log (cloning, installing, vite build, the modules transformed, the
// output assets, deploying outputs), and the generated domain with its Visit button.
// The status pill is the ad's amber-to-green pair: it reads "Building" with the seconds counting up while the build
// runs and flips to "Ready" with the build's whole wall clock, 34s, the moment the log ends. The build is this
// spot's own fiction: the repo, the short sha, the commit message, the package count and the domain are made up
// (inkwave-turf.vercel.app, never the game's real inkwave-six.vercel.app), and the log lines are the kind of thing
// Vercel prints, not a real run's output. The preview thumbnail in the card is the one real thing on the sheet: a
// frame of the post's own gameplay capture (img/ink/deploy/CREDITS.txt records the source and the crop).
// Pure function of t: no Date, no rAF, no CSS animation, no state that depends on history. Every opacity, transform
// and class the beat writes comes from t, so ?t= on the page freezes an exact frame.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount, press, pressScale, blink } from '../../../lib.js';

const SAY = 'Shipping inkwave to production on Vercel.';
const OWNER = 'singularity';
const REPO = 'inkwave';
const BRANCH = 'main';
const SHA = 'a1c94e2';                     // short sha, made up the same way the sibling git beat's are
const MSG = 'feat: ink turf war';
const DOMAIN = 'inkwave-turf.vercel.app';  // made up for the ad: the game's real URL is inkwave-six.vercel.app
const BUILD_S = 34;                        // the build's wall clock, the number the Ready pill prints
const TABS = ['Deployment Summary', 'Build Logs', 'Domains', 'Source'];
const OPEN_TAB = 1;                        // Build Logs is the open tab: the panel under it is the build log
// the build log, as Vercel would stream it for this project. [timestamp, text, check?]
const LOGS = [
  ['10:41:03', 'Cloning ' + OWNER + '/' + REPO],
  ['10:41:03', 'Branch: ' + BRANCH + ', Commit: ' + SHA],
  ['10:41:04', 'Installing dependencies...'],
  ['10:41:06', 'added 212 packages in 1.7s'],
  ['10:41:07', 'Running "vite build"'],
  ['10:41:08', 'vite v5.4.11 building for production...'],
  ['10:41:09', '318 modules transformed.', true],
  ['10:41:10', 'dist/assets 23 files'],
  ['10:41:11', 'juno.glb 4.1 MB, tidewater-riot.ogg'],
  ['10:41:12', 'Deploying outputs...'],
];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.24;                              // the sheet rises
    T.log = LOGS.map((_, i) => r + 0.52 + i * 0.15); // the build log streams, one line at a time
    T.ready = r + 1.94;                             // the log ends and the pill flips to Ready
    T.domain = r + 2.02;                            // the generated domain appears under it
    T.visit = r + 2.24;                             // the Visit button lands
    T.click = r + 2.52;                             // the pointer presses it
    T.end = r + 3;                                  // the same 3s hold the scaffold stub declared: the routing's clock after this step does not move
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = (k.opts && k.opts.say) || SAY;
    // the ad's own check (chat.js OK), recoloured for the build log by the beat's own class
    const CHECK = x.OK.replace('class="qc-ok"', 'class="qb-deploy-ok"');
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
    const rows = LOGS.map(([ts, tx, ck]) => x.el(`<div class="qb-deploy-lg">
      <i class="qb-deploy-ts">${x.esc(ts)}</i>${ck ? CHECK : ''}<span class="qb-deploy-tx">${x.esc(tx)}</span><i class="qb-deploy-cur"></i>
    </div>`));
    const card = x.el(`<div class="qb-deploy">
      <div class="qb-deploy-card">
        <div class="qb-deploy-hd">
          <span class="qb-deploy-tri"><img src="${x.brand('vercel-logo.svg')}" alt="Vercel"/></span>
          <b class="qb-deploy-pj">${x.esc(REPO)}</b>
          <span class="qb-deploy-env">Production</span>
          <span class="qb-deploy-st"><i class="qb-deploy-dot"></i><b class="qb-deploy-stt">Building</b><span class="qb-deploy-std">0s</span></span>
        </div>
        <div class="qb-deploy-tabs">${TABS.map((t, i) => `<span class="qb-deploy-tab${i === OPEN_TAB ? ' is-on' : ''}">${x.esc(t)}</span>`).join('')}</div>
        <div class="qb-deploy-src">
          <span class="qb-deploy-gh"><img src="${x.brand('github-logo.svg')}" alt="GitHub"/></span>
          <span class="qb-deploy-rp"><b>${x.esc(OWNER)}</b><i>/</i><b>${x.esc(REPO)}</b></span>
          <span class="qb-deploy-br">${x.esc(BRANCH)}</span>
          <span class="qb-deploy-sha">${x.esc(SHA)}</span>
          <span class="qb-deploy-msg">${x.esc(MSG)}</span>
        </div>
        <div class="qb-deploy-body">
          <div class="qb-deploy-logs"></div>
        </div>
        <div class="qb-deploy-foot">
          <div class="qb-deploy-prev"><img src="${x.img('ink/deploy/preview.jpg')}" alt="inkwave running at ${x.esc(DOMAIN)}"/></div>
          <div class="qb-deploy-dm">
            <span class="qb-deploy-url">${x.esc(DOMAIN)}</span>
            <span class="qb-deploy-live"><i class="qb-deploy-dot"></i>Live in production</span>
          </div>
          <span class="qb-deploy-visit">Visit</span>
        </div>
      </div>
    </div>`);
    card.querySelector('.qb-deploy-logs').append(...rows);
    const sheet = card.querySelector('.qb-deploy-card');
    const pill = card.querySelector('.qb-deploy-st');
    const pillT = card.querySelector('.qb-deploy-stt');
    const pillD = card.querySelector('.qb-deploy-std');
    const prev = card.querySelector('.qb-deploy-prev');
    const foot = card.querySelector('.qb-deploy-foot');
    const live = card.querySelector('.qb-deploy-live');
    const visit = card.querySelector('.qb-deploy-visit');
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [sayEl, card],
      marks: [[T.r, sayEl], [T.card, card], [T.domain, foot]],
      render(t) {
        const n = streamCount(say, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = say.slice(0, n); hid.textContent = say.slice(n); shown = n; }

        // the sheet rises into the thread
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        sheet.style.opacity = ci.toFixed(3);
        sheet.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the status pill: Building with the seconds counting up, then Ready with the whole wall clock
        const building = t < T.ready;
        pill.classList.toggle('is-ready', !building);
        const label = building ? 'Building' : 'Ready';
        if (pillT.textContent !== label) pillT.textContent = label;
        const secs = Math.round(BUILD_S * seg(t, T.card, T.ready)) + 's';
        const dur = building ? secs : BUILD_S + 's';
        if (pillD.textContent !== dur) pillD.textContent = dur;

        // the build log streams in, newest line last; the block cursor sits on the line the build is on, blinking
        let newest = -1;
        rows.forEach((row, i) => {
          const p = outCubic(seg(t, T.log[i], T.log[i] + 0.22));
          rise(row, p, 4);
          if (p > 0) newest = i;
        });
        const cur = building ? blink(t, 0.9) : false;
        rows.forEach((row, i) => {
          const on = i === newest;
          row.classList.toggle('is-cur', on);
          row.lastElementChild.style.opacity = on && cur ? '1' : '0';
        });

        // the deployed site's preview thumbnail, then the footer's domain, Live dot and Visit button
        const pi = outCubic(seg(t, T.card + 0.06, T.card + 0.5));
        prev.style.opacity = pi.toFixed(3);
        prev.style.transform = pi >= 1 ? '' : `scale(${lerp(0.94, 1, pi).toFixed(4)})`;
        const fi = outCubic(seg(t, T.domain, T.domain + 0.34));
        foot.style.opacity = fi.toFixed(3);
        live.style.opacity = (t < T.ready ? 0 : outCubic(seg(t, T.ready, T.ready + 0.3))).toFixed(3);
        const vi = outBack(seg(t, T.visit, T.visit + 0.36));
        visit.style.opacity = clamp01(seg(t, T.visit, T.visit + 0.26)).toFixed(3);
        visit.style.transform = `scale(${(lerp(0.6, 1, vi) * pressScale(t, T.click, 0.08)).toFixed(4)})`;
      },
      // the pointer comes down to the Visit button and clicks it once the deploy is live. It sits on the button's
      // bottom right corner, not its centre: the cursor is drawn white and so is the Visit pill, so a tip at the
      // centre paints the whole arrow white on white. Anchored at the corner, the arrow's body falls on the dark
      // footer and the tip still reads as landing on the button.
      pointer(t) {
        const a = T.visit - 0.34, b = T.end + 0.02;   // in before the button lands, out as the beat ends
        if (t < a || t > b) return null;
        const p = x.box(visit);
        return { x: p.x + p.w - 5, y: p.y + p.h - 4, p: press(t, T.click), v: inOutCubic(seg(t, a, a + 0.24)) * (1 - seg(t, b - 0.3, b)) };
      },
    };
  },
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));