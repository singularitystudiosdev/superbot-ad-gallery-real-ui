// The four-request chat the hub plays once the main frame has landed. Each ask is typed into the composer and sent,
// superbot routes it (its routing chip, the rail selection and the composer's platform chip all follow the app), and
// the routed app answers in the feed. renderChat(c, t) is a pure function of the tabs scene's local time.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, stream } from '../../lib.js';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 8.9; // the welcome reply has finished streaming (tabs T.msg + T.msgDur = 8.52)

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  cursor: { name: 'Cursor', logo: brand('cursor-logo.svg'), sub: 'in superbot' },
  doordash: { name: 'DoorDash', logo: brand('doordash-logo.svg'), sub: 'connected' },
  superbot: { name: 'superbot', logo: null, sub: '' },
};

const ASKS = [
  { app: 'gemini', verb: 'Switching to', ask: 'make me a muse meme', say: 'Here’s your Muse meme.', work: 1.5, hold: 1.5 },
  { app: 'cursor', verb: 'Switching to', ask: 'ok now write me a script that uploads that to all my twitters', say: 'Wrote post_to_x.py and ran it on all 4 of your accounts.', work: 2.1, hold: 1.1 },
  { app: 'doordash', verb: 'Connecting to', ask: 'ok now im hungry', say: 'Ordered your usual from Smash Shack.', work: 1.7, hold: 1.1 },
  { app: 'superbot', verb: 'Switching to', ask: 'ok now download me 100 mp3 files of copyrighted songs from youtube', say: 'On it. 100 tracks, 320 kbps mp3.', work: 2.2, hold: 1.4 },
];

// every beat's clock, laid end to end from CHAT_T0
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((b) => {
    const k = { ...b, s };
    k.typeEnd = s + Math.min(1.1, 0.25 + b.ask.length * 0.02);
    k.send = k.typeEnd + 0.22;
    k.sw = k.send + 0.5;      // superbot's routing chip lands
    k.swap = k.sw + 0.3;      // rail + platform chip move to the app
    k.done = k.sw + 1.0;      // the chip resolves
    k.reply = k.done + 0.12;  // the app answers
    k.work0 = k.reply + 0.35;
    k.work1 = k.work0 + b.work;
    s = k.work1 + b.hold;
    return k;
  });
})();
export const CHAT_END = BEATS[BEATS.length - 1].work1 + BEATS[BEATS.length - 1].hold;

const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const tile = (app, sbSrc) => `<span class="qc-tile qc-t-${app}"><img src="${app === 'superbot' ? sbSrc : APPS[app].logo}" alt=""/></span>`;

const CODE = [
  [['k', 'import'], ' tweepy, json'],
  [],
  [['k', 'for'], ' acct ', ['k', 'in'], ' json.', ['f', 'load'], '(', ['f', 'open'], '(', ['s', '"accounts.json"'], ')):'],
  ['    api = tweepy.', ['f', 'API'], '(tweepy.', ['f', 'OAuth1UserHandler'], '(*acct[', ['s', '"keys"'], ']))'],
  ['    media = api.', ['f', 'media_upload'], '(', ['s', '"muse_meme.png"'], ')'],
  ['    api.', ['f', 'update_status'], '(', ['s', '""'], ', media_ids=[media.media_id])'],
  ['    ', ['f', 'print'], '(', ['s', '"posted @"'], ' + acct[', ['s', '"handle"'], '])'],
];
const HANDLES = ['muse_daily', 'musememes', 'sam_builds', 'sam_alt'];
const ORDER = [['Double smash burger', '$12.49'], ['Large fries', '$4.29'], ['Vanilla shake', '$5.49']];

