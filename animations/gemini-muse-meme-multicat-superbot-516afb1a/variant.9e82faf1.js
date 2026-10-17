// The spot's variant: what Gemini makes for the ask, '1' (one meme card), '10' (ten at once), '3d' (a 3D zombie
// model), 'game' (a zombie runner Gemini codes, then boots), 'doordash', where superbot routes to DoorDash and orders a burger instead, or 'lawn',
// where Maps connects to find the address the ask names and Gemini then adds a garden to that front lawn
// (scenes/tabs-assets/beats/lawn.f5e1d276.js), or 'multicat', four asks in one chat, each on its own tool: a GPT Image 2 cat photo, a
// Meshy 3D cat that walks, cat food from DoorDash and an ElevenLabs cat song (scenes/tabs-assets/beats/multicat.516afb1a.js), or 'multidog',
// the same four tools for a dog (scenes/tabs-assets/beats/multidog.7b007b09.js). Read from ?variant= so a frozen
// frame (?t=) keeps it; the top-right selector (variant-select.9e82faf1.js) changes it live, without a reload, and the
// beats read it every frame.
const KEY = 'variant';
export const VARIANTS = [
  { id: '1', label: '1 image' }, { id: '10', label: '10 images' }, { id: '3d', label: '3D model' }, { id: 'game', label: 'Game' },
  { id: 'doordash', label: 'DoorDash order' },
  { id: 'garden', label: 'Garden template' },
  { id: 'roadtrip', label: 'Road trip map' },
  { id: 'climbing', label: 'Climbing videos' },
  { id: 'catsurf', label: 'Cat surfing video' },
  { id: 'catsurf10', label: '10 cat surfing videos' },
  { id: 'catgif', label: 'Dancing cat GIF' },
  { id: 'logo', label: 'Coffee logo' },
  { id: 'song', label: 'Dog song' },
  { id: 'bedtime', label: 'Bedtime story' },
  { id: 'podcast', label: 'Space podcast' },
  { id: 'pitchdeck', label: 'Pitch deck' },
  { id: 'spending', label: 'Spending chart' },
  { id: 'traderjoes', label: "Trader Joe's list" },
  { id: 'skydio', label: 'Skydio slide' },
  { id: 'bakery', label: 'Bakery website' },
  { id: 'reminder', label: 'Phone notification' },
  { id: 'computer-control-v3-soft', label: 'Computer Control V3 · Soft Vignette' },
  { id: 'photoedit', label: 'Photo edit' },
  { id: 'lawn', label: 'Front lawn garden' },
  { id: 'multicat', label: 'Multi-tool cat' },
  { id: 'multidog', label: 'Multi-tool dog' },
];
const valid = (v) => VARIANTS.some((x) => x.id === v);
const asked = new URLSearchParams(location.search).get(KEY);
let current = valid(asked) ? asked : VARIANTS[0].id;

export const variant = () => current;

export function setVariant(v) {
  if (!valid(v) || v === current) return;
  current = v;
  const u = new URL(location.href);
  if (v === VARIANTS[0].id) u.searchParams.delete(KEY); else u.searchParams.set(KEY, v);
  history.replaceState(null, '', u);
  dispatchEvent(new CustomEvent('variantchange', { detail: v }));
}
