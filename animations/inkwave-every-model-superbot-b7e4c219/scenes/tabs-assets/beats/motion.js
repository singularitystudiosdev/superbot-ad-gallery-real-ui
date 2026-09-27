// Beat 'motion' (step 4): HY-Motion 1.0, Tencent Hunyuan's text-to-3D human motion model (DiT + Flow Matching,
// released 2025-12-30, https://github.com/Tencent-Hunyuan/HY-Motion-1.0, model page
// https://huggingface.co/tencent/HY-Motion-1.0; both fetched 2026-09-26, see img/ink/motion/CREDITS.txt), rigs the
// squid kid and generates four clips from text prompts.
//
// The card runs in two steps. (1) AUTO-RIG: the character still (img/ink/motion/rig.jpg, a frame of the source video)
// sits in a rig viewport and the skeleton pops on over it, joint by joint, bone by bone, until the rig resolves.
// (2) CLIP LIBRARY: four text prompts, quoted from the script Opus wrote in step 1, each generate a motion clip and
// land as a video tile in a 2x2 library, with a shared timeline scrubber, a frame counter and the clip fps.
//
// The clips are real footage: img/ink/motion/{swim,jump,strafe,splat}.mp4, each a 2.4 s 480x270 60 fps crop out of
// the "Splatoon Game made by Opus 5.5" video by @JaydenDavisNC (core src1080.mp4, full cut list in
// img/ink/motion/CREDITS.txt). No audio on any of them.
//
// Every video is a real <video> whose clock follows t exactly like play.js: want = clamp(t - T.clip0, 0, DUR - 0.06);
// inside the window it plays live and only re-seeks once the element has drifted past DRIFT_TOL; outside the window
// (and in any frozen ?t= frame, body.freeze) it is paused and seeked onto the exact frame t asks for. No Date, no
// rAF state, no self-running CSS animation or transition: every moving value below is written from t in render.
import { clamp, lerp, seg, outCubic, inOutCubic, outBack, streamCount, press } from '../../../lib.js';

const MODEL = 'HY-Motion 1.0';
const SUB = 'by Tencent Hunyuan';
const MARK = 'ink/motion/hy-motion-logo.png';   // the Hunyuan mark, cropped from the model's own banner (CREDITS.txt)
const RIG = 'ink/motion/rig.jpg';               // the still the skeleton is laid over
const FPS = 60;                                 // the clips are 60 fps (144 frames over 2.4 s)
const DUR = 2.4;                                // every clip is 2.4 s long
const FRAMES = Math.round(DUR * FPS);           // 144
const SEED_TOL = 0.05;                          // a frozen frame only moves currentTime when it is off by more than this
const DRIFT_TOL = 0.25;                         // live playback only re-seeks once the element has drifted further than this

// the four prompts, quoted from the Inkwave script of step 1, and the clip each one generated
const JOBS = [
  { prompt: 'swim as a squid through ink',    src: 'ink/motion/swim.mp4',   poster: 'ink/motion/swim.jpg' },
  { prompt: 'super jump to a teammate',       src: 'ink/motion/jump.mp4',   poster: 'ink/motion/jump.jpg' },
  { prompt: 'strafe and fire',                src: 'ink/motion/strafe.mp4', poster: 'ink/motion/strafe.jpg' },
  { prompt: 'get splatted',                   src: 'ink/motion/splat.mp4',  poster: 'ink/motion/splat.jpg' },
];
const SAY = 'Rigged the squid kid, then generated four clips from the script.';

