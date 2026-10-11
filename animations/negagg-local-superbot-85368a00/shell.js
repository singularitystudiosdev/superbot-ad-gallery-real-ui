// shell.js: fresh, id-free clones of the Superbot desktop app window for the scenes.
// Markup lifted from ../waffles-website-superbot-87a583a1/index.html (the .sbapp Code view) and the hub chat
// view of youtube-refusal / waffles-delivery (assets/hub-real.css). Styles: shell.css + publish-ui.css +
// ../../assets/hub-real.css (all linked by index.html). Everything is class-scoped under .sbx, so a scene
// may hold several shells at once. Nothing here runs on a clock: scenes drive it from lt.
import { esc, clamp } from './lib.js';

// ---------- icons (lucide paths, as in the reference ads) ----------
const svg = (inner, vb = '0 0 24 24', cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
export const ICON = {
  chat: svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'),
  code: svg('<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'),
  pen: svg('<path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>'),
  folder: svg('<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'),
  thread: svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>'),
  panelL: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  panelR: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>'),
  monitor: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>'),
  phone: svg('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'),
  play: svg('<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>', '0 0 24 24', 'lucide lucide-play'),
  rocket: svg('<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>', '0 0 24 24', 'lucide lucide-rocket pub-rocket'),
  check: svg('<path class="pub-check-p" d="M4.5 12.5l5 5L19.5 7"/>', '0 0 24 24', 'lucide lucide-check pub-check'),
  file: svg('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/>'),
  music: svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  link: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  github: svg('<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>'),
  plus: svg('<path d="M5 12h14M12 5v14"/>'),
  send: svg('<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>'),
};
// the composer's superbot cat (hub-real .rc-cat)
const CAT = (fill = '#fff', eyes = '#1a1a1c', cls = 'rc-cat') => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><g fill="${fill}" stroke="none"><path d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="${eyes}" stroke="none"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></svg>`;

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const $ = (root, sel) => root.querySelector(sel);

// ---------- the live mark, made deterministic ----------
/** makeMark(size) -> { el, render(t) }. The assets/sb-mark-live mascot, but frozen off the wall clock:
    its CSS loops are paused and seeked to t, and it blinks on a fixed schedule. Call render(t) per frame. */
export function makeMark(size = 16) {
  const host = document.createElement('span');
  host.className = 'sbx-markhost';
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null, lastT = NaN;
  return {
    el: host,
    render(t) {
      if (t === lastT) return; lastT = t;
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { try { a.pause(); a.currentTime = Math.max(0, t) * 1000; } catch (e) { /* ignore */ } }
      // blinks: a 0.12s shut every 3.6s (every third one a one-eye wink)
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

/** the pointer cursor (waffles-website .cursor). Absolutely positioned; place with lib.placeCursor(el, x, y, press, opacity). */
export function makeCursor() {
  return h('<svg class="cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg>');
}

// ---------- the composer (hub-real .rc card) ----------
function composerHTML(placeholder) {
  return `<div class="composer"><div class="rc"><div class="rc-ph"><span class="rc-hint">${esc(placeholder)}</span><span class="rc-text"></span></div><div class="rc-row"><span class="rc-plus">${ICON.plus}</span><span class="rc-seg"><span>${ICON.chat}</span><span><svg viewBox="0 0 24 24"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg></span></span><span class="rc-super">SUPER</span><span class="rc-plat">${CAT()}superbot<svg class="rc-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span><span class="rc-computer">${ICON.monitor}</span><span class="rc-mic"><svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg></span><span class="rc-send">${ICON.send}</span></div></div></div>`;
}

/** setComposer(refs, text, { caret = true, sent = false }): show a typed draft in the composer.
    Empty text shows the placeholder. The send button lights (gradient) while there is a draft; `press`
    (0..1, lib.press) dips it. Pure: call every frame with the text for that frame. */
export function setComposer(refs, text, o = {}) {
  const has = text.length > 0;
  refs.composerText.innerHTML = esc(text) + (has && o.caret !== false ? '<i class="rc-caret"></i>' : '');
  refs.composerHint.style.display = has ? 'none' : '';
  refs.send.classList.toggle('on', has || !!o.lit);
  const p = clamp(o.press || 0);
  refs.send.style.transform = p ? `scale(${(1 - 0.12 * p).toFixed(3)})` : '';
}

/** scrollFeed(refs, y): scroll the chat thread by y px (layout px, pre-1.6 scale). Pure. */
export function scrollFeed(refs, y) { refs.feedIn.style.transform = `translateY(${(-Math.max(0, y)).toFixed(1)}px)`; }
/** how far the thread overflows its viewport right now (layout px), for pinning the newest turn to the bottom */
export function feedOverflow(refs) { return Math.max(0, refs.feedIn.scrollHeight - refs.feed.clientHeight); }

