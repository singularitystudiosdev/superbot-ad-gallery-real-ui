// The GitHub beat: superbot pushes the reel repo and the push plays as a motion-graphics move.
//   1. a tool chip lands ('Pushing to GitHub'), its spinner is the thread's graph editor (chat.js renderSpins);
//   2. the repo card MASK-WIPES on left to right behind an orange leading edge;
//   3. the commit message sets as KINETIC TYPE: each glyph rises out of a baseline mask on an outBack ease;
//   4. the diffstat is a mini TIMELINE: a tick ruler wipes on, and every file (or folder) is a track row whose bar is
//      a layer clip revealed from its in-key with an outBack ease, one clip segment per file, a KEYFRAME DIAMOND riding
//      the tip (hollow while the bar travels, filled with a pop once the row's last file is in) and a directional
//      smear streaking off the tip in proportion to its speed (the motion blur); the overshoot stretches the clip;
//   5. a PLAYHEAD steps along the ruler as each file lands and the counter ticks with it; the chip resolves to the
//      count ('Pushed 13 files', derived from the rows so the two can never disagree); 'main' lights with a drawn
//      check; the reply closes the beat.
// Every frame is a pure function of t: the land times are solved once at build from the ease, never accumulated.
import { lerp, seg, clamp, outCubic, outBack, streamCount } from '../../../lib.js';

const REPO = ['sam', 'showreel'];
const BRANCH = 'main';
const SHA = '4f1c9e2';
const MSG = 'render: showreel, 15s at 60fps';
// the pushed tree, one track row each: [folder, name, tag, files, bar length as a share of the lane, layer colour].
// The longest share stays under 1 / 1.1 so outBack's ~10% overshoot never runs off the lane.
const FILES = [
  ['', 'reel.ts', '', 1, 0.52, '#3043fe'],
  ['score/', 'main-cut.wav', '', 1, 0.8, '#fc591f'],
  ['', 'meshes/', '4 .glb', 4, 0.9, '#f2eee6'],
  ['', 'frames/', '6 .png', 6, 0.72, '#fc591f'],
  ['', 'palette.json', '', 1, 0.2, '#c9fb1e'],
];
const COUNT = FILES.reduce((s, f) => s + f[3], 0);
const CHIP = ['Pushing to GitHub', `Pushed ${COUNT} files`];
const SAY = 'Pushed. The reel, the score and every mesh are in one repo.';

const BAR = 0.5;          // one bar's outBack reveal
const GLYPH = 0.014;      // kinetic type stagger per glyph
const GLYPH_DUR = 0.34;   // one glyph's rise
const HEAD_STEP = 0.2;    // the playhead's eased step per landed file
const FRAME = 1 / 60;     // the smear reads the tip's travel over one frame

const f2 = (v) => v.toFixed(2);
const pct = (v) => `${(v * 100).toFixed(3)}%`;
// the first p at which outBack reaches f: the moment the revealed length passes a segment's end
const crossAt = (f) => { for (let i = 0; i <= 2000; i++) if (outBack(i / 2000) >= f - 1e-9) return i / 2000; return 1; };

