import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import PenStroke from "../components/handDrawn/PenStroke.jsx";
import SurveyCard from "../components/onboarding/SurveyCard.jsx";
import SelectableCard from "../components/onboarding/SelectableCard.jsx";
import SelectableChip from "../components/onboarding/SelectableChip.jsx";
import SpiceSlider from "../components/onboarding/SpiceSlider.jsx";
import {
  DEFAULT_PREFERENCES,
  saveCompleted,
  savePartialAndSkip,
} from "../lib/preferences.js";

// 8 steps now that Card 8 (Ingredient Dislikes) was removed — that
// question is already covered by the custom-avoid text input on
// Card 3 (Allergies). Card 8 here is the Done screen.
const TOTAL_STEPS = 8;

const DIET_OPTIONS = [
  { value: "none", icon: "🍴", label: "No restrictions" },
  { value: "vegetarian", icon: "🥦", label: "Vegetarian" },
  { value: "vegan", icon: "🌱", label: "Vegan" },
  { value: "pescatarian", icon: "🐟", label: "Pescatarian" },
  { value: "keto", icon: "🥑", label: "Keto" },
  { value: "paleo", icon: "🥩", label: "Paleo" },
  { value: "gluten-free", icon: "🌾", label: "Gluten-free" },
  { value: "dairy-free", icon: "🥛", label: "Dairy-free" },
  { value: "halal", icon: "⚖️", label: "Halal" },
  { value: "kosher", icon: "✡️", label: "Kosher" },
];

const ALLERGY_OPTIONS = [
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Soy",
  "Wheat / gluten",
  "Shellfish",
  "Fish",
  "Sesame",
  "Pork",
  "Beef",
];

const CUISINE_OPTIONS = [
  { value: "italian", icon: "🍝", label: "Italian" },
  { value: "mexican", icon: "🌮", label: "Mexican" },
  { value: "chinese", icon: "🥡", label: "Chinese" },
  { value: "japanese", icon: "🍣", label: "Japanese" },
  { value: "thai", icon: "🍜", label: "Thai" },
  { value: "indian", icon: "🍛", label: "Indian" },
  { value: "mediterranean", icon: "🥙", label: "Mediterranean" },
  { value: "american", icon: "🍔", label: "American" },
  { value: "french", icon: "🥖", label: "French" },
  { value: "korean", icon: "🍱", label: "Korean" },
  { value: "vietnamese", icon: "🍲", label: "Vietnamese" },
  { value: "middle-eastern", icon: "🧆", label: "Middle Eastern" },
  { value: "bbq", icon: "🔥", label: "BBQ" },
  { value: "comfort", icon: "🍲", label: "Comfort food" },
  { value: "healthy", icon: "🥗", label: "Healthy / clean" },
  { value: "fast", icon: "⏱️", label: "Fast & easy" },
];

const SKILL_OPTIONS = [
  {
    value: "beginner",
    icon: "🐣",
    title: "Beginner",
    subtitle: "I'm learning the basics",
  },
  {
    value: "intermediate",
    icon: "🍳",
    title: "Intermediate",
    subtitle: "I can follow recipes confidently",
  },
  {
    value: "advanced",
    icon: "👨‍🍳",
    title: "Advanced",
    subtitle: "I love experimenting in the kitchen",
  },
];

const TIME_OPTIONS = [
  {
    value: "under-20",
    icon: "⚡",
    title: "Under 20 minutes",
    subtitle: "I want it fast",
  },
  {
    value: "20-45",
    icon: "🍲",
    title: "20–45 minutes",
    subtitle: "Standard weeknight cooking",
  },
  {
    value: "over-60",
    icon: "🥘",
    title: "Over an hour",
    subtitle: "I love a project recipe",
  },
  {
    value: "mixed",
    icon: "🤷",
    title: "It depends",
    subtitle: "Mix it up",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [answers, setAnswers] = useState(() => ({ ...DEFAULT_PREFERENCES }));
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

  // Scroll to top every time the step changes so each card starts at the
  // top regardless of how tall the previous one was.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const update = (patch) => setAnswers((prev) => ({ ...prev, ...patch }));

  const goNext = () => {
    setDirection("forward");
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const goBack = () => {
    setDirection("back");
    setStep((s) => Math.max(1, s - 1));
  };

  const requestSkip = () => setSkipConfirmOpen(true);
  const confirmSkip = () => {
    savePartialAndSkip(answers);
    navigate("/", { replace: true });
  };
  const cancelSkip = () => setSkipConfirmOpen(false);

  const handleFinish = () => {
    saveCompleted(answers);
    navigate("/", { replace: true });
  };

  return (
    <>
      <PaperBackdrop />
      <PageShell>
        <div className="relative z-10 flex flex-col flex-1 min-h-[calc(100dvh-80px)]">
          {step === 1 && (
            <Card1Welcome
              key="step-1"
              direction={direction}
              onNext={goNext}
              onSkip={requestSkip}
            />
          )}
          {step === 2 && (
            <Card2Diet
              key="step-2"
              direction={direction}
              answers={answers}
              update={update}
              onNext={goNext}
              onBack={goBack}
              onSkip={requestSkip}
            />
          )}
          {step === 3 && (
            <Card3Allergies
              key="step-3"
              direction={direction}
              answers={answers}
              update={update}
              onNext={goNext}
              onBack={goBack}
              onSkip={requestSkip}
            />
          )}
          {step === 4 && (
            <Card4Spice
              key="step-4"
              direction={direction}
              answers={answers}
              update={update}
              onNext={goNext}
              onBack={goBack}
              onSkip={requestSkip}
            />
          )}
          {step === 5 && (
            <Card5Cuisines
              key="step-5"
              direction={direction}
              answers={answers}
              update={update}
              onNext={goNext}
              onBack={goBack}
              onSkip={requestSkip}
            />
          )}
          {step === 6 && (
            <Card6Skill
              key="step-6"
              direction={direction}
              answers={answers}
              update={update}
              onNext={goNext}
              onBack={goBack}
              onSkip={requestSkip}
            />
          )}
          {step === 7 && (
            <Card7Time
              key="step-7"
              direction={direction}
              answers={answers}
              update={update}
              onNext={goNext}
              onBack={goBack}
              onSkip={requestSkip}
            />
          )}
          {step === 8 && (
            <Card8Done
              key="step-8"
              direction={direction}
              onFinish={handleFinish}
            />
          )}
        </div>
      </PageShell>

      {skipConfirmOpen && (
        <SkipConfirmModal onCancel={cancelSkip} onConfirm={confirmSkip} />
      )}
    </>
  );
}

function SkipConfirmModal({ onCancel, onConfirm }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-label="Keep the survey going"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-sm brut-card p-6 animate-slideUp">
        <h3 className="font-serif text-2xl font-extrabold text-ink leading-tight">
          Skip the whole survey?
        </h3>
        <p className="font-body text-sm text-mocha mt-2 leading-snug">
          We'll use generic recipes until you set this later in Settings.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg py-2.5 shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] transition-transform"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 font-serif font-bold text-paper-warm bg-ink border-2 border-ink rounded-lg py-2.5 shadow-[3px_3px_0_0_var(--color-terracotta)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-terracotta)] transition-transform"
          >
            Skip anyway
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Card 1: Welcome ──────────────────────────────────────────────────── */

function Card1Welcome({ direction, onNext, onSkip }) {
  return (
    <SurveyCard
      step={1}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      nextLabel="Let's go"
      hideBack
    >
      <div className="flex-1 flex flex-col items-center text-center justify-center gap-5">
        <SteamingPot />
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[1.02] tracking-tight">
          Welcome to{" "}
          <span className="italic text-terracotta">What's Cookin</span>
        </h1>
        <p className="font-script text-xl sm:text-[22px] text-mocha leading-relaxed max-w-xs">
          Let's quickly learn your taste so the recipes we suggest actually fit
          you.
        </p>
        <PenStroke width={96} />
        <p className="font-script text-xl text-mocha/85 leading-none">
          takes about 60 seconds
        </p>
      </div>
    </SurveyCard>
  );
}

/* ── Card 2: Diet ─────────────────────────────────────────────────────── */

function Card2Diet({ direction, answers, update, onNext, onBack, onSkip }) {
  return (
    <SurveyCard
      step={2}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.diet}
      disabledHint="pick one to continue"
    >
      <Header
        title="Do you follow any of these?"
        sub="Pick one — you can change this later"
      />
      <div className="mt-5 flex flex-col gap-2.5">
        {DIET_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            title={opt.label}
            selected={answers.diet === opt.value}
            onSelect={() => update({ diet: opt.value })}
          />
        ))}
      </div>
    </SurveyCard>
  );
}

/* ── Card 3: Allergies ───────────────────────────────────────────────── */