// ---------- thread builders (hub look) ----------
/** userBubble(text) -> .ch-user row; .textEl is the grey pill (set its textContent to type into it) */
export function userBubble(text = '') {
  const el = h(`<div class="ch-user"><span>${esc(text)}</span></div>`);
  el.textEl = el.firstElementChild;
  return el;
}
/** botBlock(html?) -> .ch-bot (plain reply text, no avatar). Put <p>, <ul>, tool chips and cards inside. */
export function botBlock(html = '') { const el = h('<div class="ch-bot"></div>'); el.innerHTML = html; return el; }
/** toolChip(label, state='run') -> .ch-tool pill with a spinner (state 'run') or green check ('done') */
export function toolChip(label, state = 'run') {
  const el = h(`<div class="ch-tool"><span class="spin"></span><span class="ch-tool-t"></span></div>`);
  setToolState(el, state, label);
  return el;
}
/** setToolState(chip, 'run' | 'done', label?, spinT?) ; spinT (seconds) rotates the spinner deterministically */
export function setToolState(chip, state, label, spinT) {
  const sp = chip.firstElementChild;
  sp.classList.toggle('done', state === 'done');
  sp.style.transform = state === 'done' || spinT == null ? '' : `rotate(${((spinT * 360 * 1.25) % 360).toFixed(1)}deg)`;
  if (label != null) chip.lastElementChild.textContent = label;
}
/** fileCard({ name, meta, kind: 'audio'|'file'|'code', badge, action }) -> a hub attachment row card */
export function fileCard({ name = '', meta = '', kind = 'file', badge = '', action = '' } = {}) {
  const ic = kind === 'audio' ? ICON.music : kind === 'code' ? ICON.code : ICON.file;
  const el = h(`<div class="sbx-file"><span class="sbx-file-ic k-${kind}">${ic}</span><span class="sbx-file-t"><b>${esc(name)}</b><small>${esc(meta)}</small></span>${badge ? `<span class="sbx-badge">${esc(badge)}</span>` : ''}${action ? `<span class="sbx-file-act">${ICON.download}${esc(action)}</span>` : ''}</div>`);
  return el;
}
/** linkCard({ title, url, icon: 'link'|'github' }) -> a compact link preview card */
export function linkCard({ title = '', url = '', icon = 'link' } = {}) {
  return h(`<div class="sbx-link"><span class="sbx-link-ic">${ICON[icon] || ICON.link}</span><span class="sbx-link-t"><b>${esc(title)}</b><small>${esc(url)}</small></span></div>`);
}
/** cardGroup(head, rowsEls[]) -> the youtube-refusal style bordered card: a small header strip, then rows */
export function cardGroup(head = '', rows = []) {
  const el = h(`<div class="sbx-group">${head ? `<div class="sbx-group-h">${head}</div>` : ''}</div>`);
  rows.forEach((r) => el.appendChild(r));
  return el;
}

// ---------- the window ----------
const norm = (list) => (list || []).map((p) => (typeof p === 'string' ? { name: p } : p));

/** makeShell(opts) -> refs. See CONTRACT.txt APPENDIX for the full contract.
    opts: { mode: 'code'|'chat', title, path, projects: [name | {name, when}], active: index|name,
            preview: 'phone'|'none'|'web', previewLabel, windowTitle, user, placeholder } */
