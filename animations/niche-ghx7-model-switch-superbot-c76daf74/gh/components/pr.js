// Pull request #483 pages: prHeader (title, state, branch line, tab nav + diffstat), prConversation, prFiles, prChecks.
// State hooks are documented in index.js (STATE CONTRACT).
import { appHeader } from './header.js';
import { oct, esc, av, labelTok, counter, branch, diffstat, statusIcon, statusStack, btn } from './util.js';
import { workflowGraph } from './graph.js';

export function prHeader(data, tab, { wide = false } = {}) {
  const p = data.pr;
  const tabs = [
    ['conversation', 'Conversation', 'comment-discussion', p.conversation],
    ['commits', 'Commits', 'git-commit', p.commits],
    ['checks', 'Checks', 'checklist', p.checks],
    ['files', 'Files changed', 'file-diff', p.files],
  ];
  return `<div class="gh-prhead${wide ? ' is-wide' : ''}">
  <div class="gh-prhead-top">
    <h1 class="gh-ititle"><bdi>${esc(p.title)}</bdi> <span class="gh-num">#${p.number}</span></h1>
    <div class="gh-ihead-actions"><span class="gh-btn">Edit</span><span class="gh-btn gh-btn--primary">${oct('code')}<span>Code</span>${oct('triangle-down')}</span></div>
  </div>
  <div class="gh-prmeta"><span class="gh-state gh-state--open" data-slot="pr-state">${oct('git-pull-request')}Open</span>
    <span class="gh-muted"><a class="gh-author-link">${esc(p.author)}</a> wants to merge ${p.commits} commit into ${branch(p.base)} from ${branch(p.head)}</span><span class="gh-copy">${oct('copy')}</span></div>
  <div class="gh-prtabs">
    <nav>${tabs.map(([id, label, icon, n]) => `<span class="gh-prtab${id === tab ? ' is-selected' : ''}" data-tab="${id}">${oct(icon)}<span>${label}</span>${counter(n)}</span>`).join('')}</nav>
    ${diffstat(p.add, p.del)}
  </div>
</div>`;
}

const repoHeader = (data, wide) => appHeader({ user: data.user, crumbs: [data.org, data.repo], tab: 'pulls', counts: { issues: data.repoCounts.issues, pulls: data.repoCounts.pulls }, avatars: data.avatars });

