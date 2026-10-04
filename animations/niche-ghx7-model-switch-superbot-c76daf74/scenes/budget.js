// The ghx7 beat budget: the storyboard (bible) as spot time in seconds, 30 fps, 444 frames, 14.80 s total.
// timeline.js lays one <section class="scene" id="s-<id>"> per beat from this table; every scene module reports its
// own dur from here (`import { dur } from './budget.js'`), so the spot's length is fixed no matter what a scene does.
export const FPS = 30;
export const TOTAL = 14.80;        // hard cap 14.9; 444 frames @30 fps
export const TOTAL_FRAMES = 444;

export const BEATS = [
  { id: 'a', name: 'inbox',        t0: 0.00, t1: 0.90, caption: '23 comments. Still logging people out.' },
  { id: 'b', name: 'chat',         t0: 0.90, t1: 1.90, caption: null },
  { id: 'c', name: 'issue',        t0: 1.90, t1: 2.90, caption: null },
  { id: 'd', name: 'race',         t0: 2.90, t1: 8.10, caption: 'Same failing test. Three models.' },
  { id: 'e', name: 'files',        t0: 8.10, t1: 9.50, caption: null },
  { id: 'f', name: 'checks',       t0: 9.50, t1: 11.30, caption: 'CI turns green.' },
  { id: 'g', name: 'conversation', t0: 11.30, t1: 12.60, caption: 'PR opened.' },
  { id: 'h', name: 'board',        t0: 12.60, t1: 13.20, caption: null },
  { id: 'i', name: 'end',          t0: 13.20, t1: 14.80, caption: null },
];

export const byId = (id) => BEATS.find((b) => b.id === id);
export const dur = (id) => { const b = byId(id); return b ? +(b.t1 - b.t0).toFixed(4) : 1; };
export const t0 = (id) => { const b = byId(id); return b ? b.t0 : 0; };