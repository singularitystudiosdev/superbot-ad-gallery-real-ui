// Google's OAuth consent, as the Chrome popup the connect button opens on macOS: a title bar, the read-only
// origin strip (accounts.google.com), then the "Sign in with Google" granular-consent page. One sensitive scope,
// the one comments.insert needs (youtube.force-ssl, Google's own wording), unticked until the person ticks it;
// sign-in's basic scope sits above it without a checkbox. Google Sans (brand/fonts) is the page's own face.
import { esc } from '../../lib.js';
import { h, ms } from './feed.js';

export function buildPopup(creator) {
  const el = h(`<div class="ys-pop">
    <div class="mac-bar"><i class="tl r"></i><i class="tl y"></i><i class="tl g"></i><span>Sign in - Google Accounts</span></div>
    <div class="url">${ms('lock-outline')}<b>accounts.google.com</b><span>/signin/oauth/consent?authuser=0&amp;part=AJi8hAN</span></div>
    <div class="gp">
      <div class="g-head"><img src="brand/google-g.svg" alt=""><span>Sign in with Google</span></div>
      <div class="g-app"><img src="brand/tile.svg" alt=""></div>
      <h2 class="g-h1">superbot wants access to your Google Account</h2>
      <span class="g-acct"><img src="img/avatar.jpg" alt=""><span>${esc(creator.name)}</span>${ms('expand-more')}</span>
      <div class="g-sel">Select what superbot can access</div>
      <div class="g-row fixed">${ms('account-circle', 'gi')}<span>Associate you with your personal info on Google</span></div>
      <div class="g-row pick"><img class="gi" src="brand/youtube-icon.svg" alt=""><span>See, edit, and permanently delete your YouTube videos, ratings, comments and captions. ${ms('info-outline', 'inf')}</span>
        <span class="cb">${ms('check-box-outline-blank', 'off')}${ms('check-box', 'on')}</span></div>
      <div class="g-trust">Make sure you trust superbot</div>
      <p class="g-small">You may be sharing sensitive info with this site or app. Learn about how superbot will handle your data by reviewing its <u>terms of service</u> and <u>privacy policies</u>. You can always see or remove access in your <u>Google Account</u>.</p>
      <div class="g-btns"><span class="g-cancel">Cancel</span><span class="g-cont">Continue</span></div>
    </div>
  </div>`);
  const q = (s) => el.querySelector(s);
  return { el, cbOff: q('.cb .off'), cbOn: q('.cb .on'), cb: q('.cb'), cont: q('.g-cont'), pick: q('.g-row.pick') };
}
