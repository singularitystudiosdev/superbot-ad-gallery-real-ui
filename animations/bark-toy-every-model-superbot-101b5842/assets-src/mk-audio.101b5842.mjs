// mk-audio: the spot's track. One bark (the real synthesised bark the ad's chip carries) at the reveal, and a
// single paw-press tick just before it. Everything else is silence, so the loudness never has to be squashed.
import { execFileSync } from 'node:child_process';
const F = '/opt/homebrew/bin/ffmpeg';
const SR = 8000;
const buf = execFileSync(F, ['-v', 'error', '-i', 'gen/bark-clean.wav', '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const a = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1);
let best = -1, at = 0;
const W = Math.round(0.36 * SR);
for (let i = 0; i + W < a.length; i += 80) { let s = 0; for (let j = i; j < i + W; j++) s += a[j] * a[j]; if (s > best) { best = s; at = i; } }
const start = at / SR - 0.02;
const startS = start.toFixed(3), endS = (start + 0.42).toFixed(3);
console.error('loudest bark at', (at / SR).toFixed(2) + 's', 'peak', Math.sqrt(best / W).toFixed(0));
// the paw goes down at 30.643 s (superbot beat T.press); the switch clicks, then he barks
const BARK_AT = 30.70, PRESS_AT = 30.62, DUR = 37.293;
execFileSync(F, ['-y', '-loglevel', 'error',
  '-i', 'gen/bark-clean.wav',
  '-f', 'lavfi', '-i', `anoisesrc=d=${DUR}:c=white:r=48000:a=0.5`,
  '-filter_complex',
  `[0:a]atrim=start=${startS}:end=${endS},asetpts=N/SR/TB,volume=1.35,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[bark];` +
  `[1:a]atrim=0:0.028,asetpts=N/SR/TB,highpass=1400,lowpass=5200,volume=0.16,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[press];` +
  `[bark]adelay=${Math.round(BARK_AT * 1000)}|${Math.round(BARK_AT * 1000)},apad=whole_dur=${DUR}[b];` +
  `[press]adelay=${Math.round(PRESS_AT * 1000)}|${Math.round(PRESS_AT * 1000)},apad=whole_dur=${DUR}[p];` +
  `[b][p]amix=inputs=2:normalize=0,alimiter=level_in=1:limit=0.55:level=disabled,apad=whole_dur=${DUR}[out]`,
  '-map', '[out]', '-ac', '2', '-ar', '48000', 'out/audio-101b5842.wav']);
console.log('wrote out/audio-101b5842.wav', 'bark at', BARK_AT + 's, press at', PRESS_AT + 's');
