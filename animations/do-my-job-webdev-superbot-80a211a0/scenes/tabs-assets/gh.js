// gh.js: the GitHub desk (the excalidraw/excalidraw repo page, the issues assigned to you in the left pane, and the
// pull request that fixes each worked issue), and the four beats superbot works on it. It is one DOM tree built at
// mount and then driven purely from local time t (?t=<s> reproduces any frame), so the spot is seek-safe at every
// ratio. The chrome (the signed-in global header with the mark, the repo breadcrumb, search and the icon buttons; the
// repo's UnderlineNav; the Code tab's file table; the issue and pull request headers with their State labels; the PR
// tabnav with its diffstat; the Files changed diff; the PR sidebar; the merge box) is rebuilt in HTML from headless
// captures of github.com kept outside the repo in /tmp/webdev-ad.80a211a0/ref (see gh-tokens.css for every measured
// value and the Primer primitives it comes from). The motion is the call-center spot's (e360.js) beat for beat: every
// phase, FR fraction, queue timing and HUD rule is unchanged; the worked-issue windows split the same answer span
// "faster each time", one per worked issue (three, like the call-center's three calls; see MAX_HEROES).
// All repo content comes from gh-data.js; every count on screen is derived from its arrays.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { REPO, ISSUES, HEROES, RULES, CODE } from './gh-data.js';
import { I, STR, STEPS } from './gh-ui.js';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the worked issues: the ones the research flags as heroes (with a heroes entry), in list order. Three, not four: the
// answer span [8.90, 16.10] cut four ways cannot hold every fully typed hunk readable for 0.8 s, so the fourth hero in
// list order (#12182) resolves in the burst with the other rows (its diff is not shown)
const MAX_HEROES = 3;
const HERO_IDX = ISSUES.map((_, i) => i).filter((i) => ISSUES[i].hero && HEROES[ISSUES[i].num]).slice(0, MAX_HEROES);
const NH = HERO_IDX.length;
// the windows: the call-center's answer span [8.90, 16.10] cut into one window per worked issue, each 0.87 of the one
// before (the call-center's 2.7 / 2.4 / 2.1 s: with three issues this gives 2.74 / 2.38 / 2.07)
const WINS = (() => {
  const a = 8.90, b = 16.10, r = 0.87;
  const w = Array.from({ length: NH }, (_, i) => r ** i), sum = w.reduce((x, y) => x + y, 0) || 1;
  let t = a;
  return w.map((x) => { const s = t; t += (b - a) * x / sum; return [s, t]; });
})();
// where each step of an issue lands inside its window, as a fraction of it (the call-center spot's marks): the issue's
// words land (prob), the files to change appear (cause), the file is opened (sol + 0.10), the diff is typed
// from turn1 to DIFF_END, the checks run to `closed` (All checks have passed) and Merge pull request is pressed (end)
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
const DIFF_END = 0.56;
const ROW_H = 44;               // one issue row in the left pane (gh-tokens.css --gh-h-issue-row)
const CHECK_H = 37;             // one check row in the merge box (--gh-h-check)
const FADE_TOP = 32;            // the diff viewport's top fade once it scrolls (gh.css .gh-dvp --dfade)
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const N = ISSUES.length;
// the call-center queue's arrival / answer / resolve timings, copied exactly (motion, not content). Slot k of the
// worked issues is taken as window k opens; the other issues take the remaining slots in list order.
const TIMING = [[8.70, 8.90, 11.06], [9.30, 11.60, 13.52], [9.90, 14.00, 15.68], [10.40, 10.95, 12.60], [10.90, 11.35, 13.10],
  [11.40, 11.80, 13.45], [11.90, 12.30, 14.20], [12.40, 12.85, 14.55], [12.90, 13.35, 15.20], [13.40, 13.85, 15.60],
  [13.90, 14.35, 15.92], [14.40, 14.75, 16.02]];

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const setH = (n, s) => { if (n && n._h !== s) { n.innerHTML = s; n._h = s; } };
const show = (n, on) => { const d = on ? '' : 'none'; if (n && n.style.display !== d) n.style.display = d; };
const fmt = (n) => Number(n).toLocaleString('en-US');
// GitHub's short counts, as the reference capture of the repo page shows them (ref/repo.png): the counters (the Star
// button, the repo tabs) round to one decimal below 100k and to whole thousands above (133212 -> 133k, 15517 -> 15.5k,
// 2101 -> 2.1k, 1171 -> 1.2k); the About box always keeps one decimal (133212 -> 133.2k stars, 15517 -> 15.5k forks)
const k1 = (n) => `${(Math.round(n / 100) / 10).toString()}k`;
const ctFmt = (n) => (n >= 100000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? k1(n) : String(n));
const aboutFmt = (n) => (n >= 1000 ? k1(n) : String(n));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// GitHub's absolute date in lists ("on Aug 16"; the year only when it is not the current one, which is the year of the
// newest close in the data)
const CUR_YEAR = Math.max(0, ...ISSUES.map((s) => new Date(s.closedAt || 0).getUTCFullYear()).filter((y) => !isNaN(y)));
const onDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `on ${MON[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() !== CUR_YEAR ? `, ${d.getUTCFullYear()}` : ''}`;
};
// a head branch as the desk shows it: a fork owner's prefix (a person's handle, "owner/branch") is dropped, a
// conventional type prefix ("fix/...") is kept, so no handle reaches the screen
const TYPES = /^(fix|feat|feature|docs|chore|perf|refactor|test|tests|ci|build|style|revert|hotfix|bugfix|release)$/i;
const branch = (ref) => { const p = String(ref || '').split('/'); return p.length > 1 && !TYPES.test(p[0]) ? p.slice(1).join('/') : p.join('/'); };
const winLen = (i) => WINS[i][1] - WINS[i][0];
const at = (i, f) => WINS[i][0] + f * winLen(i);
const mergeAt = (k) => at(k, FR.end);
const closeAt = (k) => mergeAt(k) + 0.06;
// a label's text colour on its own background colour: GitHub's lightness switch (black on light labels, white on dark)
const labelInk = (hex) => {
  const v = parseInt(String(hex).replace('#', ''), 16);
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255 > 0.6 ? 'var(--gh-fg)' : 'var(--gh-fg-on)';
};
const labelChip = (l) => `<span class="gh-lb" style="background:#${esc(String(l.color).replace('#', ''))};color:${labelInk(l.color)}">${esc(l.name)}</span>`;

// a commit headline as GitHub renders it in the file table: `code` spans become code
const mdCode = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

