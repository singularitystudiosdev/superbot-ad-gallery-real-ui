// The race-day app's markup (the page Opus wrote in app/page.tsx, as it renders on localhost:3000): the Blender
// flyover with its HUD, the course's real elevation profile with the per-mile targets, the coach card playing an
// Eleven v3 cue, the Nano Banana Pro photo of the stretch, and the credits row naming which model made what.
import { PROFILE, VOICE } from '../../../media/data.9f1df009.js?v=9f1df009';
import { media, mmss } from './kit.9f1df009.js?v=9f1df009';

export const MI = PROFILE.mi;
// where the runner is, by mile (the 2026 course: Flatbush to Grand Army Plaza, the park loop, Ocean Pkwy, the boardwalk)
const WHERE = [[1.5, 'Washington Ave'], [3, 'Flatbush Ave'], [4, 'Parkside Ave'], [6.2, 'Prospect Park'], [7, 'Machate Circle'],
  [12.4, 'Ocean Pkwy'], [99, 'Surf Ave · Boardwalk']];
export const whereAt = (m) => WHERE.find(([b]) => m < b)[1];
export const CUE = 'ocean', CUE_MI = 7, NEXT = 'Next cue: mile 12.8 · Boardwalk';
export const cueWords = VOICE[CUE].text.replace(/^\[\w+\]\s*/, '').split(' ');

// the profile: x across 0..1000 by mile, y up with feet (min..max of the real DEM samples)
const PW = 1000, PH = 120;
const px = (m) => (m / MI) * PW;
const py = (ft) => PH - 10 - ((ft - PROFILE.min_ft) / (PROFILE.max_ft - PROFILE.min_ft)) * 92;
const line = PROFILE.ft.map((f, i) => `${i ? 'L' : 'M'}${px(i * PROFILE.step).toFixed(1)},${py(f).toFixed(1)}`).join('');
export const profileY = (m) => py(PROFILE.ft[Math.min(PROFILE.ft.length - 1, Math.round(m / PROFILE.step))]) / PH;

function waveSvg(peaks, n = 64) {
  const per = peaks.length / n, w = 100 / n;
  return Array.from({ length: n }, (_, b) => {
    let m = 0; for (let i = Math.floor(b * per); i < Math.floor((b + 1) * per); i++) m = Math.max(m, peaks[i]);
    const h = Math.max(6, m * 100);
    return `<rect x="${(b * w + w * 0.2).toFixed(2)}" y="${((100 - h) / 2).toFixed(1)}" width="${(w * 0.6).toFixed(2)}" height="${h.toFixed(1)}" rx="0.8"/>`;
  }).join('');
}

const CREDITS = [
  ['deepseek-logo.svg', 'Splits scraped', 'DeepSeek V4'], ['blender-logo.svg', 'Course rendered', 'Blender 5.2'],
  ['nanobanana-logo.svg', 'Photos made', 'Nano Banana Pro'], ['elevenlabs-logo.svg', 'Coach voiced', 'Eleven v3'],
  ['claude-logo.svg', 'App built', 'Claude Opus 5.5'],
];

