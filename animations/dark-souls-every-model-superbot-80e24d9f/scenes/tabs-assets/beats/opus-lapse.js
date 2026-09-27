// Opus 5.5 beat (file name kept from the timelapse it replaces), the LAST working step of ?v=4: Claude Opus 5.5 wires everything the other models produced into the
// Dark Souls build (Meshy's meshes, Hailuo's clips, ElevenLabs' score) and then works the repo on GitHub. The card is
// two panels: a FILES panel where file paths light up as the agent edits them (an M or A badge, a green/red diff-stat
// bar, the one-line task each change completes) and a GITHUB panel underneath it (the branch, commits streaming with
// short sha + message, the push count, the pull request, its CI checks spinning up green, and the merge). It runs as a
// hard, fast timelapse: the elapsed clock races 0:00 to 3:40, the file list churns several rows a second and blurs at
// peak, and the whole thing ends on 'Merged into main' and the done line. NO SOURCE CODE IS EVER SHOWN: the rows are
// paths and plain-language tasks, never the code that does them.
//
// Layout: 30 (header) + 24 (stat strip) + 20 + 162 (files panel) + 18 + 98 (github panel) = 352 design px, fixed for
// the whole beat, inside the ~380px the v4 reply column can show above the composer (the thread is bottom-anchored,
// so anything taller would be clipped off the top of the feed). The github panel's 98px is the commit stream alone
// while it runs; the PR row (20), the checks (18) and the merge (18) then open under it, each taking its height out of
// the stream, which settles to 42px (three commits). Width fills the reply column (--hub-reply, 471px).
//
// IMAGERY / SOURCING: this beat draws no raster imagery. The two third-party marks are the Claude logomark
// (brand/claude-logo.svg) and the GitHub mark (brand/github-logo.svg), both already vendored in this ad and both used
// by chat.js (APPS.opus, APPS.github) and by beats/git.js. Source of record is brand/CREDITS.txt: "claude-logo.svg,
// Claude mark, https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/claude.svg (simple-icons, CC0 1.0)"; and
// "github-logo.svg, GitHub mark, https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg". Both are used
// nominatively, to name the model and the host the request went through. Every other glyph (branch, pull request,
// merge, check, record dot, diff blocks) is first-party UI chrome drawn in the same stroked style as beats/git.js.
// File paths, commit messages, line counts and shas are made up for the spot and do not describe a real repository.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame. Every moving value below is written from t in render.
import { clamp, lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Wired in every asset and merged to main.';
const OWNER = 'sam';
const REPO = 'dark-souls';
const BRANCH = 'opus/dark-souls';
const PR = '#1 Dark Souls: combat, bosses, world, assets';
const CI = [['build', 'build'], ['test', 'test'], ['lint', 'lint']];

const BRANCHIC = '<svg class="olap-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const PRIC = '<svg class="olap-ghic" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M6 8.4v7.2"/><circle cx="18" cy="18" r="2.4"/><path d="M18 15.6V9.6a3.2 3.2 0 0 0-3.2-3.2h-2.2"/><path d="M14.4 4.4 16.6 6.4l-2.2 2"/></svg>';
const MERGEIC = '<svg class="olap-ghic" viewBox="0 0 24 24"><circle cx="6" cy="5.6" r="2.4"/><circle cx="6" cy="18.4" r="2.4"/><circle cx="18" cy="18.4" r="2.4"/><path d="M6 8v8"/><path d="M18 16V11a5.4 5.4 0 0 0-5.4-5.4H6.2"/></svg>';

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- the work: one entry per file the agent edits, in landing order, grouped by the commit scope ----------
// [path, M or A, lines added, lines removed, the task that change completes]. Plain language only: a row is the path
// that changed and what it now does, never the code inside it. The asset rows are the other models' output arriving:
// the meshes from Meshy 5, the clips from MiniMax Hailuo 02, the tracks from ElevenLabs.
const EDIT = [
  ['combat', [
    ['src/combat/roll.ts', 'M', 42, 6, 'Roll with 13 i-frames'],
    ['src/combat/roll.ts', 'M', 18, 3, 'A roll costs 22 stamina'],
    ['src/combat/parry.ts', 'A', 31, 0, 'Parry window of 6 frames'],
    ['src/combat/stamina.ts', 'M', 27, 5, 'Stamina drains on every block'],
    ['src/combat/riposte.ts', 'A', 46, 0, 'Riposte off a landed parry'],
    ['src/combat/backstab.ts', 'A', 38, 0, 'Backstab from behind and above'],
    ['src/combat/poise.ts', 'M', 22, 9, 'Poise and stagger per armour set'],
    ['src/combat/hitbox.ts', 'M', 54, 12, 'Hitbox sweep on every attack frame'],
    ['src/combat/damage.ts', 'M', 33, 4, 'Damage types and resistances'],
    ['src/combat/recovery.ts', 'M', 19, 7, 'A roll cancels swing recovery'],
    ['src/combat/swing.ts', 'A', 61, 0, 'Light and heavy swing chains'],
    ['src/combat/scaling.ts', 'M', 15, 2, 'Weapon scaling folded into damage'],
  ]],
  ['bosses', [
    ['src/bosses/gatewarden.ts', 'A', 148, 0, 'Gatewarden fight, three phases'],
    ['src/bosses/gatewarden.ts', 'M', 62, 8, 'Phase two holds at half health'],
    ['src/bosses/gatewarden.ts', 'M', 44, 6, 'Phase three douses the arena'],
    ['src/bosses/telegraph.ts', 'A', 73, 0, 'Windup arcs telegraph a swing'],
    ['src/bosses/sweep.ts', 'M', 35, 11, 'Greatsword sweep leaves an opening'],
    ['src/bosses/fog-gate.ts', 'M', 26, 3, 'Death clears the fog gate'],
    ['src/bosses/gargoyles.ts', 'A', 91, 0, 'Bell gargoyles share one arena'],
    ['src/bosses/bridge.ts', 'M', 48, 5, 'Bridge drake strafes on a timer'],
    ['src/bosses/asylum.ts', 'A', 58, 0, 'Asylum slam sends a shockwave'],
    ['src/bosses/bar.ts', 'M', 21, 4, 'Boss bar shows once it aggros'],
    ['src/bosses/enrage.ts', 'M', 29, 9, 'Enrage past two minutes'],
    ['src/bosses/camera.ts', 'M', 17, 6, 'Camera holds through a phase turn'],
  ]],
  ['world', [
    ['src/world/bonfire.ts', 'A', 84, 0, 'Bonfire rest respawns the level'],
    ['src/world/estus.ts', 'M', 23, 5, 'Estus refills to five charges'],
    ['src/world/firelink.ts', 'A', 67, 0, 'Firelink Shrine lights up'],
    ['src/world/shortcuts.ts', 'M', 41, 2, 'Shortcut doors open from the far side'],
    ['src/world/bloodstain.ts', 'A', 52, 0, 'Souls drop as one bloodstain'],
    ['src/world/streaming.ts', 'M', 96, 18, 'World streams between regions'],
    ['src/world/elevator.ts', 'A', 44, 0, 'Lift joins the parish and the shrine'],
    ['src/world/item-pickup.ts', 'M', 31, 4, 'Item pickup and inventory'],
    ['src/world/chest.ts', 'M', 19, 1, 'Chests, and one mimic'],
    ['src/world/notes.ts', 'A', 27, 0, 'Lore notes read on item pickup'],
    ['src/world/dialog.ts', 'M', 88, 14, 'NPC dialog trees branch on flags'],
    ['src/world/merchant.ts', 'A', 56, 0, 'Merchant stock trades for souls'],
  ]],
  ['enemies', [
    ['src/enemies/hollow.ts', 'A', 72, 0, 'Hollow patrol and aggro'],
    ['src/enemies/hollow.ts', 'M', 25, 6, 'Hollow flinches on heavy hits'],
    ['src/enemies/aggro.ts', 'M', 39, 10, 'Aggro chains to nearby foes'],
    ['src/enemies/senses.ts', 'A', 33, 0, 'Sight and hearing radius'],
    ['src/enemies/aggro.ts', 'M', 14, 3, 'Aggro drops after a cooldown'],
    ['src/enemies/pathfinding.ts', 'A', 118, 0, 'Pathfinding walks around props'],
    ['src/enemies/ambush.ts', 'M', 22, 4, 'Ambush spawns hold perfectly still'],
    ['src/enemies/archer.ts', 'M', 30, 8, 'Archers lead their shots'],
    ['src/enemies/packs.ts', 'A', 47, 0, 'Dog packs stagger their rush'],
    ['src/enemies/stagger.ts', 'M', 36, 12, 'Stagger meter fills on every hit'],
    ['src/enemies/combo.ts', 'M', 18, 5, 'Combos break after three swings'],
    ['src/enemies/tactics.ts', 'A', 41, 0, 'One foe hangs back in a group'],
  ]],
  ['render', [
    ['src/render/gi.ts', 'A', 132, 0, 'Bake global illumination'],
    ['src/render/blur.ts', 'M', 28, 7, 'Motion blur on the charge'],
    ['src/render/fog.ts', 'M', 34, 6, 'Fog volumes fill the gate'],
    ['src/render/torch.ts', 'A', 26, 0, 'Torch light fades with distance'],
    ['src/render/sparks.ts', 'A', 45, 0, 'Sparks on every parry'],
    ['src/render/shadows.ts', 'M', 57, 11, 'Shadow pass on enemies'],
    ['src/render/tone.ts', 'M', 21, 4, 'Tone curve and vignette'],
    ['src/render/atlas.ts', 'M', 63, 9, 'Pack the texture atlas'],
    ['src/render/grass.ts', 'A', 38, 0, 'Wind sways the grass'],
    ['src/render/water.ts', 'A', 42, 0, 'Reflection pass for the water'],
    ['src/render/haze.ts', 'M', 16, 2, 'Distance haze fades to black'],
    ['src/render/impact.ts', 'M', 24, 5, 'Damage flash on the impact frame'],
    ['src/render/shake.ts', 'A', 19, 0, 'Camera shake on heavy hits'],
    ['src/render/intro.ts', 'M', 31, 7, 'Boss intro camera move'],
  ]],
  ['assets', [
    ['assets/meshes/knight.glb', 'A', 12, 0, 'Knight mesh lands from Meshy'],
    ['assets/meshes/asylum_knight.glb', 'A', 9, 0, 'Undead knight mesh from Meshy'],
    ['assets/meshes/gatewarden.glb', 'A', 14, 0, 'Gatewarden mesh from Meshy'],
    ['assets/meshes/bonfire_sword.glb', 'A', 7, 0, 'Greatsword mesh from Meshy'],
    ['src/assets/meshes.ts', 'M', 46, 3, 'Load the four Meshy meshes at boot'],
  ]],
  ['clips', [
    ['assets/clips/fog-gate.mp4', 'A', 11, 0, 'Hailuo clip cut into the gate'],
    ['assets/clips/boss-burn.mp4', 'A', 8, 0, 'Hailuo clip of the boss burning'],
    ['assets/clips/gravestone.mp4', 'A', 8, 0, 'Hailuo clip at the gravestone'],
    ['assets/clips/outer-ward.mp4', 'A', 9, 0, 'Hailuo clip of the outer ward'],
    ['src/world/cinematics.ts', 'M', 74, 12, 'Play the four Hailuo clips in scene'],
  ]],
  ['audio', [
    ['audio/ashen-sanctuary.mp3', 'A', 6, 0, 'ElevenLabs track for the shrine'],
    ['audio/gatewarden-vo.mp3', 'A', 5, 0, 'ElevenLabs voice for the Gatewarden'],
    ['src/audio/score.ts', 'M', 52, 9, 'Score follows the region and the aggro'],
  ]],
  ['ui', [
    ['src/ui/hud.ts', 'M', 88, 15, 'Health bar drains over the red'],
    ['src/ui/estus.ts', 'A', 29, 0, 'Estus charge sits in the hotbar'],
    ['src/ui/menu.ts', 'M', 64, 11, 'Menu pages and the equip screen'],
    ['src/ui/vignette.ts', 'A', 21, 0, 'Vignette pulses on low health'],
  ]],
  ['tests', [
    ['tests/combat.test.ts', 'M', 96, 18, 'Roll, parry and stamina suites'],
    ['tests/bosses.test.ts', 'A', 58, 0, 'Every boss phase under test'],
    ['tests/world.test.ts', 'M', 41, 7, 'Bonfire and respawn suites'],
  ]],
  ['docs', [
    ['README.md', 'M', 34, 6, 'README with the build and the credits'],
    ['docs/design.md', 'A', 72, 0, 'Design doc for the whole build'],
  ]],
];

// flatten to the landing order. Each entry carries its commit scope, so the commit stream reads like a real log
// ("combat: Roll with 13 i-frames") for the same change the file row above it is making.
const FILES = [];
EDIT.forEach(([scope, list]) => list.forEach(([path, kind, add, del, task]) => FILES.push({ scope, path, kind, add, del, task })));
const NF = FILES.length;         // 84 files
const NC = NF;                   // 84 commits, one per file
const TOTAL_TESTS = 312;         // the suite goes green as the last checks land
const TOTAL_SECS = 220;          // the clock the timelapse counts to: 3:40

// the diff-stat bar, five blocks like GitHub's: as many green as the add/remove ratio asks for, the rest red
const diffBlocks = (add, del) => {
  const a = clamp(Math.round(5 * add / Math.max(1, add + del)), 0, 5);
  return '<b class="is-a"></b>'.repeat(a) + '<b class="is-d"></b>'.repeat(5 - a);
};
// short sha: made up, deterministic from the row index so a frozen frame is identical
const sha = (i) => Math.floor(rand(i * 3.7 + 1.1) * 0xfffffff).toString(16).padStart(7, '0').slice(0, 7);

// ---------- constants ----------
const DEF = { say: SAY };
const FRH = 15;         // design px: one file row
const FVIEW = 162;      // the files pane's height (20 header + 162 = the files panel)
const CRH = 14;         // design px: one commit row
const CPANE = 98;       // the commit pane's height while the commits stream (7 rows); it settles to 98 - 56 = 42
const PRH = 20, CIH = 18, MGH = 18;   // the rows that open under the commit stream, each taking its height out of it
const CROSS = 0.12;     // the landing curve starts this far in, so row 1 lands at once

// the landing front: files edited = NF * ramp(prog). A smootherstep that starts at a readable few rows a second,
// runs as a blur through the middle and eases onto the last rows. ramp and its slope are closed form, so a frozen
// frame is exact.
const ramp = (p) => { const x = CROSS + (1 - CROSS) * p; return x * x * x * (x * (x * 6 - 15) + 10); };
const slope = (p) => { const x = CROSS + (1 - CROSS) * p; return 30 * x * x * (x - 1) * (x - 1) * (1 - CROSS); };

export default {
  times(r, opts) {
    const T = { r };
    T.card = r + 0.10;             // the card rises into the thread
    T.run = T.card + 0.55;         // the thread has stopped gliding, so the whole card is in frame: the clock starts
    T.edit = [T.run, r + 4.35];    // files and commits land over this window, hard then easing
    T.push = r + 4.55;             // the branch is pushed: 'Pushed 84 commits'
    T.pr = r + 4.72;               // the pull request opens
    T.ci = r + 4.92;               // the three checks start spinning
    T.ciOk = [r + 5.26, r + 5.40, r + 5.54];
    T.merge = r + 5.86;            // merged into main
    T.done = r + 6.06;             // everything landed: clock 3:40, counters home, the badge stops
    T.say = r + 6.16;              // the done line streams
    T.end = T.say + 0.84;          // r + 7.00
    return T;
  },
  build(k, x) {
    const T = k.T;
    const o = { ...DEF, ...(k.opts || {}) };
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(o.say)}</span></div>`);

    const fileRows = FILES.map((f) => `<div class="olap-er">
      <span class="olap-ek is-${f.kind === 'A' ? 'a' : 'm'}">${f.kind}</span>
      <span class="olap-ep">${x.esc(f.path)}</span>
      <span class="olap-et">${x.esc(f.task)}</span>
      <span class="olap-ed"><i class="olap-edb">${diffBlocks(f.add, f.del)}</i></span>
      <span class="olap-ex"><b>+${f.add}</b>${f.del ? `<i>-${f.del}</i>` : ''}</span>
    </div>`).join('');

    // commits newest first: row r is commit NC-1-r, so the stream slides DOWN as commits land, the way GitHub stacks
    // them. The message is the same change the file row above it just made, written as a conventional commit.
    const commitRows = FILES.map((f, i) => i).reverse().map((i) => `<div class="olap-cr">
      <span class="olap-cs">${sha(i)}</span>
      <span class="olap-cm">${x.esc(FILES[i].scope + ': ' + FILES[i].task)}</span>
    </div>`).join('');

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
      <div class="olap-edit">
        <div class="olap-eh"><span>Editing files</span><b class="olap-ve">0</b></div>
        <div class="olap-el"><div class="olap-ec">${fileRows}</div><i class="olap-sw"></i></div>
      </div>
      <div class="olap-gh">
        <div class="olap-ghd">
          <span class="olap-ghl"><img src="${x.brand('github-logo.svg')}" alt=""/></span>
          <span class="olap-ghn"><b>${x.esc(OWNER)}</b><i>/</i><b class="olap-ghr">${x.esc(REPO)}</b></span>
          <span class="olap-ghb">${BRANCHIC}${x.esc(BRANCH)}</span>
          <span class="olap-ghp"><i class="olap-gsp"></i>${x.OK}<span class="olap-gpt">Pushing</span></span>
        </div>
        <div class="olap-cc"><div class="olap-ccl">${commitRows}</div></div>
        <div class="olap-pr">
          ${PRIC}<span class="olap-prt">${x.esc(PR)}</span>
          <span class="olap-pst">Open</span>
        </div>
        <div class="olap-ci">${ciHtml}</div>
        <div class="olap-mg"><span class="olap-mgb">${MERGEIC}Merged into main</span></div>
      </div>
    </div>`);

    const $ = (s) => card.querySelector(s);
    const fileEls = [...card.querySelectorAll('.olap-er')];
    const fileMeta = fileEls.map((n) => ({ n, bar: n.querySelector('.olap-edb'), ok: n.querySelector('.olap-ex') }));
    const commitEls = [...card.querySelectorAll('.olap-cr')];
    const list = $('.olap-ec'), sw = $('.olap-sw');
    const vf = $('.olap-vf'), vc = $('.olap-vc'), vt = $('.olap-vt'), vk = $('.olap-vk'), ve = $('.olap-ve');
    const pill = $('.olap-pill'), pl = $('.olap-pl'), spine = $('.olap-spin'), pOk = pill.querySelector('.qc-ok');
    const rec = $('.olap-rec'), badge = $('.olap-bg'), tsCell = $('.olap-ts');
    const ghp = $('.olap-ghp'), gsp = $('.olap-gsp'), gOk = ghp.querySelector('.qc-ok'), gpt = $('.olap-gpt');
    const ccl = $('.olap-ccl'), ccp = $('.olap-cc'), ciRow = $('.olap-ci');
    const prRow = $('.olap-pr'), pst = $('.olap-pst');
    const ciEls = [...card.querySelectorAll('.olap-ch')].map((n) => ({ n, sp: n.querySelector('.olap-csp'), ok: n.querySelector('.qc-ok'), lb: n.querySelector('.olap-cl') }));
    const mg = $('.olap-mg');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    const MAXOFF = Math.max(0, NF * FRH - FVIEW);
    let shown = -1, lastLand = -1, lastDone = null, lastCNew = -1, lastPushed = false;

    // one file row's state: rows above the front are edited (dim), the front row is the one being written (bright,
    // its diff bar still filling), rows below have not landed. Only the rows a frame changes are painted.
    const paint = (i, land) => {
      const m = fileMeta[i], on = i <= land;
      m.n.style.opacity = on ? '1' : '0';
      m.n.classList.toggle('is-done', i < land);
      m.n.classList.toggle('is-now', i === land);
      if (i < land) m.bar.style.transform = 'none';   // an edited file's diff bar is full; only the live one fills
    };

    return {
      // the reply text is the LAST node: the card is what the timelapse is about, the done line lands under it
      nodes: [card, say],
      marks: [[T.card, card], [T.done, card], [T.say, say]],
      render(t) {
        const n = streamCount(o.say, T.say + 0.05, 80, t);
        if (n !== shown) { vis.textContent = o.say.slice(0, n); hid.textContent = o.say.slice(n); shown = n; }

        // the card rises in, then holds perfectly still (no drift: a frozen frame must be identical)
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 16).toFixed(2)}px)`;

        // the timelapse: prog 0..1 over the edit window, land = how many files are done, frac = how far into the row
        // that is landing right now
        const prog = seg(t, T.edit[0], T.edit[1]);
        const done = t >= T.done;
        const landF = (done ? 1 : ramp(prog)) * NF;
        const land = Math.min(NF, Math.floor(landF));
        const frac = done ? 1 : landF - land;

        // the clock races 0:00 to 3:40; files, commits and tests home on their final values
        vk.textContent = clock(done ? TOTAL_SECS : Math.floor(TOTAL_SECS * Math.pow(prog, 0.86)));
        vf.textContent = String(Math.round(landF));
        ve.textContent = String(Math.round(landF)) + ' edited';
        const cf = (done ? 1 : ramp(seg(t, T.edit[0] + 0.12, T.edit[1]))) * NC;
        vc.textContent = String(Math.floor(cf));
        const testP = seg(t, T.edit[0], T.ciOk[1]);
        vt.textContent = String(Math.round((done ? 1 : testP) * TOTAL_TESTS));

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
        const po = seg(t, T.done, T.done + 0.26);
        pOk.style.opacity = po.toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, po).toFixed(4)})`;

        // the files pane: rows land in bursts, the list scrolls so the file being written sits at the bottom edge
        // paint every row between the old front and the new one, in either direction, so a jump backwards (the
        // player looping, a scrub) hides the rows past the front again instead of leaving them lit
        if (land !== lastLand) {
          const lo = Math.max(0, Math.min(lastLand, land) - 1), hi = Math.min(NF - 1, Math.max(lastLand, land));
          for (let i = lo; i <= hi; i++) paint(i, land);
          lastLand = land;
        }
        const nowRow = land < NF ? land : NF - 1;
        const nowMeta = fileMeta[nowRow];
        nowMeta.bar.style.transform = `scaleX(${clamp(frac * 1.15).toFixed(3)})`;
        // the scroll: the landing front is a pure function of landF, so the pane glides, never snaps
        const frontY = nowRow * FRH + FRH * clamp(frac);
        const off = clamp(frontY - FVIEW + FRH * 1.4, 0, MAXOFF);
        list.style.transform = off ? `translateY(${(-off).toFixed(1)}px)` : 'none';
        // the scan line: sits on the row being written, its brightness following the landing rate (a blur at peak)
        const rate = done ? 0 : slope(prog) * NF / (T.edit[1] - T.edit[0]);
        sw.style.transform = `translateY(${(nowRow * FRH + FRH - off).toFixed(1)}px)`;
        sw.style.opacity = (0.16 + 0.6 * clamp(rate / 40)).toFixed(3);

        // the commit stream: newest at the top, the column sliding down one row per commit, older ones out the bottom
        const c = Math.floor(cf);
        ccl.style.transform = `translateY(${((cf - NC) * CRH).toFixed(1)}px)`;
        const newRow = NC - c;
        if (newRow !== lastCNew) {
          if (lastCNew >= 0 && lastCNew < NC) commitEls[lastCNew].classList.remove('is-new');
          if (newRow >= 0 && newRow < NC) commitEls[newRow].classList.add('is-new');
          lastCNew = newRow;
        }

        // the push badge: spinning while commits stream, then 'Pushed 84 commits' with the check
        if (t >= T.push !== lastPushed) {
          lastPushed = t >= T.push;
          ghp.classList.toggle('is-pushed', lastPushed);
          gsp.style.display = lastPushed ? 'none' : '';
          gOk.style.opacity = lastPushed ? '1' : '0';
          gpt.textContent = lastPushed ? `Pushed ${NC} commits` : 'Pushing';
        }
        gsp.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;

        // the pull request, its checks and the merge open under the streaming commits. Each row that opens takes its
        // own height back out of the commit pane, so the card's total height never moves: the pane starts tall (98px,
        // seven commits streaming) and settles to 42 as the push, the PR, the checks and the merge arrive.
        const prP = outCubic(seg(t, T.pr, T.pr + 0.3));
        const ciP = outCubic(seg(t, T.ci - 0.06, T.ci + 0.3));
        const mgP = outCubic(seg(t, T.merge, T.merge + 0.34));
        ccp.style.height = (CPANE - PRH * prP - CIH * ciP - MGH * mgP).toFixed(2) + 'px';
        prRow.style.height = (PRH * prP).toFixed(2) + 'px';
        ciRow.style.height = (CIH * ciP).toFixed(2) + 'px';
        mg.style.height = (MGH * mgP).toFixed(2) + 'px';

        prRow.style.opacity = prP.toFixed(3);
        prRow.style.transform = prP >= 1 ? 'none' : `translateY(${((1 - prP) * 7).toFixed(2)}px)`;
        ciEls.forEach(({ n: el, sp, ok, lb }, i) => {
          const inP = outCubic(seg(t, T.ci + i * 0.06, T.ci + i * 0.06 + 0.24));
          const ok2 = t >= T.ciOk[i];
          el.style.opacity = inP.toFixed(3);   // the three checks queue in one after another as the row opens
          el.classList.toggle('is-ok', ok2);
          sp.style.opacity = ok2 ? '0' : '1';
          sp.style.transform = `rotate(${((t - T.ci) * 380).toFixed(1)}deg)`;
          ok.style.opacity = ok2 ? '1' : '0';
          ok.style.transform = `scale(${lerp(0.4, 1, outCubic(seg(t, T.ciOk[i], T.ciOk[i] + 0.18))).toFixed(3)})`;
          const label = CI[i][1] === 'test' ? `${CI[i][1]} ${Math.round((done ? 1 : testP) * TOTAL_TESTS)}/${TOTAL_TESTS}` : CI[i][1];
          if (lb.textContent !== label) lb.textContent = label;
        });
        // the PR's Open pill fades as the merge lands: from then on the merge row carries the state
        const o2 = seg(t, T.merge, T.merge + 0.26);
        pst.style.opacity = (1 - o2).toFixed(3);
        pst.style.transform = `scale(${lerp(1, 0.8, o2).toFixed(3)})`;

        // merged into main
        mg.style.opacity = mgP.toFixed(3);
        mg.style.transform = mgP >= 1 ? 'none' : `translateY(${((1 - mgP) * 8).toFixed(2)}px)`;
      },
    };
  },
};