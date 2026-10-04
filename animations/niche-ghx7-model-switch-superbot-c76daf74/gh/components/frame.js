// browserFrame: a light Chrome-style window (tab strip + toolbar + URL bar) that hosts one GitHub page.
// The page is laid out at `pageWidth` CSS px (default 1440, GitHub's desktop layout) and scaled to fill the frame width,
// so the frame can sit on the 1920x1080 stage with a margin (bible X policy: never full-bleed).
// Scroll / push-in hooks (motion agent): set --scroll (px, page units) on .ghf-page to scroll the page; the frame itself
// is a plain box, transform it from outside for camera moves.
import { oct, esc } from './util.js';

const GH_FAVICON = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#1f2328" d="M8 0c4.42 0 8 3.58 8 8a8.01 8.01 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38c0-.27.01-1.13.01-2.2c0-.75-.25-1.23-.54-1.48c1.78-.2 3.65-.88 3.65-3.95c0-.88-.31-1.59-.82-2.15c.08-.2.36-1.02-.08-2.12c0 0-.67-.22-2.2.82c-.64-.18-1.32-.27-2-.27s-1.36.09-2 .27c-1.53-1.03-2.2-.82-2.2-.82c-.44 1.1-.16 1.92-.08 2.12c-.51.56-.82 1.28-.82 2.15c0 3.06 1.86 3.75 3.64 3.95c-.23.2-.44.55-.51 1.07c-.46.21-1.61.55-2.33-.66c-.15-.24-.6-.83-1.23-.82c-.67.01-.27.38.01.53c.34.19.73.9.82 1.13c.16.45.68 1.31 2.69.94c0 .67.01 1.3.01 1.49c0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8"/></svg>`;

export function browserFrame({ url = 'github.com', title = 'GitHub', width = 1760, height = 960, pageWidth = 1440, content = '', tabs = [], screen = '' } = {}) {
  const k = width / pageWidth;
  const viewH = height - 86; // tab strip 40 + toolbar 46
  const extra = tabs.map((t) => `<div class="ghf-tab">${t.icon || ''}<span>${esc(t.title)}</span></div>`).join('');
  const [host, ...rest] = url.split('/');
  return `<div class="ghf" data-screen="${esc(screen)}" style="width:${width}px;height:${height}px;--k:${k}">
  <div class="ghf-tabs">
    <div class="ghf-lights"><i></i><i></i><i></i></div>
    <div class="ghf-tab is-active">${GH_FAVICON}<span>${esc(title)}</span>${oct('x', 14, 'ghf-tab-x')}</div>${extra}
    <div class="ghf-newtab">${oct('plus', 16)}</div>
  </div>
  <div class="ghf-bar">
    <span class="ghf-nav">${oct('arrow-left', 16)}</span><span class="ghf-nav is-dim">${oct('arrow-right', 16)}</span><span class="ghf-nav"><svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.001 7.001 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.501 5.501 0 0 0 8 2.5M1.705 8.005a.75.75 0 0 1 .834.656a5.501 5.501 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.001 7.001 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834"/></svg></span>
    <div class="ghf-url">${oct('lock', 14, 'ghf-lock')}<span class="ghf-host">${esc(host)}</span><span class="ghf-path">${rest.length ? '/' + esc(rest.join('/')) : ''}</span>${oct('star', 16, 'ghf-star')}</div>
    <span class="ghf-ext"></span><span class="ghf-me"></span>
  </div>
  <div class="ghf-view" style="height:${viewH}px"><div class="ghf-page" style="width:${pageWidth}px;min-height:${Math.ceil(viewH / k)}px">${content}</div></div>
</div>`;
}
