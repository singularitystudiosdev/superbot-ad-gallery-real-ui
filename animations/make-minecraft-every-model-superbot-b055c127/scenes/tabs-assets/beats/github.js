// GitHub: the connect card lands, the pointer presses Connect and it flips to Connected (../../do-that-too-apps
// cursor.js), then the repo is created and the engine pushed.
import { lerp, seg, outBack, inOutCubic, press, path } from '../../../lib.js';
import { sayer, rise, GH, O_CHECK, O_BRANCH, REPO, TICK } from './kit.js';

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.card = r + 0.25 * p;
    T.curIn = T.card + 0.08; T.curAt = T.curIn + 0.4 * p; T.press = T.curAt + 0.06;
    T.flip = T.press + 0.18;
    T.row = [T.flip + 0.4 * p, T.flip + 0.72 * p];
    T.end = T.row[1] + 0.45 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.gh);
    const card = x.el(`<div class="cd-gh">
      <div class="cd-gh-face fa"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>GitHub</b><small>Create repos and push for superbot</small></span><span class="cd-gh-btn"><span>Connect</span></span></div>
      <div class="cd-gh-face fb"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>Connected as @sam</b><small>github.com/sam &middot; read and write</small></span><span class="cd-gh-ok">${O_CHECK}<span>Connected</span></span></div>
    </div>`);
    const rows = x.el(`<div class="mc-rows">
      <div class="mc-row"><span class="mc-si">${REPO}</span><span>Created</span><b>sam/blockcraft</b><em class="mc-dim">private</em><span class="mc-okp">${TICK}</span></div>
      <div class="mc-row"><span class="mc-si">${O_BRANCH}</span><span>Pushed</span><b>8 files</b><em class="mc-dim">main &middot; a41f9c2</em><span class="mc-okp">${TICK}</span></div>
    </div>`);
    const btn = card.querySelector('.cd-gh-btn'), ok = card.querySelector('.cd-gh-ok'), fa = card.firstElementChild, fb = card.lastElementChild;
    const rs = [...rows.children];
    return {
      nodes: [say.node, card, rows],
      marks: [[T.r, say.node], [T.card, card], [T.row[0], rows]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.4), 10, 1);
        btn.style.transform = `scale(${(1 - 0.07 * press(t, T.press)).toFixed(4)})`;
        const fl = inOutCubic(seg(t, T.flip, T.flip + 0.35));
        fa.style.transform = fl > 0 ? `translateY(${(-6 * fl).toFixed(2)}px)` : ''; fa.style.opacity = (1 - fl).toFixed(3);
        fb.style.transform = fl < 1 ? `translateY(${(6 * (1 - fl)).toFixed(2)}px)` : ''; fb.style.opacity = fl.toFixed(3);
        ok.style.transform = `scale(${lerp(0.6, 1, outBack(seg(t, T.flip + 0.1, T.flip + 0.42))).toFixed(3)})`;
        rows.style.opacity = t >= T.row[0] - 0.05 ? '1' : '0';
        rs.forEach((n, i) => {
          rise(n, seg(t, T.row[i], T.row[i] + 0.28), 8, 1);
          const o = n.querySelector('.mc-okp');
          o.style.opacity = seg(t, T.row[i] + 0.2, T.row[i] + 0.32).toFixed(3);
          o.style.transform = `scale(${lerp(0.4, 1, outBack(seg(t, T.row[i] + 0.2, T.row[i] + 0.45))).toFixed(3)})`;
        });
      },
      pointer(t, toScr) {
        if (t < T.curIn - 0.01 || t >= T.flip + 0.6) return null;
        const b = x.box(btn);
        const pA = toScr({ x: b.cx + b.w * 0.1, y: b.cy + 3 });
        const p = path(t, [
          { t: T.curIn, x: pA.x + 280, y: pA.y + 260 }, { t: T.curAt, ...pA }, { t: T.flip + 0.15, ...pA },
          { t: T.flip + 0.55, x: pA.x + 80, y: pA.y + 150 },
        ]);
        const v = seg(t, T.curIn, T.curIn + 0.18) * (1 - seg(t, T.flip + 0.15, T.flip + 0.5));
        return { ...p, p: press(t, T.press), v };
      },
    };
  },
};
