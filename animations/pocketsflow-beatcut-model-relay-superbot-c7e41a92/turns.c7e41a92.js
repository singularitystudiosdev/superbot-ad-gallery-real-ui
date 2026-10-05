// What Superbot says in the chat column while the workspace runs, and the composer (typing, send,
// and the model chip naming whichever model the turn is routed to right now).
import { userBubble, answer, switchPill, stepRow, attach, tileImg } from './thread.c7e41a92.js';
import { mascot } from './icons.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';
import { PEAKS } from './score.c7e41a92.js';
import { E, D, G, B, O, T, ROUTES } from './plan.c7e41a92.js';

export const ASK = 'make a launch video for Pocketsflow. cut every shot to the beat.';

function miniWave() {
  const n = 64, step = Math.floor(PEAKS.length / n);
  return `<svg class="mw" viewBox="0 0 ${n * 3} 20">${Array.from({ length: n }, (_, i) => {
    const a = Math.max(1.5, (PEAKS[i * step] / 100) * 9);
    return `<rect x="${i * 3}" y="${(10 - a).toFixed(1)}" width="2" height="${(2 * a).toFixed(1)}" rx="1"/>`;
  }).join('')}</svg>`;
}

export function buildTurns(thread) {
  const P = (logo, bg) => tileImg(logo, bg);
  thread.add(userBubble(ASK), T.ubub);
  thread.add(answer('Score first, so every cut has a beat to land on. Then the words, the pictures, the 3D and the code, each from the model built for it.', T.ans0), T.ans0, { gap: 14 });

  thread.add(switchPill({ tile: P('brand/elevenlabs-logo.svg', '#000'), a: 'Connecting to ElevenLabs', b: 'Scored with Eleven Music' }, { in: E, done: E + 5.0 }), E, { gap: 18 });
  thread.add(stepRow({ run: 'Composing 0:16 at 120 BPM', done: 'Composed 4 takes at 120 BPM' }, { done: E + 2.5 }), E + 0.35, { gap: 8 });
  thread.add(stepRow({ run: 'Finding the bars and the drop', done: 'Drop on bar 3, picked take 4' }, { done: E + 3.4 }), E + 2.5, { gap: 4 });
  thread.add(attach(`${miniWave()}<span class="an">pocketsflow-launch.mp3</span><em>0:17 · 120 BPM</em>`), E + 3.5, { gap: 8 });

  thread.add(switchPill({ tile: P('brand/deepseek-logo.svg', '#fff'), a: 'Switching to DeepSeek V4', b: 'Researched with DeepSeek V4' }, { in: D, done: D + 5.0 }), D, { gap: 18 });
  thread.add(stepRow({ run: 'Scraping gumroad.com and pocketsflow.com pricing', done: 'Scraped both pricing pages' }, { done: D + 1.7 }), D + 0.3, { gap: 8 });
  thread.add(stepRow({ run: 'Reddit answered 403, retrying in a real browser', done: 'Read 40 Reddit threads on Gumroad fees' }, { done: D + 2.4 }), D + 1.75, { gap: 4 });
  thread.add(stepRow({ run: 'Writing 7 lines, one per bar', done: 'Wrote 7 lines, one per bar' }, { done: D + 4.8 }), D + 2.45, { gap: 4 });
  thread.add(attach('<span class="aq">“Gumroad keeps $10.50 of every $100 you sell.”</span>'), D + 4.9, { gap: 8 });

  thread.add(switchPill({ tile: P('brand/gemini-logo.svg', '#fff'), a: 'Switching to Nano Banana Pro', b: 'Created with Nano Banana Pro' }, { in: G, done: G + 4.4 }), G, { gap: 18 });
  thread.add(stepRow({ run: 'Creating 4 stills, 16:9 at 2K', done: 'Created 4 stills, 16:9 at 2K' }, { done: G + 2.2 }), G + 0.3, { gap: 8 });
  thread.add(stepRow({ run: 'Checking the text inside each image', done: 'Text reads clean in 3 of 4, using those' }, { done: G + 4.2 }), G + 2.3, { gap: 4 });
  thread.add(attach(['nb1', 'nb2', 'nb4'].map((n) => `<img class="th" src="img/${n}-sm.jpg" alt="">`).join('')), G + 4.3, { gap: 8 });

  thread.add(switchPill({ tile: P('brand/blender-logo.svg', '#1d1d1f'), a: 'Connecting to Blender', b: 'Modeled in Blender' }, { in: B, done: B + 5.4 }), B, { gap: 18 });
  thread.add(stepRow({ run: 'Modeling the PF icon from the brand font', done: 'Modeled the PF icon, 2 objects' }, { done: B + 2.1 }), B + 0.3, { gap: 8 });
  thread.add(stepRow({ run: 'Rendering 60 frames in Cycles', done: 'Rendered 60 frames in Cycles' }, { done: B + 5.4 }), B + 2.2, { gap: 4 });
  thread.add(attach('<img class="th wide" src="blender/s6.jpg" alt=""><span class="an">pf-icon.blend</span><em>60 frames · 1920×1080</em>'), B + 5.45, { gap: 8 });

  thread.add(switchPill({ tile: P('brand/claude-logo-orange.svg', '#1f1e1d'), a: 'Switching to Claude Opus 5.5', b: 'Coded with Claude Opus 5.5' }, { in: O, done: O + 6.1 }), O, { gap: 18 });
  thread.add(stepRow({ run: 'Building the checkout and payouts in React', done: 'Built Checkout.tsx and Payouts.tsx' }, { done: O + 3.6 }), O + 0.3, { gap: 8 });
  thread.add(stepRow({ run: 'Cutting LaunchFilm.tsx on the bar grid', done: 'Cut 7 scenes on 7 bars' }, { done: O + 4.9 }), O + 3.6, { gap: 4 });
  thread.add(stepRow({ run: 'Rendering 1920×1080 at 30 fps', done: 'Rendered launch.mp4' }, { done: O + 6.1 }), O + 4.95, { gap: 4 });

  thread.add(answer('Done. <b>launch.mp4</b>, 14 seconds, every cut on a beat.', T.ans1), T.ans1, { gap: 16 });
  thread.add(attach('<img class="th wide" src="img/nb4-sm.jpg" alt=""><span class="an">launch.mp4</span><em>1920×1080 · 0:14</em>'), T.ans1 + 0.35, { gap: 8 });
}

