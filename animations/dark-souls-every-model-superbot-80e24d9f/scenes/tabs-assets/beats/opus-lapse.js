// Opus 5.5 timelapse coding beat, the opener of ?v=4. Claude Opus 5.5 cooks the whole Dark Souls codebase on a fast,
// hard-cut timelapse: a mini IDE card in the thread column whose file tree fills in bursts (~84 files), whose editor
// pane slams from one region of the repo to the next every ~0.35s under a scan sweep, whose elapsed clock races 0:00
// to 3:40, whose counters climb (files 0 -> 84, lines +0 -> +12,480, tests 0/312 -> 312/312 passing), and whose commit
// feed ticks a line per burst. It ends on the done line.
//
// Pattern source (READ ONLY, another chat owns it): make-minecraft-every-model-superbot-b055c127/scenes/tabs-assets/
// beats/opus-code.js. Same framing: a card with a repo header, a file list and a source pane whose lines are revealed
// by a clip; here the reveal is cut into timelapse frames instead of typed file by file, and the pane is a viewport
// that cuts and wraps through the whole document rather than a pane per file.
//
// IMAGERY / SOURCING: this beat draws no raster imagery. The only third-party mark is the Claude logomark,
// brand/claude-logo.svg, already vendored in this ad and already used by chat.js (APPS.opus). Source of record is
// brand/CREDITS.txt: "claude-logo.svg, Claude mark, https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/claude.svg
// (simple-icons, CC0 1.0). Fill set to #fff for the dark hub tile. Trademark of Anthropic." Used nominatively, to name
// the model superbot routed the request to. Everything else in the card (chrome, gutter, badge, scan sweep) is CSS on
// first-party UI chrome, not hand-drawn illustration. File names, line counts, commit subjects and test totals are made
// up for the spot.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame.
import { clamp, lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Engine, combat and bosses done.';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- the repo: the 84 files that land, grouped, in landing order (src first, tests last) ----------
const LAYOUT = [
  ['src', ['main.ts', 'app.ts', 'boot.ts', 'config.ts', 'input.ts', 'time.ts', 'save.ts', 'audio.ts']],
  ['src/combat', ['roll.ts', 'parry.ts', 'stamina.ts', 'hitbox.ts', 'poise.ts', 'weapon.ts', 'lockon.ts', 'riposte.ts', 'backstab.ts', 'damage.ts', 'frames.ts', 'combat.ts']],
  ['src/bosses', ['gatewarden.ts', 'gatewarden.fsm.ts', 'gatewarden.phases.ts', 'telegraph.ts', 'bridge.ts', 'asylum.ts', 'bell.gargoyles.ts', 'loot.ts', 'arena.ts']],
  ['src/ai', ['hollow.ts', 'hollow.fsm.ts', 'aggro.ts', 'patrol.ts', 'path.ts', 'brains.ts', 'wander.ts', 'states.ts']],
  ['src/world', ['firelink.ts', 'bonfire.ts', 'respawn.ts', 'fog.wall.ts', 'regions.ts', 'lore.ts', 'shortcuts.ts', 'door.ts', 'npc.ts', 'items.ts']],
  ['src/render', ['fog_gate.ts', 'renderer.ts', 'lighting.ts', 'shader.ts', 'camera.ts', 'post.ts', 'tone.ts', 'atlas.ts', 'particles.ts', 'fog.ts']],
  ['src/physics', ['collider.ts', 'raycast.ts', 'terrain.ts', 'sweep.ts', 'gravity.ts']],
  ['src/ui', ['hud.ts', 'health.bar.ts', 'stamina.bar.ts', 'estus.ts', 'menu.ts', 'dialog.ts']],
  ['src/net', ['session.ts', 'coop.ts', 'invaders.ts', 'messages.ts']],
  ['test', ['roll.test.ts', 'parry.test.ts', 'stamina.test.ts', 'gatewarden.test.ts', 'bonfire.test.ts', 'aggro.test.ts', 'damage.test.ts', 'frames.test.ts', 'respawn.test.ts', 'loot.test.ts', 'telegraph.test.ts', 'fog.test.ts']],
];
const FILES = [];
LAYOUT.forEach(([dir, names]) => names.forEach((name) => FILES.push({ dir, name, path: `${dir}/${name}` })));
const NFILES = FILES.length;                       // 84
// the tree rows the pane draws: a directory row before its first file, then the file rows under it
const ROWS = [];
FILES.forEach((f, i) => {
  if (!i || FILES[i - 1].dir !== f.dir) ROWS.push({ dir: true, text: f.dir, at: i });
  ROWS.push({ dir: false, text: f.name, at: i });
});
// per-file line counts, deterministic, scaled so the whole build is exactly 12,480 lines
const RAW = FILES.map((_, i) => 22 + Math.floor(rand(i * 3.7 + 1.1) * 250));
const RAWSUM = RAW.reduce((a, b) => a + b, 0);
const LINES = RAW.map((n) => Math.max(8, Math.round(n * 12480 / RAWSUM)));
LINES[0] += 12480 - LINES.reduce((a, b) => a + b, 0);
const TOTAL_LINES = LINES.reduce((a, b) => a + b, 0);    // exactly 12480
const TOTAL_TESTS = 312;

// ---------- the source document: the repo the pane cuts through ----------
// Each snippet is [file path, lines]. They concatenate into one long document; the pane cuts and wraps through it, so
// a cut can slam from the middle of one file into the middle of another, which is what a timelapse of a codebase looks
// like. Written to read as souls-like TypeScript, never as filler.
const SNIPPETS = [
  ['src/combat/roll.ts', [
    'import { Hit, Frames } from "./frames";',
    'import { Stamina } from "./stamina";',
    '',
    '// a forward roll: 12 i-frames, 34 recovery frames, hard stamina gate',
    'export function roll(e: Player, dir: Vec3, stamina: Stamina): Frames {',
    '  if (e.state !== "idle" && e.state !== "block") return Frames.NONE;',
    '  if (!stamina.take(ROLL_COST)) return Frames.NONE;',
    '  e.state = "roll";',
    '  e.vel = dir.norm().scale(7.4);',
    '  return new Frames(0, 12, 34);',
    '}',
    '',
    'export const ROLL_COST = 26;   // a sword swing is 18, so two rolls drain a full bar',
    'export function canRoll(e: Player) { return e.poise > 0 && e.state !== "hit"; }',
  ]],
  ['src/combat/parry.ts', [
    'import { frames, WINDOW } from "./frames";',
    '',
    '// parry: the swing has to land inside the first 8 frames of the shield throw',
    'export function parry(e: Player, foe: Entity, t: number) {',
    '  if (!frames(e, "parry").covers(t)) return false;',
    '  const swing = attackOf(foe);',
    '  if (!swing || swing.kind === "greatsword") return false;   // too heavy to turn aside',
    '  e.riposte = { foe, until: t + WINDOW.riposte };',
    '  foe.state = "stagger";',
    '  stagger(foe, 34);',
    '  return true;',
    '}',
    '',
    'export function riposte(e: Player, foe: Entity) {',
    '  if (!e.riposte || e.riposte.foe !== foe) return 0;',
    '  return e.weapon.crit(foe);   // about 3.1x a heavy, and it lands through poise',
    '}',
  ]],
  ['src/combat/stamina.ts', [
    'export class Stamina {',
    '  private v = 118;',
    '  private hold = 0;',
    '',
    '  get value() { return this.v; }',
    '',
    '  take(n: number) {',
    '    if (this.v < n) return false;',
    '    this.v -= n; this.hold = REGEN_DELAY;',
    '    return true;',
    '  }',
    '',
    '  // regen stalls for 0.6s after any spend: that stall is what makes spam lose',
    '  tick(dt: number, blocking: boolean) {',
    '    if (this.hold > 0) { this.hold -= dt; return; }',
    '    const rate = blocking ? 14 : 42;',
    '    this.v = Math.min(118, this.v + rate * dt);',
    '  }',
    '}',
  ]],
  ['src/bosses/gatewarden.ts', [
    'import { phaseFor } from "./gatewarden.phases";',
    '',
    '// the Gatewarden: three phases, a greatsword, and a fog gate that does not open until he falls',
    'export function step(b: Boss, t: number, dt: number) {',
    '  const p = phaseFor(b.hp, b.max);',
    '  if (p !== b.phase) enterPhase(b, p);',
    '  switch (b.phase) {',
    '    case 1: return idleSweep(b, t, dt);',
    '    case 2: return press(b, t, dt);      // he stops waiting between swings',
    '    case 3: return enrage(b, t, dt);     // and the arena goes dark',
    '  }',
    '}',
    '',
    'export function telegraph(b: Boss, who: Entity) {',
    '  const arc = windup(b.weapon, who.pos);',
    '  b.tell = { arc, frames: arc > 2.6 ? 26 : 14 };',
    '  return b.tell;',
    '}',
  ]],
  ['src/world/firelink.ts', [
    'import { Regions } from "./regions";',
    '',
    '// Firelink: the bonfire that survives your death, and the respawn it writes',
    'export const FIRELINK = Regions.declare("firelink", {',
    '  music: "firelink.ogg",',
    '  safe: true,',
    '  respawn: { x: 12.5, y: 0.0, z: -3.25, yaw: 1.57 },',
    '});',
    '',
    'export function light(bonfire: Bonfire, player: Player) {',
    '  if (bonfire.lit) return false;',
    '  bonfire.lit = true;',
    '  player.estus = 5;             // and every rest after this one refills them',
    '  player.flask = 3;',
    '  save(player.save, { bonfire: bonfire.id });',
    '  return true;',
    '}',
    '',
    'export function warp(player: Player, to: Bonfire) {',
    '  player.pos = { ...to.spawn }; player.vel = Vec3.ZERO;',
    '}',
  ]],
  ['src/ai/hollow.ts', [
    'import { create } from "./brains";',
    '',
    '// a hollow walks its patrol until it sees you, and then it screams',
    'export const hollow = create({',
    '  sense: { sight: 18, hearing: 11, forget: 6.5 },',
    '  moves: ["walk", "lunge", "flail"],',
    '  poise: 12,',
    '});',
    '',
    'hollow.on("tick", (s, world, dt) => {',
    '  if (s.alert > 0) return lunge(s, world, dt);',
    '  if (sees(s, world.player)) { s.alert = AGGRO; scream(s); return; }',
    '  return walkPath(s, world, dt);',
    '});',
    '',
    'export function aggro(s: Ai, player: Player, n = 1) {',
    '  if (s.alert >= AGGRO) return false;',
    '  s.alert = Math.min(AGGRO, s.alert + n * 0.35);',
    '  return true;',
    '}',
  ]],
  ['src/render/fog_gate.ts', [
    'import { Quad } from "./shader";',
    '',
    '// the fog gate: a wall you cannot walk through until the boss behind it dies',
    'export function render(gate: Gate, boss: Boss, time: number) {',
    '  if (boss.dead) return;',
    '  FOG_GATE.uniform("time", time);',
    '  FOG_GATE.uniform("seed", gate.seed);',
    '  FOG_GATE.draw(gate.plane);',
    '}',
    '',
    'export const FOG_GATE = Quad.compile([',
    '  "vec3 warm = vec3(0.92, 0.74, 0.42);",',
    '  "vec3 cold = vec3(0.36, 0.40, 0.52);",',
    '  "float n = fbm(uv * 6.0 + time * 0.45);",',
    '  "float a = smoothstep(0.18, 0.92, n) * 0.72;",',
    '  "frag = vec4(mix(cold, warm, a), a);",',
    '].join("\\n"));',
    '',
    'export function blocks(gate: Gate, p: Vec3) {',
    '  return !gate.open && gate.plane.side(p) < 0;',
    '}',
  ]],
  ['src/physics/raycast.ts', [
    'import { Box, Ray } from "./collider";',
    '',
    'const EPS = 0.0005;',
    '',
    'export function raycast(world: World, ray: Ray, far: number): Hit | null {',
    '  let best: Hit | null = null;',
    '  const boxes = world.broadphase(ray, far);',
    '  for (const b of boxes) {',
    '    const t = slab(ray, b, EPS);',
    '    if (t < 0 || t > far) continue;',
    '    if (!best || t < best.t) best = { t, box: b, normal: normalAt(ray, b, t) };',
    '  }',
    '  return best;',
    '}',
    '',
    'function slab(ray: Ray, b: Box, eps: number) {',
    '  const inv = ray.dir.inv();',
    '  const a = b.min.sub(ray.o).mul(inv);',
    '  const c = b.max.sub(ray.o).mul(inv);',
    '  const lo = a.min(c), hi = a.max(c);',
    '  return Math.max(lo.x, lo.y, lo.z) <= Math.min(hi.x, hi.y, hi.z) ? lo.max(hi) : -1;',
    '}',
  ]],
  ['test/roll.test.ts', [
    'import { roll, ROLL_COST } from "../src/combat/roll";',
    '',
    'describe("roll", () => {',
    '  it("spends a quarter of the bar", () => {',
    '    const s = new Stamina();',
    '    roll(player(), dir(), s);',
    '    expect(s.value).toBe(118 - ROLL_COST);',
    '  });',
    '',
    '  it("grants twelve i-frames and no more", () => {',
    '    const f = roll(player(), dir(), new Stamina());',
    '    expect(f.start).toBe(0);',
    '    expect(f.iframes).toBe(12);',
    '    expect(f.end).toBe(34);',
    '  });',
    '',
    '  it("refuses a roll with an empty bar", () => {',
    '    const s = new Stamina(); s.take(118);',
    '    expect(roll(player(), dir(), s).isNone).toBe(true);',
    '  });',
    '});',
  ]],
];

// the document: every snippet line, numbered inside its own file, highlighted once at build
const KEYWORDS = 'import|export|from|const|let|function|return|if|else|for|of|in|switch|case|break|continue|class|new|this|extends|implements|interface|type|enum|private|public|readonly|async|await|throw|while|try|catch|null|undefined|true|false|void|describe|it|expect';
const TYPES = 'Vec3|Quat|Hit|Frames|Ray|Box|Entity|World|Player|Boss|Ai|State|Gate|Stamina|Weapon|Bonfire|Regions|Quad|Mesh|Action|Phase|Team';
const RX = new RegExp(
  `(\\/\\/.*$)|(\`[^\`]*\`|"[^"]*"|'[^']*')|\\b(${KEYWORDS})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${TYPES})\\b|\\b([A-Za-z_]\\w*)(?=\\()`, 'g');

function hl(line) {
  let out = '', i = 0;
  for (const m of line.matchAll(RX)) {
    out += esc(line.slice(i, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : m[5] ? 'y' : 'f';
    out += `<i class="olap-${cls}">${esc(m[0])}</i>`;
    i = m.index + m[0].length;
  }
  return out + esc(line.slice(i));
}

// the snippet's file path -> its index in FILES, so the editor tab always names the file the visible lines belong to
const fileAt = (p) => {
  const i = FILES.findIndex((f) => f.path === p);
  if (i < 0) throw new Error(`opus-lapse: snippet file ${p} is not in the file tree`);
  return i;
};
const DOC = [];
SNIPPETS.forEach(([p, rows]) => rows.forEach((s, n) => DOC.push({ f: fileAt(p), ln: n + 1, h: hl(s) || ' ' })));
const DOCL = DOC.length;

// ---------- the commit feed: one tick per timelapse burst ----------
const COMMITS = [
  ['4f1c9a2', 'chore(repo): scaffold and tsconfig', 96],
  ['b8d30e7', 'feat(core): locked 60fps sim loop', 412],
  ['c17a204', 'feat(combat): stamina drain and regen', 388],
  ['9ea5b10', 'feat(combat): 12 i-frames on roll', 511],
  ['77c2d6f', 'feat(bosses): Gatewarden, three phases', 764],
  ['3ab90c4', 'feat(world): bonfire and respawn', 602],
  ['e5f71b8', 'fix(ai): hollow aggro leak on respawn', 143],
  ['5c0d7a1', 'test(combat): roll, parry, stamina suites', 940],
  ['d21e6a5', 'chore(build): green, 312 tests passing', 218],
];

// ---------- constants ----------
const DEF = { say: SAY, span: 4.4 };
const CUTS = 13;    // hard timelapse cuts across the run: one every 0.34s at span 4.4
const VIS = 11;     // editor lines on screen
const TREE_VIS = 11;    // tree rows on screen
const RH = 15, LH = 13; // design px: tree row height, code line height
const CODE_H = 143;     // the code pane's height (11 lines of 13px)
const CYCLE = 2.4;      // how many times the pan wraps through the whole document across the run
const SPAN = DOCL - VIS;   // the last legal top line in the editor pane

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const clock = (m) => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

export default {
  times(r, opts) {
    const o = { ...DEF, ...(opts || {}) };
    const T = { r };
    T.card = r + 0.16;             // the IDE card rises in
    T.run = T.card + 0.50;         // the thread has finished gliding, so the whole card is in frame: the clock starts
    T.done = T.run + o.span;       // the last cut lands: clock 3:40, counters home, the badge stops
    T.say = T.done + 0.20;         // the done line streams
    T.end = T.say + 0.80;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const o = { ...DEF, ...(k.opts || {}) };
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(o.say)}</span></div>`);

    const treeRows = ROWS.map((row) => row.dir
      ? `<div class="olap-r olap-dr"><span class="olap-ca"></span><span class="olap-dn">${x.esc(row.text)}</span></div>`
      : `<div class="olap-r olap-fr"><span class="olap-i"></span><span class="olap-fn">${x.esc(row.text)}</span><em class="olap-pl"></em></div>`).join('');

    const feed = COMMITS.map(([sha, msg, delta]) => `<div class="olap-cm"><code>${x.esc(sha)}</code><span>${x.esc(msg)}</span><em>+${fmt(delta)}</em></div>`).join('');

    const card = x.el(`<div class="olap">
      <div class="olap-hd">
        <span class="olap-mk"><img src="${x.brand('claude-logo.svg')}" alt=""/></span>
        <b class="olap-rp">dark-souls</b><span class="olap-br">main</span>
        <span class="olap-bg"><i class="olap-rec"></i>TIMELAPSE x32</span>
        <span class="olap-pill"><i class="olap-spin"></i><span class="olap-pl">Cooking</span>${x.OK}</span>
      </div>
      <div class="olap-st">
        <span class="olap-s"><em>files</em><b class="olap-files">0</b></span>
        <span class="olap-s"><em>lines</em><b class="olap-lines">+0</b></span>
        <span class="olap-s olap-ts"><em>tests</em><b class="olap-tests">0</b><i>/312</i></span>
        <span class="olap-s olap-clk"><em>elapsed</em><b class="olap-clock">0:00</b></span>
      </div>
      <div class="olap-bd">
        <div class="olap-tw"><div class="olap-tree">${treeRows}</div></div>
        <div class="olap-ed">
          <div class="olap-tb"><i class="olap-ti"></i><span class="olap-tab"></span><em class="olap-tl"></em></div>
          <div class="olap-cd"><div class="olap-code"></div><i class="olap-sw"></i></div>
        </div>
      </div>
      <div class="olap-fw"><div class="olap-fh">commits</div><div class="olap-fv"><div class="olap-fl">${feed}</div></div></div>
    </div>`);

    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.olap-r')];
    const tree = $('.olap-tree');
    const tab = $('.olap-tab'), tl = $('.olap-tl'), code = $('.olap-code'), sw = $('.olap-sw');
    const filesEl = $('.olap-files'), linesEl = $('.olap-lines'), testsEl = $('.olap-tests'), clockEl = $('.olap-clock');
    const pill = $('.olap-pill'), pl = $('.olap-pl'), spin = $('.olap-spin'), pOk = pill.querySelector('.qc-ok');
    const rec = $('.olap-rec'), badge = $('.olap-bg'), tsCell = $('.olap-ts');
    const cms = [...card.querySelectorAll('.olap-cm')];
    const feedBox = $('.olap-fl');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    // the tree carries each file's line count (the repo growing, file by file)
    let fi = 0;
    rows.forEach((r) => {
      r.style.opacity = '0';
      if (r.classList.contains('olap-dr')) return;
      r.querySelector('.olap-pl').textContent = `+${fmt(LINES[fi])}`;
      fi++;
    });

    let shown = -1, lastCut = -1, lastDone = null, lastFill = -1, lastK = -1, curLn = null, flashUntil = -1;

    // paint the editor pane at document line `head`: VIS highlighted lines, the gutter carrying each line's own number
    // inside its file, the bottom line half typed (its clip is set every frame from the cut's phase)
    const paintCode = (head) => {
      const out = [];
      for (let i = 0; i < VIS; i++) {
        const e = DOC[head + i];
        out.push(`<div class="olap-ln${i === VIS - 1 ? ' is-cur' : ''}"><span class="olap-gn">${e.ln}</span><span class="olap-lc">${e.h}</span></div>`);
      }
      code.innerHTML = out.join('');
      curLn = code.lastElementChild.firstElementChild.nextElementSibling;
      tab.textContent = FILES[DOC[head].f].path;
      tl.textContent = `+${fmt(LINES[DOC[head].f])}`;
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

        // the timelapse: prog 0..1 over the run, cut the frame index, frac how far into that frame we are
        const prog = seg(t, T.run, T.done);
        const cut = prog >= 1 ? CUTS : Math.floor(prog * CUTS);
        const frac = prog >= 1 ? 1 : prog * CUTS - cut;
        const hold = cut / CUTS;                       // the values this frame reports
        const done = t >= T.done;

        // clock racing 0:00 to 3:40, and the three counters homing on their final values
        clockEl.textContent = clock(done ? 220 : Math.floor(220 * Math.pow(prog, 0.86)));
        filesEl.textContent = String(Math.round(hold * NFILES));
        linesEl.textContent = `+${fmt(Math.round(hold * TOTAL_LINES))}`;
        testsEl.textContent = String(Math.round(prog * TOTAL_TESTS));

        // the badge: a red dot ticking while cooking, a stopped square when the run lands; the pill flips to Done
        if (done !== lastDone) {
          badge.classList.toggle('is-stop', done);
          pill.classList.toggle('is-done', done);
          tsCell.classList.toggle('is-ok', done);
          pl.textContent = done ? 'Done' : 'Cooking';
          lastDone = done;
        }
        rec.style.opacity = done ? '1' : (0.45 + 0.55 * Math.abs(Math.sin(t * 7.4))).toFixed(3);
        spin.style.opacity = done ? '0' : '1';
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const po = seg(t, T.done, T.done + 0.26);
        pOk.style.opacity = po.toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, po).toFixed(4)})`;

        // the tree: a burst of files per cut, the pane tracking the fill front so the newest land at the bottom
        const fill = Math.round(hold * NFILES);
        if (fill !== lastFill) {
          for (let i = 0; i < rows.length; i++) {
            const on = ROWS[i].at < fill;
            rows[i].style.opacity = on ? '1' : '0';
            // only this burst's files flash, and only until the flash decays (cleared just below)
            rows[i].classList.toggle('is-new', on && ROWS[i].at >= lastFill);
          }
          flashUntil = t + 0.16;
          lastFill = fill;
        }
        if (flashUntil > 0 && t >= flashUntil) { rows.forEach((r) => r.classList.remove('is-new')); flashUntil = -1; }
        let lastOn = -1;
        for (let i = rows.length - 1; i >= 0; i--) { if (rows[i].style.opacity === '1') { lastOn = i; break; } }
        const shift = Math.max(0, lastOn + 1 - TREE_VIS) * RH;
        tree.style.transform = shift ? `translateY(${(-shift).toFixed(1)}px)` : 'none';

        // the editor pane: one hard cut per 1/CUTS of the run, the pan wrapping through the whole document
        if (cut !== lastCut) {
          const at = Math.min(SPAN - 1, Math.max(0, Math.floor(((hold * CYCLE) % 1) * SPAN)));
          paintCode(at);
          lastCut = cut;
        }
        // inside a frame the bottom line types in and a scan line runs down the pane: the timelapse never sits still
        if (curLn) curLn.style.clipPath = done || frac >= 1 ? 'none' : `inset(0 ${((1 - outCubic(frac)) * 100).toFixed(1)}% 0 0)`;
        sw.style.opacity = done ? '0' : (0.16 * Math.sin(Math.PI * frac)).toFixed(3);
        sw.style.transform = `translateY(${(frac * CODE_H).toFixed(1)}px)`;

        // the commit feed: one line per burst, the window showing the last three
        const stepC = (T.done - T.run - 0.12) / (COMMITS.length - 1);
        const landed = clamp(Math.floor((t - T.run) / stepC) + 1, 0, COMMITS.length);
        if (landed !== lastK) {
          cms.forEach((c, i) => { c.style.opacity = i < landed ? '1' : '0'; });
          lastK = landed;
        }
        feedBox.style.transform = `translateY(${(-Math.max(0, landed - 3) * 15).toFixed(1)}px)`;
      },
    };
  },
};