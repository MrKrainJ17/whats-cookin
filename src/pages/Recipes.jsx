import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import CategoryBadge from "../components/CategoryBadge.jsx";
import CookingLoader from "../components/CookingLoader.jsx";
import RecipeMenu from "../components/recipes/RecipeMenu.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import HandBack from "../components/handDrawn/HandBack.jsx";
import {
  generateRecipes,
  generateSimilarRecipes,
  RecipeGenerationError,
} from "../lib/generateRecipes.js";
import { logEvent } from "../lib/eventTracker.js";
import { addToBlocklist } from "../lib/blocklist.js";
import { addRecipeIngredients, notify as notifyGrocery } from "../lib/groceryList.js";
import { getNutritionBadges } from "../lib/nutrition.js";
import AddedToast from "../components/grocery/AddedToast.jsx";

const TARGET_RECIPE_COUNT = 5;

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

export default function Recipes() {
  const navigate = useNavigate();
  const location = useLocation();
  const ingredients = Array.isArray(location.state?.ingredients)
    ? location.state.ingredients
    : null;
  const preferences = location.state?.preferences;
  const autoConfirmed = location.state?.autoConfirmed === true;
  const richIngredients = Array.isArray(location.state?.richIngredients)
    ? location.state.richIngredients
    : null;
  // When set, we're in "show similar" mode — generate variations on this
  // reference recipe instead of cooking from a fresh ingredient list.
  const similarTo = location.state?.similarTo ?? null;

  const [status, setStatus] = useState("loading");
  const [recipes, setRecipes] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [groceryToast, setGroceryToast] = useState(null);

  const handleQuickAdd = (recipe) => {
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
      via: "quick-add",
    });
  };

  const viewedIdsRef = useRef(new Set());
  const generatedRecipesRef = useRef([]);
  const loggedGeneratedRef = useRef(new Set());

  useEffect(() => {
    // In similar mode we don't require ingredients (user could come from a
    // saved recipe with no current pantry context). In normal mode we do.
    if (!similarTo && (!ingredients || ingredients.length === 0)) return;
    let cancelled = false;

    const onStreamed = (recipe) => {
      if (cancelled) return;
      setRecipes((prev) =>
        prev.some((r) => r.id === recipe.id) ? prev : [...prev, recipe],
      );
      if (!loggedGeneratedRef.current.has(recipe.id)) {
        loggedGeneratedRef.current.add(recipe.id);
        generatedRecipesRef.current.push(recipe);
        logEvent("recipe_generated", {
          recipeId: recipe.id,
          recipeData: recipeEventData(recipe),
        });
      }
    };

    (async () => {
      try {
        const final = similarTo
          ? await generateSimilarRecipes(similarTo, ingredients ?? [], preferences, {
              onRecipe: onStreamed,
            })
          : await generateRecipes(ingredients, preferences, {
              onRecipe: onStreamed,
            });
        if (cancelled) return;
        setRecipes(final);
        for (const recipe of final) {
          if (!loggedGeneratedRef.current.has(recipe.id)) {
            loggedGeneratedRef.current.add(recipe.id);
            generatedRecipesRef.current.push(recipe);
            logEvent("recipe_generated", {
              recipeId: recipe.id,
              recipeData: recipeEventData(recipe),
            });
          }
        }
        setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ingredients, preferences, attempt, similarTo]);

  useEffect(() => {
    return () => {
      const generated = generatedRecipesRef.current;
      const viewed = viewedIdsRef.current;
      for (const recipe of generated) {
        if (viewed.has(recipe.id)) continue;
        logEvent("recipe_skipped", {
          recipeId: recipe.id,
          recipeData: recipeEventData(recipe),
        });
      }
    };
  }, []);

  const retry = () => {
    setStatus("loading");
    setError(null);
    setRecipes([]);
    setHiddenIds(new Set());
    generatedRecipesRef.current = [];
    loggedGeneratedRef.current = new Set();
    setAttempt((n) => n + 1);
  };

  const handleDontSuggest = (recipe) => {
    addToBlocklist(recipe);
    logEvent("recipe_dont_suggest", {
      recipeId: recipe.id,
      recipeData: recipeEventData(recipe),
    });
    viewedIdsRef.current.add(recipe.id);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(recipe.id);
      return next;
    });
  };

  if (!ingredients && !similarTo) return <Navigate to="/" replace />;

  const visibleRecipes = recipes.filter((r) => !hiddenIds.has(r.id));
  const isLoading = status === "loading";
  const hasAnyRecipes = visibleRecipes.length > 0;
  const stillStreaming =
    isLoading && hasAnyRecipes && recipes.length < TARGET_RECIPE_COUNT;

  return (
    <>
      <PaperBackdrop />

      <PageShell scrollable>
        <div className="relative z-10 flex flex-col flex-1">
          {similarTo ? (
            <HandBack
              onClick={() => navigate(-1)}
              label="back to original results"
              className="self-start mb-3"
            />
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="self-start font-body text-sm text-mocha hover:text-ink mb-3"
            >
              ← Back
            </button>
          )}

          {isLoading && !hasAnyRecipes && (
            <CookingLoader
              message={
                similarTo
                  ? "Finding similar recipes…"
                  : "Cooking up 5 recipes for you…"
              }
              hint={similarTo ? "looking for the same vibe" : "we're thinking…"}
            />
          )}

          {status === "error" && (
            <ErrorState
              error={error}
              onRetry={retry}
              onHome={() => navigate("/")}
            />
          )}

          {hasAnyRecipes && (
            <>
              {autoConfirmed && (
                <div className="mb-4 brut-card p-3 flex items-center gap-2 text-sm">
                  <span className="font-body text-ink/80 flex-1">
                    Auto-detected {ingredients.length} ingredient
                    {ingredients.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/confirm", {
                        state: {
                          ingredients: richIngredients ?? ingredients,
                        },
                      })
                    }
                    className="font-serif font-bold text-terracotta underline underline-offset-2"
                  >
                    Edit
                  </button>
                </div>
              )}

              {similarTo ? (
                <header>
                  <span className="font-body text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                    Similar to
                  </span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight italic mt-1">
                    {similarTo.name}
                  </h2>
                  <p className="font-script text-base sm:text-lg text-mocha mt-2 leading-snug">
                    more dishes you might love
                  </p>
                </header>
              ) : (
                <header>
                  <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
                    Five{" "}
                    <span className="italic font-bold text-terracotta">
                      ideas
                    </span>
                  </h2>
                  {ingredients && ingredients.length > 0 && (
                    <p className="font-script text-base sm:text-lg text-mocha mt-2 leading-snug">
                      with {ingredients.slice(0, 5).join(", ")}
                      {ingredients.length > 5
                        ? ` +${ingredients.length - 5} more`
                        : "…"}
                    </p>
                  )}
                </header>
              )}

              {stillStreaming && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-mocha self-center font-body">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-terracotta animate-pulse"
                    aria-hidden="true"
                  />
                  <span aria-live="polite">
                    {visibleRecipes.length} of {TARGET_RECIPE_COUNT} ready…
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-5">
                {visibleRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    similarMode={!!similarTo}
                    onOpen={() => {
                      viewedIdsRef.current.add(recipe.id);
                      navigate(`/recipe/${recipe.id}`, { state: { recipe } });
                    }}
                    onQuickAdd={() => handleQuickAdd(recipe)}
                    onDontSuggest={() => handleDontSuggest(recipe)}
                    onShowSimilar={() => {
                      logEvent("recipe_show_similar_clicked", {
                        recipeId: recipe.id,
                        recipeData: recipeEventData(recipe),
                      });
                      viewedIdsRef.current.add(recipe.id);
                      navigate("/recipes", {
                        state: {
                          ingredients: ingredients ?? [],
                          preferences,
                          similarTo: recipe,
                        },
                      });
                    }}
                  />
                ))}
                {stillStreaming && (
                  <SkeletonCard
                    remaining={TARGET_RECIPE_COUNT - visibleRecipes.length}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </PageShell>

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

// Standout nutrition badges (High Protein / Light Meal / High Fiber) — sit
// just below the recipe title. Renders nothing when none apply.
function NutritionBadges({ nutrition }) {
  const badges = getNutritionBadges(nutrition);
  if (badges.length === 0) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.key}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-serif font-bold leading-none ${b.className}`}
        >
          {b.label} <span aria-hidden="true">{b.emoji}</span>
        </span>
      ))}
    </span>
  );
}

// Compact one-line macro summary below the time/difficulty/serves stats.
function NutritionRow({ nutrition }) {
  const parts = [];
  if (nutrition.calories != null) parts.push(`🔥 ~${nutrition.calories} cal`);
  if (nutrition.protein != null) parts.push(`💪 ~${nutrition.protein}g protein`);
  if (nutrition.carbs != null) parts.push(`🍞 ~${nutrition.carbs}g carbs`);
  if (nutrition.fat != null) parts.push(`🫒 ~${nutrition.fat}g fat`);
  if (parts.length === 0) return null;
  return (
    <span className="mt-2 block text-[12px] text-mocha leading-snug">
      {parts.join(" · ")}
    </span>
  );
}

function RecipeCard({
  recipe,
  onOpen,
  onQuickAdd,
  onDontSuggest,
  onShowSimilar,
  similarMode = false,
}) {
  // Slight per-card emoji tilt — odd ids tilt right, even tilt left.
  const tilt = (recipe.id?.charCodeAt(0) ?? 0) % 2 === 0 ? "-3deg" : "3deg";
  // In similar mode, slide cards in from below for a softer arrival.
  const entryAnim = similarMode ? "animate-slideUp" : "animate-fadeIn";
  return (
    <div className={`relative brut-card brut-card-tappable ${entryAnim}`}>
      {/* Tappable area covers the body but stops short of the menu corner */}
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left p-5 pr-12 flex items-start gap-4"
      >
        <span
          className="text-6xl shrink-0 inline-block"
          style={{ transform: `rotate(${tilt})` }}
          aria-hidden="true"
        >
          {recipe.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block mb-1.5">
            <CategoryBadge category={recipe.category} />
          </span>
          <span className="block font-serif text-2xl font-bold text-ink leading-tight">
            {recipe.name}
          </span>
          <NutritionBadges nutrition={recipe.nutrition} />
          {recipe.tagline && (
            <span className="block font-body text-sm text-mocha mt-1 leading-snug">
              {recipe.tagline}
            </span>
          )}
          <span className="mt-3 inline-flex flex-wrap gap-1.5">
            {recipe.totalTimeMinutes != null && (
              <span className="ink-pill">⏱ {recipe.totalTimeMinutes} min</span>
            )}
            <span className="ink-pill capitalize">{recipe.difficulty}</span>
            {recipe.servings != null && (
              <span className="ink-pill">serves {recipe.servings}</span>
            )}
          </span>
          {recipe.nutrition && <NutritionRow nutrition={recipe.nutrition} />}
          <span className="mt-3 inline-flex items-center gap-1.5 font-serif italic text-terracotta text-sm">
            Cook this <HandArrow />
          </span>
        </span>
      </button>
      <div className="absolute top-3 right-3">
        <RecipeMenu
          onDontSuggest={onDontSuggest}
          onShowSimilar={onShowSimilar}
        />
      </div>
      {onQuickAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          aria-label="Add ingredients to grocery list"
          title="Add to grocery list"
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full border-2 border-ink bg-paper-warm text-ink font-serif font-extrabold text-lg leading-none shadow-[2px_2px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform flex items-center justify-center"
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
    </div>
  );
}

function HandArrow() {
  return (
    <svg viewBox="0 0 28 12" className="w-6 h-3" aria-hidden="true">
      <path
        d="M1 6 Q 12 4, 24 6"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M19 2 L 26 6 L 19 10"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkeletonCard({ remaining }) {
  return (
    <div
      className="w-full brut-card p-5 flex items-center gap-4 opacity-70"
      aria-hidden="true"
    >
      <span className="text-6xl opacity-40">🍳</span>
      <span className="flex-1">
        <span className="block h-3 w-24 rounded bg-ink/10 mb-2" />
        <span className="block h-3 w-40 rounded bg-ink/10" />
        <span className="block font-script text-base text-mocha mt-2 leading-none">
          {remaining} more on the way…
        </span>
      </span>
    </div>
  );
}

function ClosedEyeSketch() {
  return (
    <svg
      viewBox="0 0 80 36"
      className="w-24 h-12 text-ink/55"
      aria-hidden="true"
    >
      <path
        d="M6 22 Q 40 6, 74 22"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M18 26 L 16 32"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 28 L 30 34"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M42 28 L 42 34"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M54 28 L 54 34"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M64 26 L 66 32"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ErrorState({ error, onRetry, onHome }) {
  const isNoKey =
    error instanceof RecipeGenerationError && error.kind === "no-key";
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4">
      <ClosedEyeSketch />
      {isNoKey ? (
        <>
          <p className="font-serif text-xl font-bold text-ink leading-snug">
            The kitchen needs a key first.
          </p>
          <p className="font-body text-sm text-mocha max-w-xs">
            Add{" "}
            <code className="bg-ink/5 border border-ink/15 rounded px-1.5 py-0.5">
              VITE_ANTHROPIC_API_KEY
            </code>{" "}
            to <code className="bg-ink/5 border border-ink/15 rounded px-1.5 py-0.5">.env.local</code>{" "}
            and restart the dev server.
          </p>
          <button
            type="button"
            onClick={onHome}
            className="brut-button justify-center"
          >
            <span className="font-serif text-lg font-bold">Back home</span>
          </button>
        </>
      ) : (
        <>
          <p className="font-script text-2xl text-mocha leading-snug max-w-xs">
            the kitchen is closed for the moment — try again?
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="brut-button justify-center"
          >
            <span className="font-serif text-lg font-bold">Retry</span>
          </button>
        </>
      )}
    </div>
  );
}