/** Keystroke times with a little human jitter (deterministic). */
export function keystrokes(text, t0, t1) {
  const out = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const weights = [...text].map((c) => (c === ' ' ? 1.6 : c === '.' ? 2.2 : 0.7 + rnd() * 0.8));
  const total = weights.reduce((a, w) => a + w, 0);
  let acc = 0;
  for (const w of weights) out.push(t0 + ((acc += w) / total) * (t1 - t0));
  return out;
}

export function composerMotion(t, ui, strokes, cache) {
  const n = t >= T.send ? 0 : strokes.filter((s) => s <= t).length;
  ui.typed.textContent = ASK.slice(0, n);
  ui.ph.style.opacity = n || (t >= T.type && t < T.send) ? '0' : '1';
  ui.caret.style.opacity = t < T.send && Math.floor(t * 2.2) % 2 === 0 ? '1' : '0';
  const lit = n > 0 ? 1 : 0;
  ui.send.style.background = lit ? '#e6e8ee' : '#232326';
  ui.send.style.color = lit ? '#0d0d0d' : '#5d6068';
  ui.send.style.transform = `scale(${(1 - 0.12 * Math.sin(Math.PI * clamp01((t - T.send + 0.08) / 0.18))).toFixed(4)})`;
  let idx = -1;
  ROUTES.forEach((r, i) => { if (t >= r.at) idx = i; });
  const route = idx >= 0 ? ROUTES[idx] : null;
  if (cache.route !== idx) {
    cache.route = idx;
    ui.face.innerHTML = route?.name ? `<img src="${route.logo}" alt="">${route.name}` : `${mascot()}Auto`;
  }
  const at = route?.at ?? 0;
  const pop = prog(t, at, 0.35, EASE.outBack);
  ui.face.style.opacity = prog(t, at, 0.2, EASE.standard).toFixed(3);
  ui.face.style.transform = `translateY(${lerp(6, 0, clamp01(pop)).toFixed(2)}px)`;
}
