// GitHub beat (THE DISPATCH): superbot connects GitHub, creates superbot/austerlitz and pushes the film's repo to main
// as its one commit, then tags it. Three tool chips land and resolve ("Authorizing GitHub" -> "Authorized as sam",
// the repo, the push and the tag), the repo card rises, and the push lands: GitHub's latest-commit bar takes the
// commit (Claude, the subject, 86dae32, 1 Commit) and the repo home's file table fills in four waves, each root entry
// with what it holds (a folder's file count and bytes, a file's bytes) while the total under the table counts up to
// 37 files and 97,073,160 B. The README rises with its opening paragraph, and main settles in GitHub grey while the
// `proclamation` tag lands beside it in the film's small caps on the night ice, a camp-fire check drawn through it.
// Everything shown is the public repo WinterArc21/Battle-of-Austerlitz-Film at main 86dae32d, not a mock:
//   COMMIT   gh api repos/WinterArc21/Battle-of-Austerlitz-Film/commits/main: sha 86dae32d20f0..., author Claude, the
//            subject verbatim, the repo's only commit (1 Commit, 1 Branch: main). No CI tick: the repo runs no checks.
//   TREE     gh api repos/WinterArc21/Battle-of-Austerlitz-Film/git/trees/86dae32d?recursive=1: 37 blobs; every root
//            entry's file count and summed blob size in bytes. GitHub lists folders first, then files in the tree's
//            own order, and shows a folder that holds only one folder as its path (assets/fonts).
//   README   README.md line 3, verbatim (the h1 on line 1 is skipped: it carries an em dash).
//   SAY      37 files is the tree's blob count; "dispatch" is the beat's role (THE DISPATCH).
//   TAG      the repo carries no tag; `proclamation` is the ad's, the Grande Armée's word for Napoleon's proclamation,
//            the last line of the film's story table in README.md ("Napoleon's proclamation").
// T.commit keeps its four times: the four waves the file table fills in (the push is one commit).
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Connected. Dispatching all 37 files of Austerlitz to GitHub.';
const USER = 'sam';
const OWNER = 'superbot';
const REPO = 'austerlitz';
const BRANCH = 'main';
const TAG = 'proclamation';
const COMMIT = {
  sha: '86dae32',
  author: 'Claude',
  subject: 'Austerlitz, 2 December 1805: a historical film rendered entirely in code',
};
// the repo home's root at 86dae32d: [name, 'dir' | 'file', files under it, bytes under it, the wave it lands in]
const TREE = [
  ['assets/fonts', 'dir', 5, 1702624, 0],
  ['data', 'dir', 4, 5796624, 0],
  ['tools', 'dir', 8, 42198, 1],
  ['video', 'dir', 2, 89304736, 1],
  ['web', 'dir', 15, 220406, 2],
  ['.gitignore', 'file', 1, 40, 2],
  ['README.md', 'file', 1, 6143, 3],
  ['package.json', 'file', 1, 389, 3],
];
const WAVES = 4;
const README_P = 'A five-minute (5:01) historical film about the Battle of Austerlitz, made entirely in code: every frame is rendered by a WebGL program, every sound is synthesized, and the narrator\'s voice is generated offline.';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const meta = ([, kind, files, bytes]) => (kind === 'dir' ? `${files} files · ${fmt(bytes)} B` : `${fmt(bytes)} B`);
// the running total after wave w (-1: nothing landed yet)
const TOTALS = [[0, 0]].concat([...Array(WAVES)].map((_, w) => TREE.filter((e) => e[4] <= w).reduce((a, e) => [a[0] + e[2], a[1] + e[3]], [0, 0])));

