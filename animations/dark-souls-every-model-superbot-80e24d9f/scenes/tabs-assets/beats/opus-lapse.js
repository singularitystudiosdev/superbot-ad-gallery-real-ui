// Opus 5.5 beat (file name kept from the timelapse it replaces), the LAST working step of ?v=4: Claude Opus 5.5 takes
// the Dark Souls repo, fans it out over FOUR git worktrees and works them all at once, then merges each branch back
// into main and lands the GitHub finish (the push, PR #1, its CI checks going green, the merge). The card is three
// bands: the header (Claude mark, repo, TIMELAPSE x32 badge, Cooking -> Done) with the stat strip under it (files,
// commits, tests, elapsed clock racing to 3:40); a WORKTREES panel of four parallel lanes, each a branch pill
// (wt/combat, wt/bosses, wt/world, wt/assets), a ticker of file paths and the task each change completes sliding past
// left to right, a rolling +lines counter and a progress bar that fills smoothly; and the GITHUB finish strip that
// opens under it once the lanes have merged (github mark, sam/dark-souls, main, Pushed 84 commits, PR #1 with its
// build/test/lint checks spinning up green, 'Merged into main'). It runs as a hard, fast timelapse: everything moves
// continuously, no row lands per tick and nothing steps check by check. NO SOURCE CODE IS EVER SHOWN: the tickers carry
// file PATHS and plain-language tasks, never the code inside them.
//
// Duration: the beat ends at r + 3.52s (it was r + 7.00s), so the whole step is half as long.
//
// Layout: 30 (header) + 24 (stat strip) + 18 + 4x44 (worktrees panel) = 248 design px while every lane works. As a
// lane merges it collapses from 44px to the 18px merge line; once all four have merged the panel is 18 + 4x18 = 90px
// and the 46px GitHub strip opens in the space they freed, so the card never grows past its 248px opening height
// (inside the ~380px the v4 reply column can show above the composer, and inside the ~360 the beat is budgeted).
// Width fills the reply column (--hub-reply, 471px).
//
// IMAGERY / SOURCING: this beat draws no raster imagery. The two third-party marks are the Claude logomark
// (brand/claude-logo.svg) and the GitHub mark (brand/github-logo.svg), both already vendored in this ad and both used
// by chat.js (APPS.opus, APPS.github) and by beats/git.js. Source of record is brand/CREDITS.txt: "claude-logo.svg,
// Claude mark, https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/claude.svg (simple-icons, CC0 1.0)"; and
// "github-logo.svg, GitHub mark, https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg". Both are used
// nominatively, to name the model and the host the request went through. Every other glyph (worktree, branch, pull
// request, merge, check, record dot) is first-party UI chrome drawn in the same stroked style as beats/git.js.
// File paths, commit messages, line counts and shas are made up for the spot and do not describe a real repository.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame. Every moving value below is written from t in render.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Four worktrees merged. Shipped to main.';
const OWNER = 'sam';
const REPO = 'dark-souls';
const MAIN = 'main';
const PR = '#1 Dark Souls';
const CI = [['build', 'build'], ['test', 'test'], ['lint', 'lint']];

const TOTAL_FILES = 84;      // files the whole run touches
const TOTAL_COMMITS = 84;    // one commit per file
const TOTAL_TESTS = 312;     // the suite goes green as the last checks land
const TOTAL_SECS = 220;      // the clock the timelapse counts to: 3:40

