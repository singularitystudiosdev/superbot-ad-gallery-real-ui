// GitLab beat, the finale: superbot rolls the fix out from the user's own GitLab. Its line streams and a card lands in
// the chat modelled on GitLab's real OAuth authorize page (/oauth/authorize; gitlab-org/gitlab
// app/views/doorkeeper/authorizations/new.html.haml and config/locales/doorkeeper.en.yml, fetched 2026-10-03): the
// heading "superbot is requesting access to your account on GitLab.", the signed-in user (identicon and name; GitLab's
// "@username" reference is left out, the copy rule bans "@"), the warning alert GitLab shows for a third-party app
// ("Make sure you trust superbot before authorizing."), the three scopes with GitLab's own scope strings (api: "Access
// the API on your behalf", read_repository: "Allows read-only access to the repository", write_repository: "Allows
// read-write access to the repository") as static rows (no accordion chevrons). X ad policy (zero control-shaped
// elements, no cursor): the card has NO button at all (no Authorize, Cancel or Deny) and no pointer; where GitLab's
// buttons sit, the card resolves on its own with a check and the status line "Authorized by kestrel-sre". The app's
// "created ... ago" line and the redirect note are omitted. No GitLab logo or tanuki anywhere: the app tile is the
// plain word.
// Then the sibling's connect-card grammar: a checklist card ("Connected as kestrel-sre", "Opened merge request !318",
// "Pipeline passed build, test and canary", "Rolled out to production") ticks in turn with a mini window under it; the
// card holds and the window opens into a SUPERBOT FRAME (policy: never a full-bleed native page): a superbot label bar
// ("superbot  GitLab, signed in as kestrel-sre") above a framed, margined window, the thread dimmed behind. In the
// window, GitLab's pipeline page for tallowpay/checkout-api in the anatomy of a live gitlab.com pipeline page
// (gitlab.com/gitlab-org/frontend/fonts/-/pipelines/2897199447 loaded headlessly, research/pipe-*.json): breadcrumb,
// the pipeline id heading, the status badge with "Created by kestrel-sre" (GitLab's own no-time variant of that line),
// "For commit <sha> <title>", "Related merge request !318 to merge fix/checkout-oomkill into main" (GitLab's
// ref_text wording; the refs, the SHA and the breadcrumb are neutral grey text, never link blue or chips), the job
// count, a plain "Pipeline" heading (no tab bar: no Jobs tab, no underline), and the pipeline graph: four stage
// columns (build, test, canary, production), each a grey card with the stage name and white job rows with GitLab's
// ci-icon. It settles with build, test and canary passed and deploy-production running; then THE bold moment (the
// chime, window.__AD_MARKS.chime): deploy-production flips to passed and the header badge flips from Running to
// Passed. The camera pushes in on the graph (the production column comes forward, the header leaves the top), and a
// small static superbot status card (text only) settles inside the frame. Omitted on purpose: every Retry / Cancel /
// Run pipeline / Merge / kebab / dropdown, per-job retry icons, the copy-SHA button, durations, "Queued", any
// relative or absolute time, the top bar's search and buttons and the left sidebar. Links render as plain text.
// One GitLab client, on a layer in the scene root (outside the camera), laid out once at a design size and scaled to
// the layer, so the mini window and the framed window are the same pixels at two sizes. On a portrait frame the
// stage columns wrap two to a row (GitLab's own narrow-panel wrap). Pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=cc72ade8';

export const GROUP = 'tallowpay';             // checked: gitlab.com groups/tallowpay 404, research/collisions.txt
export const PROJECT = 'checkout-api';
export const USER = 'kestrel-sre';            // checked: gitlab.com users?username=kestrel-sre returns []
const SAY = 'Rolling it out to production from your GitLab.';
const MR = '!318';
const BRANCH = 'fix/checkout-oomkill';
const PIPELINE = '#2913460718';
const SHA = '4f3a9c21';
const COMMIT = 'Raise checkout memory limit and add startup probe';
// the OAuth scopes superbot asks for: [scope, GitLab's own scope string (doorkeeper.scopes)]
const SCOPES = [
  ['api', 'Access the API on your behalf'],
  ['read_repository', 'Allows read-only access to the repository'],
  ['write_repository', 'Allows read-write access to the repository'],
];
const STEPS = [
  ['avatar', `Connected as <b>${USER}</b>`],
  ['git-pull-request', `Opened merge request ${MR}`],
  ['workflow', 'Pipeline passed build, test and canary'],
  ['rocket', 'Rolled out to production'],
];
// the pipeline graph: [stage, [jobs]]; every job but deploy-production has passed when the window opens
const STAGES = [
  ['build', ['build-image']],
  ['test', ['unit-tests', 'helm-lint', 'kubeconform']],
  ['canary', ['deploy-canary']],
  ['production', ['deploy-production']],
];
const JOBS = STAGES.reduce((n, [, j]) => n + j.length, 0);
const STATUS = ['Memory limit raised to 512Mi', 'Startup probe added, no more crash loops', '3 of 3 pods ready in production'];

