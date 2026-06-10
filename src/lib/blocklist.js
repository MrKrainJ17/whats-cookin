// "Don't suggest this again" list. Keyed by case-folded recipe name —
// resilient to small id changes between generations.

const KEY = "whats-cookin-blocklist";

export function getBlocklist() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToBlocklist(recipe) {
  if (!recipe?.name) return;
  const entry = {
    name: recipe.name,
    nameKey: normalizeName(recipe.name),
    blockedAt: new Date().toISOString(),
  };
  const list = getBlocklist();
  if (list.some((e) => e.nameKey === entry.nameKey)) return;
  list.push(entry);
  write(list);
}

export function removeFromBlocklist(name) {
  const key = normalizeName(name);
  write(getBlocklist().filter((e) => e.nameKey !== key));
}

export function isBlocked(recipeName) {
  const key = normalizeName(recipeName);
  return getBlocklist().some((e) => e.nameKey === key);
}

export function clearBlocklist() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
