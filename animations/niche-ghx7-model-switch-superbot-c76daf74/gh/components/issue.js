// issuePage: kitebase/web#482 in GitHub's current (React) issue view: title + Open state label, body comment with
// the screenshot attachment slot, timeline events + comments with a "Load more" breaker, and the full metadata
// sidebar (Assignees, Labels, Type, Projects, Milestone, Relationships, Development, Participants).
// Slots: [data-slot=attachment] image, [data-slot=development][data-dev=none|linked].
import { appHeader } from './header.js';
import { oct, esc, av, labelTok, imgSlot, IMG_BASE } from './util.js';

const reactions = (list = []) => list.length
  ? `<div class="gh-reactions">${list.map(([e, n]) => `<span class="gh-reaction"><span class="emoji">${e}</span><span>${n}</span></span>`).join('')}<span class="gh-reaction gh-reaction--add">${oct('smiley')}</span></div>`
  : '';

function commentBox({ author, date, html, reactions: r, avatars, opened, badge }) {
  return `<div class="gh-icomment" data-comment="${esc(author)}">
  <div class="gh-icomment-hd">${av(author, 24, { avatars })}<span class="gh-icomment-who"><strong>${esc(author)}</strong> ${opened ? 'opened' : 'commented'} <a class="gh-muted-link">on ${esc(date)}</a></span><span class="gh-sp"></span>${badge ? `<span class="gh-role">${badge}</span>` : ''}<span class="gh-kebab">${oct('kebab-horizontal')}</span></div>
  <div class="gh-md">${html}${reactions(r)}</div>
</div>`;
}

export function issuePage(data) {
  const { issue: d, avatars, org, repo, repoCounts } = data;
  const attach = d.attachment ?? `${IMG_BASE}issue-attachment-session-expired.png`;
  const b = d.body;
  const bodyHtml = `<p>${b.intro}</p>
<h3>Steps to reproduce</h3><ol>${b.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
<p><strong>Expected:</strong> ${b.expected}<br><strong>Actual:</strong> ${b.actual}</p>
<p class="gh-attach" data-slot="attachment">${imgSlot(attach, { w: 640, h: 400, alt: d.attachmentAlt })}</p>
<p><strong>Environment:</strong> ${b.env}</p>`;

  const tl = d.timeline.map((t) => {
    if (t.kind === 'comment') return `<div class="gh-tl-gap"></div>${commentBox({ ...t, avatars })}`;
    if (t.kind === 'hidden') return `<div class="gh-tl-gap"></div><div class="gh-loadmore"><span class="gh-loadmore-btn">Load more</span><span class="gh-muted">${t.count} remaining items</span></div>`;
    const html = t.html.replace('<LABELS>', d.labels.map((l) => labelTok(l)).join(' ')).replace(/<a>/g, '<a class="gh-strong-link">');
    return `<div class="gh-tl-event"><span class="gh-tl-badge">${oct(t.icon)}</span>${av(t.actor, 20, { avatars })}<span><strong>${esc(t.actor)}</strong> ${html} <a class="gh-muted-link">on ${esc(t.date)}</a></span></div>`;
  }).join('');

  const side = `<aside class="gh-iside">
  <section><h4>Assignees ${oct('gear', 16, 'gh-side-gear')}</h4>${d.assignees.map((a) => `<div class="gh-side-person">${av(a, 20, { avatars })}<strong>${esc(a)}</strong></div>`).join('')}</section>
  <section><h4>Labels ${oct('gear', 16, 'gh-side-gear')}</h4><div class="gh-side-labels">${d.labels.map((l) => labelTok(l)).join('')}</div></section>
  <section><h4>Type ${oct('gear', 16, 'gh-side-gear')}</h4><div class="gh-side-type"><span class="gh-type-dot"></span>Bug</div></section>
  <section><h4>Projects ${oct('gear', 16, 'gh-side-gear')}</h4><div class="gh-side-project">${oct('table')}<strong>${esc(d.project.name)}</strong></div><div class="gh-side-field"><span>Status</span><span class="gh-status-pill" data-slot="project-status"><span class="gh-status-dot is-yellow"></span>${esc(d.project.status)}</span></div></section>
  <section><h4>Milestone ${oct('gear', 16, 'gh-side-gear')}</h4><div class="gh-progress"><span style="width:${d.milestoneProgress}%"></span></div><div class="gh-side-ms"><strong>${esc(d.milestone)}</strong><span class="gh-muted">${esc(d.milestoneDue)}</span></div></section>
  <section><h4>Relationships ${oct('gear', 16, 'gh-side-gear')}</h4><div class="gh-muted">None yet</div></section>
  <section><h4>Development ${oct('gear', 16, 'gh-side-gear')}</h4><div data-slot="development" data-dev="${d.development}">
    <div class="gh-dev-none gh-muted">No branches or pull requests</div>
    <div class="gh-dev-linked"><div class="gh-dev-row">${oct('git-pull-request', 16, 'gh-c-open')}<span><strong>Fix random logouts: refresh the session before it expires</strong> <span class="gh-muted">${esc(org)}/${esc(repo)}#483</span></span></div></div>
  </div></section>
  <section><h4>Participants</h4><div class="gh-side-avs">${d.participants.map((p) => av(p, 26, { avatars })).join('')}</div></section>
  <section class="gh-side-actions"><div>${oct('bell-slash')}<span>Unsubscribe</span></div><div>${oct('pin')}<span>Pin issue</span></div><div>${oct('lock')}<span>Lock conversation</span></div></section>
</aside>`;

  return `${appHeader({ user: data.user, crumbs: [org, repo], tab: 'issues', counts: { issues: repoCounts.issues, pulls: repoCounts.pulls }, avatars })}
<main class="gh-issue">
  <div class="gh-ihead">
    <h1 class="gh-ititle"><bdi>${esc(d.title)}</bdi> <span class="gh-num">#${d.number}</span></h1>
    <div class="gh-ihead-actions"><span class="gh-btn">Edit</span><span class="gh-btn gh-btn--primary">New issue</span><span class="gh-iconbtn gh-iconbtn--plain">${oct('copy')}</span></div>
  </div>
  <div class="gh-imeta"><span class="gh-state gh-state--open">${oct('issue-opened')}Open</span><span class="gh-muted"><strong class="gh-fg">${esc(d.author)}</strong> opened on ${esc(d.opened)} · ${d.comments} comments</span></div>
  <div class="gh-ilayout">
    <div class="gh-itimeline">
      ${commentBox({ author: d.author, date: d.opened, html: bodyHtml, reactions: [['👍', 31], ['😕', 4], ['👀', 3]], avatars, opened: true })}
      ${tl}
    </div>
    ${side}
  </div>
</main>`;
}
