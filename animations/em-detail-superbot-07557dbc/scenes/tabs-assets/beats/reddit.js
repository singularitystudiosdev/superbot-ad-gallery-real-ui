// Reddit beat: "Scrape reddit and look for more" answered as a real scan. Six subreddits fill as their posts are
// read (the header counts every post), a funnel shows how 1,284 posts narrowed to the ones with the Muse mascot,
// and five finds land ranked by how fast they are climbing, each with its own thumbnail, votes, comments and a
// sparkline. Pure function of t (the tabs scene's local time).
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scanned 6 subreddits. 5 more Muse memes are climbing right now.';
const SUBS = [['r/memes', 412], ['r/dankmemes', 287], ['r/MuseApp', 196], ['r/me_irl', 173], ['r/teenagers', 121], ['r/socialmedia', 95]];
const TOTAL = SUBS.reduce((a, s) => a + s[1], 0); // 1,284
const FUNNEL = [['1,284', 'posts read', 100], ['61', 'show the Muse mascot', 46], ['5', 'climbing fast, saved', 18]];
const UP = '<svg viewBox="0 0 24 24"><path d="M12 3l8 10h-5v8H9v-8H4z"/></svg>';
const BUBBLE = '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// thumbnails are small memes cut from the Muse meme's own frames (img/em07-meme-sm.jpg, 435x512): ph() places a
// source square (x, y, side w) into a box on the 56px thumb
const ph = (src, x, y, w, l, tp, bw, bh) => {
  const s = bw / w;
  return `<i class="ph" style="left:${l}px;top:${tp}px;width:${bw}px;height:${bh}px;background-image:url('${src}');background-size:${(435 * s).toFixed(1)}px ${(512 * s).toFixed(1)}px;background-position:${(-x * s).toFixed(1)}px ${(-y * s).toFixed(1)}px"></i>`;
};
const THUMBS = [
  // a tweet screenshot: avatar, handle, two lines, the classroom frame under it
  (s) => `${ph(s, 262, 18, 70, 4, 4, 10, 10).replace('class="ph"', 'class="ph av"')}<span class="tx" style="left:17px;top:4px;font-size:4.6px;line-height:5px">muse fan<br><span style="font-weight:400;color:#777">@musefan</span></span><span class="tx" style="top:16px;font-weight:400">muse remembered my birthday before my friends did</span>${ph(s, 150, 6, 285, 4, 31, 48, 21)}`,
  // POV caption over the mascot
  (s) => `<span class="tx" style="top:3px">POV: you open Muse for one notification</span>${ph(s, 228, 0, 170, 0, 18, 56, 38)}`,
  // Nobody / Muse at 3am
  (s) => `<span class="tx" style="top:3px">Nobody:<br>Muse at 3am: you up?</span>${ph(s, 236, 4, 150, 0, 20, 56, 36)}`,
  // two-row reaction format: the guy turns away from friends, the mascot is the yes
  (s) => `${ph(s, 165, 352, 100, 0, 0, 28, 28)}${ph(s, 262, 14, 100, 0, 28, 28, 28)}<span class="tx" style="left:30px;top:9px">texting back friends</span><span class="tx" style="left:30px;top:37px">texting back Muse</span><i class="hl" style="top:28px"></i>`,
  // classic top and bottom text on the note frame
  (s) => `${ph(s, 120, 172, 230, 0, 0, 56, 56)}<span class="im" style="top:3px">ME EXPLAINING MUSE</span><span class="im" style="bottom:3px">TO MY MOM</span>`,
];
const POSTS = [
  ['Muse remembered my birthday before my friends did', 'r/me_irl', 'u/softlaunch_', '4h', '31.4k', '1.9k', '+248%', 'M0 21 L9 20 L18 19 L27 16 L36 14 L45 9 L54 6 L64 2'],
  ['POV: you open Muse for one notification', 'r/memes', 'u/notifgoblin', '6h', '24.1k', '1.2k', '+212%', 'M0 22 L9 21 L18 18 L27 18 L36 13 L45 11 L54 5 L64 3'],
  ['Nobody: / Muse at 3am: you up?', 'r/teenagers', 'u/lateknight', '5h', '12.6k', '702', '+154%', 'M0 20 L9 20 L18 17 L27 15 L36 15 L45 11 L54 8 L64 5'],
  ['Texting back friends vs texting back Muse', 'r/dankmemes', 'u/drakeposting', '9h', '18.7k', '864', '+131%', 'M0 19 L9 17 L18 17 L27 14 L36 12 L45 11 L54 9 L64 6'],
  ['Me explaining Muse to my mom', 'r/socialmedia', 'u/kayla_irl', '11h', '6.8k', '233', '+97%', 'M0 20 L9 19 L18 18 L27 17 L36 15 L45 14 L54 11 L64 9'],
];
const MATCH = ['98%', '97%', '96%', '94%', '91%'];
const DAYS = [4, 6, 5, 9, 14, 22, 31]; // Muse meme posts per day, last 7 days
const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.2;
    T.sub = SUBS.map((_, i) => r + 0.32 + i * 0.15); // each subreddit reads for 0.5s
    T.scanEnd = T.sub[SUBS.length - 1] + 0.5;
    T.fun = r + 1.42;
    T.row = POSTS.map((_, i) => r + 1.2 + i * 0.15);
    T.ft = r + 2.25;
    T.end = r + 3.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const sm = x.img('em07-meme-sm.jpg');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const max = SUBS[0][1];
    const subs = SUBS.map(([n]) => `<div class="rd-sub"><b>${n}</b><span class="rd-bar"><i></i></span><span class="rd-sc">0</span><span class="spin"></span></div>`).join('');
    const fun = FUNNEL.map(([n, l, w]) => `<div class="rd-fr"><b>${n}</b><span style="--fw:${w}%"><em>${l}</em></span></div>`).join('');
    const rows = POSTS.map(([title, sub, u, age, up, cm, vel, path], i) => `<div class="rd-row"><span class="rd-rk">${i + 1}</span><span class="rd-th">${THUMBS[i](sm)}</span>
      <span class="rd-tx"><b>${x.esc(title)}</b><small><i>${sub}</i><span>${u}</span><span>${age}</span></small></span>
      <span class="rd-mt"><b>${MATCH[i]}</b>mascot match</span><span class="rd-up">${UP}${up}</span><span class="rd-cm">${BUBBLE}${cm}</span>
      <svg class="rd-spark" viewBox="0 0 64 24"><path pathLength="100" d="${path}"/></svg><span class="rd-vel">${vel}<small>per hour</small></span></div>`).join('');
    const card = x.el(`<div class="em-card rd">
      <div class="em-hd">${x.tile('reddit')}Reddit scan<span class="em-tag">Muse memes</span><span class="em-stat"><b>6</b> subreddits</span><span class="em-stat"><b class="rd-n">0</b> posts read</span><span class="em-stat">last 7 days</span><span class="rd-live em-push"><i></i>Live</span></div>
      <div class="rd-body">
        <div><span class="em-lbl">Subreddits</span><div class="rd-subs">${subs}</div><div class="rd-fun">${fun}</div>
          <div class="rd-days"><div class="rd-days-h"><span>Muse meme posts per day</span><b>+675% this week</b></div><div class="rd-bars">${DAYS.map(() => '<i></i>').join('')}</div><div class="rd-days-x"><span>7d ago</span><span>today</span></div></div></div>
        <div class="rd-res"><span class="em-lbl">Climbing now, fastest first</span>${rows}</div>
      </div>
      <div class="rd-ft"><span>${CHECK}Saved 5 to your Muse board</span><span>${CHECK}Alerts on for new Muse memes</span><span class="em-btn pri em-push">Open board</span></div></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const subEls = [...card.querySelectorAll('.rd-sub')], nEl = card.querySelector('.rd-n');
    const funEl = card.querySelector('.rd-fun'), rowEls = [...card.querySelectorAll('.rd-row')], ft = card.querySelector('.rd-ft');
    const live = card.querySelector('.rd-live i');
    const days = card.querySelector('.rd-days'), bars = [...card.querySelectorAll('.rd-bars i')];
    const dmax = Math.max(...DAYS);
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        let read = 0;
        subEls.forEach((el, i) => {
          const a = T.sub[i], p = seg(t, a, a + 0.5), e = outCubic(p);
          el.style.opacity = (0.35 + 0.65 * seg(t, a - 0.12, a)).toFixed(3);
          el.querySelector('i').style.width = ((SUBS[i][1] / max) * 100 * e).toFixed(2) + '%';
          const c = Math.round(SUBS[i][1] * e); read += c;
          el.querySelector('.rd-sc').textContent = fmt(c);
          const sp = el.querySelector('.spin');
          sp.classList.toggle('done', p >= 1);
          sp.style.transform = p >= 1 || p <= 0 ? 'none' : `rotate(${((t - a) * 720) % 360}deg)`;
          sp.style.opacity = t >= a ? '1' : '.35';
        });
        nEl.textContent = fmt(Math.min(TOTAL, read));
        live.style.opacity = (0.45 + 0.55 * Math.abs(Math.cos(t * 3.2))).toFixed(3);
        const fp = outCubic(seg(t, T.fun, T.fun + 0.35));
        funEl.style.opacity = fp.toFixed(3);
        funEl.style.transform = fp >= 1 ? 'none' : `translateY(${((1 - fp) * 8).toFixed(2)}px)`;
        rowEls.forEach((el, i) => {
          const p = outCubic(seg(t, T.row[i], T.row[i] + 0.35));
          el.style.opacity = p.toFixed(3);
          el.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * 18).toFixed(2)}px)`;
          el.querySelector('.rd-spark path').style.strokeDashoffset = (100 * (1 - outCubic(seg(t, T.row[i] + 0.15, T.row[i] + 0.7)))).toFixed(2);
        });
        const dp = outCubic(seg(t, T.fun + 0.15, T.fun + 0.5));
        days.style.opacity = dp.toFixed(3);
        bars.forEach((b, i) => { b.style.height = ((DAYS[i] / dmax) * 100 * outCubic(seg(t, T.fun + 0.25 + i * 0.05, T.fun + 0.6 + i * 0.05))).toFixed(2) + '%'; });
        const f = outCubic(seg(t, T.ft, T.ft + 0.3));
        ft.style.opacity = f.toFixed(3);
      },
    };
  },
};
