// Results beat: the end of the Turf War round, three screens in one card. The line streams, the "Writing match.ts"
// chip lands and spins, and then the card steps through: the PAUSED menu over the capture's own pause frame, the
// JUDGING turf bar sliding out of the centre, then the VICTORY! plaque over the real victory frame with the
// scoreboard, the XP counter and REMATCH / MAIN MENU. Imagery only from img/ink/ (the real paused, judging and
// victory screenshots); every moving value is written from t, so ?t= freezes the frame.
import { lerp, seg, outCubic, outBack, rand, streamCount } from '../../../lib.js';

const SAY = 'Back to me for the match flow.';
const RUN = 'Writing match.ts';
const DONE = 'match.ts written';

// the real results table from img/ink/victory.jpg: name, turf points, splats, deaths (Clawd carries YOU)
const LIME = [['Kelp', 1777, 10, 6, 0], ['Coral', 1003, 2, 8, 0], ['Clawd', 1022, 5, 4, 1], ['Bubbles', 767, 8, 5, 0]];
const MAG = [['Loop', 1371, 10, 6], ['Squiddo', 1222, 3, 7], ['Juno', 862, 7, 6], ['Suki', 658, 3, 6]];
const LP = 48.2;      // Lime turf per cent on the victory frame
const MP = 35.2;      // Magenta turf per cent on the same frame
const XP = 2422;      // XP the tally finishes on at the end of the capture
const TURF = 1022;    // Clawd's turf, the "TURF +1,022" line on the results screen
const LV = 'Lv 4';
const num = (n) => Math.round(n).toLocaleString('en-US');

// the pause menu rows and their icons (UI chrome only, drawn here)
const ICON = {
  play: '<svg class="mr-ic f" viewBox="0 0 24 24"><path d="M7 4.5l13 7.5-13 7.5z"/></svg>',
  gear: '<svg class="mr-ic" viewBox="0 0 24 24"><path d="M3.5 7h17M3.5 12h17M3.5 17h17"/><circle cx="9" cy="7" r="2.2"/><circle cx="15" cy="12" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>',
  q: '<svg class="mr-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><path d="M9.4 9.6a2.7 2.7 0 1 1 3.4 2.6c-.7.25-1.1.72-1.1 1.4v.5"/><circle class="dot" cx="11.8" cy="16.6" r="1.05"/></svg>',
  x: '<svg class="mr-ic" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
};
const MENU = [['RESUME', ICON.play, 1], ['SETTINGS', ICON.gear, 0], ['HOW TO PLAY', ICON.q, 0], ['QUIT MATCH', ICON.x, 0]];

// light confetti: every piece's place, size, drift and colour come from its own integer seed, never a clock
const CF = Array.from({ length: 22 }, (_, i) => ({
  x: rand(i * 3 + 1) * 100, d: rand(i * 3 + 2) * 0.3, s: 0.55 + rand(i * 3 + 3) * 0.55,
  w: 3 + Math.round(rand(i * 7 + 11) * 3), h: 5 + Math.round(rand(i * 7 + 12) * 5),
  sp: 150 + rand(i * 7 + 13) * 320, dr: (rand(i * 7 + 14) - 0.5) * 54, c: Math.floor(rand(i * 7 + 15) * 3),
}));

