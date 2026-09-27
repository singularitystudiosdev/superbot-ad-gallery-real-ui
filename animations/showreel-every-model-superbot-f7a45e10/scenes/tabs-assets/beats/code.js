// Code beat: the routed model (Claude Opus 5.5) writes the showreel itself as code. An editor tab, reel.ts, streams
// fourteen syntax-highlighted lines on the standard Web Animations API (element.animate(keyframes, { duration,
// easing, fill })) that key the shots of the Opus reel in the clip: the orange dot, EVERY rising out of its baseline,
// the dot grid squaring off into a pixel grid, the cube field flipping, the MOTION bands wiping on, and the CLAUDE.
// end card. Beside it a GRAPH EDITOR draws the cubic-bezier of the line being typed: keyframe diamonds on the
// anchors, tangent handles, a dot riding the curve (with a short motion-blur trail) in sync with a ruler playhead,
// and a live value readout. When the typed easing changes the curve re-shapes on an eased, slightly overshooting
// morph and the value axis auto-fits so an overshoot ease stays in frame. The header's six keyframe diamonds light as
// each shot line lands. Only ?v=3 routes through this beat (chat.js passes set 'world'). Pure function of t (the tab
// scene's local time) so ?t= freezes a frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount, blink } from '../../../lib.js';

// The eases the file defines. snap is the brief's 'cubic-bezier(0.7, 0, 0.2, 1)'; pop overshoots past 1; glide is a
// long ease-out. linear is what the graph shows before the first easing is typed.
const EASES = {
  linear: [0, 0, 1, 1],
  snap: [0.7, 0, 0.2, 1],
  pop: [0.34, 1.56, 0.64, 1],
  glide: [0.16, 1, 0.3, 1],
};

const f2 = (v) => { const s = v.toFixed(2); return s === '-0.00' ? '0.00' : s; };
const f0 = (v) => { const s = v.toFixed(0); return s === '-0' ? '0' : s; };

// A line may set the graph: `ease` names its easing and `tok` is the text whose last character, once typed, makes the
// graph switch to it (the easing literal, the ease name, or the closing `);` of a shot that takes the default snap).
// A shot line also carries its duration and the property readout its keyframes drive. Every line fits 66 columns so
// nothing is clipped in the code pane. The first line quotes the Opus reel's own end card.
const SETS = {
  world: {
    say: 'Writing the reel as code, every frame keyed.',
    file: 'reel.ts',
    lines: [
      { s: '// every frame of this reel is code' },
      { s: "const snap = 'cubic-bezier(0.7, 0, 0.2, 1)';", ease: 'snap', tok: "1)'", pace: 'ease' },
      { s: "const pop = 'cubic-bezier(0.34, 1.56, 0.64, 1)';", ease: 'pop', tok: "1)'", pace: 'ease' },
      { s: "const glide = 'cubic-bezier(0.16, 1, 0.3, 1)';", ease: 'glide', tok: "1)'", pace: 'ease' },
      { s: 'const key = (el: Element, kf: PropertyIndexedKeyframes,' },
      { s: '  ms: number, easing = snap) =>', ease: 'snap', tok: 'snap' },
      { s: "  el.animate(kf, { duration: ms, easing, fill: 'forwards' });" },
      { s: 'const [dot, every, grid, cubes, motion, claude] = reel.children;' },
      { s: 'key(dot, { scale: [0, 1] }, 420, pop);', ease: 'pop', tok: 'pop', ms: 420, shot: 1, pv: 'dot',
        rd: (e) => [['scale', f2(e)]] },
      { s: "key(every, { translate: ['0 110%', '0'] }, 600, glide);", ease: 'glide', tok: 'glide', ms: 600, shot: 1, pv: 'every',
        rd: (e) => [['translate', `0 ${f0(lerp(110, 0, e))}%`]] },
      { s: "key(grid, { borderRadius: ['50%', '0'] }, 800);", ease: 'snap', tok: ');', ms: 800, shot: 1, pv: 'grid',
        rd: (e) => [['border-radius', `${f0(lerp(50, 0, e))}%`]] },
      { s: "key(cubes, { rotate: ['y -90deg', 'y 0deg'] }, 1200, pop);", ease: 'pop', tok: 'pop', ms: 1200, shot: 1, pv: 'cubes',
        rd: (e) => [['rotate', `y ${f0(lerp(-90, 0, e))}deg`]] },
      { s: "key(motion, { clipPath: ['inset(0 100% 0 0)', 'inset(0)'] }, 500);", ease: 'snap', tok: ');', ms: 500, shot: 1, pv: 'motion',
        rd: (e) => [['clip-path', `inset(0 ${f0(lerp(100, 0, e))}% 0 0)`]] },
      { s: 'key(claude, { opacity: [0, 1], scale: [0.92, 1] }, 700, pop);', ease: 'pop', tok: 'pop', ms: 700, shot: 1, pv: 'claude',
        rd: (e) => [['opacity', f2(clamp(e))], ['scale', lerp(0.92, 1, e).toFixed(3)]] },
    ],
  },
};
const set = (opts) => SETS[(opts && opts.set) || 'world'] || SETS.world;

