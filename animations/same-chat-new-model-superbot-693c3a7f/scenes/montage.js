// montage.js: the old way, in 8.6 s. A new model is #1 today, so the move is always the same: a new app, a sign
// in, an empty chat, and the brief you already wrote typed out again. hubkit lends the window frame (mountHub's
// stage / stage-bar / body); this scene replaces the hub inside .body with a plain competitor app, and it drives
// every value from the scene clock. No hub refs are used here, so the hub markup is dropped at mount.
import { clamp, lerp, seg, outCubic, typed, esc, blink } from '../lib.js';
import { DW, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign } from './hubkit.js';

// every beat, in scene seconds
const C = {
  headIn: [0.1, 0.6], headOut: [2.3, 2.7],
  winIn: [2.15, 2.9], cur: 2.5,
  toGoogle: [3.05, 3.55], clickGoogle: 3.68, wallOut: [3.74, 4.06],
  toComp: [4.1, 4.5], clickComp: 4.62,
  zoomIn: [4.5, 5.7],
  type: [4.72, 6.55], send: 6.72, msgIn: 6.85, note: 7.15,
  dur: 8.0,
};
// the brief this user already wrote once, in the app they are leaving
const SAID = 'As I said, my project is a bakery website in Lisbon. Warm and handmade, no stock photos.';
const CPS = SAID.length / (C.type[1] - C.type[0]);

const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 3.2c.5 3.6 1.6 4.7 5.2 5.2-3.6.5-4.7 1.6-5.2 5.2-.5-3.6-1.6-4.7-5.2-5.2 3.6-.5 4.7-1.6 5.2-5.2Z"/><path d="M18.4 14.2c.3 2 .9 2.6 2.9 2.9-2 .3-2.6.9-2.9 2.9-.3-2-.9-2.6-2.9-2.9 2-.3 2.6-.9 2.9-2.9Z"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>';
const GOOGLE = '<svg class="mg-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9.1h12.7c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.6Z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.8l7.8-6.1Z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.6 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"/></svg>';

const APP = `
<div class="mg-app">
  <aside class="mg-side">
    <div class="mg-brand"><span class="mg-logo">${SPARK}</span><b>New app</b></div>
    <div class="mg-new">${PLUS}New chat</div>
    <div class="mg-lab">Recent</div>
    <div class="mg-none">No chats yet</div>
    <div class="mg-foot"><span class="mg-av">?</span>Not signed in</div>
  </aside>
  <section class="mg-main">
    <header class="mg-head">New chat</header>
    <div class="mg-feed"><div class="mg-col"></div></div>
    <div class="mg-empty"><span class="mg-mark">${SPARK}</span><b>No messages yet</b><span>Start by telling it what you need.</span></div>
    <div class="mg-note">You explain it all again.</div>
    <div class="mg-wall"><div class="mg-card">
      <b>Sign in to continue</b>
      <span>Chats are saved to your account.</span>
      <span class="mg-btn mg-google">${GOOGLE}Continue with Google</span>
      <span class="mg-btn mg-ghost">Continue with email</span>
    </div></div>
    <div class="mg-comp"><div class="mg-box">
      <span class="mg-ph">Sign in to start chatting</span><span class="mg-draft"></span><i class="mg-caret"></i>
      <span class="mg-send">${ARROW}</span>
    </div></div>
  </section>
</div>`;

