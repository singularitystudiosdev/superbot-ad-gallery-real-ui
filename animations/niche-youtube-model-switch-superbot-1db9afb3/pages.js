// The pages the agent drives in the in-app browser (pane.js host, 640 x 692 CSS px). Each is its own document, as a
// WebContentsView is, so YouTube's CSS never meets the app's.
//   1. youtube.com, the creator's video scrolled to its comments, read by DeepSeek V4 Pro. Rebuilt from the live
//      page captured headless at this exact size (ref/w640-head.png/.json, 2026-10-05): masthead 56 px, the
//      "N Comments" + Sort by row, the Add a comment row, threads with a 36 px avatar, handle 500 12/18 + age
//      400 12/18 #606060, text 400 14/20, the like/dislike/Reply bar, the "N replies" button and the thread line.
//   2. Remotion Studio on localhost, previewing the composition Claude Opus 5.5 wrote: the real Studio, stepped
//      frame by frame and captured at 2x (media/studio), with the playing state's pause glyph.
//   3. youtube.com/shorts, the posted Short, logged out: rebuilt from the live Shorts page at this size
//      (ref/s640.png/.json): the 335 x 596 reel (radius 12), the search suggestion chip, avatar + handle +
//      Subscribe, the title, and the right rail (like, comments, Share, Remix, the pivot thumbnail).
import { B, seg, inOutCubic, inOutSine, clamp } from './tl.js?v=1db9afb3';
import { yi, LOGO } from './yticons.js?v=1db9afb3';
import { makeVideo } from './media.js?v=1db9afb3';

const FONT = (base) => ['400', '500', '700'].map((w) => `@font-face{font-family:Roboto;font-style:normal;font-weight:${w};src:url(${new URL(`media/fonts/roboto-latin-${w}-normal.woff2`, base).href}) format('woff2')}`).join('');
const MAST = `<div class="mh"><span class="mh-ic" style="left:16px">${yi('guide')}</span><span class="mh-logo">${LOGO}</span>
  <span class="mh-ic" style="left:415px">${yi('search')}</span><span class="mh-ic mh-round" style="left:455px">${yi('mic')}</span><span class="mh-ic" style="left:495px">${yi('more')}</span>
  <span class="mh-sign">${yi('account')}<span>Sign in</span></span></div>`;
const BASE_CSS = `html,body{margin:0;background:#fff;font-family:Roboto,Arial,sans-serif;color:#0f0f0f;-webkit-font-smoothing:antialiased}
.yi{display:block}
.mh{position:fixed;left:0;top:0;right:0;height:56px;background:#fff;z-index:5}
.mh-ic{position:absolute;top:16px;width:24px;height:24px;color:#0f0f0f}
.mh-round::before{content:'';position:absolute;left:-8px;top:-8px;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.05)}
.mh-ic .yi{position:relative}
.mh-logo{position:absolute;left:68px;top:18px;width:93px;height:20px}
.mh-sign{position:absolute;left:527px;top:8px;width:105px;height:40px;box-sizing:border-box;border:1px solid rgba(0,0,0,.1);border-radius:20px;display:flex;align-items:center;gap:6px;padding-left:15px;color:#065fd4;font:500 14px/40px Roboto}
.mh-sign .yi{width:24px;height:24px}`;