const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const TAGIC = '<svg class="git-tic" viewBox="0 0 16 16"><path d="M1.75 2.5v5.2c0 .2.08.39.22.53l6.3 6.3c.3.3.77.3 1.06 0l4.94-4.94c.3-.3.3-.77 0-1.06l-6.3-6.3a.75.75 0 0 0-.53-.22h-5.2c-.28 0-.5.22-.5.5z"/><circle cx="5.25" cy="5.75" r="1.1"/></svg>';
const CARET = '<svg class="git-caret" viewBox="0 0 16 16"><path d="M4.5 6l3.5 3.5L11.5 6"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const HIST = '<svg class="git-hist" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/></svg>';
const LIST = '<svg class="git-list" viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>';
const FOLDER = '<svg class="git-fold" viewBox="0 0 16 16"><path d="M1.75 2.5h4.1l1.5 1.5h6.9c.41 0 .75.34.75.75v8.5c0 .41-.34.75-.75.75H1.75A.75.75 0 0 1 1 13.25V3.25c0-.41.34-.75.75-.75z"/></svg>';
const FILE = '<svg class="git-file" viewBox="0 0 16 16"><path d="M3.75 1.5h5.5L13 5.25v8.5c0 .41-.34.75-.75.75h-8.5a.75.75 0 0 1-.75-.75V2.25c0-.41.34-.75.75-.75z"/><path d="M9 1.5v4h4"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55, r + 0.85];
    T.chipDone = [r + 0.6, r + 0.98, r + 1.36];
    T.card = r + 1.45;
    T.commit = [...Array(WAVES)].map((_, i) => r + 1.7 + i * 0.2);   // the file table's four waves
    T.pushed = T.chipDone[2];
    T.readme = T.commit[WAVES - 1] + 0.1;
    T.main = T.commit[WAVES - 1] + 0.12;
    T.end = r + 3.05;   // the tag's check finishes drawing at r + 2.82: 0.23s of dwell, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const say = opts.say || SAY;
    const user = opts.user || USER;
    const owner = opts.owner || OWNER;
    const repo = opts.repo || REPO;
    const branch = opts.branch || BRANCH;
    const tag = opts.tag || TAG;
    const nFiles = TOTALS[WAVES][0];
    const chips = [
      ['Authorizing GitHub', 'Authorized as ' + user],
      ['Creating repo ' + owner + '/' + repo, 'Created ' + owner + '/' + repo],
      [`Pushing ${nFiles} files to ${branch}`, `Pushed ${branch}, tagged ${tag}`],
    ];
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
    const rows = chips.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="git-card">
      <div class="git-head">
        <span class="git-logo"><img src="${x.brand('github-logo.svg')}" alt="GitHub"/></span>
        ${BOOK}
        <span class="git-name"><b>${x.esc(owner)}</b><i>/</i><b class="git-repo">${x.esc(repo)}</b></span>
        <span class="git-priv">Public</span>
      </div>
      <div class="git-latest">
        <div class="git-l1">
          <span class="git-av"><img src="${x.brand('claude-logo.svg')}" alt=""/></span><b class="git-lu">${x.esc(COMMIT.author)}</b>
          <span class="git-lr"><span class="git-lsha">${x.esc(COMMIT.sha)}</span><span class="git-dot">·</span><span class="git-lc">${HIST}<b>1</b> Commit</span></span>
        </div>
        <div class="git-lm">${x.esc(COMMIT.subject)}</div>
      </div>
      <div class="git-tree">
        ${TREE.map((e) => `<div class="git-row${e[1] === 'dir' ? ' git-dir' : ''}">${e[1] === 'dir' ? FOLDER : FILE}<span class="git-fn">${x.esc(e[0])}</span><span class="git-fm">${x.esc(meta(e))}</span></div>`).join('')}
        <div class="git-sum"><span class="git-sum-n">0 files · 0 B</span></div>
      </div>
      <div class="git-readme">
        <div class="git-rm-tab">${LIST}README</div>
        <div class="git-rm-p">${x.esc(README_P)}</div>
      </div>
      <div class="git-bar">
        <span class="git-branch">${BRANCHIC}${x.esc(branch)}${CARET}</span>
        <span class="git-tag">${TAGIC}<span class="git-tn">${x.esc(tag)}</span>${CHECK}</span>
        <span class="git-stats"><span class="git-stat">${BRANCHIC}<b>1</b> Branch</span><span class="git-stat">${TAGIC}<b>1</b> Tag</span></span>
      </div>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const latest = card.querySelector('.git-latest');
    // each table row rises with its wave; rows of one wave follow each other 0.03s apart
    const treeRows = [...card.querySelectorAll('.git-row')].map((row, i) => {
      const w = TREE[i][4];
      const nth = TREE.slice(0, i).filter((e) => e[4] === w).length;
      return { row, w, nth };
    });
    const sum = card.querySelector('.git-sum');
    const sumN = card.querySelector('.git-sum-n');
    const readme = card.querySelector('.git-readme');
    const branchEl = card.querySelector('.git-branch');
    const tagEl = card.querySelector('.git-tag');
    const statsEl = card.querySelector('.git-stats');
    const checkP = card.querySelector('.git-ck-p');
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, sumText = '';
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

        // the push lands: the latest-commit bar takes the one commit with the first wave, in a camp-fire flash
        rise(latest, seg(t, T.commit[0], T.commit[0] + 0.25), 5);
        latest.classList.toggle('is-new', t >= T.commit[0] && t < T.commit[0] + 0.5);

        // ...and the root entries rise into the table in four waves, each with what it holds
        treeRows.forEach(({ row, w, nth }) => {
          const a = T.commit[w] + nth * 0.03;
          rise(row, seg(t, a, a + 0.3), 7);
          row.classList.toggle('is-new', t >= a && t < T.commit[w] + 0.45);
        });

        // the total under the table: as each wave lands its files are counted in at once and its bytes count up from
        // the last wave's sum to this one's; it settles in torch at 37 files and 97,073,160 B
        rise(sum, seg(t, T.commit[0], T.commit[0] + 0.25), 4);
        let files = 0, bytes = 0;
        for (let w = 0; w < WAVES; w++) {
          if (t < T.commit[w]) break;
          files = TOTALS[w + 1][0];
          bytes = lerp(TOTALS[w][1], TOTALS[w + 1][1], outCubic(seg(t, T.commit[w], T.commit[w] + 0.18)));
        }
        const st = `${fmt(files)} files · ${fmt(bytes)} B`;
        if (st !== sumText) { sumN.textContent = st; sumText = st; }
        sum.classList.toggle('git-sum-done', t >= T.commit[WAVES - 1] + 0.18);

        // the README's opening paragraph rises under the table
        rise(readme, seg(t, T.readme, T.readme + 0.3), 6);

        // main settles in GitHub grey, then the proclamation tag lands beside it on the night ice with a camp-fire
        // check drawn through it; the branch and tag counts fade in beside them
        const bp = seg(t, T.main, T.main + 0.24);
        branchEl.style.opacity = outCubic(bp).toFixed(3);
        branchEl.style.transform = bp >= 1 ? '' : `translateY(${((1 - outCubic(bp)) * 5).toFixed(2)}px)`;
        const tp = seg(t, T.main + 0.04, T.main + 0.32);
        tagEl.style.opacity = outCubic(tp).toFixed(3);
        tagEl.style.transform = tp >= 1 ? '' : `translateY(${((1 - outCubic(tp)) * 6).toFixed(2)}px) scale(${lerp(0.92, 1, outBack(tp)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.main + 0.08, T.main + 0.4)))).toFixed(2);
        rise(statsEl, seg(t, T.main + 0.1, T.main + 0.38), 4);
      },
    };
  },
};
