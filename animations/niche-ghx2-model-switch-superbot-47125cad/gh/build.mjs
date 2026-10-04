// gh/build.mjs : generates gh/issue-482.html and gh/pr-483-commits.html (self-contained fragments with every
// Octicon inlined from gh/icons/*.svg, so `fill: currentColor` works once the fragment is injected).
//   node gh/build.mjs
// The fragments are the deliverable; this script is only how they are made. Edit copy here, then re-run.
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ICONS = path.join(HERE, 'icons');

const octCache = new Map();
function oct(name, cls = '', size = 16) {
  if (!octCache.has(name)) {
    const svg = fs.readFileSync(path.join(ICONS, `${name}-16.svg`), 'utf8');
    octCache.set(name, svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''));
  }
  return `<svg class="octicon octicon-${name}${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true">${octCache.get(name)}</svg>`;
}
const av = (file, size, cls = '') =>
  `<span class="gh-av${cls ? ' ' + cls : ''}" style="--s:${size}px"><img src="img/${file}" alt="" onerror="this.classList.add('gh-broken')"></span>`;

// ---------------------------------------------------------------- story strings (bible + original ad)
const ORG = 'kitebase', REPO = 'web';
const ISSUE = { n: 482, title: 'Users get logged out at random' };
const PR = { n: 483, title: 'Fix random logouts: refresh the session before it expires', branch: 'fix/482-session-refresh' };
const COMMITS = [
  ['Gemini', 'avatar-gemini.png', '9b1e4d2', 'Add failing repro for #482: two tabs refresh one session'],
  ['Claude Opus 5.5', 'avatar-opus.png', '3f9c21a', 'Refresh the session before it expires, add Remember me test'],
  ['GPT-6 Astra', 'avatar-astra.png', 'c47a0e8', 'Review fixes: release the refresh lock on logout'],
  ['superbot', 'avatar-superbot.png', '5d02b7f', 'Update CHANGELOG for #482'],
];
const CHECKS = [
  ['CI / build (push)', 'Successful in 41s'],
  ['CI / test (push)', 'Successful in 1m 12s (214 passed)'],
  ['CI / e2e (push)', 'Successful in 2m 3s'],
  ['CodeQL / Analyze (javascript)', 'Successful in 1m 48s'],
];
const NAV = [
  ['code', 'Code'], ['issue-opened', 'Issues', '41'], ['git-pull-request', 'Pull requests', '12'], ['play', 'Actions'],
  ['table', 'Projects'], ['book', 'Wiki'], ['shield', 'Security and quality'], ['graph', 'Insights'], ['gear', 'Settings'],
];

