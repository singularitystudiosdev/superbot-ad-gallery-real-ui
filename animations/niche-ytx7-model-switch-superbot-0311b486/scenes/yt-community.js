// yt-community (3.0 s): the second result landing on YouTube. Inside the superbot window (label "Published by superbot
// on YouTube"), Sam Rivera's channel page, Posts tab, owner view. The page opens at the masthead, scrolls down to frame
// the composer, the post text streams into it and community-post.jpg attaches (pop). Then the composer clears and
// collapses while the published post card opens at the top of the feed (no timestamp, image large, YouTube's empty
// action row; chime as it lands), and a slow camera push-in settles on the post (text + image) and holds.
//
// API (default export, the motion scene contract):
//   { id: 'yt-community', dur: 3.0, marks, mount(sec, ctx), render(lt, ctx), T }
//   marks  [{ t, kind }] scene-local: 'pop' when the image attaches in the composer, 'chime' when the post lands
//   T      the timing table below (for reviewers and the harness)
// render is a pure function of lt: every moving pixel is written from lt (no clock, no transitions, no <video>).
import { clamp, lerp, seg, outCubic, inOutCubic } from '../lib.js';
import { buildFrame } from './yt/frame.js';
import { buildChannelPosts, setComposer, setPost, SCALE } from './yt/posts.js';
import { POST } from './yt/content.js';

const DUR = 3.0;
export const T = {
  scroll: [0.15, 0.5],      // masthead -> composer framed (the composer's top 12 px under the sticky tab row)
  type: [0.25, 0.85],       // the post text streams into the composer
  attach: [0.87, 1.02],     // community-post.jpg attaches (preview opens + pops in)
  ready: 0.86,              // the Post button turns blue once the text is complete
  clear: [1.1, 1.18],       // the composer's text + preview fade out (then the empty composer, placeholder hidden)
  collapse: [1.12, 1.38],   // the composer shrinks back to its empty height
  hint: [1.3, 1.42],        // the placeholder line returns
  drop: [1.16, 1.48],       // the published card opens at the top of the feed
  follow: [1.16, 1.84],     // the page scrolls from the composer to the new post
  push: [1.3, 2.6],         // slow camera push-in on the post, then held (2.6 -> 3.0 at rest)
};
const marks = [
  { t: +(T.attach[0] + 0.03).toFixed(3), kind: 'pop' },
  { t: +(T.drop[1] - 0.04).toFixed(3), kind: 'chime' },
];

// The final camera: zoom 1.25 on top of the page's 1.6, so one native px is exactly 2 stage px at rest. The visible
// box starts at the page's own left edge (the whole mini guide: Home, Shorts, Subscriptions, You, in frame) and its top
// sits exactly on the top bar's bottom edge (the top bar leaves the frame whole; the sticky Posts tab row stays whole),
// so the card reads near-centred (guide on the left, about 360 stage px of page on the right) and no glyph, logo or
// avatar is cut at a frame edge at rest. The image is cropped at the bottom edge (the viewport is shorter than the card).
const ZOOM = 1.25;
const CARD_GAP = 10;        // native px between the sticky tab row's bottom and the new card's top border at rest
const r2 = (v) => Math.round(v * 2) / 2;   // half-pixel snapping while moving
const r1 = (v) => Math.round(v);           // whole pixels at rest

let S = null;

function build(sec) {
  sec.classList.add('yc');
  const F = buildFrame(sec, { label: 'Published by superbot on YouTube', mark: 'youtube' });
  const cam = document.createElement('div');
  cam.className = 'yc-cam';
  F.screen.appendChild(cam);
  const api = buildChannelPosts(cam, { theme: 'light', scroll: 0 });
  api.composerImageImg.classList.add('yc-cimg');
  return { sec, F, cam, api, geo: null };
}

// layout facts, read once the stylesheets and fonts are in (native px)
function geometry(s) {
  const a = s.api;
  const css = [...document.styleSheets].some((x) => (x.href || '').includes('posts.css'))
    && getComputedStyle(a.scroller).position === 'absolute'
    && getComputedStyle(s.cam).position === 'absolute';
  if (!css || (document.fonts && document.fonts.status !== 'loaded')) return null;
  setComposer(a, {});
  setPost(a, 0);
  const field = a.composerText.parentElement;
  field.style.height = '';
  const m = a.measure();
  const hEmpty = field.offsetHeight;
  setComposer(a, { text: POST.text, image: 1, ready: true });
  a.composerImage.style.height = '';
  const hFull = field.offsetHeight;
  const imgH = a.composerImage.offsetHeight;
  setComposer(a, {});
  const topbarH = a.topbar.offsetHeight;
  const sC = r1(m.finalScroll);
  const tabsH = a.stickyTabs.offsetHeight;
  // the new card's top border CARD_GAP under the sticky tab row at rest (page y = topbarH + postTop - scroll)
  const sP = r1(m.postTop - tabsH - CARD_GAP);
  return { m, field, hEmpty, hFull, imgH, sC, sP, topbarH };
}

