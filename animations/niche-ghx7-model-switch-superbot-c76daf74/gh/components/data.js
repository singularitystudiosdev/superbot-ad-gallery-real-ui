// Story data for the ghx7 GitHub screens (bible .tmp/ghx7-c76daf74/bible.c76daf74.txt, STORY). Every component takes
// a data object; pass a partial override and it is merged over these defaults by the screen builders in index.js.
// No em/en dashes in any string (bible X policy).
export const STORY = {
  user: 'mirachen',
  userName: 'Mira Chen',
  org: 'kitebase',
  repo: 'web',
  repoCounts: { issues: 41, pulls: 7, security: 0 },
  avatars: {}, // login -> URL override; default is <AD>/img/avatar-<login>.png

  issue: {
    number: 482,
    title: 'Users get logged out after 15 minutes even with Remember me checked',
    author: 'jonah-reyes',
    authorName: 'Jonah Reyes',
    opened: 'Sep 30',
    comments: 23,
    labels: ['bug', 'auth', 'priority: high'],
    milestone: 'v2.14',
    milestoneDue: 'Due by October 17, 2026',
    milestoneProgress: 64,
    assignees: ['mirachen'],
    project: { name: 'Kitebase Web', status: 'In progress' },
    attachment: null, // URL; default <AD>/img/issue-attachment-session-expired.png
    attachmentAlt: 'Screenshot 2026-09-30 at 10.42.17',
    participants: ['jonah-reyes', 'mirachen', 'priya-natarajan', 'tomasz-kowal', 'lea-fontaine', 'kenji-mori'],
    body: {
      intro: 'After the 2.13 release we get signed out roughly every 15 minutes, even when <strong>Remember me</strong> is checked at login.',
      steps: [
        'Sign in at <code>/login</code> with <strong>Remember me</strong> checked',
        'Keep two tabs of the app open',
        'Leave them idle for about 15 minutes, then click anything',
      ],
      expected: 'Stay signed in for 30 days.',
      actual: 'Redirect to <code>/login?reason=session_expired</code> and the draft you were editing is gone.',
      env: 'Chrome 141 and Firefox 143 on macOS, kitebase.app production.',
    },
    timeline: [
      { kind: 'event', icon: 'tag', actor: 'mirachen', html: 'added <LABELS> labels', date: 'Sep 30' },
      { kind: 'event', icon: 'milestone', actor: 'mirachen', html: 'added this to the <a>v2.14</a> milestone', date: 'Sep 30' },
      { kind: 'comment', author: 'priya-natarajan', date: 'Oct 1', html: '<p>Same here on Chrome with two tabs open.</p>', reactions: [['👍', 9], ['👀', 2]] },
      { kind: 'comment', author: 'tomasz-kowal', date: 'Oct 1', html: '<p>Happens every ~15 min, even with Remember me. The refresh request in the network tab shows a <code>401</code> right before the redirect.</p>', reactions: [['👍', 6]] },
      { kind: 'hidden', count: 18 },
      { kind: 'event', icon: 'person', actor: 'mirachen', html: 'self-assigned this', date: 'Oct 2' },
      { kind: 'comment', author: 'lea-fontaine', date: 'Oct 3', html: '<p>Still happening on 2.13.2. Support has 40+ tickets about it this week.</p>', reactions: [['👍', 4]] },
    ],
    development: 'none', // 'none' | 'linked' (shows fix/482-session-refresh + PR #483)
  },

  pr: {
    number: 483,
    title: 'Fix random logouts: refresh the session before it expires',
    author: 'mirachen',
    base: 'main',
    head: 'fix/482-session-refresh',
    commits: 1,
    conversation: 2,
    checks: 5,
    files: 3,
    add: 24,
    del: 6,
    opened: 'Oct 3',
    body: 'Closes #482. Refreshes the session 60 s before it expires and shares one refresh across open tabs. Adds a Remember me test that runs past 15 minutes.',
    commit: { msg: 'Refresh the session before it expires, one refresh across tabs', sha: '7f3c2a1', author: 'mirachen' },
    botComment: 'Raced 3 patches against the failing Remember me test. Kept the one that passes (Claude Opus 5.5). 214 tests pass.',
    reviewers: [['priya-natarajan', 'pending'], ['tomasz-kowal', 'pending']],
    labels: ['bug', 'auth'],
  },

  ci: {
    workflow: 'CI',
    file: 'ci.yml',
    event: 'pull_request',
    run: 1287,
    total: '2m 41s',
    artifacts: 2,
    // graph columns: [[lint, typecheck], [unit, e2e], [build]]
    jobs: [
      { id: 'lint', name: 'lint', col: 0, row: 0, dur: '14s', needs: [] },
      { id: 'typecheck', name: 'typecheck', col: 0, row: 1, dur: '31s', needs: [] },
      { id: 'unit', name: 'unit', col: 1, row: 0, dur: '48s', needs: ['lint', 'typecheck'], note: '214 tests passed' },
      { id: 'e2e', name: 'e2e', col: 1, row: 1, dur: '1m 22s', needs: ['lint', 'typecheck'], note: 'login > Remember me survives 16 minutes' },
      { id: 'build', name: 'build', col: 2, row: 0, dur: '37s', needs: ['unit', 'e2e'] },
    ],
  },

  board: {
    title: 'Kitebase Web',
    columns: [
      { id: 'todo', name: 'Todo', color: 'gray', desc: 'This item has not been started' },
      { id: 'in_progress', name: 'In progress', color: 'yellow', desc: 'This is actively being worked on' },
      { id: 'in_review', name: 'In review', color: 'purple', desc: 'A pull request is open for this item' },
      { id: 'done', name: 'Done', color: 'green', desc: 'This has been completed' },
    ],
    hero: 482,
    heroColumn: 'in_progress', // 'in_progress' | 'in_review'
    cards: [
      { col: 'todo', type: 'issue', num: 497, title: 'Password reset email links expire too early on Safari', labels: ['bug', 'auth'], who: 'kenji-mori' },
      { col: 'todo', type: 'issue', num: 491, title: 'Add keyboard shortcut for switching workspaces', labels: ['enhancement'], who: 'lea-fontaine' },
      { col: 'todo', type: 'issue', num: 476, title: 'Settings page: avatar upload fails above 5 MB', labels: ['bug', 'frontend'], who: null },
      { col: 'todo', type: 'draft', num: null, title: 'Audit cookie flags before the v2.14 cut', labels: [], who: 'mirachen' },
      { col: 'in_progress', type: 'issue', num: 482, title: 'Users get logged out after 15 minutes even with Remember me checked', labels: ['bug', 'auth', 'priority: high'], who: 'mirachen' },
      { col: 'in_progress', type: 'issue', num: 488, title: 'Billing page shows the wrong currency for EU workspaces', labels: ['bug'], who: 'priya-natarajan' },
      { col: 'in_progress', type: 'issue', num: 469, title: 'Migrate date pickers to the new design system component', labels: ['frontend'], who: 'lea-fontaine' },
      { col: 'in_review', type: 'pr', num: 486, title: 'Bump vitest from 3.2.4 to 3.3.0', labels: ['dependencies'], who: 'dependabot' },
      { col: 'in_review', type: 'pr', num: 479, title: 'Lazy-load the analytics dashboard charts', labels: ['frontend'], who: 'tomasz-kowal' },
      { col: 'done', type: 'issue-closed', num: 471, title: 'Invite emails render without the workspace name', labels: ['bug'], who: 'kenji-mori' },
      { col: 'done', type: 'issue-closed', num: 465, title: 'Add SSO login button to the sign-in page', labels: ['auth', 'enhancement'], who: 'mirachen' },
      { col: 'done', type: 'pr-merged', num: 474, title: 'Speed up the projects list query', labels: [], who: 'tomasz-kowal' },
    ],
  },

  inbox: {
    unread: 6,
    rows: [
      { id: 'web-482', repo: 'kitebase/web', num: 482, type: 'issue', title: 'Users get logged out after 15 minutes even with Remember me checked', sub: '23 new comments', reason: 'author', time: '3m', unread: true, who: ['lea-fontaine', 'tomasz-kowal', 'priya-natarajan'], hero: true },
      { id: 'web-486', repo: 'kitebase/web', num: 486, type: 'pr', title: 'Bump vitest from 3.2.4 to 3.3.0', sub: 'dependabot opened this pull request', reason: 'review requested', time: '1h', unread: true, who: ['dependabot'] },
      { id: 'web-479', repo: 'kitebase/web', num: 479, type: 'pr', title: 'Lazy-load the analytics dashboard charts', sub: 'tomasz-kowal requested your review', reason: 'review requested', time: '2h', unread: true, who: ['tomasz-kowal'] },
      { id: 'api-1204', repo: 'kitebase/api', num: 1204, type: 'issue', title: 'Token refresh endpoint returns 401 for sessions older than 15 minutes', sub: '@mirachen can you take a look? Looks related to the web logouts.', reason: 'mention', time: '4h', unread: true, who: ['kenji-mori'] },
      { id: 'ds-rel', repo: 'kitebase/design-system', num: null, type: 'release', title: 'v4.8.0', sub: 'lea-fontaine published a release', reason: 'subscribed', time: '6h', unread: true, who: ['lea-fontaine'] },
      { id: 'web-488', repo: 'kitebase/web', num: 488, type: 'issue', title: 'Billing page shows the wrong currency for EU workspaces', sub: 'priya-natarajan commented', reason: 'assign', time: '8h', unread: true, who: ['priya-natarajan'] },
      { id: 'web-ci', repo: 'kitebase/web', num: null, type: 'ci', title: 'CI workflow run failed for main branch', sub: 'CI #1281: e2e failed', reason: 'ci activity', time: 'yesterday', unread: false, who: [] },
      { id: 'api-1199', repo: 'kitebase/api', num: 1199, type: 'pr-merged', title: 'Rate limit login attempts per IP', sub: 'kenji-mori merged this pull request', reason: 'subscribed', time: 'yesterday', unread: false, who: ['kenji-mori'] },
      { id: 'web-476', repo: 'kitebase/web', num: 476, type: 'issue', title: 'Settings page: avatar upload fails above 5 MB', sub: 'jonah-reyes commented', reason: 'subscribed', time: 'Sep 30', unread: false, who: ['jonah-reyes'] },
      { id: 'web-469', repo: 'kitebase/web', num: 469, type: 'issue', title: 'Migrate date pickers to the new design system component', sub: 'lea-fontaine commented', reason: 'participating', time: 'Sep 29', unread: false, who: ['lea-fontaine'] },
    ],
    repos: [['kitebase/web', 4], ['kitebase/api', 1], ['kitebase/design-system', 1]],
  },

  files: [
    {
      path: 'src/auth/session.ts', add: 8, del: 3, viewed: false,
      hunks: [
        { header: '@@ -74,21 +74,27 @@ export function startSession(token: SessionToken, opts: SessionOptions) {', lines: [
          [' ', 74, 74, '  const store = opts.remember ? persistentStore : memoryStore;'],
          [' ', 75, 75, '  store.write(token);'],
          [' ', 76, 76, ''],
          ['+', null, 77, '  // Refresh 60 s before expiry so the token is never used after it expires.'],
          ['+', null, 78, '  const REFRESH_EARLY_MS = 60_000;'],
          ['+', null, 79, ''],
          [' ', 77, 80, '  function schedule(t: SessionToken) {'],
          [' ', 78, 81, '    clearTimeout(timer);'],
          ['-', 79, null, '    const delay = t.expiresAt - Date.now();'],
          ['+', null, 82, '    const delay = Math.max(0, t.expiresAt - Date.now() - REFRESH_EARLY_MS);'],
          [' ', 80, 83, '    timer = setTimeout(async () => {'],
          ['-', 81, null, '      const next = await refreshToken(t);'],
          ['+', null, 84, '      const next = await refreshOnce(t);'],
          [' ', 82, 85, '      if (!next) return endSession("expired");'],
          [' ', 83, 86, '      store.write(next);'],
          [' ', 84, 87, '      schedule(next);'],
          [' ', 85, 88, '    }, delay);'],
          [' ', 86, 89, '  }'],
          [' ', 87, 90, ''],
          ['-', 88, null, '  if (token.expiresAt > Date.now()) schedule(token);'],
          ['+', null, 91, '  if (token.expiresAt - REFRESH_EARLY_MS > Date.now()) schedule(token);'],
          ['+', null, 92, '  else void refreshOnce(token).then((t) => t && schedule(t));'],
          ['+', null, 93, '  onSessionMessage((t) => schedule(t));'],
          [' ', 89, 94, '  return () => clearTimeout(timer);'],
          [' ', 90, 95, '}'],
        ] },
      ],
    },
    {
      path: 'src/auth/refresh.ts', add: 10, del: 2, viewed: false,
      hunks: [
        { header: '@@ -36,12 +36,21 @@ import { api } from "../api/client";', lines: [
          [' ', 36, 36, 'const channel = new BroadcastChannel("kitebase-session");'],
          [' ', 37, 37, ''],
          ['-', 38, null, 'export async function refreshToken(t: SessionToken) {'],
          ['-', 39, null, '  return api.post<SessionToken>("/auth/refresh", { token: t.refresh });'],
          ['+', null, 38, 'let inflight: Promise<SessionToken | null> | null = null;'],
          ['+', null, 39, ''],
          ['+', null, 40, '// One refresh across all open tabs: the first tab takes the lock, the others wait for it.'],
          ['+', null, 41, 'export function refreshOnce(t: SessionToken) {'],
          ['+', null, 42, '  inflight ??= navigator.locks.request("session-refresh", async () => {'],
          ['+', null, 43, '    const next = await api.post<SessionToken>("/auth/refresh", { token: t.refresh });'],
          ['+', null, 44, '    channel.postMessage(next);'],
          ['+', null, 45, '    return next;'],
          ['+', null, 46, '  }).finally(() => (inflight = null));'],
          ['+', null, 47, '  return inflight;'],
          [' ', 40, 48, '}'],
          [' ', 41, 49, ''],
          [' ', 42, 50, 'export function onSessionMessage(cb: (t: SessionToken) => void) {'],
        ] },
      ],
    },
    { path: 'src/auth/session.test.ts', add: 6, del: 1, viewed: false, collapsed: true, hunks: [] },
  ],
};

export function merge(base, over) {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over === undefined ? base : over;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(over)) out[k] = base && typeof base[k] === 'object' && !Array.isArray(base[k]) ? merge(base[k], over[k]) : over[k];
  return out;
}
