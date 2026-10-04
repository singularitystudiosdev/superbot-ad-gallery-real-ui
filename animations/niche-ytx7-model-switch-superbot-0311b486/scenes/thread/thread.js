// scenes/thread/thread.js: the multi-author superbot thread shared by scenes/thread-a.js and scenes/thread-b.js.
// One superbot window (title bar: the superbot mark, "superbot", the thread title "Sam's channel") holding one thread
// in which every bubble wears the colour and the mark of the model that wrote it. No composer, no send button, no
// cursor: nothing on this surface looks tappable. Pure: render(lt) draws everything from the scene-local seconds.
//
// API
//   MODELS              the authors: { id, name, color, mark } (EXACT labels)
//   BUBBLES             the thread, in order: { id, who, text, ... } (EXACT strings)
//   threadScene(id, dur, land)  -> the scene module object { id, dur, mount, render, marks }
//                       land = { <bubble id>: scene-local seconds it lands at } (a bubble absent from land never
//                       lands in that scene; a negative time = already in place when the scene opens)
//   RISE                the bubble rise, seconds (outCubic)
//   FRAME               the window geometry in stage px (for any scene that wants to line up with it)
import { clamp, lerp, seg, outCubic, inOutCubic, esc, op } from '../../lib.js';
import { makeMark } from '../../shell.js';

const V = '0311b486';
const brand = (f) => new URL(`../../brand/${f}?v=${V}`, import.meta.url).href;
const gen = (f) => new URL(`../../img/gen/${f}?v=${V}`, import.meta.url).href;

export const RISE = 0.3;
export const FRAME = { x: 56, y: 44, w: 1808, h: 992, bar: 76, radius: 26 };

export const MODELS = {
  sam: { id: 'sam', name: 'Sam Rivera', color: '#3a3b40', photo: 'sam.jpg' },
  gemini: { id: 'gemini', name: 'Gemini', color: '#1A73E8', color2: '#9B72CB', mark: 'gemini-logo.svg' },
  astra: { id: 'astra', name: 'GPT-6 Astra', color: '#10A37F', mark: 'openai-logo.svg' },
  opus: { id: 'opus', name: 'Claude Opus 5.5', color: '#D97757', mark: 'claude-logo.svg' },
  nbp: { id: 'nbp', name: 'Nano Banana Pro', color: '#F9AB00', mark: 'gemini-logo.svg' },
};

// the commenters Gemini surfaced (EXACT, the spec's top-comment cast), in Gemini's ranking order
export const RANKED = [
  { name: 'Priya Nair', photo: 'priya.jpg', likes: '2.1K' },
  { name: 'Lena Fischer', photo: 'lena.jpg', likes: '986' },
  { name: 'Marco Silva', photo: 'marco.jpg', likes: '742' },
  { name: 'Dee Okafor', photo: 'dee.jpg', likes: '518' },
  { name: 'Tom Becker', photo: 'tom.jpg', likes: '403' },
];
export const PRIYA_COMMENT = 'Which one would you actually buy for a small untreated room?';
export const PRIYA_REPLY = 'The $49 dynamic. It ignores most of the room echo, you can hear it side by side at 7:05.';

export const BUBBLES = [
  { id: 'sam', who: 'sam', text: 'Answer my top comments, pin the best one, and post a community update.' },
  { id: 'gemini', who: 'gemini', text: 'Ranked 1,284 comments on your mic video. These 5 need you.', att: 'ranked' },
  { id: 'astra', who: 'astra', text: 'Read the 4:38 frame Lena asked about: a low-profile boom arm, mic mounted underneath.', att: 'frame' },
  { id: 'opus', who: 'opus', text: "Wrote 5 replies in Sam's voice. Pinning Priya's, 214 people asked the same thing.", att: 'quote' },
  { id: 'nbp', who: 'nbp', text: 'Made the image for your community post: all 10 headsets on your desk.', att: 'image' },
];

// where the boom arm sits in img/gen/frame-438.jpg (fractions of the 1920x1080 frame) and how the crop frames it
export const FRAME438 = { file: 'frame-438.jpg', box: { x: 0.04, y: 0.45, w: 0.545, h: 0.46 }, zoom: 1.15, focus: { x: 0.1, y: 0.85 } };

// ---------- small svg glyphs (Material Symbols outlines, as the base's yt-icons) ----------
const LIKE = '<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>';
const REPLY_GLYPH = '<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/></svg>';
const PIN = '<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Z"/></svg>';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
// an <img> that never shows a broken-image glyph: until (unless) it loads it is simply transparent
const img = (src, cls = '', alt = '') => `<img class="${cls}" src="${src}" alt="${esc(alt)}" decoding="sync" onerror="this.style.visibility='hidden'">`;