// ---------- the left pane: all 12 issues, listed in closing order from the desk's reveal ----------
// Each row keeps the call-center queue's answer / resolve timing of its slot (the worked issues take slots 0.., the
// others the remaining slots in list order); tIn is only when its Open label starts to ring. `pos` is its place in
// the list (closing order), which never changes.
const ROWS = (() => {
  const order = [...HERO_IDX];
  ISSUES.forEach((_, i) => { if (!order.includes(i)) order.push(i); });
  return order.map((si, slot) => {
    const [tIn, tAns0, tRes0] = TIMING[Math.min(slot, TIMING.length - 1)];
    const k = HERO_IDX.indexOf(si);
    const tAns = k >= 0 ? WINS[k][0] : tAns0;
    return { s: ISSUES[si], si, pos: si, k: k >= 0 ? k : null, tIn: Math.min(tIn, tAns - 0.2), tAns, tRes: k >= 0 ? Math.max(tRes0, closeAt(k)) : tRes0 };
  }).sort((a, b) => a.pos - b.pos);
})();

// ---------- a worked issue's plan: the diff rows with their line numbers, the typing and the check ticks ----------
function plan(k) {
  const s = ISSUES[HERO_IDX[k]];
  const hero = HEROES[s.num];
  const files = (hero.diff || []).map((d) => {
    const m = /@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(d.hunkHeader || '');
    let o = m ? +m[1] : 1, n = m ? +m[2] : 1;
    const rows = (d.lines || []).map(([op, text]) => {
      const r = { op: op === '+' || op === '-' ? op : ' ', text: String(text), o: '', n: '' };
      if (r.op === ' ') { r.o = o++; r.n = n++; } else if (r.op === '-') r.o = o++; else r.n = n++;
      return r;
    });
    const add = rows.filter((r) => r.op === '+').length, del = rows.filter((r) => r.op === '-').length;
    return { path: d.path, hunk: d.hunkHeader || '', rows, add, del };
  });
  // the typing: every row's text, one after another, at the speed that fills [turn1, DIFF_END] (an empty row costs
  // one character so it still takes its turn)
  const all = files.flatMap((f) => f.rows);
  const cost = all.map((r) => Math.max(1, r.text.length));
  const total = cost.reduce((a, b) => a + b, 0);
  const T = { says: at(k, FR.prob), cause: at(k, FR.cause), press: at(k, FR.sol) + 0.10, d0: at(k, FR.turn1), d1: at(k, DIFF_END), closed: at(k, FR.closed), end: mergeAt(k), close: closeAt(k) };
  T.cps = Math.max(40, total / Math.max(0.05, T.d1 - T.d0));
  let acc = 0;
  all.forEach((r, i) => { r.c0 = acc; acc += cost[i]; r.c1 = acc; });
  // the checks: GitHub's latest run per name (latestForName) plus the commit statuses; skipped rows are skipped from
  // the start, the others finish shortest first between the end of the diff and `closed`
  const checks = (hero.checks || []).filter((c) => c.latestForName !== false).map((c, i) => ({ ...c, i }));
  const skipped = checks.filter((c) => c.conclusion === 'skipped');
  const ran = checks.filter((c) => c.conclusion !== 'skipped').sort((a, b) => (a.secs || 0) - (b.secs || 0) || a.i - b.i);
  ran.forEach((c, j) => { c.tick = T.d1 + (T.closed - T.d1) * (j + 1) / ran.length; });
  skipped.forEach((c) => { c.tick = -1; });
  // GitHub lists the merge box's checks with the finished ones first once they finish; here: the ran ones in finish
  // order, then the skipped ones
  const list = [...ran, ...skipped];
  const pills = [...new Set([...files.map((f) => f.path), ...((s.pr && s.pr.files) || []).map((f) => f.path)])].slice(0, 3);
  return { s, hero, pr: s.pr || {}, files, all, total, T, checks: list, ran, pills };
}
const PLANS = HERO_IDX.map((_, k) => plan(k));

