// mk-spectrum: the output card's frequency strip, measured off the real bark (Goertzel over the first bark).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const SR = 8000;
const buf = execFileSync('/opt/homebrew/bin/ffmpeg', ['-v', 'error', '-i', 'gen/bark-clean.wav', '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const a = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1);
// the loudest bark window
let best = 0, bi = 0;
for (let i = 0; i + 2000 < a.length; i += 200) { let s = 0; for (let j = i; j < i + 2000; j++) s += Math.abs(a[j]); if (s > best) { best = s; bi = i; } }
const N = 2000;
const goertzel = (f) => { const w = (2 * Math.PI * f) / SR, cw = Math.cos(w), coeff = 2 * cw; let s0 = 0, s1 = 0, s2 = 0;
  for (let i = 0; i < N; i++) { s0 = (a[bi + i] / 32768) + coeff * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / N; };
const BANDS = 26, f0 = 160, f1 = 5200;
const freqs = Array.from({ length: BANDS }, (_, i) => f0 * Math.pow(f1 / f0, i / (BANDS - 1)));
const mags = freqs.map(goertzel);
const mx = Math.max(...mags);
const db = mags.map((m) => 20 * Math.log10(Math.max(m, 1e-6) / mx));
const spec = db.map((d) => +Math.max(0, Math.min(1, (d + 42) / 42)).toFixed(3));
const js = readFileSync('site/animations/bark-toy-every-model-superbot-101b5842/assets/waveform.js', 'utf8');
writeFileSync('site/animations/bark-toy-every-model-superbot-101b5842/assets/waveform.js', js.replace(/\n$/, '') + '\n// spectrum: 26 log bands 160 Hz..5.2 kHz of the loudest bark (Goertzel, 8 kHz mono), normalised to its peak\nexport const SPECTRUM = [' + spec.join(', ') + '];\n');
console.log('bands', freqs.map((f) => Math.round(f)).join(','), '\nspec', spec.join(' '));
