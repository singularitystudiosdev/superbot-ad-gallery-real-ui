// scene chat: the whole ad after the cold open. One superbot chat window, four errands in a row. The user
// types, sends, and superbot picks up whichever tool the errand needs (Gemini for the meme, Cursor for the
// script, DoorDash for the food, itself for the 100 tracks) and hands back a finished thing. Every frame is a
// pure function of lt: the composer, the four turns, the handoff rows, the work chips and the camera are all
// written from lt, never from a clock or a timer.
// Brand marks: brand/gemini-logo.svg (simple-icons, CC0), brand/cursor-logo.svg and brand/doordash-logo.svg
// (the same files do-that-too uses; see brand/CREDITS.txt). The superbot mark is the live mascot (makeMark).
import * as L from '../lib.js';
import { makeShell, userBubble, botBlock, toolChip, setToolState, fileCard, cardGroup, setComposer,
  scrollFeed, feedOverflow, makeMark, ICON } from '../shell.js';

const brand = (f) => new URL('../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../img/' + f, import.meta.url).href;
const LOGO = { gemini: 'gemini-logo.svg', cursor: 'cursor-logo.svg', doordash: 'doordash-logo.svg' };

// ---------- the four errands ----------
// `label` is how superbot announces the pickup ("switching to" / "connecting to"), `hold` is how long the work
// chip spins before it reads done, `tail` is the settled beat before the next errand starts typing.
const BEATS = [
  { prompt: 'make me a muse meme', tool: 'gemini', lead: 'switching to', name: 'gemini',
    work: 'Generating meme', done: 'Meme ready', hold: 1.0, tail: 1.7, result: 'media' },
  { prompt: 'ok now write me a script that uploads that to all my twitters', tool: 'cursor', lead: 'switching to', name: 'cursor',
    work: 'Writing script', done: 'Script ready', hold: 0.9, tail: 1.5, result: 'script' },
  { prompt: 'ok now im hungry', tool: 'doordash', lead: 'connecting to', name: 'doordash',
    work: 'Placing order', done: 'Order placed', hold: 0.9, tail: 1.7, result: 'order' },
  { prompt: 'ok now download me 100 mp3 files of copyrighted songs from youtube', tool: 'superbot', lead: 'switching to', name: 'superbot',
    work: 'Downloading 100 tracks', done: 'Downloaded 100 tracks', hold: 1.6, tail: 2.5, result: 'files' },
];

// ---------- the beat sheet (local seconds), laid end to end ----------
const CPS = 46;                                   // typing speed into the composer
const AT = [];
{
  let c = 0.55;
  for (const b of BEATS) {
    const type = c;
    const send = L.typeEnd(b.prompt, type, CPS) + 0.22;   // last character + the press
    const handoff = send + 0.55;                          // user turn rises, then superbot picks the tool up
    const work = handoff + 0.5;
    const done = work + b.hold;
    const result = done + 0.3;
    const end = result + b.tail;
    AT.push({ type, send, handoff, work, done, result, end });
    c = end;
  }
}
const DUR = +(AT[AT.length - 1].end + 1.2).toFixed(2);

// ---------- copy ----------
const SCRIPT = [
  '# uploads that meme to every linked X account',
  'import schedule, tweepy',
  '',
  'def post(path, text):',
  '    for acct in ACCOUNTS:',
  '        tweepy.Client(acct).create_tweet(text=text, media_ids=up(acct, path))',
];
// minimal python colouring: a leading keyword, or a whole-line comment
function codeLine(line) {
  const m = line.match(/^(\s*)(import|def|for|return)\b/);
  if (m) return `${m[1]}<span class="k">${m[2]}</span>${L.esc(line.slice(m[1].length + m[2].length))}`;
  return line.startsWith('#') ? `<span class="c">${L.esc(line)}</span>` : L.esc(line);
}
const TRACKS = [
  ['Take On Me', 'a-ha', '3:46', '8.9 MB'], ['Africa', 'Toto', '4:55', '11.6 MB'],
  ['Mr. Brightside', 'The Killers', '3:42', '8.7 MB'], ['Bohemian Rhapsody', 'Queen', '5:55', '13.8 MB'],
  ['Blinding Lights', 'The Weeknd', '3:20', '7.8 MB'], ['Dreams', 'Fleetwood Mac', '4:17', '10.0 MB'],
];
const ORDER = [
  ['Big Mac combo', 'Large · no pickles'], ['Large fries', 'Salted'], ['6 pc McNuggets', 'Sweet & sour'],
];

let win, scrollY = 0, lastLt = NaN, OBJ = [], camKeys = [];

