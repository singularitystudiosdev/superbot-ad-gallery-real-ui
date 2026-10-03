// GitHub beat, the finale: superbot ships the fix from the user's own GitHub. Its line streams and GitHub's OAuth
// authorize page lands in the chat as a card, GitHub dark (github.com/login/oauth/authorize): superbot's tile and the
// GitHub mark joined by the dotted connector, "Authorize superbot", "superbot by superbot-gg wants to access your
// mirachen account", two permission rows in GitHub's own scope wording (Repositories / Public and private for `repo`,
// Workflow for `workflow`, docs.github.com, see brand/CREDITS.txt), Cancel and the green "Authorize superbot". The
// pointer presses it, and the base's connect-card grammar follows: a checklist card ("Connected as mirachen", "Pushed
// fix/482-session-refresh", "Opened pull request #483", "4 of 4 checks passed", "Merged into main, #482 closed")
// ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW).
// Full frame is the pull request page on github.com, dark theme, Conversation tab: the global header, the repo nav
// (Pull requests selected), the PR title with its green Open label, the tabs with the diffstat, the timeline (the PR
// body, the commit) and the merge box. The four CI checks flip from GitHub's yellow pending dot to the green check one
// after another, the header becomes "All checks have passed", the pointer presses "Merge pull request", then "Confirm
// merge". The ONE bold moment (the chime, window.__AD_MARKS.chime): the state label flips from green Open to purple
// Merged, the meta says "merged", the merge box becomes "Pull request successfully merged and closed", a timeline row
// "mirachen merged commit 3f9c21a into main now" opens, and the linked issue's icon turns to the purple closed one.
// The camera then pushes in on the page (title, Merged label, merged row, merged box) and holds; the final state
// holds (READ).
//
// There is ONE GitHub client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the sidebar, the PR body and the long
// repo nav. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { oct, identicon } from './gh-icons.js?v=0cb69286';
import { ISSUE } from './repo.js?v=0cb69286';

const SAY = 'Shipping it from your GitHub, as you.';
const USER = 'mirachen';
const ORG = 'kitebase', REPO = 'web';
const BRANCH = 'fix/482-session-refresh';
const PR = { n: 483, title: 'Fix random logouts: refresh the session before it expires', sha: '3f9c21a',
  body: 'Closes #482. Refreshes the session 60 s before it expires and shares one refresh across open tabs. Adds a Remember me test that runs past 15 minutes.',
  commit: 'Refresh the session before it expires, one refresh across tabs' };
// GitHub's authorize-page permission rows for the two scopes superbot asks for (repo, workflow): the row title, then
// its detail line (docs.github.com "Authorizing OAuth apps" / "Scopes for OAuth apps", fetched 2026-10-03)
const SCOPES = [
  ['repo', 'Repositories', 'Public and private'],
  ['workflow', 'Workflow', 'Add and update GitHub Actions workflow files'],
];
const STEPS = [
  ['avatar', `Connected as <b>${USER}</b>`],
  ['repo-push', `Pushed <code>${BRANCH}</code>`],
  ['git-pull-request', `Opened pull request #${PR.n}`],
  ['check-circle-fill', '4 of 4 checks passed'],
  ['git-merge', `Merged into main, #${ISSUE.n} closed`],
];
// the four CI checks and their run times
const CHECKS = [['build', '1m 12s'], ['test', '2m 04s'], ['lint', '38s'], ['e2e', '3m 21s']];
// the repo nav: [octicon, label, counter, selected, wide-only]
const NAV = [
  ['code', 'Code'], ['issue-opened', 'Issues', '37'], ['git-pull-request', 'Pull requests', '8', true], ['play', 'Actions'],
  ['table', 'Projects', '', false, true], ['shield', 'Security and quality', '', false, true], ['graph', 'Insights', '', false, true],
  ['gear', 'Settings', '', false, true],
];

