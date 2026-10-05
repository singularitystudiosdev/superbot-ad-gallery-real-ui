// superbot desktop's in-app browser, docked beside the thread (MainPane.tsx: .hub-main-tenant-row holds the thread,
// the Splitter slot and .hub-side-pane; Browser.tsx draws the pane). Markup is the component's own:
//   tab strip ....... .hub-browser-tab (the Bot glyph on a tab the agent drives, the title, a 12px X)
//   lane group ...... BrowserLaneBadge "This device" (Laptop glyph, solid border: this machine), the machine pick
//                     (SegmentedControl: Cloud | This Mac) and the "My IP" switch
//   address row ..... Back, Forward, Reload (IconButton sm), then the agent's lease face: the storm-ring mark,
//                     "Superbot is browsing <host>" and Take over
//   host ............ .hub-browser-host, where the app mounts the page's WebContentsView; here each page is its own
//                     iframe document, so a page's CSS never touches the app's.
// Styles: app/pane.css (rules pulled from the built renderer stylesheet) under app/app.css (the capture's).
import { seg, inOutCubic } from './tl.js?v=1db9afb3';

export const PANE_W = 640;             // the browser split's width (LAYOUT_LIMITS.browserWidth floor is 360)
const OPEN = 0.4;

const LU = {
  bot: '<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
  laptop: '<path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"></path><path d="M20.054 15.987H3.946"></path>',
  'arrow-left': '<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>',
  'arrow-right': '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>',
};
const svg = (k, s, cls = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${k} ${cls}" aria-hidden="true">${LU[k]}</svg>`;

export function buildPane(doc, tpl) {
  const q = (s, r = doc) => r.querySelector(s);
  const row = q('.hub-main-tenant-row');
  row.setAttribute('data-fixed', 'pane');
  const iconBtn = (label, icon, disabled) => {
    const b = tpl.iconButtonSm.cloneNode(true);
    b.setAttribute('aria-label', label);
    b.removeAttribute('data-testid');
    b.className = b.className.replace(/\bhub-side-project-[a-z]+\b/g, '').trim();
    if (disabled) { b.setAttribute('disabled', ''); b.setAttribute('aria-disabled', 'true'); } else b.removeAttribute('disabled');
    q('[data-slot=icon-button-icon]', b).innerHTML = svg(icon, 14);
    return b.outerHTML;
  };
  const slot = doc.createElement('div');
  slot.className = 'hub-splitter-slot';
  slot.innerHTML = '<div class="hub-splitter" role="separator" aria-orientation="vertical" aria-label="Resize browser" data-pane="browser" tabindex="0"></div>';
  const side = doc.createElement('div');
  side.className = 'hub-side-pane';
  side.innerHTML = `<section class="hub-browser" data-testid="browser-pane" aria-label="Browser" style="width: ${PANE_W}px">
    <div class="hub-browser-tabs" data-testid="browser-head">
      <div class="hub-browser-tab-list" data-testid="browser-tab-list"></div>
      <div class="hub-browser-lane-group" data-testid="browser-lane-group">
        <span class="hub-browser-lane" data-testid="browser-lane" data-lane="local">${svg('laptop', 12, 'hub-browser-lane-glyph')}<span class="hub-browser-lane-label">This device</span></span>
        <span class="hub-browser-machine" data-testid="browser-machine" data-machine="local"><div data-slot="segmented-control" role="radiogroup" aria-label="Where the agent browses" class="sb-seg _lit"><span data-slot="segment-thumb" class="sb-seg-thumb" aria-hidden="true"></span><button type="button" role="radio" aria-checked="false" data-slot="segmented-option" data-segment-id="cloud" class="sb-seg-opt focus-ring"><span data-slot="segmented-option-label">Cloud</span></button><button type="button" role="radio" aria-checked="true" data-slot="segmented-option" data-segment-id="local" class="sb-seg-opt focus-ring"><span data-slot="segmented-option-label">This Mac</span></button></div></span>
        <span class="hub-browser-egress" data-testid="browser-egress" data-machine="local" data-egress="on"><span class="hub-browser-egress-label" aria-hidden="true">My IP</span><span class="hub-browser-egress-seat"><button type="button" role="switch" aria-checked="true" aria-label="Use my IP" data-slot="switch" data-state="on" data-size="sm" class="sb-switch sb-seg focus-ring _lit"><span data-slot="segment-thumb" class="sb-seg-thumb" aria-hidden="true"></span><span data-slot="switch-off" data-checked="false" class="sb-seg-opt" aria-hidden="true">OFF</span><span data-slot="switch-on" data-checked="true" class="sb-seg-opt" aria-hidden="true">ON</span></button></span></span>
      </div>
    </div>
    <div class="hub-browser-address" data-testid="browser-lease-row" data-lease="agent">
      ${iconBtn('Back', 'arrow-left', true)}${iconBtn('Forward', 'arrow-right', true)}${iconBtn('Reload', 'rotate-cw', false)}
      <div class="hub-browser-lease" data-testid="browser-lease-agent"><span class="hub-browser-lease-mark storm-stroke" aria-hidden="true"></span><span class="hub-browser-lease-text"><span class="hub-browser-lease-phrase">Superbot is browsing&nbsp;</span><span class="hub-browser-lease-host"></span></span><button type="button" class="hub-browser-take-over focus-ring" data-testid="browser-take-over">Take over</button></div>
    </div>
    <div class="hub-browser-host" data-testid="browser-host"></div>
  </section>`;
  row.append(slot, side);
  // the segment thumbs sit under their checked word (placeSegmentThumb: width + translateX of the checked cell)
  for (const segEl of side.querySelectorAll('.sb-seg')) {
    const on = segEl.querySelector('[aria-checked=true], [data-checked=true]');
    const thumb = segEl.querySelector('.sb-seg-thumb');
    if (on && thumb) { thumb.style.width = on.offsetWidth + 'px'; thumb.style.transform = `translateX(${on.offsetLeft}px)`; }
  }
  const tabList = q('.hub-browser-tab-list', side);
  const host = q('.hub-browser-host', side);
  const leaseHost = q('.hub-browser-lease-host', side);
  const views = [];
  let last = null;
  return {
    side, host, views,
    // a page the agent opened: { from, title, host, frame (iframe), render(t) }
    add(v) {
      v.frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:none;background:#fff';
      host.appendChild(v.frame);
      views.push(v);
      views.sort((a, b) => a.from - b.from);
      return v;
    },
    get first() { return views.length ? views[0].from : Infinity; },
    render(t) {
      const open = inOutCubic(seg(t, this.first - OPEN, this.first));
      side.style.width = `${(PANE_W * open).toFixed(2)}px`;
      side.style.display = open > 0 ? '' : 'none';
      slot.style.display = open > 0 ? '' : 'none';
      let v = views[0];
      for (const x of views) if (t >= x.from) v = x;
      if (!v) return;
      if (v !== last) {
        views.forEach((x) => { x.frame.style.display = x === v ? 'block' : 'none'; });
        // the strip keeps every tab the agent opened so far, the newest active
        // one tab per page key, in the order the agent opened them; a page reloaded in its tab keeps its slot
        const keyOf = (x) => x.key || x.title;
        const open = [];
        for (const x of views) if (x.from <= Math.max(t, v.from) && !open.some((o) => keyOf(o) === keyOf(x))) open.push(x);
        tabList.innerHTML = open.map((x) => `<div class="hub-browser-tab"${keyOf(x) === keyOf(v) ? ' data-active="true"' : ''}><span class="hub-browser-tab-agent" data-testid="browser-tab-agent" role="img" aria-label="Agent">${svg('bot', 12)}</span><button type="button" class="hub-browser-tab-select focus-ring"${keyOf(x) === keyOf(v) ? ' aria-current="true"' : ''}><span class="hub-browser-tab-title">${x.title}</span></button><button type="button" class="hub-browser-tab-close focus-ring" aria-label="Close ${x.title}">${svg('x', 12)}</button></div>`).join('');
        leaseHost.textContent = v.host;
        last = v;
      }
      if (v.render) v.render(t);
    },
  };
}
