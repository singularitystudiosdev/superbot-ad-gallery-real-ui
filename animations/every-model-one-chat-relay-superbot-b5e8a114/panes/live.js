// Pane 6: the finished page. The last slots fill, superbot deploys it, the URL goes live and the page
// scrolls to the photos and the price check while the radio spot keeps playing.
import { html, $, enter, show, seg, easeInOut } from '../engine.js';
import { buildSite, renderSite } from './site.js';
import { sbTile } from './chat.js';

export function build() {
  const el = html(`
  <div class="pane p-live">
    <div class="br-bar"><span class="br-tab">Main Street Burger Co.</span><span class="br-url"><svg class="lock" viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg><span class="u">localhost:3000</span></span></div>
    <div class="lv-view"><div class="lv-scroll"></div></div>
    <div class="lv-toast">${sbTile('xs')}<span class="lbl">Deploying with vercel --prod</span><span class="st"><i class="spin"></i><svg class="ok" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span></div>
  </div>`);
  const site = buildSite();
  $(el, '.lv-scroll').append(site.el);
  return { el, site, url: $(el, '.br-url'), u: $(el, '.br-url .u'), scroll: $(el, '.lv-scroll'), toast: $(el, '.lv-toast'), slot3d: site.slots.burger };
}

// spin: seconds the turntable has turned; vo: seconds into the radio spot
export function render(c, t, { vo, spin }) {
  renderSite(c.site, {
    fill: { radio: seg(t, 0.1, 0.45), burger: seg(t, 0.3, 0.75), hero: seg(t, 0.55, 0.9), menu: seg(t, 0.65, 1.0), truck: seg(t, 0.75, 1.1) },
    spin,
    vo,
  });
  show(c.toast, t >= 0.85 && t < 3.0);
  enter(c.toast, t, 0.85, 0.3, -8);
  const live = t >= 1.5;
  c.toast.classList.toggle('done', live);
  $(c.toast, '.lbl').textContent = live ? 'Live at mainstreetburger.co' : 'Deploying with vercel --prod';
  $(c.toast, '.spin').style.transform = `rotate(${t * 600}deg)`;
  c.url.classList.toggle('live', live);
  c.u.textContent = live ? 'mainstreetburger.co' : 'localhost:3000';
  c.scroll.style.transform = `translateY(${-700 * easeInOut(seg(t, 1.6, 2.7))}px)`;
}

export const anchors = (c) => ({ in: c.slot3d, out: c.url });
