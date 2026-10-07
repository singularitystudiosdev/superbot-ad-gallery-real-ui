// Connect beat: superbot asks for the ONE Google scope the job needs to post replies (youtube.force-ssl). One
// non-sign-in scope means Google shows its plain consent screen, not the granular one: no checkboxes, the whole request
// is allowed or not (developers.google.com/identity/protocols/oauth2/resources/granular-permissions, fetched
// 2026-10-06). The scope string is Google's own (developers.google.com/identity/protocols/oauth2/scopes). The pointer
// taps Allow, and the card folds down into one "connected" line.
// Pure function of t: every moving value is written from t in render.
import { lerp, seg, outQuart, inOutQuart, press, arcPath, rise } from '../../../lib.js';
import { ms } from './yt-icons.js?v=88a89e94';
import { ACCOUNT } from './data.js?v=88a89e94';

const SCOPE = 'See, edit, and permanently delete your YouTube videos, ratings, comments and captions';

const CARD_AT = 0.05;   // reply start to the consent card rising
const CARD_IN = 0.5;
const PTR_AT = 0.55;    // reply start to the pointer arriving in frame
const TAP_AT = 1.45; /* deliberate */ // reply start to the tap on Allow: the screen reads first
const FOLD_AT = 0.22;   // the tap to the card folding
const FOLD = 0.6;       // the fold (inOutQuart): the consent card's height eases to the connected line's
const OK_AT = 0.5;      // the tap to the green check
const SETTLE = 0.35;    // the check landed to the beat's end

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ptr = r + PTR_AT;
    T.tap = r + TAP_AT;
    T.fold = T.tap + FOLD_AT;
    T.ok = T.tap + OK_AT;
    T.end = Math.max(T.fold + FOLD, T.ok + SETTLE);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const slot = x.el(`<div class="gc-slot">
      <div class="gc-card">
        <div class="gc-top"><img src="${x.brand('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
        <div class="gc-body">
          <div class="gc-title">superbot wants to access your Google&nbsp;Account</div>
          <span class="gc-acct"><img class="gc-av" src="${x.img(ACCOUNT.avatar)}" alt=""/>${x.esc(ACCOUNT.name)}${ms('keyboard-arrow-down', 'gc-dd')}</span>
          <div class="gc-lead">This will allow <b>superbot</b> to:</div>
          <div class="gc-row"><img src="${x.brand('youtube-icon.svg')}" alt=""/><span>${x.esc(SCOPE)}</span>${ms('info-outline', 'gc-info')}</div>
          <div class="gc-trust"><b>Make sure you trust superbot</b>You may be sharing sensitive info with this site or app. You can always see or remove access in your Google Account.</div>
          <div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-go">Allow</span></div>
        </div>
      </div>
      <div class="gc-done"><img class="gc-dav" src="${x.img(ACCOUNT.avatar)}" alt=""/><span><b>${x.esc(ACCOUNT.name)}</b> connected</span><small>${x.esc(ACCOUNT.handle)} · replies only</small><span class="gc-dok">${x.OK}</span></div>
    </div>`);
    const card = slot.querySelector('.gc-card');
    const go = slot.querySelector('.gc-go');
    const done = slot.querySelector('.gc-done');
    const ok = done.querySelector('.qc-ok');
    let hW = '';
    if (document.fonts && document.fonts.load) ['400', '500'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));

    const ptr = (t) => {
      if (t < T.ptr || t > T.tap + 0.7) return null;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.5, ey = g.y + g.h * 0.62;
      const p = arcPath(t, [
        { t: T.ptr, x: ex + 260, y: ey + 170 },
        { t: T.tap - 0.1, x: ex, y: ey, arc: -40 },
        { t: T.tap + 0.25, x: ex, y: ey },
        { t: T.tap + 0.7, x: ex + 70, y: ey + 90, arc: 0 },
      ]);
      return { x: p.x, y: p.y, p: press(t, T.tap), v: outQuart(seg(t, T.ptr, T.ptr + 0.25)) * (1 - seg(t, T.tap + 0.35, T.tap + 0.7)) };
    };

    return {
      nodes: [slot],
      marks: [[T.card, slot], [T.fold, slot]],
      pointer: ptr,
      render(t) {
        rise(slot, outQuart(seg(t, T.card, T.card + CARD_IN)), 16, 0.985);
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('gc-hit', t >= T.tap);
        // the fold: the slot's height eases from the card's to the connected line's while one fades for the other
        const f = inOutQuart(seg(t, T.fold, T.fold + FOLD));
        const want = f <= 0 ? '' : f >= 1 ? `${done.offsetHeight}px` : `${lerp(card.offsetHeight, done.offsetHeight, f).toFixed(2)}px`;
        if (want !== hW) { slot.style.height = want; hW = want; }
        card.style.opacity = (1 - seg(t, T.fold, T.fold + FOLD * 0.5)).toFixed(3);
        card.style.transform = f > 0 ? `scale(${lerp(1, 0.97, f).toFixed(4)})` : 'none';
        rise(done, outQuart(seg(t, T.fold + FOLD * 0.35, T.fold + FOLD)), 6);
        const o = outQuart(seg(t, T.ok, T.ok + 0.3));
        ok.style.opacity = o.toFixed(3);
        ok.style.transform = `scale(${lerp(0.5, 1, o).toFixed(4)})`;
      },
    };
  },
};
