// Structured-workout graph, the shape a watch shows for a session: one bar per step, width = the step's minutes,
// height = how hard it runs. Drawn from a workout's steps (plan-data.js), so the graph is the workout, not a picture.
import { LIFT } from './plan-data.js?v=a64638a7';

// zone colours on the dark superbot cards and on Strava's light calendar
export const ZC = {
  dark: { J: '#4a4a52', E: '#8d93a3', RP: '#ffb47e', T: '#ff8b45', I: '#fc5200', R: '#e8341c' },
  onOr: { J: 'rgba(255,255,255,0.3)', E: 'rgba(255,255,255,0.5)', RP: '#ffffff', T: '#ffffff', I: '#ffffff', R: '#ffffff' },
  light: { J: '#cfd0d6', E: '#a3a6b0', RP: '#f59e57', T: '#f0712a', I: '#e04800', R: '#c42d16' },
};

// steps -> <svg> string; w/h in px, gap between steps in px; cls tags the svg for the reveal clip
export function structSvg(steps, w, h, { theme = 'dark', gap = 1, cls = '' } = {}) {
  const tot = steps.reduce((a, s) => a + s.min, 0);
  const free = w - gap * (steps.length - 1);
  let x = 0;
  const rects = steps.map((s) => {
    const sw = Math.max(1, (s.min / tot) * free), sh = Math.max(2, LIFT[s.z] * h);
    const r = `<rect x="${x.toFixed(2)}" y="${(h - sh).toFixed(2)}" width="${sw.toFixed(2)}" height="${sh.toFixed(2)}" rx="1" fill="${ZC[theme][s.z]}"/>`;
    x += sw + gap;
    return r;
  });
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${rects.join('')}</svg>`;
}

// a session's running time in minutes, rounded
export const minutes = (steps) => Math.round(steps.reduce((a, s) => a + s.min, 0));
