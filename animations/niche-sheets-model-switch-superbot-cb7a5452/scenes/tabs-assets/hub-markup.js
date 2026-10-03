// GENERATED from tabs-chaos-superbot-6f50ea56/index.html (the #hub, lines 206-247), markup verbatim except:
// asset paths go through A(), symbol refs use this scene's tbs-ic- registry, ids became data-k. For the X ad policy
// (niche-sheets cb7a5452) the composer keeps only the draft and the model label (no +, chat/code switch, SUPER
// switch, chevron, computer, mic or send arrow), and every date, time and age stamp is dropped (date divider,
// message time, the sidebar's "3h / 1d / 3d"); the user is priya and the thread is titled with the ask.
export const hubMarkup = (A) => `<div class="hub" data-k="hub" aria-hidden="true">
  <nav class="rail inner">
    <span class="rail-item sb sel"><img src="${A('tile.svg')}" alt="" width="44" height="44"/></span>
    <span class="rail-div"></span>
    <span class="rail-item" data-app="openai"><svg><use href="#tbs-ic-openai"/></svg><i class="dot"></i></span>
    <span class="rail-item" data-app="claude"><svg><use href="#tbs-ic-claude"/></svg><i class="dot"></i></span>
    <span class="rail-item" data-app="gemini"><svg><use href="#tbs-ic-gemini"/></svg><i class="dot"></i></span>
    <span class="rail-item" data-app="cursor"><svg><use href="#tbs-ic-cursor"/></svg><i class="dot"></i></span>
    <span class="rail-item bleed" data-app="devin"><img src="${A('devin.png')}" alt="" width="44" height="44"/><i class="dot"></i></span>
    <span class="rail-item bleed" data-app="hermes"><img src="${A('hermes.png')}" alt="" width="44" height="44"/><i class="dot"></i></span>
    <span class="rail-item bleed" data-app="grok"><img src="${A('grok.png')}" alt="" width="44" height="44"/><i class="dot"></i></span>
    <span class="rail-item" data-app="copilot"><svg><use href="#tbs-ic-copilot"/></svg><i class="dot"></i></span>
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
    <span class="row chat on"><i class="sp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg></i><span class="t">one window</span></span>
    <span class="row chat"><i class="sp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg></i><span class="t">trip plan · kyoto</span></span>
    <span class="row chat"><i class="sp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg></i><span class="t">customer email</span></span>
    <span class="row chat"><i class="sp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg></i><span class="t">bakery website</span></span>
    <div class="user"><span class="avatar" style="--c:var(--raised)">P<i class="dot ok"></i></span><span class="u-tx"><b>priya</b><small>8 agents wired in</small></span></div>
  </div>
  <div class="main inner">
    <div class="chat-head"><b>Fix every broken formula in Q3 Revenue.xlsx</b><span class="search">Search<kbd>⌘K</kbd></span><span class="ask"><img src="${A('mark-clean.svg')}" alt="" width="12" height="12"/>Ask Superbot</span><span class="ptoggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg></span></div>
    <div class="feed" data-k="feed">
      <div class="welcome"><span class="w-ic"><img src="${A('mark-clean.svg')}" alt="" width="14" height="14"/></span><span class="w-tx"><b>Welcome to #chat</b><small>This is the start of your conversation with Superbot.</small></span></div>
      
      <div class="msg" data-k="h-bot"><span class="avatar sb"><img src="${A('mark-clean.svg')}" alt=""/></span><div class="m-main"><div class="m-head"><span class="m-name">superbot</span><span class="app">APP</span></div><div class="m-text" data-k="h-text">ChatGPT, Claude, Gemini, Grok, Cursor, Copilot, Devin and Hermes are all here. one window. what should we do first?</div></div></div>
    </div>
    <div class="composer" aria-hidden="true"><div class="pill"><div class="rc"><div class="rc-ph">How can superbot help you today?</div><div class="rc-row"><span class="rc-plat"><svg class="rc-cat" viewBox="0 0 100 100" aria-hidden="true"><g fill="#fff" stroke="none"><path d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="#1a1a1c" stroke="none"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></svg>superbot</span></div></div></div></div>
  </div>
</div>`;
