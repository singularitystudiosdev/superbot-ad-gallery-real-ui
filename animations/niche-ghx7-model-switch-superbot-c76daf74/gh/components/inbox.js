// notificationsInbox: github.com/notifications (logged in as mirachen). Left nav (Inbox / Saved / Done, Filters,
// Repositories), search bar with "Group by", list box grouped by date. Rows: [data-row=<id>][data-unread=1|0]
// [data-hl=0|1] (hl = the motion agent's highlight on the hero row kitebase/web#482).
import { appHeader } from './header.js';
import { oct, esc, av, counter } from './util.js';

const TYPE_ICON = {
  issue: ['issue-opened', 'gh-c-open'],
  'issue-closed': ['issue-closed', 'gh-c-done'],
  pr: ['git-pull-request', 'gh-c-open'],
  'pr-merged': ['git-merge', 'gh-c-done'],
  release: ['tag', 'gh-c-muted'],
  ci: ['x-circle-fill', 'gh-c-fail'],
};

function row(r, avatars) {
  const [icon, col] = TYPE_ICON[r.type] || TYPE_ICON.issue;
  const who = r.who.slice(0, 3).map((w) => w === 'dependabot' ? `<span class="gh-av gh-av--sq gh-av--dep" style="--s:20px">${oct('dependabot', 14)}</span>` : av(w, 20, { avatars })).join('');
  return `<li class="gh-nrow" data-row="${esc(r.id)}" data-unread="${r.unread ? 1 : 0}" data-hl="0">
  <span class="gh-nrow-dot"></span><span class="gh-cb"></span>
  <span class="gh-nrow-ic ${col}">${oct(icon)}</span>
  <span class="gh-nrow-main"><span class="gh-nrow-repo">${esc(r.repo)}${r.num ? ` <span>#${r.num}</span>` : ''}</span><span class="gh-nrow-title">${esc(r.title)}</span><span class="gh-nrow-sub">${esc(r.sub)}</span></span>
  <span class="gh-nrow-reason">${esc(r.reason)}</span>
  <span class="gh-nrow-who">${who}</span>
  <span class="gh-nrow-time">${esc(r.time)}</span>
  <span class="gh-nrow-acts">${oct('check')}${oct('bookmark')}${oct('bell-slash')}</span>
</li>`;
}

export function notificationsInbox(data) {
  const { inbox, avatars } = data;
  const today = inbox.rows.filter((r) => !/yesterday|Sep/.test(r.time));
  const older = inbox.rows.filter((r) => /yesterday|Sep/.test(r.time));
  return `${appHeader({ user: data.user, context: 'Notifications', localBar: false, unread: true, avatars })}
<main class="gh-notif">
  <aside class="gh-nside">
    <ul class="gh-nnav">
      <li class="is-selected">${oct('inbox')}<span>Inbox</span>${counter(inbox.unread)}</li>
      <li>${oct('bookmark')}<span>Saved</span></li>
      <li>${oct('check')}<span>Done</span></li>
    </ul>
    <h4>Filters</h4>
    <ul class="gh-nnav">
      <li>${oct('person')}<span>Assigned</span></li>
      <li>${oct('comment-discussion')}<span>Participating</span></li>
      <li>${oct('mention')}<span>Mentioned</span></li>
      <li>${oct('people')}<span>Team mentioned</span></li>
      <li>${oct('eye')}<span>Review requested</span></li>
    </ul>
    <h4>Repositories</h4>
    <ul class="gh-nnav gh-nnav--repos">${inbox.repos.map(([n, c]) => `<li><span class="gh-av gh-av--sq gh-av--org" style="--s:16px;--src:url('${new URL('../../img/avatar-kitebase.png', import.meta.url).href}')"></span><span>${esc(n)}</span>${counter(c)}</li>`).join('')}</ul>
    <div class="gh-nside-manage">${oct('gear')}<span>Manage notifications</span>${oct('triangle-down')}</div>
  </aside>
  <section class="gh-nmain">
    <div class="gh-nbar"><span class="gh-input gh-nsearch">${oct('search')}<span class="gh-q"><span class="gh-q-k">is:</span>inbox</span></span><span class="gh-btn">Group by: <strong>Date</strong>${oct('triangle-down')}</span></div>
    <div class="gh-nbox">
      <div class="gh-nbox-hd"><span class="gh-cb"></span><span>Select all</span><span class="gh-sp"></span><span class="gh-muted gh-small">1-${inbox.rows.length} of ${inbox.rows.length}</span><span class="gh-pager">${oct('chevron-left')}${oct('chevron-right')}</span></div>
      <div class="gh-ngroup">Today</div>
      <ul>${today.map((r) => row(r, avatars)).join('')}</ul>
      <div class="gh-ngroup">Older</div>
      <ul>${older.map((r) => row(r, avatars)).join('')}</ul>
    </div>
  </section>
</main>`;
}
