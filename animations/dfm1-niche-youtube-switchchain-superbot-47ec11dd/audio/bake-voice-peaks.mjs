// bake-voice-peaks.mjs: bakes scenes/tabs-assets/beats/voice-peaks.js (the ElevenLabs beat's waveform data).
// Run: node audio/bake-voice-peaks.mjs   (macOS only; needs `say`; writes scratch WAVs to /tmp/dfm1-voice).
//
// No audio is shipped. The speech ENVELOPE and WORD TIMES are measured from a local macOS `say` take (voice
// "Reed (English (US))", 165 wpm) of the three VO lines: each line is rendered whole for its envelope, and every
// word prefix of it is rendered too, the voiced end of prefix k giving word k's end time. The three lines are then
// placed on the trailer's 0:28 VO timeline at the offsets below. The music lane is not audio at all: it is a
// procedural envelope on a 92 BPM grid (intro, loop, a lighter break, fade out), seeded, so it reads as a lo-fi bed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '../scenes/tabs-assets/beats/voice-peaks.js');
const TMP = '/tmp/dfm1-voice';
mkdirSync(TMP, { recursive: true });

const VOICE = 'Reed (English (US))';
const RATE = '165';
const SR = 22050;
const LINES = [
  'Twelve mics. One blind test.',
  'And the winner costs twenty-nine dollars.',
  "I'm Sam. I test the gear so you don't overpay.",
];
const SHOWN = LINES; // the card shows the lines exactly as spoken
const VO_DUR = 28.0;           // the VO track's length on the trailer timeline
const STARTS = [0.8, 10.4, null]; // line 3 is placed so it ends at END3
const END3 = 27.75;
const MUSIC_DUR = 30.0;
const BPM = 92;
const BIN = 0.25;              // seconds per waveform bar (both lanes share the 0:30 ruler)

function readWav(file) {
  const b = readFileSync(file);
  let o = 12;
  while (o < b.length) {
    const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4);
    if (id === 'data') {
      const s = new Float32Array(n / 2);
      for (let i = 0; i < s.length; i++) s[i] = b.readInt16LE(o + 8 + i * 2) / 32768;
      return s;
    }
    o += 8 + n + (n & 1);
  }
  throw new Error('no data chunk in ' + file);
}
function render(text, name) {
  const f = join(TMP, name + '.wav');
  execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', f, `--data-format=LEI16@${SR}`, text]);
  return readWav(f);
}
// first and last voiced sample (10 ms RMS windows over a -40 dBFS gate)
function voiced(s) {
  const w = Math.round(SR * 0.01), gate = 0.01;
  let a = -1, z = -1;
  for (let i = 0; i + w <= s.length; i += w) {
    let e = 0; for (let j = i; j < i + w; j++) e += s[j] * s[j];
    if (Math.sqrt(e / w) > gate) { if (a < 0) a = i; z = i + w; }
  }
  return { a: a / SR, z: z / SR };
}

const lines = LINES.map((text, li) => {
  const s = render(text, `line${li}`);
  const v = voiced(s);
  const words = text.split(' ');
  const ends = words.map((_, k) => voiced(render(words.slice(0, k + 1).join(' '), `line${li}_${k}`)).z);
  const times = words.map((w, k) => [k === 0 ? v.a : ends[k - 1], Math.min(ends[k], v.z)]);
  return { text, s, v, words, times };
});
// place the lines on the 0:28 timeline (the take's leading silence trimmed)
lines.forEach((L, li) => { L.at = STARTS[li] ?? END3 - (L.v.z - L.v.a); L.off = L.at - L.v.a; });

// VO envelope: RMS per 0.25 s bin of the placed takes
const voBins = Math.round(VO_DUR / BIN);
const vo = new Float64Array(voBins);
for (let b = 0; b < voBins; b++) {
  let e = 0, n = 0;
  for (const L of lines) {
    const i0 = Math.max(0, Math.round((b * BIN - L.off) * SR)), i1 = Math.min(L.s.length, Math.round(((b + 1) * BIN - L.off) * SR));
    for (let i = i0; i < i1; i++) { e += L.s[i] * L.s[i]; }
  }
  n = Math.round(BIN * SR);
  vo[b] = Math.sqrt(e / n);
}
const vmax = Math.max(...vo);
const voEnv = [...vo].map((v) => Math.round(100 * Math.pow(v / vmax, 0.8)));

// music envelope: 92 BPM, kick on beats 1 and 3, snare on 2 and 4, eighth-note hats; section levels; seeded jitter
const rand = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const beat = 60 / BPM;
const mBins = Math.round(MUSIC_DUR / BIN);
const level = (t) => (t < 2.6 ? 0.38 + 0.12 * (t / 2.6)        // filtered intro, keys only
  : t < 13.0 ? 0.78                                              // drums in
  : t < 15.6 ? 0.52                                              // break (two bars without the kick)
  : t < 27.4 ? 0.84                                              // loop back, a little fuller
  : 0.84 * Math.max(0.12, 1 - (t - 27.4) / 2.6));                // fade out to 0:30
const musEnv = [];
for (let b = 0; b < mBins; b++) {
  let peak = 0;
  for (let k = 0; k < 8; k++) {
    const t = (b + k / 8) * BIN, ph = (t / beat) % 1, bi = Math.floor(t / beat) % 4;
    const drums = t >= 2.6 && !(t >= 13.0 && t < 15.6);
    const hit = drums ? (bi % 2 === 0 ? 1 : 0.8) * Math.exp(-ph * 5) : 0;
    const hat = drums ? 0.25 * Math.exp(-((t / (beat / 2)) % 1) * 9) : 0;
    peak = Math.max(peak, level(t) * (0.55 + 0.35 * hit + hat));
  }
  musEnv.push(Math.round(Math.min(100, 100 * peak * (0.9 + 0.1 * rand(b + 7)))));
}

const r2 = (x) => Math.round(x * 100) / 100;
const data = {
  voDur: VO_DUR, musicDur: MUSIC_DUR, bin: BIN, bpm: BPM,
  vo: voEnv, music: musEnv,
  lines: lines.map((L, li) => ({ at: r2(L.at), text: SHOWN[li], words: L.words.map((w, k) => [w, r2(L.times[k][0] + L.off), r2(L.times[k][1] + L.off)]) })),
};
const src = `// voice-peaks.js: baked by audio/bake-voice-peaks.mjs (see audio/CREDITS.txt). Not ElevenLabs output.
// vo = the VO lane's bar heights (0..100), RMS per ${BIN} s of a local macOS \`say\` take of the three lines, used
// ONLY as a speech envelope (no audio is shipped), placed on the trailer's 0:${VO_DUR} VO timeline; lines[].words =
// [word, start s, end s] on that timeline (prefix-render timing). music = a procedural ${BPM} BPM lo-fi envelope.
export const PEAKS = ${JSON.stringify(data)};
`;
writeFileSync(OUT, src);
console.log('wrote', OUT, 'vo bars', voEnv.length, 'music bars', musEnv.length);
data.lines.forEach((l) => console.log(l.at, JSON.stringify(l.words)));