function drawComposer(s, lt) {
  const a = s.api, g = s.geo;
  const n = Math.round(POST.text.length * seg(lt, T.type[0], T.type[1]));
  const att = seg(lt, T.attach[0], T.attach[1]);
  const cleared = lt >= T.clear[1];
  if (cleared) setComposer(a, {});
  else setComposer(a, { text: POST.text.slice(0, n), image: att > 0 ? 1 : 0, ready: lt >= T.ready && lt < T.clear[0] });
  // the preview opens (its box grows to full height) and the image pops in (scale + opacity)
  const grow = outCubic(seg(lt, T.attach[0], T.attach[1] - 0.03));
  a.composerImage.style.height = att > 0 && grow < 1 ? `${r2(g.imgH * grow)}px` : '';
  const pop = outCubic(att);
  const fade = 1 - seg(lt, T.clear[0], T.clear[1]);
  a.composerImage.style.opacity = att > 0 ? (pop * fade).toFixed(3) : '0';
  a.composerImage.style.transform = att > 0 && pop < 1 ? `scale(${lerp(0.82, 1, pop).toFixed(4)})` : '';
  a.composerText.style.opacity = fade < 1 ? fade.toFixed(3) : '';
  // the placeholder comes back after the composer has cleared (never on top of the fading text)
  const hint = seg(lt, T.hint[0], T.hint[1]);
  a.composerHint.style.opacity = cleared ? hint.toFixed(3) : '';
  // collapse: the composer's text field goes from its full height back to its empty height (the toolbar rides up
  // with it, so the card never shows a gap under its toolbar)
  const c = inOutCubic(seg(lt, T.collapse[0], T.collapse[1]));
  g.field.style.height = c > 0 && c < 1 ? `${r2(lerp(g.hFull, g.hEmpty, c))}px` : '';
  g.field.style.overflow = c > 0 && c < 1 ? 'hidden' : '';
  g.field.style.boxSizing = c > 0 && c < 1 ? 'border-box' : '';   // offsetHeight includes its padding + border
}

function drawCamera(s, lt) {
  const a = s.api, g = s.geo;
  // scroll: masthead -> composer, then composer -> new post
  const p1 = inOutCubic(seg(lt, T.scroll[0], T.scroll[1]));
  const p2 = inOutCubic(seg(lt, T.follow[0], T.follow[1]));
  const sc = lerp(lerp(0, g.sC, p1), g.sP, p2);
  const atRest = (p1 === 0 || p1 === 1) && (p2 === 0 || p2 === 1);
  a.setScroll(atRest ? r1(sc) : r2(sc));
  // push-in: zoom about a moving origin O (stage px of the unzoomed screen), screen = (p - O) * z
  const p = outCubic(seg(lt, T.push[0], T.push[1]));
  if (p <= 0) { s.cam.style.transform = ''; return; }
  const z = lerp(1, ZOOM, p);
  const Ox = 0;
  const Oy = lerp(0, g.topbarH * SCALE, p);
  if (p >= 1) s.cam.style.transform = `translate(${-r1(Ox * ZOOM)}px, ${-r1(Oy * ZOOM)}px) scale(${ZOOM})`;
  else s.cam.style.transform = `translate(${(-Ox * z).toFixed(2)}px, ${(-Oy * z).toFixed(2)}px) scale(${z.toFixed(5)})`;
}

function draw(s, lt, t) {
  s.F.render(t);
  if (!s.geo) s.geo = geometry(s);
  if (!s.geo) return;
  drawComposer(s, lt);
  setPost(s.api, outCubic(seg(lt, T.drop[0], T.drop[1])));
  drawCamera(s, lt);
}

export default {
  id: 'yt-community',
  dur: DUR,
  marks,
  T,
  mount(sec) { S = build(sec); },
  render(lt, ctx) { if (S) draw(S, clamp(lt, 0, DUR), (ctx && ctx.t) || lt); },
};
