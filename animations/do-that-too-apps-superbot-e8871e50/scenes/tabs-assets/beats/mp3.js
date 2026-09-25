// superbot beat: the do-that-too 'yt' scene's delivery, inside the hub. A converting chip counts 0 -> 100, the
// card header opens, the left column grows row by row while the right fills in place (gradient audio tiles, green
// Saved pills), "+90 more" and the Download all footer open, the camera pushes onto the card, and the pointer
// presses Download all: it fills while downloading and resolves to Downloaded.
// YouTube mark: brand/youtube-icon.svg (YouTube full-color icon, 2017, as YouTube serves it).
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount, press, path } from '../../../lib.js';

const SAY = 'On it. Converting 100 videos to MP3.';
const TRACKS = [ // [title, artist, duration, size at 320 kbps]
  ['The Final Countdown', 'Europe', '5:10', '12.1 MB'],
  ['Sandstorm', 'Darude', '3:45', '8.8 MB'],
  ['Pump It Up', 'Danzel', '3:37', '8.5 MB'],
  ['Eye of the Tiger', 'Survivor', '4:05', '9.6 MB'],
  ['Mr. Brightside', 'The Killers', '3:42', '8.7 MB'],
  ['Blinding Lights', 'The Weeknd', '3:20', '7.8 MB'],
  ['Levels', 'Avicii', '3:19', '7.8 MB'],
  ['Seven Nation Army', 'The White Stripes', '3:51', '9.0 MB'],
  ['Uptown Funk', 'Mark Ronson ft. Bruno Mars', '4:30', '10.5 MB'],
  ['Bohemian Rhapsody', 'Queen', '5:55', '13.8 MB'],
];
const TOTAL = '912 MB';
const ROW_H = 46, HEAD_H = 28, MORE_H = 30, FOOT_H = 64; // layout px (ports.css + chat.css)
const MUSIC = '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
const DL = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M4.5 12.5l5 5L19.5 7"/></svg>';
const FOLDER ='<svg viewBox="0 0 24 24"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.28;
    T.card = T.chip + 0.25;
    T.row0 = T.card + 0.18; T.gap = 0.1;
    T.more = T.row0 + 9 * T.gap + 0.15;
    T.done = T.more + 0.18;
    T.foot = T.done + 0.08;
    T.curIn = T.foot + 0.15; T.press = T.foot + 0.75;   // the pointer presses Download all
    T.dl = [T.press + 0.06, T.press + 0.66];           // the pill fills
    T.got = T.dl[1];                                   // Downloaded
    T.end = T.got + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const rowAt = (i) => T.row0 + i * T.gap;
    const yt = `<img class="yt-mark" src="${x.brand('youtube-icon.svg')}" alt=""/>`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Converting 100 videos</span><span class="yt-count">0/100</span></div>');
    const row = ([title, artist, dur, size], i) => `<div class="sbx-file yt-row"><span class="yt-num">${String(i + 1).padStart(2, '0')}</span><span class="sbx-file-ic k-audio">${MUSIC}</span><span class="sbx-file-t"><b>${x.esc(title)}</b><i class="yt-artist">${x.esc(artist)}</i><small>${dur} · ${size}</small></span><span class="sbx-file-act">${DL}Saved</span></div>`;
    const wrap = x.el(`<div class="yt-clip"><div class="sbx-group yt-card">
      <div class="sbx-group-h">${yt}<span class="yt-h-t">100 videos <i>→</i> audio</span><span class="sbx-badge">mp3</span><span class="yt-h-r">100 files · ${TOTAL}</span></div>
      <div class="yt-grid"><div class="yt-col">${TRACKS.slice(0, 5).map((r, i) => row(r, i)).join('')}</div><div class="yt-col">${TRACKS.slice(5).map((r, i) => row(r, i + 5)).join('')}</div></div>
      <div class="yt-more"><span class="yt-stackic">${MUSIC}${MUSIC}${MUSIC}</span><b>+ 90 more tracks</b><small>11 – 100 · all saved</small></div>
      <div class="yt-foot"><span class="yt-dl"><i class="yt-dl-fill"></i><span class="yt-dl-a">${DL}<b>Download all (.zip)</b><em>${TOTAL}</em></span><span class="yt-dl-b">${CHECK}<b>Downloaded</b><em>${TOTAL}</em></span></span><span class="yt-saved">${FOLDER}Saved to <code>~/Music/superbot</code></span></div>
    </div></div>`);
    const card = wrap.firstElementChild;
    const rows = [...card.querySelectorAll('.yt-row')], more = card.querySelector('.yt-more'), foot = card.querySelector('.yt-foot');
    const count = chip.querySelector('.yt-count'), label = chip.querySelector('.ch-tool-t'), spin = chip.firstElementChild;
    const dl = card.querySelector('.yt-dl'), dlFill = dl.querySelector('.yt-dl-fill'), dlLab = dl.querySelector('.yt-dl-a b'), dlOk = dl.querySelector('.yt-dl-b svg');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const fade = (n, p, dy) => { n.style.opacity = p.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, chip, wrap],
      marks: [[T.r, say], [T.chip, chip], [T.card, wrap]],
      cams: [[T.card - 0.05, 1.0, () => x.F.el(card, 1.32, 0.88)]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        fade(chip, outCubic(seg(t, T.chip, T.chip + 0.35)), 6);
        const isDone = t >= T.done;
        spin.classList.toggle('done', isDone);
        spin.style.transform = isDone ? '' : `rotate(${(((t - T.chip) * 450) % 360).toFixed(1)}deg)`;
        label.textContent = isDone ? 'Converted 100 videos' : 'Converting 100 videos';
        count.textContent = `${Math.round(100 * inOutCubic(seg(t, T.chip + 0.1, T.done)))}/100`;
        chip.classList.toggle('yt-chip-done', isDone);

        // header opens, the left column grows row by row, the right fills in place, "+90 more" and the footer open
        const hP = outCubic(seg(t, T.card, T.card + 0.35));
        let h = HEAD_H * hP;
        rows.forEach((r, i) => {
          const p = outCubic(seg(t, rowAt(i), rowAt(i) + 0.38));
          if (i < 5) h += ROW_H * p;
          fade(r, p, 9);
          const act = r.querySelector('.sbx-file-act');
          const sp = outCubic(seg(t, rowAt(i) + 0.16, rowAt(i) + 0.46));
          act.style.opacity = sp.toFixed(3);
          act.style.transform = `scale(${lerp(0.85, 1, sp).toFixed(4)})`;
        });
        const mP = outCubic(seg(t, T.more, T.more + 0.35));
        h += MORE_H * mP;
        fade(more, mP, 6);
        const fP = outCubic(seg(t, T.foot, T.foot + 0.45));
        h += FOOT_H * fP;
        wrap.style.height = (hP > 0 ? h + 2 : 0).toFixed(2) + 'px';
        card.style.opacity = hP.toFixed(3);
        fade(foot, outCubic(seg(t, T.foot + 0.08, T.foot + 0.5)), 8);

        // Download all: press, fill, Downloaded
        dl.style.transform = `scale(${(1 - 0.07 * press(t, T.press)).toFixed(4)})`;
        dlLab.textContent = t >= T.dl[0] ? 'Downloading…' : 'Download all (.zip)';
        dlFill.style.transform = `scaleX(${inOutCubic(seg(t, T.dl[0], T.dl[1])).toFixed(4)})`;
        dl.classList.toggle('is-done', t >= T.got);
        dlOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.got, T.got + 0.3))).toFixed(3)})`;
      },
      pointer(t, toScr) {
        if (t < T.curIn - 0.01 || t > T.got + 0.6) return null;
        const b = x.box(dl);
        const pD = toScr({ x: b.cx + b.w * 0.15, y: b.cy + 3 });
        const p = path(t, [{ t: T.curIn, x: pD.x + 300, y: pD.y + 240 }, { t: T.press - 0.1, ...pD }, { t: T.got, ...pD }, { t: T.got + 0.5, x: pD.x + 90, y: pD.y + 150 }]);
        const v = seg(t, T.curIn, T.curIn + 0.18) * (1 - seg(t, T.got + 0.1, T.got + 0.45));
        return { ...p, p: press(t, T.press), v };
      },
    };
  },
};
