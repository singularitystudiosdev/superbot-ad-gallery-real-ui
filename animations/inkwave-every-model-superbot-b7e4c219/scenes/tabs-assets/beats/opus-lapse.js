// v4 Opus step (last in the chain): Claude Opus 5.5 builds Inkwave as a sped-up agent run, in the coding panel's
// grammar the Minecraft ad (make-minecraft-every-model-superbot-b055c127, beats/opus-code.js + beats/opus-ship.js)
// uses: tool rows, file-edit cards streaming green diff hunks with line numbers, collapsed Edited rows with a file
// badge, folder and +N -0, a terminal block running the tests, and a review bar (Undo all / Accept all / Review).
// This ad's version of that run builds Inkwave itself: the hunks are the ink shader, the turf grid, squid form, the
// weapons, the rival bots, the turf bar, kraken pier and the match mix, in the file tree the repo actually has
// (src/ink, src/weapons, src/bots, src/hud, src/maps, src/audio, src/meshes). Under the card sit the two panels a
// build this size reads with: the run's task list (eight phases, each row ticking the moment its last file lands) and
// a live preview of the game, still by still, starting as an untextured greybox and colouring up as the ink, the
// character and finally the turf bar land. The chips under that wire in the other models' output (Meshy meshes,
// HY-Motion clips, ElevenLabs tracks), then the build, then the deploy: Deployed inkwave-six.vercel.app.
// Ported into this ad (helpers in beats/opus-kit.js), never imported across ad folders.
// Sources and licenses: no drawn imagery. Icons are GitHub Octicons (repo-16, git-branch-16; MIT,
// github.com/primer/octicons) and Lucide (check, terminal; ISC, lucide.dev). The chip tiles are the official app marks
// already in brand/ (meshy-logo.svg, minimax-logo.svg, elevenlabs-logo.svg; provenance in brand/CREDITS.txt and the
// header comments of beats/meshy.js, beats/motion.js), drawn through x.tile. The four preview stills are crops cut from
// the source video itself (img/ink/lapse/, video by @JaydenDavisNC, licensed and described in img/ink/lapse/CREDITS.txt):
// the game the build is producing, never a drawing. The code in the hunks is written for this ad. Every moving value is
// a pure function of t: no Date, no rAF, no CSS animation or transition.
import { lerp, seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText } from './opus-kit.js?v=1';

// Lucide 'globe' (ISC, lucide.dev), stroked like the terminal mark: the deploy chip's mark
const GLOBE = '<svg class="ocx-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/></svg>';

const P = 1.5; // pace: the whole step runs ~3.95s after r
const SAY = 'Assets are in. Building Inkwave: the ink shader, the turf grid, squid form, the pier.';
const WORK = 434; // the replayed clock: 7m 14s of work in the lapse

const PAINT = `// ink splat: project the decal onto the surface, never paint a face aimed at the spray
vec2 splatUv(vec3 p, vec3 n, vec3 hit) {
  vec3 axis = normalize(hit - sprayOrigin);
  if (dot(n, axis) > 0.92) return vec2(-1.0);
  vec2 uv = projectPlane(p, axis, splatRadius);
  float edge = smoothstep(1.0, 0.84, length(uv));
  return uv * flow(age) + wallNoise(p) * edge;
}
vec4 inkSolid(vec2 uv) {
  float core = smoothstep(0.62, 0.18, length(uv));
  return vec4(mix(inkColour, inkDeep, core), core * opacity);
}`;

const TURF = `// coverage: the turf grid owns the score. A cell remembers which team last painted it, so
// a splat only costs the cells it flipped, and the bar is a count, never an estimate.
export const CELL = 0.25;
export function paint(grid: Grid, hit: Splat, tally: Tally) {
  for (const c of grid.cellsWithin(hit.pos, hit.radius)) {
    if (c.team !== hit.team) {
      if (c.team) tally[c.team]--;
      tally[hit.team]++; c.team = hit.team;
    }
    c.ink = Math.min(1, c.ink + hit.flow);
  }
}
export const share = (t: Tally) => (t.lime / CELLS) * 100;`;

