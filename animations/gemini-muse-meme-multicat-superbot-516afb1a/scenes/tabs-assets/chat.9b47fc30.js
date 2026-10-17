// The Gemini-only chat: one ask is typed into the composer and sent, superbot routes it to Gemini (its routing chip
// and the composer's platform chip swap to Gemini), and Gemini answers with its own beat (./beats/gemini.js). The
// thread is bottom-anchored so the message rises out of the composer. A variant can send the ask down another route
// (routeBy: its app, chip labels and beat; 'doordash' orders a burger instead), timed on the base route's clock; a
// route with more chips than the base answers later and its loop runs that much longer (leadOf).
// renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat import busts GitHub Pages' 10-minute
// module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.9b47fc30.js';
import { makeCursor } from '../../shell.9b47fc30.js';
import gemini from './beats/gemini.9b47fc30.js?v=8';
import doordash from './beats/doordash.d9bc17e9.js?v=3';
import climb from './beats/climb.080da517.js?v=1';
import catsurf from './beats/catsurf.e2265c3a.js?v=4';
import catsurf10 from './beats/catsurf10.a35789f3.js?v=2';
import catgif from './beats/catgif.df575a7c.js?v=1';
import song from './beats/song.b217c2c1.js?v=8';
import bedtime from './beats/bedtime.b60749a3.js?v=1';
import podcast from './beats/podcast.3b06d700.js?v=1';
import pitchdeck from './beats/pitchdeck.fad54971.js?v=2';
import bakery from './beats/bakery.005f5570.js?v=3';
import spending from './beats/spending.b92c87dc.js?v=1';
import traderjoes from './beats/traderjoes.4aaedb8c.js?v=5';
import skydio from './beats/skydio.c9774aa7.js?v=2';
import reminder from './beats/reminder.e55fb320.js?v=3';
import computerV3 from './beats/computer.ba3976b6.js?v=8';
import multicat, { TYPE_CPS as MULTICAT_CPS, LEN as MULTICAT_LEN } from './beats/multicat.516afb1a.js?v=2';
import multidog, { TYPE_CPS as MULTIDOG_CPS, LEN as MULTIDOG_LEN } from './beats/multidog.7b007b09.js?v=1';
import { variant } from '../../variant.9e82faf1.js?v=3';
import { LOGO as TRADERJOES_LOGO } from './beats/traderjoes-data.4aaedb8c.js';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  chatgpt: { name: 'ChatGPT', logo: brand('openai-logo.svg'), sub: 'in superbot' }, // the skydio variant's answering app (its reply header reads ChatGPT in superbot)
  gslides: { name: 'Google Slides', logo: brand('slides-logo.svg'), sub: '', tool: true }, // a connected tool, never the answering app (Gemini answers)
  fal: { name: 'fal.ai', logo: brand('fal-icon.svg'), sub: 'in superbot' }, // the catsurf variant's answering app: fal.ai renders the video and answers
  gmaps: { name: 'Google Maps', logo: brand('maps-logo.svg'), sub: '', tool: true }, // the roadtrip variant's connected tool, likewise
  maps: { name: 'Maps', logo: brand('maps-logo.svg'), sub: 'in superbot' }, // the roadtrip variant's answering app (its reply header reads Maps in superbot)
  gsheets: { name: 'Google Sheets', logo: img('spending.b92c87dc/google-sheets.svg'), sub: '', tool: true }, // the spending variant's connected tool, likewise
  skydio: { name: 'Skydio', logo: img('skydio.c9774aa7/skydio-mark.png'), sub: '', tool: true }, // the skydio variant's browsed site, likewise (ChatGPT answers)
  traderjoes: { name: "Trader Joe's", logo: img(TRADERJOES_LOGO), sub: '', tool: true }, // the traderjoes variant's connected store, likewise (Gemini answers)
  doordash: { name: 'DoorDash', logo: brand('doordash-logo.svg'), sub: 'in superbot' },
  meshy: { name: 'Meshy', logo: brand('meshy-icon.svg'), sub: 'in superbot' },
  fishaudio: { name: 'Fish Audio', logo: brand('fishaudio-logo.svg'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' }, // the bakery variant's answering model
  // the multicat variant's image model and song model (beats/multicat.516afb1a.js); Meshy and DoorDash are above
  gptimage: { name: 'GPT Image 2', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  elevenlabs: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  // a connector, not a model: its chip leaves the composer's platform chip on the model (renderRouting)
  youtube: { name: 'YouTube', logo: img('climb.080da517/youtube.svg'), sub: '', tool: true },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

const BASE = [
  {
    app: 'gemini', mod: gemini, chips: [['gemini', 'Switching to Gemini']], ask: 'make me a muse meme',
    askBy: { photoedit: 'Remove the guy in the back and make it night', pitchdeck: 'Make a slide deck for my pitch', spending: 'Make a chart of my monthly spending', skydio: 'I need a slide for Skydio drones as our club will have a guest speaker from skydio talking about what the company does and focuses on along with emphaises on what there fort collins office does', traderjoes: "Make me a college quick and easy week Trader Joe's list for food. I want to optimized for performance I run 4 times a week around 25 miles and lift 3-4 days a week carbs are good but also make sure I get in lost of protein and fruits and veggies", 10: 'make me 10 muse memes','3d': 'Make me a 3d zombie', game: 'Make me a zombie game', doordash: 'order me a burger on doordash', garden: 'make me a garden design template', roadtrip: 'Plan a road trip from LA to SF on a map', climbing: 'Show me rock climbing videos', catsurf: 'Make a video of a cat surfing', catsurf10: 'Make 10 videos of a cat surfing',catgif: 'Make a GIF of a dancing cat', logo: 'Design a logo for my coffee shop', song: 'Make me a song about my dog', bedtime: 'Read this bedtime story out loud', bakery: 'Build me a website for my bakery', podcast: 'Make a podcast episode about space', reminder: 'Set a notification to go off in my phone in one hour', 'computer-control-v3-soft': 'Take computer control and open a tab', lawn: 'Add a garden in my front lawn visually, address is Raleigh, North Carolina, USA', multicat: 'Make me a realistic image of a cat', multidog: 'Make me a realistic image of a dog' },
    // the photo a variant attaches to its ask: shown on the user's bubble and as a chip in the composer while the ask types
    attachBy: { photoedit: img('photoedit.2a3b1461/photo.jpg') },
    // every generating variant spends superbot credits until the user links their own plan: a framed row under the
    // resolved chip, tiled with the route's app, shows what the generation charged and a connect button. Priced off
    // 4 a picture; the variants that only fetch, order, schedule or drive the computer (doordash, roadtrip, climbing,
    // reminder, computer-control-v3-soft) charge none
    creditsBy: { 1: 4, 10: 40, photoedit: 4, logo: 4, garden: 4, '3d': 20, game: 12, catgif: 10, catsurf: 25, catsurf10: 250, song: 15, bedtime: 6, podcast: 20, pitchdeck: 12, spending: 3, traderjoes: 3, skydio: 6, bakery: 18, lawn: 4, multicat: 4, multidog: 4 },
    // one [app, label] per base chip, so the route keeps the base chips' clock; a route with more chips than the base
    // lands them one after another (CHIP_STRIDE each), so its reply and beat start that much later and its loop runs
    // that much longer (see leadOf). `extra` seconds stretch that variant's loop past the base route's end (the beat
    // is the last, so nothing after it moves). `typeCps` types that variant's ask at that many characters a second
    // instead of the base window (see typing), which moves its send, chips, reply and beat later by the difference
    routeBy:{ photoedit: { app: 'gemini', mod: gemini, chips: [['gemini', 'Switching to Gemini']] }, lawn: { app: 'gemini', mod: gemini, chips: [['gmaps', 'Connecting to Maps'], ['gemini', 'Switching to Gemini']], typeCps: 80, extra: 3.63 }, '3d': { app: 'meshy', mod: gemini, chips: [['meshy', 'Switching to Meshy']] }, pitchdeck: { app: 'gemini', mod: pitchdeck, chips: [['gslides', 'Connecting to Google Slides'], ['gemini', 'Switching to Gemini']] }, roadtrip: { app: 'maps', mod: gemini, chips: [['gmaps', 'Connecting to Maps']] }, spending: { app: 'gemini', mod: spending, chips: [['gsheets', 'Connecting to Google Sheets'], ['gemini', 'Switching to Gemini']] }, skydio: { app: 'chatgpt', mod: skydio, chips: [['skydio', 'Reading skydio.com'], ['chatgpt', 'Switching to ChatGPT']], typeCps: 80, extra: 1.6 }, traderjoes: { app: 'gemini', mod: traderjoes, chips: [['traderjoes', "Connecting to Trader Joe's"], ['gemini', 'Switching to Gemini']], typeCps: 100, extra: 1.2 }, doordash:{ app: 'doordash', mod: doordash, chips: [['doordash', 'Connecting to DoorDash']] }, climbing: { app: 'deepseek', mod: climb, chips: [['youtube', 'Connecting to Youtube'], ['deepseek', 'Switching to DeepSeek']] }, catsurf: { app: 'fal', mod: catsurf, chips: [['fal', 'Connecting Fal.ai']], extra: 7 }, catsurf10: { app: 'fal', mod: catsurf10, chips: [['fal', 'Connecting Fal.ai']], extra: 7 },catgif: { app: 'gemini', mod: catgif, chips: [['gemini', 'Switching to Gemini']] }, song: { app: 'fishaudio', mod: song, chips: [['fishaudio', 'Connected to Fish Audio']], extra: 5 }, bedtime: { app: 'gemini', mod: bedtime, chips: [['gemini', 'Switching to Gemini']] }, bakery: { app: 'opus', mod: bakery, chips: [['opus', 'Switching to Opus 5.5']] }, podcast: { app: 'gemini', mod: podcast, chips: [['gemini', 'Switching to Gemini']] }, reminder: { app: 'superbot', mod: reminder, chips: [['superbot', 'Connecting to your phone']], extra: 1.5 }, 'computer-control-v3-soft': { app: 'superbot', mod: computerV3, chips: [['superbot', 'Taking control of your computer']], extra: 1.6 }, multicat: { app: 'gptimage', mod: multicat, chips: [['gptimage', 'Switching to GPT Image 2']], typeCps: MULTICAT_CPS, extra: MULTICAT_LEN - gemini.times(0).end }, multidog: { app: 'gptimage', mod: multidog, chips: [['gptimage', 'Switching to GPT Image 2']], typeCps: MULTIDOG_CPS, extra: MULTIDOG_LEN - gemini.times(0).end } },
  },
];

// the ask as the current variant words it; its typing window stays timed off `ask`, so every variant loops the same length
const askOf = (k) => (k.askBy && k.askBy[variant()]) || k.ask;
// the photo the current variant attaches to the ask, or '' when it attaches none
const attachOf = (k) => (k.attachBy && k.attachBy[variant()]) || '';
// the route a beat takes under variant v (mountChat builds one per routeBy entry, plus the base)
const routeOf = (b, v) => b.routes[v] || b.routes.base;

// the routing chips' clock: each chip lands, moves the platform chip to its app (swap) and resolves (done); the next
// lands just after, CHIP_STRIDE later
const CHIP_STRIDE = 0.77;
const chipsAt = (sw, list) => list.map(([app, label], i) => { const at = sw + i * CHIP_STRIDE; return { app, label, sw: at, swap: at + 0.22, done: at + 0.65 }; });
// the ask's typing under variant v: the base window (timeBeats) unless the route sets `typeCps`, which types the
// variant's own ask at that rate (a long ask would otherwise flash by in the base's under-a-second window). send, sw and
// the shift of everything after them (`delta`) follow; a variant without `typeCps` gets the base's values untouched
function typing(k, v) {
  const o = (k.routeBy || {})[v];
  if (!k.ask || !o || !o.typeCps) return { typeEnd: k.typeEnd, send: k.send, sw: k.sw, delta: 0 };
  const typeEnd = k.s + ((k.askBy && k.askBy[v]) || k.ask).length / o.typeCps;
  const send = typeEnd + 0.15, sw = send + 0.35;
  return { typeEnd, send, sw, delta: sw - k.sw };
}
// how much later a route with more chips than the base's lands its reply (and ends its loop)
const leadOf = (o, base) => Math.max(0, o.chips.length - base.chips.length) * CHIP_STRIDE;

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.35;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.2;         // superbot carries on without being asked
    }
    k.chips = chipsAt(k.sw, a.chips);
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.08;  // the app answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(BASE);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;
// the loop's end under variant v: the base end plus the last beat's route `extra` and any longer typing
export const chatEnd = (v) => { const last = BASE[BASE.length - 1], o = (last.routeBy || {})[v]; return CHAT_END + (o ? leadOf(o, last) + (o.extra || 0) + typing(BEATS[BEATS.length - 1].k, v).delta : 0); };
// when the first ask is sent under variant v (the empty state's composer drop and camera follow it), and how much
// later than the base the variant's ask is sent (its art, __AD.ART, shifts by the same)
export const sendAt = (v) => typing(BEATS[0].k, v).send;
export const typeShift = (v) => typing(BEATS[0].k, v).delta;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const whoOf = (app) => `${tile(app)}<b>${APPS[app].name}</b>${APPS[app].sub ? `<small>${APPS[app].sub}</small>` : ''}`;
  // a chained beat (multicat, multidog) draws its own follow-up chips and replies with the engine's markup and motion
  Object.assign(ctx, { who: whoOf, sbAvatar, appear, renderSwitch });
  const build = ({ k }) => {
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><img class="qc-att" alt="" width="640" height="480" style="display:none"/><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    // one chip row per chip of the longest route; show() hides the rows a route does not use
    const nSw = Math.max(k.chips.length, ...Object.values(k.routeBy || {}).map((o) => o.chips.length));
    const sws = Array.from({ length: nSw }, (_, i) => {
      const c = k.chips[i] || k.chips[0]; // a spare row's content is set by show()
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), swl: w.querySelector('.qc-swl'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const credits = k.creditsBy ? add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-cr">${tile('gemini')}<span class="qc-cr-t">Credits used until you connect</span><span class="qc-cr-n"></span><button type="button" class="qc-cr-b">Connect</button></span></div></div>`) : null;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${whoOf(k.app)}</div></div></div>`);
    const main = r.querySelector('.m-main');
    // every route is built once into the reply; show() picks the one the variant takes
    const routes = { base: { app: k.app, chips: k.chips, reply: k.reply, typeEnd: k.typeEnd, send: k.send, long: false, inst: k.mod.build(k, ctx) } };
    Object.entries(k.routeBy || {}).forEach(([v, o]) => {
      const ty = typing(k, v);
      const chips = chipsAt(ty.sw, o.chips), lead = leadOf(o, k);
      const reply = chips[chips.length - 1].done + 0.08;
      routes[v] = { app: o.app, chips, reply, typeEnd: ty.typeEnd, send: ty.send, long: !!o.typeCps, inst: o.mod.build({ ...k, app: o.app, chips, done: chips[chips.length - 1].done, reply, sw: ty.sw, typeEnd: ty.typeEnd, send: ty.send, T: o.mod.times(reply, k.T.end + lead + ty.delta + (o.extra || 0)) }, ctx) };
    });
    Object.values(routes).forEach((ro) => ro.inst.nodes.forEach((n) => main.appendChild(n)));
    return { k, u, ut: u && u.querySelector('.m-text'), ua: u && u.querySelector('.qc-att'), sws, credits, creditsN: credits && credits.querySelector('.qc-cr-n'), creditsTile: credits && credits.querySelector('.qc-tile'), r, who: main.firstElementChild, routes, route: null, v: null };
  };
  // the variant's route: only its beat's nodes show, and the chips and the reply header name its app
  const show = (b, v) => {
    const ro = routeOf(b, v);
    Object.values(b.routes).forEach((x) => x.inst.nodes.forEach((n) => { n.style.display = x === ro ? '' : 'none'; }));
    b.sws.forEach((s, i) => {
      const ch = ro.chips[i];
      s.w.style.display = ch ? '' : 'none';
      if (!ch) return;
      s.c = ch;
      s.sw.firstElementChild.replaceWith(el(tile(ch.app)));
      s.swl.textContent = ch.label;
    });
    if (b.credits) {
      const n = b.k.creditsBy[v];
      b.credits.style.display = n ? '' : 'none';
      b.creditsN.textContent = n ? `${n} credits` : '';
      b.creditsTile.replaceWith(b.creditsTile = el(tile(ro.app)));
    }
    b.who.innerHTML = whoOf(ro.app);
    b.route = ro; b.v = v;
  };
  const beats = BEATS.map(build);
  beats.forEach((b) => show(b, variant()));
  // scroll marks per variant: after each time, the feed's fold glides to that element's bottom
  const scrolls = {};
  const scrollOf = (v) => scrolls[v] || (scrolls[v] = beats.flatMap((b) => [...(b.u ? [[routeOf(b, v).send, b.u]] : []), ...b.sws.slice(0, routeOf(b, v).chips.length).map((s, i) => [routeOf(b, v).chips[i].sw, s.w]), [routeOf(b, v).reply, b.who], ...routeOf(b, v).inst.marks]).sort((x, y) => x[0] - y[0]));

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, beats, show, scrollOf, plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k, route }) => k.ask && t >= k.s && t < route.send);
  // a chained route types its own follow-up asks here too: its beat's inst.asks, [{ text, s, typeEnd, send }]
  const more = c.beats.flatMap(({ route }) => route.inst.asks || []);
  const f = b ? null : more.find((a) => t >= a.s && t < a.send);
  let ph;
  if (b) {
    const ask = askOf(b.k);
    const n = Math.round(ask.length * seg(t, b.k.s, b.route.typeEnd));
    const att = attachOf(b.k);
    ph = `${att ? `<img class="qc-pchip" alt="" width="28" height="21" src="${att}"/>` : ''}<span class="qc-typed">${esc(ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else if (f) {
    ph = `<span class="qc-typed">${esc(f.text.slice(0, Math.round(f.text.length * seg(t, f.s, f.typeEnd))))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!(b || f));
  const at = [...c.beats.filter(({ k }) => k.ask).map(({ route }) => route.send), ...more.map((a) => a.send)].find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'codex', swap = -1;
  // a chained route's later chips (inst.chips, in time order) move it too; a chip flagged `tool` (superbot's own step) does not
  c.beats.forEach((b) => [...b.route.chips, ...(b.route.inst.chips || [])].forEach((ch) => { if (t >= ch.swap && !APPS[ch.app].tool && !ch.tool) { app = ch.app; swap = ch.swap; } }));
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.scrollOf(variant())) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
  // clip at that anchor line: anything laid out below the newest line otherwise bled a device-pixel sliver through
  // the feed's antialiased bottom edge, just above the composer
  const clip = `inset(0 0 ${8 + parseFloat(cs.paddingBottom)}px 0)`;
  if (c.feed.style.clipPath !== clip) c.feed.style.clipPath = clip;
}

export function renderChat(c, t) {
  if (!c) return;
  const v = variant();
  c.beats.forEach((b) => { if (b.v !== v) c.show(b, v); });
  // a variant that types a long ask lets the composer wrap it (traderjoes.4aaedb8c.css .qc-long); the base keeps its one line
  c.hub.classList.toggle('qc-long', c.beats.some((b) => b.route.long));
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) {
      appear(b.u, t, b.route.send);
      const ask = askOf(b.k);
      if (b.ut.textContent !== ask) b.ut.textContent = ask;
      const att = attachOf(b.k);
      if (b.ua.getAttribute('src') !== (att || null)) { if (att) b.ua.src = att; else b.ua.removeAttribute('src'); b.ua.style.display = att ? '' : 'none'; }
    }
    b.sws.slice(0, b.route.chips.length).forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    // the credits frame lands once the last chip resolves; the reply's glide brings it into view
    if (b.credits && b.credits.style.display !== 'none') appear(b.credits, t, b.route.chips[b.route.chips.length - 1].done + 0.1);
    appear(b.r, t, b.route.reply);
    b.route.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.route.inst.pointer && b.route.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
