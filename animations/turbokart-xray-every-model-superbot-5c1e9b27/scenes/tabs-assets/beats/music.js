// Music beat: Turbo Kart Rally's score and sound effects in one card. Its line streams, the composing chip lands and
// spins, the card rises, and each row lands and fills its waveform left to right as it is generated, staggered,
// stamping its length once it is done. The chip resolves once the last row has filled.
//   Lyria 2's cues: the Palm Cove Circuit main loop (148 BPM, D major, a 1:12 loop), its cue art a square crop of the
//     game's own title screen (img/tkr-beats/music/cover.jpg, real clip pixels), then the final-lap stinger at +8 BPM.
//   ElevenLabs' SFX: engine idle, engine rev, drift sparks, mini-turbo boost, item box roll, red shell whoosh,
//     lightning zap, countdown beeps; each short waveform is shaped like the sound (a rising rev, four beeps).
// opts.set picks what the card holds: 'both' (default, one step scoring everything), 'score' (Lyria 2's two cues
// alone) or 'sfx' (ElevenLabs' eight sounds alone), so chat.js can route it as one step or as two.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

// [title, meta, length]: the main loop, then the final-lap stinger at +8 BPM
const CUES = [
  ['Palm Cove Circuit', 'main loop · 148 BPM · D major', '1:12'],
  ['Final lap', 'stinger · 156 BPM · +8 BPM', '0:06'],
];
// [name, length, envelope]: every sound the race plays
const SFX = [
  ['engine idle', '2.0s', 'idle'],
  ['engine rev', '1.4s', 'rev'],
  ['drift sparks', '0.9s', 'sparks'],
  ['mini-turbo boost', '1.1s', 'boost'],
  ['item box roll', '1.6s', 'roll'],
  ['red shell whoosh', '0.8s', 'whoosh'],
  ['lightning zap', '1.2s', 'zap'],
  ['countdown beeps', '3.2s', 'beeps'],
];
const SETS = {
  both: { say: 'Scoring Palm Cove Circuit and cutting the race SFX.', run: 'Composing 2 cues + 8 SFX', ran: 'Composed 2 cues + 8 SFX', title: 'Turbo Kart Rally: score + SFX', sub: 'Lyria 2 + ElevenLabs', logo: 'gemini-logo.svg', cues: true, sfx: true },
  score: { say: 'Scoring Palm Cove Circuit: a 148 BPM loop and a final-lap stinger.', run: 'Composing 2 cues', ran: 'Composed 2 cues', title: 'Turbo Kart Rally: score', sub: 'Lyria 2', logo: 'gemini-logo.svg', cues: true, sfx: false },
  sfx: { say: 'Cutting the race SFX: engines, drift, items, countdown.', run: 'Generating 8 SFX', ran: 'Generated 8 SFX', title: 'Turbo Kart Rally: SFX', sub: 'ElevenLabs', logo: 'elevenlabs-logo.svg', cues: false, sfx: true },
};
const set = (opts) => SETS[(opts && opts.set) || 'both'] || SETS.both;

const CUE_BARS = 30;   // waveform bars per cue
const SFX_BARS = 12;   // waveform bars per sound
const FILL = 0.95;     // seconds one cue takes to fill its waveform
const SFX_FILL = 0.3;  // seconds one sound takes
const STAGGER = 0.32;  // between cues
const SFX_STAGGER = 0.12;
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';

