// Superbot beat: drives Venmo's Pay or Request screen for real (forked from the DoorDash beat). Three tool chips land
// (open, add, send), the request card rises with the amount and note already filled, the three friends drop into
// the To field, the gradient pill resolves "Requesting..." into "Requested", and one "Request sent" row lands per
// friend. The card is drawn in code: Venmo blue header with the wordmark as text, no logo artwork.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'On it. Requesting $48.97 each on Venmo.';
const CHIPS = [
  ['Opening Venmo', 'Opened Venmo'],
  ['Adding Maya, Jordan and Sam', 'Added Maya, Jordan and Sam'],
  ['Sending 3 requests', 'Sent 3 requests'],
];
const FRIENDS = [
  { i: 'M', name: 'Maya Chen', at: '@maya-chen', c: '#e8a33d' },
  { i: 'J', name: 'Jordan Oku', at: '@jordan-oku', c: '#36b3a0' },
  { i: 'S', name: 'Sam Reyes', at: '@sam-reyes', c: '#8b7cf6' },
];
const SEND = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4Z"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const NOTE = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.08, r + 0.16, r + 0.24];
    T.card = r + 0.3;
    T.to = [r + 0.46, r + 0.54, r + 0.62];
    T.press = r + 0.78;
    T.sent = [r + 0.94, r + 1.0, r + 1.06];
    T.chipDone = [r + 0.3, T.to[2] + 0.06, T.sent[2]];
    T.foot = r + 1.14;
    T.end = r + 1.52;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const av = (f) => `<span class="vm-av" style="--c:${f.c}">${f.i}</span>`;
    const card = x.el(`<div class="vm-card">
      <div class="vm-head"><span class="vm-wm">venmo</span><b>Pay or Request</b><span class="vm-tag">3 people</span></div>
      <div class="vm-to"><span class="vm-tol">To</span>${FRIENDS.map((f) => `<span class="vm-chip">${av(f)}<span>${x.esc(f.at)}</span></span>`).join('')}</div>
      <div class="vm-amt"><span class="vm-big">$48.97</span><span class="vm-each">each</span><span class="vm-note">${NOTE}<span>Lucca Trattoria, Fri</span></span></div>
      <div class="dd-btn vm-btn">
        <span class="dd-grp dd-grp-a">${SEND}<span class="dd-lab-a">Request</span></span>
        <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Requested</span></span>
        <i class="dd-shine" aria-hidden="true"></i>
      </div>
      <div class="vm-rows">${FRIENDS.map((f) => `<div class="vm-row"><div class="vm-row-in">${av(f)}<span class="vm-who"><b>${x.esc(f.name)}</b><small>${x.esc(f.at)}</small></span><span class="vm-amt-s">$48.97</span><span class="vm-sent">${x.OK}Request sent</span></div></div>`).join('')}</div>
      <div class="vm-foot">${x.OK}<span>3 requests sent. <b>$146.91</b> coming back to you.</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const $$ = (s) => [...card.querySelectorAll(s)];
    const btn = $('.vm-btn'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a'), plane = $('.dd-bag');
    const check = $('.dd-check'), checkP = $('.dd-check-p'), shine = $('.dd-shine'), foot = $('.vm-foot');
    const toChips = $$('.vm-chip'), sentRows = $$('.vm-row'), sentOk = $$('.vm-sent .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1, rowH = null;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows, card],
      marks: [[T.r, say], ...rows.map((r, i) => [T.chipIn[i], r]), [T.card, card], ...T.sent.map((s, i) => [s, sentRows[i]]), [T.foot, foot]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.03, 110, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.3), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });
        const ci = seg(t, T.card, T.card + 0.4);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // the three friends drop into the To field
        toChips.forEach((c, i) => {
          const p = seg(t, T.to[i], T.to[i] + 0.22);
          c.style.opacity = outCubic(p).toFixed(3);
          c.style.transform = `scale(${lerp(0.6, 1, outBack(p)).toFixed(4)})`;
        });

        // the request pill: pressed, "Requesting...", then "Requested" with a dip, a shine and a drawn check
        const P = T.press, D = T.sent[0];
        labA.textContent = t < P ? 'Request' : 'Requesting' + '.'.repeat(1 + (Math.floor(Math.max(0, t - P) * 8) % 3));
        const down = seg(t, P - 0.06, P) * (1 - seg(t, P + 0.06, P + 0.18));
        const down2 = seg(t, D - 0.05, D + 0.03) * (1 - seg(t, D + 0.08, D + 0.2));
        btn.style.transform = `scale(${(1 - 0.06 * down - 0.04 * down2 + 0.03 * Math.sin(Math.PI * seg(t, D + 0.08, D + 0.4))).toFixed(4)})`;
        plane.style.transform = t < P ? '' : `translate(${(lerp(0, 3, seg(t, P, D))).toFixed(2)}px,${(lerp(0, -3, seg(t, P, D))).toFixed(2)}px)`;
        const sh = seg(t, D, D + 0.5);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
        const ro = seg(t, D, D + 0.2);
        grpA.style.opacity = (1 - outCubic(ro)).toFixed(3);
        grpA.style.transform = `translate(-50%, calc(-50% - ${(outCubic(ro) * 10).toFixed(2)}px))`;
        const gi = seg(t, D + 0.05, D + 0.3);
        grpB.style.opacity = outCubic(gi).toFixed(3);
        grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(gi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, outBack(gi)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, D + 0.08, D + 0.32)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, D + 0.08, D + 0.3))).toFixed(3)})`;
        card.classList.toggle('is-placed', t >= D);

        // one "Request sent" row per friend: each row opens its height, then slides in with its check
        if (rowH === null) rowH = sentRows[0].firstElementChild.offsetHeight;
        sentRows.forEach((r, i) => {
          const o = outCubic(seg(t, T.sent[i] - 0.04, T.sent[i] + 0.16));
          r.style.height = `${(rowH * o).toFixed(2)}px`;
          const p = seg(t, T.sent[i], T.sent[i] + 0.25);
          const inner = r.firstElementChild;
          inner.style.opacity = outCubic(p).toFixed(3);
          inner.style.transform = p >= 1 ? '' : `translateX(${((1 - outCubic(p)) * 18).toFixed(2)}px)`;
          sentOk[i].style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.sent[i] + 0.06, T.sent[i] + 0.28))).toFixed(3)})`;
        });
        rise(foot, seg(t, T.foot, T.foot + 0.3), 6);
        foot.style.setProperty('--lit', outCubic(seg(t, T.foot, T.foot + 0.35)).toFixed(3));
      },
    };
  },
};