const APP_SCALE = { wide: 1.15, tall: 1.2 };    // framed window: the client's px to frame px
// the superbot frame the window opens into: margins and the label bar above it (frame px)
const FRAME = { wide: { pad: 44, top: 112, bar: 44 }, tall: { pad: 22, top: 100, bar: 40 } };
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the sibling's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the authorize card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the authorize card landed to its resolution ("Authorized by ...")
const RES_IN = 0.28;                            // the resolution line rising in
const LIST_AT = 0.25;                           // the resolution to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.14;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens into the superbot frame
const LAND_AT = 0.5; /* deliberate */           // framed and settled (production running) to the flip: the chime
const FLIP = 0.3;                               // deploy-production's icon and the header badge changing over
const PUSH_IN = 0.6; /* deliberate */           // the camera push onto the graph, outQuint, from the flip
const PUSH = { wide: 1.3, tall: 1.3 };          // ...up to this many times the framed scale (capped so the graph fits)
// the status card (frame px): wide, at the window's lower right; tall, across the window's foot. `m` is its inner
// padding to the frame border
const CARD2 = { wide: { w: 600, m: 32 }, tall: { m: 28 } };
const GRAPH_M = { wide: 48, tall: 26 };         // pushed in, the graph's side margin inside the frame (frame px)
const CARD2_AT = 0.65; /* deliberate */         // the flip to the status card rising
const CARD2_IN = 0.36;                          // the status card rising
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the window's radius

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// GitLab's own icons (gitlab-org/gitlab-svgs, MIT; the sprite gitlab.com serves, fetched 2026-10-03), path data verbatim
const GLI = {
  success: '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M9.866 12.095l-1.95-1.95a.462.462 0 0 0-.647.01l-.964.964a.46.46 0 0 0-.01.646l3.013 3.014a.787.787 0 0 0 1.106.008l.425-.425 4.854-4.853a.462.462 0 0 0 .002-.659l-.964-.964a.468.468 0 0 0-.658.002l-4.207 4.207z"/></svg>',
  running: '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 4.714c3.457 0 6.286 2.829 6.286 6.286 0 3.457-2.829 6.286-6.286 6.286-2.043 0-3.929-1.1-5.186-2.672L11 11V4.714"/></svg>',
  warning: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.429 2.746a.5.5 0 0 0-.858 0L1.58 12.743a.5.5 0 0 0 .429.757h11.984a.5.5 0 0 0 .43-.757L8.428 2.746zm-2.144-.77C7.06.68 8.939.68 9.715 1.975l5.993 9.996c.799 1.333-.161 3.028-1.716 3.028H2.008C.453 15-.507 13.305.292 11.972l5.993-9.997zM9 11.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-5.75a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3z"/></svg>',
  pipeline: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.272 3.864a4.5 4.5 0 1 0-.1 8.314.75.75 0 1 0-.557-1.393 3 3 0 1 1 .066-5.543.75.75 0 1 0 .59-1.378zM11.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM6 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>',
};
// GitLab's ci-icon: a pale ring, the status disk, the glyph; `text` adds the status word (the header badge)
const ciIcon = (status, text = '') => `<span class="gl-ci gl-ci-${status}${text ? ' gl-ci-t' : ''}"><span class="gl-ci-d">${GLI[status]}</span>${text ? `<span class="gl-ci-w">${text}</span>` : ''}</span>`;
// GitLab's letter identicon (gl-avatar-identicon-bgN): the first letter on a tinted tile
const identicon = (ch, bg, cls = '') => `<span class="gl-av gl-av-bg${bg} ${cls}">${ch}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorize card lands
    T.tap = T.card + TAP_AT;                           // the card resolves: "Authorized by kestrel-sre"
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // framed
    T.land = T.full + LAND_AT;                         // deploy-production passes (the chime)
    T.card2 = T.land + CARD2_AT;                       // the status card rises
    T.settle = Math.max(T.land + PUSH_IN, T.card2 + CARD2_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.land });

    // ---- the authorize card in the chat (GitLab's /oauth/authorize, light) ----
    const say = x.el(`<div class="qc-say gc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-h"><strong>superbot</strong> is requesting access to your account on GitLab.</div>
      <div class="gc-who">${identicon('K', 1, 'gl-av-24 gl-av-round')}<strong>${USER}</strong></div>
      <div class="gc-alert">${GLI.warning}<span>Make sure you trust <strong>superbot</strong> before authorizing.</span></div>
      ${SCOPES.map(([sc, title]) => `<div class="gc-scope"><b>${esc(title)}</b><code>${sc}</code></div>`).join('')}
      <div class="gc-res">${CHECK.replace('gk-ck', 'gc-ck')}<span>Authorized by <strong>${USER}</strong></span></div>
    </div>`);
    const res = consent.querySelector('.gc-res'), resCk = res.querySelector('.gc-ck');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? `<span class="gk-ic gk-av">${identicon('K', 1, 'gl-av-20 gl-av-round')}</span>` : `<span class="gk-ic gk-oc">${lc(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the superbot frame: a scrim over the thread, the label bar, the framed window, the status card ----
    const scrim = x.el('<div class="gp-scrim" aria-hidden="true"></div>');
    const bar = x.el(`<div class="gp-bar" aria-hidden="true"><img class="gp-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><span>GitLab, signed in as ${USER}</span></div>`);
    const job = (name, last) => `<div class="gp-job">${last
      ? `<span class="gp-flip">${ciIcon('running')}${ciIcon('success')}</span>`
      : ciIcon('success')}<span class="gp-jn">${esc(name)}</span></div>`;
    const layer = x.el(`<div class="gp-full" aria-hidden="true"><div class="gp-app">
      <main class="gp-main">
        <div class="gp-crumb">${identicon('T', 4, 'gl-av-16')}<span>${GROUP}</span><i>/</i>${identicon('C', 3, 'gl-av-16')}<span>${PROJECT}</span><i>/</i><span>Pipelines</span><i>/</i><span>${PIPELINE}</span></div>
        <h1 class="gp-h1">${PIPELINE}</h1>
        <div class="gp-ln gp-stat"><span class="gp-badge">${ciIcon('running', 'Running')}${ciIcon('success', 'Passed')}</span><span>Created by <b>${USER}</b></span></div>
        <div class="gp-ln">For commit <code class="gp-sha">${SHA}</code><span class="gp-ct">${esc(COMMIT)}</span></div>
        <div class="gp-ln">Related merge request <b>${MR}</b> to merge <code class="gp-ref">${BRANCH}</code> into <code class="gp-ref">main</code></div>
        <div class="gp-ln gp-meta"><span class="gp-pill gp-pill-ok">latest</span><span class="gp-jobs">${GLI.pipeline}${JOBS} jobs</span></div>
        <h2 class="gp-sec">Pipeline</h2>
        <div class="gp-graph">
          ${STAGES.map(([stage, jobs], i) => `<div class="gp-col${i === STAGES.length - 1 ? ' gp-prod' : ''}"><div class="gp-ct2">${esc(stage)}</div><div class="gp-body">${jobs.map((j) => job(j, i === STAGES.length - 1)).join('')}</div></div>`).join('<i class="gp-link"></i>')}
        </div>
      </main>
    </div></div>`);
    const status = x.el(`<div class="gp-card2" aria-hidden="true">
      <div class="gp-c2h"><img class="gp-sb" src="${x.sbSrc}" alt=""/><b>${PROJECT} is live in production</b></div>
      ${STATUS.map((s) => `<div class="gp-c2r">${lc('circle-check')}<span>${esc(s)}</span></div>`).join('')}
    </div>`);
    x.root.append(scrim, layer, bar, status);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const tabsRow = $('.gp-sec'), cols = [...layer.querySelectorAll('.gp-col')], flip = $('.gp-flip'), badge = $('.gp-badge'), prod = $('.gp-prod');
    const [fRun, fOk] = [...flip.children], [bRun, bOk] = [...badge.children];

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', tall = false, F = null;
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const g = `${W}x${H}`;
      if (g === geo) return;
      geo = g;
      tall = W < H;
      const f = tall ? FRAME.tall : FRAME.wide;
      F = { x: f.pad, y: f.top, w: W - 2 * f.pad, h: H - f.top - f.pad, bar: f.bar };
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(F.w / s); AH = Math.round(F.h / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('gp-narrow', tall);
      shot.style.aspectRatio = `${F.w} / ${F.h}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
      status.classList.toggle('gp-c2-tall', tall);
      bar.style.left = `${F.x}px`; bar.style.width = `${F.w}px`;
      bar.style.top = `${F.y - f.bar - 12}px`; bar.style.height = `${f.bar}px`;
    };

    // a node's box in app px (offset chain inside the unscaled app), and the stage columns' union: what the push frames
    const boxInApp = (n) => {
      let gx = 0, gy = 0;
      for (let e = n; e && e !== app; e = e.offsetParent) { gx += e.offsetLeft; gy += e.offsetTop; }
      return { x: gx, y: gy, w: n.offsetWidth, h: n.offsetHeight };
    };
    const colsBox = () => {
      const bs = cols.map(boxInApp);
      const x0 = Math.min(...bs.map((q) => q.x)), y0 = Math.min(...bs.map((q) => q.y));
      const x1 = Math.max(...bs.map((q) => q.x + q.w)), y1 = Math.max(...bs.map((q) => q.y + q.h));
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // the resolution: no button, no press; the check and "Authorized by kestrel-sre" rise in where GitLab's buttons sit
        const rs = outCubic(seg(t, T.tap, T.tap + RES_IN));
        res.style.opacity = rs.toFixed(3);
        res.style.transform = rs >= 1 ? 'none' : `translateY(${((1 - rs) * 6).toFixed(2)}px)`;
        const rk = outCubic(seg(t, T.tap + 0.06, T.tap + 0.06 + POP));
        resCk.style.transform = `scale(${lerp(0.4, 1, rk).toFixed(4)})`;

        const li = outCubic(seg(t, T.list, T.list + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the flip: deploy-production's running icon gives way to the passed check, the header badge from Running to
        // Passed, and the production column takes the success ring
        const fp = outCubic(seg(t, T.land, T.land + FLIP));
        fRun.style.opacity = (1 - fp).toFixed(3);
        fOk.style.opacity = fp.toFixed(3);
        fOk.style.transform = fp >= 1 ? 'none' : `scale(${lerp(0.5, 1, fp).toFixed(4)})`;
        bRun.style.display = fp >= 0.5 ? 'none' : '';
        bOk.style.display = fp >= 0.5 ? '' : 'none';
        badge.style.opacity = (1 - 0.8 * Math.sin(Math.PI * fp)).toFixed(3);
        prod.classList.toggle('gp-hl', t >= T.land);

        // the status card: settles in once (a small scale-up anchored on its foot), then holds still (static, text only)
        const c2 = outCubic(seg(t, T.card2, T.card2 + CARD2_IN));
        status.style.opacity = c2.toFixed(3);
        status.style.transform = c2 >= 1 ? 'none' : `scale(${lerp(0.95, 1, c2).toFixed(4)})`;
      },
      // after the camera: pin the layer over the card's window, then open it into the superbot frame
      after(t) {
        if (t < T.list || !F) { layer.style.opacity = '0'; scrim.style.opacity = '0'; bar.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, F.x, g), Tp = lerp(b.y, F.y, g), Wd = lerp(b.w, F.w, g), Ht = lerp(b.h, F.h, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        const rad = lerp(6 * (b.w / Math.max(1, shot.offsetWidth)), RADIUS, g);
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        const k0 = Wd / AW;

        // the status card's place (frame px): wide, the window's lower right; tall, across the window's foot
        const foot = x.root.offsetHeight - (F.y + F.h);
        let cardTop;
        if (tall) {
          const m = CARD2.tall.m;
          status.style.left = `${F.x + m}px`; status.style.width = `${F.w - 2 * m}px`; status.style.bottom = `${foot + m}px`;
          cardTop = F.h - m - status.offsetHeight;
        } else {
          const c = CARD2.wide;
          status.style.left = `${F.x + F.w - c.w - c.m}px`; status.style.width = `${c.w}px`; status.style.bottom = `${foot + c.m}px`;
          cardTop = F.h - c.m - status.offsetHeight;
        }

        // the push: onto the stage columns, scaled up to PUSH x the framed scale but never wider than the frame minus its
        // margins, centred across the window and centred in the room above the status card
        const z = outQuint(seg(t, T.land, T.land + PUSH_IN));
        if (z > 0) {
          const gb = colsBox();
          const gm = tall ? GRAPH_M.tall : GRAPH_M.wide;
          const ks1 = Math.min(k0 * (tall ? PUSH.tall : PUSH.wide), (F.w - 2 * gm) / gb.w);
          const ks = lerp(k0, ks1, z);
          const x1 = (F.w - ks1 * gb.w) / 2;
          // both ratios: the Pipeline heading lands 16 px under the window's top, so the header rows above it leave
          // the window whole (no sliver at the edge); on the tall frame the graph then still clears the status card
          const y1 = 16 + ks1 * (gb.y - boxInApp(tabsRow).y);
          const px = lerp(k0 * gb.x, x1, z), py = lerp(k0 * gb.y, y1, z);
          app.style.transform = `translate(${(px - ks * gb.x).toFixed(2)}px, ${(py - ks * gb.y).toFixed(2)}px) scale(${ks.toFixed(5)})`;
        } else app.style.transform = `scale(${k0.toFixed(5)})`;

        // while the window still sits in the chat it is clipped to the thread's viewport
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        scrim.style.opacity = g.toFixed(3);
        bar.style.opacity = outCubic(seg(t, T.grow + GROW * 0.5, T.full + 0.15)).toFixed(3);
      },
    };
  },
};