export function makeShell(opts = {}) {
  const mode = opts.mode === 'chat' ? 'chat' : 'code';
  const title = opts.title || (mode === 'chat' ? 'New chat' : 'Untitled');
  const items = norm(opts.projects && opts.projects.length ? opts.projects : [{ name: mode === 'chat' ? title : slug(title) }]);
  const activeIdx = typeof opts.active === 'number' ? opts.active : Math.max(0, items.findIndex((p) => p.name === opts.active));
  const preview = mode === 'chat' ? 'none' : (opts.preview || 'web');
  const user = opts.user || 'you@superbot.gg';
  const placeholder = opts.placeholder || 'How can superbot help you today?';

  const cam = h(`<div class="sbx-cam"><div class="sbx ${mode === 'chat' ? 'is-chat hub' : 'is-code'}">
    <div class="w-bar"><i></i><i></i><i></i><span>${esc(opts.windowTitle || 'Superbot')}</span></div>
    <div class="w-body"><aside class="side"></aside><main class="mainp"></main></div>
  </div></div>`);
  const win = cam.firstElementChild, side = $(win, '.side'), main = $(win, '.mainp');

  // sidebar
  if (mode === 'code') {
    side.innerHTML = `<div class="side-head"><span class="side-mark"></span>superbot.gg</div>
      <div class="seg"><span>${ICON.chat}Chat</span><span class="on">${ICON.code}Code</span></div>
      <div class="row new">${ICON.pen}<span>New project</span></div>
      <div class="cap">Projects</div>
      ${items.map((p, i) => `<div class="row side-row${i === activeIdx ? ' on' : ''}">${ICON.folder}<span>${esc(p.name)}</span>${i === activeIdx ? '<em></em>' : ''}</div>`).join('')}
      <div class="user"><span class="av">${esc(user[0].toUpperCase())}</span><span><b>${esc(user)}</b><small>Pro</small></span></div>`;
  } else {
    side.innerHTML = `<div class="side-head"><span class="side-mark"></span>superbot.gg<i class="side-ic">${ICON.search}</i><i class="side-ic">${ICON.panelL}</i></div>
      <div class="rh-seg"><span>${ICON.chat}Chat</span><span>${ICON.code}Code</span></div>
      <div class="rh-new">${CAT('currentColor', '#e5e5ea', 'rh-cat')}New chat</div>
      <div class="cap-row"><span>Earlier</span><span class="rh-pm"><span>&minus;</span><span>+</span></span></div>
      ${items.map((p, i) => `<div class="row chat side-row${i === activeIdx ? ' on' : ''}">${ICON.thread}<span>${esc(p.name)}</span><em>${esc(p.when || (i === activeIdx ? 'now' : ['12m', '3h', '1d', '3d', '1w'][i % 5]))}</em></div>`).join('')}
      <div class="user"><span class="av">${esc(user[0].toUpperCase())}<i></i></span><span><b>${esc(user)}</b><small>Pro</small></span></div>`;
  }

  // main
  if (mode === 'code') {
    main.classList.add('sbpub');
    main.innerHTML = `<div class="project-head"><div class="project-head-row">
        <h2 class="project-title">${esc(title)}</h2><span class="p-path">${esc(opts.path || '~/projects/' + slug(title))}</span>
        <span class="publish-button-group">
          <button type="button" class="project-badge preview-badge" tabindex="-1">${ICON.play}<span>Preview</span></button>
          <button type="button" class="project-badge pub-cta" tabindex="-1"><span class="pub-ic">${ICON.rocket}${ICON.check}</span><span class="pub-label">Publish</span><i class="pub-shine"></i></button>
        </span></div></div>
      <div class="work${preview === 'none' ? ' no-preview' : ''}">
        <section class="pane chatp">
          <div class="pane-head"><span class="ch-mark"></span><b>Chat</b><em>superbot</em></div>
          <div class="ch-feed"><div class="ch-feed-in"></div></div>
          ${composerHTML(placeholder)}
        </section>
        ${preview === 'none' ? '' : `<section class="pane preview">
          <div class="pane-head">${preview === 'phone' ? ICON.phone : ICON.monitor}<b>${esc(opts.previewLabel || 'Preview')}</b><em class="pv-state">${preview === 'phone' ? 'iPhone 16' : 'Building'}</em></div>
          <div class="pv-body${preview === 'phone' ? ' is-phone' : ''}">${preview === 'phone' ? '<div class="sbx-phone-slot"></div>' : '<div class="pv-skel"><i></i><i></i><i></i><i></i><i></i><i></i></div>'}</div>
        </section>`}
      </div>`;
  } else {
    main.classList.add('is-hub');
    main.innerHTML = `<div class="chat-head"><b class="chat-title">${esc(title)}</b><span class="search">Search<kbd>&#8984;K</kbd></span><span class="pt">${ICON.panelR}</span></div>
      <div class="ch-feed hub-feed"><div class="ch-feed-in"></div></div>
      ${composerHTML(placeholder)}`;
  }

  const markHosts = [...win.querySelectorAll('.side-mark, .ch-mark')];
  const marks = markHosts.map((host) => { const m = makeMark(16); host.appendChild(m.el); return m; });
  const composer = $(win, '.composer');
  const refs = {
    root: cam, win, mode, side, main,
    head: $(win, mode === 'code' ? '.project-head' : '.chat-head'),
    title: $(win, mode === 'code' ? '.project-title' : '.chat-title'),
    feed: $(win, '.ch-feed'), feedIn: $(win, '.ch-feed-in'),
    composer, composerText: $(composer, '.rc-text'), composerHint: $(composer, '.rc-hint'), send: $(composer, '.rc-send'),
    preview: $(win, '.pane.preview'), previewState: $(win, '.pv-state'), previewBody: $(win, '.pv-body'),
    phoneSlot: $(win, '.sbx-phone-slot'),
    publish: $(win, '.pub-cta'), previewBtn: $(win, '.preview-badge'),
    sideRows: [...win.querySelectorAll('.side-row')],
    markEls: markHosts, marks,
    /** call once per frame from render(lt, ctx) with a steady clock (ctx.t or lt) so the marks breathe and blink */
    renderMarks(t) { marks.forEach((m) => m.render(t)); },
  };
  return refs;
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