export default {
  dur: C.dur,

  mount(section, ctx) {
    const R = mountHub(section, ctx, '');
    section.classList.add('mg');
    // this window is not superbot's, so its title bar says what it is
    section.querySelector('.sbsite .stage-bar span').textContent = 'New app';
    // the hub inside the window is dropped: this app has no rail and no history
    section.querySelector('.sbsite .body').innerHTML = APP;
    const head = document.createElement('div');
    head.className = 'mg-headline';
    head.innerHTML = '<h1>New <b>#1</b> model.</h1><p>Every few weeks, a new one.</p>';
    section.appendChild(head);

    const q = (s) => section.querySelector(s);
    R.head = head;
    R.wall = q('.mg-wall'); R.gb = q('.mg-google'); R.box = q('.mg-box');
    R.ph = q('.mg-ph'); R.draft = q('.mg-draft'); R.caret = q('.mg-caret');
    R.send = q('.mg-send'); R.empty = q('.mg-empty'); R.note = q('.mg-note');
    R.col = q('.mg-col');
    R.site.style.opacity = '0';
    // the message the user types: mounted up front, revealed when it is sent
    const msg = document.createElement('div');
    msg.className = 'mg-m';
    msg.innerHTML = `<div class="mg-b">${esc(SAID)}</div>`;
    msg.style.opacity = '0';
    R.col.appendChild(msg);
    R.msg = msg;
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    const g = place(R, ctx.W);

    // ---- camera: still on the headline, then a slow push in as the brief comes back
    zoom(R, g, ctx.W, 1 + 0.12 * outCubic(seg(t, ...C.zoomIn)));

    // ---- the headline, then the window it is hiding
    const hin = outCubic(seg(t, ...C.headIn));
    const hout = seg(t, ...C.headOut);
    const hv = hin * (1 - hout);
    R.head.style.opacity = hv.toFixed(3);
    R.head.style.transform = `translateY(${((1 - hin) * 26 - hout * 20).toFixed(2)}px)`;
    R.head.style.filter = hv > 0.985 ? 'none' : `blur(${((1 - hin) * 10 + hout * 6).toFixed(2)}px)`;
    R.head.style.visibility = hv <= 0 ? 'hidden' : 'visible';

    R.site.style.opacity = clamp(seg(t, C.winIn[0], C.winIn[0] + 0.4)).toFixed(3);

    // ---- the sign-in wall clears on the click, and the composer comes alive
    const wOut = seg(t, ...C.wallOut);
    R.wall.style.opacity = (1 - wOut).toFixed(3);
    R.wall.style.transform = `scale(${lerp(1, 1.03, wOut).toFixed(4)})`;
    R.wall.style.visibility = wOut >= 1 ? 'hidden' : 'visible';
    const signed = t >= C.wallOut[1];
    R.box.classList.toggle('on', signed);
    R.ph.textContent = signed ? 'Message' : 'Sign in to start chatting';

    // ---- the composer: the same brief, typed out a second time
    const ty = typed(SAID, C.type[0], CPS, t);
    const sent = t >= C.send;
    const text = sent ? '' : ty.text;
    const has = text.length > 0;
    R.ph.style.display = has || sent ? 'none' : '';
    R.draft.textContent = text;
    const caretOn = signed && !sent && (ty.typing || blink(t));
    R.caret.style.display = caretOn ? '' : 'none';
    R.send.classList.toggle('on', has);
    const pr = press(t, C.clickGoogle) + press(t, C.clickComp) + press(t, C.send);
    R.send.style.transform = `scale(${(1 - 0.16 * press(t, C.send)).toFixed(3)})`;

    // ---- the brief lands in a thread that was empty a second ago
    const mo = outCubic(seg(t, C.msgIn, C.msgIn + 0.42));
    R.msg.style.opacity = mo.toFixed(3);
    R.msg.style.transform = `translateY(${((1 - mo) * 14).toFixed(2)}px)`;
    R.empty.style.opacity = (1 - mo).toFixed(3);
    R.note.style.opacity = outCubic(seg(t, C.note, C.note + 0.45)).toFixed(3);

    // ---- cursor: through the sign in, then into the composer where the typing happens
    const gb = centerOf(R, R.gb), box = centerOf(R, R.box);
    const keys = [
      { t: C.cur, x: 470, y: 960 },
      { t: C.toGoogle[0], x: 470, y: 960 },
      { t: C.toGoogle[1], x: gb.x, y: gb.y },
      { t: C.toComp[0], x: gb.x, y: gb.y },
      { t: C.toComp[1], x: box.l + 70, y: box.t + 28 },
    ];
    const cp = pathDesign(R, t, keys);
    cursorAt(R, cp.x, cp.y, pr, seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, C.dur - 0.5, C.dur - 0.15)));
    const last = [C.clickGoogle, C.clickComp, C.send].filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, last == null ? -1 : t - last);
  },
};


/** the push-in: pivoted on the stage centre and clamped, so the camera can never eat a letterbox margin
    (the hub app fills 94% of the width at 4x5, so there is almost nothing to spend there) */
function zoom(R, g, W, s) {
  const H = 1080;
  const smax = Math.min(s, (W / 2) / Math.max(1, W / 2 - g.L), (H / 2) / Math.max(1, H / 2 - g.T));
  camera(R, smax, DW / 2, g.DH / 2);
}
/** a press dip, 0 -> 1 -> 0 over 0.22 s from c (montage of the hubkit/claude.js pulse) */
function press(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }
