import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import StepDisplay from "../components/cooking/StepDisplay.jsx";
import StepTimer from "../components/cooking/StepTimer.jsx";
import StepNavigation from "../components/cooking/StepNavigation.jsx";
import AllStepsSheet from "../components/cooking/AllStepsSheet.jsx";
import IngredientsSheet from "../components/cooking/IngredientsSheet.jsx";
import CelebrationScreen from "../components/cooking/CelebrationScreen.jsx";
import MicToggle from "../components/cooking/MicToggle.jsx";
import VoiceToast from "../components/cooking/VoiceToast.jsx";
import { acquireWakeLock, releaseWakeLock } from "../lib/wakeLock.js";
import {
  playStepAdvanceChime,
  playTimerAlarm,
  primeAudio,
  vibrateAlarm,
} from "../lib/cookingSounds.js";
import {
  saveCookingSession,
  clearCookingSession,
  incrementCookedCount,
} from "../lib/cookingState.js";
import {
  createVoiceRecognizer,
  isVoiceSupported,
  matchCommand,
  describeDuration,
} from "../lib/voiceControl.js";
import {
  speak as ttsSpeak,
  cancelSpeech,
  isSpeechSynthesisSupported,
  primeVoices,
} from "../lib/textToSpeech.js";
import { logEvent } from "../lib/eventTracker.js";
import { buildUserProfile } from "../lib/profileBuilder.js";
import { fetchTipsForRecipe, getCachedTips } from "../lib/cookingTips.js";
import ShareCardPreview from "../components/sharing/ShareCardPreview.jsx";

function recipeEventData(recipe) {
  return {
    name: recipe.name,
    cuisine: recipe.cuisine,
    category: recipe.category,
    totalTimeMinutes: recipe.totalTimeMinutes,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients?.map((i) => i.name).filter(Boolean) ?? [],
  };
}

const VOICE_ENABLED_KEY = "whatscookin:voiceEnabled";
const VOICE_AUTOREAD_KEY = "whatscookin:voiceAutoRead";
const VOICE_PRIVACY_SHOWN_KEY = "whatscookin:voicePrivacyShown";

function readBoolPref(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "1";
  } catch {
    return fallback;
  }
}
function writeBoolPref(key, value) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

