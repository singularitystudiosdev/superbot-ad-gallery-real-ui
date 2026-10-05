// film.js: "Every model, one chat" detail cut. A pure function of time: seek(t) paints frame t.
// Layout coordinates are the real superbot window (1440x810, read off the renderer DOM);
// the camera maps them onto the 1920x1080 stage.
import { ICONS } from './icons.js'
import { REDDIT_PAGE, DOORDASH_PAGE, END_CARD } from './pages.js'

export const DUR = 16.6

// ---------- time helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const eo = (x) => 1 - Math.pow(1 - x, 3)
const p = (t, a, b, e = eio) => (t <= a ? 0 : t >= b ? 1 : e((t - a) / (b - a)))
const lerp = (a, b, k) => a + (b - a) * k
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = eio] = keys[i]
    const [t0, v0] = keys[i - 1]
    if (t <= t1) return v0 + (v1 - v0) * e(clamp((t - t0) / (t1 - t0 || 1e-6)))
  }
  return keys[keys.length - 1][1]
}
// fade in at a (over d), optionally out at b (over d2)
const vis = (t, a, d = 0.24, b = Infinity, d2 = 0.18) => p(t, a, a + d, eo) * (1 - p(t, b, b + d2))

// ---------- icons ----------
const EXTRA = {
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
}
const svg = (name) => EXTRA[name] || ICONS[name] || ''
const ic = (name, cls = '', style = '') => `<span class="ic ${cls}" style="${style}">${svg(name)}</span>`
const MARK = ICONS['storm-tile-bare:28']
const mark = (size, style = '') => `<span class="plainmark${size < 28 ? ' small' : ''}" style="display:block;width:${size}px;height:${size}px;${style}">${MARK.replace('<svg ', '<svg width="100%" height="100%" ')}</span>`

const TILE = { openai: 'assets/tiles/openai.webp', anthropic: 'assets/tiles/anthropic.png', doordash: 'assets/brand/doordash-favicon.png', reddit: 'assets/brand/reddit-favicon.png' }
const tile = (k, cls = '') => `<span class="tile ${k === 'doordash' ? 'contain' : ''} ${cls}"><img src="${TILE[k]}"></span>`

// ---------- the switch block pieces ----------
function pillHTML(id, tileKey, from, to) {
  return `<div class="abs pill" id="${id}">${tile(tileKey)}
    <span class="lab" id="${id}-lab"><span class="a" style="position:absolute;left:0;top:0">${from}</span><span class="b" style="position:absolute;left:0;top:0">${to}</span><span class="m" style="visibility:hidden">${from}</span></span>
    <span class="stat">${ic('loader-circle', 'spin')}${ic('check', 'ok')}</span>
    <span class="chev">${ic('chevron-down', '', 'width:12px;height:12px')}</span></div>`
}
function stepHTML(id, x, y, doing, done, detail = '') {
  return `<div class="abs step" id="${id}" style="left:${x}px;top:${y}px"><span class="si">${ic('loader-circle', 'spin', 'color:var(--muted)')}${ic('check', 'ok')}</span>
    <span><span class="sl" style="position:relative;display:block"><span class="a">${doing}</span><span class="b" style="position:absolute;left:0;top:0;color:var(--muted)">${done}</span></span>${detail ? `<span class="sd" style="display:block">${detail}</span>` : ''}</span></div>`
}
const crumbHTML = (id, x, y, verb, target) => `<div class="abs crumb" id="${id}" style="left:${x}px;top:${y}px"><span class="dot"></span><span>${verb}</span><span class="tgt">${target}</span>${ic('chevron-right')}</div>`
const whoHTML = (id, x, y, tileKey, name) => `<div class="abs who" id="${id}" style="left:${x}px;top:${y}px">${tile(tileKey)}<span class="nm">${name}</span><span class="cap">in superbot</span></div>`
const avatarHTML = (x, y) => `<div class="abs avatar" style="left:${x}px;top:${y}px">${mark(14)}</div>`
const footHTML = (id, y) => `<div class="abs" id="${id}" style="left:576px;top:${y}px;width:300px;height:24px">
  <div class="abs avatar" style="left:0;top:0">${mark(14)}</div>
  <div class="abs tdot" style="left:32px;top:14px;width:4px;height:4px"></div><div class="abs tdot" style="left:38px;top:6px;width:6px;height:6px"></div>
  <div class="abs turn-head" style="left:60px;top:3px"><span class="nm">superbot</span><span class="meta">&nbsp;·&nbsp;<span class="tick" style="font-family:var(--mono)">1s</span></span></div></div>`

// ---------- static app ----------
function sideRow(y, icon, label, extra = '') {
  return `<div class="abs row ${extra}" style="top:${y}px"><span class="rico">${icon}</span><span class="rlab">${label}</span></div>`
}
const imgIco = (src, r = 5) => `<img src="${src}" style="border-radius:${r}px">`
const catIco = mark(16)
const letterIco = (ch, bg) => `<span style="width:16px;height:16px;border-radius:5px;background:${bg};color:#fff;font:700 10px/16px var(--ui);text-align:center;display:block">${ch}</span>`

