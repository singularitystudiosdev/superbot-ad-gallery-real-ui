// One source of truth for the spot: segment times (seconds), window geometry and the edit's clips.
// Order of the relay: ElevenLabs (score first) > DeepSeek V4 > Nano Banana Pro > Blender > Claude Opus 5.5.
import { PHASE, BAR } from './score.c7e41a92.js';

export const E = 4.6; // ElevenLabs: scores the film first so every cut has a beat
export const D = E + 6.0; // DeepSeek V4: scrapes pricing + Reddit, writes one line per bar
export const G = D + 6.0; // Nano Banana Pro: four stills with readable in-image text
export const B = G + 5.4; // Blender: models the PF icon, Cycles turntable
export const O = B + 6.4; // Claude Opus 5.5: React scenes + Remotion cut on the bar grid
export const F = O + 6.9; // the edit plays: the camera dives into the program monitor
export const FILM0 = F + 0.6; // film time 0 = score time 0
export const FILM_LEN = 14;
export const END = FILM0 + 13.8;
export const DUR = END + 4.3;

export const T = {
  type: 0.7, send: 3.05, ubub: 3.1, ans0: 3.4, title: 3.2, panel: 3.85,
  ans1: F - 0.35,
};

// Window (camera space) 1760x960: rail | chat | workspace panel (tabs, tool viewport, edit timeline).
export const WIN = { w: 1760, h: 960, rail: 68, chatW: 480, wideMain: 1692 };
export const PANEL = { x: 548, w: 1212, tabsH: 44, toolH: 596, editY: 640, editH: 320 };

// Edit timeline geometry, in panel coordinates.
export const EDIT = { labelW: 150, laneX: 158, laneW: 1030, rulerY: PANEL.editY + 44, trackY: PANEL.editY + 76, trackH: 44, gap: 4 };
export const PX_PER_S = EDIT.laneW / FILM_LEN;
export const xAt = (sec) => EDIT.laneX + sec * PX_PER_S;
export const barAt = (n) => PHASE + n * BAR; // n = 0-based bar index

export const TRACKS = [
  { id: 'v3', name: 'V3', kind: '3D', model: 'Blender', logo: 'brand/blender-logo.svg' },
  { id: 'v2', name: 'V2', kind: 'UI', model: 'Claude Opus 5.5', logo: 'brand/claude-logo-orange.svg' },
  { id: 'v1', name: 'V1', kind: 'Picture', model: 'Nano Banana Pro', logo: 'brand/gemini-logo.svg' },
  { id: 't1', name: 'T1', kind: 'Text', model: 'DeepSeek V4', logo: 'brand/deepseek-logo.svg' },
  { id: 'a1', name: 'A1', kind: 'Score', model: 'ElevenLabs', logo: 'brand/elevenlabs-logo.svg' },
];
export const trackY = (id) => EDIT.trackY + TRACKS.findIndex((tr) => tr.id === id) * (EDIT.trackH + EDIT.gap);

// Every clip in the edit: lane, span in film seconds, where it flies from (panel coords) and when it lands.
export const CLIPS = [
  { id: 'score', track: 'a1', from: 0, to: FILM_LEN, label: 'pocketsflow-launch.mp3', kind: 'wave', src: [104, PANEL.tabsH + 262, 1064, 120], land: E + 5.6 },
  { id: 'hook1', track: 't1', from: barAt(0), to: barAt(1), label: 'Gumroad keeps $10.50', kind: 'text', src: [420, PANEL.tabsH + 340, 600, 30], land: D + 5.45 },
  { id: 'hook2', track: 't1', from: barAt(1), to: barAt(2) - 0.5, label: 'of every $100 you sell.', kind: 'text', src: [420, PANEL.tabsH + 372, 600, 30], land: D + 5.55 },
  { id: 'keeps', track: 't1', from: barAt(2) + 1, to: barAt(3), label: 'Pocketsflow keeps $5.', kind: 'text', src: [420, PANEL.tabsH + 404, 600, 30], land: D + 5.65 },
  { id: 'nb1', track: 'v1', from: barAt(3), to: barAt(3) + 1, label: 'nb1.jpg', kind: 'img', thumb: 'img/nb1-sm.jpg', src: [198, PANEL.tabsH + 128, 400, 225], land: G + 4.95 },
  { id: 'nb2', track: 'v1', from: barAt(3) + 1, to: barAt(4), label: 'nb2.jpg', kind: 'img', thumb: 'img/nb2-sm.jpg', src: [612, PANEL.tabsH + 128, 400, 225], land: G + 5.05 },
  { id: 'nb4', track: 'v1', from: barAt(6), to: FILM_LEN, label: 'nb4.jpg', kind: 'img', thumb: 'img/nb4-sm.jpg', src: [612, PANEL.tabsH + 365, 400, 225], land: G + 5.15 },
  { id: 'icon3d', track: 'v3', from: barAt(2), to: barAt(3), label: 'pf-icon · 60f', kind: 'img', thumb: 'blender/s6.jpg', src: [104, PANEL.tabsH + 70, 692, 389], land: B + 6.0 },
  { id: 'checkout', track: 'v2', from: barAt(4), to: barAt(5), label: 'Checkout.tsx', kind: 'ui', src: [780, PANEL.tabsH + 70, 410, 360], land: O + 6.5 },
  { id: 'payouts', track: 'v2', from: barAt(5), to: barAt(6) - 0.5, label: 'Payouts.tsx', kind: 'ui', src: [780, PANEL.tabsH + 70, 410, 360], land: O + 6.6 },
];

// Which model the composer chip names while each segment runs.
export const ROUTES = [
  { at: E, name: 'ElevenLabs', logo: 'brand/elevenlabs-logo.svg' },
  { at: D, name: 'DeepSeek V4', logo: 'brand/deepseek-logo.svg' },
  { at: G, name: 'Nano Banana Pro', logo: 'brand/gemini-logo.svg' },
  { at: B, name: 'Blender', logo: 'brand/blender-logo.svg' },
  { at: O, name: 'Claude Opus 5.5', logo: 'brand/claude-logo-orange.svg' },
  { at: F - 0.4, name: null },
];