function card(app) {
  if (app === 'gemini') {
    return `<div class="qc-img"><img src="${img('muse-meme.png')}" width="870" height="1024" alt="Muse meme"/><i class="qc-gen"></i><span class="qc-genl">${tile('gemini')}Creating image</span></div>`;
  }
  if (app === 'cursor') {
    const lines = CODE.map((toks, i) => `<div class="qc-ln"><i>${i + 1}</i><span class="qc-lc">${toks.map((x) => (typeof x === 'string' ? esc(x) : `<span class="qc-${x[0]}">${esc(x[1])}</span>`)).join('')}</span></div>`).join('');
    return `<div class="qc-code"><div class="qc-bar"><img src="${APPS.cursor.logo}" alt=""/>post_to_x.py<small>Python</small></div><div class="qc-pre">${lines}</div>`
      + `<div class="qc-run"><span class="qc-cmd">$ python post_to_x.py</span><div class="qc-hs">${HANDLES.map((h) => `<span class="qc-h">${OK}@${h}</span>`).join('')}</div></div></div>`;
  }
  if (app === 'doordash') {
    return `<div class="qc-dd"><div class="qc-dd-top"><img src="${brand('doordash-wordmark.svg')}" alt="DoorDash"/><span>Smash Shack · 1.2 mi</span></div>`
      + ORDER.map(([n, p]) => `<div class="qc-dd-row"><span>1×</span><span>${n}</span><span>${p}</span></div>`).join('')
      + '<div class="qc-dd-tot"><span>Total with fees</span><b>$26.37</b></div>'
      + '<div class="qc-dd-trk"><i></i><i></i><i></i></div><div class="qc-dd-steps"><span>Ordered</span><span>Preparing</span><span>On the way</span></div>'
      + `<div class="qc-dd-st"><span class="qc-dd-ok">${OK}</span><b>Ordered</b><small>Arriving 12:48 PM</small></div></div>`;
  }
  const rows = [0, 1, 2, 3].map(() => `<div class="qc-dl-row"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><span></span><small></small>${OK}</div>`).join('');
  return `<div class="qc-dl"><div class="qc-dl-top"><svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg><span>~/Music/superbot</span><b>0 / 100</b></div>`
    + `<div class="qc-dl-bar"><i></i></div><div class="qc-dl-rows">${rows}</div><div class="qc-fin">${OK}All 100 mp3s are in your Music folder.</div></div>`;
}

export function mountChat(hub) {
  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);

  const make = (html) => { const w = document.createElement('div'); w.innerHTML = html.trim(); const n = w.firstChild; inner.appendChild(n); return n; };
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map((b) => {
    const a = APPS[b.app];
    const u = make(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(b.ask)}</div></div></div>`);
    const w = make(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(b.app, sbSrc)}<span class="qc-swl">${b.verb} ${a.name}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const r = make(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(b.app, sbSrc)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div><div class="qc-say"></div>${card(b.app)}</div></div>`);
    const q = (s) => r.querySelector(s);
    const qa = (s) => [...r.querySelectorAll(s)];
    return {
      b, u, w, r, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok'), say: q('.qc-say'), lastSay: null,
      img: q('.qc-img img'), gen: q('.qc-gen'), genl: q('.qc-genl'),
      lines: qa('.qc-lc'), run: q('.qc-run'), handles: qa('.qc-h'),
      ddRows: [...qa('.qc-dd-row'), q('.qc-dd-tot')].filter(Boolean), ddTrk: qa('.qc-dd-trk i'), ddSteps: qa('.qc-dd-steps span'), ddSt: q('.qc-dd-st'), ddOk: q('.qc-dd-ok'),
      dlN: q('.qc-dl-top b'), dlBar: q('.qc-dl-bar i'), dlRows: qa('.qc-dl-row'), fin: q('.qc-fin'), lastN: -1,
    };
  });

  // DoorDash is not on the rail yet: superbot connects it, so its tile grows into the rail at that beat
  const rail = hub.querySelector('.rail');
  const dd = document.createElement('span');
  dd.className = 'rail-item qc-rail-dd';
  dd.dataset.app = 'doordash';
  dd.innerHTML = `<img src="${APPS.doordash.logo}" alt=""/><i class="dot"></i>`;
  const divs = rail.querySelectorAll('.rail-div');
  rail.insertBefore(dd, divs[divs.length - 1]);

  // the composer's platform chip follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = document.createElement('span');
  pIcon.className = 'qc-pi';
  cat.replaceWith(pIcon);
  pIcon.appendChild(cat);
  const pImg = document.createElement('img');
  pImg.alt = '';
  pIcon.appendChild(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = document.createElement('span');
  pLabel.textContent = label ? label.textContent.trim() : 'superbot';
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const railItems = { superbot: hub.querySelector('.rail-item.sb'), gemini: rail.querySelector('.rail-item[data-app="gemini"]'), cursor: rail.querySelector('.rail-item[data-app="cursor"]'), doordash: dd };
  return {
    hub, feed, inner, beats, dd, railItems, plat, pIcon, cat, pImg, pLabel,
    ph: hub.querySelector('.rc-ph'), send: hub.querySelector('.rc-send'), phText: hub.querySelector('.rc-ph').textContent,
    geo: null, lastPh: null, lastApp: null,
  };
}