export function clientHTML(x, splits, goal) {
  const avg = mmss(goal / MI);
  const hms = `${Math.floor(goal / 3600)}:${mmss(goal % 3600).padStart(5, '0')}`;
  return `<div class="ap-client">
    <header class="ap-chrome"><i class="ap-dots"><b></b><b></b><b></b></i><span class="ap-tab">Brooklyn Half · Race day</span>
      <span class="ap-url"><i class="ap-lock"></i>localhost:3000</span></header>
    <main class="ap-main">
      <section class="ap-left">
        <div class="ap-fly"><img class="ap-fimg" src="${media('fly/f_030.jpg')}" alt="">
          <div class="ap-hud"><b class="ap-mile">MILE 4.1</b><span class="ap-where">Prospect Park</span>
            <span class="ap-tgt">Target <b class="ap-tp">8:53</b> /mi</span><span class="ap-clk">On plan <b class="ap-clock">0:36:00</b></span></div>
          <span class="ap-rtag">Flyover · Blender 5.2 · EEVEE</span><i class="ap-prog"><i></i></i></div>
        <div class="ap-prof"><div class="ap-ph"><b>Elevation</b><span>+${PROFILE.gain_ft} ft · ${PROFILE.min_ft} to ${PROFILE.max_ft} ft</span></div>
          <div class="ap-sv"><svg class="ap-svg" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="none">
            <defs><linearGradient id="apg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d12" stop-opacity=".45"/><stop offset="1" stop-color="#ff4d12" stop-opacity="0"/></linearGradient>
              <clipPath id="apc"><rect class="ap-cr" x="0" y="0" width="0" height="${PH}"/></clipPath></defs>
            ${Array.from({ length: 13 }, (_, i) => `<line x1="${px(i + 1).toFixed(1)}" x2="${px(i + 1).toFixed(1)}" y1="0" y2="${PH}" class="ap-tk"/>`).join('')}
            <path d="${line}L${PW},${PH}L0,${PH}Z" class="ap-area0"/><path d="${line}" class="ap-line0"/>
            <g clip-path="url(#apc)"><path d="${line}L${PW},${PH}L0,${PH}Z" fill="url(#apg)"/><path d="${line}" class="ap-line1"/></g>
          </svg><i class="ap-dot"></i></div>
          <div class="ap-pace">${splits.map((s, i) => `<span><s>${i + 1}</s><b>${mmss(s)}</b></span>`).join('')}</div></div>
      </section>
      <aside class="ap-side">
        <div class="ap-head"><h1>Brooklyn Half</h1><p>13.1 mi · +${PROFILE.gain_ft} ft · Goal <b>${hms}</b> · ${avg}/mi</p></div>
        <div class="ap-coach"><div class="ap-ch"><i class="ap-av"></i><b>Coach</b><s>Sarah · Eleven v3</s><em class="ap-live">Up next</em></div>
          <div class="ap-cue"><span class="ap-pl"></span><span class="ap-cm">Mile ${CUE_MI}</span>
            <span class="ap-wv"><svg class="ap-w0" viewBox="0 0 100 100" preserveAspectRatio="none">${waveSvg(VOICE[CUE].peaks)}</svg>
              <span class="ap-wc"><svg class="ap-w1" viewBox="0 0 100 100" preserveAspectRatio="none">${waveSvg(VOICE[CUE].peaks)}</svg></span></span>
            <span class="ap-cd">0:${String(Math.round(VOICE[CUE].dur)).padStart(2, '0')}</span></div>
          <p class="ap-ctx">${cueWords.map((w) => `<span>${x.esc(w)}</span>`).join(' ')}</p><p class="ap-next">${NEXT}</p></div>
        <div class="ap-photo"><img class="ap-p0" src="${media('img/hill.jpg')}" alt=""><img class="ap-p1" src="${media('img/finish.jpg')}" alt="">
          <div class="ap-pc"><b class="ap-pt">Now · East Drive hill</b><s>Nano Banana Pro</s></div></div>
        <div class="ap-plan"><div class="ap-pl2"><b>Race plan</b><s>DeepSeek V4 · 84,117 finishers</s></div>
          <div class="ap-pn"><span><s>Park · mi 1–6</s><b>8:57</b><i>/mi</i></span><span><s>Ocean Pkwy · mi 7–13</s><b>8:38</b><i>/mi</i></span></div>
          <p>Negative split: hold back on the hills, race the flat.</p></div>
        <div class="ap-cred">${CREDITS.map(([l, a, b]) => `<span><img src="${x.brand(l)}" alt=""><s>${a}</s><b>${b}</b></span>`).join('')}</div>
      </aside>
    </main></div>`;
}
