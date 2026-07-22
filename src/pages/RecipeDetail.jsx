import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import CategoryBadge from "../components/CategoryBadge.jsx";
import StepTimer from "../components/StepTimer.jsx";
import RecipeMenu from "../components/recipes/RecipeMenu.jsx";
import ShareButton from "../components/sharing/ShareButton.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import WobblyUnderline from "../components/handDrawn/WobblyUnderline.jsx";
import HeartIcon from "../components/handDrawn/HeartIcon.jsx";
import { getEmojiForIngredient } from "../lib/ingredientEmojis.js";
import CookingMode from "./CookingMode.jsx";
import {
  loadCookingSession,
  getCookedCount,
  clearCookingSession,
} from "../lib/cookingState.js";
import { logEvent } from "../lib/eventTracker.js";
import { addToBlocklist } from "../lib/blocklist.js";
import { isFavorite, toggleFavorite } from "../lib/favorites.js";
import { addRecipeIngredients, notify as notifyGrocery } from "../lib/groceryList.js";
import AddedToast from "../components/grocery/AddedToast.jsx";

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

const PANTRY_CHECK_PREFIX = "whats-cookin-pantry-checks:";

function loadPantryChecks(recipeId) {
  try {
    const raw = localStorage.getItem(PANTRY_CHECK_PREFIX + recipeId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function savePantryChecks(recipeId, set) {
  try {
    localStorage.setItem(
      PANTRY_CHECK_PREFIX + recipeId,
      JSON.stringify([...set]),
    );
  } catch {
    /* ignore */
  }
}

export default function RecipeDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();

  const [savedSession, setSavedSession] = useState(() => {
    const s = loadCookingSession();
    return s && s.recipeId === routeId ? s : null;
  });

  // Always prefer a recipe handed to us via navigation state (e.g. tapping the
  // "last cooked" polaroid) before falling back to a resumable cooking session.
  console.log(
    "[RecipeDetail] location.state?.recipe:",
    location.state?.recipe,
    "| savedSession recipe:",
    savedSession?.recipe,
  );
  const recipe = location.state?.recipe || savedSession?.recipe || null;

  const [cooking, setCooking] = useState(false);
  const [resumeStartStep, setResumeStartStep] = useState(0);
  const [resumeTimers, setResumeTimers] = useState(null);
  const [resumeChecks, setResumeChecks] = useState([]);
  const [cookedCount, setCookedCount] = useState(() =>
    recipe ? getCookedCount(recipe.id) : 0,
  );
  const [favorited, setFavorited] = useState(() =>
    recipe ? isFavorite(recipe.id) : false,
  );
  const [heartPop, setHeartPop] = useState(false);
  const [groceryToast, setGroceryToast] = useState(null);

  const addToGroceryList = () => {
    if (!recipe) return;
    const { addedCount, mergedCount } = addRecipeIngredients(recipe);
    notifyGrocery();
    try {
      if (navigator.vibrate) navigator.vibrate([6, 30, 6]);
    } catch {
      /* ignore */
    }
    setGroceryToast({ addedCount, mergedCount });
    logEvent("recipe_added_to_grocery", {
      recipeId: recipe.id,
      recipeData: recipeEventData(recipe),
      addedCount,
      mergedCount,
    });
  };

  const hasResumable =
    savedSession &&
    savedSession.recipeId === (recipe?.id ?? routeId) &&
    typeof savedSession.currentStep === "number" &&
    savedSession.currentStep >= 0;

  const viewedAtRef = useRef(null);
  useEffect(() => {
    if (!recipe) return undefined;
    viewedAtRef.current = Date.now();
    logEvent("recipe_viewed", {
      recipeId: recipe.id,
      recipeData: recipeEventData(recipe),
    });
    return () => {
      if (viewedAtRef.current != null) {
        logEvent("recipe_time_on_detail", {
          recipeId: recipe.id,
          durationMs: Date.now() - viewedAtRef.current,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]);

  const handleHeart = () => {
    if (!recipe) return;
    const nowFav = toggleFavorite(recipe);
    setFavorited(nowFav);
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 350);
    logEvent(nowFav ? "recipe_hearted" : "recipe_unhearted", {
      recipeId: recipe.id,
      recipeData: recipeEventData(recipe),
    });
  };

  const handleDontSuggest = () => {
    if (!recipe) return;
    addToBlocklist(recipe);
    logEvent("recipe_dont_suggest", {
      recipeId: recipe.id,
      recipeData: recipeEventData(recipe),
    });
    navigate(-1);
  };

  const handleShowSimilar = () => {
    if (!recipe) return;
    logEvent("recipe_show_similar_clicked", {
      recipeId: recipe.id,
      recipeData: recipeEventData(recipe),
    });
    // No current-ingredient context from the detail page — generate
    // unconstrained variations based on the reference recipe alone.
    navigate("/recipes", {
      state: { ingredients: [], similarTo: recipe },
    });
  };

  if (!recipe) {
    return (
      <>
        <PaperBackdrop />
        <PageShell>
          <div className="relative z-10 flex flex-col flex-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="self-start font-body text-sm text-mocha hover:text-ink mb-3"
            >
              ← Back
            </button>
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
              {location.state?.incompleteRecipe ? (
                <>
                  <p className="font-script text-2xl text-mocha leading-snug">
                    This recipe wasn't saved completely — try cooking something
                    new!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="font-serif font-bold text-white bg-terracotta border-2 border-ink rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] transition-transform"
                  >
                    🏠 Go home
                  </button>
                </>
              ) : (
                <>
                  <p className="font-script text-2xl text-mocha leading-snug">
                    that recipe wandered off
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="font-serif font-bold text-white bg-terracotta border-2 border-ink rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] transition-transform"
                    >
                      🏠 Go home
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] transition-transform"
                    >
                      ← Go back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </PageShell>
      </>
    );
  }

  const startCooking = (step = 0, timers = null, checks = []) => {
    setResumeStartStep(step);
    setResumeTimers(timers);
    setResumeChecks(checks);
    setCooking(true);
  };

  const dismissResume = () => {
    clearCookingSession();
    setSavedSession(null);
  };

  if (cooking) {
    return (
      <CookingMode
        recipe={recipe}
        initialStep={resumeStartStep}
        initialTimers={resumeTimers}
        initialIngredientChecks={resumeChecks}
        onExit={() => {
          setCooking(false);
          setSavedSession(null);
          if (recipe) setCookedCount(getCookedCount(recipe.id));
        }}
      />
    );
  }

  return (
    <>
      <PaperBackdrop />

      <PageShell>
        <div className="relative z-10 flex flex-col">
          {/* Top bar — back + heart + share + menu */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="font-body text-sm text-mocha hover:text-ink"
            >
              ← Back
            </button>
            <div className="flex items-center gap-1">
              <ShareButton recipe={recipe} variant="icon" />
              <button
                type="button"
                onClick={handleHeart}
                aria-label={
                  favorited ? "Remove from favorites" : "Save to favorites"
                }
                aria-pressed={favorited}
                className={`w-10 h-10 rounded-full hover:bg-ink/5 flex items-center justify-center ${
                  favorited ? "text-terracotta" : "text-ink"
                } ${heartPop ? "heart-pop" : ""}`}
              >
                <HeartIcon filled={favorited} size={22} />
              </button>
              <RecipeMenu
                size="lg"
                onDontSuggest={handleDontSuggest}
                onShowSimilar={handleShowSimilar}
              />
            </div>
          </div>

          {hasResumable && (
            <div className="mt-1 mb-4 brut-card p-4 flex items-start gap-3 border-terracotta">
              <div className="text-2xl shrink-0" aria-hidden="true">🍳</div>
              <div className="flex-1">
                <p className="font-serif text-lg font-bold text-ink leading-snug">
                  Resume cooking?
                </p>
                <p className="font-body text-sm text-mocha mt-0.5">
                  You were on step {savedSession.currentStep + 1} of{" "}
                  {recipe.steps.length}.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      startCooking(
                        savedSession.currentStep,
                        savedSession.timers || null,
                        savedSession.ingredientChecks || [],
                      )
                    }
                    className="font-serif font-bold text-paper-warm bg-terracotta border-2 border-ink rounded-md px-4 py-1.5 text-sm shadow-[2px_2px_0_0_var(--color-ink)]"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={dismissResume}
                    className="font-body font-semibold text-ink bg-paper-warm border-2 border-ink rounded-md px-4 py-1.5 text-sm shadow-[2px_2px_0_0_var(--color-ink)]"
                  >
                    Start over
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero */}
          <header className="text-center">
            <div
              className="text-8xl inline-block"
              style={{ transform: "rotate(-3deg)" }}
              aria-hidden="true"
            >
              {recipe.emoji}
            </div>
            <h2 className="font-serif text-[44px] sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight mt-4 px-2">
              {recipe.name}
            </h2>
            {recipe.tagline && (
              <p className="font-script italic text-xl text-terracotta mt-3 px-6 leading-snug">
                {recipe.tagline}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <CategoryBadge category={recipe.category} />
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {recipe.totalTimeMinutes != null && (
                <span className="ink-pill">⏱ {recipe.totalTimeMinutes} min</span>
              )}
              <span className="ink-pill capitalize">{recipe.difficulty}</span>
              {recipe.servings != null && (
                <span className="ink-pill">serves {recipe.servings}</span>
              )}
            </div>

            {cookedCount > 0 && (
              <p className="font-script text-lg text-sage mt-4 leading-none">
                you've cooked this {cookedCount}{" "}
                {cookedCount === 1 ? "time" : "times"} ✓
              </p>
            )}
          </header>

          {/* Ingredients */}
          <Section title="Ingredients">
            <IngredientsList recipe={recipe} />
            <button
              type="button"
              onClick={addToGroceryList}
              className="mt-4 w-full font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg py-3 shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_var(--color-ink)] transition-transform flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">🛒</span>
              <span>+ Add ingredients to grocery list</span>
            </button>
          </Section>

          {/* Nutrition */}
          {recipe.nutrition && <NutritionFacts nutrition={recipe.nutrition} />}

          {/* Steps */}
          <Section title="Instructions">
            <ol className="flex flex-col gap-5">
              {recipe.steps.map((s) => (
                <li key={s.step} className="flex gap-4">
                  <HandDrawnStepNumber n={s.step} />
                  <div className="flex-1 pt-1">
                    <p className="font-body text-base text-ink leading-relaxed">
                      {s.instruction}
                    </p>
                    {s.timerMinutes != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-body text-xs text-mocha">
                          ⏱ {s.timerMinutes} min
                        </span>
                        <StepTimer
                          minutes={s.timerMinutes}
                          label={`Step ${s.step} timer`}
                        />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* Tip (margin note style) */}
          {recipe.tips && (
            <section className="mt-7 ml-2 pl-4 border-l-2 border-terracotta/50">
              <span className="font-script italic text-terracotta text-lg leading-none">
                Tip:
              </span>{" "}
              <span className="font-body text-base text-ink/85 italic leading-relaxed">
                {recipe.tips}
              </span>
            </section>
          )}

          {/* Bottom spacer so sticky CTA doesn't cover content */}
          <div className="h-28" />
        </div>
      </PageShell>

      {/* Sticky Start Cooking CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-5 pb-5 pt-3 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            type="button"
            onClick={() => startCooking(0, null, [])}
            className="brut-button justify-center"
          >
            <span className="font-serif text-xl font-bold">Start cooking</span>
            <BigArrow />
          </button>
        </div>
      </div>

      {groceryToast && (
        <AddedToast
          addedCount={groceryToast.addedCount}
          mergedCount={groceryToast.mergedCount}
          onView={() => {
            setGroceryToast(null);
            navigate("/grocery");
          }}
          onClose={() => setGroceryToast(null)}
        />
      )}
    </>
  );
}

/* ── Section heading with wobbly underline ──────────────────────────────── */

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h3 className="relative inline-block mb-4">
        <span className="font-serif text-2xl font-extrabold text-ink leading-none">
          {title}
        </span>
        <WobblyUnderline color="text-terracotta" offsetClass="-bottom-2" height={8} />
      </h3>
      {children}
    </section>
  );
}

/* ── AI-estimated nutrition facts (between ingredients and steps) ────────── */

function NutritionFacts({ nutrition }) {
  const rows = [
    nutrition.calories != null && {
      emoji: "🔥",
      label: "Calories",
      value: `~${nutrition.calories} kcal`,
    },
    nutrition.protein != null && {
      emoji: "💪",
      label: "Protein",
      value: `~${nutrition.protein}g`,
    },
    nutrition.carbs != null && {
      emoji: "🍞",
      label: "Carbs",
      value: `~${nutrition.carbs}g`,
    },
    nutrition.fat != null && { emoji: "🫒", label: "Fat", value: `~${nutrition.fat}g` },
    nutrition.fiber != null && {
      emoji: "🌾",
      label: "Fiber",
      value: `~${nutrition.fiber}g`,
    },
    nutrition.sugar != null && {
      emoji: "🍬",
      label: "Sugar",
      value: `~${nutrition.sugar}g`,
    },
    nutrition.sodium != null && {
      emoji: "🧂",
      label: "Sodium",
      value: `~${nutrition.sodium}mg`,
    },
    nutrition.servingSize && {
      emoji: "🍽️",
      label: "Serving",
      value: nutrition.servingSize,
    },
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <Section title="Nutrition Facts">
      <p className="font-script text-lg text-mocha -mt-2 mb-3 leading-none">
        per serving — these are estimates
      </p>
      <div className="border-2 border-ink rounded-xl overflow-hidden shadow-[4px_4px_0_0_var(--color-ink)]">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              background:
                i % 2 === 0 ? "var(--color-cream)" : "var(--color-paper-warm)",
            }}
          >
            <span className="font-body text-ink flex items-center gap-2">
              <span aria-hidden="true">{row.emoji}</span>
              {row.label}
            </span>
            <span className="font-serif font-bold text-ink">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="font-script text-xs text-mocha/70 mt-2 text-center">
        ⚠️ these are estimates only — not exact values. for precise nutrition
        info use a dedicated app like MyFitnessPal.
      </p>
    </Section>
  );
}

/* ── Ingredient list with square checkboxes (persisted) ─────────────────── */

function IngredientsList({ recipe }) {
  const [checks, setChecks] = useState(() => loadPantryChecks(recipe.id));

  const toggle = (idx) => {
    setChecks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      savePantryChecks(recipe.id, next);
      return next;
    });
  };

  return (
    <ul className="flex flex-col">
      {recipe.ingredients.map((ing, i) => {
        const checked = checks.has(i);
        const amountUnit = [ing.amount, ing.unit]
          .filter(Boolean)
          .join(" ")
          .trim();
        const bg = i % 2 === 0 ? "" : "bg-ink/[0.025]";
        return (
          <li key={`${ing.name}-${i}`} className={`rounded-md ${bg}`}>
            <label className="flex items-center gap-3 cursor-pointer select-none px-2 py-2.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(i)}
                className="ink-checkbox"
              />
              <span
                className="text-lg leading-none shrink-0"
                aria-hidden="true"
              >
                {getEmojiForIngredient(ing.name)}
              </span>
              <span
                className={`flex-1 font-body text-base leading-snug ${
                  checked ? "text-mocha line-through" : "text-ink"
                }`}
              >
                {amountUnit && (
                  <span className="font-semibold">{amountUnit} </span>
                )}
                <span className="capitalize">{ing.name}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Hand-drawn-style step number circle ────────────────────────────────── */

function HandDrawnStepNumber({ n }) {
  return (
    <span className="relative inline-flex items-center justify-center w-10 h-10 shrink-0">
      <svg
        className="absolute inset-0 w-full h-full text-ink"
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <path
          d="M20 4 C 32 4, 36 12, 36 20 C 36 30, 28 36, 20 36 C 9 36, 4 28, 4 19 C 4 10, 9 4, 20 4 Z"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative font-serif text-base font-extrabold text-ink">
        {n}
      </span>
    </span>
  );
}

function BigArrow() {
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
