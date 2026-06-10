// Speech recognition + command matching + duration parsing.
// Browser-native Web Speech API only — no deps, no network for the
// recognition itself (though Chrome routes audio through Google's
// cloud under the hood — see the privacy tooltip wording in CookingMode).

export function isVoiceSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Factory for a fault-tolerant recognizer. Auto-restarts on the spurious
// `end` events Safari emits after a few seconds of silence.
export function createVoiceRecognizer({ onTranscript, onError, onStateChange }) {
  if (!isVoiceSupported()) return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-US";

  let enabled = false;
  let restartTimer = null;

  const safeStart = () => {
    try {
      rec.start();
    } catch {
      // "already started" — fine
    }
  };

  rec.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (!r.isFinal) continue;
      const transcript = r[0]?.transcript?.trim().toLowerCase();
      if (transcript) onTranscript?.(transcript);
    }
  };

  rec.onerror = (event) => {
    const err = event.error || "unknown";
    onError?.(err);
    if (err === "not-allowed" || err === "service-not-allowed") {
      enabled = false;
      clearTimeout(restartTimer);
    }
  };

  rec.onstart = () => onStateChange?.("listening");

  rec.onend = () => {
    onStateChange?.("idle");
    if (!enabled) return;
    // Safari auto-stops; restart unless we were intentionally stopped.
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      if (enabled) safeStart();
    }, 300);
  };

  return {
    start() {
      enabled = true;
      safeStart();
    },
    stop() {
      enabled = false;
      clearTimeout(restartTimer);
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
    isEnabled() {
      return enabled;
    },
  };
}

// ─── Command matcher ────────────────────────────────────────────────────────
// Each command has one regex covering common variants (including likely
// misrecognitions like "nex"/"nest"/"necks" for "next").

const COMMANDS = [
  {
    kind: "next",
    re: /\b(?:next(?:\s+step)?|go\s+forward|forward|advance|nex|nest|necks|next\s+one)\b/,
  },
  {
    kind: "back",
    re: /\b(?:back|previous(?:\s+step)?|go\s+back|go\s+previous|last\s+step)\b/,
  },
  {
    kind: "repeat",
    re: /\b(?:repeat(?:\s+that)?|say\s+(?:that\s+|it\s+)?again|what\s+did\s+you\s+say|repete|read\s+(?:that|it)\s+again)\b/,
  },
  {
    kind: "timer-stop",
    re: /\b(?:stop|cancel|pause)\s+(?:the\s+)?timer\b/,
  },
  {
    kind: "ingredients",
    re: /\b(?:show\s+(?:me\s+)?(?:the\s+)?)?ingredients?\b|\bwhat\s+do\s+i\s+need\b/,
  },
  {
    kind: "all-steps",
    re: /\bshow(?:\s+me)?(?:\s+all)?\s+steps?\b|\bshow\s+(?:the\s+)?recipe\b/,
  },
  {
    kind: "quit",
    re: /\b(?:quit|exit(?:\s+cooking(?:\s+mode)?)?|i'?m\s+done|i\s+am\s+done|stop\s+cooking)\b/,
  },
  {
    kind: "yes",
    re: /^\s*(?:yes|yeah|yep|yup|sure|confirm|okay|ok)\.?\s*$/,
  },
  {
    kind: "no",
    re: /^\s*(?:no|nope|never\s+mind|nah|cancel)\.?\s*$/,
  },
];

// Timer-start needs special handling because we have to extract the duration.
const TIMER_START_RE =
  /\b(?:set|start)\s+(?:a\s+|the\s+)?timer(?:\s+for)?\s+(.+)$|^timer\s+(?:for\s+)?(.+)$/;

export function matchCommand(transcript) {
  if (!transcript) return null;
  const t = transcript
    .toLowerCase()
    .replace(/[.!?,]+$/g, "")
    .trim();

  const timerMatch = t.match(TIMER_START_RE);
  if (timerMatch) {
    const durationText = timerMatch[1] || timerMatch[2] || "";
    const parsed = parseDuration(durationText);
    return {
      kind: "timer-start",
      totalSeconds: parsed?.totalSeconds ?? null,
      durationText: durationText.trim(),
    };
  }

  for (const { kind, re } of COMMANDS) {
    if (re.test(t)) return { kind };
  }

  return null;
}

// ─── Duration parser ────────────────────────────────────────────────────────

const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, half: 0.5,
};

export function parseDuration(text) {
  if (!text) return null;
  let t = text.toLowerCase().trim();

  // "half an hour" / "half a minute" → "0.5 hour"
  t = t.replace(/\bhalf\s+a[n]?\s+(hour|minute|second|min|sec|hr)\b/g, "0.5 $1");

  // Compound number words: "twenty five" → 25
  t = t.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, tens, ones) => String(NUMBER_WORDS[tens] + NUMBER_WORDS[ones]),
  );

  // Single number words → digits
  t = t.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|half)\b/g,
    (m) => String(NUMBER_WORDS[m]),
  );

  // "a minute" / "an hour" → "1 minute" / "1 hour"
  t = t.replace(
    /\b(?:a|an)\s+(minute|min|mins|minutes|hour|hours|hr|hrs|second|seconds|sec|secs)\b/g,
    "1 $1",
  );

  // "X and a half" / "X and 0.5" → X+0.5
  t = t.replace(
    /(\d+(?:\.\d+)?)\s+and\s+(?:0?\.5|a\s+half|half)\b/g,
    (_, n) => String(parseFloat(n) + 0.5),
  );

  let total = 0;
  let found = false;

  const hMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  if (hMatch) {
    total += parseFloat(hMatch[1]) * 3600;
    found = true;
  }
  const mMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)\b/);
  if (mMatch) {
    total += parseFloat(mMatch[1]) * 60;
    found = true;
  }
  const sMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?)\b/);
  if (sMatch) {
    total += parseFloat(sMatch[1]);
    found = true;
  }

  // Bare number fallback: "set a timer for 5" → assume minutes.
  if (!found) {
    const bare = t.match(/(\d+(?:\.\d+)?)/);
    if (bare) {
      total = parseFloat(bare[1]) * 60;
      found = true;
    }
  }

  if (!found || total < 1) return null;
  return { totalSeconds: Math.round(total) };
}

// Friendly human duration ("10 minutes", "1 minute 30 seconds")
export function describeDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  const parts = [];
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (rem > 0) parts.push(`${rem} second${rem === 1 ? "" : "s"}`);
  return parts.join(" ") || "0 seconds";
}
