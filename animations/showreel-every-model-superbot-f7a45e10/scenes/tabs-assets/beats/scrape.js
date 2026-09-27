// Scrape beat: the routed model (DeepSeek V4 Flash) pulls type and colour references for both looks out of the post
// clip. Its line streams, the "Sweeping references" chip works, and the reference card rises. TYPE: four frames of
// the clip, two per reel (img/sr/ref-every.jpg, ref-motion.jpg, ref-loud.jpg, ref-beat.jpg, cut and described in
// img/sr/CREDITS.txt), land as type specimens. Each thumbnail is swept on by a mask wipe whose signal-orange scan edge
// trails a directional smear, its cap-height and baseline guides draw in (a keyframe diamond at the head of each), its
// own keyframe diamond sets, and its type label rises glyph by glyph out of a baseline mask. PALETTE: an eyedropper
// crosshair rides overshooting eases from thumbnail to thumbnail and samples six colours one by one; each click
// ripples, a drop of the colour arcs down into its swatch (stretched along its travel), the swatch fills with a small
// mask wipe and its hex rises in mono. The hexes are the BT.709 column of img/sr/CREDITS.txt PALETTE (the colours a
// browser shows for the video), and every sample point sits on a patch of that colour in its thumbnail.
// The chip resolves to "Swept 4 references".
// Pure function of t: every moving value (the crosshair, its trail, the drops included) is written from t and the
// layout, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, inOutCubic, press, streamCount, boxIn } from '../../../lib.js';

const SAY = 'Pulling type and color references for both looks.';
// [still, type label, reel, clip frame, [cap, base] guide heights as fractions of the still, alt]. The guides were
// measured on the stills: the EVERY caps (y 383-705 of the 640 px crop), the black MOTION on the orange band, the lime
// IT LOUD. (y 438-602 of the 900 px crop) and THE BEAT. under HIT
const REFS = [
  ['sr/ref-every.jpg', 'Heavy grotesk', 'Opus', 186, [0.219, 0.707], 'EVERY wordmark in black caps on signal orange, Claude Opus 5.5 reel'],
  ['sr/ref-motion.jpg', 'Repeat bands', 'Opus', 580, [0.414, 0.582], 'Bands of MOTION in cobalt, paper and orange, Claude Opus 5.5 reel'],
  ['sr/ref-loud.jpg', 'Two-tone caps', 'GPT', 1070, [0.41, 0.586], 'I MAKE in cream over IT LOUD. in acid lime on black, GPT 6 Astra reel'],
  ['sr/ref-beat.jpg', 'Poster caps', 'GPT', 1520, [0.457, 0.594], 'HIT THE BEAT. in black caps on cream, GPT 6 Astra reel'],
];
// [name, hex (CREDITS PALETTE, 709 column), still it is sampled from, sample point as fractions of that still, stamp
// colour]. Each point is where a 9 px patch of the still matches the hex: ink in the E, orange in the ground of EVERY,
// cobalt in a band and paper in that band's glyphs, lime in IT LOUD., cream in the ground above HIT
const SWATCHES = [
  ['ink', '#0c0b0e', 0, 0.18, 0.40, '#f2eee6'],
  ['orange', '#fc591f', 0, 0.555, 0.50, '#0c0b0e'],
  ['cobalt', '#3043fe', 1, 0.70, 0.30, '#f2eee6'],
  ['paper', '#f2eee6', 1, 0.58, 0.30, '#0c0b0e'],
  ['lime', '#c9fb1e', 2, 0.32, 0.566, '#0a0a08'],
  ['cream', '#eff0e4', 3, 0.80, 0.13, '#0a0a08'],
];

