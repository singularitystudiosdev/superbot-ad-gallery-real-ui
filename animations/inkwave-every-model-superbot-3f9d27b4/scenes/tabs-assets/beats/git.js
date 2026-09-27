// GitHub beat: superbot connects GitHub, creates sam/inkwave and pushes the first three commits. Three tool chips
// land and resolve ("Authorizing GitHub" -> "Authorized as sam", repo, push), the repo card rises, its three commits
// land one at a time, and the main branch pill turns green with a drawn check once the push lands.
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Connected. Pushing Inkwave to GitHub.';
const OWNER = 'sam';
const REPO = 'inkwave';
const BRANCH = 'main';
// short shas are made up; the messages are the project's first three commits
const COMMITS = [
  ['4f2a9c1', 'Game design doc'],
  ['b73e0d8', 'Ink renderer, squid kid rig'],
  ['a1c94e2', 'Turf paint, Tidewater Plaza and the Spritzer'],
];
const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const LOCK = '<svg class="git-lock" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55, r + 0.85];
    T.chipDone = [r + 0.6, r + 0.98, r + 1.36];
    T.card = r + 1.45;
    T.commit = COMMITS.map((_, i) => r + 1.7 + i * 0.25);
    T.pushed = T.chipDone[2];
    T.main = T.commit[COMMITS.length - 1] + 0.12;
    T.end = r + 2.95;   // the branch check finishes drawing at r + 2.72: 0.23s of dwell, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const say = opts.say || SAY;
    const owner = opts.owner || OWNER;
    const repo = opts.repo || REPO;
    const branch = opts.branch || BRANCH;
    const chips = [
      ['Authorizing GitHub', 'Authorized as ' + owner],
      ['Creating repo ' + owner + '/' + repo, 'Created ' + owner + '/' + repo],
      ['Pushing 3 commits to ' + branch, 'Pushed to ' + branch],
    ];
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
    const rows = chips.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="git-card">
      <div class="git-head">
        <span class="git-logo"><img src="${x.brand('github-logo.svg')}" alt="GitHub"/></span>
        ${BOOK}
        <span class="git-name"><b>${x.esc(owner)}</b><i>/</i><b class="git-repo">${x.esc(repo)}</b></span>
        <span class="git-priv">${LOCK}Private</span>
      </div>
      <div class="git-commits">
        ${COMMITS.map(([sha, msg]) => `<div class="git-commit"><span class="git-sha">${x.esc(sha)}</span><span class="git-msg">${x.esc(msg)}</span></div>`).join('')}
      </div>
      <div class="git-bar"><span class="git-branch">${BRANCHIC}${x.esc(branch)}${CHECK}</span></div>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const commitRows = [...card.querySelectorAll('.git-commit')];
    const branchEl = card.querySelector('.git-branch');
    const checkP = card.querySelector('.git-ck-p');
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [sayEl, ...rows, card],
      marks: [[T.r, sayEl], ...rows.map((r, i) => [T.chipIn[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(say, T.r + 0.05, 90, t);
        if (n !== shown) { vis.textContent = say.slice(0, n); hid.textContent = say.slice(n); shown = n; }

        // the three tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? chips[i][1] : chips[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the repo card rises
        const ci = seg(t, T.card, T.card + 0.55);
        rise(card, ci, 20);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // the pushed commits land one at a time
        commitRows.forEach((row, i) => {
          const a = T.commit[i];
          rise(row, seg(t, a, a + 0.32), 7);
          row.classList.toggle('is-new', t >= a && t < a + 0.5);
        });

        // main turns green with a drawn check once the push has landed
        const bp = seg(t, T.main, T.main + 0.28);
        branchEl.style.opacity = outCubic(bp).toFixed(3);
        branchEl.style.transform = bp >= 1 ? '' : `translateY(${((1 - outCubic(bp)) * 6).toFixed(2)}px) scale(${lerp(0.92, 1, outBack(bp)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.main + 0.08, T.main + 0.4)))).toFixed(2);
      },
    };
  },
};