function appHTML() {
  const avs = ['assets/tiles/anthropic.png', 'assets/brand/superbot-app-icon.png', 'assets/tiles/openai.webp', 'assets/brand/cosmos-CrEnb81r.png', 'assets/brand/google-Dj8W2UDz.png', 'assets/brand/ollama-Bm4rUDDq.svg']
  const earlier = [
    [catIco, 'Plan the Lisbon offsite'], [imgIco('assets/brand/cosmos-CrEnb81r.png'), 'New chat'], [imgIco('assets/brand/cosmos-CrEnb81r.png'), 'Summarize my inbox'],
    [ic('square-terminal', '', 'width:16px;height:16px'), 'Weekly standup notes'], [imgIco('assets/brand/ollama-Bm4rUDDq.svg'), 'Draft the changelog'], [imgIco('assets/brand/ollama-Bm4rUDDq.svg'), 'Draft notes offline'],
    [imgIco('assets/tiles/openai.webp'), 'Trip ideas for Kyoto'], [letterIco('D', '#3b5bdb'), 'Refactor the ingest pipeline'], [imgIco('assets/tiles/anthropic.png'), 'Debug the deploy script'],
    [ic('square-terminal', '', 'width:16px;height:16px'), 'Gemini CLI: refactor a script'], [letterIco('M', '#2b6bff'), 'Muse onboarding copy'], [imgIco('assets/tiles/openai.webp'), 'Codex CLI refactor'],
  ]
  return `
  <div class="abs rail">
    <div class="abs rail-mark" style="top:47px"></div>
    <div class="abs rail-btn on" style="left:16px;top:37px">${ic('message-circle')}</div>
    <div class="abs rail-btn" style="left:16px;top:89px">${ic('code')}</div>
    <div class="abs rail-btn" style="left:16px;top:618px">${ic('layout-grid')}</div>
    <div class="abs rail-btn" style="left:16px;top:666px">${ic('list-checks')}<div class="abs badge" style="left:26px;top:-2px">3</div></div>
    <div class="abs rail-btn" style="left:16px;top:714px">${ic('settings')}</div>
    <div class="abs acct" style="left:20px;top:762px">H</div>
  </div>
  <div class="abs side">
    <div class="abs side-collapse">${ic('panel-left-close')}</div>
    <div class="abs" style="left:16px;top:29px">${mark(28)}</div>
    <div class="abs wordmark" style="left:52px;top:29px">superbot</div>
    ${avs.map((s, i) => `<div class="abs av" style="left:${16 + i * 16}px;top:61px;z-index:${10 - i}"><img src="${s}"></div>`).join('')}
    <div class="abs ic" style="left:128px;top:67px;width:12px;height:12px">${svg('chevron-down')}</div>
    <div class="abs av" style="left:152px;top:61px;box-shadow:none">${ic('plus', '', 'width:12px;height:12px')}</div>
    <div class="abs row" style="top:101px"><span class="rico">${ic('square-pen', '', 'width:16px;height:16px')}</span><span class="rlab">New chat</span></div>
    <div class="abs bucket" style="top:137px">Pinned</div>
    <div class="abs pinned"><img src="assets/brand/superbot-app-icon.png" style="position:absolute;left:8px;top:11px;width:24px;height:24px;border-radius:8px">
      <div class="abs nowrap" style="left:41px;top:7px;width:166px;overflow:hidden;text-overflow:ellipsis;font-size:13px;line-height:19px;font-weight:500;color:var(--muted)">Cheapest GPUs on RunPod</div>
      <div class="abs nowrap" style="left:41px;top:26px;width:166px;overflow:hidden;text-overflow:ellipsis;font-size:10px;line-height:14px;color:rgba(174,177,188,.7)">Here are the three cheapest tiers right now.</div></div>
    <div class="abs bucket" style="top:217px">Today</div>
    <div class="abs ic" style="left:169px;top:218px;width:14px;height:14px">${svg('search')}</div>
    <div class="abs ic" style="left:193px;top:217px;width:16px;height:16px">${svg('list-filter')}</div>
    <div class="abs" id="sideList" style="left:0;top:0;width:240px;height:810px">
      ${sideRow(239, catIco, 'Name ideas for the CLI')}
      ${sideRow(269, catIco, 'Compare MCP servers')}
      ${sideRow(299, catIco, 'Rules in Cursor and Claude Code')}
      <div id="sideMove" class="abs" style="left:0;top:0;width:240px;height:810px">
        ${sideRow(329, imgIco('assets/brand/cosmos-CrEnb81r.png'), 'Plan the product launch')}
        <div class="abs bucket" style="top:371px">Earlier</div>
        ${earlier.map(([i, l], k) => sideRow(393 + k * 30, i, l)).join('')}
      </div>
      <div class="abs row on" id="sideNew" style="top:329px">
        <span class="rico">${catIco}</span><span class="rlab">make me a muse meme</span>
        <span class="rtime" id="sideTime"><i></i><span>0:00</span></span><span class="rbar" id="sideBar"></span></div>
    </div>
    <div class="abs acct-card" style="background:var(--bg)">
      <div class="abs" style="left:12px;top:12px;width:24px;height:24px;border-radius:50%;background:var(--raised);border:1px solid rgba(237,238,242,.12);display:grid;place-items:center;font-size:11px;font-weight:600">H</div>
      <div class="abs" style="left:30px;top:30px;width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 2px var(--bg)"></div>
      <div class="abs" style="left:44px;top:16px;font-size:13px;line-height:16px;font-weight:500">hi@ezo.dev</div>
      <div class="abs ic" style="left:209px;top:16px;width:16px;height:16px">${svg('settings')}</div>
      <div class="abs" style="left:222px;top:13px;width:6px;height:6px;border-radius:50%;background:var(--danger)"></div>
    </div>
  </div>
  <div class="abs gutter"></div>
  <div class="abs main"></div>
  <div class="abs ic" style="left:340px;top:16px;width:16px;height:16px;color:#4d8bff">${svg('square-pen')}</div>
  <div class="abs head-title" id="titleNew">New chat</div>
  <div class="abs head-title" id="titleThread">make me a muse meme</div>
  <div class="abs search">${ic('search', '', 'position:absolute;left:13px;top:8px;width:14px;height:14px')}<span class="abs t11 muted" style="left:36px;top:7px">Search</span><span class="abs kbd">⌘K</span></div>
  <div class="abs" id="headTools" style="left:0;top:0">
    ${['refresh-cw', 'share2', 'folder-git2', 'globe'].map((n, i) => `<div class="abs ic" style="left:${1286 + i * 28}px;top:16px;width:16px;height:16px">${svg(n)}</div>`).join('')}
    <div class="abs" style="left:1400px;top:12px;width:24px;height:24px;border:1px solid #6b6f76;border-radius:8px"></div>
  </div>

  <div class="abs feed-clip"><div class="abs feed" id="feed">${feedHTML()}</div></div>

  <div class="abs" id="hero" style="left:0;top:0;width:1440px;height:810px">
    <div class="abs" style="left:697px;top:285px">${mark(40)}</div>
    <div class="abs hero-line" style="left:757px;top:287px">Hello. Got a question?</div>
    <p class="abs t11 muted" style="left:512px;top:497px;width:736px;text-align:center">superbot is AI and can make mistakes.</p>
    ${[['pen-line', 'Write', 583], ['code-xml', 'Code', 682], ['search', 'Research', 780], ['globe', 'Browse', 904], ['workflow', 'Automate', 1016]].map(([n, l, x]) => `<div class="abs nc-chip" style="left:${x}px;top:537px">${ic(n)}<span>${l}</span></div>`).join('')}
  </div>
  <div class="abs" id="locTop" style="left:512px;top:369px;width:736px;height:22px">${locHTML()}</div>
  <div class="abs" id="locBot" style="left:512px;top:780px;width:736px;height:22px">${locHTML()}</div>
  <div class="abs composer" id="composer" style="top:395px">
    <div class="cin"><span class="ph" id="cph">How can superbot help you today?</span><span id="ctext"></span><span class="caret" id="caret"></span></div>
    <div class="abs ctool cplus ic" style="width:20px">${ic('plus', '', 'width:12px;height:12px;color:var(--fg)')}</div>
    <div class="abs ctool superwrap">
      <span class="sw-cap">${ic('sparkle', '', 'width:14px;height:14px')}</span>
      <span class="sw-tag">Off${ic('chevron-down', '', 'width:14px;height:14px')}</span>
      <span class="sw-mode">${ic('mouse-pointer-click', '', 'width:14px;height:14px')}${ic('chevron-down', '', 'width:14px;height:14px')}</span>
    </div>
    <div class="abs ctool picker" style="left:481px;top:63px">${mark(16)}<span>superbot</span>${ic('chevron-down', '', 'width:12px;height:12px')}</div>
    <div class="abs ic" style="left:589px;top:64px;width:14px;height:14px">${svg('monitor')}</div>
    <div class="abs cbtn" style="left:621px;top:57px">${ic('sparkle', '', 'width:14px;height:14px;color:var(--soft)')}</div>
    <div class="abs cbtn" style="left:658px;top:57px">${ic('mic', '', 'width:14px;height:14px')}</div>
    <div class="abs cbtn" id="send" style="left:696px;top:57px">
      <span class="abs ic" id="sendArrow" style="left:8px;top:8px;width:12px;height:12px">${svg('arrow-up')}</span>
      <span class="abs ic" id="sendStop" style="left:8px;top:8px;width:12px;height:12px;color:var(--fg)">${svg('square')}</span>
    </div>
  </div>`
}
function locHTML() {
  return `<div class="abs loc" style="left:0;top:0">${ic('folder')}<span>No project</span>${ic('chevron-down', 'car')}</div>
    <div class="abs loc" style="left:116px;top:0">${ic('laptop')}<span>This Mac</span>${ic('chevron-down', 'car')}</div>
    <div class="abs ic" style="left:714px;top:3px;width:16px;height:16px">${svg('loader-circle')}</div>`
}

