// GitHub beat: picture lock. superbot connects GitHub, creates superbot/the-last-invention and pushes the film's four
// commits plus the `picture-lock` tag. Three tool chips land and resolve ("Authorizing GitHub" -> "Authorized as sam",
// the repo, the push and the tag), the repo card rises, and the four commits land one at a time: GitHub's
// latest-commit bar swaps to each commit as it lands (sha, message, commit count) while the entries that commit added
// rise into the repo's file table with that commit's message beside them, the way GitHub's repo home lists every
// entry with its last commit. The table fills with what the other beats made (score, props, plates, the cut list Opus
// wrote as timeline.ts / cuts.ts / edit.ts, then the EDL turned over at the lock). The README rises with the title
// card's credits, and once the push lands main settles in GitHub grey while the picture-lock tag lands beside it in
// the film's grade, teal with a tungsten check drawn through it. The last commit is the lock: 70 cuts, 71 shots,
// 5:15 at 24 fps (the counts from cuts.ts, see beats/code.js).
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Connected. Picture locked at 70 cuts, pushing it to GitHub.';
const USER = 'sam';
const OWNER = 'superbot';
const REPO = 'the-last-invention';
const BRANCH = 'main';
const TAG = 'picture-lock';
// short shas are made up; the messages are the film's four commits in the order the beats made them: the material
// (score, props, plates), the cut list, the cards, then the lock
const COMMITS = [
  ['5e1c0a7', 'Score, props, plates graded tungsten vs teal'],
  ['c47a1e9', 'Cut list: 70 cuts, 71 shots at 24 fps'],
  ['9d3b6f2', 'Cards: 3 chapters, Bostrom 2014, Good 1965'],
  ['2b8f05d', 'Picture lock: 5:15 at 24 fps'],
];
// the repo home's file table after the push, in GitHub's order (folders first, then files, case-insensitive):
// [name, the commit that last touched it, 'dir' | 'file']. score/ holds the six movements, props/ the six .glb
// meshes, plates/ the six graded plates; timeline.ts, cuts.ts and edit.ts are the files beats/code.js writes; the
// .edl is the lock's turnover, 71 events
const TREE = [
  ['plates', 0, 'dir'],
  ['props', 0, 'dir'],
  ['score', 0, 'dir'],
  ['cuts.ts', 1, 'file'],
  ['edit.ts', 2, 'file'],
  ['README.md', 3, 'file'],
  ['the-last-invention.edl', 3, 'file'],
  ['timeline.ts', 1, 'file'],
];
// the README is the title card: the film's name, then its three credits as the card sets them
const README_H = 'THE LAST INVENTION';
const README_P = 'Presented by Dr Imogen Ashby. Written & directed by Fig. Produced for Gavin Purcell.';
const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const TAGIC = '<svg class="git-tic" viewBox="0 0 16 16"><path d="M1.75 2.5v5.2c0 .2.08.39.22.53l6.3 6.3c.3.3.77.3 1.06 0l4.94-4.94c.3-.3.3-.77 0-1.06l-6.3-6.3a.75.75 0 0 0-.53-.22h-5.2c-.28 0-.5.22-.5.5z"/><circle cx="5.25" cy="5.75" r="1.1"/></svg>';
const CARET = '<svg class="git-caret" viewBox="0 0 16 16"><path d="M4.5 6l3.5 3.5L11.5 6"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const CI = '<svg class="git-ci" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-6.5"/></svg>';
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
    T.commit = COMMITS.map((_, i) => r + 1.7 + i * 0.2);
    T.pushed = T.chipDone[2];
    T.readme = T.commit[COMMITS.length - 1] + 0.1;
    T.main = T.commit[COMMITS.length - 1] + 0.12;
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
    const chips = [
      ['Authorizing GitHub', 'Authorized as ' + user],
      ['Creating repo ' + owner + '/' + repo, 'Created ' + owner + '/' + repo],
      [`Pushing ${COMMITS.length} commits to ${branch}`, `Pushed ${branch}, tagged ${tag}`],
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
        <span class="git-av">${x.esc(user.charAt(0).toUpperCase())}</span><b class="git-lu">${x.esc(user)}</b>
        <span class="git-lm"></span>
        <span class="git-lr">${CI}<span class="git-lsha"></span><span class="git-lc">${HIST}<b></b> Commits</span></span>
      </div>
      <div class="git-tree">
        ${TREE.map(([name, c, kind]) => `<div class="git-row${kind === 'dir' ? ' git-dir' : ''}">${kind === 'dir' ? FOLDER : FILE}<span class="git-fn">${x.esc(name)}</span><span class="git-fm">${x.esc(COMMITS[c][1])}</span></div>`).join('')}
      </div>
      <div class="git-readme">
        <div class="git-rm-tab">${LIST}README</div>
        <div class="git-rm-h">${x.esc(README_H)}</div>
        <div class="git-rm-p">${x.esc(README_P)}</div>
      </div>
      <div class="git-bar">
        <span class="git-branch">${BRANCHIC}${x.esc(branch)}${CARET}</span>
        <span class="git-tag">${TAGIC}${x.esc(tag)}${CHECK}</span>
        <span class="git-stats"><span class="git-stat">${BRANCHIC}<b>1</b> Branch</span><span class="git-stat">${TAGIC}<b>1</b> Tag</span></span>
      </div>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const latest = card.querySelector('.git-latest');
    const lmsg = card.querySelector('.git-lm'), lsha = card.querySelector('.git-lsha'), lcount = card.querySelector('.git-lc b');
    // each table row rises with the commit that last touched it; rows of one commit follow each other 0.03s apart
    const treeRows = [...card.querySelectorAll('.git-row')].map((row, i) => {
      const c = TREE[i][1];
      const nth = TREE.slice(0, i).filter((e) => e[1] === c).length;
      return { row, c, nth };
    });
    const readme = card.querySelector('.git-readme');
    const branchEl = card.querySelector('.git-branch');
    const tagEl = card.querySelector('.git-tag');
    const statsEl = card.querySelector('.git-stats');
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

        // the pushed commits land one at a time: the latest-commit bar swaps to the newest one that has landed
        let last = 0;
        T.commit.forEach((a, i) => { if (t >= a) last = i; });
        rise(latest, seg(t, T.commit[0], T.commit[0] + 0.25), 5);
        latest.classList.toggle('is-new', t >= T.commit[last] && t < T.commit[last] + 0.45);
        const [sha, msg] = COMMITS[last];
        if (lmsg.textContent !== msg) lmsg.textContent = msg;
        if (lsha.textContent !== sha) lsha.textContent = sha;
        const cnt = String(last + 1);
        if (lcount.textContent !== cnt) lcount.textContent = cnt;

        // ...and the entries each commit touched rise into the table with its message beside them
        treeRows.forEach(({ row, c, nth }) => {
          const a = T.commit[c] + nth * 0.03;
          rise(row, seg(t, a, a + 0.3), 7);
          row.classList.toggle('is-new', t >= a && t < T.commit[c] + 0.45);
        });

        // the README (the title card's credits) rises under the table
        rise(readme, seg(t, T.readme, T.readme + 0.3), 6);

        // once the push has landed main settles in GitHub grey, then the picture-lock tag lands beside it in teal
        // with a tungsten check drawn through it; the branch and tag counts fade in beside them
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
