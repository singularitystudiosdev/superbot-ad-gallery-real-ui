// Opus 5.5 beat: the ride gets written, as a sped-up replay of a real agent run in the grammar of Cursor's agent
// panel (re-authored from the make-minecraft ad's beats/opus-code.js, zoom cut): "Thought for 3s" / "Listed" /
// "Read package.json" tool rows, file-edit cards whose syntax-highlighted three.js streams past with line numbers and
// +N -0 stats, collapsed "Edited" rows, a terminal block running `npm run build` to green, and the review bar
// "14 files changed +1,199 -0" with Undo all / Accept all / Review. The transcript is bottom-anchored inside a fixed
// viewport (CSS), so every item that lands pushes the run up the way the panel autoscrolls. The ready line and the
// preview card after it live in ../finale.js (lead-owned).
// Pure function of t (scene-local): every item's slot, height and stream come from the schedule in times(); render()
// reads the clock and nothing else. Item heights are px constants, so the stacking is exact.
import { seg, outCubic, outBack } from '../../../lib.js';
import { fmt, setText, esc, hl, REPO, BRANCH, TICK, TERM, CHEV } from '../opus/kit.js';
import { SCENE, ASSETS, RIDER, WORLD, AUDIO, BUILD, BUILT } from '../opus/src.js';

const SAY = 'Assets are in. Writing the ride: scene, rider, road, audio.';
const WINDOW = 1.35;

// ---- the run: what lands, in order (14 files: 5 edit cards + 9 collapsed Edited rows) ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 3s' },
  { k: 'row', v: 'Listed', a: 'ride/' },
  { k: 'row', v: 'Read', a: 'package.json' },
  { k: 'card', f: 'src/scene.ts', n: 118, src: SCENE },
  { k: 'card', f: 'src/assets.ts', n: 86, src: ASSETS },
  { k: 'edit', f: 'src/materials/toon.ts', n: 42 },
  { k: 'card', f: 'src/rider.ts', n: 164, src: RIDER },
  { k: 'edit', f: 'src/camera.ts', n: 71 },
  { k: 'card', f: 'src/world.ts', n: 212, src: WORLD },
  { k: 'edit', f: 'src/props/poles.ts', n: 96 },
  { k: 'edit', f: 'src/props/trees.ts', n: 58 },
  { k: 'edit', f: 'src/props/houses.ts', n: 64 },
  { k: 'card', f: 'src/audio.ts', n: 93, src: AUDIO },
  { k: 'edit', f: 'src/fx/fireflies.ts', n: 77 },
  { k: 'edit', f: 'src/input.ts', n: 48 },
  { k: 'edit', f: 'src/loop.ts', n: 39 },
  { k: 'edit', f: 'src/main.ts', n: 31 },
  { k: 'row', v: 'Thought', a: 'for 1s' },
  { k: 'term', cmd: 'npm run build' },
];
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((s, f) => s + f.n, 0); // 1,199 over 14 files
// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP). The reference
// zoom cut runs these at pace 0.86 of (row .08/.05, edit .08/.034, card .2/.15, term .34); ours is about 0.6 of that
// so the whole run lands by r + 1.08 inside a 1.35s window.
const DUR = { row: 0.05, edit: 0.05, card: 0.12, term: 0.17 };
const STEP = { row: 0.028, edit: 0.018, card: 0.09, term: 0.17 };
// heights in px; GAP rides inside each item's slot. A code/terminal body shows 7 lines of 17.
const BODY = 7, LH = 17;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const GAP = 6;
const WORK = 258; // the elapsed clock the run replays (4m 18s)