// ---------------------------------------------------------------- browser chrome (not GitHub UI: the window frame)
const CH = {
  x: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 9H3.5M8 4L3 9l5 5"/></svg>',
  fwd: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h11.5M10 4l5 5-5 5"/></svg>',
  reload: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 9a5.5 5.5 0 1 1-1.7-4"/><path d="M13.6 2.2v3.3h-3.3"/></svg>',
  tune: '<svg class="gh-tune" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 5h6M12.5 5h1M2.5 11h1M7.5 11h6"/><circle cx="10.5" cy="5" r="1.8"/><circle cx="5.5" cy="11" r="1.8"/></svg>',
  star: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M9 2.3l2 4.2 4.6.6-3.4 3.2.9 4.6L9 12.6l-4.1 2.3.9-4.6-3.4-3.2 4.6-.6z"/></svg>',
  dots: '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><circle cx="9" cy="3.8" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="9" cy="14.2" r="1.5"/></svg>',
};
function chrome(tabTitle, host, pathPart) {
  return `<div class="gh-chrome">
    <div class="gh-tabstrip">
      <span class="gh-lights"><i></i><i></i><i></i></span>
      <span class="gh-tab-c">${oct('mark-github', 'gh-fav')}<span class="gh-tab-t">${tabTitle}</span><span class="gh-tab-x">${CH.x}</span></span>
      <span class="gh-tab-new">${CH.plus}</span>
    </div>
    <div class="gh-toolbar">
      <span class="gh-tb">${CH.back}</span><span class="gh-tb gh-dim">${CH.fwd}</span><span class="gh-tb">${CH.reload}</span>
      <span class="gh-omni">${CH.tune}<span class="gh-url"><span class="gh-url-h">${host}</span><span class="gh-url-p">${pathPart}</span></span></span>
      <span class="gh-tb">${CH.star}</span>
      <span class="gh-me-chip">${av('avatar-mirachen.png', 22)}</span>
      <span class="gh-tb">${CH.dots}</span>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- GitHub AppHeader (logged in as mirachen)
function appHeader(selected) {
  const nav = NAV.map(([ic, label, n]) =>
    `<a class="gh-rn${label === selected ? ' gh-on' : ''}">${oct(ic)}<span>${label}</span>${n ? `<span class="gh-ctr">${n}</span>` : ''}</a>`).join('');
  return `<header class="gh-appheader">
      <div class="gh-globalbar">
        <div class="gh-gb-start">
          <span class="gh-hbtn">${oct('three-bars')}</span>
          <a class="gh-logo">${oct('mark-github', '', 32)}</a>
          <nav class="gh-crumbs"><a>${ORG}</a><span class="gh-crumb-sep">/</span><a class="gh-crumb-last">${REPO}</a><span class="gh-switch">${oct('triangle-down')}</span></nav>
        </div>
        <div class="gh-gb-end">
          <span class="gh-search">${oct('search')}<span>Type <kbd>/</kbd> to search</span></span>
          <span class="gh-gb-div"></span>
          <span class="gh-hbtn gh-split"><span>${oct('copilot')}</span><span>${oct('triangle-down')}</span></span>
          <span class="gh-hbtn gh-wide">${oct('plus')}${oct('triangle-down')}</span>
          <span class="gh-hbtn">${oct('issue-opened')}</span>
          <span class="gh-hbtn">${oct('git-pull-request')}</span>
          <span class="gh-hbtn gh-hbtn-ind">${oct('inbox')}</span>
          ${av('avatar-mirachen.png', 32, 'gh-me')}
        </div>
      </div>
      <div class="gh-localbar"><nav class="gh-repnav">${nav}</nav></div>
    </header>`;
}

// ---------------------------------------------------------------- issue #482
function issuePage() {
  const tab = `${ISSUE.title} · Issue #${ISSUE.n} · ${ORG}/${REPO}`;
  return `<!-- gh/issue-482.html : GitHub issue page, Dark default. Styles: gh/screens.css (scoped under .gh).
     Inject into the ad's index.html (img/ paths resolve from the ad folder root). Generated by gh/build.mjs.
     #gh-issue-link-event: data-state="hidden" | "shown" (also reveals the #483 chip, Development entry, participant). -->
<div class="gh gh-window" id="gh-issue" style="--gh-scroll:0px">
  ${chrome(tab, 'github.com', `/${ORG}/${REPO}/issues/${ISSUE.n}`)}
  <div class="gh-viewport"><div class="gh-page">
    ${appHeader('Issues')}
    <main class="gh-is-main">
      <div class="gh-is-head">
        <h1 class="gh-is-title">${ISSUE.title} <span class="gh-num">#${ISSUE.n}</span></h1>
        <div class="gh-is-actions"><span class="gh-btn-primary">New issue</span><span class="gh-ibtn">${oct('copy')}</span></div>
      </div>
      <div class="gh-is-meta">
        <span class="gh-state gh-state-open">${oct('issue-opened')}Open</span>
        <span class="gh-is-chip gh-when-linked">${oct('git-pull-request')}#${PR.n}</span>
      </div>
      <div class="gh-is-cols">
        <div class="gh-is-thread">
          <div class="gh-cbox">
            <div class="gh-cbox-h">${av('avatar-mirachen.png', 24)}<span><b>mirachen</b> opened on Oct 1</span><span class="gh-sp"></span><span class="gh-lbl">Member</span><span class="gh-ibtn gh-sm">${oct('kebab-horizontal')}</span></div>
            <div class="gh-cbox-b">
              <p>Since 2.14 shipped, people get signed out of the web app at random, often in the middle of a task, even with <b>Remember me</b> checked. It happens most with two or more tabs open: the next request after the 15 minute token refresh lands on <code>/login</code>.</p>
            </div>
            <div class="gh-react"><span><em>👍</em>14</span><span><em>👀</em>3</span></div>
          </div>
          <div class="gh-tl">
            <div class="gh-tl-ev"><span class="gh-tl-badge">${oct('tag')}</span>${av('avatar-mirachen.png', 20)}<span><b>mirachen</b> added</span><span class="gh-label gh-label-bug">bug</span><span class="gh-label gh-label-auth">auth</span><span class="gh-date">on Oct 1</span></div>
          </div>
          <div class="gh-cbox">
            <div class="gh-cbox-h">${av('avatar-c1.png', 24)}<span><b>jonas-berg</b> commented on Oct 2</span><span class="gh-sp"></span><span class="gh-ibtn gh-sm">${oct('kebab-horizontal')}</span></div>
            <div class="gh-cbox-b"><p>Same here. Two tabs on the dashboard refresh at the same moment and the second one signs me out.</p></div>
          </div>
          <div class="gh-tl">
            <div class="gh-tl-ev" id="gh-issue-link-event" data-state="hidden"><span class="gh-tl-badge">${oct('cross-reference')}</span>${av('avatar-superbot.png', 20)}<span class="gh-tl-tx"><b>superbot</b> linked a pull request that will close this issue <a class="gh-prref">${oct('git-pull-request')}${PR.title} #${PR.n}</a> <span class="gh-date">on Oct 3</span></span></div>
          </div>
        </div>
        <aside class="gh-is-side">
          <div class="gh-side-sec"><h3 class="gh-side-h">Assignees</h3><div class="gh-side-assignee">${av('avatar-mirachen.png', 20)}mirachen</div></div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Labels</h3><div class="gh-side-v"><span class="gh-label gh-label-bug">bug</span> <span class="gh-label gh-label-auth">auth</span></div></div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Type</h3><div class="gh-side-v">No type</div></div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Projects</h3><div class="gh-side-v">No projects</div></div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Milestone</h3><div class="gh-side-v">No milestone</div></div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Relationships</h3><div class="gh-side-v">None yet</div></div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Development</h3>
            <div class="gh-side-v gh-when-unlinked">No branches or pull requests</div>
            <div class="gh-side-dev gh-when-linked">${oct('git-pull-request')}<b>${PR.title}</b><span>${ORG}/${REPO}</span></div>
          </div>
          <div class="gh-side-sec"><h3 class="gh-side-h">Participants</h3><div class="gh-parts">${av('avatar-mirachen.png', 26)}${av('avatar-c1.png', 26)}${av('avatar-c2.png', 26)}${av('avatar-c3.png', 26)}<span class="gh-when-linked">${av('avatar-superbot.png', 26)}</span></div></div>
        </aside>
      </div>
    </main>
  </div></div>
</div>
`;
}

