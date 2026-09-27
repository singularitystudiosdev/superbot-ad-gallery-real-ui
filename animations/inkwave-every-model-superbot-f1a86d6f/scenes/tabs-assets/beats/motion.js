// HY-Motion 1.0 beat, the fourth request of ?v=1. Superbot hands the rigged character Meshy just made to Tencent
// Hunyuan's text to 3D motion model: the card carries juno.glb with its live rig thumbnail, four motion prompts are
// queued and typed, a generate button runs the job with a progress row, then the four finished motion clips play in
// a 2x2 grid, each with the lime skeleton drawn over the character, a scrubber that walks as the frames advance,
// and its own frame count (72f @ 30fps).
//
// IMAGERY / SOURCING. Not one pixel here is a screenshot, a stock still or a hand-drawn illustration: every frame is
// a real 3D render, produced offline with headless three.js (harness kept beside the ad at
// .tmp/motion-f1a86d6f/harness/rig.html + shoot_rig.mjs, 224x168 webp, 72 frames per clip at 30fps, plus the rig
// thumbnail) and played back here as a pure function of t. The character is the hooded chibi rogue from KayKit
// Adventurers 2.0 (KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0, "Rogue_Hooded.glb"), and the motions are
// the KayKit Character Animations 1.1 clips, which are authored on the same rig and driven here through a
// THREE.AnimationMixer, sampled at t = frame/30:
//   swim     "dive into ink and swim"           Crawling, prone, low in a dark ink plane
//   splat    "strafe and fire the splattershot" Ranged_1H_Shooting, with a lateral strafe drift over the clip
//   jump     "super jump launch"                Jump_Full_Long, the whole launch arc out of the clip's own hips track
//   victory  "victory pose on the podium"       Cheering
// Both packs are CC0 1.0 by Kay Lousberg (kaylousberg.itch.io); the rig's animation sets are reached through the
// CC0 mirror GeorgeQLe/assets-kaykit-3d-characters. The lime rig overlay is real geometry, not a line helper: a
// joint sphere on every bone and a shaft between a bone and its parent, parented to the bones so it follows the
// skinning exactly, drawn over the character's own atlas at 55% opacity (the skeleton is the artifact HY-Motion
// returns, so the skeleton is the subject). Rim lights are the ad's own ink colours, lime #b6f000 behind right and
// magenta #e5189a behind left. Full provenance in img/ink/motion/CREDITS.txt. No Hunyuan asset, API key or
// generated file is used: HY-Motion 1.0 is named as the model the ad routed the request to.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame. Every moving value below is written from t in render.
import { clamp, lerp, seg, outCubic, outBack, streamCount, press } from '../../../lib.js';