function Card3Allergies({ direction, answers, update, onNext, onBack, onSkip }) {
  const [draft, setDraft] = useState("");

  const toggleAllergy = (label) => {
    const lower = label.toLowerCase();
    const has = answers.allergies.includes(lower);
    // Selecting any allergy chip mutually excludes the "None" toggle.
    update({
      noAllergies: false,
      allergies: has
        ? answers.allergies.filter((a) => a !== lower)
        : [...answers.allergies, lower],
    });
  };

  const addCustom = () => {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    if (answers.customAvoidList.includes(value)) {
      setDraft("");
      return;
    }
    update({
      noAllergies: false,
      customAvoidList: [...answers.customAvoidList, value],
    });
    setDraft("");
  };

  const removeCustom = (value) => {
    update({
      customAvoidList: answers.customAvoidList.filter((v) => v !== value),
    });
  };

  const handleNone = () => {
    // Toggling "None — eat it all" both clears the chips/custom list and
    // sets the explicit "no allergies" flag so we know the user has
    // affirmatively answered (rather than just left the card blank).
    update({ noAllergies: true, allergies: [], customAvoidList: [] });
  };

  const hasAny =
    answers.allergies.length > 0 || answers.customAvoidList.length > 0;
  const nextDisabled = !answers.noAllergies && !hasAny;

  return (
    <SurveyCard
      step={3}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={nextDisabled}
      disabledHint="pick at least one, or tap 'None — eat it all'"
    >
      <Header
        title="Anything you absolutely don't eat?"
        sub="Multi-select — we'll never suggest recipes with these"
      />

      <div className="mt-4">
        <button
          type="button"
          onClick={handleNone}
          className={`select-chip ${answers.noAllergies ? "is-selected" : ""}`}
        >
          <span aria-hidden="true">✨</span>
          <span>None — eat it all</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ALLERGY_OPTIONS.map((label) => {
          const lower = label.toLowerCase();
          return (
            <SelectableChip
              key={lower}
              label={label}
              selected={answers.allergies.includes(lower)}
              onToggle={() => toggleAllergy(label)}
            />
          );
        })}
      </div>

      <div className="mt-5">
        <label className="block font-serif font-semibold text-[17px] text-ink mb-1.5 leading-snug">
          Anything else? Type it in
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="e.g. cilantro, blue cheese"
            className="ink-input flex-1"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={addCustom}
            className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-4 shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_var(--color-ink)] transition-transform"
          >
            Add
          </button>
        </div>
        {answers.customAvoidList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {answers.customAvoidList.map((value) => (
              <SelectableChip
                key={value}
                label={value}
                selected={true}
                removable
                onRemove={() => removeCustom(value)}
              />
            ))}
          </div>
        )}
      </div>
    </SurveyCard>
  );
}

/* ── Card 4: Spice ────────────────────────────────────────────────────── */

function Card4Spice({ direction, answers, update, onNext, onBack, onSkip }) {
  return (
    <SurveyCard
      step={4}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.spiceLevel}
      disabledHint="tap a heat level to continue"
    >
      <Header title="How spicy do you like it?" />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
        <div className="w-full">
          <SpiceSlider
            value={answers.spiceLevel}
            onChange={(value) => update({ spiceLevel: value })}
          />
        </div>
        <p className="font-script text-lg text-mocha/85 text-center leading-snug">
          we'll adjust spice levels in recipes to match
        </p>
      </div>
    </SurveyCard>
  );
}

/* ── Card 5: Cuisines ────────────────────────────────────────────────── */

function Card5Cuisines({ direction, answers, update, onNext, onBack, onSkip }) {
  const toggleCuisine = (value) => {
    const has = answers.favoriteCuisines.includes(value);
    update({
      favoriteCuisines: has
        ? answers.favoriteCuisines.filter((c) => c !== value)
        : [...answers.favoriteCuisines, value],
    });
  };

  return (
    <SurveyCard
      step={5}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={answers.favoriteCuisines.length === 0}
      disabledHint="pick at least one to continue"
    >
      <Header
        title="What kinds of food do you love?"
        sub="Pick a few — we'll lean toward these"
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {CUISINE_OPTIONS.map((opt) => (
          <SelectableChip
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            selected={answers.favoriteCuisines.includes(opt.value)}
            onToggle={() => toggleCuisine(opt.value)}
          />
        ))}
      </div>
      <p className="font-script text-base text-mocha/80 mt-4 leading-none">
        {answers.favoriteCuisines.length === 0
          ? "pick a few — at least one to continue"
          : `${answers.favoriteCuisines.length} picked — keep going if you like`}
      </p>
    </SurveyCard>
  );
}

/* ── Card 6: Skill ────────────────────────────────────────────────────── */

