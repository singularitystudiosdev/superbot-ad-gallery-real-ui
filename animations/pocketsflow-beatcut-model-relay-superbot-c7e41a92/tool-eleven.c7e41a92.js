// ElevenLabs Music workspace: the prompt Superbot sent, the composition plan, the generated take's real
// waveform with its measured beat grid and sections, and the four takes (take 4 picked for its drop on bar 3).
import { h } from './shell.c7e41a92.js';
import { icon } from './icons.c7e41a92.js';
import { EASE, prog, lerp, clamp01, spinDeg } from './ease.c7e41a92.js';
import { PEAKS_TAKE, TAKE_LEN, PHASE, BAR } from './score.c7e41a92.js';
import { E } from './plan.c7e41a92.js';

const PROMPT = 'Tight, punchy tech-house for a 16 second product launch film. 120 BPM, 4/4. Kick on every beat, clap on 2 and 4, a filtered stab and a riser into a hard drop: deep bass, bright plucks, open hats. One final hit, short tail. No vocals.';
const WAVE = { x: 104, y: 262, w: 1064, h: 120 };
const DROP = PHASE + 2 * BAR, HIT = PHASE + 6 * BAR;
const sx = (s) => (s / TAKE_LEN) * WAVE.w;

function wave(w, hgt) {
  const n = PEAKS_TAKE.length;
  let top = '', bot = '';
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * w;
    const a = (PEAKS_TAKE[i] / 100) * (hgt / 2 - 3);
    top += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(hgt / 2 - a).toFixed(1)}`;
    bot = `L${x.toFixed(1)} ${(hgt / 2 + a).toFixed(1)}` + bot;
  }
  return `${top}${bot}Z`;
}

const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export function buildEleven() {
  const beats = [];
  for (let s = PHASE; s < TAKE_LEN; s += BAR / 4) beats.push(s);
  const el = h(`<div class="tool t-eleven">
<nav class="xnav"><span class="xlogo"><img src="brand/elevenlabs-logo-black.svg" alt=""></span>${['home', 'mic', 'globe', 'listChecks', 'settings'].map((n) => `<span class="xi${n === 'globe' ? ' on' : ''}">${icon(n)}</span>`).join('')}</nav>
<header class="xtop"><span class="crumb">Music <em>/</em> <b>Pocketsflow launch</b></span><span class="xmodel"><img src="brand/elevenlabs-logo-black.svg" alt="">Eleven Music</span></header>
<section class="xcard xprompt"><div class="xl">Describe your song</div><p data-ptext></p>
  <div class="xrow"><span class="xchip on">${icon('check')}Instrumental</span><span class="xchip">${icon('clock')}0:16</span><span class="xchip">MP3 · 44.1 kHz</span>
  <span class="xgen" data-gen><span class="lbl" data-genl>Generate</span><span class="lbl b" data-genb>${icon('spin', 'sp')}Composing</span></span></div></section>
<section class="xcard xplan"><div class="xl">Composition plan</div>
  <div class="sec"><b>Intro</b><span>0:00-0:04</span><em>kick, clap, filtered stab, riser</em></div>
  <div class="sec"><b>Drop</b><span>0:04-0:12</span><em>deep bass, bright plucks, open hats</em></div>
  <div class="sec"><b>Final hit</b><span>0:12-0:17</span><em>one hit, short tail</em></div></section>
<section class="xcard xwave"><div class="xwh"><span class="fn">${icon('mic')}pocketsflow-launch.mp3</span><span class="xst" data-wst>Composing...</span>
  <span class="bpm" data-bpm>120 BPM · 4/4 · drop 0:04</span></div>
  <div class="wv" data-wv style="left:20px;width:${WAVE.w}px">
    <div class="band intro" data-band style="left:0;width:${sx(DROP) - 1}px"><em>INTRO</em></div>
    <div class="band drop" data-band data-dropband style="left:${sx(DROP)}px;width:${sx(HIT) - sx(DROP) - 1}px"><em>DROP</em></div>
    <div class="band hit" data-band style="left:${sx(HIT)}px;width:${WAVE.w - sx(HIT)}px"><em>HIT</em></div>
    ${beats.map((s, i) => `<i class="beat${i % 4 ? '' : ' bar'}" data-beat style="left:${sx(s).toFixed(1)}px"></i>`).join('')}
    <svg class="shim" data-shim viewBox="0 0 ${WAVE.w} ${WAVE.h}" preserveAspectRatio="none"><rect width="${WAVE.w}" height="${WAVE.h}" rx="10"/></svg>
    <svg class="wpath" data-wpath viewBox="0 0 ${WAVE.w} ${WAVE.h}" preserveAspectRatio="none"><path d="${wave(WAVE.w, WAVE.h)}"/></svg>
    <i class="ph" data-ph></i></div></section>