// ---------------------------------------------------------------- Conversation
export function prConversation(data) {
  const { pr: p, avatars, ci } = data;
  const sideSection = (title, body) => `<section><h4>${title} ${oct('gear', 16, 'gh-side-gear')}</h4>${body}</section>`;
  const checkRows = ci.jobs.map((j) => `<div class="gh-mcheck" data-job="${j.id}" data-state="success">${statusStack()}${oct('workflow', 16, 'gh-mcheck-app')}<span class="gh-mcheck-name"><strong>${esc(ci.workflow)} / ${esc(j.name)} (${esc(ci.event)})</strong> <span class="gh-muted" data-slot="check-text"><span data-for="success">Successful in ${esc(j.dur)}</span><span data-for="in_progress">In progress</span><span data-for="queued">Queued</span><span data-for="failure">Failing after ${esc(j.dur)}</span></span></span><span class="gh-sp"></span><span class="gh-mcheck-req">Required</span><a class="gh-mcheck-details">Details</a></div>`).join('');

  return `${repoHeader(data)}
<main class="gh-pr">
  ${prHeader(data, 'conversation')}
  <div class="gh-prlayout">
    <div class="gh-prtimeline">
      <div class="gh-tlc" data-tl="body">
        <div class="gh-tlc-av">${av(p.author, 40, { avatars })}</div>
        <div class="gh-tlc-box">
          <div class="gh-tlc-hd"><strong>${esc(p.author)}</strong> <span class="gh-muted">commented <a class="gh-muted-link">${esc(p.opened)}</a></span><span class="gh-sp"></span><span class="gh-role">Owner</span><span class="gh-role">Author</span><span class="gh-kebab">${oct('kebab-horizontal')}</span></div>
          <div class="gh-md"><p>${esc(p.body).replace('#482', '<a class="gh-issue-ref">#482</a>')}</p>
            <h3>Changes</h3><ul><li><code>src/auth/session.ts</code>: schedule the refresh 60 s before <code>expiresAt</code>, never after it</li><li><code>src/auth/refresh.ts</code>: one shared refresh across tabs (lock + <code>BroadcastChannel</code>)</li><li><code>src/auth/session.test.ts</code>: <em>keeps Remember me sessions alive past 15 minutes</em></li></ul>
            <div class="gh-reactions"><span class="gh-reaction"><span class="emoji">🚀</span><span>3</span></span><span class="gh-reaction gh-reaction--add">${oct('smiley')}</span></div></div>
        </div>
      </div>
      <div class="gh-tl-item" data-tl="commit"><span class="gh-tl-badge">${oct('git-commit')}</span>${av(p.commit.author, 20, { avatars })}<code class="gh-commit-msg">${esc(p.commit.msg)}</code><span class="gh-sp"></span><span class="gh-verified">Verified</span>${statusIcon('success')}<code class="gh-sha">${esc(p.commit.sha)}</code></div>
      <div class="gh-tl-item" data-tl="linked"><span class="gh-tl-badge">${oct('cross-reference')}</span>${av(p.author, 20, { avatars })}<span><strong>${esc(p.author)}</strong> linked an issue that may be closed by this pull request <a class="gh-muted-link">${esc(p.opened)}</a></span></div>
      <div class="gh-tl-ref" data-tl="linked-issue">${oct('issue-opened', 16, 'gh-c-open')}<strong>${esc(data.issue.title)}</strong> <span class="gh-muted">#${data.issue.number}</span></div>
      <div class="gh-tl-item" data-tl="review-req"><span class="gh-tl-badge">${oct('eye')}</span>${av(p.author, 20, { avatars })}<span><strong>${esc(p.author)}</strong> requested review from <strong>${esc(p.reviewers[0][0])}</strong> and <strong>${esc(p.reviewers[1][0])}</strong> <a class="gh-muted-link">${esc(p.opened)}</a></span></div>
      <div class="gh-tlc" data-tl="bot">
        <div class="gh-tlc-av">${av('superbot-gg[bot]', 40)}</div>
        <div class="gh-tlc-box">
          <div class="gh-tlc-hd"><strong>superbot-gg</strong> <span class="gh-role gh-role--bot">bot</span> <span class="gh-muted">commented <a class="gh-muted-link">${esc(p.opened)}</a></span><span class="gh-sp"></span><span class="gh-kebab">${oct('kebab-horizontal')}</span></div>
          <div class="gh-md"><p>${esc(p.botComment)}</p></div>
        </div>
      </div>
      <div class="gh-merge" data-slot="mergebox" data-checks-state="success">
        <div class="gh-merge-rail">${av('superbot-gg[bot]', 40, { cls: 'is-hidden' })}<span class="gh-merge-icon">${oct('git-merge', 24)}</span></div>
        <div class="gh-merge-box">
          <div class="gh-merge-sec gh-merge-review"><span class="gh-merge-sicon is-warn">${oct('alert')}</span><div><strong>Review required</strong><div class="gh-muted">At least 1 approving review is required by reviewers with write access.</div></div></div>
          <div class="gh-merge-sec gh-merge-checks"><span class="gh-merge-sicon is-ok">${statusStack(16)}</span><div class="gh-sp"><strong data-slot="checks-title"><span data-for="success">All checks have passed</span><span data-for="in_progress">Some checks haven’t completed yet</span><span data-for="failure">Some checks were not successful</span></strong><div class="gh-muted" data-slot="checks-sub"><span data-for="success"><span data-count="checks-ok">${ci.jobs.length}</span> successful checks</span><span data-for="in_progress"><span data-count="checks-ok">0</span> successful, <span data-count="checks-pending">${ci.jobs.length}</span> in progress checks</span><span data-for="failure">1 failing, ${ci.jobs.length - 1} successful checks</span></div></div><span class="gh-merge-toggle">${oct('chevron-down')}</span></div>
          <div class="gh-mchecks">${checkRows}</div>
          <div class="gh-merge-sec"><span class="gh-merge-sicon is-ok">${oct('check-circle-fill')}</span><div><strong>No conflicts with base branch</strong><div class="gh-muted">Merging can be performed automatically.</div></div></div>
          <div class="gh-merge-act"><span class="gh-btn gh-btn--primary gh-btn--split"><span>Merge pull request</span><span class="gh-btn-split">${oct('triangle-down')}</span></span><span class="gh-muted">You can also merge this with the command line. <a class="gh-link">View command line instructions.</a></span></div>
        </div>
      </div>
      <div class="gh-addcomment"><div class="gh-tlc-av">${av(data.user, 40, { avatars })}</div><div class="gh-tlc-box"><div class="gh-ac-tabs"><span class="is-selected">Write</span><span>Preview</span><span class="gh-sp"></span>${['heading', 'bold', 'italic', 'quote', 'code', 'link', 'list-unordered', 'list-ordered', 'tasklist', 'mention', 'image', 'cross-reference'].map((i) => oct(i)).join('')}</div><div class="gh-ac-input">Use Markdown to format your comment</div></div></div>
    </div>
    <aside class="gh-iside gh-prside">
      ${sideSection('Reviewers', p.reviewers.map(([r]) => `<div class="gh-side-person">${av(r, 20, { avatars })}<strong>${esc(r)}</strong><span class="gh-sp"></span><span class="gh-rev-pending" title="Awaiting requested review">${oct('dot-fill')}</span></div>`).join('') + '<div class="gh-muted gh-small">At least 1 approving review is required to merge this pull request.</div>')}
      ${sideSection('Assignees', `<div class="gh-side-person">${av(p.author, 20, { avatars })}<strong>${esc(p.author)}</strong></div>`)}
      ${sideSection('Labels', `<div class="gh-side-labels">${p.labels.map((l) => labelTok(l)).join('')}</div>`)}
      ${sideSection('Projects', `<div class="gh-side-project">${oct('table')}<strong>${esc(data.board.title)}</strong></div><div class="gh-side-field"><span>Status</span><span class="gh-status-pill"><span class="gh-status-dot is-purple"></span>In review</span></div>`)}
      ${sideSection('Milestone', `<div class="gh-progress"><span style="width:${data.issue.milestoneProgress}%"></span></div><div class="gh-side-ms"><strong>${esc(data.issue.milestone)}</strong></div>`)}
      ${sideSection('Development', `<div class="gh-muted gh-small">Successfully merging this pull request may close these issues.</div><div class="gh-dev-row">${oct('issue-opened', 16, 'gh-c-open')}<span><strong>${esc(data.issue.title)}</strong></span></div>`)}
      <section><h4>Notifications <span class="gh-side-cust">Customize</span></h4><span class="gh-btn gh-btn--block">${oct('bell-slash')}<span>Unsubscribe</span></span><div class="gh-muted gh-small">You’re receiving notifications because you authored the thread.</div></section>
      <section><h4>3 participants</h4><div class="gh-side-avs">${av(p.author, 26, { avatars })}${av('superbot-gg[bot]', 26)}${av(p.reviewers[0][0], 26, { avatars })}</div></section>
    </aside>
  </div>
</main>`;
}