const ext = (f) => (f.endsWith('.ts') ? 'ts' : 'js');
const fileIco = (f) => `<b class="cx-fi ${ext(f)}">${ext(f).toUpperCase()}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="cx-add">+${fmt(n)}</span><span class="cx-del">-0</span>`;
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="cx-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="cx-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="cx-card">
      <div class="cx-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="cx-add">+0</span><span class="cx-del">-0</span></em></div>
      <div class="cx-bd"><div class="cx-lines">${lines.map((l, i) => `<div class="cx-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  // the terminal block
  const tl = BUILD.map(([kind, a, b]) => {
    if (kind === '$') return `<div class="cx-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'ok') return `<div class="cx-l"><code><i class="ok">&#10003;</i> ${esc(a)}</code></div>`;
    if (kind === 'out') return `<div class="cx-l"><code><i class="dim">${esc(a.slice(0, a.lastIndexOf('/') + 1))}</i><i class="t">${esc(a.slice(a.lastIndexOf('/') + 1))}</i>  <i class="dim">${esc(b)}</i></code></div>`;
    if (kind === 'done') return `<div class="cx-l"><code><i class="ok">&#10003; ${esc(a)}</i></code></div>`;
    return `<div class="cx-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="cx-term">
    <div class="cx-ch">${TERM}<b class="cx-tv">Running</b><span class="cx-cmd">${esc(s.cmd)}</span><em class="cx-tst"><i class="cx-spin"></i><span></span></em></div>
    <div class="cx-bd"><div class="cx-lines">${tl}</div></div>
  </div>`;
}

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.08 };
    let at = r + 0.16;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] }; at += STEP[s.k]; return o; });
    T.done = T.items[T.items.length - 1].b + 0.03; // the build is green: review bar live, "Worked for"
    T.files = FILES.length;
    T.total = TOTAL;
    T.end = r + WINDOW; // chat.js chains the finale from here
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.sayEl(SAY);
    const card = x.el(`<div class="cx">
      <div class="cx-hd">
        <span class="cx-repo">${REPO}<b>japan-ride</b></span><span class="cx-br">${BRANCH}main</span>
        <em class="cx-state"><i class="cx-spin"></i>${TICK}<span class="cx-sl">Working</span><span class="cx-clk">0m 00s</span></em>
      </div>
      <div class="cx-vp"><div class="cx-stk">${SCRIPT.map((s) => `<div class="cx-it">${itemHTML(s)}</div>`).join('')}<div class="cx-sp"></div></div></div>
      <div class="cx-ft">
        <span class="cx-sum">${CHEV}<b class="cx-nf">0 files</b><span class="cx-add">+0</span><span class="cx-del">-0</span></span>
        <span class="cx-btns"><i class="cx-b">Undo all</i><i class="cx-b cx-pri">Accept all</i><i class="cx-b">Review</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const items = [...card.querySelectorAll('.cx-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1, op: '' };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.cx-l')];
        o.box = n.querySelector('.cx-lines');
        o.shown = -1; o.tf = '';
        o.add = n.querySelector('.cx-ch .cx-add');
      }
      if (s.k === 'term') { o.tv = n.querySelector('.cx-tv'); o.tst = n.querySelector('.cx-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.cx-state'), stateL = $('.cx-sl'), clk = $('.cx-clk'), spin = $('.cx-hd .cx-spin'), stTk = state.querySelector('.cx-tk');
    const nf = $('.cx-nf'), fAdd = $('.cx-ft .cx-add'), ft = $('.cx-ft'), pri = $('.cx-pri');
    // lines streamed so far in a card/terminal body: slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;
    const put = (n, prop, v) => { if (n.style[prop] !== v) n.style[prop] = v; };

    return {
      nodes: [say.n, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say, 110);
        x.rise(card, t, T.card, 0.2, 12);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + 0.06));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `${h.toFixed(3)}px`; o.h = h; }
          put(o.n, 'opacity', e.toFixed(3));
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it also scrolls its 6px top padding away, so no sliver peeks under the header
            const over = Math.max(0, nf2 - BODY);
            const tf = `translateY(${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}px)`;
            if (tf !== o.tf) { o.box.style.transform = tf; o.tf = tf; }
            if (s.k === 'card') {
              const nl = s.n * seg(t, o.a, o.b);
              setText(o.add, `+${fmt(nl)}`);
              lines += nl; if (t >= o.b) files++;
            } else {
              const ok = t >= o.b;
              setText(o.tv, ok ? 'Ran' : 'Running');
              setText(o.tsl, ok ? BUILT : '');
              o.tst.classList.toggle('ok', ok);
              put(o.spin, 'transform', `rotate(${((t - o.a) * 900).toFixed(1)}deg)`);
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // header: the replayed elapsed clock races while Working, then "Worked for 4m 18s" with a tick
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * seg(t, T.card, T.done)));
        state.classList.toggle('ok', d);
        if (!d) put(spin, 'transform', `rotate(${((t - T.card) * 720).toFixed(1)}deg)`);
        const pop = seg(t, T.done, T.done + 0.2);
        put(stTk, 'transform', d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '');

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('cx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.26));
        put(pri, 'transform', d && pb > 1e-4 ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '');
        put(pri, 'boxShadow', d && pb > 1e-4 ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '');
      },
    };
  },
};
