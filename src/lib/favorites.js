// Recipe favorites. Stored as a map of recipeId → minimal recipe data
// so we can render a list later without depending on router state.

const KEY = "whats-cookin-favorites";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function write(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getFavorites() {
  return read();
}

export function isFavorite(recipeId) {
  if (!recipeId) return false;
  return Object.prototype.hasOwnProperty.call(read(), recipeId);
}

export function toggleFavorite(recipe) {
  if (!recipe?.id) return false;
  const map = read();
  const nowFav = !map[recipe.id];
  if (nowFav) {
    map[recipe.id] = {
      id: recipe.id,
      name: recipe.name,
      emoji: recipe.emoji,
      cuisine: recipe.cuisine,
      category: recipe.category,
      totalTimeMinutes: recipe.totalTimeMinutes,
      heartedAt: new Date().toISOString(),
    };
  } else {
    delete map[recipe.id];
  }
  write(map);
  return nowFav;
}

export function clearFavorites() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
