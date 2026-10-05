// every-model-one-chat, r1-e cut: the real superbot hub, cropped to its thread and composer (rail, sidebar and
// chat header are hidden, ask.css), in a narrow window so the chat column itself fills the 16:9 frame at a scale
// where its text reads at phone size (the source spot sat wide, the composer's 11 px text at 11 px on screen).
// It picks up the task Claude stopped on (tabs-assets/chat.js): it opens on the app's real empty state (the mark and
// "Good evening. Where do we go?" over a centred composer) with the ask Claude refused already in the composer; the
// send drops the composer to its dock and lifts the greeting away, as the live app does. One camera over one layer,
// and every move is an eased glide (no spring kick at the start): it holds on the docked composer through both asks,
// eases out while the image renders (the composer still whole), pushes in on the finished meme's note so the joke
// reads, then pulls back to the whole meme under its "Gemini in superbot" header and holds there to the cut. A film-side
// fade at the frame's top edge (off while the camera is on the note) keeps scrolled-away lines from being cut hard. render(lt) is a pure function of
// local time. The scene keeps the id "tabs" so the hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_END } from './tabs-assets/chat.js?v=26';
import { lerp, seg, outCubic, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;
const MEME = BEATS[1].k.T;
const DW = 580, DH = 1500;       // the window: a 532 px chat column (the hub's min(760px, 100% - 48px))
const PAD = 26;                   // frame px under the docked composer
const GAP = 20;                   // site px between the greeting and the composer in the empty state
// the payoff: the note's lettering, as fractions of the meme image, shown at 1.93x the meme's own pixels (870 px
// wide), which puts the note's capitals at about 54 px on a 1080 frame (10 px on a 360 px phone)
const NOTE = { x: 0.55, y: 0.63 }, NOTE_PX = 1.93, MEME_W = 870;

let el = null;

function size() {
  if (el.sized) return;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.sized = true;
}

// one measurement pass in site px (site and composer transforms cleared, so section px = site px); the meme shots
// are measured on the layout as it stands once the meme has landed. renderChat is a pure f(t), and the frame being
// drawn repaints everything after this returns. Each framing pins a site point (px, py) to a frame point (fx, fy)
// at scale s.
function measure(W) {
  const prevS = el.site.style.transform, prevC = el.composer.style.transform;
  el.site.style.transform = 'none';
  el.composer.style.transform = 'none';
  const box = (n) => boxIn(n, el.sec);
  const comp = box(el.composer), main = box(el.main), hero = box(el.hero);
  renderChat(el.chat, MEME.end);
  const g = el.chat.beats[1];
  const who = box(g.who), img = box(g.r.querySelector('.qc-img'));
  el.site.style.transform = prevS;
  el.composer.style.transform = prevC;

  const read = W / (comp.w + 48);
  const cx = comp.x + comp.w / 2, y = comp.y + comp.h;
  // empty state: greeting, gap and composer as one group, centred in the frame the docked camera already holds
  const midY = y - (H / 2 - PAD) / read;
  const up = comp.y + (comp.h - GAP - hero.h) / 2 - midY;
  el.hero.style.top = (comp.y - up - GAP - hero.h - main.y).toFixed(2) + 'px';
  const top = who.y, bot = img.y + img.h;
  const sB = (MEME_W * NOTE_PX) / img.w;
  return {
    up,
    dock: { s: read, px: cx, py: y, fx: W / 2, fy: H - PAD },
    // the image renders: the reply from its header down to the docked composer, all of it whole
    rend: { s: Math.min(read, (H - PAD - 64) / (y - top)), px: cx, py: y, fx: W / 2, fy: H - PAD },
    // the finished meme under its "Gemini in superbot" header; the composer sits clear below the frame
    whole: { s: Math.min((H - 112) / (bot - top), (W * 0.9) / img.w), px: img.x + img.w / 2, py: (top + bot) / 2, fx: W / 2, fy: H / 2 },
    // in on the note; the whole width stays in frame when it fits
    note: { s: sB, px: W / sB >= img.w + 8 ? img.x + img.w / 2 : img.x + NOTE.x * img.w, py: img.y + NOTE.y * img.h, fx: W / 2, fy: H / 2 },
  };
}

// the camera's framings in order, each reached by an eased glide (scale in log space, so a zoom reads at an even rate)
function camera(t, m) {
  const moves = [
    [MEME.card - 0.1, MEME.card + 0.75, m.rend],
    [MEME.note[0], MEME.note[1], m.note],
    [MEME.whole[0], MEME.whole[1], m.whole],
  ];
  let c = m.dock;
  for (const [a, b, to] of moves) {
    if (t <= a) break;
    const e = inOutCubic(seg(t, a, b));
    c = {
      s: Math.exp(lerp(Math.log(c.s), Math.log(to.s), e)),
      px: lerp(c.px, to.px, e), py: lerp(c.py, to.py, e), fx: lerp(c.fx, to.fx, e), fy: lerp(c.fy, to.fy, e),
    };
  }
  return c;
}

export default {
  id: 'tabs',
  dur: CHAT_END + 0.2,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
</div>`;
    section.style.background = '#0a0a0b'; // the hub's own page tone, so a frame wider than the window shows no edge
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    // a new chat: the source hub's history is not this task's
    hub.querySelectorAll('.feed > .welcome, .feed > .date-div, .feed > .msg').forEach((n) => n.remove());
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    // SUPER at AUTO, its default, drawn as the real chip's tag (superbot-desktop composer.tsx .bc-super-tag: one
    // small track holding the thumb and the mode word; the thumb rests left until the router lights the lane)
    const fade = document.createElement('div');
    fade.className = 'sb-topfade';
    section.appendChild(fade);
    hub.querySelector('.rc-super').innerHTML = 'SUPER<i class="ask-tg"><b></b>AUTO</i>';
    el = { sec: section, site: q('.sbsite'), hub, main, hero, fade, composer: hub.querySelector('.composer'), m: null, sized: false };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    size();
    const m = el.m || (el.m = measure(W));

    const c = camera(t, m);
    el.site.style.transform =
      `translate(${c.fx.toFixed(2)}px,${c.fy.toFixed(2)}px) scale(${c.s.toFixed(5)}) translate(${(-c.px).toFixed(2)}px,${(-c.py).toFixed(2)}px)`;

    // empty state -> thread: the first send drops the composer to its dock and lifts the greeting away
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.45));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-m.up * (1 - drop)).toFixed(2)}px)`;
    const out = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (1 - out).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${(-out * 30).toFixed(2)}px)`;

    // the top-edge fade steps aside while the camera is in on the note (the picture fills the frame there)
    const onNote = inOutCubic(seg(t, MEME.note[0], MEME.note[1])) * (1 - inOutCubic(seg(t, MEME.whole[0], MEME.whole[1])));
    el.fade.style.opacity = (1 - onNote).toFixed(3);

    renderChat(el.chat, t);
  },
};