// ---------- the thread ----------
// Feed coordinates equal app coordinates at scroll 0.
const T1 = { bubble: 99, crumb: 137, pill: 168, who: 206, gen: 236, head: 137, dpill: 159, h: 199, img: 243, via: 611, foot: 631 }
const T2 = { bubble: 667, crumb: 705, pill: 736, who: 774, sa: 804, sb: 843, foot: 890, head: 705, dpill: 724, h: 764, list: 836, want: 941, disc: 969 }
const T3 = { bubble: 1001, crumb: 1039, pa: 1070, pb: 1110, who: 1148, sa: 1178, sb: 1201, sc: 1224, ans: 1258, foot: 1255 }
const LIST = [
  ['Expectation vs reality: my Muse after one week', 'r/memes'],
  ['Muse on vacation still answers faster than my coworkers', 'r/memes'],
  ['Monday standup energy', 'r/MuseApp'],
  ['muse but in paint (took me 3 hours)', 'r/MuseApp'],
]
function bubbleHTML(id, y, text) {
  return `<div class="abs" id="${id}" style="left:576px;top:${y}px;width:600px;height:27px"><div class="abs bubble" style="right:0;top:0">${text}</div></div>`
}
function feedHTML() {
  return `
  <div class="abs" id="divider" style="left:576px;top:64px;width:600px;height:24px">
    <div class="abs divider-line" style="left:0;top:12px;width:270px"></div><div class="abs date-pill" style="left:278px;top:0">Oct 5</div><div class="abs divider-line" style="left:330px;top:12px;width:270px"></div></div>

  ${bubbleHTML('b1', T1.bubble, 'make me a muse meme')}
  ${crumbHTML('c1', 608, T1.crumb, 'Working on', 'a Muse meme')}
  <div class="abs rail-line" id="r1" style="left:625px;top:${T1.pill + 32}px;height:24px"></div>
  ${whoHTML('w1', 643, T1.who, 'openai', 'GPT Image 2')}
  <div class="abs gen" id="g1" style="left:608px;top:${T1.gen}px;width:480px;height:480px">
    <div class="sweep" id="g1sweep"></div>
    <div class="abs gen-chip" id="g1chip" style="left:12px;top:12px">${tile('openai')}<span>Creating image</span><span class="tm" id="g1tm">0:00</span></div>
  </div>
  <div class="abs answer-img" id="i1" style="left:636px;top:${T1.img}px;width:360px;height:360px"><img src="assets/img/meme.jpg" id="i1img"></div>
  <div class="abs" id="d1" style="left:0;top:0">
    ${avatarHTML(576, T1.head - 2)}
    <div class="abs turn-head" style="left:636px;top:${T1.head + 3}px"><span class="nm">superbot</span><span class="meta">&nbsp;·&nbsp;9s</span></div>
  </div>
  <div class="abs h22" id="h1" style="left:636px;top:${T1.h}px">Here's your Muse meme.</div>
  <div class="abs via" id="v1" style="left:636px;top:${T1.via}px">${ic('sparkles')}<span>via GPT Image 2</span></div>
  <div class="abs foot-seg" id="f1" style="left:632px;top:${T1.foot}px">1 step</div>
  ${pillHTML('p1', 'openai', 'Switching to GPT Image 2', 'Switched to GPT Image 2')}

  ${bubbleHTML('b2', T2.bubble, 'Scrape reddit and look for more')}
  ${crumbHTML('c2', 608, T2.crumb, 'Searching', 'muse meme site:reddit.com')}
  <div class="abs rail-line" id="r2" style="left:625px;top:${T2.pill + 32}px;height:24px"></div>
  ${whoHTML('w2', 643, T2.who, 'openai', 'GPT-5.6 Sol')}
  ${stepHTML('s2a', 647, T2.sa, 'Searching muse meme site:reddit.com', 'Searched muse meme site:reddit.com', 'Past week · 23 posts')}
  ${stepHTML('s2b', 647, T2.sb, 'Reading reddit.com +3', 'Read reddit.com +3', 'r/memes, r/MuseApp')}
  ${footHTML('lf2', T2.foot)}
  <div class="abs" id="d2" style="left:0;top:0">
    ${avatarHTML(576, T2.head - 2)}
    <div class="abs turn-head" style="left:636px;top:${T2.head + 3}px"><span class="nm">superbot</span><span class="meta">&nbsp;·&nbsp;13s</span></div>
  </div>
  <div class="abs h22" id="h2" style="left:636px;top:${T2.h}px;width:400px;white-space:normal">Found 4 more Muse memes on Reddit this week, top posts first:</div>
  <div class="abs list" id="l2" style="left:636px;top:${T2.list}px">
    ${LIST.map(([t, s], i) => `<div class="li" id="l2-${i}"><span class="n">${i + 1}.</span><img class="rf" src="assets/brand/reddit-favicon.png"><a>${t}</a><span class="sub">· ${s}</span></div>`).join('')}
  </div>
  <div class="abs body13" id="want2" style="left:636px;top:${T2.want}px">Want one in the same style next?</div>
  <div class="abs disc" id="disc2" style="left:636px;top:${T2.disc}px">${ic('chevron-right')}<span>Searched 1 site</span><img src="assets/brand/reddit-favicon.png"></div>
  ${pillHTML('p2', 'openai', 'Switching to GPT-5.6 Sol', 'Switched to GPT-5.6 Sol')}

  ${bubbleHTML('b3', T3.bubble, 'Winning, order me a burger.')}
  ${crumbHTML('c3', 608, T3.crumb, 'Working on', 'your burger order')}
  ${pillHTML('p3a', 'anthropic', 'Switching to Claude Fable 5', 'Switched to Claude Fable 5')}
  ${pillHTML('p3b', 'doordash', 'Connecting to DoorDash', 'Connected to DoorDash')}
  <div class="abs rail-line" id="r3" style="left:625px;top:${T3.pb + 32}px;height:24px"></div>
  ${whoHTML('w3', 643, T3.who, 'doordash', 'DoorDash')}
  ${stepHTML('s3a', 647, T3.sa, 'Opening DoorDash', 'Opened DoorDash')}
  ${stepHTML('s3b', 647, T3.sb, 'Adding a Double Smash Burger to your cart', 'Added a Double Smash Burger to your cart')}
  ${stepHTML('s3c', 647, T3.sc, 'Checking out with your saved card', 'Checked out with your saved card')}
  ${footHTML('lf3', T3.foot)}
  <div class="abs" id="a3" style="left:608px;top:${T3.ans}px;width:560px">
    <div class="h22" style="white-space:normal">Ordered: Double Smash Burger from Smashville Burger Co., $16.12 with delivery.</div>
    <div class="body13" style="margin-top:8px;color:var(--fg)">Arriving around 7:40 PM.</div>
  </div>`
}

