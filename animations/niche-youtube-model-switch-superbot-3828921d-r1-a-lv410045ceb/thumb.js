// The creator's video, drawn for this spot as 1280x720 SVGs: its thumbnail ("I tested 12 budget mics under $100",
// shown in Gemini's card) and the paused frame at 7:05, the side-by-side room-echo test Sam's pinned reply points to
// (shown in the YouTube player).
import { ICON } from './icons.js';
import { rand } from './lib.js';

const FONT = `font-family="'SF Pro Rounded', ui-rounded, 'Arial Rounded MT Bold', system-ui, sans-serif"`;

export const thumbSVG = (uid) => `<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${FONT}>
  <defs>
    <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1b2e"/><stop offset=".55" stop-color="#161233"/><stop offset="1" stop-color="#2a0f2f"/>
    </linearGradient>
    <radialGradient id="${uid}-spot" cx=".74" cy=".46" r=".46">
      <stop offset="0" stop-color="#ffd21f" stop-opacity=".38"/><stop offset="1" stop-color="#ffd21f" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#${uid}-bg)"/>
  <rect width="1280" height="720" fill="url(#${uid}-spot)"/>
  <text x="60" y="250" font-size="196" font-weight="900" fill="#fff" letter-spacing="-5">12 MICS</text>
  <text x="66" y="372" font-size="104" font-weight="800" fill="#e9edf5" letter-spacing="-1">UNDER</text>
  <text x="56" y="596" font-size="236" font-weight="900" fill="#ffd21f" letter-spacing="-8">$100</text>
  <g transform="translate(910 16) scale(12)" fill="#fff" color="#fff">${ICON.mic}</g>
  <!-- above y 480: YouTube's duration badge covers the thumbnail's bottom-right corner (x > 840, y > 495) -->
  <g transform="translate(1056 404) rotate(-8)">
    <rect x="-130" y="-72" width="260" height="144" rx="28" fill="#ffd21f"/>
    <text x="0" y="40" text-anchor="middle" font-size="118" font-weight="900" fill="#111" letter-spacing="-3">$49</text>
  </g>
  <g transform="translate(880 330) rotate(-14)">
    <rect x="-74" y="-30" width="148" height="60" rx="30" fill="#ff2d55"/>
    <text x="0" y="15" text-anchor="middle" font-size="42" font-weight="900" fill="#fff" letter-spacing="3">BEST</text>
  </g>
</svg>`;

// a speech take: four bursts, each bar's height from a fixed seed; echo stretches every burst's tail
function wave(x0, seed, echo) {
  const bars = [];
  for (let i = 0; i < 46; i++) {
    const ph = (i % 11.5) / 11.5;                       // position inside a burst
    const body = ph < 0.42 ? Math.sin((ph / 0.42) * Math.PI) : 0;
    const tail = ph >= 0.42 ? Math.exp(-(ph - 0.42) * (echo ? 3.2 : 16)) * (echo ? 0.62 : 0.3) : 0;
    const h = Math.max(6, (0.25 + 0.75 * rand(seed + i)) * 160 * Math.max(body, tail));
    bars.push(`<rect x="${x0 + i * 11}" y="${(430 - h / 2).toFixed(1)}" width="6.5" height="${h.toFixed(1)}" rx="3.2"/>`);
  }
  return bars.join('');
}

// the controls cover the frame's bottom ~90 units, so everything that must read sits above y 600
export const frameSVG = () => `<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${FONT}>
  <rect width="1280" height="720" fill="#0e1116"/>
  <text x="640" y="110" text-anchor="middle" font-size="60" font-weight="900" fill="#e9edf5" letter-spacing="2">SAME ROOM, SAME SENTENCE</text>
  <text x="640" y="176" text-anchor="middle" font-size="38" font-weight="700" fill="#8b95a5">untreated 3 x 4 m bedroom, no foam</text>
  <rect x="60" y="236" width="560" height="372" rx="26" fill="#161b22" stroke="#ffd21f" stroke-width="4"/>
  <rect x="660" y="236" width="560" height="372" rx="26" fill="#161b22" stroke="#2a3140" stroke-width="3"/>
  <text x="96" y="306" font-size="50" font-weight="900" fill="#ffd21f">$49 DYNAMIC</text>
  <text x="696" y="306" font-size="50" font-weight="900" fill="#fff">$99 CONDENSER</text>
  <g fill="#ffd21f">${wave(88, 11, false)}</g>
  <g fill="#8ab4f8">${wave(688, 11, true)}</g>
  <text x="96" y="574" font-size="40" font-weight="800" fill="#34d399">ROOM ECHO  -18 dB</text>
  <text x="696" y="574" font-size="40" font-weight="800" fill="#ff6b6b">ROOM ECHO  -6 dB</text>
</svg>`;