const SQUID = `// squid form: swimming is free in your own ink and slow in theirs, so the fight is over floor
export const FORMS = { kid: { speed: 6.4, hitbox: 1.8 }, squid: { speed: 11.4, hitbox: 1.05 } };
export function dive(p: Player, grid: Grid) {
  const c = grid.cellAt(p.pos);
  if (!c || c.team !== p.team || p.ink < SWIM.cost) return false;
  p.form = 'squid';
  p.speed = FORMS.squid.speed * (c.ink > 0.6 ? 1 : 0.55);
  p.hitbox = FORMS.squid.hitbox;
  splash(p.pos, p.team, 0.4);
  return true;
}
export function surface(p: Player) { p.form = 'kid'; p.speed = FORMS.kid.speed; p.hitbox = FORMS.kid.hitbox; }`;

const CHARGER = `// the charger: hold to build range, release to fire one long line of ink
import { SPRAY } from './spray.js';
export const CHARGER = { hold: 0.85, range: 26, damage: 80, ink: 14 };
export function fire(w: Weapon, dt: number, t: number) {
  if (!w.held) { w.charge = 0; return null; }
  w.charge = Math.min(1, w.charge + dt / CHARGER.hold);
  if (w.released) {
    const power = 0.25 + 0.75 * w.charge;
    w.ink -= CHARGER.ink * power;
    return SPRAY.line(w.muzzle, w.aim, CHARGER.range * power, CHARGER.damage * power);
  }
  return null;
}`;

const BOTS = `// the magenta team: a bot paints its lane, keeps the line, and jumps at whatever is unpainted
import { share } from '../ink/turf-coverage.js';
export class Rival {
  constructor(world: World, team = 'magenta') {
    this.world = world; this.team = team;
    this.lane = world.pickLane(team); this.aim = world.spawnAim;
  }
  think(dt: number) {
    const behind = share(this.world.tally) < 50;
    const goal = behind ? this.world.widestUnpainted(this.lane) : this.world.nearestEnemy(this.pos);
    this.aim = this.aim.steer(goal, dt);
    if (goal.y - this.pos.y > 1.4) this.chargeJump();
    return this.aim;
  }
}`;

const HUD = `// the turf bar: lime on the left, magenta on the right, both labels pinching toward the leader
export function drawTurfBar(ctx: Hud, tally: Tally, t: number) {
  const lime = share(tally);
  tween(ctx.lime, lime, t); tween(ctx.magenta, 100 - lime - UNPAINTED, t);
  ctx.limeEl.textContent = lime.toFixed(1) + '%';
  ctx.bar.style.setProperty('--lime', (lime / 100).toFixed(4));
  if (t > 60 && !ctx.left) { announcer.say('One minute left!'); ctx.left = true; }
  if (lime >= 50) ctx.bar.classList.add('leada');
}`;

const PIER = `// kraken pier: the stalls are cover, the bridge is the spawn tower, the bay is out of bounds
import { loadGLB } from '../meshes/loader.js';
export const KRAKEN_PIER: Stage = {
  cells: 38400,
  spawns: { lime: { x: -38, y: 2 }, magenta: { x: 38, y: 2 } },
  bounds: { x: 46, y: 24, kill: -8 },
  cover: [stall('north'), stall('south'), crates(6, -12, 4)],
  async build() { return loadGLB(new URL('../meshes/kraken_pier.glb', import.meta.url)); },
};`;

const MIXER = `// the match mix: Suno's track under it, ElevenLabs on top, and the countdown in the middle
import track from '../assets/audio/turf-war.mp3';
import { ready, goline } from '../assets/audio/announcer-go.mp3';
import { splat, swim, superJump } from '../assets/audio/sfx.ogg';
export const BUS = { music: 0.55, sfx: 0.85, announcer: 1.0 };
export function startMatch(team: Team, ctx: Audio) {
  music(track, BUS.music);
  ctx.sfx.register({ splat, swim, superJump });
  announcer(ready, () => announcer(goline));
  return ctx;
}`;