// the Code tab's rows: the repo root as it was just before the earliest fix in the queue (gh-data.js CODE, already in
// GitHub's order: directories first, then files), each with the headline and date of the last commit that touched it
const TREE = (CODE && CODE.entries) || [];

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const root = h(`<div class="gh-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const RULE_CHIPS = STR.ruleFiles.slice(0, 4).map((f) => f.split('/').pop());
  const tabIcons = [I.code, I.issueOpened, I.pr, I.play, I.table, I.shield, I.graph];
  // the repo tabs' counters: the repo's real open issues and pull requests (static: they are the repo's, not yours)
  const tabCount = [null, REPO.openIssues, REPO.openPulls, null, null, null, null];
  const repoBand = `<div class="gh-band gh-band-repo">
      <span class="gh-band-ic">${I.repo}</span><b class="gh-band-t">${esc(REPO.fullName.split('/')[1] || REPO.fullName)}</b><span class="gh-lbl">${esc(STR.pub)}</span>
      <span class="gh-band-r"><span class="gh-btn">${I.star}${esc(STR.star)}<span class="gh-ct">${esc(ctFmt(REPO.stars || 0))}</span></span></span>
    </div>`;
  root.innerHTML = `
<div class="gh">
  <header class="gh-top">
    <div class="gh-gb">
      <span class="gh-ib">${I.threeBars}</span>
      <span class="gh-mark">${I.markGithub}</span>
      <span class="gh-crumbs"><span>${esc(REPO.fullName.split('/')[0])}</span><i>/</i><b>${esc(REPO.fullName.split('/')[1] || '')}</b></span>
      <span class="gh-gb-r">
        <span class="gh-search">${I.search}<span class="gh-search-t">${esc(STR.searchPh)}</span><kbd>/</kbd></span>
        <span class="gh-ib gh-ib-cp">${I.copilot}</span>
        <span class="gh-div"></span>
        <span class="gh-ib gh-ib-w">${I.plus}${I.triangleDown}</span>
        <span class="gh-ib">${I.issueOpened}</span>
        <span class="gh-ib">${I.pr}</span>
        <span class="gh-ib gh-ib-in">${I.inbox}<i class="gh-dot"></i></span>
        <span class="gh-av gh-av-me"></span>
      </span>
    </div>
    <nav class="gh-nav">${STR.tabs.map((t, i) => `<span class="gh-tab">${tabIcons[i]}<span>${esc(t)}</span>${tabCount[i] != null ? `<span class="gh-ct">${esc(ctFmt(tabCount[i]))}</span>` : ''}</span>`).join('')}<span class="gh-und"></span></nav>
  </header>
  <div class="gh-body">
    <aside class="gh-pane">
      <div class="gh-pane-h"><b>${esc(STR.assigned)}</b><span class="gh-live"><i></i>${esc(STR.inReview)} <b class="gh-live-n">0</b></span></div>
      <div class="gh-pane-oc"><span class="gh-oc-o">${I.issueOpened}<b class="gh-q-open">0</b> ${esc(STR.open)}</span><span class="gh-oc-c">${I.check}<b class="gh-q-closed">0</b> ${esc(STR.closed)}</span></div>
      <div class="gh-pane-pb"><span class="gh-pb-t">${esc(STR.closedOf(0, N))}</span><span class="gh-pb"><i></i></span></div>
      <ul class="gh-list"></ul>
    </aside>

    <main class="gh-main">
      <div class="gh-view gh-v-repo">
        ${repoBand}
        <div class="gh-repo-g">
          <div class="gh-repo-l">
            <div class="gh-sub gh-v-code">
              <div class="gh-code-bar"><span class="gh-btn">${I.branch}<b>${esc(REPO.defaultBranch || '')}</b>${I.triangleDown}</span><span class="gh-goto">${I.search}${esc(STR.goToFile)}</span><span class="gh-btn gh-btn-p">${I.code}${esc(STR.codeBtn)}${I.triangleDown}</span></div>
              <div class="gh-box gh-files">
                <div class="gh-box-h"><span class="gh-lc"></span><span class="gh-box-hr">${I.clock}${esc(STR.commits)}</span></div>
                <div class="gh-rows"></div>
              </div>
            </div>
            <div class="gh-sub gh-v-rules">
              <div class="gh-box gh-rules">
                <div class="gh-box-h"><b>${esc(STR.rulesTitle)}</b><span class="gh-box-hr"><b class="gh-rn">0</b>&nbsp;/ ${RULES.length} ${esc(STR.rulesRead)}</span></div>
                <div class="gh-rvp"><div class="gh-rin"></div>${RULES.length ? '' : `<p class="gh-empty">${esc(STR.rulesEmpty)}</p>`}</div>
              </div>
            </div>
          </div>
          <div class="gh-about">
            <h3>About</h3>
            <p class="gh-about-d">${esc(REPO.description || '')}</p>
            <div class="gh-about-i">${I.book}<span>Readme</span></div>
            ${REPO.license ? `<div class="gh-about-i">${I.law}<span>${esc(REPO.license)} license</span></div>` : ''}
            <div class="gh-about-i">${I.star}<span><b>${esc(aboutFmt(REPO.stars || 0))}</b> stars</span></div>
            ${REPO.forks ? `<div class="gh-about-i">${I.fork}<span><b>${esc(aboutFmt(REPO.forks))}</b> forks</span></div>` : ''}
          </div>
        </div>
      </div>

      <div class="gh-view gh-v-call">
          <div class="gh-call-l">
            <div class="gh-band gh-band-issue"><span class="gh-st gh-st-issue"></span><h1 class="gh-it"><span class="gh-it-t"></span> <span class="gh-it-n"></span></h1></div>
            <div class="gh-prh"><span class="gh-st gh-st-pr"></span><b class="gh-pt"></b><span class="gh-pn"></span></div>
            <div class="gh-prm"><span class="gh-av gh-av-sb"></span><span class="gh-prm-t"></span></div>
            <div class="gh-tabnav"><span class="gh-tn">${I.comment}${esc(STR.prTabs[0])}<span class="gh-ct">0</span></span><span class="gh-tn">${I.commit}${esc(STR.prTabs[1])}<span class="gh-ct gh-ct-cm">0</span></span><span class="gh-tn">${I.checklist}${esc(STR.prTabs[2])}<span class="gh-ct gh-ct-ck">0</span></span><span class="gh-tn on">${I.fileDiff}${esc(STR.prTabs[3])}<span class="gh-ct gh-ct-fc">0</span></span>
              <span class="gh-dstat gh-dstat-pr"></span></div>
            <div class="gh-says"><div class="gh-says-h">${I.issueOpened}<b>${esc(STR.issueSays)}</b><span class="gh-says-n"></span></div><p class="gh-says-q"></p></div>
            <div class="gh-cause"><div class="gh-pills"><small>${esc(STR.filesTouched)}</small></div></div>
            <div class="gh-dvp"><div class="gh-dsc"></div></div>
          </div>
          <div class="gh-call-r">
            <div class="gh-side">
              <div class="gh-si"><h3>${esc(STR.reviewers)}</h3><div class="gh-sv gh-sv-rev"></div></div>
              <div class="gh-si"><h3>${esc(STR.assignees)}</h3><div class="gh-sv"><span class="gh-av gh-av-me"></span><b>${esc(STR.me)}</b></div></div>
              <div class="gh-si"><h3>${esc(STR.labels)}</h3><div class="gh-sv gh-sv-lb"></div></div>
              <div class="gh-si gh-si-dev"><h3>${esc(STR.development)}</h3><p class="gh-sv-note">${esc(STR.mayClose)}</p><div class="gh-sv gh-sv-dev"><span class="gh-dev-ic"></span><b class="gh-dev-t"></b></div></div>
            </div>
            <div class="gh-mbox">
              <span class="gh-mb-badge"></span>
              <div class="gh-mb">
                <div class="gh-mb-ck"><span class="gh-mb-ic"></span><div class="gh-mb-tx"><b class="gh-mb-t"></b><small class="gh-mb-s"></small></div></div>
                <div class="gh-mb-cvp"><div class="gh-mb-list"></div></div>
                <div class="gh-mb-rv"><span class="gh-mb-ic gh-rv-ic"></span><b class="gh-rv-t"></b></div>
                <div class="gh-mb-go"><span class="gh-btn gh-btn-p gh-merge">${esc(STR.mergeBtn)}</span></div>
                <div class="gh-mb-done"><span class="gh-mb-ic">${I.merge}</span><div class="gh-mb-tx"><b>${esc(STR.mergedTitle)}</b><small class="gh-mb-ds"></small></div></div>
                <div class="gh-mb-dep"><span class="gh-mb-ic">${I.rocket}</span><div class="gh-mb-tx"><b>${esc(STR.deployed)}</b><small>${esc(STR.deploySub)}</small></div></div>
              </div>
            </div>
          </div>
      </div>
    </main>
  </div>
  <footer class="gh-foot">
    <span class="gh-foot-l">${I.markGithub}<span>© 2026 GitHub, Inc.</span></span>
    <span class="gh-fs"><span>${esc(STR.fClosed)} <b class="gh-f-c">0</b> / ${N}</span><span>${esc(STR.fMerged)} <b class="gh-f-m">0</b></span><span>${esc(STR.fChecks)} <b class="gh-f-k">0</b></span></span>
  </footer>

  <div class="gh-hud">
    <div class="gh-hud-h"><span class="gh-hud-mark"></span><span class="gh-hud-cur">${esc(STR.hud[0])}</span></div>
    <ul class="gh-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="gh-hud-voice">
      <div class="gh-hud-lane"><b>${esc(STR.laneYou)}</b><span class="gh-hud-bars" data-l="you"></span></div>
      <div class="gh-hud-lane sb"><b>Superbot</b><span class="gh-hud-bars" data-l="sb"></span></div>
      <div class="gh-hud-mh"><span>${esc(STR.laneStyle)}</span><b class="gh-hud-ok">${I.hudCheck}matched</b></div>
      <div class="gh-hud-meter"><i></i></div>
    </div>
    <div class="gh-hud-res"><b>${esc(STR.rulesFrom)}</b><div class="gh-hud-chips">${RULE_CHIPS.map((r) => `<span class="gh-hud-chip">${I.hudCheck}${esc(r)}</span>`).join('')}</div></div>
    <div class="gh-hud-stats"><span>${STR.hudStats[0]} <b class="gh-hs-f">0</b></span><span>${STR.hudStats[1]} <b class="gh-hs-k">0</b></span><span>${STR.hudStats[2]} <b class="gh-hs-l">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.gh-hud-mark', root).appendChild(hudMark.el);

  // the left pane: one row per issue, built once and placed every frame from t
  const qList = $('.gh-list', root);
  const qRows = ROWS.map((r) => {
    const n = h(`<li class="gh-qi">
      <span class="gh-qi-ic"></span>
      <span class="gh-qi-m"><span class="gh-qi-t">${esc(r.s.title)}</span><span class="gh-qi-s"><span class="gh-qi-meta"></span></span></span>
      <em class="gh-qs s-open">${esc(STR.open)}</em></li>`);
    n.dataset.num = String(r.s.num);
    qList.appendChild(n);
    return { n, r, ic: $('.gh-qi-ic', n), p: $('.gh-qs', n), meta: $('.gh-qi-meta', n) };
  });

  // the Code tab's file rows (as many whole rows as the box holds are shown; layout() hides the rest)
  const rowsBox = $('.gh-files .gh-rows', root);
  const fileRows = TREE.map((e) => {
    const n = h(`<div class="gh-fr"><span class="gh-fr-ic${e.dir ? ' dir' : ''}">${e.dir ? I.dir : I.file}</span><span class="gh-fr-n">${esc(e.name)}</span>
      <span class="gh-fr-c">${mdCode(e.message || '')}</span><span class="gh-fr-d">${esc(onDate(e.date).replace(/^on /, ''))}</span></div>`);
    rowsBox.appendChild(n);
    return n;
  });
  // the latest-commit row: the pinned commit itself (no author: no person's name or avatar on screen)
  const lc = CODE && CODE.commit;
  $('.gh-files .gh-lc', root).innerHTML = lc ? `<b>${mdCode(lc.message)}</b><span class="gh-lc-sha">${esc(lc.sha.slice(0, 7))}</span><span>${esc(onDate(lc.date).replace(/^on /, ''))}</span>` : '';

  // the rules (LEARN): each of the repo's rules once, verbatim, with its file and line
  const actIn = $('.gh-rin', root);
  const actRows = RULES.map((r) => {
    const n = h(`<div class="gh-ar"><span class="gh-ar-f">${I.file}<span>${esc(r.file)}</span>${r.line ? `<small>L${esc(String(r.line))}</small>` : ''}</span><span class="gh-ar-t">${esc(r.text)}</span></div>`);
    actIn.appendChild(n);
    return n;
  });

  // the worked issues' diffs: one scroll box per issue (only the live one is shown), each row built once
  const dsc = $('.gh-dsc', root);
  const docs = PLANS.map((p) => {
    const box = h(`<div class="gh-diff"></div>`);
    const files = p.files.map((f) => {
      const n = h(`<div class="gh-file">
        <div class="gh-fh">${I.chevronDown}<span class="gh-dstat">${diffstat(f.add, f.del)}</span><span class="gh-fh-p">${esc(f.path)}</span>${I.copy}</div>
        <div class="gh-dt"><div class="gh-dr gh-dr-h"><span class="gh-dn">${I.unfold}</span><span class="gh-dc">${esc(f.hunk)}</span></div></div></div>`);
      const dt = $('.gh-dt', n);
      const rows = f.rows.map((r) => {
        const rn = h(`<div class="gh-dr ${r.op === '+' ? 'add' : r.op === '-' ? 'del' : ''}"><span class="gh-dn">${r.o}</span><span class="gh-dn">${r.n}</span><span class="gh-dc"><i>${r.op === ' ' ? '' : r.op === '-' ? '−' : '+'}</i><span class="gh-dx"></span></span></div>`);
        rn.style.display = 'none';
        dt.appendChild(rn);
        return { n: rn, x: $('.gh-dx', rn), r };
      });
      box.appendChild(n);
      return { n, rows };
    });
    box.style.display = 'none';
    dsc.appendChild(box);
    return { box, files, rows: files.flatMap((f) => f.rows) };
  });
  // the file pills and the merge box's check rows, one set per worked issue (swapped in)
  const pillBox = $('.gh-pills', root);
  const pills = PLANS.map((p) => p.pills.map((path) => {
    const n = h(`<span class="gh-pill">${esc(path)}</span>`);
    pillBox.appendChild(n);
    return n;
  }));
  const ckBox = $('.gh-mb-list', root);
  const checks = PLANS.map((p) => p.checks.map((c) => {
    // GitHub's merge-box names: an Actions job reads "<workflow> / <job> (<event>)"; another app's check run and a
    // commit status read their own name (CodeRabbit, "Vercel – excalidraw" verbatim, en dash included)
    const label = c.workflow && c.event ? `${c.workflow} / ${c.name} (${c.event})` : c.name;
    const n = h(`<div class="gh-ck" data-pr="${p.pr.num}"><span class="gh-ck-ic"></span><span class="gh-ck-n"><b>${esc(label)}</b> <small></small></span><span class="gh-ck-d">${esc(STR.details)}</span></div>`);
    n.style.display = 'none';
    ckBox.appendChild(n);
    return { n, c, ic: $('.gh-ck-ic', n), s: $('small', n) };
  }));

  // the HUD's style lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.gh-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  const q = (s) => $(s, root);
  el = {
    root, hudMark, gh: q('.gh'), qListEl: qList, qRows, lay: null,
    tabs: [...root.querySelectorAll('.gh-tab')], und: q('.gh-und'), fileRows, filesBox: rowsBox,
    qlive: q('.gh-live'), qln: q('.gh-live-n'), qOpen: q('.gh-q-open'), qClosed: q('.gh-q-closed'), pbT: q('.gh-pb-t'), pb: q('.gh-pb i'),
    vRepo: q('.gh-v-repo'), vCall: q('.gh-v-call'), vCode: q('.gh-v-code'), vRules: q('.gh-v-rules'),
    rn: q('.gh-rn'), actIn, actRows, actVp: q('.gh-rvp'),
    stIssue: q('.gh-st-issue'), itT: q('.gh-it-t'), itN: q('.gh-it-n'), stPr: q('.gh-st-pr'), pt: q('.gh-pt'), pn: q('.gh-pn'), prmT: q('.gh-prm-t'),
    ctCm: q('.gh-ct-cm'), ctCk: q('.gh-ct-ck'), ctFc: q('.gh-ct-fc'), dstatPr: q('.gh-dstat-pr'),
    says: q('.gh-says'), saysN: q('.gh-says-n'), saysQ: q('.gh-says-q'), cause: q('.gh-cause'), pills, pillBox,
    dvp: q('.gh-dvp'), dsc, docs,
    rev: q('.gh-sv-rev'), lbs: q('.gh-sv-lb'), devIc: q('.gh-dev-ic'), devT: q('.gh-dev-t'),
    mbBadge: q('.gh-mb-badge'), mbDep: q('.gh-mb-dep'), mbCk: q('.gh-mb-ck'), mbCkIc: q('.gh-mb-ck .gh-mb-ic'), mbT: q('.gh-mb-t'), mbS: q('.gh-mb-s'),
    mbCvp: q('.gh-mb-cvp'), ckBox, checks, mbRv: q('.gh-mb-rv'), rvIc: q('.gh-rv-ic'), rvT: q('.gh-rv-t'), mbGo: q('.gh-mb-go'), merge: q('.gh-merge'),
    mbDone: q('.gh-mb-done'), mbDs: q('.gh-mb-ds'),
    fC: q('.gh-f-c'), fM: q('.gh-f-m'), fK: q('.gh-f-k'),
    hud: q('.gh-hud'), hudCur: q('.gh-hud-cur'), hudSteps: [...root.querySelectorAll('.gh-hud-steps li')],
    hudVoice: q('.gh-hud-voice'), hudOk: q('.gh-hud-ok'), hudMeter: q('.gh-hud-meter i'),
    hudRes: q('.gh-hud-res'), resChips: [...root.querySelectorAll('.gh-hud-chip')], hudStats: q('.gh-hud-stats'),
    hsF: q('.gh-hs-f'), hsK: q('.gh-hs-k'), hsL: q('.gh-hs-l'),
    barsYou, barsSb, YOU, OTHER,
  };
  return el;
}