// ---------- builders ----------
function switchRow(spec) {
  const el = document.createElement('div');
  el.className = 'aio-switch';
  const logo = document.createElement('span');
  logo.className = 'aio-sw-logo aio-sw-' + spec.tool;
  if (spec.tool === 'superbot') {
    const m = makeMark(46);
    logo.appendChild(m.el);
    el._mark = m;
  } else {
    const im = document.createElement('img');
    im.src = brand(LOGO[spec.tool]); im.alt = ''; im.decoding = 'sync';
    logo.appendChild(im);
  }
  const t = document.createElement('span');
  t.className = 'aio-sw-t';
  t.innerHTML = `${L.esc(spec.lead)} <b>${L.esc(spec.name)}</b>`;
  el.append(logo, t);
  return el;
}

function mediaCard() {
  const el = document.createElement('div');
  el.className = 'aio-media';
  el.innerHTML = `<img src="${img('muse-meme.png')}" alt="the meme superbot made" decoding="sync">
    <div class="aio-media-cap"><b>muse-meme.png</b> 870×1024<span class="sbx-badge">PNG</span></div>`;
  return el;
}

function scriptCard() {
  const body = SCRIPT.map(codeLine).join('\n');
  const el = document.createElement('div');
  el.className = 'aio-code';
  el.innerHTML = `<div class="aio-code-h">${ICON.file}<b>post_to_x.py</b><span class="sbx-badge">Python · 2.1 KB</span></div><pre>${body}</pre>`;
  return el;
}

function orderCard() {
  const rows = ORDER.map(([name, meta]) => {
    const r = fileCard({ name, meta });
    r.classList.add('aio-order-row');
    const b = document.createElement('span');
    b.className = 'sbx-badge aio-ordered';
    b.textContent = 'Ordered';
    r.appendChild(b);
    return r;
  });
  const head = `<img src="${brand('doordash-logo.svg')}" alt="" style="width:13px;height:13px"><span>DoorDash · McDonald's</span><span class="sbx-badge aio-ordered" style="margin-left:auto">Ordered</span>`;
  const card = cardGroup(head, rows);
  const foot = document.createElement('div');
  foot.className = 'aio-order-foot';
  foot.innerHTML = `<b>Arriving 6:00–6:12 PM</b><em>$14.80</em>`;
  card.appendChild(foot);
  return card;
}

function filesCard() {
  const rows = TRACKS.map(([title, artist, dur, size], i) => {
    const r = fileCard({ name: title, meta: `${artist} · ${dur}`, kind: 'audio' });
    const n = document.createElement('span');
    n.className = 'aio-num';
    n.textContent = String(i + 1).padStart(2, '0');
    r.insertBefore(n, r.firstChild);
    r.style.setProperty('--sz', size);
    return r;
  });
  const grid = document.createElement('div');
  grid.className = 'aio-files';
  rows.forEach((r) => grid.appendChild(r));
  const head = `<span>100 videos <i style="font-style:normal;color:#5c5f68">→</i> audio</span><span class="sbx-badge">mp3</span><span style="margin-left:auto">100 files · 356 MB</span>`;
  const card = cardGroup(head, [grid]);
  const foot = document.createElement('div');
  foot.className = 'aio-dl';
  foot.innerHTML = `<span class="aio-dl-btn">${ICON.download}<b>Download all (.zip)</b></span><span>Saved to <code>~/Music/Superbot</code></span><em>356 MB</em>`;
  card.appendChild(foot);
  return card;
}

const RESULT = { media: mediaCard, script: scriptCard, order: orderCard, files: filesCard };

