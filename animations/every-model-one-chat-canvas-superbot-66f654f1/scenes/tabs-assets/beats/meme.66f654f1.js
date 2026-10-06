// Nano Banana Pro, the meme. The thread gets one line and the artifact chip; the canvas pane shows the whole job:
// the brief it expanded "make me a muse meme" into, the three panels rendered as three passes (scene, then the
// note lettered left to right under a pen, then the reaction), the references it held on-model, a word-by-word
// lettering check and the three crops cut for feeds. Every image here is a crop of img/muse-meme.png; the rest is
// HTML, CSS and SVG. Pure function of t (the tabs scene's local time).
import { rise, setText, sayLine, refChip, crop, REGION, GRAIN, IC, lerp, seg, outCubic } from './kit.66f654f1.js';
import { outBack } from '../../../lib.js';

const SAY = 'Here’s your Muse meme. Lettered exactly, cut for every feed.';
const STAGE = { w: 510, h: 600 };              // the meme at 870x1024 scaled into the pane
const BANDS = [[0, 334], [334, 350], [684, 340]]; // scene, note, reaction (source px)
const PASS = ['Scene', 'Lettering', 'Reaction'];
const WORDS = ['YOU', 'HAVE', '40', 'UNREAD', 'NOTIFICATIONS', 'FROM', 'MUSE', 'Check', 'your', 'messages'];
const BRIEF = [
  ['Template', 'Note pass, 3 panels'],
  ['Panel 1', 'Muse slides you a note'],
  ['Panel 2', '“You have 40 unread notifications from Muse”'],
  ['Panel 3', 'The deadpan read'],
];
const CUTS = [['c45', '4:5', 'Feed', 1080, 1350], ['c11', '1:1', 'Post', 1080, 1080], ['c916', '9:16', 'Story', 1080, 1920]];

