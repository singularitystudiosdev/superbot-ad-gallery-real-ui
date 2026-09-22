// The "context <pain>? superbot can fix it!" before/after poster family.
//
// Layout is the phone-cleaner "Optimize Storage" ad (a Before bar in red at
// 250GB of 256GB, an After bar mostly green at 50GB, then "Congratulations!
// you have cleaned 200GB · saved 1.2 hours"), re-drawn for an agent's context
// window instead of a phone's disk. Type and colours are the agents-pain
// family (ads-src/agents-pain: SF Pro Rounded 800, -.035em, the storm-x
// wordmark gradient, the cat mark), so the two poster families and the ad
// spots read as one set.
//
// `bar` is the share of the window the Before/After rows fill, 0..1; the used
// share is drawn red and the free share green, exactly as the reference bar.
window.CONTEXT_ADS = [
  {
    "id": "context-full-poster", "word": "full", "color": "#ff0000",
    "before": { "who": "ChatGPT", "used": "197K", "of": "200K", "bar": 0.985, "warn": true },
    "after":  { "who": "ChatGPT", "used": "31K", "of": "200K", "bar": 0.155 },
    "stats": [
      { "icon": "spark", "lead": "you have freed", "big": "166K tokens" },
      { "icon": "clock", "lead": "saved", "big": "1.2 hours", "tail": "of re-explaining" }
    ]
  },
  {
    "id": "context-bloated-poster", "word": "bloated", "color": "#ff9f0a",
    "before": { "who": "Claude Code", "used": "184K", "of": "200K", "bar": 0.92, "warn": true, "note": "38 files read twice" },
    "after":  { "who": "superbot", "used": "22K", "of": "200K", "bar": 0.11, "note": "every file read once" },
    "stats": [
      { "icon": "spark", "lead": "you have freed", "big": "162K tokens" },
      { "icon": "clock", "lead": "saved", "big": "2.1 hours", "tail": "of re-reading" }
    ]
  },
  {
    "id": "context-compacting-poster", "word": "compacting", "color": "#ff2d92",
    "before": { "who": "Cursor", "used": "200K", "of": "200K", "bar": 1, "warn": true, "note": "12 compactions · 4 tasks lost" },
    "after":  { "who": "superbot", "used": "44K", "of": "200K", "bar": 0.22, "note": "0 compactions · 0 tasks lost" },
    "stats": [
      { "icon": "spark", "lead": "you have kept", "big": "every task" },
      { "icon": "clock", "lead": "saved", "big": "3.4 hours", "tail": "of redoing work" }
    ]
  },
  {
    "id": "context-slow-poster", "word": "slow", "color": "#2b6bff", "lead": "agent",
    "before": { "who": "ChatGPT", "used": "190K", "of": "200K", "bar": 0.95, "warn": true, "note": "84s per reply" },
    "after":  { "who": "ChatGPT", "used": "28K", "of": "200K", "bar": 0.14, "note": "36.5s per reply" },
    "stats": [
      { "icon": "spark", "lead": "replies are", "big": "2.3x faster" }
    ]
  },
  {
    "id": "context-costly-poster", "word": "costly", "color": "#00e5a0",
    "before": { "who": "Claude Code", "used": "$46.80", "of": "$50", "bar": 0.936, "warn": true, "note": "daily cap, 4:10 pm" },
    "after":  { "who": "Claude Code", "used": "$8.20", "of": "$50", "bar": 0.164, "note": "daily cap, all day" },
    "stats": [
      { "icon": "spark", "lead": "you have saved", "big": "$38.60 a day" },
      { "icon": "clock", "lead": "that is", "big": "$1,158", "tail": "a month" }
    ]
  }
];
