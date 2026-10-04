// Beat B (0.90-1.90 s, 1.00 s): the superbot chat. The original's real hub shell (scenes/tabs-assets/hub-markup.js),
// cropped to its thread and composer, sits as a framed panel on the dark stage. The user's ask types into the composer
// and is sent; superbot's single reply line types into the thread. Every character lands whole (lib.streamCount), so no
// frame ever shows a half-rendered glyph as a finished line. Pure function of lt: no timers, transitions or rAF.
import { dur } from './budget.js';
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { seg, outCubic, esc, streamCount, press } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;

// exact copy (task): ASCII only, no em/en dash
const ASK = 'Fix the random logouts in kitebase/web#482 and ship it';
const REPLY = 'Racing 3 models on the failing Remember me test.';

// The beat is 1.00 s. 102 characters cannot type at 14-18 chars/s inside it (that would need ~6 s), so the clip is
// compressed to fit while every line still streams one whole glyph at a time: the ask types, the composer sends, the
// reply types, all before lt reaches 1.0. (ASK_CPS/REPLY_CPS are pixels of time, not a claim about the app.)
const TYPE0 = 0.02;       // the ask starts typing
const ASK_CPS = 150;      // last ask char lands ~0.373
const SEND = 0.42;        // the send press
const REPLY0 = 0.46;      // the reply starts typing
const REPLY_CPS = 112;    // last reply char lands ~0.88

// superbot's tile: the hub's CSS-masked cat mark (chat.css --sb-cat), three layers deep like the live mark
const TILE = '<i class="qc-tile qc-t-superbot"><i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i></i>';

let el = null;

export default {
  id: 'b',
  dur: dur('b'),

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="ask-edge" aria-hidden="true"></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const feed = hub.querySelector('.feed');
    // the hub's demo welcome/date move into a feed-in wrapper (chat.css keeps only .qc-u/.qc-m visible); the thread
    // starts empty and grows up out of the composer
    const inner = document.createElement('div');
    inner.className = 'feed-in';
    while (feed.firstChild) inner.appendChild(feed.firstChild);
    feed.appendChild(inner);

    const umsg = document.createElement('div');
    umsg.className = 'msg qc-u';
    umsg.innerHTML = '<span class="avatar" style="--c:#facc15">M</span><div class="m-main"><div class="m-head"><span class="m-name">mira</span></div><div class="m-text"></div></div>';
    const rmsg = document.createElement('div');
    rmsg.className = 'msg qc-m qc-r';
    rmsg.innerHTML = `<span class="avatar sb"><img src="${asset('mark-clean.svg')}" alt=""/></span><div class="m-main"><div class="qc-who">${TILE}<b>Superbot</b></div><div class="qc-say"></div></div>`;
    inner.append(umsg, rmsg);

    // the composer as the original's empty state shows it: SUPER as a switch (off)
    const sup = hub.querySelector('.rc-super');
    if (sup) sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    const ph = hub.querySelector('.rc-ph');
    const send = hub.querySelector('.rc-send');

    el = {
      hub, inner, umsg, ut: umsg.querySelector('.m-text'),
      rmsg, rt: rmsg.querySelector('.qc-say'),
      ph, phText: (ph.textContent || '').trim(), send, lastPh: null,
    };
  },

  render(lt) {
    if (!el) return;
    const t = lt;

    // 1) the ask types into the composer (one glyph at a time, caret while typing)
    const typing = t >= TYPE0 && t < SEND;
    const n = streamCount(ASK, TYPE0, ASK_CPS, t);
    const ph = typing ? `<span class="qc-typed">${esc(ASK.slice(0, n))}</span><i class="qc-caret"></i>` : esc(el.phText);
    if (ph !== el.lastPh) { el.ph.innerHTML = ph; el.lastPh = ph; }
    el.send.classList.toggle('qc-on', typing);
    const p = press(t, SEND, 0.05, 0.05, 0.12);
    el.send.style.transform = p ? `scale(${(1 - 0.16 * p).toFixed(4)})` : 'none';

    // 2) sent: the composer empties and the ask lands in the thread as one message
    const sent = seg(t, SEND, SEND + 0.14);
    if (t >= SEND && !el.ut.textContent) el.ut.textContent = ASK;
    el.umsg.style.opacity = sent.toFixed(3);
    el.umsg.style.transform = sent >= 1 ? 'none' : `translateY(${((1 - outCubic(sent)) * 8).toFixed(2)}px)`;

    // 3) the reply types into the thread (the row appears with its first character, never empty)
    const rin = seg(t, REPLY0, REPLY0 + 0.1);
    el.rmsg.style.opacity = rin.toFixed(3);
    el.rmsg.style.transform = rin >= 1 ? 'none' : `translateY(${((1 - outCubic(rin)) * 8).toFixed(2)}px)`;
    const rn = streamCount(REPLY, REPLY0, REPLY_CPS, t);
    el.rt.innerHTML = esc(REPLY.slice(0, rn)) + (rn > 0 && rn < REPLY.length ? '<i class="b-caret"></i>' : '');
  },
};