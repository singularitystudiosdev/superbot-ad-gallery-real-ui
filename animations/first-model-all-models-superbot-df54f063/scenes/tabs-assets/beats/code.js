// Opus 5.5 codes the ride in three.js as a sped-up replay of an agent run, in the grammar of Cursor's agent panel
// (referent: Cursor changelog 1.7 demo video and the 2.1 review video): "Thought" and "Read" tool rows, a file-edit card
// whose green diff hunk of real JS streams past with line numbers, collapsed "Edited" rows, a terminal block running
// the build to "built in 1.84s", and the review bar "6 files changed +870 -0" with Undo all / Accept all / Review.
// The transcript is bottom-anchored inside a fixed viewport (CSS only), so every item that lands pushes the run up the
// way the real panel autoscrolls. Styles: ../mc-code.css.
// Pure function of t: every item's slot, height and stream are computed from the schedule in times(); render() reads
// the clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, outBack } from '../../../lib.js';
import { sayer, rise, setText, fmt, REPO, TICK, TERM, O_BRANCH } from './kit.js';

// ---- the code that flies past: plausible source for the ride (bike on a looping road, terrain, trees, ambience) ----
const RIDE = `import * as THREE from 'three';
import { buildTerrain } from './terrain.js';
import { plantTrees } from './trees.js';
import { ambience } from './audio.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#f4b6a0', 40, 260);
const road = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), true);
const bike = await loadModel('assets/models/bike_rider.glb');
scene.add(buildTerrain(road), plantTrees(road, 180), bike);
ambience.play(['cicadas', 'chimes', 'stream']);

let u = 0;
renderer.setAnimationLoop(() => {
  u = (u + 0.00012 * speed) % 1; // one lap of the valley road
  const p = road.getPointAt(u), ahead = road.getPointAt((u + 0.002) % 1);
  bike.position.copy(p);
  bike.lookAt(ahead);
  wheels.forEach((w) => (w.rotation.x -= speed * 0.21));
  camera.position.lerp(p.clone().add(CHASE), 0.06);
  camera.lookAt(ahead);
  ambience.freewheel(speed);
  renderer.render(scene, camera);
});`;
const BUILD = [
  ['$', 'npm run build'],
  ['', '> japan-ride@1.0.0 build'],
  ['', '> vite build'],
  ['', ''],
  ['ok', '38 modules transformed.'],
  ['file', 'dist/index.html', '0.6 kB'],
  ['file', 'dist/assets/ride.js', '612.4 kB'],
  ['file', 'dist/assets/audio/', '4 files'],
  ['ok', 'built in 1.84s'],
];
const BUILT = 'built in 1.84s';

// ---- the run: what lands, in order (it reads the models and the sounds the earlier models made) ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: 'assets/models/ assets/audio/' },
  { k: 'card', f: 'src/ride.js', n: 318, src: RIDE },
  { k: 'edit', f: 'src/terrain.js', n: 264 },
  { k: 'edit', f: 'src/trees.js', n: 142 },
  { k: 'edit', f: 'src/audio.js', n: 88 },
  { k: 'edit', f: 'src/input.js', n: 22 },
  { k: 'edit', f: 'index.html', n: 36 },
  { k: 'term', cmd: 'npm run build' },
];
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((s, f) => s + f.n, 0); // 870
// seconds at pace 1: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP)
const DUR = { row: 0.07, edit: 0.07, card: 0.26, term: 0.22 };
const STEP = { row: 0.045, edit: 0.04, card: 0.2, term: 0.22 };
// heights in --u units (1px at narrow columns, a bit more on wide ones); GAP rides inside each item's slot
const BODY = 7, LH = 17; // a code/terminal body shows 7 lines of 17
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const GAP = 6;
const WORK = 258; // the elapsed clock the run replays, in seconds (4m 18s)