function Card6Skill({ direction, answers, update, onNext, onBack, onSkip }) {
  return (
    <SurveyCard
      step={6}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.skillLevel}
      disabledHint="pick one to continue"
    >
      <Header title="How would you describe your cooking?" />
      <div className="mt-5 flex flex-col gap-3">
        {SKILL_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={answers.skillLevel === opt.value}
            onSelect={() => update({ skillLevel: opt.value })}
          />
        ))}
      </div>
    </SurveyCard>
  );
}

/* ── Card 7: Time ─────────────────────────────────────────────────────── */

function Card7Time({ direction, answers, update, onNext, onBack, onSkip }) {
  return (
    <SurveyCard
      step={7}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      onSkip={onSkip}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.timePreference}
      disabledHint="pick one to continue"
    >
      <Header
        title="How much time do you usually have to cook?"
        sub="We'll prioritize recipes that fit"
      />
      <div className="mt-5 flex flex-col gap-3">
        {TIME_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={answers.timePreference === opt.value}
            onSelect={() => update({ timePreference: opt.value })}
          />
        ))}
      </div>
    </SurveyCard>
  );
}

/* ── Card 8: Done ─────────────────────────────────────────────────────── */

function Card8Done({ direction, onFinish }) {
  return (
    <SurveyCard
      step={8}
      totalSteps={TOTAL_STEPS}
      direction={direction}
      hideSkip
      hideBack
      onNext={onFinish}
      nextLabel="Take me to the app"
    >
      <Confetti />
      <div className="flex-1 flex flex-col items-center text-center justify-center gap-5 relative">
        <BouncingPot />
        <h1 className="font-serif text-5xl sm:text-6xl font-extrabold text-ink leading-[1] tracking-tight">
          All <span className="italic text-terracotta">set!</span>
        </h1>
        <p className="font-script text-xl sm:text-[22px] text-mocha leading-relaxed max-w-xs">
          We're ready to cook up some ideas for you
        </p>
        <PenStroke width={96} />
        <p className="font-script text-lg text-mocha/85 text-center leading-snug max-w-xs">
          you can change all of this anytime in settings
        </p>
      </div>
    </SurveyCard>
  );
}

/* ── Shared header ────────────────────────────────────────────────────── */

function Header({ title, sub }) {
  return (
    <header className="text-center">
      <h2 className="font-serif text-3xl sm:text-[34px] font-extrabold text-ink leading-[1.05] tracking-tight">
        {title}
      </h2>
      {sub && (
        <p className="font-script text-xl sm:text-[22px] text-mocha mt-2 leading-relaxed">
          {sub}
        </p>
      )}
    </header>
  );
}

/* ── Decorations ─────────────────────────────────────────────────────── */

function SteamingPot({ animated = false }) {
  return (
    <div className={`relative ${animated ? "animate-bounce" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 72" className="w-20 h-24 text-ink">
        {/* steam */}
        <path
          d="M22 8 Q 18 14, 22 20 Q 26 26, 22 32"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M32 4 Q 28 10, 32 16 Q 36 22, 32 28"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M42 8 Q 38 14, 42 20 Q 46 26, 42 32"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* pot body */}
        <rect
          x="8"
          y="36"
          width="48"
          height="28"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.4"
          fill="#fcf6e8"
        />
        {/* lid */}
        <rect
          x="4"
          y="32"
          width="56"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="2.4"
          fill="#fcf6e8"
        />
        {/* knob */}
        <circle
          cx="32"
          cy="29"
          r="2.5"
          stroke="currentColor"
          strokeWidth="2"
          fill="#c4521a"
        />
      </svg>
    </div>
  );
}

function BouncingPot() {
  return (
    <div className="animate-[bounce_1.6s_ease-in-out_infinite]">
      <SteamingPot />
    </div>
  );
}

// Confetti — pieces are rendered imperatively into the DOM after mount
// so the render path stays pure (Math.random lives inside the effect)
// and no setState fires during render.
function Confetti() {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return undefined;

    const colors = ["#c4521a", "#d4a017", "#87a16f", "#2b2118", "#fcf6e8"];
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.width = `${6 + Math.random() * 6}px`;
      piece.style.height = `${10 + Math.random() * 8}px`;
      piece.style.animationDelay = `${Math.random() * 600}ms`;
      piece.style.setProperty("--cx", `${(Math.random() - 0.5) * 200}px`);
      piece.style.border = "1px solid #2b2118";
      host.appendChild(piece);
    }

    const t = window.setTimeout(() => {
      host.style.display = "none";
    }, 3200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    />
  );
}