const BRANCHIC = '<svg class="olap-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const WTREEIC = '<svg class="olap-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v17"/><circle cx="6.5" cy="20.5" r="2.2"/><circle cx="17.5" cy="7" r="2.2"/><circle cx="17.5" cy="16" r="2.2"/><path d="M6.5 7h5.4a5.6 5.6 0 0 0 5.6-0"/><path d="M6.5 16h5.4a5.6 5.6 0 0 1 5.6 0"/></svg>';
const PRIC = '<svg class="olap-ghic" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M6 8.4v7.2"/><circle cx="18" cy="18" r="2.4"/><path d="M18 15.6V9.6a3.2 3.2 0 0 0-3.2-3.2h-2.2"/><path d="M14.4 4.4 16.6 6.4l-2.2 2"/></svg>';
const MERGEIC = '<svg class="olap-ghic" viewBox="0 0 24 24"><circle cx="6" cy="5.6" r="2.4"/><circle cx="6" cy="18.4" r="2.4"/><circle cx="18" cy="18.4" r="2.4"/><path d="M6 8v8"/><path d="M18 16V11a5.4 5.4 0 0 0-5.4-5.4H6.2"/></svg>';

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- the four worktrees: Opus fans the repo out and works every lane at once ----------
// [branch, lines added by the lane, [[file path, the task that change completes], ...]]. The ticker slides these past
// inside the lane, so the lane reads as "live in this worktree right now". Plain language only, never code. The assets
// lane carries the other models' output arriving as files: the meshes from Meshy 5, the clips from MiniMax Hailuo 02,
// the tracks from ElevenLabs.
const LANES = [
  ['wt/combat', 412, [
    ['src/combat/roll.ts', 'Roll with 13 i-frames'],
    ['src/combat/parry.ts', 'Parry window of 6 frames'],
    ['src/combat/stamina.ts', 'Stamina drains on every block'],
    ['src/combat/poise.ts', 'Poise and stagger per armour set'],
    ['src/combat/hitbox.ts', 'Hitbox sweep on every attack frame'],
    ['src/combat/scaling.ts', 'Weapon scaling folded into damage'],
  ]],
  ['wt/bosses', 528, [
    ['src/bosses/gatewarden.ts', 'Gatewarden fight, three phases'],
    ['src/bosses/telegraph.ts', 'Windup arcs telegraph a swing'],
    ['src/bosses/fog-gate.ts', 'Death clears the fog gate'],
    ['src/bosses/gargoyles.ts', 'Bell gargoyles share one arena'],
    ['src/bosses/bar.ts', 'Boss bar shows once it aggros'],
    ['src/bosses/enrage.ts', 'Enrage past two minutes'],
  ]],
  ['wt/world', 476, [
    ['src/world/bonfire.ts', 'Bonfire rest respawns the level'],
    ['src/world/estus.ts', 'Estus refills to five charges'],
    ['src/world/streaming.ts', 'World streams between regions'],
    ['src/world/shortcuts.ts', 'Shortcut doors open from the far side'],
    ['src/world/dialog.ts', 'NPC dialog trees branch on flags'],
    ['src/world/merchant.ts', 'Merchant stock trades for souls'],
  ]],
  ['wt/assets', 288, [
    ['assets/meshes/knight.glb', 'Knight mesh lands from Meshy'],
    ['assets/clips/fog-gate.mp4', 'Hailuo clip cut into the gate'],
    ['audio/ashen-sanctuary.mp3', 'ElevenLabs track for the shrine'],
    ['assets/meshes/gatewarden.glb', 'Gatewarden mesh from Meshy'],
    ['assets/clips/boss-burn.mp4', 'Hailuo clip of the boss burning'],
    ['src/assets/meshes.ts', 'Every mesh loaded at boot'],
  ]],
];
const NLANE = LANES.length;

// ---------- geometry (design px) ----------
const DEF = { say: SAY };
const LH = 44;         // a lane's height while it works
const ML = 18;         // a lane's height once it has collapsed into its merge line
const WHEAD = 18;      // the worktrees panel caption
const FINH = 46;       // the GitHub finish strip: 22 (repo/push) + 24 (PR/checks/merge)
const ITEM_W = 196;    // one ticker slot: a file path over the task it completes
const TICK_V = 420;    // design px/s the ticker slides (continuous, never a step per row)
const TICK_MID = 167;  // half the ticker's own width: the slot under it is the file being written right now
const MP = 0.26;       // how long a lane takes to collapse into its merge line

