// The Pocketsflow launch film this ad is about: the 15s, 16:9 spot the chat's six models make together, built by hand
// for this variant (Satoshi + Geist Mono, Pocketsflow's own type; white, ink and its #ffd43b yellow). Every claim in
// it is pocketsflow.com's own (fetched 2026-10-05): product pages in minutes, Apple Pay and discount checkout,
// merchant of record for tax and VAT, the $2,480 / 63 orders demo week, 65K+ / 160+ / $70M+.
//
// One component, many hosts: the X post plays it, the storyboard freezes it at each shot's key frame, the Hailuo clip
// plays one shot, the Remotion studio previews it and the final player plays it. mountFilm(host) lays the film out
// at 1280x720 and scales it to the host's width; set(t) paints film time t from scratch (no carried state), so any
// host at any t shows the same pixels.
import { clamp } from '../lib.js';
import { hook, page, checkout } from './shots-a.f2628f01.js';
import { globe, payouts, lockup, LOCK_WIPE } from './shots-b.f2628f01.js';

export const FILM_W = 1280, FILM_H = 720, FILM_DUR = 15;

// the script DeepSeek writes, the frames Nano Banana draws, the lines ElevenLabs reads and the sequences Opus cuts:
// one table, so every card in the chat agrees with the film
export const SHOTS = [
  { id: 'hook', name: 'Hook', t0: 0, t1: 2.6, key: 2.2, vo: 'You made the thing. Now sell it.', see: 'Four creator products drop onto white', src: 'pocketsflow.com' },
  { id: 'page', name: 'Product page', t0: 2.6, t1: 5.2, key: 4.9, vo: 'Your product page, live in minutes.', see: 'Form fills, the live page builds beside it', src: '/#create' },
  { id: 'checkout', name: 'Checkout', t0: 5.2, t1: 7.8, key: 7.5, vo: 'Checkout that converts. Apple Pay, built in.', see: 'Apple Pay sheet, LAUNCH20, Face ID', src: '/#checkout' },
  { id: 'global', name: 'Global tax', t0: 7.8, t1: 10.2, key: 9.9, vo: 'Tax, VAT and fraud, handled in 160 countries.', see: 'Orders ping across a dotted world map', src: '/#merchant-of-record' },
  { id: 'payouts', name: 'Payouts', t0: 10.2, t1: 12.6, key: 12.3, vo: 'Get paid. Watch it grow.', see: '$2,480 week counts up, sales stack in', src: '/#dashboard' },
  { id: 'lockup', name: 'Logo', t0: 12.6, t1: 15, key: 14.6, vo: 'Pocketsflow. The payment infrastructure you deserve.', see: 'Yellow wipe, PF mark, 65K+ / 160+ / $70M+', src: 'pocketsflow.com' },
];
const BUILD = [hook, page, checkout, globe, payouts, lockup];

export const shotAt = (t) => { let i = 0; SHOTS.forEach((s, j) => { if (t >= s.t0) i = j; }); return i; };
export const tc = (s) => `0:${s < 10 ? '0' : ''}${s.toFixed(1)}`;

let uid = 0;
export function mountFilm(host) {
  host.classList.add('pff-host');
  const root = document.createElement('div');
  root.className = 'pff';
  const id = `f${++uid}`;
  const shots = BUILD.map((b, i) => {
    const sec = document.createElement('section');
    sec.className = `pff-s pff-${SHOTS[i].id}`;
    root.appendChild(sec);
    return { sec, api: b.build(sec, `${id}s${i}`), on: false };
  });
  host.appendChild(root);
  let lastT = NaN, lastW = -1;
  return {
    root,
    set(t) {
      const w = host.clientWidth;
      if (!w) return;
      if (w !== lastW) { root.style.transform = `scale(${(w / FILM_W).toFixed(5)})`; lastW = w; }
      t = clamp(t, 0, FILM_DUR - 1e-3);
      if (t === lastT) return;
      lastT = t;
      const i = shotAt(t);
      // the lockup's yellow wipe travels over the last frame of the payouts shot
      const under = i === 5 && t - SHOTS[5].t0 < LOCK_WIPE ? 4 : -1;
      shots.forEach((s, j) => { const on = j === i || j === under; if (on !== s.on) { s.sec.classList.toggle('on', on); s.on = on; } });
      if (under >= 0) shots[under].api.render(SHOTS[under].t1 - SHOTS[under].t0);
      shots[i].api.render(t - SHOTS[i].t0);
    },
  };
}