const SCRIPT = [
  { k: 'row', v: 'Thought for', a: '4s' },
  { k: 'row', v: 'Read', a: 'assets/manifest.json' },
  { k: 'row', v: 'Listed', a: 'meshes/, clips/, audio/' },
  { k: 'edit', f: 'src/ink/ink-grid.ts', n: 158 },
  { k: 'card', f: 'src/ink/paint-shader.glsl', n: 214, src: PAINT },
  { k: 'card', f: 'src/ink/turf-coverage.ts', n: 176, src: TURF },
  { k: 'card', f: 'src/ink/squid-form.ts', n: 143, src: SQUID },
  { k: 'card', f: 'src/weapons/charger.ts', n: 232, src: CHARGER },
  { k: 'edit', f: 'src/weapons/splattershot.ts', n: 187 },
  { k: 'card', f: 'src/bots/ai.ts', n: 261, src: BOTS },
  { k: 'edit', f: 'src/bots/nav-mesh.ts', n: 204 },
  { k: 'card', f: 'src/hud/turf-bar.ts', n: 168, src: HUD },
  { k: 'card', f: 'src/maps/kraken-pier.ts', n: 273, src: PIER },
  { k: 'edit', f: 'src/meshes/squid-kid.ts', n: 96 },
  { k: 'card', f: 'src/audio/mixer.ts', n: 151, src: MIXER },
  { k: 'edit', f: 'src/main.ts', n: 118 },
  { k: 'row', v: 'Thought for', a: '2s' },
  { k: 'term', cmd: 'npm test' },
];
const TESTS = [
  ['$', 'npm test'],
  ['', ''],
  ['', '> inkwave@0.1.0 test'],
  ['', '> vitest run'],
  ['', ''],
  ['ok', 'src/ink/turf-coverage.test.ts', '(14 tests)', '19ms'],
  ['ok', 'src/ink/squid-form.test.ts', '(9 tests)', '11ms'],
  ['ok', 'src/weapons/charger.test.ts', '(11 tests)', '16ms'],
  ['ok', 'src/bots/ai.test.ts', '(8 tests)', '14ms'],
  ['ok', 'src/hud/turf-bar.test.ts', '(7 tests)', '9ms'],
  ['ok', 'src/maps/kraken-pier.test.ts', '(6 tests)', '12ms'],
  ['', ''],
  ['sum', 'Test Files', '6 passed (6)'],
  ['sum', '     Tests', '55 passed (55)'],
];
const PASSED = '55 passed';
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, s) => a + s.n, 0); // 2,393

// The run's task list, in build order: [label, the SCRIPT index whose file completes it]. The row ticks when that
// item lands, so the list ticks down the same clock the transcript does and the counter is never ahead of the diff.
const TASKS = [
  ['ink grid and flow', 3],
  ['paint shader', 4],
  ['turf scoring', 5],
  ['squid form and weapons', 8],
  ['rival bots', 10],
  ['turf bar HUD', 11],
  ['pier map and meshes', 13],
  ['match mix and tests', 17],
];

// The preview panel: the game as it stands, four stills cut from the source video (img/ink/lapse/), one at a time.
// It opens on the greybox pass: the map with no ink on it and all the saturation pulled out, and the colour comes back
// as the ink, the character and finally the finished match land. [file, caption, the SCRIPT index that advances it].
const PREV = [
  ['lap-01.jpg', 'greybox', 0],
  ['lap-02.jpg', 'ink pass', 5],
  ['lap-03.jpg', 'squid form', 6],
  ['lap-04.jpg', 'final build', 17],
];
const DEV = 'localhost:5173';           // what a local build serves from
const LIVE = 'inkwave-six.vercel.app';  // where it goes at the end: the real deploy from the post

// transcript geometry in --u units (1px): the JS stacks the slots exactly, like the referent
const LH = 17, BODY = 7, GAP = 6;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const DUR = { row: 0.08, edit: 0.08, card: 0.2, term: 0.34 };
const STEP = { row: 0.05, edit: 0.034, card: 0.15, term: 0.34 };

const KW = new Set(['import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'class',
  'this', 'for', 'of', 'in', 'true', 'false', 'null', 'undefined', 'typeof', 'extends', 'constructor', 'while', 'break']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src) {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*")|(\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/gi;
  let out = '', m, prev = '';
  while ((m = re.exec(src))) {
    const [tok, cm, str, num, id, ws] = m;
    if (cm) out += `<i class="c">${esc(cm)}</i>`;
    else if (str) out += `<i class="s">${esc(str)}</i>`;
    else if (num) out += `<i class="n">${esc(num)}</i>`;
    else if (id) {
      const next = src.slice(re.lastIndex).trimStart()[0];
      const cls = KW.has(id) ? 'k' : next === '(' ? 'f' : /^[A-Z][A-Z0-9_]+$/.test(id) ? 'n' : /^[A-Z]/.test(id) ? 't' : prev === '.' ? 'p' : '';
      out += cls ? `<i class="${cls}">${esc(id)}</i>` : esc(id);
    } else out += esc(tok);
    if (!ws) prev = tok;
  }
  return out;
}

