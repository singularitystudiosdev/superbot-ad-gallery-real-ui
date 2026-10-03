// Ableton beat, the finale: superbot connects to the user's Ableton Live session, lands the mix and bounces the master.
// Its line streams, a connect card lands in the chat ("superbot connected to Ableton Live", the session it found:
// after hours v7.als, 24 tracks, 3:12, and "38 moves applied to after hours v7", three checks ticking in turn) with a mini
// window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the template's
// resolve.js. Full frame is a real-looking Ableton Live Arrangement View in the dark theme: the Control Bar (tempo 92.00,
// 4 / 4, the position, transport), the browser on the left, the arrangement (overview, bar ruler with locators, 8 coloured
// tracks whose clips carry their waveforms, the playhead, the Main track, the time ruler) with the track controls column on
// the right (name, volume, number, solo, arm, meter), the Device View of the Main track at the bottom and the status bar.
// The arrangement plays from bar 33; the moves land one by one (the volumes gain-staged, the 120 Hz high-pass badges,
// the 808 sidechained to the Kick, the hats dip, the vocal chop up with its plate send, then the Main chain: EQ Eight,
// Glue Compressor, Limiter). Live's Export Audio/Video dialog opens, the pointer presses Export, the render runs (the
// playhead sweeps the song), and the dialog flips to its done panel (.ab-ready, whose opacity rising from 0 is the
// instant render.mjs times the chime on): after hours (master).wav, 24-bit WAV, 44.1 kHz, 3:12, -14.0 LUFS, -1.0 dBTP.
// Then the toast "Mixed, mastered and bounced · Ready for Spotify" lands (.ab-toast, the settled probe). On a portrait
// frame (4:5) the window takes its narrow layout: no browser, a compact Control Bar, a single-column dialog.
//
// There is ONE Live window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes.
// There are no pictures: the waveforms, meters, EQ curve and knobs are interface and data display (bars and curves from
// fixed seeds). The type (TikTok Sans, fonts/CREDITS.txt) is loaded before this module finishes loading (top-level
// await), so timeline.js only reports window.__AD.ready once it is. Pure function of t: every moving value is written
// from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';

// ---- the type, ready before the spot reports ready ----
const asset = (p) => new URL(`../../../${p}`, import.meta.url).href;
// TikTok Sans (SIL OFL 1.1, @fontsource/tiktok-sans 5.3.0, vendored under fonts/, fonts/CREDITS.txt): the Live UI face
const FACES = [400, 500, 600, 700, 800].map((w) => new FontFace('TikTok Sans', `url("${asset(`fonts/tiktok-sans-latin-${w}-normal.woff2`)}") format("woff2")`, { weight: String(w), style: 'normal', display: 'block' }));
FACES.forEach((f) => document.fonts.add(f));
await Promise.all(FACES.map((f) => f.load()));

