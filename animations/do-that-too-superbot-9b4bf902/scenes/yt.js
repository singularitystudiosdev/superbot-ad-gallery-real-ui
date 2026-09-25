// scene yt: "Convert these 10 YouTube videos to MP3" -> superbot converts all ten and hands back a tidy
// two-column list of MP3s (the youtube-refusal-superbot-7f2c9a41 delivery look: cardGroup header strip,
// fileCard rows with the gradient audio tile and the green Saved pill). Real, recognisable tracks per the client.
// YouTube mark: yt-assets/youtube-icon.svg, the full-color icon exactly as YouTube serves it
// (YouTube brand resources "YouTube icon", fetched via upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_(2017).svg).
// Pure function of lt: every frame writes every animated property.
import * as L from '../lib.js';
import { makeShell, userBubble, botBlock, toolChip, setToolState, fileCard, cardGroup, setComposer, ICON } from '../shell.js';

const asset = (f) => new URL('./yt-assets/' + f, import.meta.url).href;
const YT = () => `<img class="yt-mark" src="${asset('youtube-icon.svg')}" alt="">`;

const PROMPT = 'Convert these 10 YouTube videos to MP3';
const REPLY = 'On it. Converting all 10 to MP3.';
const TRACKS = [ // [title, artist, duration, size at 320 kbps = 2.34 MB/min]
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
]; // sums to 96.6 MB
const TOTAL = '96.6 MB';

// ---------- beat sheet (local seconds) ----------
const B = {
  attach: 0.2,                       // the "10 links" stack lands in the composer as the fade ends
  type: 0.34,                        // the prompt types right behind it
  send: 0,                           // filled below: last char + 0.14
  reply: 0, chip: 0, card: 0, row0: 0, rowGap: 0.14, done: 0, foot: 0,
  camA: 0, camB: 0,
};
B.send = L.typeEnd(PROMPT, B.type, 58) + 0.14;
B.reply = B.send + 0.5;              // "On it." streams
B.chip = B.reply + 0.3;              // Converting 10 videos 0/10
B.card = B.chip + 0.25;              // the card header opens
B.row0 = B.card + 0.2;               // first MP3 row lands, then every 0.14s
const rowAt = (i) => B.row0 + i * B.rowGap;
B.done = rowAt(9) + 0.22;            // chip flips to Converted 10/10
B.foot = B.done + 0.12;              // Download all + Saved to line open
B.camA = B.chip - 0.1;               // camera push onto the card
B.camB = B.foot + 0.55;
const DUR = +(B.camB + 1.75).toFixed(2); // ~1.6s settled hold on the finished card

const ROW_H = 46, HEAD_H = 28, FOOT_H = 64; // layout px (match yt.css)

let S, u, uAtt, bot, replyP, chip, chipN, wrap, card, rows = [], foot, att, attWrap, sec;

function stackChip(cls) {
  const el = document.createElement('div');
  el.className = 'yt-stack ' + cls;
  // no <span>s: the shell's `.ch-user span` bubble style would cascade into every part of the chip
  el.innerHTML = `<i class="yt-stack-bk b2"></i><i class="yt-stack-bk b1"></i>
    <div class="yt-stack-fr">${YT()}<div class="yt-stack-t"><b>10 YouTube links</b><small>youtu.be/7fQx2… +9</small></div><div class="yt-stack-n">10</div></div>`;
  return el;
}