// ---------------------------------------------------------------- 1. the comments
const COMMENTS = [
  ['P', '#7b1fa2', '@priyanair', '2 days ago', 'Every time I type or bump my desk you can hear a thump. Does a shock mount actually fix that, or is it a gimmick?', '412', 38],
  ['D', '#e64a19', '@danny.records', '2 days ago', 'The $40 dynamic beating the $90 condenser in a normal room surprised me. Great testing.', '287', 12],
  ['M', '#0288d1', '@mkwebcasts', '2 days ago', 'My boom arm picks up every keyboard thump. Would a shock mount help with a dynamic mic or is it pointless?', '164', 9],
  ['L', '#689f38', '@lena.makes.music', '1 day ago', 'Can you do a follow-up with the same mics through a cheap interface instead of USB?', '131', 6],
  ['T', '#5d4037', '@tomasz_audio', '1 day ago', 'Desk bumps are the worst part of my setup. Is a $25 shock mount worth it?', '98', 4],
  ['R', '#c2185b', '@rachelreads', '1 day ago', 'Which one would you pick for a loud room with traffic outside?', '77', 3],
  ['B', '#1e88e5', '@b.kowalczyk', '1 day ago', 'Hearing the typing test back to back was so useful.', '64', 0],
  ['J', '#00796b', '@jaycodes', '1 day ago', 'Do shock mounts even do anything for desk vibration? Mine seems to make it worse.', '58', 5],
  ['A', '#f57c00', '@sound.by.ade', '20 hours ago', 'Instant subscribe, the A/B clips are exactly what I needed.', '41', 0],
  ['N', '#455a64', '@notkevin_', '18 hours ago', 'Is the thump coming through the arm or through the air?', '37', 2],
  ['M', '#512da8', '@mira.vlogs', '12 hours ago', 'Ordered the $40 one, thank you!', '22', 0],
  ['G', '#0097a7', '@paulgomez', '9 hours ago', 'Would a foam pad under the clamp stop desk thumps?', '19', 1],
  ['K', '#7cb342', '@kaitlyn.creates', '6 hours ago', 'The sample at 9:12 sold me on the dynamic.', '11', 0],
];
const COMMENTS_CSS = `${BASE_CSS}
.cm{position:relative;padding:62px 16px 40px}
.cm-h{display:flex;align-items:center;height:28px}
.cm-h b{font:700 20px/28px Roboto}
.cm-sort{display:flex;align-items:center;gap:8px;margin-left:32px;font:500 14px/22px Roboto}
.cm-add{position:relative;display:flex;align-items:flex-start;gap:12px;margin-top:22px;height:57px}
.cm-add img{width:24px;height:24px;border-radius:50%;margin-top:0}
.cm-add span{flex:1;margin-top:2px;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,.2);font:400 14px/20px Roboto;color:#606060}
.th{position:relative;margin-bottom:16px}
.cv{position:relative;padding-left:52px;min-height:78px}
.av{position:absolute;left:0;top:0;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;font:400 18px/1 Roboto}
.hd{display:flex;gap:4px;padding-top:2px;font:500 12px/18px Roboto;color:#0f0f0f}
.hd i{font-style:normal;font-weight:400;color:#606060}
.tx{margin-top:4px;font:400 14px/20px Roboto;color:#0f0f0f}
.eb{display:flex;align-items:center;height:32px;margin:2px 0 0 -8px}
.eb .bt{width:32px;height:32px;display:grid;place-items:center;color:#0f0f0f}
.eb .bt .yi{width:18px;height:18px}
.eb .ct{font:400 12px/18px Roboto;color:#606060;margin:0 8px 0 0}
.eb .rp{height:32px;padding:0 12px;font:500 12px/32px Roboto;color:#0f0f0f}
.rs{position:relative;height:52px}
.rs-b{position:absolute;left:36px;top:12px;height:40px;display:flex;align-items:center;gap:6px;padding:0 16px;font:500 14px/40px Roboto;color:#0f0f0f}
.rs-b .yi{width:24px;height:24px}
.tl{position:absolute;left:18px;top:40px;bottom:52px;border-left:1px solid #e5e5e5}
.tc{position:absolute;left:18px;bottom:22px;width:18px;height:30px;box-sizing:border-box;border-left:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;border-bottom-left-radius:16px}
.pn{display:flex;align-items:center;gap:6px;height:18px;margin-bottom:8px;font:400 12px/18px Roboto;color:#606060}
.pn .yi{width:12px;height:12px;margin-left:-2px}
.cb{display:inline-block;height:20px;padding:0 6px;border-radius:100px;background:#0f0f0f;color:#f1f1f1;font:500 12px/20px Roboto;margin:-1px 0}
.tx a{color:#065fd4;text-decoration:none}
.sub{position:relative;padding:12px 0 0 48px;min-height:78px}
.sub .av{left:48px;top:12px;width:24px;height:24px;font-size:12px}
.sub .in{padding-left:40px}
.sc{position:absolute;left:18px;top:0;width:18px;height:24px;box-sizing:border-box;border-left:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;border-bottom-left-radius:16px}`;

