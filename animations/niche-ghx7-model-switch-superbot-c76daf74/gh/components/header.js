// appHeader: GitHub's logged-in AppHeader (light). Global bar (menu, mark, context crumbs, search, Copilot, create,
// issues, PRs, inbox, avatar) + optional repo local bar (UnderlineNav with counters). [data-slot=inbox-dot] is the
// unread dot on the inbox button.
import { oct, esc, av, counter } from './util.js';

const REPO_TABS = [
  ['code', 'Code', 'code'],
  ['issues', 'Issues', 'issue-opened'],
  ['pulls', 'Pull requests', 'git-pull-request'],
  ['actions', 'Actions', 'play'],
  ['projects', 'Projects', 'table'],
  ['wiki', 'Wiki', 'book'],
  ['security', 'Security', 'shield'],
  ['insights', 'Insights', 'graph'],
  ['settings', 'Settings', 'gear'],
];
const PLAY = '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M1.5 8a6.5 6.5 0 1 0 13 0a6.5 6.5 0 0 0-13 0m4.879-2.773l4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215"/></svg>';
const ico = (n) => (n === 'play' ? PLAY : oct(n));

export function appHeader({ user = 'mirachen', crumbs = [], tab = null, counts = {}, unread = true, avatars = {}, localBar = true, context = null } = {}) {
  const crumbHtml = context
    ? `<span class="gh-crumb is-last">${esc(context)}</span>`
    : crumbs.map((c, i) => `${i ? '<span class="gh-crumb-sep">/</span>' : ''}<span class="gh-crumb${i === crumbs.length - 1 ? ' is-last' : ''}">${esc(c)}</span>`).join('');
  const tabs = localBar && tab
    ? `<nav class="gh-localbar"><ul>${REPO_TABS.map(([id, label, icon]) => {
        const c = counts[id];
        return `<li class="gh-unav-item${id === tab ? ' is-selected' : ''}" data-tab="${id}">${ico(icon)}<span>${label}</span>${c ? counter(c) : ''}</li>`;
      }).join('')}</ul></nav>`
    : '';
  return `<header class="gh-appheader${tabs ? '' : ' no-local'}">
  <div class="gh-globalbar">
    <div class="gh-gb-start">
      <span class="gh-iconbtn">${oct('three-bars')}</span>
      <span class="gh-mark">${oct('mark-github', 32)}</span>
      <span class="gh-crumbs">${crumbHtml}</span>
    </div>
    <div class="gh-gb-end">
      <span class="gh-search">${oct('search')}<span>Type <kbd>/</kbd> to search</span></span>
      <span class="gh-btngroup"><span class="gh-iconbtn">${oct('copilot')}</span><span class="gh-iconbtn gh-iconbtn--caret">${oct('triangle-down')}</span></span>
      <span class="gh-divider"></span>
      <span class="gh-iconbtn gh-iconbtn--wide">${oct('plus')}${oct('triangle-down')}</span>
      <span class="gh-iconbtn">${oct('issue-opened')}</span>
      <span class="gh-iconbtn">${oct('git-pull-request')}</span>
      <span class="gh-iconbtn gh-inboxbtn">${oct('inbox')}<span class="gh-inbox-dot" data-slot="inbox-dot"${unread ? '' : ' hidden'}></span></span>
      ${av(user, 32, { avatars })}
    </div>
  </div>
  ${tabs}
</header>`;
}
