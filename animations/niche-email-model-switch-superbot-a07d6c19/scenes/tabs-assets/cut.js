// The two cuts of the model-switch spot (forked from bikeride-model-switch), one page: ?cut= picks one (the gallery lists each as its own ad).
//   zoom   (default, no param): the camera pushes in on every switch pill and on the Opus email panel.
//   nozoom (?cut=nozoom): the camera never moves; with no push to wait for, each reply starts GAP after its pill's
//          check lands. Beats, gaps, typing, the Gmail finale and end card are the same in both.
// Any other ?cut= value falls back to the default. Read once, here; chat.js, scenes/tabs.js and timeline.js import it.
export const CUTS = ['zoom', 'nozoom'];
export const CUT = (() => {
  const c = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('cut');
  return CUTS.includes(c) ? c : 'zoom';
})();
export const ZOOM = CUT === 'zoom';