// ---------- build ----------
const $ = (id) => document.getElementById(id)
let N = null // element cache
let W = {} // measured label widths

export async function init() {
  const stage = document.getElementById('stage')
  stage.innerHTML = `<div id="cam"><div id="app">${appHTML()}</div></div>
    <div id="scrim" style="position:absolute;inset:0;background:#000;opacity:0"></div>
    <div class="web" id="webR">${REDDIT_PAGE}</div>
    <div class="web" id="webD">${DOORDASH_PAGE}</div>
    <div id="end">${END_CARD}</div>`
  await document.fonts.ready
  await Promise.all([...document.images].map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => {}))))
  const ids = ['cam', 'app', 'feed', 'hero', 'locTop', 'locBot', 'composer', 'cph', 'ctext', 'caret', 'send', 'sendArrow', 'sendStop',
    'titleNew', 'titleThread', 'headTools', 'sideMove', 'sideNew', 'sideTime', 'sideBar', 'divider',
    'b1', 'c1', 'r1', 'w1', 'g1', 'g1sweep', 'g1chip', 'g1tm', 'i1', 'i1img', 'd1', 'h1', 'v1', 'f1', 'p1',
    'b2', 'c2', 'r2', 'w2', 's2a', 's2b', 'lf2', 'd2', 'h2', 'l2', 'want2', 'disc2', 'p2',
    'b3', 'c3', 'p3a', 'p3b', 'r3', 'w3', 's3a', 's3b', 's3c', 'lf3', 'a3', 'webR', 'webD', 'end',
    'scrim', 'rRows', 'ddPlus', 'ddPlusQ', 'ddCart', 'ddCartN', 'endMark', 'endHead', 'endPills', 'endUrl']
  N = Object.fromEntries(ids.map((k) => [k, $(k)]))
  N.l2items = [0, 1, 2, 3].map((i) => $(`l2-${i}`))
  N.endPill = [0, 1, 2].map((i) => $(`endPill${i}`))
  for (const id of ['p1', 'p2', 'p3a', 'p3b']) {
    const lab = $(`${id}-lab`)
    W[id] = { a: lab.querySelector('.a').offsetWidth, b: lab.querySelector('.b').offsetWidth }
  }
}