const APP_SCALE = { wide: 1.2, tall: 1.2 };     // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the authorize card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the authorize card landed to the press on Authorize (it reads first)
const PTR_IN = 0.3;                             // the authorize card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const CI_AT = 0.15;                             // full frame to the first CI check going green
const CI_STAGGER = 0.13;                        // one CI check to the next
const CI_IN = 0.16;                             // a dot giving way to the check
const MP_AT = 0.32; /* deliberate */            // the last check green to the press on Merge pull request
const MP_MOVE = 0.4;                            // the pointer's travel onto Merge pull request
const CM_AT = 0.38;                             // Merge pull request pressed to Confirm merge pressed
const MERGE_AT = 0.12;                          // Confirm merge pressed to the merge landing (the chime)
const MERGE_IN = 0.36;                          // the label, the meta and the merge box changing over
const ROW_IN = 0.36;                            // the merged timeline row opening
const READ = 1.4; /* deliberate */              // the final state holds, readable, before the scene's fade
// the payoff push: at the merge the camera pushes in on the page (the base's pill push: PUSH 0.5 s, outQuint) and holds
// to the end card. Wide: the content column fills the frame and the sidebar leaves it whole (its left edge lands on the
// frame's right edge); tall: 1.55x the full-frame scale, anchored on the content's top left
const PUSH_IN = 0.5; /* deliberate */          // chat.js PUSH
const PUSH_TALL = 1.55; /* deliberate */
const PUSH_X_TALL = 24;                         // tall: the content's left edge, frame px from the frame's left
const RADIUS = 6;                               // the card's window radius (Primer medium), eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const branch = (b) => `<code class="gh-ref">${esc(b)}</code>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorize card lands
    T.tap = T.card + TAP_AT;                           // Authorize superbot is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.ci = CHECKS.map((_, i) => T.full + CI_AT + i * CI_STAGGER); // the CI checks go green, top to bottom
    T.allOk = T.ci[CHECKS.length - 1] + CI_IN;         // "All checks have passed"
    T.mp = T.allOk + MP_AT;                            // Merge pull request pressed
    T.cm = T.mp + CM_AT;                               // Confirm merge pressed
    T.merge = T.cm + MERGE_AT;                         // merged (the chime)
    T.settle = T.merge + Math.max(MERGE_IN, ROW_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.merge });
    const markTile = `<span class="ga-gh">${oct('mark-github')}</span>`;

    // ---- the authorize card in the chat (GitHub's OAuth authorize page, dark) ----
    const say = x.el(`<div class="qc-say ga-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="ga-card">
      <div class="ga-logos">${x.tile('superbot', 'ga-sb')}<i class="ga-dots"></i>${markTile}</div>
      <div class="ga-title">Authorize superbot</div>
      <div class="ga-box">
        <div class="ga-who">${x.tile('superbot', 'ga-sb-s')}<span><b>superbot</b> by <a>superbot-gg</a><br/>wants to access your <b>${USER}</b> account</span></div>
        ${SCOPES.map(([ic, title, sub]) => `<div class="ga-row">${oct(ic, 'ga-ri')}<span><b>${esc(title)}</b><small>${esc(sub)}</small></span></div>`).join('')}
        <div class="ga-btns"><span class="ga-b ga-cancel">Cancel</span><span class="ga-b ga-go">Authorize superbot</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.ga-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? `<span class="gk-ic gk-av">${identicon(USER)}</span>` : `<span class="gk-ic gk-oc">${oct(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame GitHub client: the pull request page, Conversation tab ----
    const avatar = (cls = '') => `<span class="gh-av ${cls}">${identicon(USER)}</span>`;
    const ciRow = ([job, dur]) => `<div class="gh-ci"><span class="gh-cs">${oct('dot-fill', 'gh-pend')}${oct('check', 'gh-pass')}</span>
      <span class="gh-cn"><b>CI / ${job} (push)</b><span class="gh-cd"><span class="gh-cq">In progress</span><span class="gh-cp">Successful in ${dur}</span></span></span><a class="gh-det">Details</a></div>`;
    const layer = x.el(`<div class="gh-full" aria-hidden="true"><div class="gh-app">
      <header class="gh-top">
        <div class="gh-bar">
          <span class="gh-ib gh-ham">${oct('three-bars')}</span>
          <span class="gh-logo">${oct('mark-github')}</span>
          <span class="gh-crumb"><a>${ORG}</a><i>/</i><a><b>${REPO}</b></a></span>
          <span class="gh-tools">
            <span class="gh-search">${oct('search')}<span class="gh-sl">Type <kbd>/</kbd> to search</span></span>
            <span class="gh-sep"></span>
            <span class="gh-ib gh-wide">${oct('copilot')}</span>
            <span class="gh-ib gh-plus gh-wide">${oct('plus')}${oct('triangle-down')}</span>
            <span class="gh-ib gh-wide">${oct('issue-opened')}</span>
            <span class="gh-ib gh-wide">${oct('git-pull-request')}</span>
            <span class="gh-ib">${oct('inbox')}</span>
            ${avatar('gh-me')}
          </span>
        </div>
        <nav class="gh-nav">${NAV.map(([ic, label, n, on, wide]) => `<span class="gh-nv${on ? ' gh-on' : ''}${wide ? ' gh-wide' : ''}">${oct(ic)}<span>${esc(label)}</span>${n ? `<i class="gh-ctr">${n}</i>` : ''}</span>`).join('')}</nav>
      </header>
      <main class="gh-page">
        <div class="gh-head">
          <h1 class="gh-h1"><span>${esc(PR.title)}</span> <em>#${PR.n}</em></h1>
          <div class="gh-state">
            <span class="gh-lbl-cell"><i class="gh-lbg"></i><span class="gh-lbl gh-open">${oct('git-pull-request')}Open</span><span class="gh-lbl gh-merged">${oct('git-merge')}Merged</span></span>
            <span class="gh-meta-cell">
              <span class="gh-meta gh-m0"><b>${USER}</b> wants to merge 1 commit into ${branch('main')} from ${branch(BRANCH)}</span>
              <span class="gh-meta gh-m1"><b>${USER}</b> merged 1 commit into ${branch('main')} from ${branch(BRANCH)}</span>
            </span>
          </div>
          <div class="gh-tabs">
            <span class="gh-tab gh-tab-on">${oct('comment')}Conversation<i class="gh-ctr">0</i></span>
            <span class="gh-tab gh-wide">${oct('git-commit')}Commits<i class="gh-ctr">1</i></span>
            <span class="gh-tab">${oct('checklist')}Checks<i class="gh-ctr">4</i></span>
            <span class="gh-tab">${oct('file-diff')}Files changed<i class="gh-ctr">3</i></span>
            <span class="gh-dstat"><b class="gh-add">+24</b><b class="gh-del">−6</b><i class="gh-sq a"></i><i class="gh-sq a"></i><i class="gh-sq a"></i><i class="gh-sq a"></i><i class="gh-sq d"></i></span>
          </div>
        </div>
        <div class="gh-cols">
          <section class="gh-tl">
            <div class="gh-item gh-body">${avatar('gh-av40')}
              <div class="gh-cbox"><div class="gh-chd"><b>${USER}</b> commented now<span class="gh-own">Author</span>${oct('kebab-horizontal', 'gh-keb')}</div>
                <div class="gh-cbd">${esc(PR.body)}</div></div>
            </div>
            <div class="gh-ev gh-commit"><span class="gh-badge">${oct('git-commit')}</span>${avatar('gh-av20')}<span class="gh-cmsg">${esc(PR.commit)}</span>
              <span class="gh-cstat">${oct('check', 'gh-cst')}</span><code class="gh-sha">${PR.sha}</code></div>
            <div class="gh-mslot"><div class="gh-ev gh-mev"><span class="gh-badge gh-badge-m">${oct('git-merge')}</span>${avatar('gh-av20')}
              <span><b>${USER}</b> merged commit <code class="gh-sha-i">${PR.sha}</code> into ${branch('main')} now</span></div></div>
            <div class="gh-mcell">
              <div class="gh-mbox">
                <span class="gh-mbadge">${oct('git-merge-24')}</span>
                <div class="gh-box">
                  <div class="gh-sec gh-sec-ci">
                    <span class="gh-sico">${oct('dot-fill', 'gh-pend gh-hp')}${oct('check-circle-fill-24', 'gh-pass gh-hk')}</span>
                    <div class="gh-stx"><b class="gh-h-a">Some checks haven't completed yet</b><b class="gh-h-b">All checks have passed</b>
                      <small class="gh-s-a">4 in progress checks</small><small class="gh-s-b">4 successful checks</small></div>
                  </div>
                  <div class="gh-cil">${CHECKS.map(ciRow).join('')}</div>
                  <div class="gh-sec">
                    <span class="gh-sico">${oct('check-circle-fill-24', 'gh-pass gh-on')}</span>
                    <div class="gh-stx"><b>This branch has no conflicts with the base branch</b><small>Merging can be performed automatically.</small></div>
                  </div>
                  <div class="gh-sec gh-sec-go">
                    <span class="gh-mb-cell"><span class="gh-btn gh-pri gh-mb0"><span>Merge pull request</span><i>${oct('triangle-down')}</i></span><span class="gh-mb1"><span class="gh-btn gh-pri gh-cfm">Confirm merge</span><span class="gh-btn">Cancel</span></span></span>
                    <small class="gh-cli">You can also merge this with the command line.</small>
                  </div>
                </div>
              </div>
              <div class="gh-done">
                <span class="gh-mbadge gh-mbadge-m">${oct('git-merge-24')}</span>
                <div class="gh-box gh-dbox"><div class="gh-sec">
                  <div class="gh-stx"><b>Pull request successfully merged and closed</b><small>You're all set. The ${branch(BRANCH)} branch can be safely deleted.</small></div>
                  <span class="gh-btn gh-del-b">Delete branch</span>
                </div></div>
              </div>
            </div>
          </section>
          <aside class="gh-side">
            <div class="gh-sb"><h3>Reviewers</h3><p class="gh-mut">No reviews</p></div>
            <div class="gh-sb"><h3>Assignees</h3><p class="gh-asg">${avatar('gh-av20')}<b>${USER}</b></p></div>
            <div class="gh-sb"><h3>Labels</h3><p><i class="gh-lab gh-bug">bug</i><i class="gh-lab gh-auth">auth</i></p></div>
            <div class="gh-sb"><h3>Development</h3><p class="gh-mut">Successfully merging this pull request may close these issues.</p>
              <p class="gh-dev"><span class="gh-dic">${oct('issue-opened', 'gh-io')}${oct('issue-closed', 'gh-ic')}</span><span>${esc(ISSUE.title)}</span></p></div>
          </aside>
        </div>
      </main>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const ciRows = [...layer.querySelectorAll('.gh-ci')].map((n) => ({
      pend: n.querySelector('.gh-pend'), pass: n.querySelector('.gh-pass'), q: n.querySelector('.gh-cq'), p: n.querySelector('.gh-cp'),
    }));
    const hp = $('.gh-hp'), hk = $('.gh-hk'), hA = $('.gh-h-a'), hB = $('.gh-h-b'), sA = $('.gh-s-a'), sB = $('.gh-s-b');
    const mb0 = $('.gh-mb0'), mb1 = $('.gh-mb1'), cfm = $('.gh-cfm'), cli = $('.gh-cli');
    const open = $('.gh-open'), merged = $('.gh-merged'), lblCell = $('.gh-lbl-cell'), lbg = $('.gh-lbg');
    const m0 = $('.gh-m0'), m1 = $('.gh-m1');
    const mbox = $('.gh-mbox'), done = $('.gh-done');
    const mslot = $('.gh-mslot'), mev = $('.gh-mev');
    const io = $('.gh-io'), ic = $('.gh-ic');
    const tl = $('.gh-tl'), side = $('.gh-side'), top = $('.gh-top');
    const cst = $('.gh-cst');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, slotH = '', lblW = '';
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('gh-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('ga-tall', tall);
      slotH = ''; lblW = '';
    };

    // the pointer: in the chat, onto Authorize superbot and a press; on the full frame, onto Merge pull request,
    // a press, then Confirm merge (in the same place) and a press, then away
    const ptr = (t) => {
      if (t >= T.card + PTR_IN && t <= T.tap + 0.45) {
        const a = T.card + PTR_IN, b = T.tap - 0.08;
        const g = x.box(go);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      const a = T.mp - MP_MOVE - 0.12;
      if (t >= a && t <= T.merge + 0.5) {
        const g0 = x.box(mb0), g1 = x.box(cfm);
        if (!g0.w) return null;
        // onto Merge pull request, then across to Confirm merge (where the same click lands next)
        const k = inOutCubic(seg(t, T.mp + 0.16, T.cm - 0.1));
        const ex = lerp(g0.x + g0.w * 0.45, g1.x + g1.w * 0.5, k), ey = lerp(g0.y, g1.y, k) + g0.h * 0.62;
        const m = inOutCubic(seg(t, a, T.mp - 0.08));
        const leave = outCubic(seg(t, T.merge + 0.15, T.merge + 0.5));
        return {
          x: lerp(ex + 220, ex, m) + leave * 60, y: lerp(ey + 160, ey, m) + leave * 50,
          p: Math.max(press(t, T.mp), press(t, T.cm)), v: seg(t, a, a + 0.12) * (1 - leave),
        };
      }
      return null;
    };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Authorize superbot: the press, then it stays in its pressed (active) tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('ga-hit', t >= T.tap);

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

        // the CI checks: GitHub's yellow pending dot gives way to the green check, one after another
        ciRows.forEach((c, i) => {
          const o = outCubic(seg(t, T.ci[i], T.ci[i] + CI_IN));
          c.pend.style.opacity = (1 - o).toFixed(3);
          c.pass.style.opacity = o.toFixed(3);
          c.pass.style.transform = o >= 1 ? 'none' : `scale(${lerp(0.5, 1, o).toFixed(4)})`;
          c.q.style.display = t >= T.ci[i] ? 'none' : '';
          c.p.style.display = t >= T.ci[i] ? 'inline' : 'none';
        });
        const all = outCubic(seg(t, T.allOk - 0.04, T.allOk + CI_IN));
        hp.style.opacity = (1 - all).toFixed(3);
        hk.style.opacity = all.toFixed(3);
        const allOn = t >= T.allOk;
        hA.style.display = allOn ? 'none' : ''; sA.style.display = allOn ? 'none' : '';
        hB.style.display = allOn ? '' : 'none'; sB.style.display = allOn ? '' : 'none';
        cst.style.opacity = all.toFixed(3);

        // Merge pull request: pressed, then the same place offers Confirm merge (with Cancel), pressed in turn
        const p1 = press(t, T.mp), p2 = press(t, T.cm);
        const conf = outCubic(seg(t, T.mp + 0.08, T.mp + 0.22));
        mb0.style.opacity = (1 - conf).toFixed(3);
        mb1.style.opacity = conf.toFixed(3);
        mb0.style.transform = p1 ? `scale(${(1 - 0.05 * p1).toFixed(4)})` : 'none';
        cfm.style.transform = p2 ? `scale(${(1 - 0.05 * p2).toFixed(4)})` : 'none';
        cfm.classList.toggle('gh-hit', t >= T.cm);
        cli.style.opacity = (1 - conf).toFixed(3);

        // the merge: the state label, the meta, the merge box and the linked issue change over; the merged row opens
        // the state label: the purple fill rises over the green one while the word swaps out-then-in
        const m = inOutCubic(seg(t, T.merge, T.merge + MERGE_IN));
        const lin = seg(t, T.merge, T.merge + MERGE_IN);
        const out = outCubic(seg(lin, 0, 0.45)), inn = outCubic(seg(lin, 0.45, 1));
        lbg.style.opacity = m.toFixed(3);
        open.style.opacity = (1 - out).toFixed(3);
        merged.style.opacity = inn.toFixed(3);
        const wO = open.offsetWidth, wM = merged.offsetWidth;
        const lw = m <= 0 ? `${wO}px` : m >= 1 ? `${wM}px` : `${lerp(wO, wM, m).toFixed(2)}px`;
        if (lw !== lblW) { lblCell.style.width = lw; lblW = lw; }
        // the meta line and the merge box swap out-then-in (two texts never sit on top of each other)
        m0.style.opacity = (1 - out).toFixed(3);
        m1.style.opacity = inn.toFixed(3);
        mbox.style.opacity = (1 - out).toFixed(3);
        done.style.opacity = inn.toFixed(3);
        done.style.transform = inn >= 1 ? 'none' : `translateY(${((1 - inn) * 6).toFixed(2)}px)`;
        io.style.opacity = (1 - m).toFixed(3);
        ic.style.opacity = m.toFixed(3);
        const g = inOutCubic(seg(t, T.merge, T.merge + ROW_IN));
        const h = mev.offsetHeight;
        const sh = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
        if (sh !== slotH) { mslot.style.height = sh; slotH = sh; }
        mev.style.opacity = outCubic(seg(t, T.merge + ROW_IN * 0.3, T.merge + ROW_IN)).toFixed(3);
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const k0 = Wd / AW;
        const z = g >= 1 ? outQuint(seg(t, T.merge, T.merge + PUSH_IN)) : 0;
        if (z > 0) {
          // the frame's anchor: the content column's left edge and the header's bottom edge, in the client's design px
          const ar = app.getBoundingClientRect(), k = ar.width / AW;
          const d = (n) => { const r = n.getBoundingClientRect(); return { l: (r.left - ar.left) / k, r: (r.right - ar.left) / k, t: (r.top - ar.top) / k, b: (r.bottom - ar.top) / k }; };
          const c = d(tl), h = d(top);
          let s, x0;
          if (app.classList.contains('gh-narrow')) { s = k0 * PUSH_TALL; x0 = PUSH_X_TALL; }
          else {
            // margins equal to the column gap, so the sidebar's left edge lands exactly on the frame's right edge
            const gap = d(side).l - c.r;
            s = W / (c.r - c.l + 2 * gap); x0 = gap * s;
          }
          const ks = lerp(k0, s, z);
          const px = lerp(k0 * c.l, x0, z), py = lerp(k0 * h.b, 0, z);
          app.style.transform = `translate(${(px - ks * c.l).toFixed(2)}px, ${(py - ks * h.b).toFixed(2)}px) scale(${ks.toFixed(5)})`;
        } else app.style.transform = `scale(${k0.toFixed(5)})`;
        // the sidebar leaves the frame with the push (its avatars' 1 px rings would otherwise graze the frame's edge)
        side.style.opacity = (1 - z).toFixed(3);
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
