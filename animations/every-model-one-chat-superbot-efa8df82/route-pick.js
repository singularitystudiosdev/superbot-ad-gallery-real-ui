// The variant selector: a click swaps the burger ask's routing in place (chat.js listens for 'sb-route') and seeks
// the playing clock to a moment before that ask is typed, so a switch lands right on the part that differs. No
// reload, so it works the same inside the gallery's iframe; ?route= is kept in the URL for a reload or a share.
import { BURGER_AT, ROUTE } from './scenes/tabs-assets/chat.js?v=7';

const LEAD = 1.0; // seconds of the settled DeepSeek answer shown before the burger ask starts typing
const links = [...document.querySelectorAll('.route-pick button')];
const mark = (cur) => links.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.route === cur)));
mark(ROUTE);
links.forEach((b) => b.addEventListener('click', () => {
  const r = b.dataset.route;
  dispatchEvent(new CustomEvent('sb-route', { detail: r }));
  mark(r);
  const q = new URLSearchParams(location.search);
  q.set('route', r); q.delete('t'); q.delete('play');
  history.replaceState(null, '', '?' + q.toString());
  window.__V7?.seek(Math.max(0, BURGER_AT - LEAD));
  b.blur(); // keep space/arrows driving the timeline, not the button
}));
