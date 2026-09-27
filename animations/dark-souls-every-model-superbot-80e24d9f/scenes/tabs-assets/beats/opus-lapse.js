// v4 Opus step (last in the chain): Claude Opus writes the game as a sped-up agent run, in the coding panel's grammar
// the Minecraft ad (make-minecraft-every-model-superbot-b055c127, beats/opus-code.js + beats/opus-ship.js) uses:
// tool rows, file-edit cards streaming green diff hunks with line numbers, collapsed Edited rows with a JS badge,
// folder and +N -0, a terminal block running the tests, and a review bar (Undo all / Accept all / Review). Under the
// card, chips wire in the other models' output (Meshy meshes, Hailuo clips, ElevenLabs tracks), the build and the push.
// Ported into this ad (helpers in beats/opus-kit.js), never imported across ad folders.
// Sources and licenses: no raster imagery. Icons are GitHub Octicons (repo-16, git-branch-16; MIT,
// github.com/primer/octicons) and Lucide (check, terminal; ISC, lucide.dev). The chip tiles are the official app marks
// already in brand/ (meshy-logo.svg, minimax-logo.svg, elevenlabs-logo.svg; provenance in brand/CREDITS.txt and the
// header comments of beats/meshy.js, beats/hailuo.js), drawn through x.tile. The code in the hunks is written for this
// ad. Every moving value is a pure function of t: no Date, no rAF, no CSS animation or transition.
import { seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText } from './opus-kit.js?v=1';

const P = 1.5; // pace: the whole step runs ~3.95s after r
const SAY = 'Assets are in. Writing the game: combat, bosses, the world, the renderer.';
const WORK = 434; // the replayed clock: 7m 14s of work in the lapse

const ROLL = `// dodge roll: i-frames on a fixed window, cost scales with load
export const ROLL = { frames: 26, iStart: 3, iEnd: 15, cost: 18 };
export function roll(p, dir) {
  if (p.stamina <= 0 || p.lock > 0) return false;
  const load = p.equip / p.maxEquip;
  p.state = load > 0.7 ? 'fatRoll' : load > 0.3 ? 'midRoll' : 'fastRoll';
  p.frame = 0; p.dir = dir;
  drain(p, ROLL.cost);
  return true;
}
export const invincible = (p) => p.frame >= ROLL.iStart && p.frame <= ROLL.iEnd;`;

const STAMINA = `// stamina: drains on every action, regen waits out a short delay
export const STAMINA = { max: 100, regen: 45, delay: 0.6, guard: 0.35 };
export function tickStamina(p, dt) {
  p.regenWait = Math.max(0, p.regenWait - dt);
  if (p.regenWait > 0) return;
  const rate = p.guarding ? STAMINA.regen * STAMINA.guard : STAMINA.regen;
  p.stamina = Math.min(STAMINA.max, p.stamina + rate * dt);
}
export function drain(p, cost) {
  p.stamina -= cost; p.regenWait = STAMINA.delay;
  if (p.stamina < 0) { p.stamina = 0; p.stagger = 0.8; }
}`;

const WARDEN = `// the Gatewarden: two phases, the second opens at half health
import { telegraph } from './telegraph.js';
export class Gatewarden {
  constructor(arena) { this.hp = this.maxHp = 2400; this.phase = 1; this.arena = arena; }
  update(dt, player) {
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) this.enterPhase2();
    const move = this.pick(player.distanceTo(this));
    telegraph(this, move, dt);
  }
  enterPhase2() { this.phase = 2; this.speed *= 1.3; this.arena.fog.seal(); }
  pick(d) { return d < 4 ? 'sweep' : d < 12 ? 'leap' : 'charge'; }
}`;

const BONFIRE = `// bonfire: resting refills flasks, respawns the world, sets the spawn
export function rest(p, fire, world) {
  p.hp = p.maxHp; p.flasks = p.maxFlasks;
  p.spawn = fire.id;
  world.respawnEnemies({ except: world.slainBosses });
  save.write({ spawn: fire.id, souls: p.souls });
}
export function onDeath(p, world) {
  world.dropBloodstain(p.pos, p.souls);
  p.souls = 0;
  p.pos = world.bonfires[p.spawn].pos;
}`;

const FOG = `// fog gate: a wall you walk through slowly, sealed while the boss lives
export function fogGate(scene, gate) {
  const mat = new FogMaterial({ density: 0.9, drift: 0.35, tint: 0xd9d4c7 });
  const wall = new Mesh(new PlaneGeometry(gate.w, gate.h, 32, 32), mat);
  wall.position.copy(gate.pos);
  scene.add(wall);
  return { wall, sealed: false, enter(p) {
    if (this.sealed) return false;
    p.state = 'fogWalk'; p.speed = 0.35;
    return true;
  } };
}`;

