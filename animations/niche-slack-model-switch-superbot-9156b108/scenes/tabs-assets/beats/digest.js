// The catch-up itself, one source for every beat that shows it: write.js (Opus writes catch-up.md and replies.md) and
// slack.js (superbot's DM in Slack, Block Kit sections with a draft and Send / Edit under each one that needs Sam).
// The workspace, the people and every message are made up for the spot (first names only).
export const WORKSPACE = 'Tidecrest';
export const AWAY = 'Sep 22 to Oct 2';
// [kind, sidebar name, new messages, summary lines, who the draft answers, the draft]; a section with no draft is FYI
export const SECTIONS = [
  { kind: 'ch', name: 'launch-q4', n: 142, lines: ['Launch moved to Oct 14 (was Oct 7).', 'Pricing copy needs your sign-off by Friday.', 'Priya asked you to own the launch FAQ.'],
    to: 'Priya', draft: "Back today! I'll take the FAQ and sign off on pricing copy by Thursday." },
  { kind: 'ch', name: 'design', n: 58, lines: ['Onboarding goes with option B. Final mocks are posted.', 'Leo needs your call on the empty state.'],
    to: 'Leo', draft: "Option B looks great. For the empty state, let's open on the sample project." },
  { kind: 'ch', name: 'customer-feedback', n: 96, lines: ['Top ask: CSV export (23 customers).', 'Dana wants to know if it makes the Q4 plan.'],
    to: 'Dana', draft: 'Yes, CSV export goes in Q4. Can you write up the spec?' },
  { kind: 'ch', name: 'eng-oncall', n: 311, lines: ['2 incidents, both resolved. Payments retry fix shipped Sep 28.'], to: null, draft: null },
  { kind: 'ch', name: 'general', n: 402, lines: ['Maya joined the design team. Office closed Oct 10.'],
    to: 'Maya', draft: "Welcome, Maya! Glad you're here." },
  { kind: 'dm', name: 'Marcus', n: 3, lines: ['Can we sync on hiring Monday?'],
    to: 'Marcus', draft: "Monday at 10 works. I'll send an invite." },
];
export const DRAFTS = SECTIONS.filter((s) => s.draft);
export const CHANNELS = 14, MESSAGES = 3412, HUDDLES = 2;

// catch-up.md as Opus writes it (the first section, word for word what the Slack DM says)
export const CATCHUP_MD = `## #launch-q4
Launch moved to Oct 14 (was Oct 7).
Pricing copy needs your sign-off by Friday.
Priya asked you to own the launch FAQ.

Reply to Priya:
Back today! I'll take the FAQ and sign off
on pricing copy by Thursday.`;
// replies.md: every draft, in the order the DM lists them (only its line count shows, on the edit row)
export const REPLIES_MD = DRAFTS.map((s) => `## ${s.kind === 'dm' ? s.name : `#${s.name}`}\nReply to ${s.to}:\n${s.draft}`).join('\n\n');
