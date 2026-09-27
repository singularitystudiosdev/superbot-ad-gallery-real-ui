// Music beat (Lyria 2): superbot's scoring request for The Last Invention. The composing chip lands and spins, and the
// score card rises: the film's 5:15 cut into six movements at its own acts, each waveform the film's real mix, and one
// play-head crossing them in order at film speed, so a movement's sweep lasts as long, relatively, as the act does.
//
// Movements are the film's acts, stamped from its transcript (finale/words.json word times, transcript.srt) and its cut
// list (scenes.txt). The three chapter card rows carry the film's own card titles (img/li/assets.json timeline, cards at
// 32.5, 102.3 and 171.5 s); the other three are act labels, set italic so they never read as the film's own cards:
//   0:00  Cold open                LONDON caption, Imogen's promise at 0:19 (the foot), title card 0:27
//   0:32  What We Mean By Clever   chapter card
//   1:42  The Last Invention       chapter card
//   2:51  The Gorilla Problem      chapter card
//   3:46  Paperclips               "The classic example." 226.0
//   4:13  Nobody knows             "So when does all this happen?" 253.0, "Nobody knows." 257.0, end title cut 305.375
// A row's length stamp is the difference of the displayed stamps, so the six add up to the header's 5:15 (315.43 s).
//
// ENV is the film's real loudness, not a drawing: per-bar RMS dBFS (bars of about 1.25 s, round((b - a) / 1.25) per
// movement) of /tmp/si-d9165c54/post-480.mp4's audio, decoded by ffmpeg to mono float 48 kHz and measured by
// /tmp/si-d9165c54/music/bars.d9165c54.py (20 * log10(rms), full scale 1.0). A wave's width is its act's length over the
// longest act's, so every bar on the card spans the same stretch of film.
//
// The film's end card credits its own music; nothing here says who scored the film. The card is the request's cue sheet,
// and the only picture on it is a real frame crop no other beat shows (img/li/plate-codebreaking-room.jpg, the film at
// 2:00: music.css crops it to the tungsten lamp over the bombe's rotor drums).
//
// Interface as before: times(reply) -> T with chip, card, track[], fill[], done, end; the window the old three staggered
// sweeps spanned (reply + 0.74 to reply + 2.33) is the one play-head's, so done and end land where they always did.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scoring to the cut, so every chapter card lands on the beat.';

const DUR = 315.43;   // the film, 5:15 (audio 315.435 s, last frame 315.417 s)
// [title, start s, act label (italic) or the film's own chapter card title]
const MOV = [
  ['Cold open', 0, true],
  ['What We Mean By Clever', 32.5, false],
  ['The Last Invention', 102.3, false],
  ['The Gorilla Problem', 171.5, false],
  ['Paperclips', 226.0, true],
  ['Nobody knows', 253.0, true],
].map(([title, a, act], i, all) => ({ title, a, act, b: i + 1 < all.length ? all[i + 1][1] : DUR }));

