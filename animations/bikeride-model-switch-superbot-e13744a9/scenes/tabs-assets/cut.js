// The cuts of bikeride-model-switch, one page: ?cut= picks one (the gallery lists each as its own ad).
//   zoom   (default, no param): the camera pushes in on every switch pill and on the Opus code panel.
//   nozoom (?cut=nozoom): the camera never moves; with no push to wait for, each reply starts GAP after its pill's
//          check lands. Beats, gaps, typing, clip and end card are the same in both.
//   titles (?cut=titles): the A24-teaser cut. A cold open on the ride's world with the promise over it, then the
//          same chat, then the ride held full frame in slow motion under three title cards, then an end card with a
//          tagline, a call to action and a specular sweep, over a longer dip to black and a light grain. Camera,
//          ask, pills and beats are the zoom cut's; only the open, the finale and the end card differ.
// Any other ?cut= value falls back to the default. Read once, here; chat.js, scenes/tabs.js and timeline.js import it.
export const CUTS = ['zoom', 'nozoom', 'titles'];
export const CUT = (() => {
  const c = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('cut');
  return CUTS.includes(c) ? c : 'zoom';
})();
export const ZOOM = CUT !== 'nozoom';
export const TITLES = CUT === 'titles';
