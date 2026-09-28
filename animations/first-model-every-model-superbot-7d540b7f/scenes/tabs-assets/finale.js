// The chat's finale, after the Opus 5.5 beat: "Your Japanese biking demo is ready." and the preview card that
// tabs.js grows into the next scene's opening rect (a native-size twin, .pv-big). Appended to the Opus reply by
// chat.js. times(r) lays it from r (scene-local s); build() returns the nodes, the scroll mark and the card.
// Pure function of t.
export const TITLE = 'Japanese relaxing biking demo';
const DONE = 'Your Japanese biking demo is ready.';

const PLAY = '<span class="pv-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.2v11.6c0 .7.8 1.1 1.4.7l9-5.8c.5-.3.5-1.1 0-1.4l-9-5.8c-.6-.4-1.4 0-1.4.7Z" fill="#fff"/></svg></span>';
// the preview card markup (em-based: font-size sets the whole card's scale, so tabs.js can lay a native-size twin).
// The poster fills the whole card rect; the footer, badge and play button sit over it, so fading them out leaves
// exactly the poster in the card's rounded rect (the hand-off frame).
export const cardHtml = (esc, cls = '') => `<div class="pv-card ${cls}"><div class="pv-media"><img src="img/ride-poster.jpg" alt="" onerror="this.style.visibility='hidden'"/></div>
  ${PLAY}<span class="pv-live">LIVE PREVIEW</span>
  <div class="pv-row"><span class="pv-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M4.4 7.6 12 12l7.6-4.4M12 12v8.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-opacity=".7"/></svg></span>
  <span class="pv-tx"><b>${esc(TITLE)}</b><small>three.js · 14 files · 60 fps</small></span><span class="pv-open">Open<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div><i class="pv-ring"></i></div>`;

export default {
  // say: the ready line types; pv: the card rises; grow: tabs.js starts the hand-off (0.5s to the frame rect);
  // fade: the card's chrome leaves so only the poster remains; end: the scene cuts
  times(r) {
    return { say: r, pv: r + 0.06, grow: r + 0.28, fade: [r + 0.48, r + 0.83], end: r + 0.88 };
  },
  build(T, x) {
    const say = x.sayEl(DONE);
    say.n.classList.add('fn-done');
    const pv = x.el(cardHtml(x.esc));
    return {
      nodes: [say.n, pv],
      marks: [[T.say - 0.04, pv]],
      card: pv,
      render(t) {
        x.rise(say.n, t, T.say, 0.22, 6);
        say.render(t, T.say, 170);
        x.rise(pv, t, T.pv, 0.26, 12);
      },
    };
  },
};