// per-bar RMS dBFS, one array per movement (bars.d9165c54.py)
const ENV = [
  // Cold open, 0.0 to 32.5 s, 26 bars
  [-16.0,-15.3,-15.9,-16.8,-9.8,-13.6,-14.1,-17.4,-14.4,-14.8,-17.1,-15.0,-16.3,-13.8,-16.3,-14.7,-16.6,-15.5,-18.8,-15.8,-18.8,-16.1,-18.4,-17.2,-19.1,-15.6],
  // What We Mean By Clever, 32.5 to 102.3 s, 56 bars
  [-15.2,-20.6,-21.2,-15.7,-12.7,-13.4,-17.1,-14.8,-16.6,-14.7,-14.8,-14.5,-16.1,-12.6,-15.6,-17.8,-13.6,-12.9,-18.0,-13.6,-11.8,-14.2,-13.5,-17.7,-13.5,-15.1,-14.9,-16.8,-16.8,-15.9,-14.5,-14.4,-16.2,-12.4,-13.3,-14.7,-11.9,-18.0,-13.2,-13.8,-15.8,-15.7,-15.6,-13.8,-13.5,-14.7,-15.6,-16.3,-18.2,-15.3,-16.7,-15.4,-19.5,-17.2,-16.1,-17.6],
  // The Last Invention, 102.3 to 171.5 s, 55 bars
  [-15.8,-16.9,-17.9,-17.9,-16.3,-16.9,-16.4,-18.2,-13.0,-15.6,-16.0,-16.7,-12.9,-15.8,-16.2,-13.1,-20.2,-14.0,-17.0,-13.9,-20.1,-14.6,-17.9,-14.1,-17.4,-14.4,-15.4,-18.3,-15.2,-14.8,-18.1,-16.8,-15.0,-16.9,-16.5,-14.1,-16.8,-13.7,-13.4,-21.0,-14.0,-15.2,-14.5,-15.9,-21.5,-17.0,-16.7,-15.2,-15.0,-14.6,-15.0,-19.8,-14.5,-15.1,-20.0],
  // The Gorilla Problem, 171.5 to 226.0 s, 44 bars
  [-13.6,-19.7,-11.8,-13.8,-14.1,-21.8,-14.7,-15.8,-16.5,-17.6,-15.9,-16.6,-19.2,-14.5,-15.7,-14.7,-17.9,-21.4,-13.2,-14.1,-17.2,-16.8,-16.4,-15.1,-16.1,-15.5,-15.6,-18.1,-14.4,-14.0,-15.2,-14.8,-15.4,-14.0,-15.3,-14.0,-17.9,-15.3,-13.0,-13.3,-14.2,-18.9,-17.0,-14.0],
  // Paperclips, 226.0 to 253.0 s, 22 bars
  [-17.1,-17.1,-15.6,-16.2,-20.0,-14.7,-18.1,-16.3,-18.2,-16.5,-16.3,-16.6,-16.8,-17.3,-21.1,-16.1,-18.9,-16.5,-15.0,-15.9,-21.2,-22.3],
  // Nobody knows, 253.0 to 315.435 s, 50 bars
  [-14.6,-16.4,-24.2,-14.8,-19.9,-14.0,-17.1,-15.2,-14.2,-16.2,-14.4,-19.0,-14.1,-17.8,-17.6,-14.2,-16.3,-16.6,-15.1,-17.0,-13.3,-15.8,-14.8,-14.8,-22.3,-16.8,-17.7,-17.6,-16.2,-16.6,-21.9,-19.5,-19.1,-16.7,-19.5,-15.4,-15.7,-15.5,-22.4,-15.3,-17.2,-25.2,-19.1,-23.3,-25.3,-24.6,-22.5,-26.3,-27.0,-28.9],
];

// the marks the waves carry: Imogen's promise (the foot) and the cut to the end title
const TICKS = [
  { row: 0, t: 19.0, text: '0:19', anchor: 'c' },
  { row: 5, t: 305.375, text: '5:05 end title', anchor: 'r', fin: true },
];

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const LONGEST = Math.max(...MOV.map((m) => m.b - m.a));
// dBFS to bar height: the mix sits between -24.6 and -12.6 dBFS for 96% of its bars (peak -9.8, the LONDON hit at
// 0:05; floor -28.9, the end title's tail), so the map spans -25..-11 with a gentle curve; monotonic, so a taller bar is
// always a louder stretch of film
const height = (db) => Math.max(0.14, clamp((db + 25) / 14, 0, 1) ** 1.25);

