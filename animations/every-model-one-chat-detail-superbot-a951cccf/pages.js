// pages.js: the two web pages the models work in, rebuilt by hand at a 1180x664 viewport
// (Reddit search, logged out, shreddit layout; DoorDash store page), plus the end card.
import { ICONS } from './icons.js'

const L = {
  search: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M19.5 18.616 14.985 14.1a8.528 8.528 0 1 0-.884.884l4.515 4.515.884-.884ZM1.301 8.553a7.253 7.253 0 1 1 7.252 7.253 7.261 7.261 0 0 1-7.252-7.253Z"/></svg>',
  close: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="m18.442 2.442-.884-.884L10 9.116 2.442 1.558l-.884.884L9.116 10l-7.558 7.558.884.884L10 10.884l7.558 7.558.884-.884L10.884 10l7.558-7.558Z"/></svg>',
  caret: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 13.125a.624.624 0 0 1-.442-.183l-5-5 .884-.884L10 11.616l4.558-4.558.884.884-5 5a.624.624 0 0 1-.442.183Z"/></svg>',
  dots: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm4-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  thumb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
}
const i = (k, w, h = w, color = 'currentColor', extra = '') => `<span style="display:inline-block;width:${w}px;height:${h}px;color:${color};flex:none;${extra}">${L[k].replace('<svg ', `<svg width="${w}" height="${h}" style="display:block" `)}</span>`

// ---------- Reddit ----------
const R = 'font-family:\'Reddit Sans\',system-ui,sans-serif;'
const POSTS = [
  { sub: 'r/memes', icon: 'assets/img/r-memes-icon.png', age: '1d ago', title: 'Expectation vs reality: my Muse after one week', votes: '4.8K votes · 213 comments', thumb: 'assets/img/r2.jpg' },
  { sub: 'r/memes', icon: 'assets/img/r-memes-icon.png', age: '3d ago', title: 'Muse on vacation still answers faster than my coworkers', votes: '2.3K votes · 97 comments', thumb: 'assets/img/r4.jpg' },
  { sub: 'r/MuseApp', icon: 'assets/img/muse.jpg', age: '6h ago', title: 'Monday standup energy', body: 'Every single week. I asked it for one idea.', votes: '1.2K votes · 84 comments', thumb: 'assets/img/r1.jpg' },
  { sub: 'r/MuseApp', icon: 'assets/img/muse.jpg', age: '2d ago', title: 'muse but in paint (took me 3 hours)', votes: '876 votes · 41 comments', thumb: 'assets/img/r3.jpg' },
  { sub: 'r/MuseApp', icon: 'assets/img/muse.jpg', age: '4d ago', title: 'Does anyone else’s Muse send good morning texts?', body: 'Mine started doing it after the last update and honestly I like it.', votes: '312 votes · 58 comments' },
]
const post = (q, k) => `
  <div style="position:relative;padding:16px 16px 14px;border-radius:16px;${k < POSTS.length - 1 ? '' : ''}">
    <div style="display:flex;align-items:center;gap:8px;height:20px;font-size:12px;line-height:16px;color:#576f76">
      <img src="${q.icon}" style="width:20px;height:20px;border-radius:50%;object-fit:cover">
      <span style="color:#333d42;font-weight:500">${q.sub}</span><span>·</span><span>${q.age}</span></div>
    <div style="margin-top:8px;padding-right:${q.thumb ? 140 : 0}px;font-size:18px;line-height:24px;font-weight:600;color:#0f1a1c">${q.title}</div>
    ${q.body ? `<div style="margin-top:6px;padding-right:${q.thumb ? 140 : 0}px;font-size:14px;line-height:20px;color:#333d42">${q.body}</div>` : ''}
    <div style="margin-top:8px;font-size:12px;line-height:16px;color:#576f76">${q.votes}</div>
    ${q.thumb ? `<img src="${q.thumb}" style="position:absolute;right:16px;top:44px;width:104px;height:78px;border-radius:8px;object-fit:cover">` : ''}
  </div>
  ${k < POSTS.length - 1 ? '<div style="height:1px;background:#e5ebee;margin:0 16px"></div>' : ''}`

const COMMUNITIES = [
  { name: 'r/MuseApp', icon: 'assets/img/muse.jpg', desc: 'Fan memes, tips and screenshots of Muse', stats: '18K weekly visitors · 1.1K weekly contributions' },
  { name: 'r/memes', icon: 'assets/img/r-memes-icon.png', desc: 'Memes! A way of describing cultural...', stats: '3.6M weekly visitors · 41K weekly contributions' },
]

