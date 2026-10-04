// YouTube Studio > Community > Comments, 1920x1080, light theme, seek-safe.
// export function mountStudioComments(host, data) -> { el, update(state), layout(state) }
// update(state) is a pure function of state: no timers, no transitions, no clock. Any order, any t.
import { icon } from './icons.js';
import defaultData from './story-data.js';
import { ensureCss, assetUrl, clamp01, ease, esc, fmtInt, mix, typedSlice } from './util.js';

// Per-video Studio view (Content > the video > Comments): Pin only exists here (YouTube Help 9482367).
const NAV = [
  ['edit-outline', 'Details'], ['analytics-outline', 'Analytics'], ['movie-edit-outline', 'Editor'],
  ['comment', 'Comments', true], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['paid-outline', 'Earn'],
];
const LIST_TOP = 174; // list top inside .st-main
const NAV_BOTTOM = [['settings-outline', 'Settings'], ['feedback-outline', 'Send feedback']];

// Studio's own AI reply suggestions, shown under a few rows that have no reply in this story.
const SUGGESTIONS = {
  c5: ['Welcome in, so glad you are here!', 'Small rooms, big plans!'],
  c7: ['Thank you! Took a few tries to get it right', 'Appreciate you noticing!'],
  c10: ['Closet studio club!', 'Love that, share a pic sometime!'],
};

const SENT_LABEL = { question: 'Question', love: 'Love', critique: 'Critique', spam: 'Spam' };
const SENT_VAR = { question: 'var(--sent-question)', love: 'var(--sent-love)', critique: 'var(--sent-critique)', spam: 'var(--sent-spam)' };
const BUCKET_COLOR = { love: 'var(--sent-love)', questions: 'var(--sent-question)', critique: 'var(--sent-critique)', spam: 'var(--sent-spam)' };