const SWEEP = 0.34;   // one thumbnail's mask wipe
const RISE = 0.28, STAG = 0.014, RISE_DY = 110;   // kinetic type: per glyph, out of the baseline mask (% of a glyph)
const DW = 0.025;     // the crosshair dwells this long either side of each click
const IN = 0.2;       // its glide in to the first sample point
const FLY = 0.16;     // a drop's arc from the sample point to its swatch
const WIPE = 0.16;    // the swatch's mask wipe
const FRAME = 1 / 60; // velocity for the trail and the drops' stretch: one 60 fps frame back
const bump = (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
const f2 = (v) => v.toFixed(2);

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.ref = REFS.map((_, i) => r + 0.28 + i * 0.08);
    T.pal = r + 0.5;
    T.find = SWATCHES.map((_, i) => r + 0.68 + i * 0.14);   // each click of the eyedropper
    T.land = T.find.map((f) => f + 0.02 + FLY);             // each drop lands and its swatch starts to fill
    T.done = T.land[SWATCHES.length - 1] + WIPE;            // the last swatch is full: Swept 4 references
    T.end = T.done + 0.18;                                   // r + 1.9, the beat's length before the retheme

    return T;
  },
  build(k, x) {
    const T = k.T;
    // kinetic type: one span per glyph, one clipping span per word (its bottom edge is the baseline mask)
    const kin = (s) => s.split(' ').map((w) => `<span class="sc-w">${[...w].map((g) => `<span class="sc-g">${x.esc(g)}</span>`).join('')}</span>`).join(' ');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Sweeping references</span><b class="sc-count">0/${SWATCHES.length} colors</b></div></div>`);
    const CROSS = 'M0 -13V-7.4M0 7.4V13M-13 0H-7.4M7.4 0H13';
    const card = x.el(`<div class="sc-card">
      <div class="sc-hd"><b>TYPE</b><small>${REFS.length} frames, @shneural</small></div>
      <div class="sc-refs">${REFS.map(([src, label, reel, f, gd, alt]) => `<div class="sc-ref">
        <span class="sc-th"><img src="${x.img(src)}" alt="${x.esc(alt)}"/>${gd.map((y) => `<span class="sc-gd" style="top:${(y * 100).toFixed(1)}%"><i></i><b></b></span>`).join('')}<i class="sc-scan"></i></span>
        <span class="sc-lb">${kin(label)}</span>
        <span class="sc-mt"><i class="sc-kd"></i>${x.esc(reel)} <b>f${f}</b></span>
      </div>`).join('')}</div>
      <div class="sc-hd sc-ph"><b>PALETTE</b><small>${SWATCHES.length} swatches, BT.709</small></div>
      <div class="sc-pal">${SWATCHES.map(([name, hex, , , , ink]) => `<div class="sc-pc"><span class="sc-sw"><span class="sc-fill" style="background:${hex}"><em style="color:${ink}">${x.esc(name)}</em></span><i class="sc-edge"></i></span><span class="sc-hex">${kin(hex)}</span></div>`).join('')}</div>
      <div class="sc-ov" aria-hidden="true">
        <i class="sc-trail"></i>
        ${SWATCHES.map(([, hex]) => `<i class="sc-rip" style="border-color:${hex}"></i>`).join('')}
        ${SWATCHES.map(([, hex]) => `<i class="sc-drop" style="background:${hex}"></i>`).join('')}
        <svg class="sc-eye" viewBox="-14 -14 28 28"><g class="sc-eye-o"><path d="${CROSS}"/><circle r="6"/></g><circle class="sc-eye-l" r="4.7"/><circle class="sc-eye-c" r="1"/><g class="sc-eye-s"><path d="${CROSS}"/><circle r="6"/></g></svg>
      </div>
    </div>`);

    const refs = [...card.querySelectorAll('.sc-ref')].map((n) => ({
      n, th: n.querySelector('.sc-th'), img: n.querySelector('img'), scan: n.querySelector('.sc-scan'),
      gd: [...n.querySelectorAll('.sc-gd')].map((g) => ({ line: g.firstElementChild, dia: g.lastElementChild })),
      gl: [...n.querySelectorAll('.sc-lb .sc-g')], mt: n.querySelector('.sc-mt'), kd: n.querySelector('.sc-kd'),
    }));
    const hds = [...card.querySelectorAll('.sc-hd')];
    const pcs = [...card.querySelectorAll('.sc-pc')].map((n) => ({
      n, sw: n.querySelector('.sc-sw'), fill: n.querySelector('.sc-fill'), edge: n.querySelector('.sc-edge'),
      gl: [...n.querySelectorAll('.sc-hex .sc-g')],
    }));
    const rips = [...card.querySelectorAll('.sc-rip')];
    const drops = [...card.querySelectorAll('.sc-drop')];
    const eye = card.querySelector('.sc-eye'), loupe = eye.querySelector('.sc-eye-l'), dot = eye.querySelector('.sc-eye-c');
    const trail = card.querySelector('.sc-trail');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${f2((1 - e) * dy)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    // glyph i of a kinetic line rises from a + i * stag over dur on outBack, so it carries just past its baseline
    const kinetic = (gl, t, a, stag = STAG, dur = RISE) => gl.forEach((g, i) => {
      const q = seg(t, a + i * stag, a + i * stag + dur);
      g.style.transform = q >= 1 ? '' : `translateY(${f2((1 - outBack(q)) * RISE_DY)}%)`;
    });
    let shown = -1;

    // the crosshair's path through the six sample points: it glides in from below right, then between clicks it rides
    // outBack (overshooting each point a little and settling onto it), dwelling DW either side of every click
    const eyeAt = (t, P) => {
      const S = { x: P[0].x + 42, y: P[0].y + 36 };
      const keys = [[T.find[0] - IN, S]];
      T.find.forEach((f, j) => keys.push([f - DW, P[j]], [f + DW, P[j]]));
      if (t <= keys[0][0]) return S;
      for (let i = 1; i < keys.length; i++) {
        const [ta, a] = keys[i - 1], [tb, b] = keys[i];
        if (t <= tb) { const e = outBack(seg(t, ta, tb)); return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) }; }
      }
      return P[P.length - 1];
    };

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: its graph editor works while the colours are sampled (chat.js reads this rotation), the count
        // climbs as each swatch lands, then the check and "Swept 4 references"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Swept ${REFS.length} references` : 'Sweeping references');
        const landed = T.land.filter((l) => t >= l).length;
        set(ccount, done ? `${SWATCHES.length} colors` : `${landed}/${SWATCHES.length} colors`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);
        rise(hds[0], seg(t, T.card + 0.04, T.card + 0.3), 4);

        // TYPE: each specimen lands, is swept on, draws its guides, sets its keyframe and sets its label
        refs.forEach((m, i) => {
          const a = T.ref[i];
          rise(m.n, seg(t, a, a + 0.24), 6);
          const q = seg(t, a + 0.04, a + 0.04 + SWEEP), e = outCubic(q);
          m.img.style.clipPath = e >= 1 ? 'none' : `inset(0 ${f2((1 - e) * 100)}% 0 0)`;
          // the scan edge sits on the wipe; its smear trails left, longest while the wipe is fastest
          const w = 3 + 26 * (1 - q) * (1 - q);
          m.scan.style.opacity = q > 0 && q < 1 ? '1' : '0';
          m.scan.style.width = `${f2(w)}px`;
          m.scan.style.left = `calc(${f2(e * 100)}% - ${f2(w)}px)`;
          const set0 = a + 0.04 + SWEEP;
          m.gd.forEach((g, j) => {
            const p = seg(t, set0 - 0.1 + j * 0.05, set0 + 0.12 + j * 0.05);
            g.line.style.transform = `scaleX(${outCubic(p).toFixed(4)})`;
            g.dia.style.transform = `rotate(45deg) scale(${Math.max(0, outBack(p)).toFixed(4)})`;
            g.line.parentNode.style.opacity = p > 0 ? '1' : '0';
          });
          kinetic(m.gl, t, a + 0.14);
          m.mt.style.opacity = outCubic(seg(t, a + 0.2, a + 0.36)).toFixed(3);
          m.kd.classList.toggle('on', t >= set0);
          m.kd.style.transform = `rotate(45deg) scale(${(1 + 0.6 * bump(seg(t, set0, set0 + 0.2))).toFixed(4)})`;
          // the thumbnail being sampled carries a paper ring while the crosshair works on it
          m.th.classList.toggle('act', SWATCHES.some(([, , src], j) => src === i && Math.abs(t - T.find[j]) < 0.07));
        });

        // PALETTE: the header and the six empty slots land under the sweep
        rise(hds[1], seg(t, T.pal, T.pal + 0.24), 4);
        pcs.forEach((c, j) => {
          rise(c.n, seg(t, T.pal + 0.03 * j, T.pal + 0.03 * j + 0.24), 5);
          const l = T.land[j], e = outCubic(seg(t, l, l + WIPE));
          c.fill.style.clipPath = e >= 1 ? 'none' : `inset(0 ${f2((1 - e) * 100)}% 0 0)`;
          c.edge.style.opacity = e > 0 && e < 1 ? '1' : '0';
          c.edge.style.left = `${f2(e * 100)}%`;
          const pop = 1 + 0.05 * bump(seg(t, l, l + 0.24));
          c.sw.style.transform = pop === 1 ? '' : `scale(${pop.toFixed(4)})`;
          kinetic(c.gl, t, l + 0.03, 0.01, 0.22);
        });

        // the eyedropper, in the card's px: sample points on the thumbnails, drop targets on the swatches (both read
        // from this frame's layout, so the path stays a function of t)
        // outside [vis0, T.done) the crosshair, its ripples and the drops are all spent (the last ripple and the
        // crosshair's exit end before the last swatch is full), so nothing reads layout there
        const vis0 = T.find[0] - IN, out0 = T.find[SWATCHES.length - 1] + 0.12;
        if (t < vis0 || t >= T.done) {
          eye.style.opacity = '0'; trail.style.opacity = '0';
          rips.forEach((rp) => { rp.style.opacity = '0'; });
          drops.forEach((d) => { d.style.opacity = '0'; });
          return;
        }
        const tb = refs.map((m) => boxIn(m.th, card));
        const P = SWATCHES.map(([, , i, fx, fy]) => ({ x: tb[i].x + fx * tb[i].w, y: tb[i].y + fy * tb[i].h }));
        const p = eyeAt(t, P), p1 = eyeAt(t - FRAME, P);
        const vx = p.x - p1.x, vy = p.y - p1.y, sp = Math.hypot(vx, vy);
        const clicks = T.find.reduce((s, f) => s + press(t, f, 0.03, 0.02, 0.08), 0);
        const s = (0.55 + 0.45 * outBack(seg(t, vis0, vis0 + 0.2))) * (1 - 0.18 * Math.min(1, clicks)) * lerp(1, 0.6, seg(t, out0, out0 + 0.18));
        const vEye = seg(t, vis0, vis0 + 0.08) * (1 - seg(t, out0, out0 + 0.18));
        eye.style.opacity = vEye.toFixed(3);
        eye.style.transform = `translate(${f2(p.x - 14)}px, ${f2(p.y - 14)}px) scale(${s.toFixed(4)})`;
        // the loupe holds the last colour sampled
        const got = T.find.filter((f) => t >= f).length;
        loupe.style.fill = got ? SWATCHES[got - 1][1] : 'none';
        dot.style.opacity = got ? '0' : '1';
        // directional motion blur: a smear behind the crosshair along its travel, as long as one frame's travel
        const tw = Math.min(46, sp * 1.7);
        trail.style.opacity = tw > 1.5 ? (vEye * Math.min(0.85, sp / 7)).toFixed(3) : '0';
        trail.style.width = `${f2(tw)}px`;
        trail.style.transform = `translate(${f2(p.x - tw)}px, ${f2(p.y - 1.5)}px) rotate(${f2(Math.atan2(vy, vx) * 180 / Math.PI)}deg)`;

        SWATCHES.forEach(([, hex], j) => {
          // the click's ripple, in the sampled colour
          const rq = seg(t, T.find[j], T.find[j] + 0.32);
          rips[j].style.opacity = rq > 0 && rq < 1 ? (0.95 * (1 - rq)).toFixed(3) : '0';
          rips[j].style.transform = `translate(${f2(P[j].x - 10)}px, ${f2(P[j].y - 10)}px) scale(${(0.35 + 1.25 * outCubic(rq)).toFixed(4)})`;
          // the drop: an arc from the sample point up and over into its swatch, stretched along its velocity
          const a0 = T.find[j] + 0.02, l = T.land[j];
          const d = drops[j];
          if (t < a0 || t >= l + 0.07) { d.style.opacity = '0'; return; }
          const B = boxIn(pcs[j].sw, card), A = P[j];
          const C = { x: lerp(A.x, B.cx, 0.5), y: Math.min(A.y, B.cy) - 18 };
          const bz = (u) => { const v = 1 - u; return { x: v * v * A.x + 2 * v * u * C.x + u * u * B.cx, y: v * v * A.y + 2 * v * u * C.y + u * u * B.cy }; };
          const q = seg(t, a0, l), at = bz(inOutCubic(q)), bt = bz(inOutCubic(seg(t - FRAME, a0, l)));
          const dx = at.x - bt.x, dy = at.y - bt.y, st = 1 + Math.min(0.9, Math.hypot(dx, dy) * 0.1);
          const ds = q < 0.25 ? lerp(0.4, 1, outCubic(q / 0.25)) : lerp(1, 0.75, seg(q, 0.6, 1));
          d.style.opacity = (1 - seg(t, l, l + 0.07)).toFixed(3);
          d.style.transform = `translate(${f2(at.x - 5)}px, ${f2(at.y - 5)}px) rotate(${f2(Math.atan2(dy, dx) * 180 / Math.PI)}deg) scale(${(ds * st).toFixed(4)}, ${(ds / Math.sqrt(st)).toFixed(4)})`;
        });
      },
    };
  },
};
