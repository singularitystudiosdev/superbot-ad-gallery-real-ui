// GitHub beat: superbot connects GitHub, creates sam/prometheus-ii and pushes the film's four commits. Three tool
// chips land and resolve ("Authorizing GitHub" -> "Authorized as sam", repo, push), the repo card rises, and the four
// commits land one at a time: GitHub's latest-commit bar swaps to each commit as it lands (sha, message, commit count)
// while the files that commit added rise into the repo's file tree, so the tree fills commit by commit with what the
// other beats made (score, meshes, plates, the source Opus wrote, the render). The README heading (PROMETHEVS II)
// rises under the tree, and the main branch pill lands in the film's HUD gold with a drawn check beside the language
// bar once the push lands. The last commit is the render: "Chapters I to XVII, 2:16 at 1080p".
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Connected. Pushing Prometheus II to GitHub.';
const OWNER = 'sam';
const REPO = 'prometheus-ii';
const BRANCH = 'main';
// short shas are made up; the messages are the film's four commits in the order the beats made them
const COMMITS = [
  ['4f2a9c1', 'Score: 110 to 150 BPM, 136.4 s'],
  ['b73e0d8', 'Meshes and plates: Colosseum to Saturn V'],
  ['a1c94e2', 'Chapter table, Kardashev K, kinetic type'],
  ['e5d07b3', 'Chapters I to XVII, 2:16 at 1080p'],
];
// the file tree GitHub lists after the push, in its order (folders first, then files, case-insensitive):
// [depth, name, the commit that added it, 'dir' | 'shut' (collapsed folder) | 'file', meta]
// meshes are the .glb names in img/prometheus/assets.json; the render is the film's 136.4 s at 1080p
const TREE = [
  [0, 'meshes', 1, 'dir'],
  [1, 'colosseum.glb', 1, 'file'],
  [1, 'lunar_module.glb', 1, 'file'],
  [1, 'pantheon_dome.glb', 1, 'file'],
  [1, 'saturn_v.glb', 1, 'file'],
  [0, 'plates', 1, 'shut'],
  [0, 'render', 3, 'dir'],
  [1, 'prometheus-ii.mp4', 3, 'file', '136.4 s'],
  [0, 'score', 0, 'dir'],
  [1, 'prometheus-ii.wav', 0, 'file'],
  [0, 'src', 2, 'dir'],
  [1, 'chapters.ts', 2, 'file'],
  [1, 'kardashev.ts', 2, 'file'],
  [1, 'Title.tsx', 2, 'file'],
  [0, 'README.md', 3, 'file'],
];
const README_H = 'PROMETHEVS II';
const README_P = 'Stole fire. XVII chapters, 508 BC to Type III, 2:16 at 1080p.';
// [language, share]: GitHub's language bar, by bytes of src/ (chapters.ts with its 100 eras and kardashev.ts are
// TypeScript, Title.tsx is TSX; the .glb, .wav and .mp4 files are binaries linguist does not count)
const LANGS = [['TypeScript', 91.7], ['TSX', 8.3]];
const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const CI = '<svg class="git-ci" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-6.5"/></svg>';
const HIST = '<svg class="git-hist" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/></svg>';
const LIST = '<svg class="git-list" viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>';
const CHEV_OPEN = '<svg class="git-chev" viewBox="0 0 16 16"><path d="M4.5 6l3.5 3.5L11.5 6"/></svg>';
const CHEV_SHUT = '<svg class="git-chev" viewBox="0 0 16 16"><path d="M6 4.5l3.5 3.5L6 11.5"/></svg>';
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
    T.end = r + 3.05;   // the branch check finishes drawing at r + 2.82: 0.23s of dwell, then the next switch
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
      [`Pushing ${COMMITS.length} commits to ${branch}`, 'Pushed to ' + branch],
    ];
    const icon = (kind) => (kind === 'file' ? FILE : (kind === 'shut' ? CHEV_SHUT : CHEV_OPEN) + FOLDER);
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
        <span class="git-av">${x.esc(owner.charAt(0).toUpperCase())}</span><b class="git-lu">${x.esc(owner)}</b>
        <span class="git-lm"></span>
        <span class="git-lr">${CI}<span class="git-lsha"></span><span class="git-lc">${HIST}<b></b> commits</span></span>
      </div>
      <div class="git-tree">
        ${TREE.map(([d, name, , kind, meta]) => `<div class="git-row${d ? ' git-in' : ''}${kind === 'file' ? '' : ' git-dir'}">${icon(kind)}<span class="git-fn">${x.esc(name)}</span>${meta ? `<span class="git-fm">${x.esc(meta)}</span>` : ''}</div>`).join('')}
      </div>
      <div class="git-readme">
        <div class="git-rm-tab">${LIST}README.md</div>
        <div class="git-rm-h">${x.esc(README_H)}</div>
        <div class="git-rm-p">${x.esc(README_P)}</div>
      </div>
      <div class="git-bar"><span class="git-branch">${BRANCHIC}${x.esc(branch)}${CHECK}</span>
        <span class="git-stats">${LANGS.map(([name, pct]) => `<span class="git-stat"><i class="git-dot"></i>${x.esc(name)} <b>${pct.toFixed(1)}%</b></span>`).join('')}<span class="git-stat"><b>1</b> branch</span></span>
        <span class="git-lang">${LANGS.map(([, pct]) => `<i style="flex:${pct} 1 0"></i>`).join('')}</span>
      </div>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const latest = card.querySelector('.git-latest');
    const lmsg = card.querySelector('.git-lm'), lsha = card.querySelector('.git-lsha'), lcount = card.querySelector('.git-lc b');
    // each tree row rises with the commit that added it; rows of one commit follow each other 0.03s apart
    const treeRows = [...card.querySelectorAll('.git-row')].map((row, i) => {
      const c = TREE[i][2];
      const nth = TREE.slice(0, i).filter((e) => e[2] === c).length;
      return { row, c, nth };
    });
    const readme = card.querySelector('.git-readme');
    const branchEl = card.querySelector('.git-branch');
    const statsEl = card.querySelector('.git-stats');
    const langEl = card.querySelector('.git-lang');
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

        // ...and the files each commit added rise into the tree with it
        treeRows.forEach(({ row, c, nth }) => {
          const a = T.commit[c] + nth * 0.03;
          rise(row, seg(t, a, a + 0.3), 7);
          row.classList.toggle('is-new', t >= a && t < T.commit[c] + 0.45);
        });

        // the README heading rises under the tree
        rise(readme, seg(t, T.readme, T.readme + 0.3), 6);

        // main lands in HUD gold with a drawn check once the push has landed; the language bar and stats fade in
        const bp = seg(t, T.main, T.main + 0.28);
        branchEl.style.opacity = outCubic(bp).toFixed(3);
        branchEl.style.transform = bp >= 1 ? '' : `translateY(${((1 - outCubic(bp)) * 6).toFixed(2)}px) scale(${lerp(0.92, 1, outBack(bp)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.main + 0.08, T.main + 0.4)))).toFixed(2);
        rise(statsEl, seg(t, T.main + 0.1, T.main + 0.38), 4);
        const lp = outCubic(seg(t, T.main + 0.1, T.main + 0.45));
        langEl.style.opacity = lp.toFixed(3);
        langEl.style.transform = lp >= 1 ? '' : `scaleX(${lp.toFixed(4)})`;
      },
    };
  },
};
