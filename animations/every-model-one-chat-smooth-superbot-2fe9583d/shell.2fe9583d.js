// The Superbot desktop window: server rail, sidebar, header, thread viewport and composer,
// laid out from the live app (superbot-desktop .tmp/app-live-20260924.png, 1x).
import { icon, mascot, geminiMark } from './icons.2fe9583d.js';

const h = (html) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
};

function row(title, preview, date, cls = '') {
  return `<div class="row ${cls}">${mascot('')}<div><div class="tt">${title}</div><div class="pv">${preview}</div></div><div class="dt">${date}</div></div>`;
}

function railHtml() {
  return `<aside class="rail"><div class="lights"><i></i><i></i><i></i></div>
<div class="rtile app" style="color:#fff">${mascot('')}</div>
<div class="rtile planet"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="5.5" fill="#6d8cff"/><ellipse cx="12" cy="12" rx="10" ry="3.2" fill="none" stroke="#c9d4ff" stroke-width="1.4" transform="rotate(-24 12 12)"/></svg></div>
<div class="rtile">${icon('bug')}</div>
<div class="spacer"></div>
<div class="bottom"><div class="rtile">${icon('gift')}</div><div class="rtile">${icon('listChecks')}<span class="badge">3</span></div>
<div class="rtile">${icon('settings')}</div><div class="rtile">${icon('plus')}</div></div></aside>`;
}

function sideHtml() {
  return `<aside class="side">
<div class="side-head"><div class="brand">${mascot('')}superbot.gg</div><div class="cbtn">${icon('filter')}</div><div class="cbtn">${icon('search')}</div></div>
<div class="seg"><span class="on">${icon('message')}Chat</span><span>${icon('code')}Code</span></div>
<div class="newchat">${mascot('')}New chat</div>
<div class="sec">Pinned<span class="icons">${icon('checks')}${icon('minus')}${icon('plus')}</span></div>
${row('Desktop connection', 'Doing well, thanks. Tools are…', 'Sep 18')}
${row('Weekend plans', 'Sure, here is a 3-day plan for…', 'Sep 18')}
<div class="sec">Today</div>
<div class="rows" data-today>
  <div class="newrow" style="position:relative;height:0;overflow:hidden">${row('Muse meme', 'Here’s your Muse meme.', '7:14 PM', 'active')}</div>
  ${row('Funny rock climbing videos', 'The best ones are from the…', '10:49 AM')}
</div>
<div class="sec">Yesterday</div>
${row('Rock climbing websites', 'Hi. What’s up?', 'Oct 3')}
${row('Pump It Up mp3', 'Found two versions of the…', 'Oct 3')}
${row('Multiple choice questions', 'Pick one and I’ll carry it out', 'Oct 3')}
${row('Breakfast ideas', 'Overnight oats, shakshuka…', 'Oct 3')}
<div class="acct"><div class="top"><div class="avatar">D</div><div class="who"><div class="em">dev@superbot.gg</div><div class="pl">${mascot('')}Superbot Free</div></div>
<div class="cbtn">${icon('plus')}</div><div class="cbtn">${icon('settings')}</div></div>
<div class="bot"><span class="cr">10,000 credits</span><span class="bar"><i></i></span><span class="upg">UPGRADE</span></div></div>
</aside>`;
}

function mainHtml() {
  return `<section class="main">
<div class="hdr"><div class="title"><span data-title-a>New chat</span><span data-title-b style="opacity:0">Muse meme</span></div>
<div class="search">${icon('search')}Search<span class="k">⌘K</span></div><div class="sqbtn">${icon('panel')}</div></div>
<div class="hdr2">${icon('refresh')}${icon('share')}<span class="ring">${icon('globe')}</span></div>
<div class="view"><div class="greet" data-greet>${mascot('')}<h1>Good evening. Where do we go?</h1></div><div class="col" data-col></div></div>
<div class="comp">
  <div class="txt"><span class="ph" data-ph>How can superbot help you today?</span><span class="typed"><span data-typed></span><i class="caret" data-caret></i></span></div>
  <div class="bar"><span class="plus">${icon('plus')}</span><span class="super">SUPER<span class="on">ON</span><span class="knob"></span></span>
    <div class="right">
      <div class="mchip" data-chip style="width:150px">
        <span class="face" data-face-a>${mascot()}Auto</span>
        <span class="face" data-face-b style="opacity:0">${geminiMark()}Nano Banana 2</span>
        <svg class="ic chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <span class="ib">${icon('monitor')}</span><span class="ib mic">${icon('mic')}</span><span class="send" data-send>${icon('arrowUp')}</span>
    </div></div>
</div>
<div class="meter"><span data-meter-n>2k of 1m</span><span class="trk"><i data-meter-bar style="width:2%"></i></span></div>
<div class="disc">superbot is AI and can make mistakes.</div>
</section>`;
}

export function buildShell(cam) {
  const win = h(`<div id="win">${railHtml()}${sideHtml()}${mainHtml()}</div>`);
  cam.appendChild(win);
  const q = (sel) => win.querySelector(sel);
  return {
    win,
    newRow: q('.newrow'),
    titleA: q('[data-title-a]'),
    titleB: q('[data-title-b]'),
    greet: q('[data-greet]'),
    col: q('[data-col]'),
    ph: q('[data-ph]'),
    typed: q('[data-typed]'),
    caret: q('[data-caret]'),
    send: q('[data-send]'),
    chip: q('[data-chip]'),
    faceA: q('[data-face-a]'),
    faceB: q('[data-face-b]'),
    meterN: q('[data-meter-n]'),
    meterBar: q('[data-meter-bar]'),
  };
}

export { h };