// ---- a small highlighter, run once at build: comments, strings, numbers, keywords, calls, types, members ----
const KW = new Set('import export from const let var function return for of if else continue new class await async this true false null while break'.split(' '));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src) {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/g;
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

const ext = (f) => (f.endsWith('.html') ? 'html' : 'js');
const fileIco = (f) => `<b class="mcx-fi ${ext(f)}">${ext(f) === 'html' ? '&lt;&gt;' : 'JS'}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="mcx-add">+${fmt(n)}</span><span class="mcx-del">-0</span>`;
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="mcx-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="mcx-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="mcx-card">
      <div class="mcx-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="mcx-add">+0</span><span class="mcx-del">-0</span></em></div>
      <div class="mcx-bd"><div class="mcx-lines">${lines.map((l, i) => `<div class="mcx-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  // the terminal block
  const tl = BUILD.map(([kind, a, b]) => {
    if (kind === '$') return `<div class="mcx-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'ok') return `<div class="mcx-l"><code><i class="ok">&#10003;</i> ${esc(a)}</code></div>`;
    if (kind === 'file') return `<div class="mcx-l"><code><i class="dim">${esc(a)}</i>  ${esc(b)}</code></div>`;
    return `<div class="mcx-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="mcx-term">
    <div class="mcx-ch">${TERM}<b class="mcx-tv">Running</b><span class="mcx-cmd">${esc(s.cmd)}</span><em class="mcx-tst"><i class="mcx-spin"></i><span></span></em></div>
    <div class="mcx-bd"><div class="mcx-lines">${tl}</div></div>
  </div>`;
}

export default {
  times(r, next, c) {
    const p = c.pace || 1, T = { r };
    T.card = r + 0.06 * p;
    let at = T.card + 0.08 * p;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] * p }; at += STEP[s.k] * p; return o; });
    T.done = T.items[T.items.length - 1].b + 0.03 * p; // the build passes: review bar live, Done
    T.end = next;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.code, 110);
    const card = x.el(`<div class="mcx">
      <div class="mcx-hd">
        <span class="mcx-repo">${REPO}<b>japan-ride</b></span><span class="mcx-br">${O_BRANCH}main</span>
        <em class="mcx-state"><i class="mcx-spin"></i>${TICK}<span class="mcx-sl">Working</span><span class="mcx-clk">0m 00s</span></em>
      </div>
      <div class="mcx-vp"><div class="mcx-stk">${SCRIPT.map((s) => `<div class="mcx-it">${itemHTML(s)}</div>`).join('')}<div class="mcx-sp"></div></div></div>
      <div class="mcx-ft">
        <span class="mcx-sum"><svg class="mcx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="mcx-nf">0 files</b><span class="mcx-add">+0</span><span class="mcx-del">-0</span></span>
        <span class="mcx-btns"><i class="mcx-b">Undo all</i><i class="mcx-b mcx-pri">Accept all</i><i class="mcx-b">Review</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (see mc-code.css): the card's content width against the same
    // thresholds, re-read only when the card resizes; a hidden card (0 wide) keeps its last classes
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('mcx-wide', w >= 760); card.classList.toggle('mcx-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.mcx-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.mcx-l')];
        o.box = n.querySelector('.mcx-lines');
        o.shown = -1;
        o.add = n.querySelector('.mcx-ch .mcx-add');
      }
      if (s.k === 'term') { o.tv = n.querySelector('.mcx-tv'); o.tst = n.querySelector('.mcx-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.mcx-state'), stateL = $('.mcx-sl'), clk = $('.mcx-clk'), spin = $('.mcx-hd .mcx-spin'), stTk = state.querySelector('.mc-tk');
    const nf = $('.mcx-nf'), fAdd = $('.mcx-ft .mcx-add'), ft = $('.mcx-ft'), pri = $('.mcx-pri');

    // lines streamed so far in a card/terminal body: slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.r + 0.02);
        rise(card, seg(t, T.card, T.card + 0.2), 16);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + 0.07));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it also scrolls its 6-unit top padding away, so no sliver of a line peeks under the header
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
              setText(o.tsl, ok ? BUILT : '');
              o.tst.classList.toggle('ok', ok);
              o.spin.style.transform = `rotate(${((t - o.a) * 900).toFixed(1)}deg)`;
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // header: the replayed elapsed clock races while Working, then Worked for 4m 18s with a tick
        const w = seg(t, T.card, T.done);
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * w));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.22);
        stTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('mcx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.3));
        pri.style.transform = d ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