// a cheap deterministic hash in 0..1 so every frame draws the same waveform
const hash = (i, seed) => { const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
const cueBars = (seed) => Array.from({ length: CUE_BARS }, (_, i) => (0.22 + 0.78 * hash(i, seed)) * (0.55 + 0.45 * Math.sin((i / CUE_BARS) * Math.PI)));
// each sound's waveform follows what it is
const ENV = {
  idle: (x) => 0.45 + 0.1 * Math.sin(x * 25),
  rev: (x) => 0.2 + 0.8 * x,
  sparks: (x, h) => 0.25 + 0.75 * h,
  boost: (x) => (x < 0.15 ? x / 0.15 : 1 - 0.7 * (x - 0.15)),
  roll: (x) => (Math.floor(x * 12) % 2 ? 0.35 : 0.8),
  whoosh: (x) => Math.sin(x * Math.PI),
  zap: (x) => (x < 0.12 ? 1 : 0.9 * Math.exp(-(x - 0.12) * 5)),
  beeps: (x) => (x < 0.12 || (x > 0.25 && x < 0.37) || (x > 0.5 && x < 0.62) ? 0.6 : x > 0.75 ? 1 : 0.08),
};
const sfxBars = (env, seed) => Array.from({ length: SFX_BARS }, (_, i) => {
  const x = i / (SFX_BARS - 1), h = hash(i, seed);
  return Math.max(0.08, Math.min(1, ENV[env](x, h) * (0.85 + 0.15 * h)));
});
const bars = (hs) => hs.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('');

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.cue = S.cues ? CUES.map((_, i) => r + 0.62 + i * STAGGER) : [];
    T.cueFill = T.cue.map((a) => a + 0.12);
    const s0 = S.cues ? r + 1.1 : r + 0.62;   // the SFX block lands under the cues
    T.sfxHd = S.sfx ? s0 : null;
    T.sfx = S.sfx ? SFX.map((_, i) => s0 + 0.1 + i * SFX_STAGGER) : [];
    const ends = [...T.cueFill.map((a) => a + FILL), ...T.sfx.map((a) => a + 0.05 + SFX_FILL)];
    T.done = Math.max(...ends);
    T.end = T.done + 0.45;   // the last length stamp lands at T.done + 0.2: 0.25s of dwell, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T, S = set(k.opts);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(S.run)}</span></div></div>`);
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>${x.esc(S.title)}</b><small>${x.esc(S.sub)}</small></div>
      ${S.cues ? CUES.map(([title, meta, len], i) => `<div class="mus-row">
        ${i ? '<span class="mus-flag"></span>' : `<img class="mus-art" src="${x.img('tkr-beats/music/cover.jpg')}" alt=""/>`}
        <span class="mus-main"><span class="mus-title">${x.esc(title)}<small>${x.esc(meta)}</small></span>
          <span class="mus-wave">${bars(cueBars(i + 3))}</span></span>
        <span class="mus-len">${x.esc(len)}</span>
      </div>`).join('') : ''}
      ${S.sfx ? `<div class="mus-sfx${S.cues ? '' : ' mus-sfx-only'}">
        ${S.cues ? `<div class="mus-sfx-hd"><span class="mus-sfx-lg"><img src="${x.brand('elevenlabs-logo.svg')}" alt=""/></span><b>ElevenLabs</b><small>8 SFX</small></div>` : ''}
        <div class="mus-sfx-grid">${SFX.map(([name, len, env], i) => `<span class="mus-sx"><span class="mus-sx-n">${x.esc(name)}</span><span class="mus-sx-w">${bars(sfxBars(env, i + 1))}</span><span class="mus-sx-l">${x.esc(len)}</span></span>`).join('')}</div>
      </div>` : ''}
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row) => ({ row, bars: [...row.querySelectorAll('.mus-wave i')], len: row.querySelector('.mus-len') }));
    const sfxHd = card.querySelector('.mus-sfx-hd');
    const sxs = [...card.querySelectorAll('.mus-sx')].map((n) => ({ n, bars: [...n.querySelectorAll('.mus-sx-w i')], len: n.querySelector('.mus-sx-l') }));
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const draw = (bs, p) => bs.forEach((b, j) => {
      const on = seg(p * bs.length, j, j + 1.5);
      b.style.opacity = lerp(0.18, 1, on).toFixed(3);
      b.style.transform = `scaleY(${lerp(0.25, 1, outCubic(on)).toFixed(3)})`;
    });
    const lastMark = sxs.length ? [T.sfx[SFX.length - 1], sxs[SFX.length - 1].n] : [T.cue[CUES.length - 1], rows[CUES.length - 1].row];
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], lastMark],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the last row has filled
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? S.ran : S.run;
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // Lyria 2's cues: each lands, fills its waveform left to right, then stamps its length
        rows.forEach(({ row, bars: bs, len }, i) => {
          rise(row, seg(t, T.cue[i], T.cue[i] + 0.3), 6);
          const p = seg(t, T.cueFill[i], T.cueFill[i] + FILL);
          draw(bs, p);
          row.classList.toggle('mus-live', p > 0 && p < 1);
          len.style.opacity = outCubic(seg(t, T.cueFill[i] + FILL - 0.1, T.cueFill[i] + FILL + 0.2)).toFixed(3);
        });

        // ElevenLabs' sounds: the block header, then each sound lands and draws its short waveform
        if (sfxHd) rise(sfxHd, seg(t, T.sfxHd, T.sfxHd + 0.3), 6);
        sxs.forEach((X, i) => {
          const a = T.sfx[i];
          rise(X.n, seg(t, a, a + 0.22), 4);
          const p = seg(t, a + 0.05, a + 0.05 + SFX_FILL);
          draw(X.bars, p);
          X.n.classList.toggle('on', p >= 1);
          X.len.style.opacity = outCubic(seg(t, a + SFX_FILL - 0.05, a + SFX_FILL + 0.15)).toFixed(3);
        });
      },
    };
  },
};