// GitHub's diffstat: "+A −D" and five blocks split by the share of additions
function diffstat(add, del) {
  const tot = add + del;
  const g = tot ? Math.round(5 * add / tot) : 0, r = tot ? Math.min(5 - g, Math.max(del ? 1 : 0, Math.round(5 * del / tot))) : 0;
  const blocks = Array.from({ length: 5 }, (_, i) => `<i class="${i < g ? 'a' : i < g + r ? 'd' : ''}"></i>`).join('');
  return `<b class="a">+${fmt(add)}</b><b class="d">−${fmt(del)}</b><span class="gh-blocks">${blocks}</span>`;
}

// the State labels (GitHub's: icon + word, pill)
const STATE = {
  issueOpen: () => `<span class="gh-state open">${I.issueOpened}${esc(STR.open)}</span>`,
  issueClosed: () => `<span class="gh-state done">${I.issueClosed}${esc(STR.closed)}</span>`,
  prOpen: () => `<span class="gh-state open">${I.pr}${esc(STR.open)}</span>`,
  prMerged: () => `<span class="gh-state done">${I.merge}${esc(STR.merged)}</span>`,
};

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < NH; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / winLen(i) };
  }
  if (NH && t >= WINS[NH - 1][1]) return { i: NH - 1, a: WINS[NH - 1][0], b: WINS[NH - 1][1], f: 1 };
  // the call view opens a beat before the first window: it already carries the first issue (its parts land on their own marks)
  if (NH && t >= ANSWER.a - 0.05) return { i: 0, a: WINS[0][0], b: WINS[0][1], f: 0 };
  return null;
}