// ---------------------------------------------------------------- Files changed (2026 default experience)
function diffLine([t, o, n, code], i) {
  const cls = t === '+' ? 'add' : t === '-' ? 'del' : 'ctx';
  return `<tr class="gh-dl gh-dl--${cls}" data-ln="${i}"><td class="gh-dn">${o ?? ''}</td><td class="gh-dn">${n ?? ''}</td><td class="gh-dc"><span class="gh-dmark">${t === ' ' ? '' : t === '-' ? '−' : '+'}</span>${hl(code) || ' '}</td></tr>`;
}
// Minimal TypeScript highlighter in GitHub light (prettylights) colours.
function hl(code) {
  let s = esc(code);
  const toks = [];
  const keep = (cls) => (m) => { toks.push(`<span class="${cls}">${m}</span>`); return `\u0001${String.fromCharCode(65 + toks.length - 1)}\u0001`; };
  s = s.replace(/(\/\/.*$)/, keep('pl-c'));
  s = s.replace(/(&quot;.*?&quot;)/g, keep('pl-s'));
  s = s.replace(/\b(const|let|function|return|if|else|await|async|export|import|from|new|void|typeof)\b/g, '<span class="pl-k">$1</span>');
  s = s.replace(/\b(\d[\d_]*)\b/g, '<span class="pl-c1">$1</span>');
  s = s.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="pl-en">$1</span>');
  s = s.replace(/\b(SessionToken|Promise|BroadcastChannel|Math|Date|navigator)\b/g, '<span class="pl-smi">$1</span>');
  return s.replace(/\u0001([A-Z])\u0001/g, (_, k) => toks[k.charCodeAt(0) - 65]);
}

