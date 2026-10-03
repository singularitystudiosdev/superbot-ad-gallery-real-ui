// The superbot hub, cut down to what this spot shows: the thread and the composer box the ask is typed into. Forked
// from the sibling's GENERATED markup (tabs-chaos-superbot-6f50ea56/index.html #hub); the rail, the chat list, the
// chat header, the sample messages and every composer control (the + button, the mode switch, SUPER, the model
// chip, the computer and mic icons, the send arrow) are left out on purpose: nothing on screen may read as tappable,
// and the composer exists only while the ask is typed (chat.js). A() resolves an asset path.
export const hubMarkup = (A) => `<div class="hub" data-k="hub" aria-hidden="true" data-sb="${A('tile.svg')}">
  <div class="main inner">
    <div class="feed" data-k="feed"></div>
    <div class="composer" aria-hidden="true"><div class="pill"><div class="rc"><div class="rc-att"></div><div class="rc-ph"></div></div></div></div>
  </div>
</div>`;