// the skeleton laid over the still: the squid's mantle down its body, then a bone into each of three tentacles. The
// points are fractions of the rig viewport (rig.jpg is square), picked off the still, so the rig reads as fitted to
// the character rather than a generic mannequin.
const JOINTS = [
  { x: 0.500, y: 0.545 },   // 0 mantle
  { x: 0.552, y: 0.628 },   // 1 head
  { x: 0.585, y: 0.700 },   // 2 body
  { x: 0.556, y: 0.742 },   // 3 hip
  { x: 0.500, y: 0.800 },   // 4 tentacle left
  { x: 0.548, y: 0.833 },   // 5 tentacle centre
  { x: 0.625, y: 0.790 },   // 6 tentacle right
];
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6]];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.06;            // the composer card lands
    T.rig = r + 0.18;             // the rig viewport opens on the still
    T.joint = r + 0.34;           // the first joint pops on
    T.rigDone = r + 0.98;         // the skeleton is complete
    T.list = r + 0.74;            // the prompt list lands
    T.type = r + 0.84;            // the first prompt types itself in
    T.gen = r + 1.36;             // the generate button goes down
    T.genDone = r + 2.02;         // the four clips are generated
    T.lib = r + 2.10;             // the clip library lands
    T.clip0 = r + 2.22;           // all four clips start moving together, like one batch
    T.end = r + 4.15;             // ~1.9 s of the clips playing, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    // the rig viewport: the character still with the skeleton over it
    const rig = x.el(`<div class="qc-hm-rig">
      <img class="qc-hm-still" src="${x.img(RIG)}" alt="the squid kid, before rigging" draggable="false"/>
      <svg class="qc-hm-skel" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${BONES.map(([a, b], i) => `<line class="qc-hm-bone" data-i="${i}" x1="${JOINTS[a].x * 100}" y1="${JOINTS[a].y * 100}" x2="${JOINTS[b].x * 100}" y2="${JOINTS[b].y * 100}"/>`).join('')}
        ${JOINTS.map((j, i) => `<circle class="qc-hm-joint" data-i="${i}" cx="${j.x * 100}" cy="${j.y * 100}" r="2.1"/>`).join('')}
      </svg>
      <span class="qc-hm-rtag">auto-rig</span>
      <span class="qc-hm-rnum">0 joints</span>
    </div>`);
    const bones = [...rig.querySelectorAll('.qc-hm-bone')];
    const joints = [...rig.querySelectorAll('.qc-hm-joint')];
    const rnum = rig.querySelector('.qc-hm-rnum');
    const still = rig.querySelector('.qc-hm-still'), skel = rig.querySelector('.qc-hm-skel');

    // the prompt list: four lines of the script, each quoting the prompt its clip was generated from
    const list = x.el(`<div class="qc-hm-list">${JOBS.map((j, i) => `<div class="qc-hm-row" data-i="${i}">
      <span class="qc-hm-p">${x.esc(j.prompt)}</span>
      <span class="qc-hm-src">opus</span>
      <span class="qc-hm-st">queued</span>
      <span class="qc-hm-pb"><i></i></span>
    </div>`).join('')}</div>`);
    const rows = [...list.children].map((r) => ({
      node: r, vis: r.querySelector('.qc-hm-p'), st: r.querySelector('.qc-hm-st'), bar: r.querySelector('.qc-hm-pb > i'),
    }));

    // the clip library: four video tiles, each the clip its prompt generated
    const lib = x.el(`<div class="qc-hm-lib">${JOBS.map((j, i) => `<figure class="qc-hm-c" data-i="${i}">
      <video class="qc-hm-v" muted playsinline loop preload="auto" poster="${x.img(j.poster)}" src="${x.img(j.src)}"></video>
      <figcaption class="qc-hm-cap">${x.esc(j.prompt)}</figcaption>
      <span class="qc-hm-dur">${DUR.toFixed(1)}s</span>
      <i class="qc-hm-cbar"><i></i></i>
    </figure>`).join('')}</div>`);
    const vids = [...lib.querySelectorAll('.qc-hm-v')];
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vids.forEach((v) => { v.muted = true; v.defaultMuted = true; });
    const ctiles = [...lib.children].map((n) => ({ node: n, bar: n.querySelector('.qc-hm-cbar > i') }));

    const card = x.el(`<div class="qc-hm">
      <div class="qc-hm-hd">
        <span class="qc-hm-mk"><img src="${x.img(MARK)}" alt=""/></span>
        <b>${x.esc(MODEL)}</b><small>${x.esc(SUB)}</small>
        <span class="qc-hm-badge">motion</span>
      </div>
      <div class="qc-hm-body">
        <div class="qc-hm-left"></div>
        <div class="qc-hm-right"></div>
      </div>
      <div class="qc-hm-tp">
        <span class="qc-hm-play"></span>
        <span class="qc-hm-trk"><span class="qc-hm-fill"></span><span class="qc-hm-head"></span></span>
        <span class="qc-hm-fc">f 000 / ${FRAMES}</span>
        <span class="qc-hm-fps">${FPS} fps</span>
        <button class="qc-hm-go" type="button"><span class="qc-hm-spin"></span><span class="qc-hm-go-t">Generate</span></button>
      </div>
      <div class="qc-hm-libwrap"></div>
    </div>`);
    const body = card.querySelector('.qc-hm-body');
    body.querySelector('.qc-hm-left').appendChild(rig);
    body.querySelector('.qc-hm-right').appendChild(list);
    card.querySelector('.qc-hm-libwrap').appendChild(lib);
    const tp = card.querySelector('.qc-hm-tp');
    const tfill = card.querySelector('.qc-hm-fill'), thead = card.querySelector('.qc-hm-head');
    const fc = card.querySelector('.qc-hm-fc');
    const go = card.querySelector('.qc-hm-go'), goT = card.querySelector('.qc-hm-go-t'), spin = card.querySelector('.qc-hm-spin');

    // bone length in the svg's own 0..100 space, for the draw-on dash animation
    const blen = BONES.map(([a, b]) => Math.hypot((JOINTS[a].x - JOINTS[b].x) * 100, (JOINTS[a].y - JOINTS[b].y) * 100));
    let shown = -1, lastFrame = -1;

    return {
      nodes: [say, card],
      // the card lands, then the library lands under it
      marks: [[T.r, say], [T.card, card], [T.lib, card]],
      render(t) {
        // the card rises in and the camera creeps in on it for as long as the job runs
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        const push = lerp(1, 1.02, seg(t, T.card, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${(lerp(0.97, 1, ci) * push).toFixed(4)})`;

        // AUTO-RIG: the viewport opens, then the joints pop on one by one and each bone draws itself between them
        const ri = outCubic(seg(t, T.rig, T.rig + 0.34));
        rig.style.opacity = ri.toFixed(3);
        // the still and the skeleton zoom together as the rig lands, so the joints sit on the character, not around it
        const z = lerp(1.7, 2.05, outCubic(seg(t, T.rig, T.rigDone))).toFixed(4);
        still.style.transform = `scale(${z})`;
        skel.style.transform = `scale(${z})`;
        joints.forEach((c, i) => {
          const p = outBack(seg(t, T.joint + i * 0.052, T.joint + i * 0.052 + 0.2));
          c.style.opacity = clamp(p * 1.2).toFixed(3);
          c.style.transformOrigin = `${JOINTS[i].x * 100}px ${JOINTS[i].y * 100}px`;
          c.style.transform = `scale(${clamp(p).toFixed(3)})`;
        });
        bones.forEach((l, i) => {
          const p = seg(t, T.joint + 0.1 + i * 0.052, T.joint + 0.1 + i * 0.052 + 0.26);
          l.style.strokeDasharray = `${blen[i].toFixed(2)}`;
          l.style.strokeDashoffset = `${(blen[i] * (1 - p)).toFixed(2)}`;
          l.style.opacity = (p > 0 ? 1 : 0).toFixed(3);
        });
        const nJoints = Math.min(JOINTS.length, Math.max(0, Math.round((t - T.joint) / 0.052) + (t >= T.joint ? 1 : 0)));
        const rigLabel = t < T.rigDone ? `${t < T.joint ? 0 : nJoints} joints` : `${JOINTS.length} joints`;
        if (rnum.textContent !== rigLabel) rnum.textContent = rigLabel;
        rig.classList.toggle('is-rigged', t >= T.rigDone);

        // the prompt rows land, then each one types its own prompt in and reports what it is doing
        const li = outCubic(seg(t, T.list, T.list + 0.36));
        list.style.opacity = li.toFixed(3);
        list.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 10).toFixed(2)}px)`;
        rows.forEach((r, i) => {
          const n = streamCount(JOBS[i].prompt, T.type + i * 0.13, 46, t);
          if (r.n !== n) { r.n = n; r.vis.textContent = JOBS[i].prompt.slice(0, n); }
          const t0 = T.type + i * 0.13, typed = t >= t0 && n < JOBS[i].prompt.length;
          r.node.classList.toggle('is-typing', typed);
          const a = T.gen + i * 0.1, b = T.genDone + i * 0.05;
          const p = t < a ? 0 : t >= b ? 1 : (t - a) / (b - a);
          r.bar.style.transform = `scaleX(${p.toFixed(3)})`;
          const st = t < a ? 'queued' : p >= 1 ? 'done' : 'generating';
          if (r.last !== st) { r.last = st; r.st.textContent = st; r.node.classList.toggle('is-done', st === 'done'); }
        });

        // the generate button: down under the press, spinning while the clips generate, done after
        const busy = t >= T.gen && t < T.genDone;
        go.style.transform = `scale(${(1 - 0.06 * press(t, T.gen)).toFixed(4)})`;
        go.classList.toggle('is-done', t >= T.genDone);
        goT.textContent = t >= T.genDone ? 'Done' : busy ? 'Generating' : 'Generate';
        spin.style.opacity = (seg(t, T.gen, T.gen + 0.12) * (1 - seg(t, T.genDone - 0.12, T.genDone))).toFixed(3);
        spin.style.transform = `rotate(${(((t - T.gen) * 420) % 360).toFixed(1)}deg)`;

        // the transport: a scrubber over the shared 2.4 s clip timeline, a frame counter and the clip fps
        const scr = clamp((t - T.clip0) / DUR, 0, 1);
        const live = t >= T.clip0 && t < T.end && !document.body.classList.contains('freeze');
        tp.classList.toggle('is-live', live);
        tfill.style.transform = `scaleX(${scr.toFixed(4)})`;
        thead.style.left = `${(scr * 100).toFixed(2)}%`;
        const f = Math.min(FRAMES, Math.round(clamp(t - T.clip0, 0, DUR - 0.02) * FPS));
        if (f !== lastFrame) { lastFrame = f; fc.textContent = `f ${String(f).padStart(3, '0')} / ${FRAMES}`; }

        // the library: the four tiles land staggered, then every clip follows t like play.js
        lib.style.display = t >= T.lib ? 'grid' : 'none';
        lib.style.opacity = outCubic(seg(t, T.lib, T.lib + 0.3)).toFixed(3);
        ctiles.forEach((c, i) => {
          const a = outBack(seg(t, T.lib + i * 0.07, T.lib + i * 0.07 + 0.34));
          c.node.style.opacity = clamp(a).toFixed(3);
          c.node.style.transform = `translateY(${((1 - clamp(a)) * 12).toFixed(2)}px)`;
          c.bar.style.transform = `scaleX(${scr.toFixed(4)})`;
          const v = vids[i];
          const want = clamp(t - T.clip0, 0, DUR - 0.06);
          if (live) {
            if (v.paused) {
              const pr = v.play();
              if (pr && pr.catch) pr.catch((e) => console.error('motion.js: video.play() rejected', e));
            }
            if (Math.abs(v.currentTime - want) > DRIFT_TOL) v.currentTime = want;
          } else {
            if (!v.paused) v.pause();
            if (Math.abs(v.currentTime - want) > SEED_TOL) v.currentTime = want;
          }
        });

        // the line the beat is reporting, in the same streamed style as the other beats
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
      },
      // the pointer: it presses Generate once the four prompts have landed
      pointer(t) {
        if (t < T.gen - 0.6 || t > T.gen + 0.34) return null;
        const p = x.box(go);
        return { x: p.cx, y: p.cy, p: press(t, T.gen), v: inOutCubic(seg(t, T.gen - 0.6, T.gen - 0.36)) * (1 - seg(t, T.gen + 0.16, T.gen + 0.34)) };
      },
    };
  },
};