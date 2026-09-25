// The Superbot hub window, for the kit's hub scene. Copied from do-that-too-apps-superbot-e8871e50's
// scenes/tabs-assets/hub-markup.js (GENERATED there from tabs-chaos-superbot-6f50ea56/index.html #hub,
// markup verbatim) and adapted for the kit:
//   - symbol ids are hb-ic-* (the kit's browser scene mounts its own copy of the same registry, so the
//     ids must not collide across scenes: identical symbols, different ids)
//   - the chat head carries this chat's own short title and the sidebar's first thread IS that chat
//     (.on, "now"), because this spot's hub has already landed on the conversation being run
//   - the feed starts empty: the hub scene appends its own thread (typed ask, tool chips, the aggregation
//     card, the build card) so the scene owns every beat it plays
//   - asset paths go through A(), the scene's own hub-assets resolver
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const thread = (title, when, on) => `<span class="row chat${on ? ' on' : ''}"><i class="sp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg></i><span class="t">${esc(title)}</span><em>${esc(when)}</em></span>`;

export const hubMarkup = (A, opts = {}) => {
  const title = opts.title || 'new search';
  const older = opts.older || ['gpu price watch', 'flight to lisbon', 'q3 board deck', 'inbox cleanup'];
  return `<div class="hub" data-k="hub" aria-hidden="true">
  <nav class="rail inner">
    <span class="rail-item sb sel"><img src="${A('tile.svg')}" alt="" width="44" height="44"/></span>
    <span class="rail-div"></span>
    <span class="rail-item" data-app="openai"><svg><use href="#hb-ic-openai"/></svg><i class="dot"></i></span>
    <span class="rail-item" data-app="claude"><svg><use href="#hb-ic-claude"/></svg><i class="dot"></i></span>
    <span class="rail-item" data-app="gemini"><svg><use href="#hb-ic-gemini"/></svg><i class="dot"></i></span>
    <span class="rail-item" data-app="cursor"><svg><use href="#hb-ic-cursor"/></svg><i class="dot"></i></span>
    <span class="rail-item bleed" data-app="devin"><img src="${A('devin.png')}" alt="" width="44" height="44"/><i class="dot"></i></span>
    <span class="rail-item bleed" data-app="hermes"><img src="${A('hermes.png')}" alt="" width="44" height="44"/><i class="dot"></i></span>
    <span class="rail-item bleed" data-app="grok"><img src="${A('grok.png')}" alt="" width="44" height="44"/><i class="dot"></i></span>
    <span class="rail-item" data-app="copilot"><svg><use href="#hb-ic-copilot"/></svg><i class="dot"></i></span>
    <span class="rail-div"></span>
    <span class="rail-item folder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
      <i class="dot"></i>
    </span>
    <span class="rail-item add">+</span>
  </nav>
  <div class="chats inner">
    <div class="side-head"><img src="${A('mark-clean.svg')}" alt="" width="14" height="14"/><b>superbot.gg</b><i class="side-ic ic-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg></i><i class="side-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg></i></div>
    <div class="rh-seg" aria-hidden="true"><span><svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>Chat</span><span><svg viewBox="0 0 24 24"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>Code</span></div><div class="rh-new" aria-hidden="true"><svg class="rh-cat" viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor" stroke="none"><path d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="#e5e5ea" stroke="none"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></svg>New chat</div>
    <div class="cap-row"><span>Earlier</span><span class="rh-pm"><span>−</span><span>+</span></span></div>
    ${thread(title, 'now', true)}${older.map((t, i) => thread(t, ['12m', '3h', '1d', '3d'][i % 4], false)).join('')}
    <div class="user"><span class="avatar" style="--c:var(--raised)">S<i class="dot ok"></i></span><span class="u-tx"><b>hi@superbot.gg</b><small>8 agents wired in</small></span></div>
  </div>
  <div class="main inner">
    <div class="chat-head"><b>${esc(title)}</b><span class="search">Search<kbd>⌘K</kbd></span><span class="ask"><img src="${A('mark-clean.svg')}" alt="" width="12" height="12"/>Ask Superbot</span><span class="ptoggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg></span></div>
    <div class="feed" data-k="feed"></div>
    <div class="composer" aria-hidden="true"><div class="pill"><div class="rc"><div class="rc-ph">How can superbot help you today?</div><div class="rc-row"><span class="rc-plus"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></span><span class="rc-seg"><span><svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg></span><span><svg viewBox="0 0 24 24"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg></span></span><span class="rc-super">SUPER</span><span class="rc-plat"><svg class="rc-cat" viewBox="0 0 100 100" aria-hidden="true"><g fill="#fff" stroke="none"><path d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="#1a1a1c" stroke="none"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></svg>superbot<svg class="rc-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span><span class="rc-computer"><svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span><span class="rc-mic"><svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg></span><span class="rc-send"><svg viewBox="0 0 24 24"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg></span></div></div></div></div>
  </div>
</div>`;
};