<section class="xplayer"><span class="pbtn" data-pbtn>${icon('arrowUp', 'tri')}</span><span class="time" data-time>0:00 / 0:17</span>
  <span class="takes" data-takes>Takes ${[1, 2, 3, 4].map((n) => `<span class="tk${n === 4 ? ' on' : ''}">${n}</span>`).join('')}<em>picked 4: the drop lands on bar 3</em></span>
  <span class="dl">${icon('share2')}Send to Superbot</span></section>
</div>`);
  const q = (s) => el.querySelector(s);
  const ptext = q('[data-ptext]'), gen = q('[data-gen]'), genl = q('[data-genl]'), genb = q('[data-genb]');
  const wst = q('[data-wst]'), bpm = q('[data-bpm]'), shim = q('[data-shim]'), wpath = q('[data-wpath]');
  const ph = q('[data-ph]'), time = q('[data-time]'), takes = q('[data-takes]'), dropBand = q('[data-dropband]');
  const bands = [...el.querySelectorAll('[data-band]')], beatEls = [...el.querySelectorAll('[data-beat]')];
  const sp = q('.sp');
  const T0 = E + 0.3, GEN = E + 1.1, DRAW = E + 1.9, GRID = E + 2.5, PLAY = E + 2.6, PLAY_END = E + 5.3;

  return {
    id: 'eleven', label: 'ElevenLabs', logo: 'brand/elevenlabs-logo.svg', tileBg: '#000', el,
    update(t) {
      ptext.textContent = PROMPT.slice(0, Math.round(PROMPT.length * clamp01((t - T0) / 0.7)));
      const press = Math.sin(Math.PI * clamp01((t - GEN) / 0.18));
      gen.style.transform = `scale(${(1 - 0.06 * press).toFixed(4)})`;
      const busy = prog(t, GEN + 0.05, 0.15, EASE.standard) * (1 - prog(t, DRAW, 0.2, EASE.standard));
      genl.style.opacity = (1 - busy).toFixed(3);
      genb.style.opacity = busy.toFixed(3);
      sp.style.transform = `rotate(${spinDeg(t).toFixed(1)}deg)`;
      const shimOn = prog(t, GEN + 0.1, 0.2, EASE.standard) * (1 - prog(t, DRAW + 0.3, 0.3, EASE.standard));
      shim.style.opacity = shimOn.toFixed(3);
      shim.style.setProperty('--sx', `${((((t - GEN) % 1.1) + 1.1) % 1.1 / 1.1 * 250 - 75).toFixed(1)}%`);
      const draw = EASE.outCubic(clamp01((t - DRAW) / 0.6));
      wpath.style.clipPath = `inset(0 ${(100 - draw * 100).toFixed(2)}% 0 0)`;
      wst.textContent = t < DRAW + 0.6 ? 'Composing...' : 'Ready';
      wst.classList.toggle('ok', t >= DRAW + 0.6);
      const g = prog(t, GRID, 0.4, EASE.standard);
      bands.forEach((b) => (b.style.opacity = g.toFixed(3)));
      beatEls.forEach((b, i) => (b.style.opacity = prog(t, GRID + i * 0.012, 0.25, EASE.standard).toFixed(3)));
      bpm.style.opacity = prog(t, GRID + 0.1, 0.3, EASE.standard).toFixed(3);
      bpm.style.transform = `scale(${lerp(0.85, 1, prog(t, GRID + 0.1, 0.35, EASE.outBack)).toFixed(4)})`;
      const pt = t < PLAY ? 0 : lerp(2.4, 5.2, clamp01((t - PLAY) / (PLAY_END - PLAY)));
      ph.style.opacity = prog(t, PLAY, 0.2, EASE.standard).toFixed(3);
      ph.style.transform = `translateX(${sx(pt).toFixed(2)}px)`;
      time.textContent = `${fmt(pt)} / 0:17`;
      const hitDrop = t >= PLAY && pt >= DROP ? 1 - clamp01((pt - DROP) / 0.6) : 0;
      dropBand.style.boxShadow = `inset 0 0 0 ${(2 * hitDrop).toFixed(2)}px rgba(255,99,71,${hitDrop.toFixed(3)})`;
      dropBand.style.background = `rgba(255,99,71,${(0.08 + 0.16 * hitDrop).toFixed(3)})`;
      takes.style.opacity = prog(t, GRID + 0.4, 0.35, EASE.standard).toFixed(3);
    },
  };
}