export default {
  times(r, opts) {
    const T = { r };
    T.card = r + 0.08;             // the card rises into the thread
    T.run = r + 0.48;              // the thread has stopped gliding: the four lanes start working, the clock runs
    T.merge = [r + 1.46, r + 1.62, r + 1.78, r + 1.94];   // the lanes merge back into main, one after another
    T.push = r + 2.20;             // every branch is in: the GitHub finish opens ('Pushed 84 commits')
    T.pr = r + 2.34;               // the pull request row opens
    T.ci = r + 2.46;               // its three checks start spinning
    T.ciOk = [r + 2.62, r + 2.70, r + 2.78];
    T.mergeMain = r + 2.86;        // 'Merged into main'
    T.done = r + 2.94;             // everything landed: clock 3:40, counters home, the badge stops
    T.say = r + 3.00;              // the done line streams
    T.end = T.say + 0.52;          // r + 3.52
    return T;
  },
  build(k, x) {
    const T = k.T;
    const o = { ...DEF, ...(k.opts || {}) };
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(o.say)}</span></div>`);

    // one lane: the branch pill, the ticker (its own list laid twice so the slide never ends), the rolling +lines
    // counter and the progress bar, over the merge line it collapses into. 24 ticker items per lane, all written from
    // t; the marquee offset is a pure function of t, so a frozen frame is exact.
    const laneHtml = LANES.map(([name, , items]) => {
      const slots = items.map(([p, task]) => `<span class="olap-ti"><b>${x.esc(p)}</b><em>${x.esc(task)}</em></span>`).join('');
      return `<div class="olap-lane">
        <div class="olap-work">
          <span class="olap-bp">${BRANCHIC}${x.esc(name)}</span>
          <span class="olap-tk"><i class="olap-tks">${slots}${slots}</i></span>
          <b class="olap-ld">+0</b>
          <span class="olap-pb"><i class="olap-pf"></i></span>
        </div>
        <div class="olap-ml">${MERGEIC}<b>${x.esc(name)}</b><i>&rarr;</i><span>${MAIN}</span><u>Merged</u></div>
      </div>`;
    }).join('');

    const ciHtml = CI.map(([id, label]) => `<span class="olap-ch" data-ci="${id}"><i class="olap-csp"></i>${x.OK}<span class="olap-cl">${x.esc(label)}</span></span>`).join('');

    const card = x.el(`<div class="olap">
      <div class="olap-hd">
        <span class="olap-mk"><img src="${x.brand('claude-logo.svg')}" alt=""/></span>
        <b class="olap-rp">${x.esc(REPO)}</b>
        <span class="olap-bg"><i class="olap-rec"></i>TIMELAPSE x32</span>
        <span class="olap-pill"><i class="olap-spin"></i><span class="olap-pl">Cooking</span>${x.OK}</span>
      </div>
      <div class="olap-st">
        <span class="olap-s"><em>files</em><b class="olap-vf">0</b></span>
        <span class="olap-s"><em>commits</em><b class="olap-vc">0</b></span>
        <span class="olap-s olap-ts"><em>tests</em><b class="olap-vt">0</b><i>/${TOTAL_TESTS}</i></span>
        <span class="olap-s olap-clk"><em>elapsed</em><b class="olap-vk">0:00</b></span>
      </div>
      <div class="olap-wt">
        <div class="olap-wh">${WTREEIC}<span>Worktrees</span><b class="olap-vw">${NLANE} running</b></div>
        <div class="olap-ws">${laneHtml}</div>
      </div>
      <div class="olap-fin" style="height:0px">
        <div class="olap-fa">
          <span class="olap-ghl"><img src="${x.brand('github-logo.svg')}" alt=""/></span>
          <span class="olap-ghn"><b>${x.esc(OWNER)}</b><i>/</i><b class="olap-ghr">${x.esc(REPO)}</b></span>
          <span class="olap-ghb">${BRANCHIC}${MAIN}</span>
          <span class="olap-ghp"><i class="olap-gsp"></i>${x.OK}<span class="olap-gpt">Pushing</span></span>
        </div>
        <div class="olap-fb">
          ${PRIC}<span class="olap-prt">${x.esc(PR)}</span>
          ${ciHtml}
          <span class="olap-mgb">${MERGEIC}Merged into main</span>
        </div>
      </div>
    </div>`);

    const $ = (s) => card.querySelector(s);
    const laneEls = [...card.querySelectorAll('.olap-lane')].map((n) => {
      const items = [...n.querySelectorAll('.olap-ti')];
      return {
        n, items, idx: -1,
        w: n.querySelector('.olap-work'), m: n.querySelector('.olap-ml'),
        ts: n.querySelector('.olap-tks'), ld: n.querySelector('.olap-ld'), pf: n.querySelector('.olap-pf'),
      };
    });
    const vf = $('.olap-vf'), vc = $('.olap-vc'), vt = $('.olap-vt'), vk = $('.olap-vk'), vw = $('.olap-vw');
    const pill = $('.olap-pill'), pl = $('.olap-pl'), spine = $('.olap-spin'), pOk = pill.querySelector('.qc-ok');
    const rec = $('.olap-rec'), badge = $('.olap-bg'), tsCell = $('.olap-ts');
    const fin = $('.olap-fin'), ghp = $('.olap-ghp'), gsp = $('.olap-gsp'), gOk = ghp.querySelector('.qc-ok'), gpt = $('.olap-gpt');
    const prRow = $('.olap-prt'), ccp = fin.querySelector('.olap-fb'), mgb = $('.olap-mgb');
    const ciEls = [...card.querySelectorAll('.olap-ch')].map((n) => ({ n, sp: n.querySelector('.olap-csp'), ok: n.querySelector('.qc-ok'), lb: n.querySelector('.olap-cl') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;

    let shown = -1, lastDone = null, lastPush = false, lastVw = '';

    return {
      // the reply text is the LAST node: the card is what the timelapse is about, the done line lands under it
      nodes: [card, say],
      marks: [[T.card, card], [T.done, card], [T.say, say]],
      render(t) {
        const n = streamCount(o.say, T.say + 0.03, 96, t);
        if (n !== shown) { vis.textContent = o.say.slice(0, n); hid.textContent = o.say.slice(n); shown = n; }

        // the card rises in, then holds perfectly still (no drift: a frozen frame must be identical)
        const ci = outCubic(seg(t, T.card, T.card + 0.40));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 16).toFixed(2)}px)`;

        const done = t >= T.done;
        // the one clock the whole card runs on: 0 until the lanes start, 1 the moment the last branch is in
        const gp = done ? 1 : seg(t, T.run, T.merge[NLANE - 1]);

        // the clock races 0:00 to 3:40; files, commits and tests home on their final values
        vk.textContent = clock(done ? TOTAL_SECS : Math.round(TOTAL_SECS * Math.pow(gp, 0.82)));
        if (vf.textContent !== String(Math.round(gp * TOTAL_FILES))) vf.textContent = String(Math.round(gp * TOTAL_FILES));
        if (vc.textContent !== String(Math.round(gp * TOTAL_COMMITS))) vc.textContent = String(Math.round(gp * TOTAL_COMMITS));
        const testP = done ? 1 : seg(t, T.run, T.ciOk[1]);
        if (vt.textContent !== String(Math.round(testP * TOTAL_TESTS))) vt.textContent = String(Math.round(testP * TOTAL_TESTS));

        // the badge: a red dot ticking while cooking, a stopped square when the run lands; the pill flips to Done
        if (done !== lastDone) {
          badge.classList.toggle('is-stop', done);
          pill.classList.toggle('is-done', done);
          tsCell.classList.toggle('is-ok', done);
          pl.textContent = done ? 'Done' : 'Cooking';
          lastDone = done;
        }
        rec.style.opacity = done ? '1' : (0.45 + 0.55 * Math.abs(Math.sin(t * 7.4))).toFixed(3);
        spine.style.opacity = done ? '0' : '1';
        spine.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const po = seg(t, T.done, T.done + 0.24);
        pOk.style.opacity = po.toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, po).toFixed(4)})`;

        // ---- the four worktree lanes: all working at once, then merging into main one after another ----
        let merged = 0;
        for (let i = 0; i < NLANE; i++) {
          const lane = laneEls[i];
          const m = T.merge[i];
          const mp = outCubic(seg(t, m, m + MP));
          if (mp >= 1) merged++;
          const lp = clamp((t - T.run) / Math.max(0.001, m - T.run));   // this lane's own 0..1 while it works

          lane.n.style.height = (LH - (LH - ML) * mp).toFixed(2) + 'px';
          // the lane folds up into its merge line: the work slides out the top as the merge line rises to meet it
          lane.w.style.opacity = (1 - mp).toFixed(3);
          lane.w.style.transform = mp ? `translateY(${(-9 * mp).toFixed(2)}px)` : 'none';
          lane.m.style.opacity = mp.toFixed(3);
          lane.m.style.transform = mp >= 1 ? 'none' : `translateY(${((1 - mp) * 9).toFixed(2)}px)`;
          lane.m.classList.toggle('is-in', mp > 0.35);
          // the progress bar fills continuously (never a row landing per tick) and slams to full as the lane merges
          const fill = mp > 0 ? 1 : lp;
          lane.pf.style.transform = `scaleX(${fill.toFixed(4)})`;
          lane.pf.classList.toggle('is-merged', mp > 0);
          // the lines-added counter rolls with the lane's own progress
          const ld = '+' + fmt(Math.round(LANES[i][1] * fill));
          if (lane.ld.textContent !== ld) lane.ld.textContent = ld;

          // the ticker: file paths and tasks slide past at a constant rate, frozen where the lane was when it merged
          const tt = clamp(t - T.run, 0, Math.max(0, m - T.run));
          const len = LANES[i][2].length * ITEM_W;
          const off = (tt * TICK_V) % len;
          lane.ts.style.transform = `translateX(${(-off).toFixed(1)}px)`;
          const idx = Math.floor((off + TICK_MID) / ITEM_W) % LANES[i][2].length;
          if (idx !== lane.idx) {
            const N2 = LANES[i][2].length;
            for (let j = 0; j < lane.items.length; j++) lane.items[j].classList.toggle('is-now', j % N2 === idx);
            lane.idx = idx;
          }
        }
        const vwTxt = `${NLANE - merged} running`;
        if (vwTxt !== lastVw) { vw.textContent = merged >= NLANE ? 'merged into main' : vwTxt; lastVw = vwTxt; }

        // ---- the GitHub finish: the push, PR #1, its checks going green, then the merge ----
        const fp = outCubic(seg(t, T.push, T.push + 0.30));
        fin.style.height = (FINH * fp).toFixed(2) + 'px';
        fin.style.opacity = fp.toFixed(3);

        if (t >= T.push !== lastPush) {
          lastPush = t >= T.push;
          ghp.classList.toggle('is-pushed', lastPush);
          gsp.style.display = lastPush ? 'none' : '';
          gOk.style.opacity = lastPush ? '1' : '0';
          gpt.textContent = lastPush ? `Pushed ${TOTAL_COMMITS} commits` : 'Pushing';
        }
        gsp.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;

        // the PR title fades up as the PR row opens, and again as the merge lands: from then on the merge badge carries it
        const prP = outCubic(seg(t, T.pr, T.pr + 0.26));
        const o2 = seg(t, T.mergeMain, T.mergeMain + 0.22);
        prRow.style.opacity = (prP * (1 - o2 * 0.55)).toFixed(3);
        prRow.style.transform = prP >= 1 ? 'none' : `translateY(${((1 - prP) * 6).toFixed(2)}px)`;
        ccp.style.opacity = prP.toFixed(3);
        ciEls.forEach(({ n: el, sp, ok, lb }, i) => {
          const inP = outCubic(seg(t, T.ci + i * 0.05, T.ci + i * 0.05 + 0.22));
          const ok2 = t >= T.ciOk[i];
          el.style.opacity = inP.toFixed(3);   // the three checks queue in one after another as the row opens
          el.classList.toggle('is-ok', ok2);
          sp.style.opacity = ok2 ? '0' : '1';
          sp.style.transform = `rotate(${((t - T.ci) * 380).toFixed(1)}deg)`;
          ok.style.opacity = ok2 ? '1' : '0';
          ok.style.transform = `scale(${lerp(0.4, 1, outCubic(seg(t, T.ciOk[i], T.ciOk[i] + 0.16))).toFixed(3)})`;
          const label = CI[i][1] === 'test' ? `${CI[i][1]} ${Math.round(testP * TOTAL_TESTS)}/${TOTAL_TESTS}` : CI[i][1];
          if (lb.textContent !== label) lb.textContent = label;
        });

        // 'Merged into main': the purple badge lands as the last check goes green
        const mgP = outCubic(seg(t, T.mergeMain, T.mergeMain + 0.24));
        mgb.style.opacity = mgP.toFixed(3);
        mgb.style.transform = mgP >= 1 ? 'none' : `translateY(${((1 - mgP) * 7).toFixed(2)}px) scale(${lerp(0.9, 1, mgP).toFixed(3)})`;
      },
    };
  },
};