// The Superbot desktop window for this spot: server rail, chat (full width until the workspace opens,
// then a 480px column) and the workspace panel (tool tabs, live tool viewport, the film's edit timeline).
// Rail, header, composer and tokens follow the live app as rebuilt in every-model-one-chat-smooth (2fe9583d).
import { icon, mascot } from './icons.c7e41a92.js';
import { WIN, PANEL } from './plan.c7e41a92.js';

export const h = (html) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
};

function railHtml() {
  return `<aside class="rail"><div class="lights"><i></i><i></i><i></i></div>
<div class="rtile app" style="color:#fff">${mascot('')}</div>
<div class="rtile planet"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="5.5" fill="#6d8cff"/><ellipse cx="12" cy="12" rx="10" ry="3.2" fill="none" stroke="#c9d4ff" stroke-width="1.4" transform="rotate(-24 12 12)"/></svg></div>
<div class="rtile">${icon('code')}</div>
<div class="spacer"></div>
<div class="bottom"><div class="rtile">${icon('listChecks')}<span class="badge">5</span></div>
<div class="rtile">${icon('settings')}</div><div class="rtile">${icon('plus')}</div></div></aside>`;
}

function mainHtml() {
  return `<section class="main" data-main>
<div class="hdr"><div class="title"><span data-title-a>New chat</span><span data-title-b style="opacity:0">Pocketsflow launch film</span></div>
<div class="search" data-search>${icon('search')}Search<span class="k">⌘K</span></div><div class="sqbtn" data-panelbtn>${icon('panel')}</div></div>
<div class="view" data-view><div class="greet" data-greet>${mascot('')}<h1>Good morning. What are we making?</h1></div><div class="col" data-col></div></div>
<div class="comp" data-comp>
  <div class="txt"><span class="ph" data-ph>How can superbot help you today?</span><span class="typed"><span data-typed></span><i class="caret" data-caret></i></span></div>
  <div class="bar"><span class="plus">${icon('plus')}</span><span class="super">SUPER<span class="on">ON</span><span class="knob"></span></span>
    <div class="right">
      <div class="mchip" data-chip><span class="face" data-face>${mascot()}<span data-face-name>Auto</span></span>
        <svg class="ic chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
      <span class="send" data-send>${icon('arrowUp')}</span>
    </div></div>
</div>
</section>`;
}

function panelHtml() {
  return `<section class="panel" data-panel style="left:${PANEL.x}px;width:${PANEL.w}px">
<div class="ptabs" data-tabs><span class="live"><i></i>LIVE</span><span class="dev">${icon('monitor')}Cloud desktop</span></div>
<div class="toolport" data-tools style="top:${PANEL.tabsH}px;height:${PANEL.toolH}px"></div>
<div class="edit" data-edit style="top:${PANEL.editY}px;height:${PANEL.editH}px"></div>
</section>`;
}

export function buildShell(cam) {
  const win = h(`<div id="win" style="width:${WIN.w}px;height:${WIN.h}px">${railHtml()}${mainHtml()}${panelHtml()}</div>`);
  cam.appendChild(win);
  const q = (sel) => win.querySelector(sel);
  return {
    win,
    main: q('[data-main]'),
    titleA: q('[data-title-a]'),
    titleB: q('[data-title-b]'),
    search: q('[data-search]'),
    panelBtn: q('[data-panelbtn]'),
    view: q('[data-view]'),
    greet: q('[data-greet]'),
    col: q('[data-col]'),
    comp: q('[data-comp]'),
    ph: q('[data-ph]'),
    typed: q('[data-typed]'),
    caret: q('[data-caret]'),
    send: q('[data-send]'),
    chip: q('[data-chip]'),
    face: q('[data-face]'),
    faceName: q('[data-face-name]'),
    panel: q('[data-panel]'),
    tabs: q('[data-tabs]'),
    tools: q('[data-tools]'),
    edit: q('[data-edit]'),
  };
}