const TITLE = 'HY-Motion 1.0';
const SAY = 'Generated 4 motion clips: ink swim, splattershot, super jump, podium cheer.';
const FILE = 'juno.glb';
const RIG = 'skinned rig, 68 clips';
const FRAMES = 72;                    // baked frames per clip (see img/ink/motion/CREDITS.txt)
const FPS = 30;
const CHIPS = ['skinned rig', '72 frames', '30fps', '4 clips'];
// the four prompts superbot queued, in the order the grid shows their results, each named with the rig clip that
// actually plays in it (fluid, not decoration: the clip name is what the render shows)
const PROMPTS = [
  { key: 'swim', text: 'dive into ink and swim', clip: 'Crawling' },
  { key: 'splat', text: 'strafe and fire the splattershot', clip: 'Ranged_1H_Shooting' },
  { key: 'jump', text: 'super jump launch', clip: 'Jump_Full_Long' },
  { key: 'victory', text: 'victory pose on the podium', clip: 'Cheering' },
];
const STATUS = ['Reading juno.glb rig', 'Generating motion', 'Baking 4 clips', '4 clips ready'];
const CPS = 70;                       // prompt typing speed, chars per second
const STAGGER = 0.14;                 // each queued prompt starts this far behind the one before it

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08;                // the composer lands
    T.type = r + 0.38;                // the four prompts type themselves in, one after the next
    T.queue = r + 1.20;               // the last prompt is in, all four queued
    T.press = r + 1.26;               // the generate button goes down
    T.gen = r + 1.34;                 // the job starts
    T.prog1 = r + 1.94;               // the job finishes (fast, so the clips get most of the beat)
    T.grid = r + 1.98;                // the four clips land
    T.clip0 = r + 2.06;               // all four start playing together, like one batch
    T.end = r + 4.0;                  // 1.94s of the clips playing, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const rows = PROMPTS.map((p, i) => x.el(`<div class="qc-hm-pr">
      <span class="qc-hm-pr-n">${String(i + 1).padStart(2, '0')}</span>
      <span class="qc-hm-pr-t"><span class="qc-hm-pr-v"></span><i class="qc-hm-pr-c"></i><span class="qc-hm-pr-h"></span></span>
      <span class="qc-hm-pr-s">queued</span>
    </div>`));
    const clips = PROMPTS.map((p) => x.el(`<figure class="qc-hm-c">
      <img class="qc-hm-fr" alt="" src="${x.img(`ink/motion/${p.key}-00.webp`)}"/>
      <span class="qc-hm-cnt">f 000/${FRAMES}</span>
      <span class="qc-hm-scr"><i></i></span>
      <figcaption class="qc-hm-cap">
        <span class="qc-hm-cap-t">${x.esc(p.text)}</span>
        <span class="qc-hm-cap-m">${FRAMES}f @ ${FPS}fps</span>
      </figcaption>
    </figure>`));
    const card = x.el(`<div class="qc-hm">
      <div class="qc-hm-hd"><span class="qc-hm-mk">${x.tile('hymotion')}</span><b>${x.esc(TITLE)}</b><span class="qc-hm-badge">motion</span></div>
      <div class="qc-hm-carry">
        <span class="qc-hm-carry-i"><img src="${x.img('ink/motion/juno-rig.webp')}" alt=""/></span>
        <span class="qc-hm-carry-n">${x.esc(FILE)}</span>
        <span class="qc-hm-carry-m">${x.esc(RIG)}</span>
      </div>
      <div class="qc-hm-prs"></div>
      <div class="qc-hm-chips">${CHIPS.map((c) => `<span class="qc-hm-chip">${x.esc(c)}</span>`).join('')}</div>
      <button class="qc-hm-go" type="button"><span class="qc-hm-spin"></span><span class="qc-hm-go-t">Generate</span></button>
      <div class="qc-hm-pg">
        <span class="qc-hm-bar"><i></i></span><span class="qc-hm-pct">0%</span><span class="qc-hm-st">${x.esc(STATUS[0])}</span>
      </div>
      <div class="qc-hm-grid"></div>
    </div>`);
    const prs = card.querySelector('.qc-hm-prs');
    rows.forEach((n) => prs.appendChild(n));
    const grid = card.querySelector('.qc-hm-grid');
    clips.forEach((f) => grid.appendChild(f));
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const sayV = say.firstElementChild, sayH = say.lastElementChild;
    const ps = rows.map((n) => ({ v: n.querySelector('.qc-hm-pr-v'), h: n.querySelector('.qc-hm-pr-h'), s: n.querySelector('.qc-hm-pr-s'), c: n.querySelector('.qc-hm-pr-c') }));
    const frs = clips.map((f) => f.querySelector('.qc-hm-fr'));
    const cnts = clips.map((f) => f.querySelector('.qc-hm-cnt'));
    const scrs = clips.map((f) => f.querySelector('.qc-hm-scr i'));
    const go = card.querySelector('.qc-hm-go'), goT = card.querySelector('.qc-hm-go-t'), spin = card.querySelector('.qc-hm-spin');
    const bar = card.querySelector('.qc-hm-bar i'), pct = card.querySelector('.qc-hm-pct'), st = card.querySelector('.qc-hm-st');
    const carry = card.querySelector('.qc-hm-carry');
    let sayN = -1, lastSt = -1;
    const shown = ps.map(() => -1), lastIdx = frs.map(() => -1), lastCnt = cnts.map(() => -1);

    // warm every frame the beat can ask for, so the first take never shows a half-loaded clip (this is a prefetch,
    // not an animation: nothing here advances on its own, it just fills the image cache)
    const preload = PROMPTS.flatMap((p) => {
      const out = [];
      for (let i = 0; i < FRAMES; i++) { const im = new Image(); im.src = x.img(`ink/motion/${p.key}-${String(i).padStart(2, '0')}.webp`); out.push(im); }
      return out;
    });

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.grid, grid]],
      preload,
      render(t) {
        // the reply line streams like every other beat's
        const n = streamCount(SAY, T.r + 0.06, 92, t);
        if (n !== sayN) { sayV.textContent = SAY.slice(0, n); sayH.textContent = SAY.slice(n); sayN = n; }

        // the composer lands and then creeps in for as long as the job runs
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        const push = lerp(1, 1.02, seg(t, T.card, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${(lerp(0.96, 1, ci) * push).toFixed(4)})`;

        // the carried file slides in from the left, the way a hand-off lands on a routing chip
        const ca = outCubic(seg(t, T.card + 0.12, T.card + 0.6));
        carry.style.opacity = ca.toFixed(3);
        carry.style.transform = `translateX(${((1 - ca) * -14).toFixed(2)}px)`;

        // the four prompts type themselves in one after the next, then hold as the queue
        ps.forEach((p, i) => {
          const t0 = T.type + i * STAGGER;
          const m = streamCount(PROMPTS[i].text, t0, CPS, t);
          if (m !== shown[i]) { p.v.textContent = PROMPTS[i].text.slice(0, m); p.h.textContent = PROMPTS[i].text.slice(m); shown[i] = m; }
          const typing = t >= t0 && m < PROMPTS[i].text.length;
          p.c.style.opacity = typing && ((t % 1.06) < 0.53) ? '1' : '0';
          // grading: queued until the job runs, then animating, then the finished frame count
          const done = t >= T.prog1;
          const busy = t >= T.gen && t < T.prog1;
          const label = done ? `${FRAMES}f ready` : busy ? 'animating' : 'queued';
          if (p.s.textContent !== label) p.s.textContent = label;
          p.s.classList.toggle('is-done', done);
        });

        // the generate button: down under the press, spinner while the job runs, done when it lands
        const pe = outCubic(seg(t, T.gen, T.prog1));
        const busy = t >= T.gen && t < T.prog1;
        go.style.transform = `scale(${(1 - 0.06 * press(t, T.press)).toFixed(4)})`;
        go.classList.toggle('is-done', t >= T.prog1);
        goT.textContent = t >= T.prog1 ? 'Done' : busy ? 'Generating' : 'Generate';
        spin.style.opacity = (seg(t, T.gen, T.gen + 0.1) * (1 - seg(t, T.prog1 - 0.1, T.prog1))).toFixed(3);
        spin.style.transform = `rotate(${(((t - T.gen) * 420) % 360).toFixed(1)}deg)`;

        // the job row: bar fills, percent counts, the line says what the render is doing
        bar.style.width = `${(pe * 100).toFixed(1)}%`;
        const p = Math.round(pe * 100);
        if (pct.textContent !== `${p}%`) pct.textContent = `${p}%`;
        const si = t < T.gen ? 0 : pe >= 1 ? 3 : pe < 0.34 ? 0 : pe < 0.72 ? 1 : 2;
        if (si !== lastSt) { st.textContent = STATUS[si]; lastSt = si; }

        // the grid lands, then every clip plays: the baked frame is picked from t, so a frozen ?t= frame is exact
        grid.style.display = t >= T.grid ? 'grid' : 'none';
        const gi = outCubic(seg(t, T.grid, T.grid + 0.4));
        grid.style.opacity = gi.toFixed(3);
        const run = t - T.clip0;
        const idx = run <= 0 ? 0 : Math.floor(run * FPS) % FRAMES;
        clips.forEach((f, i) => {
          const a = clamp(outBack(seg(t, T.grid + i * 0.06, T.grid + i * 0.06 + 0.32)));
          f.style.opacity = a.toFixed(3);
          f.style.transform = `translateY(${((1 - a) * 14).toFixed(2)}px)`;
          if (t < T.clip0) { frs[i].src = x.img(`ink/motion/${PROMPTS[i].key}-00.webp`); lastIdx[i] = 0; }
          else if (idx !== lastIdx[i]) {
            frs[i].src = x.img(`ink/motion/${PROMPTS[i].key}-${String(idx).padStart(2, '0')}.webp`);
            lastIdx[i] = idx;
          }
          const label = `f ${String(idx).padStart(3, '0')}/${FRAMES}`;
          if (label !== lastCnt[i]) { cnts[i].textContent = label; lastCnt[i] = label; }
          scrs[i].style.width = `${((idx / (FRAMES - 1)) * 100).toFixed(1)}%`;
        });
      },
      // the pointer: press Generate, then take the first finished clip
      pointer(t) {
        const moves = [
          [T.press - 0.3, T.press + 0.2, () => x.box(go), T.press],
          [T.clip0 + 0.12, T.clip0 + 0.9, () => x.box(clips[0]), T.clip0 + 0.4],
        ];
        for (const [a, b, at, click] of moves) {
          if (t < a || t > b) continue;
          const p = at();
          return { x: p.cx, y: p.cy, p: press(t, click), v: outCubic(seg(t, a, a + 0.22)) * (1 - seg(t, b - 0.2, b)) };
        }
        return null;
      },
    };
  },
};
