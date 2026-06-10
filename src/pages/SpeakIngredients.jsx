import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import IngredientChip from "../components/IngredientChip.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import HandBack from "../components/handDrawn/HandBack.jsx";
import { generateRecipes } from "../lib/generateRecipes.js";
import {
  autoCorrect,
  autoCorrectSentence,
} from "../lib/ingredientSuggestions.js";

const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function parseIngredientsFromTranscript(text) {
  if (!text) return [];
  // Run the whole transcript through sentence-level auto-correct first
  // — fixes voice-recognition slips like "tomahto sauce" → "tomato
  // sauce" or "brocolli" → "broccoli" without breaking up the phrase.
  // Then per-token autoCorrect each parsed ingredient as a second pass
  // to clean any remaining single-word misses.
  const corrected = autoCorrectSentence(text);
  return corrected
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .split(/,|\s+and\s+/i)
    .map((s) => autoCorrect(s.trim()))
    .filter(Boolean);
}

export default function SpeakIngredients() {
  const navigate = useNavigate();
  const recognizerRef = useRef(null);
  const [supported] = useState(!!SpeechRecognitionCtor);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [items, setItems] = useState([]);
  const [denied, setDenied] = useState(false);

  const ensureRecognizer = () => {
    if (recognizerRef.current || !SpeechRecognitionCtor) return recognizerRef.current;
    const rec = new SpeechRecognitionCtor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setDenied(true);
      }
      setListening(false);
    };
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) {
        const next = (transcript ? transcript + " " : "") + finalText.trim();
        setTranscript(next);
        setItems((prev) => {
          const parsed = parseIngredientsFromTranscript(next);
          const set = new Set(parsed);
          const out = prev.filter((x) => set.has(x));
          for (const p of parsed) if (!out.includes(p)) out.push(p);
          return out;
        });
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };
    recognizerRef.current = rec;
    return rec;
  };

  useEffect(() => {
    return () => {
      try {
        recognizerRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const toggleMic = () => {
    if (!supported) return;
    if (listening) {
      try {
        recognizerRef.current?.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    const rec = ensureRecognizer();
    setDenied(false);
    setInterim("");
    try {
      rec.start();
    } catch {
      /* already started — ignore */
    }
  };

  const remove = (name) => setItems((prev) => prev.filter((x) => x !== name));

  const reset = () => {
    setTranscript("");
    setInterim("");
    setItems([]);
  };

  const submit = () => {
    if (items.length === 0) return;
    generateRecipes(items).catch(() => {});
    navigate("/recipes", { state: { ingredients: items } });
  };

  // ─── Unsupported browser ─────────────────────────────────────────────────
  if (!supported) {
    return (
      <FallbackScreen
        kind="unsupported"
        onTypeInstead={() => navigate("/type")}
        onHome={() => navigate("/")}
      />
    );
  }

  // ─── Permission denied ───────────────────────────────────────────────────
  if (denied) {
    return (
      <FallbackScreen
        kind="denied"
        onTypeInstead={() => navigate("/type")}
        onHome={() => navigate("/")}
      />
    );
  }

  const stateLabel = listening ? "Listening…" : transcript ? "Got it" : "Tap to start";

  return (
    <>
      <PaperBackdrop />

      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <HandBack onClick={() => navigate("/")} className="self-start mb-3" />

          <header className="text-center">
            <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
              Tell us what you{" "}
              <span className="italic font-bold text-terracotta">have</span>
            </h2>
            <p className="font-script text-lg text-mocha mt-2 leading-none">
              tap the mic and start talking
            </p>
          </header>

          {/* Big mic */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={toggleMic}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Start listening"}
              className={`w-36 h-36 rounded-full bg-paper-warm border-[3px] border-ink shadow-[5px_5px_0_0_var(--color-ink)] flex items-center justify-center transition-transform active:translate-x-[3px] active:translate-y-[3px] ${
                listening ? "mic-listening" : ""
              }`}
            >
              <span
                className={`text-6xl inline-block ${
                  listening ? "mic-icon-bob" : ""
                }`}
                style={!listening ? { transform: "rotate(-4deg)" } : undefined}
                aria-hidden="true"
              >
                🎤
              </span>
            </button>
            <p
              className={`font-body text-sm font-medium leading-none ${
                listening ? "text-terracotta" : "text-mocha"
              }`}
              aria-live="polite"
            >
              {stateLabel}
            </p>
          </div>

          {/* Live transcription */}
          {(transcript || interim) && (
            <div className="mt-6 brut-card p-4 bg-paper-warm">
              <p className="font-serif italic text-ink text-base leading-snug">
                "{transcript}
                {interim && (
                  <span className="text-mocha/70"> {interim}</span>
                )}"
              </p>
            </div>
          )}

          {/* Chips */}
          {items.length > 0 && (
            <>
              <p className="font-script text-base text-mocha/85 mt-6 mb-2 leading-none">
                your ingredients
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((name) => (
                  <IngredientChip
                    key={name}
                    name={name}
                    confidence="high"
                    onRemove={() => remove(name)}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label="Add more by speaking"
                  className="w-11 h-11 rounded-full bg-paper-warm border-[2px] border-ink shadow-[3px_3px_0_0_var(--color-ink)] inline-flex items-center justify-center text-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_var(--color-ink)] transition-transform"
                >
                  <span style={{ transform: "rotate(-4deg)" }} className="inline-block">
                    🎤
                  </span>
                </button>
                <span className="font-script text-base text-mocha leading-none">
                  tap to add more
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={reset}
                  className="font-script text-sm text-mocha/65 hover:text-ink underline underline-offset-2"
                >
                  clear all
                </button>
              </div>
            </>
          )}

          <div className="flex-1" />

          <button
            type="button"
            disabled={items.length === 0}
            onClick={submit}
            className="brut-button mt-8 justify-center"
          >
            <span className="font-serif text-xl font-bold">
              Show me recipes
            </span>
            <HandArrow />
          </button>
        </div>
      </PageShell>
    </>
  );
}

/* ── Fallback screens (no mic / no permission) ──────────────────────────── */

function FallbackScreen({ kind, onTypeInstead, onHome }) {
  const message =
    kind === "denied"
      ? "we can't hear you — enable mic access in your browser settings"
      : "voice input isn't supported in this browser — try Chrome on desktop/Android or Safari on iOS 14.5+";
  return (
    <>
      <PaperBackdrop />
      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <HandBack onClick={onHome} className="self-start mb-3" />

          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4">
            <CrossedMic />
            <p className="font-script text-2xl text-mocha leading-snug max-w-xs">
              {message}
            </p>
            <button
              type="button"
              onClick={onTypeInstead}
              className="brut-button justify-center mt-2"
            >
              <span className="font-serif text-lg font-bold">
                Type instead
              </span>
              <HandArrow />
            </button>
          </div>
        </div>
      </PageShell>
    </>
  );
}

function CrossedMic() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="w-24 h-24 text-ink/75"
      aria-hidden="true"
    >
      {/* Mic capsule */}
      <rect
        x="32"
        y="12"
        width="16"
        height="28"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Mic stand U */}
      <path
        d="M 22 36 Q 22 50, 40 50 Q 58 50, 58 36"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Mic base stick */}
      <line
        x1="40"
        y1="50"
        x2="40"
        y2="62"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Mic base */}
      <line
        x1="30"
        y1="62"
        x2="50"
        y2="62"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Cross-out — slight wobble for hand-drawn feel */}
      <path
        d="M 12 10 Q 40 38, 70 70"
        stroke="#D2691E"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandArrow() {
  return (
    <svg viewBox="0 0 30 14" className="w-8 h-4 ml-1" aria-hidden="true">
      <path
        d="M1 7 Q 13 5, 25 7"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M20 2 L 28 7 L 20 12"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
