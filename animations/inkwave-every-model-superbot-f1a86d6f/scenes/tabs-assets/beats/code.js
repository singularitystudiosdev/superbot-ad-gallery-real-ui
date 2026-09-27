// Code beat (beats/code.js): Claude Opus 5.5 gets the build back (the relay chip carries assets/ (23)) and writes
// Inkwave as a sped-up agent run, in the coding panel's grammar the Dark Souls ad
// (dark-souls-every-model-superbot-80e24d9f, beats/opus-lapse.js + beats/opus-kit.js) uses: tool rows, file-edit
// cards streaming green diff hunks with line numbers, collapsed Edited rows with a TS badge, a terminal block
// running the suite, and a review bar (Undo all / Accept all / Review). Under the card one chip per model wires its
// output into the build: Meshy's 4 GLBs, HY-Motion's 4 clips, ElevenLabs's 6 SFX, Suno's single track and Nano
// Banana's 8 painted images. The build and the push are the deploy beat's job (beats/deploy.js), so this card ends
// on the tests passing.
// Sources and licenses: no raster imagery. Icons are GitHub Octicons (repo-16, git-branch-16; MIT,
// github.com/primer/octicons) and Lucide (check, terminal; ISC, lucide.dev), all in beats/opus-kit.js. The chip
// tiles are the official app marks already in brand/ (meshy-logo.svg, hunyuan-logo.png, elevenlabs-logo.svg,
// suno-logo.svg, gemini-logo.svg; provenance in brand/CREDITS.txt), drawn through x.tile. The TypeScript in the
// hunks was written for this ad and is the game the post actually plays: splat decals stamped into a coverage
// render target, a judge that reads that coverage back, a three minute match with its callouts, the squid kid's
// swim form and the four bot squad. Every moving value is a pure function of t: no Date, no rAF, no CSS animation
// or transition, so ?t= freezes any frame.
import { seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText } from './opus-kit.js?v=2';

const P = 1.8; // pace: the whole step runs ~5.0s after r
const SAY = 'All 23 assets are in. Writing the turf war: the ink paint, the coverage judge, the clock, the squad.';
const WORK = 903; // the replayed clock: 15m 03s of work in the lapse

const PAINT = `// ink paint: each splat stamps a decal into the coverage target
import { SPLAT_POOL } from './coverage.js';
export const TEAM = { lime: 0xb6f000, magenta: 0xf0008c };
const marks = new CoverageTarget(1024);
export function splat(p, n, team, radius = 42) {
  const decal = SPLAT_POOL.take();
  decal.position.copy(p).addScaledVector(n, 0.02);
  decal.material.uniforms.uInk.value = team.colour;
  decal.material.uniforms.uR.value = radius;
  marks.stamp(decal, team.channel);   // one channel per team
  return decal;
}`;

const JUDGE = `// ink judge: read the coverage back and score both teams
export async function judge(match) {
  const px = await match.coverage.read();   // RGBA8, one channel per team
  let lime = 0, magenta = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] > 0) lime++;
    if (px[i + 1] > 0) magenta++;
  }
  const total = px.length / 4;        // last match read back 48.2 vs 35.2
  const pct = (n) => (n / total) * 100;
  match.score = { lime: pct(lime), magenta: pct(magenta) };
  const { lime: l, magenta: m } = match.score;
  match.winner = l > m ? 'lime' : 'magenta';
  return match.score;
}`;

const CLOCK = `// the match clock: 3:00, a callout at 60s, then TIME'S UP!
export const MATCH = { seconds: 180, callout: 60 };
export function tickClock(m, dt) {
  m.left = Math.max(0, m.left - dt);
  if (m.left <= MATCH.callout && !m.warned) {
    m.warned = true;
    m.hud.callout('1 minute left!');
  }
  if (m.left === 0) m.end();         // TIME'S UP!
  return m.left;
}`;

const SQUID = `// the squid kid: swim form refills the tank and shrinks the hitbox
export function enterInk(p, ground, dt) {
  if (!p.teamOwns(ground)) return false;
  p.form = 'swim';
  p.speed = SWIM.speed;
  p.radius = SWIM.radius;
  p.tank = Math.min(TANK.max, p.tank + TANK.refill * dt);
  p.fx.trail(p.position, p.team);
  return true;
}`;

const SQUAD = `// the squad: four bots, one role each, on the player's team
export const SQUAD = [
  { name: 'Squiddo', rank: 'S+', role: 'slosher' },
  { name: 'Loop', rank: 'S', role: 'roller' },
  { name: 'Suki', rank: 'S+', role: 'charger' },
  { name: 'Cloud', rank: 'S', role: 'dualies' },
];
export function spawnSquad(scene, team) {
  return SQUAD.map((s, i) => new Bot(scene, { ...s, team, i }));
}`;

