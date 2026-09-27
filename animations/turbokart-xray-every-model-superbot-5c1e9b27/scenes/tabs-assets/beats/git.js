// GitHub beat: superbot connects GitHub, creates sam/turbo-kart-rally and pushes the build to main as one commit,
// "turbo kart rally: 8 racers, palm cove circuit, items, drift". Three tool chips land and resolve ("Authorizing
// GitHub" -> "Authorized as sam", repo, push), the repo card rises, the commit lands, then its stat line and the files
// it carries, and the main branch pill turns green with a drawn check once the push lands.
// The files match the rest of the thread: src/ holds the eight files Claude Opus 5.5 wrote in the code beat (main,
// track, kart, drift, items, ai, hud, audio: 1,745 lines, plus the one net line GPT-5 Codex's ai.js patch added in the
// terminal beat), scripts/playtest.js is the headless harness Codex ran, and index.html + package.json are the page
// and the npm scripts. The stat line is summed from FILES below, so it cannot drift from them.
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Pushing Turbo Kart Rally to GitHub.';
const OWNER = 'sam';
const REPO = 'turbo-kart-rally';
const BRANCH = 'main';
// the short sha is made up; the message is the one commit this push carries
const COMMIT = ['7c3e91a', 'turbo kart rally: 8 racers, palm cove circuit, items, drift'];
// [label shown, files, lines]: src/ is the code beat's 8 files (1,745 lines) + Codex's net +1 in ai.js
const FILES = [
  ['src/', 8, 1746],
  ['scripts/playtest.js', 1, 96],
  ['index.html', 1, 21],
  ['package.json', 1, 18],
];
const NFILES = FILES.reduce((s, f) => s + f[1], 0);
const NLINES = FILES.reduce((s, f) => s + f[2], 0);
const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const LOCK = '<svg class="git-lock" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const FOLDER = '<svg class="git-fic" viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>';
const FILEIC = '<svg class="git-fic" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55, r + 0.85];
    T.chipDone = [r + 0.6, r + 0.98, r + 1.36];
    T.card = r + 1.45;
    T.commit = r + 1.7;
    T.stat = r + 1.9;
    T.files = FILES.map((_, i) => r + 2.0 + i * 0.06);
    T.pushed = T.chipDone[2];
    T.main = T.files[FILES.length - 1] + 0.12;
    T.end = T.main + 0.72;   // the branch check finishes drawing at T.main + 0.4, then a short dwell
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const say = opts.say || SAY;
    const owner = opts.owner || OWNER;
    const repo = opts.repo || REPO;
    const branch = opts.branch || BRANCH;
    const num = (n) => n.toLocaleString('en-US');
    const chips = [
      ['Authorizing GitHub', 'Authorized as ' + owner],
      ['Creating repo ' + owner + '/' + repo, 'Created ' + owner + '/' + repo],
      ['Pushing 1 commit to ' + branch, 'Pushed to ' + branch],
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
        <div class="git-commit"><span class="git-sha">${x.esc(COMMIT[0])}</span><span class="git-msg">${x.esc(COMMIT[1])}</span></div>
      </div>
      <div class="git-stat"><b>${NFILES} files changed</b><span class="git-ins">+${num(NLINES)}</span><span class="git-dels">-0</span></div>
      <div class="git-files">${FILES.map(([label, n]) => `<span class="git-file">${n > 1 ? FOLDER : FILEIC}<span>${x.esc(label)}</span>${n > 1 ? `<small>${n} files</small>` : ''}</span>`).join('')}</div>
      <div class="git-bar"><span class="git-branch">${BRANCHIC}${x.esc(branch)}${CHECK}</span></div>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const commitRow = card.querySelector('.git-commit');
    const stat = card.querySelector('.git-stat');
    const fileEls = [...card.querySelectorAll('.git-file')];
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

        // the commit lands, then its stat line, then the files it carries
        rise(commitRow, seg(t, T.commit, T.commit + 0.32), 7);
        commitRow.classList.toggle('is-new', t >= T.commit && t < T.commit + 0.5);
        rise(stat, seg(t, T.stat, T.stat + 0.3), 5);
        fileEls.forEach((f, i) => rise(f, seg(t, T.files[i], T.files[i] + 0.26), 4));

        // main turns green with a drawn check once the push has landed
        const bp = seg(t, T.main, T.main + 0.28);
        branchEl.style.opacity = outCubic(bp).toFixed(3);
        branchEl.style.transform = bp >= 1 ? '' : `translateY(${((1 - outCubic(bp)) * 6).toFixed(2)}px) scale(${lerp(0.92, 1, outBack(bp)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.main + 0.08, T.main + 0.4)))).toFixed(2);
      },
    };
  },
};