// layout is static (every message is laid out from mount, only faded), so offsets are measured once per size
function measure(c) {
  const key = `${c.feed.clientWidth}x${c.feed.clientHeight}|${document.fonts ? document.fonts.status : ''}`;
  if (c.geo && c.geo.key === key) return c.geo;
  if (!c.inner.offsetHeight) return null;
  const bottom = (n) => n.offsetTop + n.offsetHeight;
  const kids = [...c.inner.children];
  const firstOwn = c.beats[0].u;
  const base = bottom(kids[kids.indexOf(firstOwn) - 1]);
  const cs = getComputedStyle(c.feed);
  const view = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  c.geo = { key, base, view, items: c.beats.flatMap((k) => [[k.b.send, bottom(k.u)], [k.b.sw, bottom(k.w)], [k.b.reply, bottom(k.r)]]) };
  return c.geo;
}

function appear(n, t, a) {
  const p = outCubic(seg(t, a, a + 0.4));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const k = c.beats.find(({ b }) => t >= b.s && t < b.send);
  let ph;
  if (k) {
    const n = Math.round(k.b.ask.length * seg(t, k.b.s, k.b.typeEnd));
    ph = `<span class="qc-typed">${esc(k.b.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!k);
  const pressAt = c.beats.map(({ b }) => b.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = pressAt === undefined ? 'none' : `scale(${(1 - 0.14 * bump(seg(t, pressAt - 0.12, pressAt + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'superbot';
  let swap = -1;
  c.beats.forEach(({ b }) => { if (t >= b.swap) { app = b.app; swap = b.swap; } });
  Object.entries(c.railItems).forEach(([id, n]) => {
    if (!n) return;
    n.classList.toggle('sel', id === app);
    if (t < CHAT_T0) return;
    const s = id === app ? 1 + 0.14 * bump(seg(t, swap, swap + 0.45)) : 1;
    if (id !== 'doordash') n.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(4)})`;
  });
  // the DoorDash tile grows into the rail as superbot connects it
  const ddb = c.beats.find(({ b }) => b.app === 'doordash').b;
  const g = seg(t, ddb.sw, ddb.sw + 0.45);
  c.dd.style.height = `${(44 * outCubic(g)).toFixed(2)}px`;
  c.dd.style.marginTop = `${(-4 * (1 - outCubic(g))).toFixed(2)}px`;
  c.dd.style.opacity = outCubic(g).toFixed(3);
  const ddPop = app === 'doordash' ? 1 + 0.14 * bump(seg(t, swap, swap + 0.45)) : 1;
  c.dd.style.transform = `scale(${(lerp(0.4, 1, outBack(g)) * ddPop).toFixed(4)})`;
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    c.cat.style.display = app === 'superbot' ? '' : 'none';
    c.pImg.style.display = app === 'superbot' ? 'none' : '';
    if (app !== 'superbot') { c.pImg.src = APPS[app].logo; c.pImg.dataset.app = app; }
    c.pLabel.textContent = app === 'superbot' ? 'superbot' : APPS[app].name.toLowerCase();
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
}

function renderSwitch(k, t) {
  const { b } = k;
  const done = t >= b.done;
  k.sw.classList.toggle('qc-done', done);
  k.sw.style.setProperty('--sh', `${(100 - ((t - b.sw) * 140) % 200).toFixed(1)}%`);
  k.spin.style.opacity = (1 - seg(t, b.done - 0.08, b.done + 0.06)).toFixed(3);
  k.spin.style.transform = `rotate(${((t - b.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, b.done, b.done + 0.3);
  k.ok.style.opacity = o.toFixed(3);
  k.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
}

function renderWork(k, t) {
  const { b } = k;
  const say = stream(b.say, b.reply + 0.08, 70, t);
  if (say !== k.lastSay) { k.say.textContent = say; k.lastSay = say; }
  const p = seg(t, b.work0, b.work1);
  if (b.app === 'gemini') {
    const e = outCubic(p);
    k.img.style.filter = `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${lerp(0.4, 1, e).toFixed(3)})`;
    k.img.style.opacity = lerp(0.35, 1, e).toFixed(3);
    k.img.style.transform = `scale(${lerp(1.06, 1, e).toFixed(4)})`;
    k.gen.style.transform = `translateX(${lerp(-110, 110, (p * 2) % 1).toFixed(1)}%)`;
    k.gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
    k.genl.style.opacity = (1 - seg(t, b.work1 - 0.25, b.work1)).toFixed(3);
  } else if (b.app === 'cursor') {
    const typeEnd = b.work0 + 1.3;
    const total = CODE.reduce((s, l) => s + Math.max(4, l.length * 6), 0);
    let acc = 0;
    k.lines.forEach((n, i) => {
      const w = Math.max(4, CODE[i].length * 6);
      const lp = seg(t, lerp(b.work0, typeEnd, acc / total), lerp(b.work0, typeEnd, (acc + w) / total));
      acc += w;
      n.style.clipPath = lp >= 1 ? 'none' : `inset(0 ${(100 - lp * 100).toFixed(2)}% 0 0)`;
    });
    k.run.style.opacity = seg(t, typeEnd + 0.05, typeEnd + 0.3).toFixed(3);
    k.handles.forEach((h, i) => appear(h, t, typeEnd + 0.3 + i * 0.12));
  } else if (b.app === 'doordash') {
    k.ddRows.forEach((n, i) => appear(n, t, b.work0 + i * 0.1));
    k.ddTrk.forEach((n, i) => { n.style.setProperty('--f', i === 0 ? outCubic(seg(t, b.work0 + 0.5, b.work0 + 0.9)).toFixed(3) : '0'); });
    k.ddSteps[0].classList.toggle('on', t >= b.work0 + 0.9);
    appear(k.ddSt, t, b.work0 + 0.95);
    const o = seg(t, b.work0 + 1.0, b.work0 + 1.35);
    k.ddOk.style.transform = `scale(${lerp(0.2, 1, outBack(o)).toFixed(4)})`;
  } else {
    const n = Math.round(100 * inOutCubic(seg(t, b.work0, b.work1 - 0.35)));
    k.dlBar.style.width = `${n}%`;
    if (n !== k.lastN) {
      k.dlN.textContent = `${n} / 100`;
      k.dlN.classList.toggle('on', n === 100);
      k.dlRows.forEach((row, i) => {
        const id = n - 3 + i;
        row.style.visibility = id >= 1 ? 'visible' : 'hidden';
        if (id >= 1) {
          row.children[1].textContent = `song_${String(id).padStart(3, '0')}.mp3`;
          row.children[2].textContent = `${(5.1 + ((id * 37) % 29) / 10).toFixed(1)} MB`;
        }
      });
      k.lastN = n;
    }
    appear(k.fin, t, b.work1 - 0.2);
  }
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((k) => {
    appear(k.u, t, k.b.send);
    appear(k.w, t, k.b.sw);
    appear(k.r, t, k.b.reply);
    renderSwitch(k, t);
    renderWork(k, t);
  });
  // the feed follows the newest message: its bottom glides to the fold as each one lands
  const g = measure(c);
  if (!g) return;
  let bottom = g.base;
  g.items.forEach(([a, y]) => { if (t > a) bottom = lerp(bottom, y, inOutCubic(seg(t, a, a + 0.5))); });
  const scroll = Math.max(0, bottom + 6 - g.view);
  c.inner.style.transform = scroll > 0 ? `translateY(${(-scroll).toFixed(2)}px)` : 'none';
}
