// Nano Banana Pro beat: "make me a muse meme" answered with the whole job, not a lone picture. The three panels
// resolve one by one under a scan line while the build checks off beside them: the references it worked from
// (scene, mascot, note), its steps, the note lettered in marker, then the meme already framed for three feeds.
// Pure function of t (the tabs scene's local time).
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Here’s your Muse meme, with a cut for every feed.';
const CAPTION = 'YOU HAVE 40 UNREAD NOTIFICATIONS FROM MUSE\nCheck your messages';
const REFS = [
  ['em07-ref-scene.jpg', 'Scene', 'Note-pass template'],
  ['em07-ref-mascot.jpg', 'Character', 'Muse mascot, on-model'],
  ['em07-ref-note.jpg', 'Prop', 'The passed note'],
];
const STEPS = [
  ['Matched the 3-panel note-pass scene', '0.9s'],
  ['Placed the mascot, matched light and film grain', '2.4s'],
  ['Lettered the note in marker', '1.1s'],
  ['Upscaled to 2048 × 2410', '0.6s'],
];
const EXPORTS = [['em07-x-16x9.jpg', '16:9', 'X'], ['em07-x-1x1.jpg', '1:1', 'r/memes'], ['em07-x-9x16.jpg', '9:16', 'Stories']];
const DL = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
const SEND = '<svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

const rise = (node, p, dy = 8) => {
  node.style.opacity = p.toFixed(3);
  node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
};

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.2;
    T.veil = [0.42, 0.82, 1.22].map((o) => r + o); // each panel's veil starts lifting (0.45s)
    T.step = [0.36, 0.76, 1.16, 1.62].map((o) => r + o); // step i goes active; done when the next starts
    T.stepEnd = r + 1.92;
    T.cap0 = r + 1.12; T.cap1 = T.cap0 + 0.62;
    T.ex = [1.72, 1.84, 1.96].map((o) => r + o);
    T.act = r + 2.08;
    T.end = r + 2.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const refs = REFS.map(([f, b, s]) => `<div class="mm-ref"><img src="${x.img(f)}" width="208" height="156" alt=""/><div><b>${b}</b><small>${s}</small></div></div>`).join('');
    const steps = STEPS.map(([s, d]) => `<div class="em-st"><span class="spin"></span><span>${x.esc(s)}</span><em>${d}</em></div>`).join('');
    const ex = EXPORTS.map(([f, a, w]) => `<figure class="mm-x"><img src="${x.img(f)}" alt="${a}"/><figcaption><b>${a}</b>${w}</figcaption></figure>`).join('');
    const card = x.el(`<div class="em-card mm">
      <div class="mm-art"><img src="${x.img('muse-meme.png')}" width="870" height="1024" alt="Muse meme"/>
        <i class="mm-veil"></i><i class="mm-veil"></i><i class="mm-veil"></i><i class="mm-scan"></i>
        <span class="mm-chip who">${x.tile('nanobanana')}Nano Banana Pro</span><span class="mm-chip res">2048 × 2410 PNG</span></div>
      <div class="mm-side">
        <div class="em-hd">Muse meme<span class="em-tag">3 panels</span><span class="em-tag">The Social Network</span><span class="em-stat em-push">made in <b>5.0s</b></span></div>
        <div><span class="em-lbl">Worked from</span><div class="mm-refs">${refs}</div></div>
        <div class="mm-mid">
          <div><span class="em-lbl">Build</span><div class="mm-steps">${steps}</div></div>
          <div><span class="em-lbl">Lettering</span><div class="mm-cap"><span class="mm-hand"><span class="qc-vis"></span><span class="qc-hid">${CAPTION}</span></span><small>Gochi Hand, marker</small></div></div>
        </div>
        <div class="mm-foot"><div><span class="em-lbl">Ready to post</span><div class="mm-ex">${ex}</div></div>
          <div class="mm-act"><span class="em-btn">${DL}Download all</span><span class="em-btn pri">${SEND}Post to r/memes</span></div></div>
      </div></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const veils = [...card.querySelectorAll('.mm-veil')], scan = card.querySelector('.mm-scan');
    const res = card.querySelector('.mm-chip.res'), art = card.querySelector('.mm-art > img');
    const refEls = [...card.querySelectorAll('.mm-ref')], stEls = [...card.querySelectorAll('.em-st')];
    const capBox = card.querySelector('.mm-cap'), capVis = capBox.querySelector('.qc-vis'), capHid = capBox.querySelector('.qc-hid');
    const exEls = [...card.querySelectorAll('.mm-x')], act = card.querySelector('.mm-act');
    let shown = -1, capShown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the art: each panel's veil lifts in turn under a scan line that walks down the frame
        veils.forEach((v, i) => { const p = outCubic(seg(t, T.veil[i], T.veil[i] + 0.45)); v.style.opacity = (1 - p).toFixed(3); v.style.display = p >= 1 ? 'none' : ''; });
        const sp = seg(t, T.veil[0] - 0.1, T.veil[2] + 0.45);
        scan.style.top = (sp * 100).toFixed(2) + '%';
        scan.style.opacity = (sp <= 0 || sp >= 1 ? 0 : Math.min(1, sp * 8, (1 - sp) * 8)).toFixed(3);
        const z = outCubic(seg(t, T.card, T.veil[2] + 0.45));
        art.style.transform = z >= 1 ? 'none' : `scale(${lerp(1.06, 1, z).toFixed(4)})`;
        res.style.opacity = seg(t, T.veil[2] + 0.3, T.veil[2] + 0.55).toFixed(3);
        refEls.forEach((el, i) => rise(el, outCubic(seg(t, T.card + 0.08 + i * 0.07, T.card + 0.38 + i * 0.07))));
        stEls.forEach((el, i) => {
          const a = T.step[i], b = T.step[i + 1] ?? T.stepEnd;
          const sp2 = el.firstElementChild, done = t >= b, on = t >= a;
          sp2.classList.toggle('done', done);
          sp2.style.transform = done || !on ? 'none' : `rotate(${((t - a) * 720) % 360}deg)`;
          sp2.style.opacity = on ? '1' : '.35';
          el.classList.toggle('on', on);
          el.style.opacity = (0.45 + 0.55 * seg(t, a - 0.1, a)).toFixed(3);
          el.lastElementChild.style.opacity = seg(t, b, b + 0.15).toFixed(3);
        });
        rise(capBox, outCubic(seg(t, T.cap0 - 0.2, T.cap0 + 0.1)), 6);
        const cn = Math.round(CAPTION.length * seg(t, T.cap0, T.cap1));
        if (cn !== capShown) { capVis.textContent = CAPTION.slice(0, cn); capHid.textContent = CAPTION.slice(cn); capShown = cn; }
        exEls.forEach((el, i) => rise(el, outCubic(seg(t, T.ex[i], T.ex[i] + 0.3)), 10));
        rise(act, outCubic(seg(t, T.act, T.act + 0.3)), 6);
      },
    };
  },
};