// ---------- mount ----------
export default {
  id: 'chat',
  dur: DUR,

  mount(section) {
    win = makeShell({
      mode: 'chat', title: 'All in one', active: 0, user: 'you@superbot.gg',
      projects: [
        { name: 'All in one', when: 'now' }, { name: 'muse meme generator', when: '12m' },
        { name: 'twitter auto-poster', when: '1h' }, { name: '100 songs to mp3', when: '2h' },
      ],
    });
    section.appendChild(win.root);

    OBJ = BEATS.map((spec, i) => {
      const u = userBubble(spec.prompt);
      const bot = botBlock();
      const sw = switchRow(spec);
      const chip = toolChip(spec.work, 'run');
      bot.append(sw, chip);

      let counter = null;
      if (spec.result === 'files') { counter = document.createElement('span'); counter.className = 'aio-count'; chip.appendChild(counter); }

      const res = RESULT[spec.result]();
      bot.appendChild(res);

      let extra = null;
      if (spec.result === 'script') {
        extra = toolChip('Posted to 12 X accounts', 'done');
        bot.appendChild(extra);
      }
      win.feedIn.append(u, bot);
      return { spec, at: AT[i], u, bot, sw, chip, counter, res, extra };
    });
  },

  render(lt, ctx) {
    win.renderMarks(ctx.t);

    // ---- composer: exactly one beat owns it at a time ----
    const typing = BEATS.findIndex((b, i) => lt >= AT[i].type && lt < AT[i].send);
    const ty = typing >= 0 ? L.typed(BEATS[typing].prompt, AT[typing].type, CPS, lt) : null;
    setComposer(win, ty ? ty.text : '', { press: typing >= 0 ? L.press(lt, AT[typing].send - 0.02) : 0, lit: typing >= 0 });

    // ---- the four turns ----
    for (const o of OBJ) {
      const { spec, at } = o;

      const sent = lt >= at.send;
      o.u.style.display = sent ? '' : 'none';
      const uP = L.outCubic(L.seg(lt, at.send, at.send + 0.42));
      L.op(o.u, uP);
      o.u.style.transform = `translateY(${((1 - uP) * 14).toFixed(2)}px)`;

      o.bot.style.display = lt >= at.handoff ? '' : 'none';

      const swP = L.outCubic(L.seg(lt, at.handoff, at.handoff + 0.42));
      L.op(o.sw, swP);
      o.sw.style.transform = `translateY(${((1 - swP) * 8).toFixed(2)}px) scale(${L.lerp(0.96, 1, swP).toFixed(4)})`;
      o.sw.style.setProperty('--glow', (1 - L.seg(lt, at.handoff + 0.55, at.handoff + 1.5)).toFixed(3));
      if (o.sw._mark) o.sw._mark.render(ctx.t);

      const wP = L.outCubic(L.seg(lt, at.work, at.work + 0.3));
      L.op(o.chip, wP);
      o.chip.style.transform = `translateY(${((1 - wP) * 6).toFixed(2)}px)`;
      const isDone = lt >= at.done;
      setToolState(o.chip, isDone ? 'done' : 'run', null, lt);
      o.chip.querySelector('.ch-tool-t').textContent = isDone ? spec.done : spec.work;
      if (o.counter) o.counter.textContent = `${Math.min(100, Math.floor(L.seg(lt, at.work + 0.15, at.done) * 100))}/100`;

      const rP = L.outCubic(L.seg(lt, at.result, at.result + 0.5));
      L.op(o.res, rP);
      o.res.style.transform = `translateY(${((1 - rP) * 10).toFixed(2)}px) scale(${L.lerp(0.985, 1, rP).toFixed(4)})`;

      if (o.extra) {
        const eP = L.outCubic(L.seg(lt, at.result + 0.35, at.result + 0.7));
        L.op(o.extra, eP);
        o.extra.style.transform = `translateY(${((1 - eP) * 6).toFixed(2)}px)`;
      }
    }

    // ---- the thread follows the newest turn ----
    const ov = feedOverflow(win);
    if (lt < lastLt || !Number.isFinite(scrollY)) scrollY = ov;   // restart / seek back: snap, do not glide
    else scrollY += (ov - scrollY) * 0.16;
    scrollFeed(win, scrollY);
    lastLt = lt;

    // ---- camera: in on the composer while it types, out to the thread while superbot works ----
    const W = ctx.W || 1920, H = 1080;
    win.root.style.transform = '';
    const frame = (cx, cy, sc) => ({ s: sc, tx: L.clamp(W / 2 - sc * cx, W - sc * W, 0), ty: L.clamp(H / 2 - sc * cy, H - sc * H, 0) });
    const F_full = () => ({ s: 1, tx: 0, ty: 0 });
    const F_feed = () => {
      const f = L.boxIn(win.feed, win.root);
      // 16:9 has window either side of the conversation column, so the push is free; on the narrow ratios
      // (4:3 / 1:1 / 4:5) the thread already spans the full window and any zoom would clip the turn.
      return frame(f.cx, f.y + f.h * 0.60, W >= 1600 ? 1.22 : 1);
    };
    if (!camKeys.length) {
      OBJ.forEach((o, i) => {
        // wide while the errand is being typed, then a push onto the thread as superbot picks the tool up
        camKeys.push([o.at.type - 0.35, o.at.handoff + 0.35, F_full, F_feed]);
        const pull = i === OBJ.length - 1 ? o.at.end + 0.9 : o.at.end - 0.45;
        camKeys.push([o.at.result + 0.85, pull, F_feed, F_full]);
      });
    }
    let cam = camKeys[0][2]();
    for (const [t0, t1, a, b] of camKeys) {
      if (lt < t0) break;
      if (lt < t1) {
        const f = L.inOutCubic(L.seg(lt, t0, t1));
        const A = a(), B = b();
        cam = { s: L.lerp(A.s, B.s, f), tx: L.lerp(A.tx, B.tx, f), ty: L.lerp(A.ty, B.ty, f) };
        break;
      }
      cam = b();
    }
    win.root.style.transform = `translate(${cam.tx.toFixed(2)}px,${cam.ty.toFixed(2)}px) scale(${cam.s.toFixed(5)})`;
  },
};