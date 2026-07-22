// Cook history — the authoritative record of recipes the user has actually
// finished cooking. Stored in localStorage under "cookHistory" as an array of
// COMPLETE recipe objects (so the home-page "last cooked" card can hand the
// whole recipe to the detail page without regenerating anything).
//
// Console logs are intentional here — they trace the recipe data end to end so
// we can confirm the full object survives from cook-completion to retrieval.

const KEY = "cookHistory";
const MAX_ENTRIES = 50;

// Append a completed recipe to history. `recipe` must be the full recipe
// object that the cooking flow was using.
export function addToCookHistory(recipe) {
  console.log("[cookHistory] addToCookHistory received recipe:", recipe);

  if (!recipe || !recipe.id) {
    console.warn(
      "[cookHistory] refusing to save — recipe missing or has no id:",
      recipe,
    );
    return null;
  }

  // Keep every original field (so the detail page renders exactly as normal),
  // and additionally guarantee the explicit keys we promised to store.
  const entry = {
    ...recipe,
    id: recipe.id,
    name: recipe.name ?? "your recipe",
    emoji: recipe.emoji ?? "🍽️",
    tagline: recipe.tagline ?? "",
    ingredients: recipe.ingredients ?? [],
    steps: recipe.steps ?? [],
    time: recipe.totalTimeMinutes ?? recipe.time ?? null,
    difficulty: recipe.difficulty ?? null,
    serves: recipe.servings ?? recipe.serves ?? null,
    cookedAt: new Date().toISOString(),
  };

  const history = getCookHistory();
  // Newest first — most recent cook lives at index 0.
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(history));
    console.log(
      "[cookHistory] saved entry. total entries:",
      history.length,
      "saved entry:",
      entry,
    );
  } catch (err) {
    console.error("[cookHistory] failed to persist to localStorage:", err);
  }
  return entry;
}

export function getCookHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The most recently cooked entry (full recipe object), or null if none.
export function getLastCookedEntry() {
  const history = getCookHistory();
  return history.length > 0 ? history[0] : null;
}