export const REDDIT_PAGE = `<div style="${R}position:absolute;inset:0;background:#fff;color:#0f1a1c">
  <div style="position:absolute;left:0;top:0;width:1180px;height:56px;border-bottom:1px solid #e5ebee;background:#fff;z-index:2">
    <img src="assets/brand/reddit-wordmark-orange.svg" style="position:absolute;left:16px;top:17px;height:22px">
    <div style="position:absolute;left:350px;top:8px;width:480px;height:40px;border-radius:9999px;background:#e5ebee;display:flex;align-items:center;padding:0 14px;gap:10px">
      ${i('search', 16, 16, '#0f1a1c')}<span style="font-size:14px;line-height:20px;flex:1">muse meme</span>${i('close', 16, 16, '#576f76')}</div>
    <div style="position:absolute;right:16px;top:8px;height:40px;display:flex;align-items:center;gap:8px">
      <span style="height:40px;padding:0 16px;border-radius:9999px;background:#e5ebee;font-size:14px;line-height:40px;font-weight:600">Sign Up</span>
      <span style="height:40px;padding:0 16px;border-radius:9999px;background:#d93900;color:#fff;font-size:14px;line-height:40px;font-weight:600">Log In</span>
      <span style="width:40px;height:40px;display:grid;place-items:center">${i('dots', 20, 20, '#0f1a1c')}</span></div>
  </div>
  <div style="position:absolute;left:134px;top:68px;display:flex;gap:4px;font-size:14px;line-height:20px;font-weight:600">
    ${['Posts', 'Communities', 'Comments', 'Media', 'Profiles'].map((t, k) => `<span style="padding:6px 14px;border-radius:9999px;${k === 0 ? 'background:#e5ebee' : ''}">${t}</span>`).join('')}</div>
  <div style="position:absolute;left:148px;top:112px;display:flex;gap:28px;font-size:12px;line-height:16px;font-weight:600;color:#333d42">
    <span style="display:flex;align-items:center;gap:6px">Relevance${i('caret', 14, 14, '#333d42')}</span><span style="display:flex;align-items:center;gap:6px">Past week${i('caret', 14, 14, '#333d42')}</span></div>
  <div style="position:absolute;left:134px;top:140px;width:640px;height:524px;overflow:hidden">
    <div id="rRows">${POSTS.map(post).join('')}</div></div>
  <div style="position:absolute;left:796px;top:128px;width:256px;border-radius:16px;background:#f6f8f9;padding:16px 16px 18px">
    <div style="font-size:12px;line-height:16px;font-weight:600;color:#576f76">Communities</div>
    ${COMMUNITIES.map((c) => `<div style="display:flex;gap:12px;margin-top:20px">
      <img src="${c.icon}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none">
      <div style="min-width:0"><div style="font-size:14px;line-height:18px;font-weight:600">${c.name}</div>
      <div style="font-size:12px;line-height:16px;color:#576f76;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:180px">${c.desc}</div>
      <div style="font-size:12px;line-height:16px;color:#576f76">${c.stats}</div></div></div>`).join('')}
    <div style="margin-top:20px;font-size:12px;line-height:16px;font-weight:600;color:#0a449b">See more communities</div>
  </div>
</div>`

// ---------- DoorDash ----------
const D = 'font-family:DDNorms,system-ui,sans-serif;'
const ITEMS = [
  { name: 'Double Smash Burger', price: '$11.49', rate: '95% (1.1k)', img: 'assets/img/burger.jpg', pos: '58% 50%', hero: true },
  { name: 'Single Smash', price: '$8.49', rate: '93% (640)', img: 'assets/img/f1.jpg', pos: '50% 50%' },
  { name: 'Crinkle Fries', price: '$3.99', rate: '96% (802)', img: 'assets/img/f2.jpg', pos: '50% 50%' },
  { name: 'Vanilla Shake', price: '$5.49', rate: '94% (377)', img: 'assets/img/f3.jpg', pos: '50% 45%' },
]
const card = (it) => `<div style="position:relative;width:182px">
  <div style="position:relative;width:182px;height:136px;border-radius:8px;overflow:hidden;background:#f7f7f7">
    <img src="${it.img}" style="width:100%;height:100%;object-fit:cover;object-position:${it.pos};transform:scale(1.04)"></div>
  <div ${it.hero ? 'id="ddPlusWrap"' : ''} style="position:absolute;left:142px;top:96px;width:32px;height:32px">
    <div ${it.hero ? 'id="ddPlus"' : ''} style="position:absolute;inset:0;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);display:grid;place-items:center">${i('plus', 16, 16, '#191919')}</div>
    ${it.hero ? '<div id="ddPlusQ" style="position:absolute;inset:0;border-radius:50%;background:#191919;color:#fff;font-size:14px;line-height:32px;font-weight:700;text-align:center;opacity:0">1</div>' : ''}</div>
  <div style="margin-top:10px;font-size:16px;line-height:22px;font-weight:700;color:#191919;white-space:nowrap">${it.name}</div>
  <div style="margin-top:2px;display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:#767676;white-space:nowrap"><span style="color:#191919">${it.price}</span><span>•</span>${i('thumb', 13, 13, '#767676')}<span>${it.rate}</span></div>
</div>`