// Pacing, in [characters per second, pause after the line]: the plumbing streams past, each easing definition and
// each shot gets a beat so the graph editor can re-shape and the preview can play it before the next line lands.
const PACE = { plain: [1000, 0.02], ease: [900, 0.09], shot: [650, 0.1] };
const pace = (l) => PACE[l.pace || (l.shot ? 'shot' : 'plain')];
const MORPH = 0.13;   // the curve re-shaping to a newly typed easing
const HOLD = 0.1;     // the dot resting on the last keyframe before the preview loops
const TRAIL = 0.011;  // seconds between motion-blur ghosts behind the dot

// syntax highlighting: one pass of a small TypeScript tokenizer, each token wrapped in a class
const KW = new Set(['const']);
const TY = new Set(['Element', 'PropertyIndexedKeyframes', 'number']);
const EZ = new Set(['snap', 'pop', 'glide']);
const FN = new Set(['key', 'animate']);
const RX = /(\/\/.*$)|('[^']*')|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)|(=>|=)|(\s+)|(\S)/g;
function highlight(s, esc) {
  let out = '', m;
  RX.lastIndex = 0;
  while ((m = RX.exec(s))) {
    const [w, cm, st, nu, id, op, ws] = m;
    if (ws) { out += w; continue; }
    let c = 'pu';
    if (cm) c = 'cm';
    else if (st) c = 'st';
    else if (nu) c = 'nu';
    else if (op) c = 'op';
    else if (id) {
      const rest = s.slice(RX.lastIndex);
      c = KW.has(id) ? 'kw' : TY.has(id) ? 'ty' : EZ.has(id) ? 'ez' : FN.has(id) ? 'fn' : /^\s*:/.test(rest) ? 'pr' : 'id';
    }
    out += `<span class="c-${c}">${esc(w)}</span>`;
  }
  return out;
}

// cubic-bezier math on control points [x1, y1, x2, y2] with anchors (0,0) and (1,1)
const bz = (a, b, s) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
const solveS = (cp, u) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (bz(cp[0], cp[2], m) < u) lo = m; else hi = m; }
  return (lo + hi) / 2;
};
const mix = (a, b, f) => a.map((v, i) => lerp(v, b[i], f));