function avatarTile(m) {
  if (m.photo) return `<div class="tb-av is-photo">${img(gen(m.photo), '', m.name)}</div>`;
  return `<div class="tb-av m-${m.id}"><span class="tb-av-in">${img(brand(m.mark), '', m.name)}</span></div>`;
}

function attachment(b) {
  if (b.att === 'ranked') {
    return `<div class="tb-card tb-ranked">
      ${RANKED.map((r, i) => `<div class="tr-row"><span class="tr-n">${i + 1}</span>${img(gen(r.photo), 'tr-av', r.name)}<span class="tr-name">${esc(r.name)}</span><span class="tr-likes">${LIKE}<b>${esc(r.likes)}</b></span></div>`).join('')}
    </div>`;
  }
  if (b.att === 'frame') {
    const f = FRAME438;
    return `<div class="tb-card tb-frame"><div class="tf-crop">
        <div class="tf-img" style="--z:${f.zoom};--fx:${f.focus.x * 100}%;--fy:${f.focus.y * 100}%">${img(gen(f.file), '', 'The video frame at 4:38')}
          <div class="tf-box" style="left:${f.box.x * 100}%;top:${f.box.y * 100}%;width:${f.box.w * 100}%;height:${f.box.h * 100}%"><span class="tf-label">Boom arm</span></div>
        </div>
        <span class="tf-tc">4:38</span>
      </div></div>`;
  }
  if (b.att === 'quote') {
    return `<div class="tb-card tb-quote">
      <div class="tq-head">${REPLY_GLYPH}<span>Reply to Priya Nair</span><span class="tq-pin">${PIN}Pinned</span></div>
      <div class="tq-c">${img(gen('priya.jpg'), 'tq-av', 'Priya Nair')}<div class="tq-t"><b>Priya Nair</b><span>${esc(PRIYA_COMMENT)}</span></div></div>
      <div class="tq-r">${img(gen('sam.jpg'), 'tq-av', 'Sam Rivera')}<div class="tq-t"><b>Sam Rivera</b><span>${esc(PRIYA_REPLY)}</span></div></div>
    </div>`;
  }
  if (b.att === 'image') {
    return `<div class="tb-card tb-image"><div class="ti-wrap">
      ${img(gen('community-post.jpg'), 'ti-blur', '')}${img(gen('community-post.jpg'), 'ti-sharp', 'All 10 headsets on the desk')}
      <i class="ti-sheen"></i>
    </div></div>`;
  }
  return '';
}

function bubbleEl(b) {
  const m = MODELS[b.who];
  const user = b.who === 'sam';
  return h(`<div class="tb ${user ? 'tb-user' : 'tb-model'} m-${m.id}" data-id="${b.id}">
    ${user ? '' : avatarTile(m)}
    <div class="tb-col">
      <div class="tb-name">${esc(m.name)}</div>
      <div class="tb-body"><p class="tb-text">${esc(b.text)}</p>${attachment(b)}</div>
    </div>
    ${user ? avatarTile(m) : ''}
  </div>`);
}

function build(sec) {
  sec.classList.add('thread-scene');
  const root = h(`<div class="tw-root">
    <div class="tw-win">
      <div class="tw-bar">
        <span class="tw-mark"></span><b class="tw-brand">superbot</b><i class="tw-sep"></i><span class="tw-title">Sam's channel</span>
        <span class="tw-conn">${img(brand('youtube-icon.svg'), 'tw-yt', 'YouTube')}<span>@samriveratests</span></span>
      </div>
      <div class="tw-view"><div class="tw-col">
        <div class="tw-intro">
          <div class="ti-tiles">${['sam', 'gemini', 'astra', 'opus', 'nbp'].map((k) => avatarTile(MODELS[k])).join('')}</div>
          <p>Sam Rivera with Gemini, GPT-6 Astra, Claude Opus 5.5 and Nano Banana Pro</p>
        </div>
      </div></div>
    </div>
  </div>`);
  sec.appendChild(root);
  const col = root.querySelector('.tw-col');
  const bubbles = BUBBLES.map((b) => { const el = bubbleEl(b); col.appendChild(el); return { b, el }; });
  const mark = makeMark(46);
  root.querySelector('.tw-mark').appendChild(mark.el);
  const q = (el, s) => el.querySelector(s);
  for (const x of bubbles) {
    x.rows = [...x.el.querySelectorAll('.tr-row')];
    x.card = q(x.el, '.tb-card');
    x.box = q(x.el, '.tf-box');
    x.label = q(x.el, '.tf-label');
    x.sharp = q(x.el, '.ti-sharp');
    x.blur = q(x.el, '.ti-blur');
    x.sheen = q(x.el, '.ti-sheen');
  }
  return { root, view: q(root, '.tw-view'), col, intro: q(root, '.tw-intro'), bubbles, mark };
}