// ---------------------------------------------------------------- PR #483, Commits tab
function prPage() {
  const tab = `${PR.title} by superbot · Pull Request #${PR.n} · ${ORG}/${REPO}`;
  const rows = COMMITS.map(([who, img, sha, msg], i) => `
            <li class="gh-commit-row" data-i="${i + 1}" data-state="hidden">
              <div class="gh-cr-main">
                <div class="gh-cr-title"><a>${msg}</a><span class="gh-exp">${oct('ellipsis')}</span></div>
                <div class="gh-cr-meta">${av(img, 16)}<span><a>${who}</a> committed on Oct 3</span><span class="gh-dot">·</span>
                  <span class="gh-commit-status" data-state="pending"><span class="gh-cs-ico">${oct('dot-fill', 'gh-cs-pend')}${oct('check', 'gh-cs-ok')}</span><span class="gh-cs-n"><span class="gh-cs-n-pend">0 / 4</span><span class="gh-cs-n-ok">4 / 4</span></span></span>
                </div>
              </div>
              <div class="gh-cr-right"><span class="gh-verified">Verified</span><span class="gh-sha">${sha}</span><span class="gh-ibtn">${oct('copy')}</span><span class="gh-ibtn">${oct('code')}</span></div>
            </li>`).join('');
  const checks = CHECKS.map(([name, done], i) => `
          <li class="gh-check-row" data-i="${i + 1}">
            <span class="gh-check-status" data-state="pending">${oct('dot-fill', 'gh-ck-pend')}${oct('check', 'gh-ck-ok')}</span>
            <span class="gh-app">${oct('mark-github')}</span>
            <span class="gh-ck-txt"><b>${name}</b> <span class="gh-ck-d"><span class="gh-ck-d-pend">In progress</span><span class="gh-ck-d-ok">${done}</span></span></span>
            <a class="gh-det">Details</a>
          </li>`).join('');
  const sub = (cls, open) => `<span class="gh-sub ${cls}"><a class="gh-who">superbot</a>&nbsp;${open ? 'wants to merge' : 'merged'} 4 commits into&nbsp;<span class="gh-branch">main</span>&nbsp;from&nbsp;<span class="gh-branch">${PR.branch}</span><span class="gh-ibtn">${oct('copy')}</span>${open ? '' : '<span>&nbsp;on Oct 3</span>'}</span>`;
  return `<!-- gh/pr-483-commits.html : GitHub pull request, Commits tab, Dark default. Styles: gh/screens.css (.gh).
     Inject into the ad's index.html (img/ paths resolve from the ad folder root). Generated by gh/build.mjs.
     #gh-pr-state / #gh-pr-subline: data-state="open" | "merged"
     .gh-commit-row[data-i=1..4]: data-state="hidden" | "shown";  .gh-commit-status: data-state="pending" | "success"
     #gh-checks-popover: data-state="hidden" | "shown";  .gh-check-row[data-i=1..4] .gh-check-status: "pending" | "success" -->
<div class="gh gh-window" id="gh-pr" style="--gh-scroll:0px">
  ${chrome(tab, 'github.com', `/${ORG}/${REPO}/pull/${PR.n}/commits`)}
  <div class="gh-viewport"><div class="gh-page">
    ${appHeader('Pull requests')}
    <main class="gh-pr-main">
      <h1 class="gh-pr-title">${PR.title} <span class="gh-num">#${PR.n}</span></h1>
      <div class="gh-pr-meta">
        <span id="gh-pr-state" data-state="open"><span class="gh-state gh-state-open">${oct('git-pull-request')}Open</span><span class="gh-state gh-state-merged">${oct('git-merge')}Merged</span></span>
        <span id="gh-pr-subline" data-state="open">${sub('gh-sub-open', true)}${sub('gh-sub-merged', false)}</span>
      </div>
      <nav class="gh-prtabs">
        <a class="gh-prtab">${oct('comment-discussion')}Conversation<span class="gh-ctr">6</span></a>
        <a class="gh-prtab gh-on">${oct('git-commit')}Commits<span class="gh-ctr">4</span></a>
        <a class="gh-prtab">${oct('checklist')}Checks<span class="gh-ctr">4</span></a>
        <a class="gh-prtab">${oct('file-diff')}Files changed<span class="gh-ctr">5</span></a>
        <span class="gh-diffstat"><span class="gh-add">+86</span><span class="gh-del">-14</span><span class="gh-blocks"><i class="a"></i><i class="a"></i><i class="a"></i><i class="a"></i><i class="d"></i></span></span>
      </nav>
      <div class="gh-commits">
        <div class="gh-cgroup">
          <h3 class="gh-cgroup-h">${oct('git-commit')}Commits on Oct 3, 2026</h3>
          <ul class="gh-clist">${rows}
          </ul>
        </div>
      </div>
    </main>
  </div>
  <div id="gh-checks-popover" data-state="hidden" role="dialog">
    <div class="gh-dlg">
      <div class="gh-dlg-h">
        <div class="gh-dlg-tt">
          <div class="gh-dlg-title"><span class="gh-sum gh-sum-done">All checks have passed</span><span class="gh-sum gh-sum-wait">Some checks haven’t completed yet</span></div>
          <div class="gh-dlg-sub"><span class="gh-sum gh-sub-0">4 in progress checks</span><span class="gh-sum gh-sub-1">3 in progress and 1 successful checks</span><span class="gh-sum gh-sub-2">2 in progress and 2 successful checks</span><span class="gh-sum gh-sub-3">1 in progress and 3 successful checks</span><span class="gh-sum gh-sub-4">4 successful checks</span></div>
        </div>
        <span class="gh-ibtn">${oct('x')}</span>
      </div>
      <ul class="gh-crows">${checks}
      </ul>
    </div>
  </div>
  </div>
</div>
`;
}