// the plot inside the graph editor's SVG (viewBox 0 0 200 131): value axis on the left, ruler underneath
const PX0 = 16, PX1 = 192, PY0 = 106, PY1 = 9, RY = 120;
// the preview strip under the ruler plays the current line on the same eased value as the dot (one CSS var, --v):
// the clip's shots for the key() lines, a plain travelling square for the lines that only define an easing
const PV = ['ease', 'dot', 'every', 'grid', 'cubes', 'motion', 'claude'];
const GRID_TINT = ['', '', 'o', '', '', 'b', '', '', '', 'o', '', '', 'b', '', ''];
const CUBE_TINT = ['', 'o', '', 'b', '', '', 'o', '', 'b', ''];

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;
    T.code = r + 0.36;
    let c = T.code;
    T.cps = S.lines.map((L) => pace(L)[0]);
    T.ln = S.lines.map((L) => { const a = c, [cps, gap] = pace(L); c += L.s.length / cps + gap; return a; });
    T.lnEnd = S.lines.map((L, i) => T.ln[i] + L.s.length / T.cps[i]);
    T.typed = T.lnEnd[S.lines.length - 1];           // the last character lands
    T.done = Math.max(r + 2.05, T.typed + 0.1);      // the chip resolves: Wrote reel.ts
    T.end = r + 2.45;
    // the graph's switch points: linear while the card rises, then each typed easing as its token lands
    T.ev = [{ t: T.card + 0.08, ease: 'linear', ln: -1 }];
    S.lines.forEach((L, i) => {
      if (!L.ease) return;
      const at = L.s.lastIndexOf(L.tok) + L.tok.length;
      T.ev.push({ t: T.ln[i] + at / T.cps[i], ease: L.ease, ln: i });
    });
    return T;
  },

  build(k, x) {
    const S = set(k.opts);
    const T = k.T;
    const L = S.lines;
    const EV = T.ev.map((e) => {
      const line = e.ln >= 0 ? L[e.ln] : null;
      const ms = line && line.ms;
      return { ...e, cp: EASES[e.ease], ms, rd: line && line.rd, pv: (line && line.pv) || 'ease', sweep: ms ? 0.14 + (ms / 1000) * 0.1 : 0.22 };
    });
    // where each morph starts: the curve as it was displayed at the moment its easing landed (a fold, still pure)
    EV[0].from = EV[0].cp;
    for (let i = 1; i < EV.length; i++) {
      EV[i].from = mix(EV[i - 1].from, EV[i - 1].cp, outBack(seg(EV[i].t, EV[i - 1].t, EV[i - 1].t + MORPH)));
    }
    const shots = L.map((l, i) => (l.shot ? i : -1)).filter((i) => i >= 0);

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${x.esc(S.file)}</span><b class="code-count">0 lines</b></div></div>`);
    const grid = [0.25, 0.5, 0.75, 1].map((u) => `M${lerp(PX0, PX1, u).toFixed(1)} ${PY1 - 4}V${PY0 + 4}`).join('');
    const ticks = Array.from({ length: 11 }, (_, i) => {
      const X = lerp(PX0, PX1, i / 10).toFixed(1);
      return `M${X} ${RY + 3}v${i % 5 ? 3 : 6}`;
    }).join('');
    const card = x.el(`<div class="rc-card">
      <div class="rc-top">
        <span class="rc-tab"><i class="rc-ts">TS</i><span class="rc-fn">${x.esc(S.file)}</span><i class="rc-mod"></i></span>
        <span class="rc-keys"><span class="rc-kl">keys</span>${shots.map(() => '<i class="rc-kd"></i>').join('')}</span>
      </div>
      <div class="rc-body">
        <div class="rc-code">${L.map((l, i) => `<div class="rc-ln"><span class="rc-g">${i + 1}</span><span class="rc-tx"><span class="rc-in">${highlight(l.s, x.esc)}</span></span><i class="rc-car"></i></div>`).join('')}</div>
        <div class="rc-graph">
          <div class="gl-hd"><span class="gl-ti">Graph Editor</span><b class="gl-ez">linear</b></div>
          <svg class="gl-svg" viewBox="0 0 200 131" aria-hidden="true">
            <path class="gl-grid" d="${grid}"/>
            <path class="gl-ax" d=""/>
            <text class="gl-yl gl-y0" x="${PX0 - 4}" y="0" text-anchor="end">0</text>
            <text class="gl-yl gl-y1" x="${PX0 - 4}" y="0" text-anchor="end">1</text>
            <path class="gl-vg" d=""/>
            <path class="gl-hl" d=""/>
            <path class="gl-cv" d=""/>
            <path class="gl-on" d=""/>
            <path class="gl-an" d=""/>
            <circle class="gl-kn" r="2.9"/><circle class="gl-kn" r="2.9"/>
            <path class="gl-rl" d="M${PX0} ${RY + 3}H${PX1}${ticks}"/>
            <path class="gl-rd gl-rd0" d=""/><path class="gl-rd gl-rd1" d=""/>
            <path class="gl-ph" d=""/>
            <circle class="gl-gh" r="3.3"/><circle class="gl-gh" r="3.3"/><circle class="gl-gh" r="3.3"/><circle class="gl-gh" r="3.3"/>
            <circle class="gl-halo" r="7.5"/><circle class="gl-dot" r="3.5"/>
          </svg>
          <div class="gl-pv">
            <div class="pv pv-ease"><i class="pv-trk"></i><i class="pv-sq"></i></div>
            <div class="pv pv-dot"><i class="pv-base"></i><i class="pv-ball"></i></div>
            <div class="pv pv-every"><b>EVERY</b></div>
            <div class="pv pv-grid">${GRID_TINT.map((c) => `<i class="${c}"></i>`).join('')}</div>
            <div class="pv pv-cubes">${CUBE_TINT.map((c) => `<i class="${c}"></i>`).join('')}</div>
            <div class="pv pv-motion"><div class="pv-wipe"><span class="pv-mb">MOTION MOTION MOTION MOTION</span><span class="pv-mo">MOTION</span><span class="pv-mw">MOTION MOTION MOTION MOTION</span></div></div>
            <div class="pv pv-claude"><b><span>CLAUDE<span class="pv-p">.</span></span></b></div>
          </div>
          <div class="gl-cb"></div>
          <div class="gl-rd-row"><span class="gl-val"></span><span class="gl-ms"></span></div>
        </div>
      </div>
      <div class="rc-st"><span class="rc-pos">Ln 1, Col 1</span><span class="rc-lang">TypeScript</span></div>
    </div>`);

    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const lnEls = [...card.querySelectorAll('.rc-ln')].map((n) => ({ n, g: n.querySelector('.rc-g'), tx: n.querySelector('.rc-tx'), car: n.querySelector('.rc-car'), w: -1, on: null, cur: null }));
    const kds = [...card.querySelectorAll('.rc-kd')];
    const mod = card.querySelector('.rc-mod');
    const pos = card.querySelector('.rc-pos');
    const q = (s) => card.querySelector(s);
    const ez = q('.gl-ez'), ax = q('.gl-ax'), y0 = q('.gl-y0'), y1 = q('.gl-y1'), vg = q('.gl-vg'), hl = q('.gl-hl');
    const cv = q('.gl-cv'), on = q('.gl-on'), an = q('.gl-an'), kn = [...card.querySelectorAll('.gl-kn')];
    const rd0 = q('.gl-rd0'), rd1 = q('.gl-rd1'), ph = q('.gl-ph'), gh = [...card.querySelectorAll('.gl-gh')];
    const halo = q('.gl-halo'), dot = q('.gl-dot'), cb = q('.gl-cb'), val = q('.gl-val'), msEl = q('.gl-ms');
    const pvBox = q('.gl-pv'), pvs = Object.fromEntries(PV.map((k) => [k, q(`.pv-${k}`)]));
    let pvOn = null;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    const setHTML = (n, s) => { if (n.__h !== s) { n.innerHTML = s; n.__h = s; } };
    const setD = (n, d) => { if (n.__d !== d) { n.setAttribute('d', d); n.__d = d; } };
    const at = (n, cx, cy) => { n.setAttribute('cx', cx.toFixed(2)); n.setAttribute('cy', cy.toFixed(2)); };
    const diamond = (X, Y, r) => `M${X.toFixed(2)} ${(Y - r).toFixed(2)}L${(X + r).toFixed(2)} ${Y.toFixed(2)}L${X.toFixed(2)} ${(Y + r).toFixed(2)}L${(X - r).toFixed(2)} ${Y.toFixed(2)}Z`;
    let shown = -1;

    // the event in force at time t, the curve as displayed, and the preview's progress u along the time axis
    const evAt = (t) => { let j = 0; for (let i = 0; i < EV.length; i++) if (t >= EV[i].t) j = i; return j; };
    const cpAt = (j, t) => mix(EV[j].from, EV[j].cp, outBack(seg(t, EV[j].t, EV[j].t + MORPH)));
    // the preview loops while the file is being written; the last easing plays once and rests on its keyframe
    const uAt = (j, t) => {
      const e = EV[j], d = t - e.t, P = e.sweep + HOLD;
      if (d < 0) return { u: 0, loop: -1 };
      if (j === EV.length - 1) return { u: clamp(d / e.sweep), loop: 0 };
      return { u: clamp((d % P) / e.sweep), loop: Math.floor(d / P) };
    };

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the tool chip: spinner, Writing reel.ts, and a count of the lines on the page
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        setText(clab, done ? `Wrote ${S.file}` : `Writing ${S.file}`);
        let started = 0;
        for (let i = 0; i < L.length; i++) if (t >= T.ln[i]) started = i + 1;
        setText(ccount, `${started} ${started === 1 ? 'line' : 'lines'}`);

        rise(card, seg(t, T.card, T.card + 0.42), 14);

        // the editor: each line reveals by column (mono, so a width in ch is exactly N characters); the caret rides
        // the line being written and blinks once the file is done
        let cur = 0, col = 0;
        for (let i = 0; i < L.length; i++) {
          const m = lnEls[i];
          const c = streamCount(L[i].s, T.ln[i], T.cps[i], t);
          if (c !== m.w) { m.tx.style.width = `${c}ch`; m.w = c; }
          const live = t >= T.ln[i];
          if (live !== m.on) { m.g.classList.toggle('on', live); m.on = live; }
          if (live) { cur = i; col = c; }
        }
        for (let i = 0; i < L.length; i++) {
          const m = lnEls[i], isCur = i === cur;
          if (isCur !== m.cur) { m.n.classList.toggle('cur', isCur); m.cur = isCur; }
          m.car.style.opacity = isCur && t >= T.card && (t < T.typed + 0.12 || blink(t - T.typed)) ? '1' : '0';
        }
        setText(pos, `Ln ${cur + 1}, Col ${col + 1}`);
        mod.style.opacity = (1 - seg(t, T.done, T.done + 0.2)).toFixed(3);

        // the header's keyframe diamonds: one per shot, each popping lit as its key() line lands
        shots.forEach((li, s) => {
          const p = seg(t, T.lnEnd[li], T.lnEnd[li] + 0.2);
          kds[s].classList.toggle('on', p > 0);
          kds[s].style.transform = `rotate(45deg) scale(${(p > 0 ? 0.55 + 0.45 * outBack(p) : 1).toFixed(3)})`;
        });

        // the graph editor
        const j = evAt(t), E = EV[j];
        const cp = cpAt(j, t);
        const lo = Math.min(0, cp[1], cp[3]) - 0.1, hi = Math.max(1, cp[1], cp[3]) + 0.1;
        const X = (u) => lerp(PX0, PX1, u);
        const Y = (v) => PY0 - ((v - lo) / (hi - lo)) * (PY0 - PY1);
        const P0 = [X(0), Y(0)], P1 = [X(cp[0]), Y(cp[1])], P2 = [X(cp[2]), Y(cp[3])], P3 = [X(1), Y(1)];
        const pt = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
        setText(ez, E.ease);
        setD(ax, `M${PX0} ${Y(0).toFixed(2)}H${PX1}M${PX0} ${Y(1).toFixed(2)}H${PX1}`);
        y0.setAttribute('y', (Y(0) + 2.6).toFixed(2));
        y1.setAttribute('y', (Y(1) + 2.6).toFixed(2));
        setD(hl, `M${pt(P0)}L${pt(P1)}M${pt(P3)}L${pt(P2)}`);
        setD(cv, `M${pt(P0)}C${pt(P1)} ${pt(P2)} ${pt(P3)}`);
        setD(an, diamond(P0[0], P0[1], 3.4) + diamond(P3[0], P3[1], 3.4));
        at(kn[0], P1[0], P1[1]); at(kn[1], P2[0], P2[1]);

        const { u, loop } = uAt(j, t);
        const s = solveS(cp, u);
        const v = bz(cp[1], cp[3], s);
        const D = [X(u), Y(v)];
        // the traversed stretch of the curve: de Casteljau split at s
        const L1 = (a, b) => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];
        const Q0 = L1(P0, P1), Q1 = L1(P1, P2), Q2 = L1(P2, P3), R0 = L1(Q0, Q1), R1 = L1(Q1, Q2), Sp = L1(R0, R1);
        setD(on, u > 0 ? `M${pt(P0)}C${pt(Q0)} ${pt(R0)} ${pt(Sp)}` : '');
        setD(vg, `M${PX0} ${D[1].toFixed(2)}H${D[0].toFixed(2)}`);
        at(dot, D[0], D[1]); at(halo, D[0], D[1]);
        // directional motion blur: the dot where it was a few hundredths of a second ago, fading
        gh.forEach((g, k) => {
          const tp = t - (k + 1) * TRAIL;
          const b = uAt(j, tp);
          if (tp < E.t || b.loop !== loop) { at(g, D[0], D[1]); g.style.opacity = '0'; return; }
          const cg = cpAt(j, tp), sb = solveS(cg, b.u), vb = bz(cg[1], cg[3], sb);
          at(g, X(b.u), Y(vb));
          g.style.opacity = (0.34 / (k + 1.2)).toFixed(3);
        });
        // the ruler: keyframe diamonds at both ends, lit once the playhead reaches them, and the playhead itself
        setD(rd0, diamond(X(0), RY - 2, 3.2));
        setD(rd1, diamond(X(1), RY - 2, 3.2));
        rd0.classList.toggle('on', t >= E.t);
        rd1.classList.toggle('on', u >= 0.999);
        setD(ph, `M${D[0].toFixed(2)} ${PY1 - 4}V${RY + 9}M${(D[0] - 2.6).toFixed(2)} ${RY - 7}h5.2v3l-2.6 2.6l-2.6 -2.6Z`);

        // the preview strip: the current shot, driven by the same eased value the dot is riding
        if (pvOn !== E.pv) { PV.forEach((k) => pvs[k].classList.toggle('on', k === E.pv)); pvOn = E.pv; }
        pvBox.style.setProperty('--v', v.toFixed(4));

        setText(cb, `cubic-bezier(${cp.map(f2).join(', ')})`);
        const pairs = E.rd ? E.rd(v) : [['progress', f2(v)]];
        setHTML(val, pairs.map(([a, b]) => `<span>${a}</span> <b>${b}</b>`).join(' '));
        setText(msEl, E.ms ? `${f0(u * E.ms)}/${E.ms}ms` : `t ${f2(u)}`);
      },
    };
  },
};