const SCRIPT = [
  { k: 'row', v: 'Thought for', a: '2s' },
  { k: 'row', v: 'Read', a: 'assets/ (23 files)' },
  { k: 'row', v: 'Listed', a: 'models/, clips/, sfx/, art/' },
  { k: 'card', f: 'src/ink/paint.ts', n: 148, src: PAINT },
  { k: 'card', f: 'src/ink/judge.ts', n: 121, src: JUDGE },
  { k: 'edit', f: 'src/ink/coverage.ts', n: 176 },
  { k: 'card', f: 'src/match/clock.ts', n: 96, src: CLOCK },
  { k: 'edit', f: 'src/match/turf.ts', n: 211 },
  { k: 'card', f: 'src/player/squid.ts', n: 134, src: SQUID },
  { k: 'edit', f: 'src/player/movement.ts', n: 158 },
  { k: 'card', f: 'src/bots/squad.ts', n: 112, src: SQUAD },
  { k: 'edit', f: 'src/bots/bot.ts', n: 189 },
  { k: 'edit', f: 'src/render/map.ts', n: 184 },
  { k: 'edit', f: 'src/ui/hud.ts', n: 156 },
  { k: 'edit', f: 'src/audio/sfx.ts', n: 128 },
  { k: 'edit', f: 'src/main.ts', n: 76 },
  { k: 'row', v: 'Thought for', a: '1s' },
  { k: 'term', cmd: 'npm test' },
];
const TESTS = [
  ['$', 'npm test'],
  ['', ''],
  ['', '> inkwave@0.1.0 test'],
  ['', '> vitest run'],
  ['', ''],
  ['ok', 'src/ink/paint.test.ts', '(9 tests)', '14ms'],
  ['ok', 'src/ink/judge.test.ts', '(11 tests)', '12ms'],
  ['ok', 'src/match/clock.test.ts', '(6 tests)', '7ms'],
  ['ok', 'src/player/squid.test.ts', '(9 tests)', '13ms'],
  ['ok', 'src/bots/squad.test.ts', '(11 tests)', '19ms'],
  ['', ''],
  ['sum', 'Test Files', '5 passed (5)'],
  ['sum', '     Tests', '46 passed (46)'],
];
const PASSED = '46 passed';
// the models whose output this card wires into the build, in the order the chat ran them
const ASSETS = [
  ['meshy', '<b>4</b> GLBs'],
  ['hymotion', '<b>4</b> clips'],
  ['eleven', '<b>6</b> SFX'],
  ['suno', '<b>1</b> track'],
  ['gemini', '<b>8</b> images'],
];
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, s) => a + s.n, 0); // 1,889

// transcript geometry in --u units (1px): the JS stacks the slots exactly, like the referent
const LH = 17, BODY = 7, GAP = 6;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const DUR = { row: 0.08, edit: 0.08, card: 0.2, term: 0.34 };
const STEP = { row: 0.05, edit: 0.034, card: 0.15, term: 0.34 };

const KW = new Set(['import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'class',
  'this', 'for', 'of', 'in', 'true', 'false', 'null', 'undefined', 'typeof', 'extends', 'constructor', 'while', 'break',
  'async', 'await', 'interface', 'type', 'enum', 'readonly', 'private', 'public']);
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
const fileIco = (f) => { const e = (f.split('.').pop() || '').toUpperCase(); return `<b class="ocx-fi${e === 'TS' ? ' ocx-ts' : ''}">${e}</b>`; };
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
    T.done = T.items[T.items.length - 1].b + 0.04 * P; // the suite passes: review bar live, Worked for
    // the chips under the card: every model's output wired into the build, one tick each
    T.c1 = T.done + 0.14 * P;
    T.c1s = ASSETS.map((_, i) => T.c1 + 0.06 * i * P);
    T.end = T.c1s[T.c1s.length - 1] + 0.62 * P;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, (k.opts && k.opts.say) || SAY);
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
    const chip = (ico, label) => `<span class="ocx-chip">${ico}<span class="ocx-cl">${label}</span><span class="ocx-ok">${TICK}</span></span>`;
    const rows = x.el(`<div class="ocx-rows">
      <div class="ocx-line ocx-l1 ocx-models">${ASSETS.map(([app, label]) => chip(x.tile(app), label)).join('')}</div>
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
    // a chip's tick pops in with a small overshoot once its wiring lands
    const tick = (ok, t, t0) => {
      const q = seg(t, t0, t0 + 0.2);
      ok.style.opacity = seg(t, t0, t0 + 0.1).toFixed(3);
      ok.style.transform = q >= 1 ? 'none' : `scale(${(0.5 + 0.5 * outBack(q)).toFixed(3)})`;
    };
    const oks = l1chips.map((c) => c.querySelector('.ocx-ok'));

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

        // header: the replayed clock races while Working, then Worked for 15m 03s with a tick
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

        // the chips: each model's output rises in and its wiring tick lands
        rows.style.opacity = t >= T.c1 ? '1' : '0';
        l1chips.forEach((c, i) => { rise(c, seg(t, T.c1s[i], T.c1s[i] + 0.3), 8, 1); tick(oks[i], t, T.c1s[i] + 0.27); });
      },
    };
  },
};