// User taste preferences captured during onboarding. Lives in localStorage
// only (no cloud sync yet). Read by generateRecipes.js so every Claude
// request is tuned to the user's diet, allergies, spice tolerance, etc.

const STORAGE_KEY = "whats-cookin-preferences";
const OPEN_COUNT_KEY = "whats-cookin-app-opens";
const NUDGE_DISMISSED_KEY = "whats-cookin-nudge-dismissed";

export const DEFAULT_PREFERENCES = {
  diet: null,
  allergies: [],
  customAvoidList: [],
  spiceLevel: null,
  noAllergies: false,
  favoriteCuisines: [],
  skillLevel: null,
  timePreference: null,
  ingredientDislikes: [],
  completedAt: null,
  onboardingSkipped: false,
};

export function getPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return null;
  }
}

export function savePreferences(prefs) {
  try {
    const merged = { ...DEFAULT_PREFERENCES, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return null;
  }
}

export function savePartialAndSkip(partial) {
  return savePreferences({
    ...partial,
    completedAt: new Date().toISOString(),
    onboardingSkipped: true,
  });
}

export function saveCompleted(answers) {
  return savePreferences({
    ...answers,
    completedAt: new Date().toISOString(),
    onboardingSkipped: false,
  });
}

export function clearPreferences() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NUDGE_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCompletedOnboarding() {
  return getPreferences() !== null;
}

export function wasOnboardingSkipped() {
  const prefs = getPreferences();
  return Boolean(prefs && prefs.onboardingSkipped);
}

// Returns the merged avoid-list (allergies + custom avoids + dislikes),
// lowercased and deduped. Used both by recipe generation and by the photo
// confirm flow to filter out detected ingredients.
export function getAvoidList(prefs = getPreferences()) {
  if (!prefs) return [];
  const all = [
    ...(prefs.allergies || []),
    ...(prefs.customAvoidList || []),
    ...(prefs.ingredientDislikes || []),
  ];
  const seen = new Set();
  const out = [];
  for (const item of all) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

// Hard-allergy list only — used by the photo flow's auto-filter so we
// strictly avoid allergens but don't aggressively strip mere dislikes.
export function getHardAvoidList(prefs = getPreferences()) {
  if (!prefs) return [];
  const all = [...(prefs.allergies || []), ...(prefs.customAvoidList || [])];
  const seen = new Set();
  const out = [];
  for (const item of all) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

// Decide whether an ingredient name should be filtered. Matches by
// substring so "peanut butter" gets caught by an allergy of "peanuts".
export function ingredientMatchesAvoid(ingredientName, avoidList) {
  if (!ingredientName || !Array.isArray(avoidList) || avoidList.length === 0) {
    return null;
  }
  const lower = ingredientName.toLowerCase();
  for (const term of avoidList) {
    if (!term) continue;
    const t = term.toLowerCase();
    // Singular/plural lenient match
    const stem = t.endsWith("s") ? t.slice(0, -1) : t;
    if (lower.includes(t) || (stem && lower.includes(stem))) {
      return term;
    }
  }
  return null;
}

// ── App-open counter (used by the soft nudge) ─────────────────────────────

export function bumpAppOpenCount() {
  try {
    const current = Number(localStorage.getItem(OPEN_COUNT_KEY) || "0");
    const next = current + 1;
    localStorage.setItem(OPEN_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export function getAppOpenCount() {
  try {
    return Number(localStorage.getItem(OPEN_COUNT_KEY) || "0");
  } catch {
    return 0;
  }
}

export function isNudgeDismissed() {
  try {
    return localStorage.getItem(NUDGE_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissNudge() {
  try {
    localStorage.setItem(NUDGE_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

// Pretty labels for display in Settings and in prompts.
export const DIET_LABELS = {
  none: "No restrictions",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  keto: "Keto",
  paleo: "Paleo",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  halal: "Halal",
  kosher: "Kosher",
};

export const SPICE_LABELS = {
  any: "I'm easy",
  none: "No spice",
  mild: "Mild",
  medium: "Medium",
  hot: "Bring the heat",
};

export const SKILL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const TIME_LABELS = {
  "under-20": "Under 20 minutes",
  "20-45": "20–45 minutes",
  "over-60": "Over an hour",
  mixed: "It depends",
};