export function mountStudioComments(host, data = defaultData) {
  const D = { ...defaultData, ...data };
  ensureCss();
  const A = (p) => assetUrl(p, D.assetBase);
  const noa = A(D.creator.avatar);

  const el = document.createElement('div');
  el.className = 'yt-root yt-studio';

  const chips = [
    ['Published', 'drop'], ['Most relevant', 'drop'], ['Search', 'search'],
    ['Response status: Unresponded', 'x'],
  ].map(([t, k]) => k === 'x'
    ? `<div class="st-chip x">${esc(t)}${icon('close', 18)}</div>`
    : k === 'search'
      ? `<div class="st-chip lead">${icon('search-insights', 20)}${esc(t)}${icon('arrow-drop-down', 24)}</div>`
      : `<div class="st-chip">${esc(t)}${icon('arrow-drop-down', 24)}</div>`).join('');

  el.innerHTML = `
  <div class="st-top">
    <div class="ibtn">${icon('menu', 24)}</div>
    <div class="st-logo"><img src="${new URL('brand/youtube-studio-logo.svg', import.meta.url).href}" alt=""></div>
    <div class="st-search">${icon('search', 24)}<span>Search across your channel</span></div>
    <div class="st-right">
      <div class="ibtn">${icon('help-outline', 24)}</div>
      <div class="ibtn">${icon('spark4', 22)}</div>
      <div class="ibtn">${icon('notifications-outline', 24)}</div>
      <div class="st-create">${icon('video-call-outline', 24)}Create</div>
      <div class="yt-img round st-me"><img src="${noa}" alt=""></div>
    </div>
  </div>
  <div class="st-nav">
    <div class="st-back">${icon('arrow-back', 24)}<span>Channel content</span></div>
    <div class="st-vid"><div class="yt-img"><img src="${A(D.video.thumb)}" alt=""><span class="len">${esc(D.video.length)}</span></div>
      <div class="t1">Your video</div><div class="t2">${esc(D.video.title)}</div></div>
    <div class="st-items">${NAV.map(([i, t, on]) => `<div class="st-item${on ? ' on' : ''}">${icon(i, 24)}<span>${t}</span></div>`).join('')}</div>
    <div class="st-items-bottom">${NAV_BOTTOM.map(([i, t]) => `<div class="st-item">${icon(i, 24)}<span>${t}</span></div>`).join('')}</div>
  </div>
  <div class="st-main">
    <div class="st-title">Video comments</div>
    <div class="st-hr" style="top:84px"></div>
    <div class="st-filters" style="top:92px">${icon('filter-list', 24)}${chips}</div>
    <div class="st-hr" style="top:134px"></div>
    <div class="st-colhead" style="top:134px"><div class="st-cb" style="left:27px;top:11px"></div><span style="left:136px">Comment</span></div>
    <div class="st-hr" style="top:174px"></div>
    <div class="st-list" style="top:${LIST_TOP}px"><div class="st-rows"></div></div>
    <div class="menu">
      <div class="mi" data-k="pin">${icon('keep-outline', 24)}Pin</div>
      <div class="mi">${icon('delete-outline', 24)}Remove</div>
      <div class="mi">${icon('flag-outline', 24)}Report</div>
      <div class="mi">${icon('person-off-outline', 24)}Hide user from channel</div>
    </div>
    <div class="snack"></div>
    <div class="sb-layer sb-panel">
      <div class="sb-head"><span class="sb-mark"></span>superbot<span class="sb-model">Grok</span><span class="sb-sub">Sorted by sentiment · <b class="sb-total">0</b> comments</span></div>
      <div class="sb-chips">${D.sentimentBuckets.map((b) => `<div class="sb-chip" data-k="${b.key}"><span class="ring"></span><span class="d" style="background:${BUCKET_COLOR[b.key]}"></span>${b.label}<span class="n">0</span></div>`).join('')}</div>
      <div class="sb-bar">${D.sentimentBuckets.map((b) => `<i data-k="${b.key}" style="background:${BUCKET_COLOR[b.key]}"></i>`).join('')}</div>
    </div>
  </div>`;
  host.appendChild(el);

  const main = el.querySelector('.st-main');
  const rowsHost = el.querySelector('.st-rows');
  const menu = el.querySelector('.menu');
  const menuPin = menu.querySelector('[data-k="pin"]');
  const snack = el.querySelector('.snack');
  const panel = el.querySelector('.sb-panel');
  const total = panel.querySelector('.sb-total');
  const chipEls = Object.fromEntries([...panel.querySelectorAll('.sb-chip')].map((c) => [c.dataset.k, c]));
  const barEls = Object.fromEntries([...panel.querySelectorAll('.sb-bar i')].map((c) => [c.dataset.k, c]));

  const rows = {};
  for (const c of D.comments) {
    const r = document.createElement('div');
    r.className = 'row';
    const reply = D.replies[c.id] || '';
    const sugs = SUGGESTIONS[c.id];
    r.innerHTML = `
      <div class="hl"></div>
      <div class="st-cb"></div>
      <div class="yt-img av"><img src="${A(c.avatar)}" alt=""></div>
      <div class="body">
        <div class="pinl"><div class="pinl-in">${icon('keep', 16)}<span>${esc(D.pinnedLabel)}</span></div></div>
        <div class="meta"><span>${esc(c.handle)}</span><span class="dot">•</span><span>${esc(c.time)}</span></div>
        <div class="ctext">${esc(c.text)}</div>
        <div class="acts">
          <div class="rbtn">Reply</div>
          <div class="nrep"><span class="nrep-t">0 replies</span><span class="nrep-i">${icon('expand-more', 24)}</span></div>
          <div class="likeb"><div class="ibtn">${icon('thumb-up-outline', 24)}</div><span class="cnt">${esc(c.likes === '0' ? '' : c.likes)}</span></div>
          <div class="ibtn">${icon('thumb-down-outline', 24)}</div>
          <div class="ibtn heartb"><span class="h0">${icon('favorite-outline', 24)}</span>
            <span class="h1"><span class="yt-img hav"><img src="${noa}" alt=""></span><span class="hbad">${icon('favorite', 14)}</span></span></div>
          <div class="ibtn kebab">${icon('more-vert', 24)}</div>
        </div>
        ${sugs ? `<div class="sugs">${sugs.map((s) => `<div class="sug">${esc(s)}</div>`).join('')}<div class="ibtn" style="width:32px;height:32px">${icon('more-vert', 20)}</div></div>` : ''}
        <div class="comp"><div class="comp-in">
          <div class="yt-img"><img src="${noa}" alt=""></div>
          <div class="comp-col">
            <div class="tbox"><div class="lbl">Reply</div><div class="val"><span class="typed"></span><span class="caret"></span></div></div>
            <div class="comp-btns"><div class="tbtn">Cancel</div><div class="tbtn fill">Reply</div></div>
          </div></div></div>
        <div class="rep"><div class="rep-in">
          <div class="yt-img"><img src="${noa}" alt=""></div>
          <div>
            <div class="meta"><span class="owner">${esc(D.creator.handle)}</span><span class="dot">•</span><span>0 seconds ago</span></div>
            <div class="ctext">${esc(reply)}</div>
            <div class="acts"><div class="rbtn">Reply</div>
              <div class="ibtn" style="margin-left:16px">${icon('thumb-up-outline', 24)}</div><div class="ibtn" style="margin-left:16px">${icon('thumb-down-outline', 24)}</div>
              <div class="ibtn" style="margin-left:16px">${icon('favorite-outline', 24)}</div><div class="ibtn" style="margin-left:16px">${icon('more-vert', 24)}</div></div>
          </div></div></div>
        <div class="padb"></div>
      </div>
      <div class="sb-layer sb-tag"><span class="d" style="background:${SENT_VAR[c.sentiment]}"></span>${SENT_LABEL[c.sentiment]}</div>`;
    rowsHost.appendChild(r);
    const q = (s) => r.querySelector(s);
    rows[c.id] = {
      c, el: r, reply, hl: q('.hl'), pinl: q('.pinl'), pinlIn: q('.pinl-in'), comp: q('.comp'), compIn: q('.comp-in'),
      rep: q('.rep'), repIn: q('.rep-in'), typed: q('.typed'), caret: q('.caret'), postBtn: q('.tbtn.fill'),
      nrepT: q('.nrep-t'), nrep: q('.nrep'), nrepI: q('.nrep-i'), h0: q('.h0'), h1: q('.h1'), kebab: q('.kebab'),
      body: q('.body'), tag: q('.sb-tag'),
    };
  }

  const defaultOrder = D.comments.map((c) => c.id);

  // Pure layout: applies per-row content state, measures natural heights, returns { tops, heights }.
  function applyRows(state) {
    const replies = state.replies || {};
    const hearted = new Set(state.hearted || []);
    const pin = state.pin && state.pin.id ? state.pin : null;
    const filter = state.filter || null;
    const overlay = state.overlay != null ? clamp01(state.overlay) : (state.counts ? 1 : 0);
    const hlP = state.highlightP != null ? clamp01(state.highlightP) : 1;
    const heights = {};
    for (const id in rows) {
      const R = rows[id];
      const rs = replies[id] || {};
      const typed = clamp01(rs.typed || 0);
      const posted = clamp01(rs.posted || 0);
      // pin label (grows in over pin.p 0..0.3)
      const pinP = pin && pin.id === id ? ease(clamp01(pin.p / 0.3)) : 0;
      R.pinl.style.height = (pinP * 22).toFixed(2) + 'px';
      R.pinlIn.style.opacity = pinP.toFixed(3);
      // composer: opens over the first 6% of typing, collapses as the reply posts
      const open = typed > 0 || posted > 0 ? ease(clamp01(typed / 0.06)) : 0;
      const pe = ease(posted);
      const compF = open * (1 - pe);
      const shown = typedSlice(R.reply, typed);
      R.typed.textContent = shown;
      R.caret.style.visibility = typed > 0 && typed < 1 && posted === 0 ? 'visible' : 'hidden';
      R.postBtn.classList.toggle('ok', shown.length > 0);
      R.comp.style.height = (R.compIn.offsetHeight * compF).toFixed(2) + 'px';
      R.compIn.style.opacity = clamp01(compF * 1.4).toFixed(3);
      R.rep.style.height = (R.repIn.offsetHeight * pe).toFixed(2) + 'px';
      R.repIn.style.opacity = clamp01((posted - 0.35) / 0.65).toFixed(3);
      const has = posted >= 0.5;
      R.nrepT.textContent = has ? '1 reply' : '0 replies';
      R.nrep.classList.toggle('has', has);
      R.nrepI.innerHTML = has ? icon('expand-less', 24) : icon('expand-more', 24);
      // heart
      const h = hearted.has(id);
      R.h0.style.display = h ? 'none' : '';
      R.h1.style.display = h ? '' : 'none';
      // highlight (superbot focus)
      const hl = state.highlightId === id ? hlP : 0;
      R.hl.style.opacity = hl.toFixed(3);
      R.hl.style.background = 'linear-gradient(90deg, rgba(43,107,255,0.10), rgba(192,38,211,0.05))';
      R.hl.style.boxShadow = 'inset 0 0 0 2px rgba(43,107,255,0.55)';
      // sentiment tag + filter dimming (superbot layer)
      R.tag.style.opacity = overlay.toFixed(3);
      const inBucket = !filter || D.bucketOf[R.c.sentiment] === filter;
      R.el.style.opacity = inBucket ? '1' : (1 - 0.62 * overlay).toFixed(3);
      heights[id] = R.el.offsetHeight;
    }
    return heights;
  }

  function topsFor(order, heights) {
    const t = {};
    let y = 0;
    for (const id of order) { t[id] = y; y += heights[id] || 0; }
    return t;
  }

  function update(state = {}) {
    const order = (state.order && state.order.length ? state.order : defaultOrder).filter((id) => rows[id]);
    const heights = applyRows(state);
    let tops = topsFor(order, heights);
    let rest = { ...tops };
    if (state.reorder && state.reorder.from) {
      const from = state.reorder.from.filter((id) => rows[id]);
      const tf = topsFor(from, heights);
      const k = ease(clamp01(state.reorder.p));
      for (const id of order) if (id in tf) tops[id] = mix(tf[id], tops[id], k);
    }
    const pin = state.pin && state.pin.id && rows[state.pin.id] ? state.pin : null;
    if (pin && order.includes(pin.id)) {
      const pinned = [pin.id, ...order.filter((id) => id !== pin.id)];
      const tp = topsFor(pinned, heights);
      const k = ease(clamp01((pin.p - 0.3) / 0.7));
      for (const id of order) tops[id] = mix(tops[id], tp[id], k);
      if (k >= 1) rest = tp;
    }
    const rowY = state.rowY || {};
    const visible = new Set(order);
    const scroll = state.scroll || 0;
    for (const id in rows) {
      const R = rows[id];
      if (!visible.has(id)) { R.el.style.display = 'none'; R.el.style.transform = ''; R.el.style.zIndex = ''; R.el.style.boxShadow = ''; continue; }
      R.el.style.display = '';
      const y = tops[id] + (rowY[id] || 0) - scroll;
      R.el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      // rows in flight (reorder, rowY, pin) lift above the rest; the one travelling furthest upward is on top
      const disp = y + scroll - rest[id];
      const pinMove = pin && pin.id === id && pin.p > 0.3 && pin.p < 1;
      const moving = pinMove || Math.abs(disp) > 0.5;
      R.el.style.zIndex = pinMove ? '60' : moving ? String(Math.min(55, 5 + Math.round(Math.max(0, -disp) / 30))) : state.highlightId === id ? '2' : '1';
      R.el.style.boxShadow = moving ? '0 6px 24px rgba(0,0,0,0.12)' : 'none';
    }

    // kebab menu
    const mid = state.menuOpenId && rows[state.menuOpenId] && visible.has(state.menuOpenId) ? state.menuOpenId : null;
    if (mid) {
      const R = rows[mid];
      const y = tops[mid] + (rowY[mid] || 0) - scroll;
      const kx = R.body.offsetLeft + R.kebab.offsetLeft;
      const ky = R.body.offsetTop + R.kebab.offsetTop;
      menu.style.display = 'block';
      menu.style.left = (kx + 8) + 'px';
      menu.style.top = (LIST_TOP + y + ky + 40) + 'px';
      const mp = state.menuP != null ? ease(clamp01(state.menuP)) : 1;
      menu.style.opacity = mp.toFixed(3);
      menu.style.transform = mp >= 1 ? 'none' : `scale(${mix(0.92, 1, mp).toFixed(4)})`;
      menuPin.classList.toggle('on', state.menuHover !== null);
    } else { menu.style.display = 'none'; menu.style.left = menu.style.top = menu.style.opacity = menu.style.transform = ''; menuPin.classList.remove('on'); }

    // snackbar
    let snackText = '';
    let snackA = 0;
    if (pin && pin.p >= 0.35) { snackText = 'Comment pinned'; snackA = clamp01((pin.p - 0.35) / 0.15); }
    else {
      const ps = Object.values(state.replies || {}).map((r) => r.posted || 0).filter((p) => p >= 0.6);
      if (ps.length) { snackText = 'Reply added'; snackA = clamp01((Math.min(...ps) - 0.6) / 0.2); }
    }
    if (state.snack === false) snackA = 0;
    snack.textContent = snackText;
    snack.style.opacity = snackA.toFixed(3);
    snack.style.transform = `translateY(${((1 - ease(snackA)) * 12).toFixed(2)}px)`;

    // superbot sentiment panel
    const counts = state.counts || null;
    const overlay = state.overlay != null ? clamp01(state.overlay) : (counts ? 1 : 0);
    panel.style.opacity = overlay.toFixed(3);
    panel.style.transform = `translateY(${((1 - ease(overlay)) * -8).toFixed(2)}px)`;
    const c = counts || { love: 0, questions: 0, critique: 0, spam: 0 };
    let sum = 0;
    for (const b of D.sentimentBuckets) {
      const n = Math.max(0, c[b.key] || 0);
      sum += n;
      chipEls[b.key].querySelector('.n').textContent = fmtInt(n);
      const on = state.filter === b.key;
      chipEls[b.key].querySelector('.ring').style.opacity = on ? '1' : '0';
      chipEls[b.key].style.background = on ? '#202020' : '';
      chipEls[b.key].style.opacity = state.filter && !on ? '0.55' : '1';
    }
    total.textContent = fmtInt(sum);
    const fullSum = Object.values(D.sentimentCounts).reduce((a, b) => a + b, 0);
    for (const b of D.sentimentBuckets) {
      const n = Math.max(0, c[b.key] || 0);
      barEls[b.key].style.width = ((n / fullSum) * 100).toFixed(3) + '%';
    }
  }

  // Helper for the motion agent: row tops (px, list space) for a given order and state, without moving anything.
  function layout(state = {}) {
    const order = (state.order && state.order.length ? state.order : defaultOrder).filter((id) => rows[id]);
    const heights = applyRows(state);
    return { tops: topsFor(order, heights), heights, listTop: 64 + LIST_TOP };
  }

  update({});
  return { el, update, layout };
}

export default mountStudioComments;
export { ytReady } from './util.js';