const SHORT_URL = 'youtube.com/shorts/q8VbT2sKm4w';
function commentsDoc(base, after = false) {
  const pinned = after ? `<div class="th"><div class="cv pinned"><span class="av" style="background:#e8710a">S</span><div class="pn">${yi('pin', 12)}Pinned by @samrivera</div>
      <div class="hd"><span class="cb">@samrivera</span> <i>1 minute ago</i></div><div class="tx">63 of you asked if a shock mount stops desk thumps. Answered in a 21-second Short: <a>${SHORT_URL}</a></div>
      <div class="eb"><span class="bt">${yi('like', 18)}</span><span class="ct"></span><span class="bt">${yi('dislike', 18)}</span><span class="rp">Reply</span></div></div></div>` : '';
  const reply = `<div class="sub"><span class="sc"></span><span class="av" style="background:#e8710a">S</span><div class="in"><div class="hd"><span class="cb">@samrivera</span> <i>1 minute ago</i></div><div class="tx"><a>@priyanair</a> answered it here: <a>${SHORT_URL}</a></div>
      <div class="eb"><span class="bt">${yi('like', 18)}</span><span class="ct"></span><span class="bt">${yi('dislike', 18)}</span></div></div></div>`;
  const threads = COMMENTS.map(([ini, col, handle, age, text, likes, replies], i) => `<div class="th"><div class="cv"><span class="av" style="background:${col}">${ini}</span>
      <div class="hd">${handle} <i>${age}</i></div><div class="tx">${text}</div>
      <div class="eb"><span class="bt">${yi('like', 18)}</span><span class="ct">${likes}</span><span class="bt">${yi('dislike', 18)}</span><span class="rp">Reply</span></div></div>
      ${after && i === 0 ? `<span class="tl" style="bottom:0"></span>${reply}` : replies ? `<span class="tl"></span><span class="tc"></span><div class="rs"><span class="rs-b">${replies} ${replies === 1 ? 'reply' : 'replies'}${yi('chevron')}</span></div>` : ''}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT(base)}${COMMENTS_CSS}</style></head><body>${MAST}
    <div class="cm"><div class="cm-h"><b>${after ? '1,286' : '1,284'} Comments</b><span class="cm-sort">${yi('sort')}Sort by</span></div>
    <div class="cm-add"><img alt="" src="${new URL('media/yt-default-avatar.jpg', base).href}"><span>Add a comment...</span></div>${pinned}${threads}</div></body></html>`;
}

// ---------------------------------------------------------------- 3. the posted Short
const SHORTS_CSS = `${BASE_CSS}
.rl{position:absolute;left:152px;top:64px;width:335px;height:596px;border-radius:12px;overflow:hidden;background:#000}
.rl video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.md{position:absolute;left:0;right:0;bottom:0;height:124px;padding:0 16px;box-sizing:border-box;background:linear-gradient(to bottom,rgba(0,0,0,0),rgba(0,0,0,.6));border-radius:0 0 12px 12px}
.sg{position:absolute;left:16px;top:0;height:32px;display:flex;align-items:center;gap:10px;padding:0 14px 0 10px;border-radius:18px;background:rgba(0,0,0,.6);color:#fff;font:400 14px/20px Roboto}
.sg .yi{width:20px;height:20px}
.ch{position:absolute;left:16px;top:40px;height:40px;display:flex;align-items:center;gap:8px}
.ch .a{width:32px;height:32px;border-radius:50%;background:#e8710a;color:#fff;display:grid;place-items:center;font:500 15px/1 Roboto}
.ch .h{color:#fff;font:400 14px/20px Roboto}
.ch .s{margin-left:8px;height:40px;padding:0 16px;border-radius:20px;background:#0f0f0f;color:#f1f1f1;font:500 14px/40px Roboto;box-shadow:inset 0 0 0 40px rgba(255,255,255,.15)}
.ti{position:absolute;left:16px;right:27px;top:90px;color:#fff;font:400 14px/20px Roboto}
.ti b{font-weight:700}
.ac{position:absolute;left:500px;width:48px;text-align:center}
.ac .c{width:48px;height:48px;border-radius:24px;background:rgba(0,0,0,.05);display:grid;place-items:center;color:#0f0f0f}
.ac .c .yi{width:24px;height:24px}
.ac .l{font:400 12px/18px Roboto;color:#0f0f0f;margin-top:4px}
.pv{position:absolute;left:504px;top:612px;width:40px;height:40px;border-radius:6px;overflow:hidden;background:#222}
.pv img{width:100%;height:100%;object-fit:cover}
.nx{position:absolute;left:152px;top:676px;width:335px;height:596px;border-radius:12px;background:linear-gradient(#2a2622,#151311)}`;

function shortsDoc(base) {
  const ac = (top, icon, label, dim) => `<div class="ac" style="top:${top}px"><div class="c"${dim ? ' style="color:#909090"' : ''}>${yi(icon)}</div><div class="l">${label}</div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT(base)}${SHORTS_CSS}</style></head><body>${MAST}
    <div class="rl"><div class="md" style="top:472px"><span class="sg">${yi('search')}Search "boom arm shock mount"</span>
      <div class="ch"><span class="a">S</span><span class="h">@samrivera</span><span class="s">Subscribe</span></div>
      <div class="ti">Does a shock mount stop desk thumps? <b>#Shorts</b></div></div></div>
    ${ac(300, 'heart', '3')}${ac(378, 'comment', '0')}${ac(456, 'share', 'Share')}${ac(534, 'remix', 'Remix', true)}
    <div class="pv"><img alt="" src="${new URL('media/thumb.jpg', base).href}"></div><div class="nx"></div></body></html>`;
}

function frameWith(html) {
  const f = document.createElement('iframe');
  f.setAttribute('tabindex', '-1');
  f.setAttribute('aria-hidden', 'true');
  f.srcdoc = html;
  return f;
}

export const SHORT_IN = 6.2;

export function buildPages(pane, media, base) {
  const views = [];
  // 1. comments, read by DeepSeek V4 Pro: the page scrolls down through the threads, then back to the top one
  {
    const k = B.deepseek;
    const from = k.back + 0.1;
    const f = frameWith(commentsDoc(base));
    let doc = null;
    f.addEventListener('load', () => { doc = f.contentDocument; });
    pane.add({
      from, key: 'video', title: 'I tested 12 budget mics under $100 - YouTube', host: 'youtube.com', frame: f,
      render(t) {
        if (!doc) return;
        const max = doc.documentElement.scrollHeight - 692;
        const down = inOutSine(seg(t, from + 0.4, from + 2.1));
        const up = inOutCubic(seg(t, from + 2.2, from + 2.7));
        doc.documentElement.scrollTop = Math.round(clamp(max, 0, 1500) * down * (1 - up));
      },
    });
    views.push(f);
  }
  // 2. Remotion Studio, previewing ShortReply (composition frames 30..120)
  {
    const k = B.opus;
    const from = k.back + 2.05;
    const box = document.createElement('div');
    box.style.background = '#1f2428';
    const v = makeVideo(document, 'studio', base);
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block';
    box.appendChild(v);
    media.add(v, (t) => (t >= from + 0.15 ? Math.min(t - from - 0.15, 3.0) : null), 0);
    pane.add({ from, title: 'ShortReply | Remotion Studio', host: 'localhost:3000', frame: box });
  }
  // 3. the Short, live on youtube.com/shorts
  {
    const k = B.youtube;
    const from = k.back + 0.2;
    const f = frameWith(shortsDoc(base));
    f.addEventListener('load', () => {
      const d = f.contentDocument;
      const v = makeVideo(d, 'short', base);
      d.querySelector('.rl').prepend(v);
      // cut in at 6.2 s, the shock-mount close-up ("A shock mount absorbs those vibrations...")
      media.add(v, (t) => (t >= from + 0.2 ? SHORT_IN + t - from - 0.2 : null), SHORT_IN);
    });
    pane.add({ from, title: 'Does a shock mount stop desk thumps? #Shorts - YouTube', host: 'youtube.com', frame: f });
    views.push(f);
  }
  // 4. back on the video (same tab, reloaded): the pinned comment at the top and the reply under Priya's
  {
    const k = B.youtube;
    const from = k.back + 2.7;
    const f = frameWith(commentsDoc(base, true));
    pane.add({ from, key: 'video', title: 'I tested 12 budget mics under $100 - YouTube', host: 'youtube.com', frame: f });
    views.push(f);
  }
  return {
    ready: async () => {
      await Promise.all(views.map((f) => new Promise((r) => {
        const d = f.contentDocument;
        if (d && d.readyState === 'complete' && d.body && d.body.childElementCount) r();
        else f.addEventListener('load', r, { once: true });
      })));
      await Promise.all(views.map((f) => f.contentDocument.fonts.ready));
    },
    render() {},
  };
}