export function prFiles(data) {
  const files = data.files;
  const viewed = files.filter((f) => f.viewed).length;
  const tree = `<div class="gh-ftree">
    <div class="gh-ftree-filter"><span class="gh-input">${oct('search')}<span class="gh-muted">Filter files…</span></span><span class="gh-iconbtn">${oct('filter')}</span></div>
    <div class="gh-ftree-row is-dir">${oct('chevron-down', 16, 'gh-chev')}${oct('file-directory-fill', 16, 'gh-dir')}<span>src/auth</span></div>
    ${files.map((f, i) => `<div class="gh-ftree-row is-file${i === 0 ? ' is-current' : ''}" data-file="${esc(f.path)}">${oct('file', 16, 'gh-fileic')}<span>${esc(f.path.split('/').pop())}</span><span class="gh-sp"></span><span class="gh-ftree-mod">${oct('diff', 16)}</span></div>`).join('')}
  </div>`;
  const fileBlock = (f, fi) => `<div class="gh-file" data-file="${esc(f.path)}" data-viewed="${f.viewed ? 1 : 0}">
    <div class="gh-file-hd">${oct(f.collapsed ? 'chevron-right' : 'chevron-down', 16, 'gh-chev')}<span class="gh-file-path">${esc(f.path)}</span>${oct('copy', 16, 'gh-file-copy')}<span class="gh-sp"></span>${diffstat(f.add, f.del)}<span class="gh-viewed"><span class="gh-cb"></span><span>Viewed</span></span>${oct('comment', 16, 'gh-file-ic')}${oct('kebab-horizontal', 16, 'gh-file-ic')}</div>
    ${f.collapsed ? '' : `<table class="gh-diff" data-slot="diff-lines"><tbody>${f.hunks.map((h) => `<tr class="gh-dl gh-dl--hunk"><td class="gh-dn gh-dn--hunk" colspan="2">${oct('unfold', 16)}</td><td class="gh-dc">${esc(h.header)}</td></tr>${h.lines.map(diffLine).join('')}`).join('')}</tbody></table>`}
  </div>`;
  return `${repoHeader(data)}
<main class="gh-pr gh-pr--full">
  ${prHeader(data, 'files', { wide: true })}
  <div class="gh-fbar"><span class="gh-iconbtn">${oct('sidebar-expand')}</span><span class="gh-btn gh-btn--sm">${oct('git-commit')}<span>All commits</span>${oct('triangle-down')}</span><span class="gh-sp"></span>
    <span class="gh-fviewed" data-slot="viewed"><svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#d1d9e0" stroke-width="2"/></svg><strong data-count="viewed">${viewed}</strong> / ${files.length} viewed</span>
    <span class="gh-iconbtn">${oct('info')}</span>${btn('Comments', { icon: 'comment-discussion', sm: true })}<span class="gh-btn gh-btn--primary gh-btn--sm"><span>Submit review</span>${oct('triangle-down')}</span><span class="gh-iconbtn">${oct('gear')}</span></div>
  <div class="gh-flayout">
    <aside class="gh-fside">
      <div class="gh-fgroups"><div class="gh-fgroups-hd">Groups by Copilot ${oct('chevron-down')}</div><div class="gh-fgroup is-selected">All files</div><div class="gh-fgroup">Session refresh</div><div class="gh-fgroup">Tests</div></div>
      ${tree}
    </aside>
    <div class="gh-fmain">${files.map(fileBlock).join('')}</div>
  </div>
</main>`;
}

