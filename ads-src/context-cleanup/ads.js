// The "before / after" context-cleanup family, after the App Store storage
// cleaner ad format (a big two-line title, a phone frame bleeding off the
// bottom, a red BEFORE bar and a green AFTER bar, a congratulations block),
// re-cut for superbot's actual product: the context window and the rules the
// agent is meant to keep. Same palette as the house spots (--storm-1..4 in
// animations/agents-slower-superbot-7bf1a6c6): blue #2b6bff, violet #6a1fd8,
// magenta #c026d3, pink #ff3d9a. Pink is the "full / ignored" state, blue the
// "clean / kept" state, so the whole family reads in the brand palette with
// no red or green.
//
// `frame` picks the composition: "phone" puts the scene inside a white phone
// on the storm gradient (the reference's layout); "flat" puts it straight on
// the house black with the "agents <pain>? superbot can fix it!" type.
//
// The numbers are one 200k-token context window (the size every current
// frontier model ships), a bloated session at 197k and a cleaned one at 38k,
// and a 12-rule AGENTS.md the agent forgets between sessions.
window.CTX_ADS = [
  { id: 'context-optimize-phone',  frame: 'phone', scene: 'optimize' },
  { id: 'context-cleaner-phone',   frame: 'phone', scene: 'cleaner' },
  { id: 'rules-remembered-phone',  frame: 'phone', scene: 'rules' },
  { id: 'context-optimize-flat',   frame: 'flat',  scene: 'optimize' },
  { id: 'rules-ignored-flat',      frame: 'flat',  scene: 'rules' },
  { id: 'context-breakdown-flat',  frame: 'flat',  scene: 'breakdown' },
];