const STAGGER = 0.64 / (MOV.length - 1);   // rows land over the same 0.64 s the old three did
const HEAD = 0.74;                          // the play-head starts 0.12 s after the first row lands
const SWEEP = 1.59;                         // and crosses the whole film in the window the old sweeps spanned

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.track = MOV.map((_, i) => r + 0.62 + i * STAGGER);
    T.fill = MOV.map((m) => r + HEAD + (m.a / DUR) * SWEEP);
    T.fillEnd = MOV.map((m) => r + HEAD + (m.b / DUR) * SWEEP);
    T.done = T.fillEnd[MOV.length - 1];
    T.end = T.done + 0.45;   // the last length stamp lands at T.done + 0.2: 0.25s of dwell, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing ${MOV.length} movements</span></div></div>`);
    const pct = (v) => `${(v * 100).toFixed(2)}%`;
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><span class="mus-ic"><img src="img/li/plate-codebreaking-room.jpg" alt="" draggable="false"></span>
        <span class="mus-ht"><b>The Last Invention</b><i class="mus-rule"></i><small>original score, ${mmss(DUR)}</small></span></div>
      ${MOV.map((m, i) => `<div class="mus-row">
        <span class="mus-go"></span>
        <span class="mus-at">${mmss(m.a)}</span>
        <span class="mus-title${m.act ? ' mus-act' : ''}">${x.esc(m.title)}</span>
        <span class="mus-lane"><span class="mus-wave" style="width:${pct((m.b - m.a) / LONGEST)}">${ENV[i].map((db) => `<i style="height:${(height(db) * 100).toFixed(1)}%"></i>`).join('')}${TICKS.filter((c) => c.row === i).map((c) => `<s class="mus-tick${c.fin ? ' mus-fin' : ''}" style="left:${pct((c.t - m.a) / (m.b - m.a))}"><b class="mus-cue mus-a${c.anchor}">${x.esc(c.text)}</b></s>`).join('')}<u class="mus-ph"></u></span></span>
        <span class="mus-len">${mmss(Math.floor(m.b) - Math.floor(m.a))}</span>
      </div>`).join('')}
      <div class="mus-cite"><span class="mus-tc">0:19</span><span class="mus-q"><b>Slowly, with pictures. No maths, I promise. Well, hardly any.</b><small>Dr Imogen Ashby, The Last Invention</small></span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row, i) => ({
      row, bars: [...row.querySelectorAll('.mus-wave i')], len: row.querySelector('.mus-len'), ph: row.querySelector('.mus-ph'),
      ticks: [...row.querySelectorAll('.mus-tick')].map((el, j) => {
        const c = TICKS.filter((q) => q.row === i)[j];
        return { el, x: (c.t - MOV[i].a) / (MOV[i].b - MOV[i].a) };
      }),
      last: [],
    }));
    const cite = card.querySelector('.mus-cite');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      // the last mark is the citation, not the last row: the fold has to sit under the foot for it to be seen lighting
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.track[MOV.length - 1], cite]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the play-head has crossed the whole film
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = `${done ? 'Composed' : 'Composing'} ${MOV.length} movements`;
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the movements land top to bottom; the play-head runs through them in film order, raising each bar to its
        // measured height and warming it from teal to tungsten as it passes, and each row stamps its length when crossed
        rows.forEach(({ row, bars, len, ph, ticks, last }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const p = seg(t, T.fill[i], T.fillEnd[i]);
          bars.forEach((b, j) => {
            const on = +seg(p * (bars.length + 0.5), j, j + 1.5).toFixed(3);   // + 0.5: the last bar lands fully at p = 1
            if (last[j] === on) return;
            last[j] = on;
            b.style.opacity = lerp(0.5, 1, on).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.3, 1, outCubic(on)).toFixed(3)})`;
            b.style.setProperty('--w', on);
          });
          const live = p > 0 && p < 1;
          row.classList.toggle('mus-live', live);
          row.classList.toggle('mus-past', p >= 1);
          ph.style.opacity = live ? '1' : '0';
          ph.style.left = pct(p);
          ticks.forEach((c) => c.el.classList.toggle('on', p > 0 && p >= c.x));
          len.style.opacity = outCubic(seg(t, T.fillEnd[i] - 0.1, T.fillEnd[i] + 0.2)).toFixed(3);
        });

        // the promise waits dim at the foot and lights as the play-head reaches the end title: the film's first word to
        // its viewer, stamped where Imogen says it
        const lit = seg(t, T.done - 0.12, T.done + 0.08);
        cite.style.opacity = lerp(0.32, 1, lit).toFixed(3);
        cite.classList.toggle('on', lit > 0);
      },
    };
  },
};