const SCRIPT = [
  { k: 'row', v: 'Thought for', a: '3s' },
  { k: 'row', v: 'Read', a: 'assets/manifest.json' },
  { k: 'row', v: 'Listed', a: 'models/, clips/, audio/' },
  { k: 'card', f: 'combat/roll.js', n: 188, src: ROLL },
  { k: 'card', f: 'combat/stamina.js', n: 142, src: STAMINA },
  { k: 'edit', f: 'combat/parry.js', n: 131 },
  { k: 'card', f: 'bosses/gatewarden.js', n: 296, src: WARDEN },
  { k: 'edit', f: 'bosses/telegraph.js', n: 174 },
  { k: 'card', f: 'world/bonfire.js', n: 163, src: BONFIRE },
  { k: 'edit', f: 'world/firelink.js', n: 238 },
  { k: 'edit', f: 'ai/hollow.js', n: 207 },
  { k: 'card', f: 'render/fog-gate.js', n: 184, src: FOG },
  { k: 'edit', f: 'anim/clips.js', n: 109 },
  { k: 'edit', f: 'render/lighting.js', n: 151 },
  { k: 'edit', f: 'audio/mixer.js', n: 96 },
  { k: 'edit', f: 'ui/hud.js', n: 122 },
  { k: 'edit', f: 'main.js', n: 88 },
  { k: 'row', v: 'Thought for', a: '1s' },
  { k: 'term', cmd: 'npm test' },
];
const TESTS = [
  ['$', 'npm test'],
  ['', ''],
  ['', '> dark-souls@0.1.0 test'],
  ['', '> vitest run'],
  ['', ''],
  ['ok', 'combat/roll.test.js', '(9 tests)', '12ms'],
  ['ok', 'combat/stamina.test.js', '(7 tests)', '8ms'],
  ['ok', 'bosses/gatewarden.test.js', '(11 tests)', '21ms'],
  ['ok', 'world/bonfire.test.js', '(8 tests)', '9ms'],
  ['ok', 'render/fog-gate.test.js', '(6 tests)', '15ms'],
  ['ok', 'ai/hollow.test.js', '(6 tests)', '11ms'],
  ['', ''],
  ['sum', 'Test Files', '6 passed (6)'],
  ['sum', '     Tests', '47 passed (47)'],
];
const PASSED = '47 passed';
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, s) => a + s.n, 0); // 2,289

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
const fileIco = () => '<b class="ocx-fi">JS</b>';
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="ocx-add">+${fmt(n)}</span><span class="ocx-del">-0</span>`;
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="ocx-row"><span>${esc(s.v)}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="ocx-ed">${fileIco()}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="ocx-card">
      <div class="ocx-ch">${fileIco()}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="ocx-add">+0</span><span class="ocx-del">-0</span></em></div>
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
    T.done = T.items[T.items.length - 1].b + 0.04 * P; // the tests pass: review bar live, Worked for
    // the chips under the card: the other models' output wired in, then the build, then the push
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
        <span class="ocx-repo">${REPO}<b>dark-souls</b></span><span class="ocx-br">${O_BRANCH}main</span>
        <em class="ocx-state"><i class="ocx-spin"></i>${TICK}<span class="ocx-sl">Working</span><span class="ocx-clk">0m 00s</span></em>
      </div>
      <div class="ocx-vp"><div class="ocx-stk">${SCRIPT.map((s) => `<div class="ocx-it">${itemHTML(s)}</div>`).join('')}<div class="ocx-sp"></div></div></div>
      <div class="ocx-ft">
        <span class="ocx-sum"><svg class="ocx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="ocx-nf">0 files</b><span class="ocx-add">+0</span><span class="ocx-del">-0</span></span>
        <span class="ocx-btns"><i class="ocx-b">Undo all</i><i class="ocx-b ocx-pri">Accept all</i><i class="ocx-b">Review</i></span>
      </div>
    </div>`);
    const chip = (ico, label) => `<span class="ocx-chip">${ico}<span class="ocx-cl">${label}</span><span class="ocx-ok">${TICK}</span></span>`;
    const rows = x.el(`<div class="ocx-rows">
      <div class="ocx-line ocx-l1">${chip(x.tile('meshy'), 'Imported <b>knight.glb</b> + 2 meshes')}${chip(x.tile('hailuo'), '<b>4</b> clips')}${chip(x.tile('eleven'), '<b>3</b> tracks')}</div>
      <div class="ocx-line ocx-l2"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl"><code>npm run build</code></span><span class="ocx-run"><i class="ocx-spin"></i>Running</span><span class="ocx-okw">${TICK}Success</span></span></div>
      <div class="ocx-line ocx-l3"><span class="ocx-chip ocx-wide"><span class="ocx-si">${O_BRANCH}</span><span class="ocx-cl">Pushed to <b>sam/dark-souls</b> <code>main</code> <span class="ocx-dim">· 3 commits</span></span><span class="ocx-ok">${TICK}</span></span></div>
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
      nodes: [say.node, card, rows],
      marks: [[T.r, say.node], [T.card, card], [T.c1, rows]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.25), 16);
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

        // chips: each rises in, then its tick lands; the build spinner resolves into Success
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