// ---------------------------------------------------------------- Checks tab with the Actions run summary + graph
export function prChecks(data) {
  const { ci, pr: p, avatars } = data;
  const runState = data.runState || 'success';
  const list = ci.jobs.map((j, i) => `<div class="gh-ck-job${i === 0 ? '' : ''}" data-job="${j.id}" data-state="${j.state || runState}">${statusStack()}<span>${esc(j.name)}</span><span class="gh-sp"></span><span class="gh-ck-dur" data-slot="duration">${esc(j.dur)}</span></div>`).join('');
  return `${repoHeader(data)}
<main class="gh-pr gh-pr--full">
  ${prHeader(data, 'checks', { wide: true })}
  <div class="gh-ckhead" data-run-state="${runState}">${statusStack(24)}<strong>${esc(p.commit.msg)}</strong><code class="gh-sha">${esc(p.commit.sha)}</code>${oct('triangle-down')}</div>
  <div class="gh-cklayout">
    <aside class="gh-ckside">
      <div class="gh-ck-wf is-open" data-run-state="${runState}">${oct('chevron-down', 16, 'gh-chev')}<div><strong>${esc(ci.workflow)}</strong><div class="gh-muted gh-small">on: ${esc(ci.event)}</div></div><span class="gh-sp"></span><span class="gh-ck-ann">${oct('comment', 16)}<span>0</span></span></div>
      <div class="gh-ck-summary is-selected">${oct('home')}<span>Summary</span></div>
      ${list}
      <div class="gh-ck-wf">${oct('chevron-right', 16, 'gh-chev')}<div><strong>CodeQL</strong><div class="gh-muted gh-small">on: pull_request</div></div><span class="gh-sp"></span>${statusIcon('success')}</div>
      <div class="gh-ck-wf">${oct('chevron-right', 16, 'gh-chev')}<div><strong>Preview deploy</strong><div class="gh-muted gh-small">on: pull_request</div></div><span class="gh-sp"></span>${statusIcon('skipped')}</div>
    </aside>
    <section class="gh-ckmain">
      <div class="gh-ckmain-title"><h2>${esc(ci.workflow)}</h2><span class="gh-muted">#${ci.run}</span><span class="gh-sp"></span>${btn('Re-run all jobs', { sm: true })}<span class="gh-iconbtn">${oct('kebab-horizontal')}</span></div>
      <div class="gh-runsum" data-run-state="${runState}">
        <div class="gh-runsum-col gh-runsum-trig"><span class="gh-muted gh-small">Triggered via pull request ${esc(p.opened)}</span><div>${av(p.author, 20, { avatars })}<strong>${esc(p.author)}</strong> synchronize <a class="gh-strong-link">#${p.number}</a> ${branch(p.head)}</div></div>
        <div class="gh-runsum-col"><span class="gh-muted gh-small">Status</span><strong class="gh-runsum-v" data-slot="run-status"><span data-for="queued">Queued</span><span data-for="in_progress">In progress</span><span data-for="success">Success</span><span data-for="failure">Failure</span></strong></div>
        <div class="gh-runsum-col"><span class="gh-muted gh-small">Total duration</span><strong class="gh-runsum-v gh-ul" data-slot="run-duration">${esc(ci.total)}</strong></div>
        <div class="gh-runsum-col"><span class="gh-muted gh-small">Artifacts</span><strong class="gh-runsum-v gh-ul" data-count="artifacts">${ci.artifacts}</strong></div>
      </div>
      ${workflowGraph(data)}
      <div class="gh-cksum-md"><h3>${esc(ci.workflow)} summary</h3><table class="gh-mdtable"><thead><tr><th>Job</th><th>Result</th></tr></thead><tbody><tr><td>unit</td><td>✅ <span data-count="tests">214</span> tests passed</td></tr><tr><td>e2e</td><td>✅ login &gt; Remember me survives 16 minutes</td></tr></tbody></table></div>
    </section>
  </div>
</main>`;
}