export default {
  times(r) {
    const T = { r };
    T.ref = r + 0.95;
    T.brief = r + 0.02;
    T.p = [[r + 0.12, r + 0.72], [r + 0.5, r + 1.32], [r + 0.98, r + 1.52]];
    T.refs = r + 0.3;
    T.letter = r + 0.5;
    T.cuts = r + 1.5;
    T.done = r + 1.55;
    T.end = r + 2.35;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const url = x.img('muse-meme.png');
    const sc = STAGE.h / 1024;
    const say = sayLine(x, SAY);
    const ref = refChip(x, { thumb: `<i style="${crop(url, [0, 0, 870, 1024], 34, 40)}"></i>`, title: 'muse-meme.png', sub: 'Image · 3 panels · 3 feed cuts' });

    const panels = BANDS.map(([y0, h], i) => `<div class="mm-p mm-p${i + 1}" style="height:${(h * sc).toFixed(2)}px">
        <i class="mm-soft" style="background-image:url('${url}');background-size:${STAGE.w}px ${STAGE.h}px;background-position:0 ${(-y0 * sc).toFixed(2)}px"></i>
        <i class="mm-sharp" style="background-image:url('${url}');background-size:${STAGE.w}px ${STAGE.h}px;background-position:0 ${(-y0 * sc).toFixed(2)}px"></i>
        <i class="mm-noise" style="background-image:${GRAIN}"></i><i class="mm-band"></i>${i === 1 ? `<i class="mm-pen">${IC.pen}</i>` : ''}
        <span class="mm-badge"><em>${i + 1}</em>${PASS[i]}<i class="mm-bok">${IC.check}</i></span>
      </div>`).join('');
    const tpl = '<i class="mm-tpl"><b></b><b><s></s></b><b></b></i>';
    const cuts = CUTS.map(([c, ar, lab, w, h]) => {
      const bh = 92, bw = Math.round(bh * w / h);
      const inner = c === 'c916'
        ? `<i class="mm-cbg" style="${crop(url, [0, 0, 870, 1024], bw, bh)}"></i><i class="mm-cfg" style="${crop(url, [0, 0, 870, 1024], bw, Math.round(bw * 1024 / 870))};height:${Math.round(bw * 1024 / 870)}px"></i>`
        : `<i class="mm-cfg" style="${crop(url, c === 'c11' ? [90, 334, 690, 690] : [0, 0, 870, 1024], bw, bh)};height:${bh}px"></i>`;
      return `<div class="mm-cut ${c}"><span class="mm-cimg" style="width:${bw}px;height:${bh}px">${inner}<i class="mm-cok">${IC.check}</i></span><span class="mm-clab"><b>${ar} ${lab}</b><small>${w}×${h}</small></span></div>`;
    }).join('');

    const pane = x.el(`<div class="cv-pane mm">
      <div class="mm-head"><span class="mm-file">${IC.img}<b>Muse meme</b></span>
        <span class="mm-chip">3 panels</span><span class="mm-chip">1080 × 1271</span><span class="mm-chip">PNG</span>
        <span class="mm-pass"><i class="spin"></i><span class="mm-pass-t">Planning the panels</span></span></div>
      <div class="mm-grid">
        <div class="mm-stage" style="width:${STAGE.w}px;height:${STAGE.h}px">${panels}</div>
        <div class="mm-side">
          <section class="mm-card mm-brief"><h6>Brief, from “make me a muse meme”</h6>
            <dl>${BRIEF.map(([a, b]) => `<div class="mm-row"><dt>${a}</dt><dd>${x.esc(b)}</dd></div>`).join('')}</dl></section>
          <section class="mm-card mm-refs"><h6>Held on-model</h6><div class="mm-refrow">
            <div class="mm-ref"><i style="${crop(url, REGION.mascot, 64, 54)}"></i><span><b>Muse</b><small>mascot reference</small></span></div>
            <div class="mm-ref">${tpl}<span><b>Note pass</b><small>meme template</small></span></div></div></section>
          <section class="mm-card mm-letter"><h6>Lettering check <em class="mm-wc">0/10 exact</em></h6>
            <div class="mm-words">${WORDS.map((w) => `<span>${w}</span>`).join('')}</div></section>
          <section class="mm-card mm-cuts"><h6>Cut for every feed</h6><div class="mm-cutrow">${cuts}</div></section>
          <section class="mm-card mm-post"><h6>Ready to post</h6>
            <div class="mm-prow"><dt>Caption</dt><dd>the notifications are a lifestyle now</dd></div>
            <div class="mm-prow"><dt>Alt text</dt><dd>A fuzzy white mascot passes a note: “You have 40 unread notifications from Muse.” The reader stares back, unblinking.</dd></div></section>
        </div>
      </div>
    </div>`);

    const $ = (s) => pane.querySelector(s), $$ = (s) => [...pane.querySelectorAll(s)];
    const P = $$('.mm-p').map((p) => ({ p, soft: p.querySelector('.mm-soft'), sharp: p.querySelector('.mm-sharp'), noise: p.querySelector('.mm-noise'), band: p.querySelector('.mm-band'), badge: p.querySelector('.mm-badge'), ok: p.querySelector('.mm-bok'), pen: p.querySelector('.mm-pen') }));
    const passT = $('.mm-pass-t'), passS = $('.mm-pass .spin'), pass = $('.mm-pass');
    const rows = $$('.mm-row'), refs = $$('.mm-ref'), words = $$('.mm-words span'), wc = $('.mm-wc'), cutEls = $$('.mm-cut');
    const cards = $$('.mm-card');

    return {
      nodes: [say.n, ref],
      marks: [[T.r, say.n], [T.ref, ref]],
      ref,
      cv: { tab: 'muse-meme.png', pane, at: k.done - 0.3 },
      render(t) {
        say.render(t, T.r + 0.06, 70);
        rise(ref, seg(t, T.ref, T.ref + 0.4), 8);

        // the passes: grain + blur resolve to the photo; the note is inked left to right under a pen
        P.forEach((q, i) => {
          const [a, b] = T.p[i];
          const e = outCubic(seg(t, a, b));
          if (i === 1) {
            const base = outCubic(seg(t, a - 0.1, a + 0.35));
            q.soft.style.filter = `blur(${lerp(16, 4, base).toFixed(2)}px) saturate(${lerp(0.3, 0.9, base).toFixed(3)}) brightness(${lerp(0.5, 0.9, base).toFixed(3)})`;
            const w = seg(t, a + 0.08, b);
            q.sharp.style.opacity = w > 0 ? '1' : '0';
            q.sharp.style.clipPath = `inset(0 ${(100 - w * 100).toFixed(2)}% 0 0)`;
            q.noise.style.opacity = (0.55 * (1 - base)).toFixed(3);
            const pv = w > 0 && w < 1;
            q.pen.style.opacity = pv ? '1' : '0';
            q.pen.style.left = `${(w * 100).toFixed(2)}%`;
            q.pen.style.top = `${(48 + 14 * Math.sin(w * Math.PI * 9)).toFixed(2)}%`;
          } else {
            q.soft.style.filter = `blur(${lerp(18, 0, e).toFixed(2)}px) saturate(${lerp(0.25, 1, e).toFixed(3)}) brightness(${lerp(0.45, 1, e).toFixed(3)})`;
            q.sharp.style.opacity = seg(t, b - 0.18, b).toFixed(3);
            q.sharp.style.clipPath = '';
            q.noise.style.opacity = (0.6 * (1 - e)).toFixed(3);
          }
          const bp = seg(t, a, b);
          q.band.style.opacity = (bp > 0 && bp < 1 ? Math.sin(Math.PI * bp) : 0).toFixed(3);
          q.band.style.transform = `translateX(${lerp(-110, 110, bp).toFixed(1)}%)`;
          rise(q.badge, seg(t, a - 0.1, a + 0.2), 4);
          const ok = seg(t, b, b + 0.25);
          q.ok.style.opacity = ok.toFixed(3);
          q.ok.style.transform = `scale(${lerp(0.4, 1, outBack(ok)).toFixed(3)})`;
          q.badge.classList.toggle('on', t >= a && t < b);
          q.badge.classList.toggle('ok', t >= b);
        });

        // header status follows the passes
        let st = 'Planning the panels';
        if (t >= T.done) st = 'Done · 3 passes, 1.9 s';
        else if (t >= T.p[2][0]) st = 'Pass 3 of 3 · reaction';
        else if (t >= T.p[1][0]) st = 'Pass 2 of 3 · lettering';
        else if (t >= T.p[0][0]) st = 'Pass 1 of 3 · scene';
        setText(passT, st);
        pass.classList.toggle('ok', t >= T.done);
        passS.classList.toggle('done', t >= T.done);
        passS.style.transform = t >= T.done ? '' : `rotate(${((t * 420) % 360).toFixed(1)}deg)`;

        // the side cards land in order
        rise(cards[0], seg(t, T.brief - 0.1, T.brief + 0.25), 8);
        rows.forEach((n, i) => rise(n, seg(t, T.brief + i * 0.08, T.brief + i * 0.08 + 0.3), 5));
        rise(cards[1], seg(t, T.refs, T.refs + 0.3), 8);
        refs.forEach((n, i) => rise(n, seg(t, T.refs + 0.08 + i * 0.1, T.refs + 0.38 + i * 0.1), 5));
        rise(cards[2], seg(t, T.letter, T.letter + 0.3), 8);
        // a word turns exact as the pen passes it
        const w = seg(t, T.p[1][0] + 0.08, T.p[1][1]);
        let n = 0;
        words.forEach((s, i) => { const on = w >= (i + 0.7) / WORDS.length; s.classList.toggle('on', on); if (on) n++; });
        setText(wc, `${n}/10 exact`);
        wc.classList.toggle('ok', n === WORDS.length);
        rise(cards[3], seg(t, T.cuts - 0.1, T.cuts + 0.25), 8);
        rise(cards[4], seg(t, T.cuts + 0.3, T.cuts + 0.6), 8);
        cutEls.forEach((c, i) => {
          const a = T.cuts + i * 0.12;
          rise(c, seg(t, a, a + 0.3), 6);
          const ok = c.querySelector('.mm-cok');
          const o = seg(t, a + 0.25, a + 0.45);
          ok.style.opacity = o.toFixed(3);
          ok.style.transform = `scale(${lerp(0.4, 1, outBack(o)).toFixed(3)})`;
        });
      },
    };
  },
};