// the bottom of every block in the column's flow (transforms never touch layout, so this is stable per frame)
function measure(r) {
  const top = r.col.offsetTop;
  const introB = r.intro.offsetTop + r.intro.offsetHeight;
  return { top, introB, B: r.bubbles.map((x) => x.el.offsetTop + x.el.offsetHeight) };
}

const PAD_BOTTOM = 56; // the thread's breathing room under the newest bubble (there is no composer)

function draw(r, lt, land, t) {
  const L = measure(r);
  const vpH = r.view.clientHeight;
  // each bubble's rise; the content bottom follows the same easing so the thread is pushed up as a bubble lands
  let bottom = L.introB, prevB = L.introB;
  r.bubbles.forEach((x, i) => {
    const at = land[x.b.id];
    const e = at == null ? 0 : outCubic(seg(lt, at, at + RISE));
    x.e = e;
    bottom += (L.B[i] - prevB) * e;
    prevB = L.B[i];
    x.el.style.visibility = e > 0 ? 'visible' : 'hidden';
    op(x.el, e);
    x.el.style.transform = e >= 1 ? '' : `translateY(${((1 - e) * 44).toFixed(2)}px) scale(${lerp(0.985, 1, e).toFixed(4)})`;
    const k = at == null ? -1 : lt - at; // seconds since this bubble started landing
    // the attachment's own beat, inside the bubble
    if (x.b.att === 'ranked') {
      x.rows.forEach((row, j) => {
        const f = outCubic(seg(k, 0.16 + 0.07 * j, 0.42 + 0.07 * j));
        op(row, f); row.style.transform = f >= 1 ? '' : `translateX(${((1 - f) * 18).toFixed(2)}px)`;
      });
    } else if (x.b.att === 'frame') {
      const f = outCubic(seg(k, 0.3, 0.6));
      op(x.box, f); x.box.style.transform = `scale(${lerp(1.12, 1, f).toFixed(4)})`;
      op(x.label, outCubic(seg(k, 0.45, 0.7)));
    } else if (x.b.att === 'quote') {
      const f = outCubic(seg(k, 0.18, 0.48));
      op(x.card, f); x.card.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 16).toFixed(2)}px)`;
    } else if (x.b.att === 'image') {
      // blur to sharp: the sharp copy is revealed by a soft-edged sweep from top to bottom over the blurred one
      const s = inOutCubic(seg(k, 0.1, 0.55));
      const edge = lerp(-18, 118, s);
      const m = `linear-gradient(180deg, #000 ${(edge - 18).toFixed(2)}%, transparent ${edge.toFixed(2)}%)`;
      x.sharp.style.webkitMaskImage = m; x.sharp.style.maskImage = m;
      x.blur.style.filter = `blur(${lerp(26, 6, s).toFixed(2)}px) saturate(${lerp(0.7, 1, s).toFixed(3)})`;
      op(x.blur, s >= 1 ? 0 : 1);
      op(x.sheen, (1 - s) * clamp(k / 0.1));
      x.sheen.style.transform = `translateY(${lerp(-100, 100, s).toFixed(2)}%)`;
    }
  });
  // top-anchored while the thread fits, then bottom-anchored: the newest bubble's foot sits PAD_BOTTOM above the edge
  const y = Math.max(0, L.top + bottom + PAD_BOTTOM - vpH);
  r.col.style.transform = `translateY(${(-y).toFixed(2)}px)`;
  r.mark.render(t);
}

/** threadScene(id, dur, land) -> the scene module default export { id, dur, mount, render, marks } */
export function threadScene(id, dur, land) {
  let r = null;
  const marks = Object.entries(land).filter(([, t]) => t >= 0 && t <= dur).map(([, t]) => ({ t, kind: 'pop' })).sort((a, b) => a.t - b.t);
  return {
    id, dur, land, marks,
    mount(sec) { r = build(sec); },
    render(lt, ctx) { if (r) draw(r, clamp(lt, 0, dur), land, (ctx && ctx.t) || lt); },
  };
}
