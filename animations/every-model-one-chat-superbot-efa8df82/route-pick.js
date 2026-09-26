// The variant selector: each link reloads the ad on one routing of the burger ask (chat.js reads ?route=) and plays
// it from a moment before that ask is typed, so a switch lands right on the part that differs. Other query params
// are kept.
import { BEATS } from './scenes/tabs-assets/chat.js?v=5';

const LEAD = 1.2; // seconds of the settled DeepSeek answer shown before the burger ask starts typing
const at = Math.max(0, BEATS[BEATS.length - 1].k.s - LEAD).toFixed(2);
const q = new URLSearchParams(location.search);
const cur = q.get('route') || 'doordash';
document.querySelectorAll('.route-pick a').forEach((a) => {
  const p = new URLSearchParams(q);
  p.set('route', a.dataset.route);
  p.set('t', at);
  p.set('play', '1');
  a.href = '?' + p.toString();
  a.setAttribute('aria-current', String(a.dataset.route === cur));
});