const SAY = 'Opened after hours v7.als in Ableton Live. Applying the mix and bouncing the master.';
const SET = { name: 'after hours v7.als', tracks: '24 tracks', dur: '3:12' };
const OUT = { file: 'after hours (master).wav', spec: '24-bit WAV, 44.1 kHz, 3:12', lufs: '-14.0 LUFS', tp: '-1.0 dBTP' };
const BPM = 92, BAR = 60 / BPM * 4;              // one bar, s (2.609)
const NBARS = 74;                                // the arrangement shown: bars 1 to 75 (the song ends at 74.6)
const SONG_BARS = 192 / BAR;                     // 3:12 in bars (73.6)
const PLAY_FROM = 33;                            // the arrangement plays from the second Hook
// the 8 visible tracks: name, colour, waveform kind, clips [from bar, to bar], volume before and after the gain staging
const TRACKS = [
  { name: 'Kick', c: '#ff8f3f', kind: 'kick', clips: [[9, 25], [25, 41], [41, 57], [65, 73]], v0: '0.0', v1: '-6.0' },
  { name: '808', c: '#f2cf3d', kind: 'bass', clips: [[9, 25], [25, 41], [41, 57], [61, 73]], v0: '0.0', v1: '-7.5' },
  { name: 'Snare', c: '#9ad65a', kind: 'snare', clips: [[9, 25], [25, 41], [41, 57], [65, 73]], v0: '-2.0', v1: '-8.0' },
  { name: 'Hats', c: '#3fd9c6', kind: 'hat', clips: [[5, 25], [25, 41], [41, 57], [57, 65], [65, 73]], v0: '0.0', v1: '-11.5' },
  { name: 'Keys', c: '#5ea8ff', kind: 'pad', clips: [[1, 9], [9, 25], [25, 41], [41, 57], [57, 65], [65, 75]], v0: '-3.0', v1: '-12.0' },
  { name: 'Pad', c: '#a98cff', kind: 'pad', clips: [[1, 9], [25, 41], [57, 65], [65, 75]], v0: '-1.0', v1: '-14.0' },
  { name: 'Vox Chop', c: '#ff74b5', kind: 'vox', clips: [[9, 25], [41, 57], [57, 65]], v0: '-8.0', v1: '-4.0' },
  { name: 'FX', c: '#a6abb4', kind: 'fx', clips: [[7, 9], [23, 25], [39, 41], [55, 57], [63, 65]], v0: '0.0', v1: '-16.0' },
];
const LOCATORS = [[1, 'Intro'], [9, 'Hook'], [25, 'Verse'], [41, 'Hook 2'], [57, 'Bridge'], [65, 'Outro']];
// the moves, in the order they land: [track index or -1, badge text, move kind]
const BADGES = [
  { at: 1, tracks: [2, 3, 4, 5, 6, 7], text: 'HP 120 Hz' },
  { at: 2, tracks: [1], text: 'Sidechain: Kick', cls: 'ab-bd-sc' },
  { at: 3, tracks: [3], text: 'EQ -2.5 dB 7 kHz', cls: 'ab-bd-eq' },
  { at: 4, tracks: [6], text: '+4 dB, Plate send', cls: 'ab-bd-up' },
];
const NMOVES = 6;                                // gain, HP, sidechain, hats dip, vox up, the Main chain
const BROWSER = [
  ['h', 'Collections'], ['f', 'Favorites', '#ff8f3f'], ['f', 'Drums', '#f2cf3d'], ['f', 'Mix', '#3fd9c6'],
  ['h', 'Library'], ['i', 'Sounds'], ['i', 'Drums'], ['i', 'Instruments'], ['i', 'Audio Effects', '', true], ['i', 'MIDI Effects'],
  ['i', 'Max for Live'], ['i', 'Plug-Ins'], ['i', 'Clips'], ['i', 'Samples'], ['i', 'Grooves'], ['i', 'Tunings'], ['i', 'Templates'],
  ['h', 'Places'], ['i', 'Packs'], ['i', 'User Library'], ['i', 'Current Project'],
];

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the window's px to frame px
// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const MV_AT = 0.2, MV_STAGGER = 0.12, MV_IN = 0.26; // full frame to the moves landing, one by one
const DEV_STAGGER = 0.08;                        // the Main chain: one device to the next
const DLG_AT = 0.95, DLG_IN = 0.22;              // full frame to the Export Audio/Video dialog opening
const PTR_AT = 1.12;                             // full frame: the dialog reads, then the pointer sets off for Export
const PTR_MOVE = 0.42;                           // the pointer travelling to Export
const PRESS_AT = 0.06;                           // arrived, then the press
const EXP_AT = 0.1, EXP = 1.5;                   // the press to the render starting; the render
const FLIP = 0.15;                               // the done panel coming in
const TOAST_AT = 0.12, TOAST_IN = 0.26;          // the export done to the toast landing
const READ = 1.8; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="ab-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const st = (d) => svg(d, 'ab-st');
const fl = (d) => svg(d, 'ab-fl');
const I = {
  play: fl('<path d="M7 5v14l12-7z"/>'),
  stop: fl('<rect x="6" y="6" width="12" height="12"/>'),
  rec: fl('<circle cx="12" cy="12" r="6"/>'),
  ovr: st('<path d="M5 12h14M12 5v14"/>'),
  loop: st('<path d="M5 11V9a3 3 0 0 1 3-3h11l-3-3M19 13v2a3 3 0 0 1-3 3H5l3 3"/>'),
  metro: st('<path d="M9 3h6l3.5 18h-13zM12 15l5-9"/>'),
  follow: st('<path d="M4 12h12M12 7l5 5-5 5M20 5v14"/>'),
  draw: st('<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>'),
  key: st('<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 11h1M11 11h1M15 11h1M8 14h8"/>'),
  midi: st('<circle cx="12" cy="12" r="8"/><circle cx="8.5" cy="11" r=".8"/><circle cx="15.5" cy="11" r=".8"/><circle cx="12" cy="8.5" r=".8"/>'),
  search: st('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>'),
  folder: st('<path d="M3.5 6.5a1 1 0 0 1 1-1h4.8l2 2h8.2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/>'),
  down: st('<path d="m7 10 5 5 5-5"/>'),
  tri: fl('<path d="M8 6v12l9-6z"/>'),
  file: st('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
  moves: st('<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3" rx=".5"/><rect x="10" y="7" width="4" height="3" rx=".5"/><rect x="16" y="10" width="4" height="3" rx=".5"/>'),
  check: '<svg class="ab-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  okc: '<svg class="ab-okc" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  save: st('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'),
  wrench: st('<path d="M14.5 6.5a4 4 0 0 0 5 5l-8 8a2.1 2.1 0 0 1-3-3z"/>'),
};
const posStr = (bars) => { const b = Math.max(0, bars); const bar = Math.floor(b) + 1, beat = Math.floor((b % 1) * 4) + 1, six = Math.floor(((b * 4) % 1) * 4) + 1; return `${bar}. ${beat}. ${six}`; };
const X = (bar) => ((bar - 1) / NBARS * 100);
// a clip's waveform: bars from a fixed seed per kind, 8 per musical bar (UI, not audio)
function wave(kind, b0, b1, seed0) {
  let seed = seed0 * 7919 + 17;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const n = Math.max(4, Math.round((b1 - b0) * 8));
  let d = '';
  for (let i = 0; i < n; i++) {
    const q = i % 2, beat = (i >> 1) % 4, bar = i >> 3;
    let h;
    if (kind === 'kick') h = q === 0 ? 0.92 : 0.28;
    else if (kind === 'bass') h = (beat === 0 || beat === 2.5) ? 0.9 : 0.55 + 0.15 * rnd();
    else if (kind === 'snare') h = (beat === 1 || beat === 3) && q === 0 ? 0.85 : 0.06;
    else if (kind === 'hat') h = 0.35 + 0.25 * rnd();
    else if (kind === 'pad') h = 0.45 + 0.22 * Math.sin(i / 11 + seed0) + 0.06 * rnd();
    else if (kind === 'vox') h = (bar % 2 === 0 && beat < 3) ? 0.35 + 0.5 * rnd() : 0.04;
    else h = 0.1 + 0.85 * (i / n) ** 2;          // fx: a riser
    h = Math.max(0.04, Math.min(0.96, h)) * 14;
    d += `M${i * 2 + 1} ${(16 - h).toFixed(1)}V${(16 + h).toFixed(1)}`;
  }
  return `<svg class="ab-wv" viewBox="0 0 ${n * 2} 32" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}
// a knob: a 270 degree track, the value arc, the pointer; label above, value under
const pt = (cx, cy, r, a) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
const arc = (cx, cy, r, a0, a1) => { const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
function knob(label, value, f) {
  const a = -135 + 270 * f, [px, py] = pt(16, 16, 7, a);
  return `<span class="ab-kn"><b>${esc(label)}</b><svg viewBox="0 0 32 32" aria-hidden="true"><path class="ab-ka" d="${arc(16, 16, 11, -135, 135)}"/>${f > 0.005 ? `<path class="ab-kv" d="${arc(16, 16, 11, -135, a)}"/>` : ''}<path class="ab-kp" d="M16 16L${px.toFixed(2)} ${py.toFixed(2)}"/></svg><i>${esc(value)}</i></span>`;
}
// the EQ Eight curve on the Main: a 30 Hz low cut, a -1 dB bell at 320 Hz, a +1.5 dB shelf from 10 kHz
const EQW = 240, EQH = 96;
function eqCurve() {
  const ys = [];
  for (let i = 0; i <= 80; i++) {
    const f = 20 * 1000 ** (i / 80);
    const db = -10 * Math.log10(1 + (30 / f) ** 4) - 1 * Math.exp(-((Math.log2(f / 320) / 0.9) ** 2)) + 1.5 / (1 + (10000 / f) ** 2);
    ys.push([i / 80 * EQW, EQH / 2 - db / 12 * (EQH / 2)]);
  }
  const d = ys.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${Math.max(0, y).toFixed(1)}`).join('');
  return { d, fill: `${d}L${EQW} ${EQH / 2}L0 ${EQH / 2}Z` };
}
const lfx = (f) => Math.log10(f / 20) / 3 * EQW;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, session found, moves applied
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: the Arrangement View, playing from bar 33
    T.mv = Array.from({ length: NMOVES }, (_, i) => T.full + MV_AT + i * MV_STAGGER); // the moves land
    T.dlg = T.full + DLG_AT;                          // Export Audio/Video opens
    T.ptr = T.full + PTR_AT;                          // the pointer sets off for Export
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;                    // the press on Export (playback stops)
    T.e0 = T.press + EXP_AT;                          // the render runs...
    T.e1 = T.e0 + EXP;                                // ...and is done (T.ready: .ab-ready, the chime)
    T.ready = T.e1;
    T.toast = T.ready + TOAST_AT;                     // "Mixed, mastered and bounced · Ready for Spotify" (.ab-toast)
    T.settle = T.toast + TOAST_IN;                    // the last visible change
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('abletonlive.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say ab-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="ab-ct ab-ct-al"><img class="ab-mark" src="${mark}" alt=""/></span>`, '<b>superbot connected to Ableton Live</b>'],
      [`<span class="ab-ct">${I.file}</span>`, `<b>${esc(SET.name)}</b><i>&middot;</i>${SET.tracks}<i>&middot;</i>${SET.dur}`],
      [`<span class="ab-ct">${I.moves}</span>`, '38 moves applied, Main chain loaded'],
    ];
    const card = x.el(`<div class="ab-card">
      ${steps.map(([icon, txt]) => `<div class="ab-step">${icon}<span class="ab-tx">${txt}</span><span class="ab-ok"><i class="ab-spin"></i>${I.check}</span></div>`).join('')}
      <div class="ab-shot"></div>
    </div>`);
    const shot = card.querySelector('.ab-shot');
    const checks = [...card.querySelectorAll('.ab-ok')].map((n) => ({ spin: n.querySelector('.ab-spin'), ck: n.querySelector('.ab-ck') }));

    // ---- the Control Bar ----
    const top = `<header class="ab-cb">
      <div class="ab-cbg ab-cb-l"><span class="ab-btn ab-w">Link</span><span class="ab-btn ab-w">Tap</span>
        <span class="ab-fld ab-tempo">92.00</span><span class="ab-dots"><i></i><i></i><i></i><i></i></span>
        <span class="ab-fld ab-sig">4 / 4</span><span class="ab-btn ab-ic">${I.metro}</span><span class="ab-fld ab-q ab-w">1 Bar ${I.down}</span></div>
      <div class="ab-cbg ab-cb-c"><span class="ab-btn ab-ic ab-w">${I.follow}</span><span class="ab-fld ab-pos">33. 1. 1</span>
        <span class="ab-btn ab-ic ab-play">${I.play}</span><span class="ab-btn ab-ic">${I.stop}</span><span class="ab-btn ab-ic ab-rec">${I.rec}</span>
        <span class="ab-btn ab-ic ab-w">${I.ovr}</span><span class="ab-btn ab-ic ab-w">${I.draw}</span></div>
      <div class="ab-cbg ab-cb-r"><span class="ab-fld ab-w">1. 1. 1</span><span class="ab-btn ab-ic">${I.loop}</span><span class="ab-fld ab-w">4. 0. 0</span>
        <span class="ab-btn ab-ic ab-w">${I.key}</span><span class="ab-btn ab-ic ab-w">${I.midi}</span><span class="ab-cpu">12 %</span></div>
    </header>`;

    // ---- the browser ----
    const browser = `<aside class="ab-br">
      <div class="ab-bs">${I.search}<span>Search</span></div>
      <nav class="ab-bl">${BROWSER.map(([kind, label, c, on]) => kind === 'h' ? `<span class="ab-bh">${label}</span>`
        : kind === 'f' ? `<span class="ab-bi"><i class="ab-bdot" style="background:${c}"></i>${label}</span>`
        : `<span class="ab-bi${on ? ' on' : ''}">${I.folder}${label}</span>`).join('')}</nav>
    </aside>`;

    // ---- the arrangement ----
    const ruler = [];
    for (let b = 1; b <= NBARS; b += 4) ruler.push(`<span class="ab-rm${(b - 1) % 8 ? ' ab-rm-odd' : ''}" style="left:${X(b).toFixed(3)}%"><b>${b}</b></span>`);
    const times = [];
    for (let s = 0; s <= 180; s += 30) times.push(`<span class="ab-tm${s % 60 ? ' ab-rm-odd' : ''}" style="left:${(s / BAR / NBARS * 100).toFixed(3)}%"><b>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</b></span>`);
    const locs = LOCATORS.map(([b, n]) => `<span class="ab-loc" style="left:${X(b).toFixed(3)}%">${I.tri}<b>${n}</b></span>`).join('');
    const lane = (tr, ti) => `<div class="ab-lane" style="--c:${tr.c}">${tr.clips.map(([a, b], ci) => `<span class="ab-clip" style="left:${X(a).toFixed(3)}%;width:${((b - a) / NBARS * 100).toFixed(3)}%"><b>${esc(tr.name)}</b>${wave(tr.kind, a, b, ti * 11 + ci + 1)}</span>`).join('')}
      <span class="ab-bds">${BADGES.filter((bd) => bd.tracks.includes(ti)).map((bd) => `<span class="ab-bd ${bd.cls || ''}" data-mv="${bd.at}">${esc(bd.text)}</span>`).join('')}</span></div>`;
    const head = (tr, ti) => `<div class="ab-th" style="--c:${tr.c}"><span class="ab-tn">${I.tri}<b>${esc(tr.name)}</b></span>
      <span class="ab-vol" data-v0="${tr.v0}" data-v1="${tr.v1}">${tr.v0}</span><span class="ab-num">${ti + 1}</span><span class="ab-sb">S</span><span class="ab-arm">${I.rec}</span><span class="ab-mt"><i></i></span></div>`;
    const arr = `<section class="ab-arr">
      <div class="ab-lanes">
        <div class="ab-ov"><i></i></div>
        <div class="ab-ruler">${ruler.join('')}</div>
        <div class="ab-scrub">${locs}</div>
        <div class="ab-tracks">${TRACKS.map(lane).join('')}</div>
        <div class="ab-fill"></div>
        <div class="ab-lane ab-lane-main"></div>
        <div class="ab-truler">${times.join('')}</div>
        <i class="ab-ph"><i></i></i>
      </div>
      <div class="ab-heads">
        <div class="ab-hov"></div>
        <div class="ab-hru"><span class="ab-mini">Del</span><span class="ab-mini">${I.loop}</span></div>
        <div class="ab-hsc"></div>
        <div class="ab-tracks ab-tracks-h">${TRACKS.map(head).join('')}</div>
        <div class="ab-fill"></div>
        <div class="ab-th ab-th-main"><span class="ab-tn">${I.tri}<b>Main</b></span><span class="ab-vol">0.0</span><span class="ab-cue">1/2</span><span class="ab-mt"><i></i></span></div>
        <div class="ab-hzoom"><span class="ab-mini">H</span><span class="ab-mini">W</span></div>
      </div>
    </section>`;

    // ---- the Device View of the Main track ----
    const eq = eqCurve();
    const bands = [[30, -12, 1], [320, -1, 4], [10000, 1.5, 8]];
    const dev = (cls, name, body) => `<div class="ab-dev ${cls}"><div class="ab-dh"><i class="ab-act"></i><b>${name}</b><span class="ab-dhr">${I.save}${I.wrench}</span></div><div class="ab-db">${body}</div></div>`;
    const eqBody = `<div class="ab-eqd"><svg viewBox="0 0 ${EQW} ${EQH}" preserveAspectRatio="none" aria-hidden="true">
        ${[100, 1000, 10000].map((f) => `<path class="ab-gl" d="M${lfx(f).toFixed(1)} 0V${EQH}"/>`).join('')}<path class="ab-gl ab-gl0" d="M0 ${EQH / 2}H${EQW}"/>
        <path class="ab-eqf" d="${eq.fill}"/><path class="ab-eqc" d="${eq.d}"/></svg>
        ${bands.map(([f, db, n]) => `<span class="ab-band" style="left:${(lfx(f) / EQW * 100).toFixed(2)}%;top:${((0.5 - Math.max(-11, db) / 24) * 100).toFixed(2)}%">${n}</span>`).join('')}
        <span class="ab-eqx"><s>100</s><s>1k</s><s>10k</s></span></div>
      <div class="ab-eqp"><div class="ab-eqb">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<span class="${[1, 4, 8].includes(n) ? 'on' : ''}">${n}</span>`).join('')}</div>
        <div class="ab-kns">${knob('Freq', '320 Hz', 0.42)}${knob('Gain', '-1.00 dB', 0.46)}${knob('Q', '0.71', 0.3)}</div></div>`;
    const glueBody = `<div class="ab-kns ab-kgrid">${knob('Threshold', '-14.0 dB', 0.6)}${knob('Ratio', '2', 0.25)}${knob('Attack', '10.0 ms', 0.55)}${knob('Release', 'Auto', 1)}${knob('Makeup', '1.50 dB', 0.15)}${knob('Dry/Wet', '100 %', 1)}</div>
      <div class="ab-gr"><svg viewBox="0 0 80 50" aria-hidden="true"><path class="ab-gra" d="${arc(40, 44, 34, -60, 60)}"/>${[-60, -40, -20, 0, 20, 40, 60].map((a) => { const [x0, y0] = pt(40, 44, 30, a), [x1, y1] = pt(40, 44, 35, a); return `<path class="ab-grt" d="M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}"/>`; }).join('')}<path class="ab-needle" d="M40 44L40 14"/></svg><b>GR</b></div>`;
    const limBody = `<div class="ab-kns ab-kgrid2">${knob('Gain', '2.80 dB', 0.3)}${knob('Ceiling', '-1.00 dB', 0.92)}${knob('Release', 'Auto', 1)}${knob('Lookahead', '3 ms', 0.5)}</div>
      <div class="ab-lim"><span class="ab-tp on">True Peak</span><span class="ab-lgr"><i></i></span></div>`;
    const devs = `<section class="ab-dv"><div class="ab-dvs">
      ${dev('ab-d-eq', 'EQ Eight', eqBody)}${dev('ab-d-glue', 'Glue Compressor', glueBody)}${dev('ab-d-lim', 'Limiter', limBody)}
      <div class="ab-drop">Drop Audio Effects Here</div></div></section>`;
    const status = `<footer class="ab-sbar"><span class="ab-msg">${esc(SET.name)}</span><span class="ab-sr"><b>Main</b></span></footer>`;

    // ---- Export Audio/Video ----
    const row = (label, val, kind = 'sel', cls = '') => `<div class="ab-xr ${cls}"><span>${label}</span>${kind === 'sel' ? `<span class="ab-xs">${val}${I.down}</span>` : `<span class="ab-xt${val === 'On' ? ' on' : ''}">${val}</span>`}</div>`;
    const dialog = `<div class="ab-dlg">
      <div class="ab-xh">Export Audio/Video</div>
      <div class="ab-xbody">
        <div class="ab-xcols">
          <div class="ab-xcol"><span class="ab-xg">Selection</span>${row('Rendered Track', 'Main')}${row('Render Start', '1. 1. 1', 'sel', 'ab-xn')}${row('Render Length', '73. 2. 2', 'sel', 'ab-xn')}
            <span class="ab-xg">Rendering Options</span>${row('Include Return and Main Effects', 'On', 't', 'ab-xn')}${row('Render as Loop', 'Off', 't', 'ab-xn')}${row('Convert to Mono', 'Off', 't')}${row('Normalize', 'Off', 't')}${row('Sample Rate', '44100')}</div>
          <div class="ab-xcol"><span class="ab-xg">Audio Encoding</span>${row('Encode PCM', 'On', 't', 'ab-xn')}${row('File Type', 'WAV')}${row('Bit Depth', '24')}${row('Dither Options', 'No Dither', 'sel', 'ab-xn')}${row('Encode MP3', 'Off', 't', 'ab-xn')}</div>
        </div>
        <div class="ab-xf"><span class="ab-xbtn">Cancel</span><span class="ab-xbtn ab-xgo">Export</span></div>
        <div class="ab-xp"><span class="ab-xpl"><b>Exporting</b> ${esc(OUT.file)}</span><span class="ab-xbar"><i></i></span><span class="ab-xpc">0%</span></div>
      </div>
      <div class="ab-xdone ab-ready">${I.okc}<div class="ab-xdt"><span class="ab-xd1">Export complete</span><b>${esc(OUT.file)}</b><span>${esc(OUT.spec)}</span><span class="ab-xld">${esc(OUT.lufs)}<i>&middot;</i>${esc(OUT.tp)}</span></div></div>
    </div>`;
    const toast = `<div class="ab-toast">${I.okc}<b>Mixed, mastered and bounced</b><i>&middot;</i><span>Ready for Spotify</span></div>`;

    const layer = x.el(`<div class="ab-full" aria-hidden="true"><div class="ab-app">${top}<div class="ab-body">${browser}<div class="ab-main">${arr}${devs}</div></div>${status}${dialog}${toast}</div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const $$ = (s) => [...app.querySelectorAll(s)];
    const go = $('.ab-xgo'), toastEl = $('.ab-toast'), dlg = $('.ab-dlg');
    const xf = $('.ab-xf'), xp = $('.ab-xp'), xbar = $('.ab-xbar i'), xpc = $('.ab-xpc'), xbody = $('.ab-xbody'), xdone = $('.ab-xdone');
    const vols = $$('.ab-tracks-h .ab-vol').map((n) => ({ n, v0: parseFloat(n.dataset.v0), v1: parseFloat(n.dataset.v1), s: '' }));
    const badges = $$('.ab-bd').map((n) => ({ n, at: +n.dataset.mv }));
    const devEls = $$('.ab-dev'), drop = $('.ab-drop');
    const meters = $$('.ab-tracks-h .ab-mt i'), mainMeter = $('.ab-th-main .ab-mt i');
    const needle = $('.ab-needle'), lgr = $('.ab-lgr i');
    const ph = $('.ab-ph'), pos = $('.ab-pos'), playBtn = $('.ab-play'), msg = $('.ab-msg');
    const dots = $$('.ab-dots i');
    let lastPos = '', lastMsg = '', lastPc = '';

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tallMode = false;
    let AW = 1536, AH = 864;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tallMode = W < H;
      const s = tallMode ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('ab-narrow', tallMode);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('ab-tall', tallMode);
    };

    // Export's centre in the window's own px (transform-free: the window's rect over its current scale). The button row
    // is hidden while the render runs and the done panel shows, so it is laid out for the measurement and hidden again.
    const btnPt = () => {
      const hidden = [xf, xbody].filter((n) => n.style.display === 'none');
      hidden.forEach((n) => { n.style.display = ''; });
      const a = app.getBoundingClientRect(), b = go.getBoundingClientRect();
      hidden.forEach((n) => { n.style.display = 'none'; });
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.45) / sc, y: (b.top - a.top + b.height * 0.6) / sc };
    };
    const rise = (n, q, dy = 8) => { n.style.opacity = q.toFixed(3); n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * dy).toFixed(2)}px)`; };
    // the song position at t, in bars from bar 1: plays from bar 33 at 92 BPM until the press; the render sweeps the
    // whole song; done, it rests at the end
    const songPos = (t) => {
      if (t < T.press) return PLAY_FROM - 1 + Math.max(0, t - T.full) / BAR;
      if (t < T.e0) return 0;
      return SONG_BARS * Math.min(1, (t - T.e0) / EXP);
    };
    // a deterministic level per track kind at song position b (bars): kicks on the beat, snares on 2 and 4...
    const level = (kind, b, i) => {
      const beat = (b * 4) % 1, half = (b * 8) % 1, n = Math.floor(b * 4);
      const wob = 0.5 + 0.5 * Math.sin(n * 2.3 + i);
      if (kind === 'kick') return 0.85 * Math.exp(-beat * 5);
      if (kind === 'bass') return 0.6 + 0.25 * Math.exp(-beat * 3);
      if (kind === 'snare') return n % 2 ? 0.8 * Math.exp(-beat * 6) : 0.05;
      if (kind === 'hat') return 0.4 + 0.2 * Math.exp(-half * 6);
      if (kind === 'pad') return 0.45 + 0.1 * wob;
      if (kind === 'vox') return (Math.floor(b) % 2 === 0 ? 0.5 + 0.3 * wob : 0.06);
      return 0.15 + 0.2 * wob;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // ---- the moves land: gain staging, badges, the Main chain ----
        const g = outCubic(seg(t, T.mv[0], T.mv[0] + MV_IN + 0.1));
        vols.forEach((v) => {
          const s = lerp(v.v0, v.v1, g).toFixed(1);
          if (s !== v.s) { v.n.textContent = s === '-0.0' ? '0.0' : s; v.s = s; }
          v.n.classList.toggle('ab-hot', t >= T.mv[0] && t < T.mv[0] + 0.6);
        });
        badges.forEach((b) => rise(b.n, outCubic(seg(t, T.mv[b.at], T.mv[b.at] + MV_IN)), 6));
        devEls.forEach((d, i) => { const a = T.mv[5] + i * DEV_STAGGER; rise(d, outCubic(seg(t, a, a + MV_IN)), 10); });
        const landed = T.mv.filter((a) => t >= a).length;
        const m = t >= T.ready ? `Exported ${OUT.file}` : t >= T.e0 ? `Exporting ${OUT.file}` : landed >= NMOVES ? '38 moves applied across 24 tracks' : landed ? `Applying moves: ${landed} of ${NMOVES}` : SET.name;
        if (m !== lastMsg) { msg.textContent = m; lastMsg = m; }

        // ---- the transport: playing from bar 33, stopped at the press; the render sweeps the playhead ----
        const b = songPos(t);
        ph.style.setProperty('--p', (b / NBARS).toFixed(5));
        const ps = posStr(b);
        if (ps !== lastPos) { pos.textContent = ps; lastPos = ps; }
        const playing = t >= T.full && t < T.press;
        const rendering = t >= T.e0 && t < T.e1;
        playBtn.classList.toggle('on', playing);
        const beatN = Math.floor(b * 4) % 4;
        dots.forEach((d, i) => d.classList.toggle('on', (playing || rendering) && i === beatN));
        const live = playing || rendering;
        meters.forEach((mt, i) => {
          const tr = TRACKS[i];
          const inClip = tr.clips.some(([a, c]) => b + 1 >= a && b + 1 < c);
          const lv = live && inClip ? level(tr.kind, b, i) : 0;
          mt.style.transform = `scaleY(${lv.toFixed(3)})`;
        });
        mainMeter.style.transform = `scaleY(${(live ? 0.78 + 0.12 * Math.exp(-((b * 4) % 1) * 4) : 0).toFixed(3)})`;
        // the Main chain's gain reduction moves with the beat once it is loaded
        const chain = live && t >= T.mv[5];
        const gr = chain ? 0.35 + 0.65 * Math.exp(-((b * 4) % 1) * 4) : 0;
        needle.style.transform = `rotate(${(-40 * gr).toFixed(2)}deg)`;
        lgr.style.transform = `scaleY(${(chain ? 0.25 + 0.3 * gr : 0).toFixed(3)})`;

        // ---- Export Audio/Video: opens, Export pressed, the render runs, the done panel ----
        const dq = outCubic(seg(t, T.dlg, T.dlg + DLG_IN));
        dlg.style.opacity = dq.toFixed(3);
        dlg.style.transform = `translate(-50%, -50%) scale(${lerp(0.96, 1, dq).toFixed(4)})`;
        const pr = press(t, T.press);
        go.style.transform = pr > 0 ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : '';
        go.classList.toggle('on', t >= T.press);
        const exporting = t >= T.e0;
        xf.style.display = exporting ? 'none' : '';
        xp.style.display = exporting ? '' : 'none';
        const p = seg(t, T.e0, T.e1);
        xbar.style.transform = `scaleX(${p.toFixed(4)})`;
        const pc = `${Math.min(99, Math.floor(p * 100))}%`;
        if (pc !== lastPc) { xpc.textContent = pc; lastPc = pc; }
        const dn = outCubic(seg(t, T.ready, T.ready + FLIP));
        xdone.style.display = t >= T.ready ? '' : 'none';
        xdone.style.opacity = t >= T.ready ? dn.toFixed(3) : '0';
        xbody.style.display = t >= T.ready ? 'none' : '';
        app.classList.toggle('ab-all', t >= T.ready);
        const to = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        toastEl.style.opacity = to.toFixed(3);
        toastEl.style.transform = `translate(-50%, ${((1 - to) * -14).toFixed(2)}px)`;
      },
      // the pointer: it sets off from the arrangement for Export, presses it, and fades as the render runs.
      // In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (t < T.ptr - 0.15 || t > T.press + 0.8) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const bp = btnPt();
        const from = { x: bp.x - (tallMode ? 200 : 380), y: bp.y - (tallMode ? 240 : 220) };
        const mm = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.press + 0.5, T.press + 0.8));
        return { x: lerp(from.x, bp.x, mm) * s, y: lerp(from.y, bp.y, mm) * s, p: press(t, T.press), v };
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