// ---------- per-frame pieces ----------
const set = (el, op, tx = 0, ty = 0, sc = 1) => {
  el.style.opacity = op.toFixed(4)
  el.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px)${sc !== 1 ? ` scale(${sc.toFixed(4)})` : ''}`
  el.style.visibility = op <= 0.001 ? 'hidden' : 'visible'
}
const appear = (el, t, a, out = Infinity, rise = 6) => { const o = vis(t, a, 0.26, out, 0.18); set(el, o, 0, (1 - p(t, a, a + 0.32, eo)) * rise) }

// pill: in at a, done at d; x/y live position, optional settle move to (x2,y2) between m0..m1
function paintPill(el, id, t, { a, d, x, y, x2 = x, y2 = y, m0 = Infinity, m1 = Infinity, out = Infinity, dim = null, chev = Infinity }) {
  const o = vis(t, a, 0.26, out, 0.2) * (dim ? lerp(1, 0.55, p(t, dim, dim + 0.3)) : 1)
  const k = p(t, m0, m1)
  el.style.left = '0px'; el.style.top = '0px'
  set(el, o, lerp(x, x2, k), lerp(y, y2, k) + (1 - p(t, a, a + 0.32, eo)) * 6)
  const lab = el.querySelector('.lab')
  const s = p(t, d, d + 0.22)
  lab.style.width = `${lerp(W[id].a, W[id].b, s).toFixed(2)}px`
  const A = lab.querySelector('.a'), B = lab.querySelector('.b')
  A.style.opacity = (1 - s).toFixed(3); B.style.opacity = s.toFixed(3)
  // the sweep while switching: ink dims, a bright band crosses the label
  const sweeping = t < d
  const ph = ((t - a) * 1.1) % 1
  const c0 = (ph * 170 - 60).toFixed(1), c1 = (ph * 170 - 30).toFixed(1), c2 = ph * 170
  A.style.webkitTextFillColor = sweeping ? 'transparent' : ''
  A.style.webkitBackgroundClip = sweeping ? 'text' : ''
  A.style.backgroundImage = sweeping ? `linear-gradient(90deg, rgba(230,232,238,.5) ${c0}%, #fff ${c1}%, rgba(230,232,238,.5) ${c2.toFixed(1)}%)` : 'none'
  const spin = el.querySelector('.spin'), ok = el.querySelector('.ok')
  spin.style.opacity = (1 - s).toFixed(3)
  spin.style.transform = `rotate(${((t - a) * 420) % 360}deg)`
  ok.style.opacity = s.toFixed(3)
  ok.style.transform = `scale(${lerp(0.6, 1, p(t, d, d + 0.25, eo)).toFixed(3)})`
  const c = p(t, chev, chev + 0.3)
  const chevEl = el.querySelector('.chev')
  chevEl.style.width = `${(c * 12).toFixed(2)}px`; chevEl.style.marginLeft = `${(c * 0 - 8 * (1 - c)).toFixed(2)}px`; chevEl.style.opacity = c.toFixed(3)
}
function paintStep(el, t, a, d, out = Infinity) {
  appear(el, t, a, out, 4)
  const s = p(t, d, d + 0.2)
  const A = el.querySelector('.sl .a'), B = el.querySelector('.sl .b')
  A.style.opacity = (1 - s).toFixed(3); B.style.opacity = s.toFixed(3)
  const spin = el.querySelector('.spin'), ok = el.querySelector('.ok')
  spin.style.opacity = (1 - s).toFixed(3); spin.style.transform = `rotate(${((t - a) * 420) % 360}deg)`
  ok.style.opacity = s.toFixed(3)
}
const typed = (t, a, b, text) => text.slice(0, Math.round(clamp((t - a) / (b - a)) * text.length))
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`

// ---------- timeline ----------
const TY = [
  { a: 0.2, b: 0.95, send: 1.02, text: 'make me a muse meme' },
  { a: 4.85, b: 5.45, send: 5.5, text: 'Scrape reddit and look for more' },
  { a: 9.55, b: 10.1, send: 10.15, text: 'Winning, order me a burger.' },
]
// the camera holds still while the models work; it moves once in and once out
const CAM = {
  E: [[0, 1.3333], [1.45, 1.3333], [2.4, 1.6], [15.0, 1.6], [15.75, 1.3333]],
  X: [[0, 720], [1.45, 720], [2.4, 905], [15.0, 905], [15.75, 720]],
  Y: [[0, 405], [1.45, 405], [2.4, 440], [15.0, 440], [15.75, 405]],
}
// Each new row in a live block: the turn footer steps down out of its way, the rail grows to
// it and the feed sticks to the bottom (the real thread follows its newest row).
const ROWS2 = [{ a: 6.55, foot: 806, rail: 22 }, { a: 6.8, foot: 851, rail: 67 }, { a: 7.2, foot: 890, rail: 106 }]
const ROWS3 = [{ a: 11.05, foot: 1154 }, { a: 11.55, foot: 1180, rail: 22 }, { a: 11.8, foot: 1209, rail: 51 }, { a: 12.1, foot: 1232, rail: 74 }, { a: 13.82, foot: 1255, rail: 97 }]
const ladder = (rows, key, start) => {
  const k = [[0, start]]
  let v = start
  for (const r of rows) if (r[key] != null) { k.push([r.a - 0.12, v]); v = r[key]; k.push([r.a + 0.1, v]) }
  return k
}
const SCROLL = [[0, 0], [2.65, 0], [3.1, 48], [4.25, 48], [4.7, 0],
  [5.54, 0], [5.92, 100], [6.05, 100], [6.3, 136], [6.43, 136], [6.65, 162], [6.68, 162], [6.9, 207], [7.08, 207], [7.3, 246],
  [8.85, 246], [9.25, 320],
  [10.19, 320], [10.5, 360], [10.52, 360], [10.72, 434], [10.74, 434], [10.98, 470], [10.99, 470], [11.2, 510], [11.43, 510], [11.65, 536],
  [11.68, 536], [11.9, 565], [11.98, 565], [12.2, 588], [13.7, 588], [13.92, 611], [14.2, 611], [14.55, 673]]
const R2 = ladder(ROWS2, 'rail', 0), F2 = ladder(ROWS2, 'foot', 780)
const R3 = ladder(ROWS3, 'rail', 0), F3 = ladder(ROWS3, 'foot', 1114)

export function seek(t) {
  if (!N) return
  // camera
  const E = kf(t, CAM.E), cx = kf(t, CAM.X), cy = kf(t, CAM.Y)
  N.cam.style.transform = `translate(${(960 - cx * E).toFixed(2)}px,${(540 - cy * E).toFixed(2)}px) scale(${E.toFixed(5)})`
  N.feed.style.transform = `translateY(${(-kf(t, SCROLL)).toFixed(2)}px)`

  // new chat -> thread
  const s1 = TY[0].send
  set(N.hero, 1 - p(t, s1, s1 + 0.28))
  set(N.locTop, 1 - p(t, s1, s1 + 0.2))
  set(N.locBot, p(t, s1 + 0.45, s1 + 0.7))
  N.composer.style.top = `${lerp(395, 682, p(t, s1 + 0.03, s1 + 0.55)).toFixed(2)}px`
  set(N.titleNew, 1 - p(t, s1, s1 + 0.2)); set(N.titleThread, p(t, s1 + 0.1, s1 + 0.3)); set(N.headTools, p(t, s1 + 0.1, s1 + 0.3))
  const ins = p(t, s1 + 0.03, s1 + 0.4)
  N.sideMove.style.transform = `translateY(${(ins * 30).toFixed(2)}px)`
  set(N.sideNew, ins)
  const END_RUN = 14.2
  N.sideTime.querySelector('span').textContent = mmss(clamp(Math.min(t, END_RUN) - s1, 0, 99))
  const runOp = 1 - p(t, END_RUN + 0.1, END_RUN + 0.3)
  N.sideTime.style.opacity = runOp.toFixed(3)
  N.sideBar.style.opacity = runOp.toFixed(3)
  N.sideBar.style.clipPath = `inset(0 ${(100 - ((t * 37) % 100)).toFixed(1)}% 0 0)`
  set(N.divider, p(t, s1 + 0.2, s1 + 0.45))

  // composer text, caret, send button
  let txt = '', typing = false, cur = null
  for (const ty of TY) {
    if (t >= ty.a - 0.25 && t < ty.send) { cur = ty; txt = typed(t, ty.a, ty.b, ty.text); typing = t >= ty.a && t <= ty.b }
  }
  N.ctext.textContent = txt
  const running = (t >= s1 && t < 4.3) || (t >= TY[1].send && t < 8.9) || (t >= TY[2].send && t < END_RUN)
  N.cph.textContent = txt ? '' : running ? 'Sent now, read when this turn ends' : 'How can superbot help you today?'
  const caretOn = cur && (typing || Math.floor((t - cur.a) * 2.2) % 2 === 0)
  N.caret.style.opacity = caretOn ? 1 : 0
  const armed = !!txt
  N.send.style.background = armed ? 'var(--fg)' : 'var(--wash)'
  N.sendArrow.style.color = armed ? 'var(--body)' : 'var(--muted)'
  N.sendArrow.style.opacity = running && !armed ? 0 : 1
  N.sendStop.style.opacity = running && !armed ? 1 : 0
  let press = 1
  for (const ty of TY) press = Math.min(press, 1 - 0.12 * Math.sin(Math.PI * clamp((t - ty.send + 0.08) / 0.2)))
  N.send.style.transform = `scale(${press.toFixed(3)})`

  // ---- turn 1: GPT Image 2 makes the meme ----
  appear(N.b1, t, s1 + 0.22)
  const settle1 = 4.2
  appear(N.c1, t, 1.55, settle1)
  paintPill(N.p1, 'p1', t, { a: 1.65, d: 2.3, x: 608, y: T1.pill, x2: 636, y2: T1.dpill, m0: settle1 + 0.05, m1: settle1 + 0.5, chev: settle1 + 0.35 })
  appear(N.w1, t, 2.45, settle1, 4)
  set(N.r1, vis(t, 2.45, 0.2, settle1, 0.18)); N.r1.style.height = `${(p(t, 2.45, 2.65) * 22).toFixed(2)}px`
  const gIn = 2.65
  set(N.g1, vis(t, gIn, 0.3, 4.15, 0.25), 0, 0, lerp(0.985, 1, p(t, gIn, gIn + 0.4, eo)))
  N.g1.style.transformOrigin = '0 0'
  N.g1sweep.style.left = `${lerp(-60, 110, ((t - gIn) * 0.9) % 1).toFixed(2)}%`
  N.g1tm.textContent = mmss(clamp(t - gIn, 0, 59))
  set(N.g1chip, 1 - p(t, 3.95, 4.15))
  const rv = p(t, 3.45, 4.15, (x) => x)
  const mv = p(t, settle1 + 0.05, settle1 + 0.5)
  const liveX = 608 - 636, liveY = T1.gen - T1.img, liveS = 480 / 360
  set(N.i1, rv > 0 ? Math.min(1, rv * 1.6) : 0, lerp(liveX, 0, mv), lerp(liveY, 0, mv), lerp(liveS, 1, mv))
  N.i1.style.borderColor = `rgba(30,30,33,${mv.toFixed(3)})`
  N.i1img.style.filter = `blur(${((1 - eo(rv)) * 22).toFixed(2)}px) saturate(${lerp(0.6, 1, eo(rv)).toFixed(3)})`
  N.i1img.style.clipPath = `inset(0 0 ${((1 - eo(clamp(rv * 1.25))) * 100).toFixed(2)}% 0)`
  appear(N.d1, t, settle1 + 0.3)
  appear(N.h1, t, settle1 + 0.34)
  appear(N.v1, t, settle1 + 0.44, Infinity, 3)
  appear(N.f1, t, settle1 + 0.5, Infinity, 3)

  // ---- turn 2: GPT-5.6 Sol searches Reddit ----
  const s2 = TY[1].send, settle2 = 8.8
  appear(N.b2, t, s2 + 0.04)
  appear(N.c2, t, 5.85, settle2)
  paintPill(N.p2, 'p2', t, { a: 5.92, d: 6.45, x: 608, y: T2.pill, x2: 636, y2: T2.dpill, m0: settle2 + 0.05, m1: settle2 + 0.45, chev: settle2 + 0.35 })
  appear(N.w2, t, ROWS2[0].a, settle2, 4)
  set(N.r2, vis(t, ROWS2[0].a, 0.2, settle2, 0.18)); N.r2.style.height = `${kf(t, R2).toFixed(2)}px`
  paintStep(N.s2a, t, ROWS2[1].a, 7.1, settle2)
  paintStep(N.s2b, t, ROWS2[2].a, 8.45, settle2)
  appear(N.lf2, t, 6.05, settle2, 0)
  N.lf2.style.top = `${kf(t, F2).toFixed(2)}px`
  N.lf2.querySelector('.tick').textContent = `${Math.max(1, Math.floor(t - s2))}s`
  appear(N.d2, t, settle2 + 0.2)
  appear(N.h2, t, settle2 + 0.24)
  N.l2items.forEach((li, i) => appear(li, t, settle2 + 0.3 + i * 0.05, Infinity, 4))
  appear(N.want2, t, settle2 + 0.5, Infinity, 3)
  appear(N.disc2, t, settle2 + 0.55, Infinity, 3)

  // ---- turn 3: Claude Fable 5 orders on DoorDash ----
  const s3 = TY[2].send
  appear(N.b3, t, s3 + 0.04)
  appear(N.c3, t, 10.42)
  paintPill(N.p3a, 'p3a', t, { a: 10.47, d: 10.95, x: 608, y: T3.pa, dim: ROWS3[0].a })
  paintPill(N.p3b, 'p3b', t, { a: ROWS3[0].a, d: 11.45, x: 608, y: T3.pb })
  appear(N.w3, t, ROWS3[1].a, Infinity, 4)
  set(N.r3, vis(t, ROWS3[1].a, 0.2)); N.r3.style.height = `${kf(t, R3).toFixed(2)}px`
  paintStep(N.s3a, t, ROWS3[2].a, 12.02)
  paintStep(N.s3b, t, ROWS3[3].a, 13.62)
  paintStep(N.s3c, t, ROWS3[4].a, 14.12)
  appear(N.lf3, t, 10.6, 14.12, 0)
  N.lf3.style.top = `${kf(t, F3).toFixed(2)}px`
  N.lf3.querySelector('.tick').textContent = `${Math.max(1, Math.floor(t - s3))}s`
  appear(N.a3, t, 14.2)

  // ---- the page each model works in opens out of its step row ----
  const sc1 = paintWeb(N.webR, t, 7.3, 8.38, 744, 818)
  N.rRows.style.transform = `translateY(${(-p(t, 7.7, 8.4) * 26).toFixed(2)}px)`
  const sc2 = paintWeb(N.webD, t, 12.25, 13.45, 792, 832)
  N.scrim.style.opacity = (0.6 * Math.max(sc1, sc2)).toFixed(4)
  const pr = Math.sin(Math.PI * clamp((t - 12.88) / 0.22))
  const added = p(t, 12.96, 13.1)
  N.ddPlus.style.transform = `scale(${(1 - 0.12 * pr).toFixed(3)})`
  N.ddPlus.style.opacity = (1 - added).toFixed(3)
  N.ddPlusQ.style.opacity = added.toFixed(3)
  N.ddPlusQ.style.transform = `scale(${lerp(0.7, 1, p(t, 12.96, 13.2, eo)).toFixed(3)})`
  N.ddCartN.textContent = t >= 13.04 ? '1' : '0'
  N.ddCart.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * clamp((t - 13.04) / 0.26))).toFixed(3)})`

  // ---- end card ----
  const fadeApp = p(t, 15.0, 15.45)
  N.app.style.opacity = (1 - fadeApp).toFixed(4)
  appear(N.endMark, t, 15.35, Infinity, 10)
  appear(N.endHead, t, 15.43, Infinity, 12)
  N.endPill.forEach((el, i) => appear(el, t, 15.66 + i * 0.1, Infinity, 8))
  appear(N.endUrl, t, 16.0, Infinity, 6)
}

// The page grows out of the step row like a card opening, holds full frame, then folds
// back into the same row. Returns its open amount for the scrim.
function paintWeb(el, t, a, b, ox, oy) {
  const k = p(t, a, a + 0.5) * (1 - p(t, b, b + 0.42))
  const s = lerp(0.16, 1, k)
  const cx = lerp(ox, 960, k), cy = lerp(oy, 540, k)
  const op = clamp(k * 5)
  el.style.opacity = op.toFixed(4)
  el.style.visibility = op <= 0.001 ? 'hidden' : 'visible'
  el.style.borderRadius = `${lerp(64, 0, k).toFixed(2)}px`
  el.style.boxShadow = k < 1 ? `0 ${(40 * (1 - k)).toFixed(1)}px ${(120 * (1 - k)).toFixed(1)}px rgba(0,0,0,${(0.55 * (1 - k)).toFixed(3)})` : 'none'
  el.style.transform = `translate(${(cx - 960 * s).toFixed(2)}px,${(cy - 540 * s).toFixed(2)}px) scale(${(1.627119 * s).toFixed(5)})`
  return k
}