// the queue's state at t: each row is Open, then In review once superbot takes it, then Merged once its pull request
// merges (the issue is closed then). Every counter on the desk is read from these states, so none can disagree.
const rowState = (q, t) => (t >= q.tRes ? 'merged' : t >= q.tAns ? 'review' : 'open');
function queueState(t) {
  const st = ROWS.map((q) => rowState(q, t));
  const merged = st.filter((s) => s === 'merged').length;
  const review = st.filter((s) => s === 'review').length;
  let lines = 0;
  ROWS.forEach((q, i) => { if (st[i] === 'merged') lines += ((q.s.pr && q.s.pr.additions) || 0) + ((q.s.pr && q.s.pr.deletions) || 0); });
  // checks that passed on the worked pull requests (the only ones whose checks the desk shows)
  let checks = 0;
  PLANS.forEach((p) => { checks += p.checks.filter((c) => c.conclusion === 'success' && c.tick >= 0 && t >= c.tick).length; });
  return { st, merged, review, open: N - merged, lines, checks };
}

// the list's scroll (px): 0 while every row fits; otherwise it follows the worked issue, eased as each window opens
function queueScroll(t) {
  const L = el.lay, maxS = Math.max(0, N - L.rows);
  if (!maxS) return 0;
  const tgt = (k) => clamp(ROWS.findIndex((r) => r.k === k) - Math.floor((L.rows - 1) / 2), 0, maxS);
  let cur = 0;
  for (let k = 0; k < NH; k++) { const a = WINS[k][0] - 0.45; cur = lerp(cur, tgt(k), inOutCubic(seg(t, a, a + 0.4))); }
  return cur * ROW_H;
}