const bg = (x, f) => `background-image:url('${x.img('ink/' + f)}')`;
const row = (n, p, s, d, you) => `<span class="mr-br${you ? ' you' : ''}"><i class="mr-bn">${n}${you ? '<em>YOU</em>' : ''}</i><b class="mr-bp">0p</b><i class="mr-bs">${s}</i><i class="mr-bd">${d}</i></span>`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.chipDone = T.chip + 0.38;
    T.card = r + 0.4;
    T.menu = r + 0.6;      // the PAUSED menu rows land one under the other
    T.judge = r + 1.3;     // TIME'S UP! and the JUDGING bar
    T.bar = r + 1.42;      // the turf bar slides out of the centre to the final split
    T.judged = T.bar + 0.6;
    T.win = r + 2.18;      // the VICTORY! plaque
    T.count = r + 2.28;
    T.counted = r + 2.96;
    T.lvl = T.counted;     // the tally landed on +2,422 XP: the badge levels up on the same frame
    T.btns = r + 3.02;
    T.end = r + 3.56;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing match.ts</span></div></div>');
    const card = x.el(`<div class="mr-card">
      <div class="mr-st mr-p" style="opacity:0">
        <i class="mr-bg" style="${bg(x, 'paused.jpg')}"></i><i class="mr-sc"></i>
        <div class="mr-pin">
          <div class="mr-ph"><i class="mr-splat"></i><b>PAUSED</b></div>
          <div class="mr-menu">${MENU.map(([t, ic, on]) => `<span class="mr-mi${on ? ' on' : ''}">${ic}<em>${t}</em></span>`).join('')}</div>
        </div>
        <div class="mr-pinfo">
          <span class="mr-mode">TURF WAR</span>
          <b class="mr-map">Tidewater Plaza, Turf War</b>
          <span class="mr-you">YOUR MATCH <b>Clawd</b></span>
          <div class="mr-tms">
            <span class="mr-tm lime">LIME${LIME.map(([n, , , , you]) => `<i${you ? ' class="you"' : ''}>${n}${you ? ' YOU' : ''}</i>`).join('')}</span>
            <span class="mr-tm magenta">MAGENTA${MAG.map(([n]) => `<i>${n}</i>`).join('')}</span>
          </div>
        </div>
      </div>
      <div class="mr-st mr-j" style="opacity:0">
        <i class="mr-bg" style="${bg(x, 'judging.jpg')}"></i><i class="mr-sc"></i>
        <span class="mr-kick">TIME'S UP!</span>
        <b class="mr-jt">JUDGING...</b>
        <div class="mr-jrow">
          <span class="mr-jp l"><i class="mr-tag lime">LIME</i><b class="mr-lpc">0.0%</b></span>
          <span class="mr-jp m"><b class="mr-mpc">0.0%</b><i class="mr-tag magenta">MAGENTA</i></span>
        </div>
        <div class="mr-bar">
          <i class="mr-fill l"></i><i class="mr-fill m"></i>
          <i class="mr-knob l"></i><i class="mr-knob m"></i>
        </div>
      </div>
      <div class="mr-st mr-w" style="opacity:0">
        <i class="mr-bg" style="${bg(x, 'victory.jpg')}"></i><i class="mr-sc"></i>
        <div class="mr-cf">${CF.map((c) => `<i class="mr-cp c${c.c}" style="width:${c.w}px;height:${c.h}px"></i>`).join('')}</div>
        <div class="mr-wtop"><i class="mr-lw">LIME WINS!</i><b class="mr-vic">VICTORY!</b></div>
        <span class="mr-wsub">Tidewater Plaza, Turf War</span>
        <div class="mr-wscore">
          <span class="mr-ls"><i>Lime</i><b class="mr-lp">0.0%</b></span>
          <span class="mr-ms"><b class="mr-mp">0.0%</b><i>Magenta</i></span>
        </div>
        <div class="mr-bar slim">
          <i class="mr-fill l"></i><i class="mr-fill m"></i>
          <i class="mr-knob l"></i><i class="mr-knob m"></i>
        </div>
        <div class="mr-board">
          <div class="mr-bside lime"><span class="mr-bh"><i class="mr-dot lime"></i>LIME<i class="mr-wtag">WIN</i></span>${LIME.map((r) => row(...r)).join('')}</div>
          <div class="mr-bside magenta"><span class="mr-bh"><i class="mr-dot magenta"></i>MAGENTA</span>${MAG.map((r) => row(...r, 0)).join('')}</div>
        </div>
        <div class="mr-wfoot"><i class="mr-lv">${LV}</i><span class="mr-lvtag">LEVEL UP!</span><b class="mr-xp">+0 XP</b><span class="mr-xnote">TURF +${num(TURF)}</span></div>
        <div class="mr-wbtns"><span class="mr-wb">REMATCH</span><span class="mr-wb ghost">MAIN MENU</span></div>
      </div>
    </div>`);

    const pause = card.querySelector('.mr-p'), judge = card.querySelector('.mr-j'), win = card.querySelector('.mr-w');
    const menu = [...card.querySelectorAll('.mr-mi')];
    const jl = judge.querySelector('.mr-fill.l'), jm = judge.querySelector('.mr-fill.m');
    const jkl = judge.querySelector('.mr-knob.l'), jkm = judge.querySelector('.mr-knob.m');
    const jlc = judge.querySelector('.mr-lpc'), jmc = judge.querySelector('.mr-mpc');
    const wl = win.querySelector('.mr-fill.l'), wm = win.querySelector('.mr-fill.m');
    const wkl = win.querySelector('.mr-knob.l'), wkm = win.querySelector('.mr-knob.m');
    const lpc = win.querySelector('.mr-lp'), mpc = win.querySelector('.mr-mp');
    const xp = win.querySelector('.mr-xp');
    const lvb = win.querySelector('.mr-lv'), lvtag = win.querySelector('.mr-lvtag'), xnote = win.querySelector('.mr-xnote');
    const wbtns = [...win.querySelectorAll('.mr-wb')];
    const cps = [...win.querySelectorAll('.mr-cp')];
    const brows = [...win.querySelectorAll('.mr-br')].map((node) => {
      const el = node.querySelector('.mr-bp');
      // rows alternate lime / magenta down the two columns, so the fill order walks both tables together
      const side = node.closest('.mr-bside');
      const idx = [...side.querySelectorAll('.mr-br')].indexOf(node);
      const team = side.classList.contains('lime') ? LIME : MAG;
      return { node, el, pts: team[idx][1], last: -1 };
    }).sort((a, b) => {
      const ai = a.node.closest('.mr-bside').classList.contains('lime') ? 0 : 1;
      const bi = b.node.closest('.mr-bside').classList.contains('lime') ? 0 : 1;
      const an = [...a.node.parentElement.querySelectorAll('.mr-br')].indexOf(a.node), bn = [...b.node.parentElement.querySelectorAll('.mr-br')].indexOf(b.node);
      return (an - bn) || (ai - bi);
    });
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, lastXp = -1, lastL = '', lastM = '', lastLvl = null;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.judge, judge], [T.win, win]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = chipDone ? DONE : RUN;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // a) PAUSED: the menu rows land under the wordmark, then the panel steps out before the verdict steps in
        pause.style.opacity = (seg(t, T.card, T.card + 0.3) * (1 - seg(t, T.judge - 0.16, T.judge - 0.01))).toFixed(3);
        menu.forEach((m, i) => { const a = T.menu + i * 0.07; const mp = outCubic(seg(t, a, a + 0.3)); m.style.opacity = mp.toFixed(3); m.style.transform = `translateY(${((1 - mp) * 8).toFixed(2)}px)`; });

        // b) JUDGING: the turf bar slides out of the centre and lands on the final split
        judge.style.opacity = (seg(t, T.judge, T.judge + 0.18) * (1 - seg(t, T.win - 0.16, T.win - 0.01))).toFixed(3);
        const bp = outCubic(seg(t, T.bar, T.judged));
        const lw = `${(LP * bp).toFixed(2)}%`, mw = `${(MP * bp).toFixed(2)}%`;
        jl.style.width = lw; jm.style.width = mw;
        jkl.style.left = `${(LP * bp).toFixed(2)}%`;
        jkm.style.left = `${(100 - MP * bp).toFixed(2)}%`;
        const ls = `${(LP * bp).toFixed(1)}%`, ms = `${(MP * bp).toFixed(1)}%`;
        if (jlc.textContent !== ls) jlc.textContent = ls;
        if (jmc.textContent !== ms) jmc.textContent = ms;

        // c) VICTORY!: the plaque counts the real finals, then the buttons land under light confetti
        const wo = outCubic(seg(t, T.win, T.win + 0.4));
        win.style.opacity = wo.toFixed(3);
        win.style.transform = wo >= 1 ? 'none' : `translateY(${((1 - wo) * 12).toFixed(2)}px) scale(${lerp(0.96, 1, wo).toFixed(4)})`;
        const p = outCubic(seg(t, T.count, T.counted));
        const lf = `${(LP * p).toFixed(1)}%`, mf = `${(MP * p).toFixed(1)}%`;
        wl.style.width = `${(LP * p).toFixed(2)}%`; wm.style.width = `${(MP * p).toFixed(2)}%`;
        wkl.style.left = `${(LP * p).toFixed(2)}%`;
        wkm.style.left = `${(100 - MP * p).toFixed(2)}%`;
        if (lf !== lastL) { lastL = lf; lpc.textContent = lf; }
        if (mf !== lastM) { lastM = mf; mpc.textContent = mf; }
        brows.forEach((r, i) => {
          const a = T.count + 0.05 + i * 0.05;
          const rp = outCubic(seg(t, a, a + 0.3));
          r.node.style.opacity = rp.toFixed(3);
          r.node.style.transform = rp >= 1 ? 'none' : `translateX(${((1 - rp) * 6).toFixed(2)}px)`;
          const v = Math.round(r.pts * rp);
          if (v !== r.last) { r.last = v; r.el.textContent = `${num(v)}p`; }
        });
        const xv = Math.round(XP * outCubic(seg(t, T.count + 0.12, T.counted)));
        if (xv !== lastXp) { lastXp = xv; xp.textContent = `+${num(xv)} XP`; }
        // the tally lands on +2,422 XP: the badge levels up with it, and the note becomes the real next level line
        const up = t >= T.lvl;
        if (up !== lastLvl) {
          lastLvl = up;
          lvb.textContent = up ? 'Lv 5' : 'Lv 4';
          xnote.textContent = up ? '2,268 XP to next level' : `TURF +${num(TURF)}`;
        }
        const lvp = seg(t, T.lvl, T.lvl + 0.34);
        const pop = Math.sin(Math.PI * lvp);
        lvb.style.transform = lvp >= 1 ? '' : `scale(${(1 + 0.26 * pop).toFixed(3)})`;
        lvb.style.boxShadow = `inset 0 0 0 1px rgba(182, 255, 46, ${(0.25 + 0.75 * pop).toFixed(3)}), 0 0 ${(12 * pop).toFixed(1)}px rgba(182, 255, 46, ${(0.6 * pop).toFixed(3)})`;
        const tp = seg(t, T.lvl + 0.02, T.lvl + 0.3);
        lvtag.style.opacity = outCubic(tp).toFixed(3);
        lvtag.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, outBack(tp)).toFixed(3)})`;
        wbtns.forEach((b, i) => { const a = T.btns + i * 0.08; const q = seg(t, a, a + 0.28); b.style.opacity = outCubic(q).toFixed(3); b.style.transform = q >= 1 ? '' : `scale(${lerp(0.9, 1, outBack(q)).toFixed(3)})`; });
        cps.forEach((el, i) => {
          const c = CF[i];
          const age = t - (T.win + c.d);
          if (age < 0) { el.style.opacity = '0'; return; }
          el.style.opacity = (1 - seg(age, 0.6, 0.92)).toFixed(3);
          el.style.left = `${(c.x + c.dr * age).toFixed(2)}%`;
          el.style.top = `${(age * c.s * 170 - 14).toFixed(1)}px`;
          el.style.transform = `rotate(${(age * c.sp).toFixed(1)}deg)`;
        });
      },
    };
  },
};