export const DOORDASH_PAGE = `<div style="${D}position:absolute;inset:0;background:#fff;color:#191919">
  <div style="position:absolute;left:0;top:0;width:1180px;height:64px;border-bottom:1px solid #e7e7e7">
    <img src="assets/brand/doordash-mark.svg" style="position:absolute;left:28px;top:23px;height:17px">
    <img src="assets/brand/doordash-wordmark.svg" style="position:absolute;left:62px;top:25px;height:13px">
    <div style="position:absolute;right:16px;top:12px;height:40px;display:flex;align-items:center;gap:12px">
      <span style="height:40px;padding:0 16px;border-radius:9999px;background:#f1f1f1;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700">${i('pin', 16, 16, '#191919')}411 Pine St</span>
      <span style="width:40px;height:40px;border-radius:50%;background:#f1f1f1;display:grid;place-items:center">${i('user', 18, 18, '#191919')}</span>
      <span id="ddCart" style="height:40px;padding:0 16px;border-radius:9999px;background:#eb1700;color:#fff;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700">${i('cart', 18, 18, '#fff')}<span id="ddCartN">0</span></span></div>
  </div>
  <div style="position:absolute;left:110px;top:84px;font-size:12px;line-height:16px;font-weight:700">Home</div>
  <div style="position:absolute;left:110px;top:108px;font-size:24px;line-height:32px;font-weight:800;letter-spacing:-.2px;white-space:nowrap">Smashville Burger Co.</div>
  <div style="position:absolute;left:110px;top:160px;width:200px">
    <div style="font-size:16px;line-height:22px;font-weight:700">Store Info</div>
    <div style="margin-top:8px;font-size:14px;line-height:20px">$$ • Burgers, American</div>
    <div style="margin-top:10px;height:28px;border:1px solid #e7e7e7;border-radius:9999px;padding:0 12px;font-size:14px;line-height:26px;font-weight:700">See more</div>
    <div style="margin-top:16px;height:1px;background:#e7e7e7"></div>
    <div style="margin-top:16px;font-size:16px;line-height:22px;font-weight:700">All Day</div>
    <div style="margin-top:4px;font-size:14px;line-height:20px">11:00 am - 10:00 pm</div>
    <div style="margin-top:14px;font-size:14px;line-height:20px">
      ${['Featured Items', 'Burgers', 'Sides', 'Shakes', 'Drinks', 'Desserts'].map((c, k) => `<div style="position:relative;height:31px;line-height:31px;padding-left:14px;${k === 0 ? 'font-weight:700' : 'color:#494949'}">${k === 0 ? '<span style="position:absolute;left:0;top:4px;width:4px;height:23px;border-radius:2px;background:#191919"></span>' : ''}${c}</div>`).join('')}</div>
  </div>
  <div style="position:absolute;left:880px;top:96px;width:230px;height:36px;border-radius:9999px;background:#f1f1f1;display:flex;align-items:center;gap:8px;padding:0 14px;font-size:14px;color:#767676;white-space:nowrap">${i('search', 14, 14, '#191919')}Search Smashville Burger Co.</div>
  <div style="position:absolute;left:332px;top:146px;width:778px;height:70px;border:1px solid #e7e7e7;border-radius:8px">
    <div style="position:absolute;left:20px;top:16px"><div style="font-size:14px;line-height:20px;font-weight:700">4.8 ★ <span style="font-weight:500;color:#767676">(2,100+ ratings) • 1.1 mi</span></div><div style="font-size:13px;line-height:18px;color:#767676">$$ • Burgers</div></div>
    <div style="position:absolute;right:178px;top:16px;text-align:right"><div style="font-size:14px;line-height:20px;font-weight:700">$0 delivery fee, first order</div><div style="font-size:13px;line-height:18px;color:#767676">pricing &amp; fees</div></div>
    <div style="position:absolute;right:150px;top:14px;width:1px;height:40px;background:#e7e7e7"></div>
    <div style="position:absolute;right:28px;top:16px;text-align:center;width:100px"><div style="font-size:14px;line-height:20px;font-weight:700">25 min</div><div style="font-size:13px;line-height:18px;color:#767676">delivery time</div></div>
  </div>
  <div style="position:absolute;left:332px;top:238px;width:778px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:20px;line-height:28px;font-weight:700">Featured Items</div>
    <div style="display:flex;gap:8px"><span style="width:32px;height:32px;border-radius:50%;background:#f1f1f1;display:grid;place-items:center">${i('left', 16, 16, '#bdbdbd')}</span><span style="width:32px;height:32px;border-radius:50%;background:#f1f1f1;display:grid;place-items:center">${i('right', 16, 16, '#191919')}</span></div></div>
  <div style="position:absolute;left:332px;top:282px;display:flex;gap:16px">${ITEMS.map(card).join('')}</div>
  <div style="position:absolute;left:332px;top:500px;font-size:20px;line-height:28px;font-weight:700">Burgers</div>
  <div style="position:absolute;left:332px;top:540px;display:flex;gap:16px">
    ${[['Double Smash Burger', 'Two smashed patties, American cheese, pickles, onion, Smash sauce, potato bun.', '$11.49', 'assets/img/burger.jpg'], ['Chicken Sandwich', 'Crispy fried chicken, pickles, slaw, spicy mayo, potato bun.', '$9.99', 'assets/img/f4.jpg']].map(([n, d, pr, im]) => `
    <div style="position:relative;width:381px;height:140px;border:1px solid #e7e7e7;border-radius:8px;overflow:hidden">
      <div style="position:absolute;left:16px;top:14px;width:220px"><div style="font-size:16px;line-height:22px;font-weight:700">${n}</div>
      <div style="margin-top:4px;font-size:13px;line-height:18px;color:#767676">${d}</div><div style="margin-top:6px;font-size:14px;line-height:20px">${pr}</div></div>
      <img src="${im}" style="position:absolute;right:0;top:0;width:138px;height:138px;object-fit:cover"></div>`).join('')}
  </div>
</div>`

