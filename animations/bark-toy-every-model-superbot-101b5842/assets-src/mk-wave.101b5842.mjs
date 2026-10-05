// mk-wave: make the bark track the ElevenLabs beat shows, and the peak arrays its waveforms draw.
// clean.wav  = 12 short barks (band-passed noise bursts with a fast pitch drop, like a corgi yap)
// noisy.wav  = clean.wav on top of the reel's room noise (pink noise + a TV-ish tone bed)
// Prints {clean:[...], noisy:[...]} peaks (0..1, 160 columns) to gen/waveform.json.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const F = '/opt/homebrew/bin/ffmpeg';
const run = (a) => execFileSync(F, ['-y', '-loglevel', 'error', ...a]);
const bursts = [];
let t = 0.35;
for (let i = 0; i < 12; i++) { const d = 0.12 + (i % 3) * 0.03; bursts.push({ t, d }); t += d + 0.42 + (i % 4) * 0.13; }
const dur = t + 0.4;
// one bark = two noise bursts (attack + body), band-limited, with a falling filter
const barkFg = bursts.map(({ t: st, d }) => {
  const k = 2600, w = 1400;
  return `[1:a]adelay=${Math.round(st * 1000)}|${Math.round(st * 1000)},highpass=600,lowpass=5200,volume=0.9,afade=t=in:st=0:d=0.006,afade=t=out:st=${(d * 0.7).toFixed(3)}:d=${(d * 0.3).toFixed(3)}[b${bursts.indexOf({ t: st, d })}]`;
}).join(';');
const parts = bursts.map((b, i) => `[1:a]adelay=${Math.round(b.t * 1000)}|${Math.round(b.t * 1000)},highpass=600,lowpass=5200,volume=0.95,asetnsamples=1024[b${i}]`).join(';');
run(['-f', 'lavfi', '-i', `anoisesrc=d=${dur.toFixed(2)}:c=white:r=48000:a=0.9`, '-f', 'lavfi', '-i', `sine=f=180:d=${dur.toFixed(2)}:r=48000`, '-filter_complex', `${parts};${bursts.map((_, i) => `[b${i}]`).join('')}amix=inputs=${bursts.length}:normalize=0,volume=1.6[bark]`, '-map', '[bark]', 'gen/bark-clean.wav']);
run(['-f', 'lavfi', '-i', `anoisesrc=d=${dur.toFixed(2)}:c=pink:r=48000:a=0.5`, '-f', 'lavfi', '-i', `sine=f=110:d=${dur.toFixed(2)}:r=48000`, '-i', 'gen/bark-clean.wav', '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0[bed];[bed][2:a]amix=inputs=2:normalize=0,volume=1.1[out]', '-map', '[out]', 'gen/reel-noisy.wav']);
// peaks per column
const peaks = (file) => execFileSync(F, ['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 })
  .reduce ? null : null;
const raw = (file) => { const b = execFileSync(F, ['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 }); return new Int16Array(b.buffer, b.byteOffset, b.length >> 1); };
const cols = 160;
const peaksOf = (a) => { const per = Math.floor(a.length / cols); const out = []; for (let c = 0; c < cols; c++) { let m = 0; for (let i = c * per; i < (c + 1) * per; i++) { const v = Math.abs(a[i]); if (v > m) m = v; } out.push(+(m / 32768).toFixed(3)); } return out; };
const clean = peaksOf(raw('gen/bark-clean.wav'));
const mx = Math.max(...clean);
writeFileSync('gen/waveform.json', JSON.stringify({ dur: +dur.toFixed(2), clean: clean.map((v) => +(v / mx).toFixed(3)), noisy: peaksOf(raw('gen/reel-noisy.wav')) }));
console.log('wrote gen/waveform.json', dur.toFixed(2) + 's');