function renderQueue(t, S) {
  const L = el.lay, scroll = queueScroll(t);
  el.qRows.forEach((row, i) => {
    const q = row.r;
    const y = i * ROW_H - scroll;
    row.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    // a row scrolled past the list's top or bottom edge fades out before its text reaches the edge
    const below = clamp(1 - (y / ROW_H - (L.rows - 1)) * 2.5);
    const above = clamp(1 + (y / ROW_H) * 2.5);
    row.n.style.opacity = (below * above).toFixed(3);
    const st = S.st[i];
    const cls = st === 'merged' ? 's-merged' : st === 'review' ? 's-review' : 's-open';
    if (row.p.className !== `gh-qs ${cls}`) row.p.className = `gh-qs ${cls}`;
    setT(row.p, st === 'merged' ? STR.merged : st === 'review' ? STR.inReview : STR.open);
    row.n.dataset.state = st;
    setH(row.ic, st === 'merged' ? `<span class="ic-done">${I.issueClosed}</span>` : st === 'review' ? `<span class="ic-open">${I.pr}</span>` : `<span class="ic-open">${I.issueOpened}</span>`);
    // the meta line: the number, then the real date the issue was opened, or closed once it is
    setT(row.meta, st === 'merged' ? `#${q.s.num} ${STR.closed.toLowerCase()} ${onDate(q.s.closedAt)}` : `#${q.s.num} ${STR.opened(onDate(q.s.createdAt))}`);
    // an Open label rings (opacity only) from its slot's arrival time until superbot takes it
    row.p.style.opacity = st === 'open' && t >= q.tIn ? (0.6 + 0.4 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3) : '1';
  });
  // the landed state: the in-review chip turns into "Issues clear" once every row is merged
  const clear = S.merged === N;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}${esc(STR.issuesClear)}` : `<i></i>${esc(STR.inReview)} <b class="gh-live-n">0</b>`;
    el.qln = $('.gh-live-n', el.qlive) || el.qln;
  }
  if (!clear) setT(el.qln, String(S.review));
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  setT(el.qOpen, String(S.open));
  setT(el.qClosed, String(S.merged));
  setT(el.pbT, STR.closedOf(S.merged, N));
  el.pb.style.width = (N ? 100 * S.merged / N : 0).toFixed(1) + '%';
}

function renderChrome(t, S) {
  el.root.classList.toggle('live', t >= 0.55);
  setT(el.fC, fmt(S.merged)); setT(el.fM, fmt(S.merged)); setT(el.fK, fmt(S.checks));
  setT(el.hsF, fmt(S.merged)); setT(el.hsK, fmt(S.checks)); setT(el.hsL, fmt(S.lines));
}

// the views swap without a crossfade: the outgoing view is gone (opacity 0) before the incoming one starts to show,
// so no frame ever holds the text of two views at once (Code tab -> rules at LEARN; repo -> pull request at ANSWER)
const SWAP_OUT = 0.06, SWAP_IN = 0.10;
function swap(t, at) { return { out: 1 - seg(t, at - SWAP_OUT, at), in: outCubic(seg(t, at, at + SWAP_IN)) }; }
function vis(n, o) {
  n.style.opacity = o.toFixed(3);
  const v = o <= 0.001 ? 'hidden' : '';
  if (n.style.visibility !== v) n.style.visibility = v;
}
function renderViews(t) {
  const learn = swap(t, LEARN.a + 0.06);
  const call = swap(t, ANSWER.a - 0.02);
  vis(el.vRepo, call.out);
  vis(el.vCall, call.in);
  vis(el.vCode, learn.out);
  vis(el.vRules, learn.in);
  el.vRules.firstElementChild.style.transform = learn.in >= 1 ? 'none' : `translateY(${((1 - learn.in) * 8).toFixed(2)}px)`;
  // the repo tab's underline slides from Code to Pull requests as the first issue is taken (measured per frame: the
  // system face may settle after mount)
  const a = el.tabs[0], b = el.tabs[2];
  const u = inOutCubic(seg(t, ANSWER.a - 0.05, ANSWER.a + 0.3));
  el.und.style.left = lerp(a.offsetLeft, b.offsetLeft, u).toFixed(2) + 'px';
  el.und.style.width = lerp(a.offsetWidth, b.offsetWidth, u).toFixed(2) + 'px';
  a.classList.toggle('on', u <= 0.5);
  b.classList.toggle('on', u > 0.5);
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.rn, String(Math.round(RULES.length * c)));
  // the list scrolls once from the first rule to the last when they do not all fit
  const vpH = el.actVp.clientHeight || 300;
  const inH = el.actIn.offsetHeight;
  const y = -lerp(0, Math.max(0, inH - vpH), c);
  el.actIn.style.transform = `translateY(${y.toFixed(2)}px)`;
  // a row the scroll carries past the viewport's top or bottom edge fades out before its lines reach the edge
  for (const n of el.actRows) {
    // (a row wholly inside stays at full opacity; one crossing an edge is gone by the time a third of it is out)
    const top = n.offsetTop + y, bot = top + n.offsetHeight;
    const over = Math.max(0, -top, bot - vpH);
    const keep = clamp(1 - over / Math.max(1, n.offsetHeight * 0.3));
    const o = keep >= 1 ? '' : keep.toFixed(3);
    if (n.style.opacity !== o) n.style.opacity = o;
  }
}

function renderCall(t) {
  const c = callState(t);
  el.docs.forEach((d, k) => show(d.box, !!c && k === c.i));
  el.pills.forEach((set, k) => set.forEach((n) => show(n, !!c && k === c.i)));
  el.checks.forEach((set, k) => { if (c && k === c.i) return; set.forEach((r) => show(r.n, false)); });
  if (!c) return;
  const p = PLANS[c.i], T = p.T, s = p.s, pr = p.pr, d = el.docs[c.i];
  const merged = t >= T.end + 0.02, closed = t >= T.close;

  // the headers: the issue (Open -> Closed) and its pull request (Open -> Merged)
  setT(el.itT, s.title); setT(el.itN, `#${s.num}`);
  setH(el.stIssue, closed ? STATE.issueClosed() : STATE.issueOpen());
  setH(el.stPr, merged ? STATE.prMerged() : STATE.prOpen());
  setT(el.pt, pr.title || ''); setT(el.pn, pr.num ? `#${pr.num}` : '');
  const base = `${REPO.fullName.split('/')[0]}:${pr.baseRef || REPO.defaultBranch || ''}`;
  setH(el.prmT, `<b>${esc(STR.author)}</b> ${esc((merged ? STR.mergedLine : STR.wantsMerge)(pr.commits || 1, '\u0001', '\u0002').replace(/^you /, ''))
    .replace('\u0001', `<span class="gh-ref">${esc(base)}</span>`).replace('\u0002', `<span class="gh-ref">${esc(branch(pr.headRef))}</span>`)}`);
  setT(el.ctCm, String(pr.commits || 1));
  setT(el.ctCk, String(p.checks.length));
  setT(el.ctFc, String(pr.changedFiles || p.files.length));
  setH(el.dstatPr, diffstat(pr.additions || 0, pr.deletions || 0));
  // a flip (1 -> 0 -> 1 on Y) as each State label changes: the repair ticket's flip
  const flip = (n, a) => { const fs = seg(t, a - 0.11, a + 0.11); n.style.transform = `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})`; };
  flip(el.stPr, T.end + 0.02);
  flip(el.stIssue, T.close);

  // the issue's own words land, verbatim
  const sp = outCubic(seg(t, T.says, T.says + 0.3));
  el.says.style.opacity = sp.toFixed(3);
  el.says.style.transform = sp >= 1 ? 'none' : `translateY(${((1 - sp) * 6).toFixed(2)}px)`;
  setT(el.saysN, `#${s.num}`);
  // each quoted sentence on its own line, verbatim (they are separate passages of the issue, never joined)
  setH(el.saysQ, (s.quotes || s.bodyQuote || []).map((x) => `<span class="gh-q">${esc(x)}</span>`).join(''));
  // the files to change (the pull request's own paths); the first file is pressed as the diff opens, then the row folds
  // away (the opened file's path heads the diff), so the whole hunk fits the diff viewport unscrolled at every ratio. The
  // folding row fades out first and only then gives up its height, so no line is ever cut by its moving edge. (No root
  // cause sentence is shown: research.json's cause is a summary, not a verbatim quote of the sources.)
  const cp = outCubic(seg(t, T.cause, T.cause + 0.3));
  const fo = 1 - seg(t, T.press + 0.06, T.press + 0.16);           // the folding part's opacity
  const fh = 1 - inOutCubic(seg(t, T.press + 0.16, T.press + 0.40)); // and its height
  const fold = (n, on, o) => {
    if (!on) { n.style.maxHeight = ''; n.style.overflow = ''; show(n, true); return o; }
    show(n, fh > 0.001);
    n.style.overflow = 'hidden';
    n.style.maxHeight = fh >= 1 ? '' : `${(n.scrollHeight * fh).toFixed(2)}px`;
    return o * fo;
  };
  const co = fold(el.cause, true, cp);
  el.cause.style.opacity = co.toFixed(3);
  el.cause.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 6).toFixed(2)}px)`;
  el.pills[c.i].forEach((n, i) => {
    const isP = i === 0;
    const pp = isP ? press(t, T.press, 0.08, 0.10, 0.16) : 0;
    n.classList.toggle('on', isP && t >= T.press - 0.04);
    n.style.transform = pp > 0 ? `scale(${(1 - 0.05 * pp).toFixed(4)})` : '';
    n.style.opacity = outCubic(seg(t, T.cause + i * 0.06, T.cause + i * 0.06 + 0.25)).toFixed(3);
  });

  // the diff: the file opens with the press, then each row is typed in (old / new numbers land with the row)
  const open = outCubic(seg(t, T.press + 0.02, T.press + 0.2));
  el.dvp.style.opacity = open.toFixed(3);
  const nC = streamCount({ length: p.total }, T.d0, T.cps, t);
  let lastRow = null;
  d.rows.forEach((rw) => {
    const on = t >= T.d0 && nC > rw.r.c0;
    show(rw.n, on);
    if (!on) return;
    const k = Math.min(rw.r.text.length, Math.round((nC - rw.r.c0) * rw.r.text.length / Math.max(1, rw.r.c1 - rw.r.c0)));
    if (rw.x.textContent.length !== k) rw.x.textContent = rw.r.text.slice(0, k);
    rw.n.classList.toggle('typing', nC < rw.r.c1 && t < T.d1);
    lastRow = rw.n;
  });
  // keep the row being typed in view: the diff scrolls so its bottom stays inside the viewport; the top edge is a soft
  // mask as deep as the scroll has gone, so a row carried up past it fades instead of being cut
  const vpH = el.dvp.clientHeight;
  const want = lastRow ? lastRow.offsetTop + lastRow.offsetHeight + 2 : 0;   // (+ the file box's bottom border)
  const y = Math.max(0, want - vpH);
  el.dsc.style.transform = `translateY(${(-y).toFixed(2)}px)`;
  const ft = Math.min(y, FADE_TOP).toFixed(1) + 'px';
  if (el.dvp.style.getPropertyValue('--dfade') !== ft) el.dvp.style.setProperty('--dfade', ft);

  renderSide(t, p, closed);
  renderMerge(t, p, c, merged);
}

function renderSide(t, p, closed) {
  const approved = p.hero.reviewDecision === 'APPROVED';
  setH(el.rev, p.hero.reviewDecision
    ? (approved ? `<span class="gh-ok">${I.check}</span><span>${esc(STR.approved)}</span>` : `<span class="gh-wait">${I.dotFill}</span><span>${esc(STR.reviewRequired)}</span>`)
    : `<span>${esc(STR.noReviews)}</span>`);
  const lbs = p.s.labels || [];
  setH(el.lbs, lbs.length ? lbs.map(labelChip).join('') : `<span class="gh-muted">${esc(STR.noneYet)}</span>`);
  setH(el.devIc, closed ? `<span class="ic-done">${I.issueClosed}</span>` : `<span class="ic-open">${I.issueOpened}</span>`);
  setT(el.devT, p.s.title);
}

function renderMerge(t, p, c, merged) {
  const T = p.T;
  const set = el.checks[c.i];
  // the deployment line (the preview that deployed off the branch) sits under the merged state
  const dep = p.hero.deployment && p.hero.deployment.state === 'success';
  show(el.mbDep, !!dep && merged);
  el.mbDep.style.opacity = outCubic(seg(t, T.end + 0.1, T.end + 0.3)).toFixed(3);
  // the checks: queued while the diff is typed, then each finishes (the ran ones shortest first)
  const running = t >= T.d1;
  let ok = 0, run = 0;
  set.forEach((r) => {
    const c2 = r.c;
    const skip = c2.conclusion === 'skipped';
    const done = !skip && t >= c2.tick;
    const st = skip ? 'skip' : done ? (c2.conclusion === 'success' ? 'ok' : 'fail') : running ? 'run' : 'queued';
    if (done && c2.conclusion === 'success') ok++;
    if (st === 'run') run++;
    if (r.st !== st) {
      r.st = st;
      r.n.className = `gh-ck ${st}`;
      r.ic.innerHTML = st === 'ok' ? I.check : st === 'skip' ? I.skip : st === 'fail' ? I.dotFill : I.dotFill;
      // a finished row reads what GitHub prints beside it: an Actions job its duration, a commit status its own
      // description, another app's check run its output title
      const okSub = c2.kind === 'commit_status' ? (c2.description || '') : c2.summary || STR.checkOk(c2.secs || 0);
      setT(r.s, st === 'ok' ? okSub : st === 'skip' ? STR.checkSkipped : st === 'run' ? STR.checkRun : st === 'fail' ? STR.checkFailing : STR.checkQueued);
    }
  });
  const all = t >= T.closed;
  el.mbCk.classList.toggle('ok', all);
  setH(el.mbCkIc, all ? I.checkFill : I.dotFill);
  setT(el.mbT, all ? STR.checksPassed : STR.checksRunning);
  setT(el.mbS, all ? STR.checksSub(ok, 0) : running ? STR.checksSub(ok, run) : STR.checksQueued(p.ran.length));
  // the list shows as many whole rows as the box holds; once more have finished than fit, the window follows the
  // finishes so the latest one (and the next one due) stays in view
  const cap = Math.max(1, Math.floor((el.mbCvp.clientHeight + 2) / CHECK_H));
  const from = clamp(ok + 1 - cap, 0, Math.max(0, set.length - cap));
  set.forEach((r, i) => show(r.n, !merged && i >= from && i < from + cap));
  // review: the decision the pull request carried
  const approved = p.hero.reviewDecision === 'APPROVED';
  show(el.mbRv, !!p.hero.reviewDecision && !merged);
  el.mbRv.classList.toggle('ok', approved);
  setH(el.rvIc, approved ? I.checkFill : I.dotFill);
  setT(el.rvT, approved ? STR.changesApproved : STR.reviewRequired);
  // Merge pull request: pressed at `end`; the box turns into the merged state
  const ep = press(t, T.end, 0.07, 0.08, 0.14);
  el.merge.style.transform = ep > 0 ? `scale(${(1 - 0.06 * ep).toFixed(4)})` : '';
  el.merge.classList.toggle('busy', t >= T.end - 0.02 && t < T.end + 0.02);
  show(el.mbCk, !merged); show(el.mbCvp, !merged); show(el.mbGo, !merged);
  show(el.mbDone, merged);
  el.mbBadge.classList.toggle('done', merged);
  setH(el.mbBadge, merged ? I.merge : I.pr);
  setT(el.mbDs, STR.mergedSub(branch(p.pr.headRef)));
  const mp = outCubic(seg(t, T.end + 0.02, T.end + 0.22));
  el.mbDone.style.opacity = mp.toFixed(3);
  el.mbDone.style.transform = mp >= 1 ? 'none' : `translateY(${((1 - mp) * 6).toFixed(2)}px)`;
}

// a HUD section that unfolds over [a, b] and folds over [c, d]: h drives its height; its contents (o) fade in only once
// it is open and fade out before it folds, so no line is ever drawn half clipped by the moving edge (the journalist
// spot's fix, ported)
function reveal(t, a, b, c, d) {
  const hh = inOutCubic(seg(t, a, b)) * (1 - inOutCubic(seg(t, c, d)));
  const o = seg(t, b, b + 0.14) * (1 - seg(t, c - 0.14, c));
  return { h: hh, o };
}

function renderHud(t) {
  const H = STR.hud;
  const cur = t < 1.50 ? H[0] : t < VOICE.a ? H[1] : t < 4.30 ? H[2] : t < LEARN.a ? H[3] : t < 8.30 ? H[4] : t < LAND.a ? H[5] : H[6];
  setT(el.hudCur, cur);
  // each step is ACTIVE (bright label, pulsing green dot) while its beat runs and ticks when the beat lands
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const on = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', on);
    const dot = li.firstElementChild;
    if (on) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 var(--sb-hud-ring-w) var(--sb-hud-green), 0 0 0 ${(1 + 4 * b).toFixed(2)}px color-mix(in srgb, var(--sb-hud-green) ${(42 * (1 - b)).toFixed(1)}%, transparent)`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the style panel (VOICE): no score, just "matched" with a check once the lanes agree
  const V = reveal(t, VOICE.a + 0.04, VOICE.a + 0.34, 4.40, 4.72), vo = V.h;
  el.hudVoice.style.maxHeight = (124 * vo).toFixed(1) + 'px';
  el.hudVoice.style.opacity = V.o.toFixed(3);
  if (vo > 0.01) {
    const cv = outCubic(seg(t, VOICE.a + 0.25, 4.15));
    const play = t * 2.6;
    for (let i = 0; i < 26; i++) {
      const swell = 0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play));
      el.barsYou[i].style.height = (3 + 21 * el.YOU[i] * swell).toFixed(2) + 'px';
      el.barsSb[i].style.height = (3 + 21 * lerp(el.OTHER[i], el.YOU[i], cv) * (0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play + 1.9)))).toFixed(2) + 'px';
      el.barsSb[i].style.opacity = (0.55 + 0.45 * cv).toFixed(3);
    }
    el.hudMeter.style.width = (100 * cv).toFixed(1) + '%';
    const okp = outCubic(seg(t, 4.0, 4.3));
    el.hudOk.style.opacity = okp.toFixed(3);
    el.hudOk.style.transform = okp >= 1 ? 'none' : `scale(${lerp(0.8, 1, okp).toFixed(3)})`;
  }
  // what superbot read (LEARN); it folds away again once the issues start, so the HUD stays small
  const R = reveal(t, 6.55, 6.85, ANSWER.a + 0.35, ANSWER.a + 0.75), ro = R.o;
  el.hudRes.style.opacity = R.o.toFixed(3);
  el.hudRes.style.maxHeight = (150 * R.h).toFixed(1) + 'px';
  el.resChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    // (each chip grows into place inside the open panel, so none is clipped by its bottom edge on the way in)
    n.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.9, 1, p).toFixed(3)})`;
  });
  const S = reveal(t, ANSWER.a - 0.2, ANSWER.a + 0.2, 1e6, 1e6 + 1);
  el.hudStats.style.opacity = S.o.toFixed(3);
  el.hudStats.style.maxHeight = (34 * S.h).toFixed(1) + 'px';
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real
// screens show it. Narrower ratios scale less and restack (gh.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
function layout(W) {
  const key = `${W}|${fontState()}`;
  if (el.lay && el.lay.key === key) return el.lay;
  const S = UI_SCALE(W);
  el.gh.style.width = (W / S).toFixed(2) + 'px';
  el.gh.style.height = (1080 / S).toFixed(2) + 'px';
  el.gh.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { key, W, S, rows: Math.max(1, Math.floor((listH + 1) / ROW_H)), padT: parseFloat(cs.paddingTop) };
  // the Code tab: as many WHOLE file rows as the box holds (the page continues below the fold on github.com)
  el.fileRows.forEach((n) => show(n, true));
  const boxH = el.filesBox.clientHeight;
  el.fileRows.forEach((n) => show(n, n.offsetTop + n.offsetHeight <= boxH + 0.5));
  // the rules viewport: as many WHOLE rows as the box holds, at most all of them
  const rbox = el.actVp.parentNode;
  rbox.style.flex = '1 1 auto'; el.actVp.style.flex = ''; el.actVp.style.height = '';
  const avail = el.actVp.clientHeight;
  let fit = 0;
  for (const n of el.actRows) { if (n.offsetTop + n.offsetHeight <= avail + 0.5) fit = n.offsetTop + n.offsetHeight; }
  const all = el.actIn.offsetHeight;
  el.actVp.style.flex = 'none'; el.actVp.style.height = `${all <= avail + 0.5 ? all : fit}px`;
  rbox.style.flex = 'none';
  // the merge box's check list: as many WHOLE rows as it holds
  el.mbCvp.style.height = '';
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  const S = queueState(t);
  renderChrome(t, S);
  renderViews(t);
  renderQueue(t, S);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'gh', DUR, mount, render };