// ---------- end card ----------
const MARK = ICONS['storm-tile-bare:28'].replace('<svg ', '<svg width="100%" height="100%" ')
const PILLS = [
  ['assets/tiles/openai.webp', 'Switched to GPT Image 2', 'made the meme'],
  ['assets/tiles/openai.webp', 'Switched to GPT-5.6 Sol', 'searched Reddit'],
  ['assets/tiles/anthropic.png', 'Switched to Claude Fable 5', 'ordered the burger'],
]
export const END_CARD = `
  <div id="endMark" class="plainmark" style="position:absolute;left:916px;top:286px;width:88px;height:88px">${MARK}</div>
  <div id="endHead" style="position:absolute;left:0;top:398px;width:1920px;text-align:center;font-family:var(--serif);font-size:84px;line-height:96px;color:var(--fg)">Every model. One chat.</div>
  <div id="endPills" style="position:absolute;left:0;top:556px;width:1920px;display:flex;justify-content:center;gap:28px">
    ${PILLS.map(([src, lab, cap], k) => `<div id="endPill${k}" style="display:flex;flex-direction:column;align-items:center;gap:14px">
      <div style="height:52px;display:flex;align-items:center;gap:12px;padding:0 20px 0 9px;border-radius:9999px;background:var(--raised);border:1.5px solid var(--line);white-space:nowrap">
        <span style="width:33px;height:33px;border-radius:13px;overflow:hidden;display:block"><img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block"></span>
        <span style="font-size:21px;line-height:30px;font-weight:600;color:var(--fg)">${lab}</span>
        <span style="width:24px;height:24px;color:var(--ok);display:block">${ICONS.check.replace('<svg ', '<svg width="24" height="24" ')}</span></div>
      <div style="font-size:19px;line-height:24px;color:var(--muted)">${cap}</div></div>`).join('')}
  </div>
  <div id="endUrl" style="position:absolute;left:0;top:742px;width:1920px;text-align:center;font-size:30px;line-height:36px;font-weight:600;color:var(--fg);letter-spacing:.2px">superbot.gg</div>`