const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1, q = p - 1; return 1 + c3 * q * q * q + c1 * q * q; };
// the file badge names the language the card's path belongs to: the tree has shaders, TypeScript and the odd .js
const LANG = { ts: ['TS', 'ocx-fi-ts'], glsl: ['GL', 'ocx-fi-glsl'], js: ['JS', 'ocx-fi-js'], json: ['{}', 'ocx-fi-json'], ogg: ['AU', 'ocx-fi-au'], mp3: ['AU', 'ocx-fi-au'] };
const fileIco = (f) => {
  const [txt, cls] = LANG[f.split('.').pop()] || ['TS', 'ocx-fi-ts'];
  return `<b class="ocx-fi ${cls}">${txt}</b>`;
};
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="ocx-add">+${fmt(n)}</span><span class="ocx-del">-0</span>`;
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="ocx-row"><span>${esc(s.v)}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="ocx-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="ocx-card">
      <div class="ocx-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="ocx-add">+0</span><span class="ocx-del">-0</span></em></div>
      <div class="ocx-bd"><div class="ocx-lines">${lines.map((l, i) => `<div class="ocx-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  const tl = TESTS.map(([kind, a, b, c]) => {
    if (kind === '$') return `<div class="ocx-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'ok') return `<div class="ocx-l"><code> <i class="ok">&#10003;</i> ${esc(a)} <i class="dim">${esc(b)} ${esc(c)}</i></code></div>`;
    if (kind === 'sum') return `<div class="ocx-l"><code><i class="dim">${esc(a)}</i>  <i class="ok">${esc(b)}</i></code></div>`;
    return `<div class="ocx-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="ocx-term">
    <div class="ocx-ch">${TERM}<b class="ocx-tv">Running</b><span class="ocx-cmd">${esc(s.cmd)}</span><em class="ocx-tst"><i class="ocx-spin"></i><span></span></em></div>
    <div class="ocx-bd"><div class="ocx-lines">${tl}</div></div>
  </div>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08 * P;
    let at = T.card + 0.1 * P;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] * P }; at += STEP[s.k] * P; return o; });
    T.deck = T.card + 0.06 * P; // the task list and the preview come up with the card
    T.deckMk = T.card + 0.45;   // the fold drops to them once the first hunks have streamed (the scroll mark)
    T.tk = TASKS.map(([, i]) => T.items[i].b);              // a task ticks when its last file lands
    T.pv = PREV.map(([, , i]) => T.items[i].b);             // the preview advances on the same beats
    T.done = T.items[T.items.length - 1].b + 0.04 * P; // the tests pass: review bar live, Worked for
    // the chips under the card: the other models' output wired in, then the build, then the deploy
    T.c1 = T.done + 0.14 * P;
    T.c1s = [0, 0.06, 0.12].map((d) => T.c1 + d * P);
    T.c2 = T.c1 + 0.18 * P; T.c2ok = T.c2 + 0.24 * P;
    T.c3 = T.c2 + 0.2 * P; T.c3ok = T.c3 + 0.16 * P;
    T.end = T.c3 + 0.3 * P;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="ocx">
      <div class="ocx-hd">
        <span class="ocx-repo">${REPO}<b>inkwave</b></span><span class="ocx-br">${O_BRANCH}main</span>
        <em class="ocx-state"><i class="ocx-spin"></i>${TICK}<span class="ocx-sl">Working</span><span class="ocx-clk">0m 00s</span></em>
      </div>
      <div class="ocx-vp"><div class="ocx-stk">${SCRIPT.map((s) => `<div class="ocx-it">${itemHTML(s)}</div>`).join('')}<div class="ocx-sp"></div></div></div>
      <div class="ocx-ft">
        <span class="ocx-sum"><svg class="ocx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="ocx-nf">0 files</b><span class="ocx-add">+0</span><span class="ocx-del">-0</span></span>
        <span class="ocx-btns"><i class="ocx-b">Undo all</i><i class="ocx-b ocx-pri">Accept all</i><i class="ocx-b">Review</i></span>
      </div>
    </div>`);
    // the two panels under the card: the run's task list on the left, the game preview on the right
    const deck = x.el(`<div class="ocx-deck">
      <div class="ocx-tasks">
        <div class="ocx-thd"><span>Build tasks</span><b class="ocx-tn">0/${TASKS.length}</b></div>
        ${TASKS.map(([label]) => `<div class="ocx-trow"><i class="ocx-tbox">${TICK}</i><span>${esc(label)}</span></div>`).join('')}
      </div>
      <div class="ocx-pv">
        <div class="ocx-pvhd"><i class="ocx-pvdot"></i><b>preview</b><span class="ocx-pvurl">${esc(DEV)}</span></div>
        <div class="ocx-pvsc"><div class="ocx-pvimgs">${PREV.map(([f, cap]) => `<img class="ocx-pvi" src="${x.img('ink/lapse/' + f)}" alt="${esc(cap)} preview of Inkwave" draggable="false"/>`).join('')}</div><span class="ocx-pvcap">${esc(PREV[0][1])}</span></div>
      </div>
    </div>`);
    const chip = (ico, label) => `<span class="ocx-chip">${ico}<span class="ocx-cl">${label}</span><span class="ocx-ok">${TICK}</span></span>`;
    const rows = x.el(`<div class="ocx-rows">
      <div class="ocx-line ocx-l1">${chip(x.tile('meshy'), 'Imported <b>squid_kid.glb</b> + 2 meshes')}${chip(x.tile('motion'), '<b>4</b> clips')}${chip(x.tile('eleven'), '<b>3</b> tracks')}</div>
      <div class="ocx-line ocx-l2"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl"><code>npm run build</code></span><span class="ocx-run"><i class="ocx-spin"></i>Running</span><span class="ocx-okw">${TICK}Success</span></span></div>
      <div class="ocx-line ocx-l3"><span class="ocx-chip ocx-wide"><span class="ocx-si">${GLOBE}</span><span class="ocx-cl">Deployed <b>${esc(LIVE)}</b></span><span class="ocx-ok">${TICK}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const items = [...card.querySelectorAll('.ocx-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.ocx-l')];
        o.box = n.querySelector('.ocx-lines');
        o.shown = -1;
        o.add = n.querySelector('.ocx-ch .ocx-add');
      }
      if (s.k === 'term') { o.tv = n.querySelector('.ocx-tv'); o.tst = n.querySelector('.ocx-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.ocx-state'), stateL = $('.ocx-sl'), clk = $('.ocx-clk'), spin = $('.ocx-hd .ocx-spin'), stTk = state.querySelector('.ocx-tk');
    const nf = $('.ocx-nf'), fAdd = $('.ocx-ft .ocx-add'), ft = $('.ocx-ft'), pri = $('.ocx-pri');
    const l1chips = [...rows.querySelectorAll('.ocx-l1 .ocx-chip')];
    const l2 = rows.querySelector('.ocx-l2 .ocx-chip'), l3 = rows.querySelector('.ocx-l3 .ocx-chip');
    const run2 = l2.querySelector('.ocx-run'), ok2 = l2.querySelector('.ocx-okw'), spin2 = run2.firstElementChild;
    // the deck: task rows, the counter, the preview stills and the url it serves from
    const trows = [...deck.querySelectorAll('.ocx-trow')];
    const tboxes = trows.map((r) => r.querySelector('.ocx-tbox'));
    const tn = deck.querySelector('.ocx-tn');
    const pvi = [...deck.querySelectorAll('.ocx-pvi')], pvimgs = deck.querySelector('.ocx-pvimgs');
    const pvcap = deck.querySelector('.ocx-pvcap'), pvurl = deck.querySelector('.ocx-pvurl'), pvdot = deck.querySelector('.ocx-pvdot');
    let lastStage = -1, lastTk = -1;
    // a chip's tick pops in with a small overshoot once its work lands
    const tick = (ok, t, t0) => {
      const q = seg(t, t0, t0 + 0.2);
      ok.style.opacity = seg(t, t0, t0 + 0.1).toFixed(3);
      ok.style.transform = q >= 1 ? 'none' : `scale(${(0.5 + 0.5 * outBack(q)).toFixed(3)})`;
    };
    const oks = l1chips.map((c) => c.querySelector('.ocx-ok'));
    const ok3 = l3.querySelector('.ocx-ok');

    // lines streamed so far in a card/terminal body: slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say.node, card, deck, rows],
      marks: [[T.r, say.node], [T.card, card], [T.deckMk, deck], [T.c1, rows]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.25), 16);
        rise(deck, seg(t, T.deck, T.deck + 0.25), 12, 0.98);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up the bottom-anchored viewport
          const e = outCubic(seg(t, o.a, o.a + 0.1));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it scrolls, and its top padding goes with it so no sliver peeks under the header
            const over = Math.max(0, nf2 - BODY);
            o.box.style.transform = `translateY(calc(var(--u) * ${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}))`;
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (s.k === 'card') {
              const nl = s.n * seg(t, o.a, o.b);
              setText(o.add, `+${fmt(nl)}`);
              lines += nl; if (t >= o.b) files++;
            } else {
              const ok = t >= o.b;
              setText(o.tv, ok ? 'Ran' : 'Running');
              setText(o.tsl, ok ? PASSED : '');
              o.tst.classList.toggle('ok', ok);
              o.spin.style.transform = `rotate(${((t - o.a) * 900).toFixed(1)}deg)`;
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // header: the replayed clock races while Working, then Worked for 7m 14s with a tick
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * seg(t, T.card, T.done)));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.22);
        stTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('ocx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.3));
        pri.style.transform = d ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';

        // the task list: a row strikes through and its box ticks the moment its last file lands
        let done = 0;
        trows.forEach((r, i) => {
          const on = t >= T.tk[i];
          if (on) done++;
          r.classList.toggle('done', on);
          const q = seg(t, T.tk[i], T.tk[i] + 0.2);
          tboxes[i].style.transform = on && q < 1 ? `scale(${(0.4 + 0.6 * outBack(q)).toFixed(3)})` : '';
        });
        if (done !== lastTk) { setText(tn, `${done}/${TASKS.length}`); lastTk = done; }

        // the preview: one still at a time, and the greybox colour comes back as the build lands files
        const stage = PREV.reduce((a, [, , i], j) => (t >= T.pv[j] ? j : a), 0);
        if (stage !== lastStage) { pvi.forEach((n, j) => { n.style.opacity = j <= stage ? (j === stage ? '1' : '0') : '0'; }); setText(pvcap, PREV[stage][1]); lastStage = stage; }
        const col = outCubic(seg(t, T.card + 0.6, T.done));
        pvimgs.style.filter = col >= 1 ? 'none' : `saturate(${lerp(0.04, 1, col).toFixed(3)}) contrast(${lerp(1.28, 1, col).toFixed(3)}) brightness(${lerp(1.1, 1, col).toFixed(3)})`;
        const live = t >= T.c3ok;
        setText(pvurl, live ? LIVE : DEV);
        pvdot.classList.toggle('on', live);

        // chips: each rises in, then its tick lands; the build spinner resolves into Success, then the deploy
        rows.style.opacity = t >= T.c1 ? '1' : '0';
        l1chips.forEach((c, i) => { rise(c, seg(t, T.c1s[i], T.c1s[i] + 0.3), 8, 1); tick(oks[i], t, T.c1s[i] + 0.27); });
        rise(l2, seg(t, T.c2, T.c2 + 0.3), 8, 1);
        run2.style.opacity = (seg(t, T.c2, T.c2 + 0.1) * (1 - seg(t, T.c2ok - 0.08, T.c2ok + 0.02))).toFixed(3);
        run2.style.display = t >= T.c2ok + 0.02 ? 'none' : '';
        spin2.style.transform = `rotate(${((t - T.c2) * 420).toFixed(1)}deg)`;
        ok2.style.display = t >= T.c2ok ? '' : 'none';
        tick(ok2, t, T.c2ok);
        rise(l3, seg(t, T.c3, T.c3 + 0.3), 8, 1);
        tick(ok3, t, T.c3ok);
      },
    };
  },
};