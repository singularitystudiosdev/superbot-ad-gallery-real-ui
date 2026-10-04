/* ghx7 GitHub screens: layered, data-driven HTML/CSS components (GitHub LIGHT, Primer tokens), 1920x1080 stage.
   Load gh/gh.css once, then import from here. Every builder is a pure function html(data) -> string; mount(el, data)
   writes it into an element and returns the element. No timers, no rAF, no CSS transitions or animations: all motion
   belongs to the motion agent, which drives the attributes / custom properties below.

   SCREENS (bible storyboard)          builder               screen(name, data, frameOpts)
     A notifications inbox             notificationsInbox    'inbox'
     C issue #482                      issuePage             'issue'
     E PR #483 Files changed           prFiles               'files'
     F PR #483 Checks + Actions graph  prChecks              'checks'
     G PR #483 Conversation            prConversation        'conversation'
     H Projects board Kitebase Web     projectBoard          'board'
   screen() wraps the page in browserFrame({ url, title, width=1760, height=960, pageWidth=1440 }) and merges `data`
   over STORY (data.js). The frame is a fixed box: place it on the stage with a margin (never full-bleed).

   STATE CONTRACT
   Frame / camera
     .ghf-page                style --scroll: <unitless number> scrolls the page by that many page px
                              (translateY(-scroll), applied inside the frame scale); camera moves are transforms
                              applied by the caller on .ghf.
   Status icons (everywhere a job/check has a state)
     [data-state=queued|in_progress|success|failure|skipped] on the owner element; its .gh-ststack shows only the
     matching octicon (queued dot-fill amber, in_progress amber ring spinner, success check-circle-fill green,
     failure x-circle-fill red, skipped skip grey). Spinner rotation: set --spin: <deg> on any ancestor
     (.gh-spinner is rotate(var(--spin))). Same for [data-run-state=...] containers.
   Checks / Actions graph (screen F)
     .gh-node[data-job=lint|typecheck|unit|e2e|build][data-state=...]   graph job node
     .gh-node .gh-node-dur[data-slot=duration]   duration text; hidden while queued; set textContent while running
     g.gh-edge[data-from][data-to] style --fill: 0..1   edge drawn in --gh-edge-fill (green) over the grey base
     .gh-ck-job[data-job][data-state] .gh-ck-dur[data-slot=duration]   the same jobs in the checks sidebar
     [data-run-state=queued|in_progress|success|failure]   .gh-ckhead (commit row icon), .gh-ck-wf (workflow row),
                              .gh-runsum (Status text slot [data-slot=run-status] shows the matching word)
     [data-slot=run-duration], [data-count=artifacts], [data-count=tests]   text slots
   Conversation (screen G)
     [data-slot=mergebox][data-checks-state=in_progress|success|failure]   merge box title/subtitle/icon follow it
     .gh-mcheck[data-job][data-state]   check rows inside the merge box; [data-count=checks-ok|checks-pending]
     [data-tl=body|commit|linked|linked-issue|review-req|bot]   timeline items (reveal by opacity/transform)
     [data-slot=pr-state]   Open state label
   Issue (screen C)
     [data-slot=attachment] image slot (data.issue.attachment URL, default <AD>/img/issue-attachment-session-expired.png)
     [data-slot=development][data-dev=none|linked]   sidebar Development: empty text or linked PR #483
     [data-comment=<login>]   comment boxes; [data-slot=project-status] project Status pill
   Files changed (screen E)
     .gh-file[data-file=<path>][data-viewed=0|1]   Viewed checkbox state; [data-count=viewed] "n / 3 viewed"
     table[data-slot=diff-lines] tr.gh-dl[data-ln=<i>]   diff rows, reveal line by line
   Inbox (screen A)
     li.gh-nrow[data-row=<id>][data-unread=0|1][data-hl=0|1]   hero row id 'web-482'; hl = highlight ring
     [data-slot=inbox-dot]   unread dot on the header inbox button
   Board (screen H)
     .gh-pcol[data-col=todo|in_progress|in_review|done] > .gh-pcol-items   columns
     [data-count=col-<id>]   column counters; .gh-pcard[data-card=482].is-hero   the moving card
     data.board.heroColumn 'in_progress' | 'in_review' (in_review adds [data-slot=linked-pr] "web #483")
   Avatars: span.gh-av[data-avatar=<login>] background = data.avatars[login] || <AD>/img/avatar-<login>.png,
     neutral grey when the file is missing; superbot-gg[bot] uses the static superbot mark.
   Text rule: no em/en dash characters in any rendered string. */
import { STORY, merge } from './data.js';
import { browserFrame } from './frame.js';
import { appHeader } from './header.js';
import { issuePage } from './issue.js';
import { prHeader, prConversation, prFiles, prChecks } from './pr.js';
import { workflowGraph } from './graph.js';
import { notificationsInbox } from './inbox.js';
import { projectBoard } from './board.js';
export * from './util.js';
export { STORY, merge, browserFrame, appHeader, issuePage, prHeader, prConversation, prFiles, prChecks, workflowGraph, notificationsInbox, projectBoard };

const ORG = (d) => `${d.org}/${d.repo}`;
export const SCREENS = {
  inbox: { build: notificationsInbox, url: () => 'github.com/notifications', title: () => 'Notifications' },
  issue: { build: issuePage, url: (d) => `github.com/${ORG(d)}/issues/${d.issue.number}`, title: (d) => `${d.issue.title} · Issue #${d.issue.number} · ${ORG(d)}` },
  files: { build: prFiles, url: (d) => `github.com/${ORG(d)}/pull/${d.pr.number}/files`, title: (d) => `${d.pr.title} by ${d.pr.author} · Pull Request #${d.pr.number} · ${ORG(d)}` },
  checks: { build: prChecks, url: (d) => `github.com/${ORG(d)}/pull/${d.pr.number}/checks`, title: (d) => `${d.pr.title} by ${d.pr.author} · Pull Request #${d.pr.number} · ${ORG(d)}` },
  conversation: { build: prConversation, url: (d) => `github.com/${ORG(d)}/pull/${d.pr.number}`, title: (d) => `${d.pr.title} by ${d.pr.author} · Pull Request #${d.pr.number} · ${ORG(d)}` },
  board: { build: projectBoard, url: (d) => `github.com/orgs/${d.org}/projects/3/views/1`, title: (d) => `${d.board.title} · Kitebase` },
};

// screen(name, dataOverride, frameOpts) -> full framed HTML string for one storyboard screen.
export function screen(name, data = {}, frameOpts = {}) {
  const s = SCREENS[name];
  if (!s) throw new Error(`unknown screen ${name}`);
  const d = merge(STORY, data);
  return browserFrame({ url: s.url(d), title: s.title(d), screen: name, ...frameOpts, content: s.build(d) });
}
export function mount(el, name, data = {}, frameOpts = {}) {
  el.innerHTML = screen(name, data, frameOpts);
  return el.firstElementChild;
}
