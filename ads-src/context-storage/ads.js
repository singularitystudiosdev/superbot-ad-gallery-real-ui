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
// Numbers (2026-09-23): real windows (ChatGPT Thinking 196K on Plus/Pro, Claude Code and Cursor 200K),
// superbot trimming ~40% of the context, reply time from prefill scaling with context (36s -> 27s, 1.3x),
// and Claude Code spend inside Anthropic's published range (~$13/active day average, 90% under $30;
// code.claude.com/docs/en/costs); $232 a month = 22 working days.
window.CONTEXT_ADS = [
  {
    "id": "context-full-poster",
    "word": "full",
    "color": "#ff0000",
    "before": {
      "who": "ChatGPT",
      "used": "188K",
      "of": "196K",
      "bar": 0.959,
      "warn": true
    },
    "after": {
      "who": "ChatGPT",
      "used": "113K",
      "of": "196K",
      "bar": 0.577
    },
    "stats": [
      {
        "icon": "spark",
        "lead": "you have freed",
        "big": "75K tokens"
      },
      {
        "icon": "clock",
        "lead": "saved",
        "big": "25 minutes",
        "tail": "of re-explaining"
      }
    ]
  },
  {
    "id": "context-bloated-poster",
    "word": "bloated",
    "color": "#ff9f0a",
    "before": {
      "who": "Claude Code",
      "used": "184K",
      "of": "200K",
      "bar": 0.92,
      "warn": true,
      "note": "14 files read twice"
    },
    "after": {
      "who": "superbot",
      "used": "110K",
      "of": "200K",
      "bar": 0.55,
      "note": "every file read once"
    },
    "stats": [
      {
        "icon": "spark",
        "lead": "you have freed",
        "big": "74K tokens"
      },
      {
        "icon": "clock",
        "lead": "saved",
        "big": "20 minutes",
        "tail": "of re-reading"
      }
    ]
  },
  {
    "id": "context-compacting-poster",
    "word": "compacting",
    "color": "#ff2d92",
    "before": {
      "who": "Cursor",
      "used": "200K",
      "of": "200K",
      "bar": 1,
      "warn": true,
      "note": "3 compactions · 2 tasks lost"
    },
    "after": {
      "who": "superbot",
      "used": "120K",
      "of": "200K",
      "bar": 0.6,
      "note": "0 compactions · 0 tasks lost"
    },
    "stats": [
      {
        "icon": "spark",
        "lead": "you have kept",
        "big": "every task"
      },
      {
        "icon": "clock",
        "lead": "saved",
        "big": "35 minutes",
        "tail": "of redoing work"
      }
    ]
  },
  {
    "id": "context-slow-poster",
    "word": "slow",
    "color": "#2b6bff",
    "lead": "agent",
    "before": {
      "who": "ChatGPT",
      "used": "170K",
      "of": "196K",
      "bar": 0.867,
      "warn": true,
      "note": "36s per reply"
    },
    "after": {
      "who": "ChatGPT",
      "used": "102K",
      "of": "196K",
      "bar": 0.52,
      "note": "27s per reply"
    },
    "stats": [
      {
        "icon": "spark",
        "lead": "replies are",
        "big": "1.3x faster"
      }
    ]
  },
  {
    "id": "context-costly-poster",
    "word": "costly",
    "color": "#00e5a0",
    "before": {
      "who": "Claude Code",
      "used": "$26.40",
      "of": "$30",
      "bar": 0.88,
      "warn": true,
      "note": "daily budget, gone by 4 pm"
    },
    "after": {
      "who": "Claude Code",
      "used": "$15.84",
      "of": "$30",
      "bar": 0.528,
      "note": "daily budget, lasts all day"
    },
    "stats": [
      {
        "icon": "spark",
        "lead": "you have saved",
        "big": "$10.56 a day"
      },
      {
        "icon": "clock",
        "lead": "that is",
        "big": "$232",
        "tail": "a month"
      }
    ]
  }
];
