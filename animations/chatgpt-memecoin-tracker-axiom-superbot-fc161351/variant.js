// Remake of animations/chatgpt-memebot-axiom-superbot-6e571750/ as a read-only tracker: the same engine, cards,
// hub thread and Axiom connect, but superbot builds a memecoin watchlist with alert rules and never touches a
// control on Axiom (scenes/tabs-assets/chat.js, beats/tracker.js). Hand-built: NOT in tools/var89-matrix.mjs, so
// var89-generate never rewrites it.
export default {
  id: 'chatgpt-memecoin-tracker-axiom-superbot-fc161351',
  voice: 'ChatGPT',
  introLine: "ChatGPT can't watch Axiom for you",
  redWord: 'watch',
  slamLine: 'superbot can.',
  ask: 'make me a memecoin tracker for Axiom',
};