// ─── Timer reducer ──────────────────────────────────────────────────────────
function timersReducer(state, action) {
  switch (action.type) {
    case "start": {
      const { stepIndex, totalMinutes } = action;
      const total = Math.max(1, Math.round(totalMinutes * 60));
      const existing = state[stepIndex];
      const next = existing
        ? { ...existing, running: true, finished: false, acknowledged: false }
        : {
            totalSeconds: total,
            remaining: total,
            running: true,
            finished: false,
            acknowledged: false,
          };
      return { ...state, [stepIndex]: next };
    }
    case "startWithSeconds": {
      const { stepIndex, totalSeconds } = action;
      const total = Math.max(1, Math.round(totalSeconds));
      return {
        ...state,
        [stepIndex]: {
          totalSeconds: total,
          remaining: total,
          running: true,
          finished: false,
          acknowledged: false,
        },
      };
    }
    case "pause": {
      const t = state[action.stepIndex];
      if (!t) return state;
      return { ...state, [action.stepIndex]: { ...t, running: false } };
    }
    case "reset": {
      const t = state[action.stepIndex];
      if (!t) return state;
      return {
        ...state,
        [action.stepIndex]: {
          ...t,
          remaining: t.totalSeconds,
          running: false,
          finished: false,
          acknowledged: false,
        },
      };
    }
    case "tick": {
      let changed = false;
      const next = { ...state };
      for (const [k, t] of Object.entries(state)) {
        if (!t.running) continue;
        const remaining = t.remaining - 1;
        if (remaining <= 0) {
          next[k] = {
            ...t,
            remaining: 0,
            running: false,
            finished: true,
            acknowledged: false,
          };
        } else {
          next[k] = { ...t, remaining };
        }
        changed = true;
      }
      return changed ? next : state;
    }
    case "acknowledgeAll": {
      let changed = false;
      const next = { ...state };
      for (const [k, t] of Object.entries(state)) {
        if (t.finished && !t.acknowledged) {
          next[k] = { ...t, acknowledged: true };
          changed = true;
        }
      }
      return changed ? next : state;
    }
    case "acknowledge": {
      const t = state[action.stepIndex];
      if (!t || !t.finished) return state;
      return {
        ...state,
        [action.stepIndex]: { ...t, acknowledged: true },
      };
    }
    default:
      return state;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function CookingMode({
  recipe,
  initialStep = 0,
  initialIngredientChecks = [],
  initialTimers = null,
  onExit,
}) {
  const totalSteps = recipe.steps.length;
  const [currentStep, setCurrentStep] = useState(
    Math.min(Math.max(0, initialStep), Math.max(0, totalSteps - 1)),
  );
  const [direction, setDirection] = useState("forward");
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [quitFromVoice, setQuitFromVoice] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pendingShare, setPendingShare] = useState(null); // { rating } | null
  const [ingredientChecks, setIngredientChecks] = useState(
    () => new Set(initialIngredientChecks),
  );
  const [timers, dispatchTimers] = useReducer(
    timersReducer,
    initialTimers || {},
  );

  // ─── Adaptive difficulty tips ─────────────────────────────────────────────
  // If the user's profile says "easy"/"beginner", fire a one-shot Haiku call
  // to generate one-sentence beginner tips per step. Cached per recipe id.
  const userProfile = useMemo(() => buildUserProfile(), []);
  const wantsBeginnerTips =
    userProfile.preferredDifficulty === "easy" ||
    userProfile.preferredDifficulty === "beginner";
  const [tips, setTips] = useState(() => getCachedTips(recipe.id));
  useEffect(() => {
    if (!wantsBeginnerTips) return;
    if (tips) return;
    let cancelled = false;
    fetchTipsForRecipe(recipe).then((result) => {
      if (cancelled) return;
      if (result) setTips(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id, wantsBeginnerTips]);

  // ─── Lifecycle events ─────────────────────────────────────────────────────
  // Log abandoned if the user exits before showCelebration becomes true.
  const exitOutcomeRef = useRef(null); // 'completed' | 'abandoned' | null
  useEffect(() => {
    return () => {
      if (exitOutcomeRef.current === "completed") return;
      logEvent("cooking_abandoned", {
        recipeId: recipe.id,
        recipeData: recipeEventData(recipe),
        atStep: currentStep + 1,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Voice state ──────────────────────────────────────────────────────────
  const voiceSupported = isVoiceSupported();
  const ttsSupported = isSpeechSynthesisSupported();
  const [voiceEnabled, setVoiceEnabled] = useState(() =>
    voiceSupported ? readBoolPref(VOICE_ENABLED_KEY, false) : false,
  );
  const [autoRead, setAutoRead] = useState(() =>
    readBoolPref(VOICE_AUTOREAD_KEY, true),
  );
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState(null); // { message, kind }
  const [recognizedFlash, setRecognizedFlash] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [privacyTooltip, setPrivacyTooltip] = useState(false);

  // Refs for things the recognizer's transcript handler needs to read
  // at call-time without re-creating the recognizer.
  const ttsMutedRef = useRef(false);
  const toastTimerRef = useRef(null);
  const recognizedTimerRef = useRef(null);
  const previousFinishedRef = useRef(new Set());

  // ─── Wake lock ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    acquireWakeLock();
    const onVis = () => {
      if (!cancelled && document.visibilityState === "visible") {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      releaseWakeLock();
    };
  }, []);

  // ─── 1Hz tick ─────────────────────────────────────────────────────────────
  const anyRunning = useMemo(
    () => Object.values(timers).some((t) => t.running),
    [timers],
  );
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => dispatchTimers({ type: "tick" }), 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  // ─── Pending alarm tracking ───────────────────────────────────────────────
  const hasPendingAlarm = useMemo(
    () => Object.values(timers).some((t) => t.finished && !t.acknowledged),
    [timers],
  );

  // Speak helper that mutes the mic during TTS so the recognizer doesn't
  // hear and react to our own voice.
  const speakSafely = useCallback(
    (text, opts = {}) => {
      if (!ttsSupported || !text) return;
      ttsMutedRef.current = true;
      ttsSpeak(text, {
        ...opts,
        onEnd: () => {
          // Brief tail-of-audio guard before re-listening.
          setTimeout(() => {
            ttsMutedRef.current = false;
          }, 250);
          opts.onEnd?.();
        },
      });
    },
    [ttsSupported],
  );

  // Fire initial alarm + vibrate when a timer becomes finished
  useEffect(() => {
    const nowFinished = new Set(
      Object.entries(timers)
        .filter(([, t]) => t.finished)
        .map(([k]) => k),
    );
    for (const k of nowFinished) {
      if (!previousFinishedRef.current.has(k)) {
        playTimerAlarm();
        vibrateAlarm();
        if (voiceEnabled && ttsSupported) {
          speakSafely("Time's up!");
        }
      }
    }
    previousFinishedRef.current = nowFinished;
  }, [timers, voiceEnabled, ttsSupported, speakSafely]);

  // Repeat alarm every 5s while pending
  useEffect(() => {
    if (!hasPendingAlarm) return;
    const id = setInterval(() => playTimerAlarm(), 5000);
    return () => clearInterval(id);
  }, [hasPendingAlarm]);

  // ─── Persist session ──────────────────────────────────────────────────────
  useEffect(() => {
    if (showCelebration) return;
    saveCookingSession({
      recipeId: recipe.id,
      recipe,
      currentStep,
      ingredientChecks: Array.from(ingredientChecks),
      timers,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, ingredientChecks, recipe.id, showCelebration]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const step = recipe.steps[currentStep];
  const isLast = currentStep === totalSteps - 1;

  const goNext = useCallback(
    ({ viaVoice = false } = {}) => {
      if (isLast) {
        cancelSpeech();
        dispatchTimers({ type: "acknowledgeAll" });
        exitOutcomeRef.current = "completed";
        logEvent("cooking_completed", {
          recipeId: recipe.id,
          recipeData: recipeEventData(recipe),
        });
        setShowCelebration(true);
        return;
      }
      primeAudio();
      playStepAdvanceChime();
      cancelSpeech();
      dispatchTimers({ type: "acknowledgeAll" });
      setDirection("forward");
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      if (viaVoice && autoRead && ttsSupported) {
        const next = recipe.steps[nextIdx];
        if (next) speakSafely(next.instruction);
      }
    },
    [isLast, currentStep, autoRead, ttsSupported, recipe, speakSafely],
  );

  const goPrev = useCallback(
    ({ viaVoice = false } = {}) => {
      if (currentStep === 0) return;
      primeAudio();
      playStepAdvanceChime();
      cancelSpeech();
      dispatchTimers({ type: "acknowledgeAll" });
      setDirection("back");
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      if (viaVoice && autoRead && ttsSupported) {
        const prev = recipe.steps[prevIdx];
        if (prev) speakSafely(prev.instruction);
      }
    },
    [currentStep, autoRead, ttsSupported, recipe.steps, speakSafely],
  );

  const jumpTo = (idx) => {
    if (idx === currentStep) {
      setShowAllSteps(false);
      return;
    }
    primeAudio();
    playStepAdvanceChime();
    cancelSpeech();
    dispatchTimers({ type: "acknowledgeAll" });
    setDirection(idx > currentStep ? "forward" : "back");
    setCurrentStep(idx);
    setShowAllSteps(false);
  };

  const exitToDetail = (saved) => {
    cancelSpeech();
    clearCookingSession();
    onExit?.({ saved: !!saved });
  };

  const requestQuit = () => {
    setQuitFromVoice(false);
    setShowQuitConfirm(true);
  };
  const confirmQuit = () => {
    cancelSpeech();
    clearCookingSession();
    onExit?.({ saved: false });
  };
  const cancelQuit = () => {
    setShowQuitConfirm(false);
    setQuitFromVoice(false);
  };

  // ─── Ingredient checkboxes ────────────────────────────────────────────────
  const toggleIngredient = (idx) => {
    setIngredientChecks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ─── Voice command dispatcher ─────────────────────────────────────────────
  const flashRecognized = useCallback(() => {
    setRecognizedFlash(true);
    clearTimeout(recognizedTimerRef.current);
    recognizedTimerRef.current = setTimeout(
      () => setRecognizedFlash(false),
      900,
    );
  }, []);

  const showToast = useCallback((message, kind = "recognized") => {
    setVoiceToast({ message, kind });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setVoiceToast(null), 1800);
  }, []);

  const handleTranscript = useCallback(
    (transcript) => {
      // Skip while we're talking (mic would hear our TTS)
      if (ttsMutedRef.current) return;

      // Skip while user is typing in a text input
      const ae = document.activeElement;
      const tag = ae?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || ae?.isContentEditable) {
        return;
      }

      const cmd = matchCommand(transcript);

      if (!cmd) {
        showToast(`Heard: "${transcript}" — didn't catch a command`, "unknown");
        return;
      }

      // Yes/no only meaningful while a voice-initiated quit-confirm is open
      if ((cmd.kind === "yes" || cmd.kind === "no") && !quitFromVoice) {
        showToast(`Heard: "${transcript}"`, "unknown");
        return;
      }

      showToast(`Heard: "${transcript}"`, "recognized");
      flashRecognized();

      switch (cmd.kind) {
        case "next":
          goNext({ viaVoice: true });
          break;
        case "back":
          goPrev({ viaVoice: true });
          break;
        case "repeat":
          if (step?.instruction) speakSafely(step.instruction);
          break;
        case "timer-start": {
          if (cmd.totalSeconds == null) {
            speakSafely("Sorry, I couldn't tell how long.");
            break;
          }
          dispatchTimers({
            type: "startWithSeconds",
            stepIndex: currentStep,
            totalSeconds: cmd.totalSeconds,
          });
          speakSafely(
            `Okay, timer started for ${describeDuration(cmd.totalSeconds)}.`,
          );
          break;
        }
        case "timer-stop": {
          const t = timers[currentStep];
          if (t?.running) {
            dispatchTimers({ type: "pause", stepIndex: currentStep });
            speakSafely("Timer paused.");
          } else if (t?.finished && !t?.acknowledged) {
            dispatchTimers({ type: "acknowledge", stepIndex: currentStep });
            speakSafely("Alarm stopped.");
          } else {
            speakSafely("No timer running.");
          }
          break;
        }
        case "ingredients":
          setShowIngredients(true);
          break;
        case "all-steps":
          setShowAllSteps(true);
          break;
        case "quit":
          setQuitFromVoice(true);
          setShowQuitConfirm(true);
          speakSafely("Are you sure?");
          break;
        case "yes":
          confirmQuit();
          break;
        case "no":
          cancelQuit();
          speakSafely("Got it, still cooking.");
          break;
        default:
          break;
      }
    },
    // confirmQuit/cancelQuit are stable enough; we include the values that
    // actually matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentStep,
      step,
      quitFromVoice,
      timers,
      goNext,
      goPrev,
      speakSafely,
      showToast,
      flashRecognized,
    ],
  );

  // Keep the latest handler in a ref so the recognizer can call into the
  // freshest closure without re-creating the recognizer on every render.
  const handleTranscriptRef = useRef(handleTranscript);
  useEffect(() => {
    handleTranscriptRef.current = handleTranscript;
  }, [handleTranscript]);

  // ─── Recognizer lifecycle ─────────────────────────────────────────────────
  const recognizerRef = useRef(null);
  useEffect(() => {
    if (!voiceSupported) return;
    const recognizer = createVoiceRecognizer({
      onTranscript: (t) => handleTranscriptRef.current?.(t),
      onError: (err) => {
        if (err === "not-allowed" || err === "service-not-allowed") {
          setPermissionDenied(true);
          setVoiceEnabled(false);
        } else if (err === "no-speech" || err === "aborted") {
          // ignore — these are common and benign
        } else {
          showToast(`Mic error: ${err}`, "unknown");
        }
      },
      onStateChange: (state) => setVoiceListening(state === "listening"),
    });
    recognizerRef.current = recognizer;
    return () => {
      recognizer?.stop();
      recognizerRef.current = null;
    };
  }, [voiceSupported, showToast]);

  // Start/stop based on toggle
  useEffect(() => {
    const rec = recognizerRef.current;
    if (!rec) return;
    if (voiceEnabled) {
      rec.start();
      primeVoices();
    } else {
      // recognizer's onend → onStateChange('idle') will flip voiceListening
      rec.stop();
    }
  }, [voiceEnabled]);

  // Cleanup TTS on unmount
  useEffect(() => () => cancelSpeech(), []);

  // Persist toggles
  useEffect(() => writeBoolPref(VOICE_ENABLED_KEY, voiceEnabled), [voiceEnabled]);
  useEffect(() => writeBoolPref(VOICE_AUTOREAD_KEY, autoRead), [autoRead]);

  // Mic-toggle handler — also shows the one-time privacy tooltip
  const onMicToggle = () => {
    if (!voiceEnabled) {
      // Turning ON
      try {
        if (!localStorage.getItem(VOICE_PRIVACY_SHOWN_KEY)) {
          setPrivacyTooltip(true);
          localStorage.setItem(VOICE_PRIVACY_SHOWN_KEY, "1");
        }
      } catch {
        /* ignore */
      }
      setVoiceEnabled(true);
    } else {
      setVoiceEnabled(false);
    }
  };

  // ─── Background-step timers (floating chip row) ───────────────────────────
  const backgroundTimers = useMemo(() => {
    return Object.entries(timers)
      .map(([k, t]) => ({ stepIndex: Number(k), ...t }))
      .filter(
        (t) =>
          t.stepIndex !== currentStep &&
          (t.running || (t.finished && !t.acknowledged)),
      )
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }, [timers, currentStep]);

  // ──────────────────────────────────────────────────────────────────────────
  if (pendingShare) {
    // Final logging happens AFTER the share preview dismisses so we can
    // capture the user's tags + note + (possibly updated) rating in one
    // recipe_cooked metadata blob.
    const finalize = (state) => {
      incrementCookedCount(recipe.id);
      const metadata = {};
      if (state.rating) metadata.rating = state.rating;
      if (state.note) metadata.note = state.note;
      if (Array.isArray(state.tags) && state.tags.length > 0) {
        metadata.ate_with = state.tags;
      }
      logEvent("recipe_cooked", {
        recipeId: recipe.id,
        recipeData: recipeEventData(recipe),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      if (state.rating) {
        logEvent("recipe_rated", {
          recipeId: recipe.id,
          recipeData: recipeEventData(recipe),
          metadata: { rating: state.rating },
        });
      }
      exitToDetail(true);
    };
    return (
      <div className="fixed inset-0 z-50 bg-cream overflow-y-auto">
        <div className="min-h-full flex flex-col items-center px-5 py-6">
          <ShareCardPreview
            recipe={recipe}
            initialRating={pendingShare.rating}
            onShared={(state) => finalize(state)}
            onSkip={(state) => finalize(state)}
          />
        </div>
      </div>
    );
  }

  if (showCelebration) {
    return (
      <CelebrationScreenWithAutoExit
        recipe={recipe}
        onSave={(rating) => {
          // Don't log recipe_cooked yet — defer to the share-preview
          // dismissal so we can include tags/note in the same metadata blob.
          setShowCelebration(false);
          setPendingShare({ rating });
        }}
        onSkip={() => exitToDetail(false)}
      />
    );
  }

  const stepTimer = timers[currentStep];

  return (
    <div className="fixed inset-0 z-50 cooking-grain flex flex-col animate-fadeIn">
      {/* Top bar */}
      <header className="flex items-center justify-between px-3 py-3 border-b border-stone-200/70 bg-white/60 backdrop-blur gap-2">
        <button
          type="button"
          onClick={requestQuit}
          aria-label="Exit cooking mode"
          className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xl flex items-center justify-center shrink-0"
        >
          ×
        </button>
        <div className="text-center text-sm leading-tight min-w-0 flex-1">
          <p className="font-semibold text-stone-900 truncate">
            {recipe.name}
          </p>
          <p className="text-stone-500 text-xs">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <MicToggle
            supported={voiceSupported}
            enabled={voiceEnabled}
            listening={voiceListening}
            recognized={recognizedFlash}
            onToggle={onMicToggle}
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Cooking menu"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xl flex items-center justify-center"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-52 rounded-xl bg-white shadow-xl border border-stone-200 overflow-hidden animate-fadeIn"
                >
                  <MenuItem
                    onClick={() => {
                      setShowAllSteps(true);
                      setShowMenu(false);
                    }}
                  >
                    Show all steps
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setShowIngredients(true);
                      setShowMenu(false);
                    }}
                  >
                    Show ingredients
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setShowSettings(true);
                      setShowMenu(false);
                    }}
                  >
                    Settings
                  </MenuItem>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Floating background timers */}
      {backgroundTimers.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2 justify-center">
          {backgroundTimers.map((t) => (
            <button
              key={t.stepIndex}
              type="button"
              onClick={() => {
                setDirection(t.stepIndex > currentStep ? "forward" : "back");
                setCurrentStep(t.stepIndex);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm tabular-nums transition
                ${
                  t.finished && !t.acknowledged
                    ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400 animate-pulse"
                    : "bg-white text-stone-700 border border-stone-200"
                }`}
            >
              Step {t.stepIndex + 1} ·{" "}
              {t.finished ? "done!" : formatShort(t.remaining)}
            </button>
          ))}
        </div>
      )}

      <VoiceToast message={voiceToast?.message} kind={voiceToast?.kind} />

      {/* Main step area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center">
        <StepDisplay
          step={step}
          animKey={currentStep}
          direction={direction}
          tip={
            wantsBeginnerTips && tips && tips[currentStep]
              ? tips[currentStep]
              : null
          }
        />
        {step?.timerMinutes != null && (
          <StepTimer
            timer={stepTimer}
            totalMinutes={step.timerMinutes}
            isLastStep={isLast}
            onStart={() => {
              primeAudio();
              dispatchTimers({
                type: "start",
                stepIndex: currentStep,
                totalMinutes: step.timerMinutes,
              });
            }}
            onPause={() =>
              dispatchTimers({ type: "pause", stepIndex: currentStep })
            }
            onResume={() => {
              primeAudio();
              dispatchTimers({
                type: "start",
                stepIndex: currentStep,
                totalMinutes: step.timerMinutes,
              });
            }}
            onReset={() =>
              dispatchTimers({ type: "reset", stepIndex: currentStep })
            }
            onAdvance={() => goNext()}
            onStopAlarm={() =>
              dispatchTimers({ type: "acknowledge", stepIndex: currentStep })
            }
          />
        )}
      </main>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrev={() => goPrev()}
        onNext={() => goNext()}
      />

      {showAllSteps && (
        <AllStepsSheet
          steps={recipe.steps}
          currentStep={currentStep}
          onJump={jumpTo}
          onClose={() => setShowAllSteps(false)}
        />
      )}
      {showIngredients && (
        <IngredientsSheet
          ingredients={recipe.ingredients}
          checks={ingredientChecks}
          onToggle={toggleIngredient}
          onClose={() => setShowIngredients(false)}
        />
      )}
      {showSettings && (
        <SettingsSheet
          voiceSupported={voiceSupported}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => onMicToggle()}
          autoRead={autoRead}
          onToggleAutoRead={() => setAutoRead((v) => !v)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showQuitConfirm && (
        <QuitConfirm onCancel={cancelQuit} onConfirm={confirmQuit} />
      )}

      {permissionDenied && (
        <PermissionDeniedModal
          onClose={() => setPermissionDenied(false)}
        />
      )}

      {privacyTooltip && (
        <PrivacyTooltip onClose={() => setPrivacyTooltip(false)} />
      )}
    </div>
  );
}

function MenuItem({ onClick, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-stone-50 text-stone-800 text-sm font-medium"
    >
      {children}
    </button>
  );
}

function QuitConfirm({ onCancel, onConfirm }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quit-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-slideUp">
        <h3 id="quit-title" className="text-xl font-bold text-stone-900">
          Quit cooking?
        </h3>
        <p className="text-stone-700 mt-2">Your progress will be lost.</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-3"
          >
            Keep cooking
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-tomato hover:bg-tomato-deep text-white font-semibold py-3"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsSheet({
  voiceSupported,
  voiceEnabled,
  onToggleVoice,
  autoRead,
  onToggleAutoRead,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full sm:max-w-md max-h-[80vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slideUp">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="font-bold text-lg text-stone-900">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xl leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {!voiceSupported ? (
            <p className="text-sm text-stone-600">
              Voice control isn't supported in this browser. Try Chrome on
              desktop/Android, or Safari on iOS 14.5+.
            </p>
          ) : (
            <>
              <ToggleRow
                label="Voice control"
                description="Hands-free commands while cooking."
                checked={voiceEnabled}
                onChange={onToggleVoice}
              />
              <ToggleRow
                label="Auto-read new steps aloud"
                description="When you say 'next', the new step is read to you."
                checked={autoRead}
                onChange={onToggleAutoRead}
                disabled={!voiceEnabled}
              />
              <div className="mt-2 rounded-2xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-600 leading-relaxed">
                <p className="font-semibold text-stone-700 mb-1">
                  About voice
                </p>
                <p>
                  Voice processing is handled by your browser. We never store
                  or transmit your voice.
                </p>
                <p className="mt-2">
                  Commands: <em>next</em> · <em>back</em> · <em>repeat</em> ·{" "}
                  <em>set timer for 5 minutes</em> · <em>stop timer</em> ·{" "}
                  <em>show ingredients</em> · <em>show all steps</em> ·{" "}
                  <em>quit</em>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-start justify-between gap-3 cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <span className="flex-1">
        <span className="block font-semibold text-stone-900">{label}</span>
        <span className="block text-sm text-stone-600 mt-0.5">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 w-5 h-5 accent-tomato"
      />
    </label>
  );
}

function PermissionDeniedModal({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-slideUp">
        <div className="text-4xl mb-2">🎤</div>
        <h3 className="text-xl font-bold text-stone-900">
          Microphone blocked
        </h3>
        <p className="text-stone-700 mt-2 text-sm leading-relaxed">
          Voice control needs microphone access. You can enable it in your
          browser settings — usually in the address-bar lock icon or in
          Settings → Privacy → Microphone.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-tomato hover:bg-tomato-deep text-white font-semibold py-3"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function PrivacyTooltip({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-slideUp">
        <div className="text-3xl mb-1">🔒</div>
        <h3 className="text-lg font-bold text-stone-900">A quick note</h3>
        <p className="text-stone-700 mt-2 text-sm leading-relaxed">
          Voice processing is handled by your browser. We never store or
          transmit your voice.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full bg-tomato hover:bg-tomato-deep text-white font-semibold py-2.5"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function CelebrationScreenWithAutoExit({ recipe, onSave, onSkip }) {
  useEffect(() => {
    const id = setTimeout(() => onSkip(), 5000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <CelebrationScreen recipe={recipe} onSave={onSave} onSkip={onSkip} />;
}

function formatShort(sec) {
  const safe = Math.max(0, sec);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
