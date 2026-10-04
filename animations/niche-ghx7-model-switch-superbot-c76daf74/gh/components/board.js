// projectBoard: org Projects (v2) board "Kitebase Web" (github.com/orgs/kitebase/projects/3) with view tabs,
// filter bar and four status columns. The hero card kitebase/web#482 renders in data.board.heroColumn
// ('in_progress' | 'in_review'); with heroColumn 'in_review' it carries the linked PR #483 row.
// Hooks: .gh-pcol[data-col] > .gh-pcol-items, column counts [data-count=col-<id>], hero card [data-card=482].
// The motion agent can move the card by transform between the two rendered positions (render both states and
// read each card's offsetTop/offsetLeft), or re-render with the other heroColumn.
import { appHeader } from './header.js';
import { oct, esc, av, labelTok } from './util.js';

const TYPE = {
  issue: ['issue-opened', 'gh-c-open'],
  'issue-closed': ['issue-closed', 'gh-c-done'],
  pr: ['git-pull-request', 'gh-c-open'],
  'pr-merged': ['git-merge', 'gh-c-done'],
  draft: ['issue-draft', 'gh-c-muted'],
};
const DRAFT = '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M14.307 11.655a.75.75 0 0 1 .165 1.048a8 8 0 0 1-1.769 1.77a.75.75 0 0 1-.883-1.214a6.6 6.6 0 0 0 1.44-1.439a.75.75 0 0 1 1.047-.165m-2.652-9.962a.75.75 0 0 1 1.048-.165a8 8 0 0 1 1.77 1.769a.75.75 0 0 1-1.214.883a6.6 6.6 0 0 0-1.439-1.44a.75.75 0 0 1-.165-1.047M6.749.097a8 8 0 0 1 2.502 0a.75.75 0 1 1-.233 1.482a6.6 6.6 0 0 0-2.036 0A.751.751 0 0 1 6.749.097M.955 6.125a.75.75 0 0 1 .624.857a6.6 6.6 0 0 0 0 2.036a.75.75 0 1 1-1.482.233a8 8 0 0 1 0-2.502a.75.75 0 0 1 .858-.624m14.09 0a.75.75 0 0 1 .858.624a8 8 0 0 1 0 2.502a.75.75 0 1 1-1.482-.233a6.6 6.6 0 0 0 0-2.036a.75.75 0 0 1 .624-.857m-8.92 8.92a.75.75 0 0 1 .857-.624a6.6 6.6 0 0 0 2.036 0a.75.75 0 1 1 .233 1.482a8 8 0 0 1-2.502 0a.75.75 0 0 1-.624-.858m-4.432-3.39a.75.75 0 0 1 1.048.165a6.6 6.6 0 0 0 1.439 1.44a.751.751 0 0 1-.883 1.212a8 8 0 0 1-1.77-1.769a.75.75 0 0 1 .166-1.048m2.652-9.962A.75.75 0 0 1 4.18 2.74a6.6 6.6 0 0 0-1.44 1.44a.751.751 0 0 1-1.212-.883a8 8 0 0 1 1.769-1.77a.75.75 0 0 1 1.048.166"/></svg>';

function card(c, data, hero) {
  const [icon, col] = TYPE[c.type] || TYPE.issue;
  const ic = c.type === 'draft' ? `<span class="gh-c-muted">${DRAFT}</span>` : `<span class="${col}">${oct(icon)}</span>`;
  const who = c.who === 'dependabot' ? `<span class="gh-av gh-av--sq gh-av--dep" style="--s:20px">${oct('dependabot', 14)}</span>` : c.who ? av(c.who, 20, { avatars: data.avatars }) : '';
  const linked = hero && data.board.heroColumn === 'in_review'
    ? `<div class="gh-pcard-linked" data-slot="linked-pr">${oct('git-pull-request', 16, 'gh-c-open')}<span>web #483</span></div>` : '';
  return `<div class="gh-pcard${hero ? ' is-hero' : ''}"${c.num ? ` data-card="${c.num}"` : ''}>
  <div class="gh-pcard-top">${ic}<span class="gh-pcard-ref">${c.type === 'draft' ? 'Draft' : `web #${c.num}`}</span><span class="gh-sp"></span>${who}</div>
  <div class="gh-pcard-title">${esc(c.title)}</div>
  ${c.labels.length ? `<div class="gh-pcard-labels">${c.labels.map((l) => labelTok(l)).join('')}</div>` : ''}
  ${linked}
</div>`;
}

export function projectBoard(data) {
  const b = data.board;
  const cards = b.cards.map((c) => (c.num === b.hero ? { ...c, col: b.heroColumn } : c));
  const cols = b.columns.map((col) => {
    const mine = cards.filter((c) => c.col === col.id);
    const ordered = col.id === b.heroColumn ? [...mine.filter((c) => c.num === b.hero), ...mine.filter((c) => c.num !== b.hero)] : mine;
    return `<section class="gh-pcol" data-col="${col.id}">
    <div class="gh-pcol-hd"><span class="gh-pcol-dot is-${col.color}"></span><strong>${esc(col.name)}</strong><span class="gh-counter" data-count="col-${col.id}">${mine.length}</span><span class="gh-sp"></span>${oct('kebab-horizontal', 16, 'gh-c-muted')}</div>
    <div class="gh-pcol-desc">${esc(col.desc)}</div>
    <div class="gh-pcol-items">${ordered.map((c) => card(c, data, c.num === b.hero)).join('')}</div>
    <div class="gh-pcol-add">${oct('plus')}<span>Add item</span></div>
  </section>`;
  }).join('');
  return `${appHeader({ user: data.user, crumbs: [data.org], localBar: false, avatars: data.avatars })}
<main class="gh-proj">
  <div class="gh-proj-hd"><h1>${oct('table', 16, 'gh-c-muted')}${esc(b.title)}</h1><span class="gh-sp"></span><span class="gh-btn gh-btn--sm">${oct('graph')}<span>Insights</span></span><span class="gh-iconbtn">${oct('sidebar-expand')}</span><span class="gh-iconbtn">${oct('kebab-horizontal')}</span></div>
  <div class="gh-proj-views"><span class="gh-pview is-selected">${oct('project')}<span>Board</span>${oct('triangle-down', 16, 'gh-c-muted')}</span><span class="gh-pview">${oct('table')}<span>Backlog</span></span><span class="gh-pview">${oct('project-roadmap')}<span>Roadmap</span></span><span class="gh-pview">${oct('person')}<span>My items</span></span><span class="gh-pview gh-pview--new">${oct('plus')}<span>New view</span></span></div>
  <div class="gh-proj-filter"><span class="gh-input gh-proj-q">${oct('filter')}<span class="gh-muted">Filter by keyword or by field</span></span><span class="gh-btn gh-btn--sm">${oct('gear')}<span>View</span></span></div>
  <div class="gh-pboard">${cols}</div>
</main>`;
}