const ISSUE_HTML = issuePage(), PR_HTML = prPage();
fs.writeFileSync(path.join(HERE, 'issue-482.html'), ISSUE_HTML);
fs.writeFileSync(path.join(HERE, 'pr-483-commits.html'), PR_HTML);

// ---------------------------------------------------------------- preview.html (1920 x 1080 review page)
// Both fragments are inlined (works from file://). <base href="../"> makes img/ resolve from the ad folder root.
// Default: both windows side by side, every state at its end value (link shown, rows shown + success, PR merged,
// checks dialog shown + success). Query params pick one screen at full fit scale (1808 x 968, 56 px margins):
//   ?view=issue&link=hidden|shown&scroll=N
//   &k=1 renders the window unscaled at 0,0 (for 1:1 comparison with the 1280 px references)
//   ?view=pr&pr=open|merged&rows=0..4&status=pending|success&pop=0|1&checks=0..4&scroll=N
const PREVIEW = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><base href="../">
<title>ghx2 GitHub screens preview</title>
<link rel="stylesheet" href="gh/screens.css">
<style>
  html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #07090d; }
  .stage { position: absolute; inset: 0; background: radial-gradient(1200px 700px at 50% 40%, #121826 0%, #07090d 70%); }
  .slot { position: absolute; }
  .slot > .gh-window { transform: scale(var(--k)); }
</style></head>
<body><div class="stage">
<div class="slot" id="slot-issue">
${ISSUE_HTML}</div>
<div class="slot" id="slot-pr">
${PR_HTML}</div>
</div>
<script>
(() => {
  const q = new URLSearchParams(location.search);
  const view = q.get('view') || 'both';
  const W = 1280, H = 685;
  const place = (slot, k, x, y) => { slot.style.left = x + 'px'; slot.style.top = y + 'px'; slot.firstElementChild && (slot.querySelector('.gh-window').style.setProperty('--k', k)); };
  const si = document.getElementById('slot-issue'), sp = document.getElementById('slot-pr');
  const fit = 1808 / W;                       // 1.4125: 56 px stage margin left/right, 56.2 top/bottom
  if (view === 'both') {
    const k = 0.7; const gap = (1920 - 2 * W * k) / 3;
    place(si, k, gap, (1080 - H * k) / 2); place(sp, k, gap * 2 + W * k, (1080 - H * k) / 2);
  } else {
    (view === 'issue' ? sp : si).style.display = 'none';
    const k = q.get('k') ? +q.get('k') : fit;
    if (q.get('k')) place(view === 'issue' ? si : sp, k, 0, 0);
    else place(view === 'issue' ? si : sp, fit, 56, (1080 - H * fit) / 2);
  }
  const set = (sel, v) => document.querySelectorAll(sel).forEach((e) => e.setAttribute('data-state', v));
  set('#gh-issue-link-event', q.get('link') || 'shown');
  const pr = q.get('pr') || 'merged';
  set('#gh-pr-state', pr); set('#gh-pr-subline', pr);
  const rows = +(q.get('rows') ?? 4);
  document.querySelectorAll('.gh-commit-row').forEach((r, i) => r.setAttribute('data-state', i < rows ? 'shown' : 'hidden'));
  set('.gh-commit-status', q.get('status') || 'success');
  set('#gh-checks-popover', q.get('pop') === '0' ? 'hidden' : 'shown');
  const ck = +(q.get('checks') ?? 4);
  document.querySelectorAll('.gh-check-row .gh-check-status').forEach((s, i) => s.setAttribute('data-state', i < ck ? 'success' : 'pending'));
  if (q.get('scroll')) document.querySelectorAll('.gh-window').forEach((w) => w.style.setProperty('--gh-scroll', q.get('scroll') + 'px'));
})();
</script>
</body></html>
`;
fs.writeFileSync(path.join(HERE, 'preview.html'), PREVIEW);
console.log('wrote gh/issue-482.html, gh/pr-483-commits.html, gh/preview.html');