export default {
  id: 'yt',
  dur: DUR,
  mount(section) {
    sec = section;
    S = makeShell({
      mode: 'chat', title: '10 videos to MP3',
      projects: [{ name: '10 videos to MP3', when: 'now' }, { name: 'Burger from DoorDash', when: '1m' }, { name: 'Fix login redirect', when: '3m' }],
      active: 0,
    });
    section.appendChild(S.root);
    S.win.classList.add('yt-win');

    // composer attachment strip (height animated, so the composer grows smoothly)
    attWrap = document.createElement('div');
    attWrap.className = 'yt-attwrap';
    att = stackChip('in-composer');
    attWrap.appendChild(att);
    const rc = S.composer.querySelector('.rc');
    rc.insertBefore(attWrap, rc.firstChild);

    // user turn: the link stack above the bubble
    u = userBubble(PROMPT);
    u.classList.add('yt-user');
    uAtt = stackChip('in-thread');
    u.insertBefore(uAtt, u.firstChild);

    // superbot turn
    bot = botBlock('<p class="yt-reply"></p>');
    bot.classList.add('yt-bot');
    replyP = bot.firstElementChild;
    chip = toolChip('Converting 10 videos', 'run');
    chipN = document.createElement('span');
    chipN.className = 'yt-count';
    chip.appendChild(chipN);
    bot.appendChild(chip);

    rows = TRACKS.map(([title, artist, dur, size], i) => {
      const r = fileCard({ name: title, meta: `${dur} · ${size}`, kind: 'audio', action: 'Saved' });
      const ar = document.createElement('i'); // artist line between title and meta
      ar.className = 'yt-artist'; ar.textContent = artist;
      const t = r.querySelector('.sbx-file-t'); t.insertBefore(ar, t.querySelector('small'));
      r.classList.add('yt-row');
      const n = document.createElement('span');
      n.className = 'yt-num';
      n.textContent = String(i + 1).padStart(2, '0');
      r.insertBefore(n, r.firstChild);
      return r;
    });
    const colL = document.createElement('div'); colL.className = 'yt-col';
    const colR = document.createElement('div'); colR.className = 'yt-col';
    rows.slice(0, 5).forEach((r) => colL.appendChild(r));
    rows.slice(5).forEach((r) => colR.appendChild(r));
    const grid = document.createElement('div'); grid.className = 'yt-grid';
    grid.append(colL, colR);

    card = cardGroup(`${YT()}<span class="yt-h-t">10 videos <i>→</i> audio</span><span class="sbx-badge">mp3</span><span class="yt-h-r">10 files · ${TOTAL}</span>`, [grid]);
    card.classList.add('yt-card');
    foot = document.createElement('div');
    foot.className = 'yt-foot';
    foot.innerHTML = `<span class="yt-dl">${ICON.download}<b>Download all (.zip)</b><em>${TOTAL}</em></span><span class="yt-saved">${ICON.folder}Saved to <code>~/Music/Superbot</code></span>`;
    card.appendChild(foot);
    wrap = document.createElement('div');
    wrap.className = 'yt-clip';
    wrap.appendChild(card);
    bot.appendChild(wrap);

    S.feedIn.append(u, bot);
  },

  render(lt, ctx) {
    S.renderMarks(ctx.t);

    // ---- composer: attachment lands, prompt types, send ----
    const sent = lt >= B.send;
    const aIn = L.outCubic(L.seg(lt, B.attach, B.attach + 0.4));
    const aOut = L.outCubic(L.seg(lt, B.send, B.send + 0.28));
    const aH = 46 * aIn * (1 - aOut);
    attWrap.style.height = aH.toFixed(2) + 'px';
    L.op(att, aIn * (1 - aOut));
    att.style.transform = `translateY(${((1 - aIn) * 10).toFixed(2)}px) scale(${L.lerp(0.94, 1, aIn).toFixed(4)})`;
    const ty = L.typed(PROMPT, B.type, 58, lt);
    setComposer(S, sent ? '' : ty.text, { press: L.press(lt, B.send - 0.02), lit: !sent && aIn > 0.5 });

    // ---- user turn rises in ----
    const uP = L.outCubic(L.seg(lt, B.send, B.send + 0.42));
    u.style.display = sent ? '' : 'none';
    L.op(u, uP);
    u.style.transform = `translateY(${((1 - uP) * 14).toFixed(2)}px)`;

    // ---- superbot turn ----
    bot.style.display = lt >= B.reply ? '' : 'none';
    const txt = L.stream(REPLY, B.reply, 110, lt);
    replyP.textContent = txt;
    const cP = L.outCubic(L.seg(lt, B.chip, B.chip + 0.35));
    L.op(chip, cP);
    chip.style.transform = `translateY(${((1 - cP) * 6).toFixed(2)}px)`;
    let n = 0;
    for (let i = 0; i < 10; i++) if (lt >= rowAt(i) + 0.1) n++;
    const isDone = lt >= B.done;
    setToolState(chip, isDone ? 'done' : 'run', null, lt); // label set below: lastElementChild is the counter
    chip.querySelector('.ch-tool-t').textContent = isDone ? 'Converted 10 videos' : 'Converting 10 videos';
    chipN.textContent = `${n}/10`;
    chip.classList.toggle('yt-chip-done', isDone);
    const doneP = L.outCubic(L.seg(lt, B.done, B.done + 0.3));
    chipN.style.setProperty('--dp', doneP.toFixed(3));

    // ---- card: header opens, left column grows row by row, right column fills in place, footer opens ----
    const hP = L.outCubic(L.seg(lt, B.card, B.card + 0.35));
    let h = HEAD_H * hP;
    rows.forEach((r, i) => {
      const p = L.outCubic(L.seg(lt, rowAt(i), rowAt(i) + 0.38));
      if (i < 5) h += ROW_H * p;
      L.op(r, p);
      r.style.transform = `translateY(${((1 - p) * 9).toFixed(2)}px)`;
      const act = r.querySelector('.sbx-file-act');
      const sp = L.outCubic(L.seg(lt, rowAt(i) + 0.16, rowAt(i) + 0.46));
      L.op(act, sp);
      act.style.transform = `scale(${L.lerp(0.85, 1, sp).toFixed(4)})`;
    });
    const fP = L.outCubic(L.seg(lt, B.foot, B.foot + 0.45));
    h += FOOT_H * fP;
    wrap.style.height = (hP > 0 ? h + 2 : 0).toFixed(2) + 'px';
    L.op(card, hP);
    L.op(foot, L.outCubic(L.seg(lt, B.foot + 0.08, B.foot + 0.5)));
    foot.style.transform = `translateY(${((1 - fP) * 8).toFixed(2)}px)`;

    // ---- camera: eased keyframes (every move eases in AND out) ----
    //   typing framed tight on the composer -> after send, the thread top (ask + reply) -> the finished card
    const W = ctx.W || 1920, H = 1080;
    S.root.style.transform = ''; // measure in the un-pushed frame
    const frame = (cx, cy, sc) => {
      const tx = L.clamp(W / 2 - sc * cx, W - sc * W, 0), ty = L.clamp(H / 2 - sc * cy, H - sc * H, 0);
      return { s: sc, tx, ty };
    };
    const F_comp = () => {
      const c = L.boxIn(S.composer, S.root), sc = Math.min(1.75, (W * 0.88) / c.w);
      return frame(c.cx, c.y + c.h - H / sc / 2 + 30, sc);
    };
    const F_thread = () => {
      const f = L.boxIn(S.feedIn, S.root), sc = Math.min(1.3, (W * 0.92) / f.w);
      return frame(f.cx, f.y + H / sc / 2 - 24, sc);
    };
    const F_card = () => {
      const bx = L.boxIn(wrap, S.root), rp = L.boxIn(replyP, S.root);
      const finalH = HEAD_H + 5 * ROW_H + FOOT_H + 2;
      // top edge pinned just above the reply line: the reply is fully in, the user bubble fully out
      const top = rp.y - 7 * 1.6, bottom = bx.y + finalH * 1.6;
      // visible height: the content plus a little air, but never reaching the composer below the card
      const compTop = L.boxIn(S.composer, S.root).y;
      const V = L.clamp((bottom - top) / 0.95, bottom - top, compTop - top - 6);
      const sc = L.clamp(Math.min((W * 0.9) / bx.w, H / V), 1, 1.75);
      return frame(bx.x + bx.w / 2, top + H / sc / 2, sc);
    };
    const KEYS = [ // [start, end, from, to]
      [B.send - 0.12, B.send + 0.55, F_comp, F_thread],
      [B.card, B.camB, F_thread, F_card],
    ];
    let cam;
    if (lt < KEYS[0][0]) cam = F_comp();
    else if (lt >= KEYS[1][1]) cam = F_card();
    else {
      const kk = lt < KEYS[1][0] ? KEYS[0] : KEYS[1];
      const k = L.inOutCubic(L.seg(lt, kk[0], kk[1]));
      const a = kk[2](), b2 = kk[3]();
      cam = { s: L.lerp(a.s, b2.s, k), tx: L.lerp(a.tx, b2.tx, k), ty: L.lerp(a.ty, b2.ty, k) };
    }
    S.root.style.transform = `translate(${cam.tx.toFixed(2)}px,${cam.ty.toFixed(2)}px) scale(${cam.s.toFixed(5)})`;
  },
};
