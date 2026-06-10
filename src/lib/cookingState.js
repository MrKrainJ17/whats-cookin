// localStorage helpers for cooking session resume + cooked-history badge.

const SESSION_KEY = "whatscookin:cooking";
const HISTORY_KEY = "whatscookin:cookedHistory";

export function loadCookingSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.recipeId || !parsed.recipe) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCookingSession(session) {
  try {
    const payload = { ...session, savedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota or disabled storage — silently ignore */
  }
}

export function clearCookingSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function loadCookedHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function getCookedCount(recipeId) {
  return loadCookedHistory()[recipeId] || 0;
}

export function incrementCookedCount(recipeId) {
  const h = loadCookedHistory();
  h[recipeId] = (h[recipeId] || 0) + 1;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    /* ignore */
  }
  return h[recipeId];
}
