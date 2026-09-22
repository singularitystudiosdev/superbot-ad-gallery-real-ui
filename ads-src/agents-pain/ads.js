// The "agents <pain>? superbot can <verb> it!" poster family.
//
// Type is taken from the gpt-refusal ad spot's card scene (animations/
// gpt-refusal-superbot-824cef28: --ui, #card .line, #card .red, --storm-x),
// so every poster and the spot itself read as one set. `verb` is "do" on the
// two that were first drawn as generator art and "fix" on the three built
// from the complaint sweep.
//
// Pain words from a sweep of Hacker News comments (hn.algolia.com, 2026-09-14)
// and the top year of r/AI_Agents, r/ChatGPTCoding, r/ClaudeAI, r/cursor and
// r/vibecoding:
//   refusing    the spot's own line; agents that moralise instead of working
//   slow        ChatGPT dribbling at 30 wpm while the work waits
//   forgetting  agents re-learn the codebase every session; "a horde of
//               short-term-memory-only agents without institutional knowledge"
//   lying       "tell you the code is correct and it is 100 percent fixed but
//               I know it is not true"; "ChatGPT lied to me so I built an AI
//               Scientist"
//   looping     the slot-machine complaint: agents spin, redo work already
//               done and bill for it; "Spent 4,000 USD on AI coding"
window.PAIN_ADS = [
  { "id": "agents-refusing-poster", "word": "refusing", "color": "#ff0000", "verb": "do" },
  { "id": "agents-slow-poster", "word": "slow", "color": "#2b6bff", "verb": "do" },
  { "id": "agents-forgetting-poster", "word": "forgetting", "color": "#ff9f0a", "verb": "fix" },
  { "id": "agents-lying-poster", "word": "lying", "color": "#ff2d92", "verb": "fix" },
  { "id": "agents-looping-poster", "word": "looping", "color": "#00e5a0", "verb": "fix" }
];