const BRANCH_SVG = '<svg class="git-br-i" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/></svg>';
const CHECK_SVG = '<svg class="git-ck" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path class="git-ck-p" d="M2.5 6.3 5 8.6 9.6 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="11" stroke-dashoffset="11"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.05;                                   // the tool chip lands
    T.card = r + 0.28;                                   // the repo card wipes on
    T.msg = r + 0.46;                                    // the commit message's first glyph rises
    T.ruler = r + 0.5;                                   // the tick ruler wipes on, the playhead appears
    T.bar = FILES.map((_, i) => r + 0.62 + i * 0.13);    // each track's bar leaves its in-key
    T.settle = T.bar.map((a) => a + BAR);                // and settles on its out-key
    T.done = T.settle[T.settle.length - 1] + 0.04;       // the chip resolves to the count
    T.main = T.done + 0.02;                              // 'main' lights with a drawn check
    T.say = T.done + 0.16;                               // the reply streams
    T.end = r + 2.95;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const row = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(CHIP[0])}</span></div></div>`);
    const glyphs = [...MSG].map((ch) => `<span class="git-g">${x.esc(ch)}</span>`).join('');
    const tracks = FILES.map(([dir, name, tag, n, share, c]) => {
      const segs = Array.from({ length: n }, (_, j) => `<i class="git-seg" style="left:${pct(j / n)};width:calc(${pct(1 / n)} - ${n > 1 ? 2 : 0}px)"></i>`).join('');
      return `<div class="git-row">
        <div class="git-name"><i class="git-sw" style="background:${c}"></i><span class="git-fn">${dir ? `<span class="git-dir">${x.esc(dir)}</span>` : ''}${x.esc(name)}</span>${tag ? `<span class="git-tag">${x.esc(tag)}</span>` : ''}</div>
        <div class="git-lane" style="--c:${c}"><div class="git-clip"><div class="git-body" style="width:${pct(share)}"><i class="git-tint"></i>${segs}</div></div><i class="git-smear"></i><i class="git-kf git-kf-in"></i><i class="git-kf git-kf-out"></i></div>
      </div>`;
    }).join('');
    const card = x.el(`<div class="git-card">
      <div class="git-head">
        <span class="git-logo"><img src="${x.brand('github-logo.svg')}" alt="GitHub"/></span>
        <span class="git-repo">${x.esc(REPO[0])}<span class="git-sl">/</span><b>${x.esc(REPO[1])}</b></span>
        <span class="git-branch">${BRANCH_SVG}<span>${x.esc(BRANCH)}</span>${CHECK_SVG}</span>
      </div>
      <div class="git-commit"><i class="git-node"></i><span class="git-sha">${x.esc(SHA)}</span><span class="git-msg">${glyphs}</span></div>
      <div class="git-tl">
        <div class="git-row git-rhead"><div class="git-name git-count"><span class="git-cnt">00</span>/${COUNT} files</div><div class="git-ruler"></div></div>
        ${tracks}
        <div class="git-ph"><i class="git-ph-h"></i></div>
      </div>
      <i class="git-edge"></i>
    </div>`);
    const sayEl = x.el(`<div class="qc-say git-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const chip = row.firstElementChild, spin = chip.firstElementChild, chipT = chip.lastElementChild;
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const edge = card.querySelector('.git-edge');
    const gEls = [...card.querySelectorAll('.git-g')];
    const sha = card.querySelector('.git-sha'), node = card.querySelector('.git-node');
    const ruler = card.querySelector('.git-ruler'), ph = card.querySelector('.git-ph'), cnt = card.querySelector('.git-cnt');
    const branch = card.querySelector('.git-branch'), ckP = card.querySelector('.git-ck-p');
    const lanes = [...card.querySelectorAll('.git-lane')].map((lane, i) => ({
      clip: lane.querySelector('.git-clip'),
      body: lane.querySelector('.git-body'),
      smear: lane.querySelector('.git-smear'),
      kin: lane.querySelector('.git-kf-in'),
      kout: lane.querySelector('.git-kf-out'),
      a: T.bar[i],
      share: FILES[i][4],
      // each segment (a file) is in once the revealed length passes its end; the last one fills the out-key
      land: Array.from({ length: FILES[i][3] }, (_, j) => T.bar[i] + crossAt((j + 1) / FILES[i][3]) * BAR),
    }));
    const lands = lanes.flatMap((l) => l.land);
    // the revealed length of a lane at t, as a share of the lane (outBack overshoots, then settles on its share);
    // below its share the clip reveals fixed segments, past it the segments stretch with the tip
    const tip = (l, tt) => l.share * outBack(seg(tt, l.a, l.a + BAR));

    let shown = -1, shownCnt = -1;
    return {
      nodes: [row, card, sayEl],
      marks: [[T.chip, row], [T.card, card], [T.say, sayEl]],
      render(t) {
        // the tool chip: rises, turns (the graph editor's key, driven in chat.js renderSpins), resolves to the count
        const cp = seg(t, T.chip, T.chip + 0.35), ce = outCubic(cp);
        row.style.opacity = ce.toFixed(3);
        row.style.transform = cp >= 1 ? '' : `translateY(${f2((1 - ce) * 8)}px)`;
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${((Math.max(0, t - T.chip) * 450) % 360).toFixed(1)}deg)`;
        const lab = CHIP[done ? 1 : 0];
        if (chipT.textContent !== lab) chipT.textContent = lab;

        // the card: a left-to-right mask wipe behind an orange leading edge, a small push along the wipe
        const cw = seg(t, T.card, T.card + 0.42), we = outCubic(cw);
        card.style.opacity = t < T.card ? '0' : '1';
        card.style.clipPath = cw >= 1 ? 'none' : `inset(0 ${f2((1 - we) * 100)}% 0 0 round 10px)`;
        card.style.transform = cw >= 1 ? '' : `translateX(${f2((we - 1) * 10)}px)`;
        edge.style.left = `calc(${f2(we * 100)}% - 2px)`;
        edge.style.opacity = (cw > 0 ? 1 - seg(t, T.card + 0.3, T.card + 0.46) : 0).toFixed(3);

        // the commit: its node and sha settle, then every glyph of the message rises out of the baseline mask
        const sp = seg(t, T.msg - 0.12, T.msg + 0.16), se = outCubic(sp);
        sha.style.opacity = se.toFixed(3);
        node.style.transform = `rotate(45deg) scale(${f2(lerp(0.2, 1, outBack(sp)))})`;
        gEls.forEach((g, i) => {
          const a = T.msg + i * GLYPH, p = seg(t, a, a + GLYPH_DUR);
          g.style.transform = p >= 1 ? 'none' : `translateY(${f2((1 - outBack(p)) * 105)}%)`;   // 'none', not '': the css rest state is the masked one
        });

        // the ruler wipes on and the playhead steps one eased notch per landed file
        const rp = outCubic(seg(t, T.ruler, T.ruler + 0.35));
        ruler.style.clipPath = rp >= 1 ? 'none' : `inset(0 ${f2((1 - rp) * 100)}% 0 0)`;
        ph.style.opacity = outCubic(seg(t, T.ruler + 0.1, T.ruler + 0.3)).toFixed(3);
        ph.style.setProperty('--p', (lands.reduce((s, a) => s + outCubic(seg(t, a, a + HEAD_STEP)), 0) / COUNT).toFixed(4));
        const n = lands.reduce((s, a) => s + (t >= a ? 1 : 0), 0);
        if (n !== shownCnt) { cnt.textContent = String(n).padStart(2, '0'); shownCnt = n; }

        // each track: the clip revealed to the tip, the out-key riding it, the smear trailing its travel
        for (const l of lanes) {
          const w = tip(l, t), d = w - tip(l, t - FRAME);
          const on = t >= l.a;
          l.clip.style.clipPath = `inset(0 ${f2((1 - w) * 100)}% 0 0)`;
          l.body.style.width = pct(Math.max(w, l.share));   // the overshoot stretches the clip itself, out-key on its end
          l.kin.style.opacity = outCubic(seg(t, l.a - 0.06, l.a + 0.06)).toFixed(3);
          const last = l.land[l.land.length - 1];
          const filled = t >= last;
          l.kout.classList.toggle('is-on', filled);
          l.kout.style.opacity = on ? '1' : '0';
          l.kout.style.left = pct(w);
          l.kout.style.transform = `rotate(45deg) scale(${f2(filled ? lerp(1.7, 1, outCubic(seg(t, last, last + 0.24))) : 1)})`;
          const s = clamp(Math.abs(d) * 100 * 0.9, 0, 12);   // smear length, % of the lane
          l.smear.style.opacity = clamp(Math.abs(d) * 100 / 4, 0, 0.85).toFixed(3);
          l.smear.style.width = `${f2(s)}%`;
          l.smear.style.left = pct(w);   // blur only reads outside the solid clip: it streaks ahead of the tip
        }

        // main lights once the push has landed, with a drawn check
        const bp = seg(t, T.main, T.main + 0.3);
        branch.classList.toggle('is-on', t >= T.main);
        branch.style.transform = bp <= 0 || bp >= 1 ? '' : `scale(${lerp(0.88, 1, outBack(bp)).toFixed(4)})`;
        ckP.style.strokeDashoffset = f2(11 * (1 - outCubic(seg(t, T.main + 0.06, T.main + 0.36))));

        // the reply closes it
        const m = streamCount(SAY, T.say, 90, t);
        if (m !== shown) { vis.textContent = SAY.slice(0, m); hid.textContent = SAY.slice(m); shown = m; }
      },
    };
  },
};
