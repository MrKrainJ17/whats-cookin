import { getEvents } from "./eventTracker.js";

// Events that "count" toward the personalization level. Views/skips are
// noise — we only level up when the user shows real signal.
const MEANINGFUL_TYPES = new Set([
  "recipe_cooked",
  "recipe_rated",
  "recipe_hearted",
  "recipe_dont_suggest",
  "cooking_completed",
  // Tapping "Show similar" is a strong positive — the user liked a recipe
  // enough to want more of it. Counted as meaningful for level gating and
  // fed into cuisine + ingredient scoring below at 1.5x weight.
  "recipe_show_similar_clicked",
]);

const LIGHT_THRESHOLD = 5;
const FULL_THRESHOLD = 20;

const DECAY_HALF_LIFE_DAYS = 30;

export function buildUserProfile() {
  const events = getEvents();
  const meaningful = events.filter((e) => MEANINGFUL_TYPES.has(e.type));
  const meaningfulCount = meaningful.length;

  let personalizationLevel = "none";
  if (meaningfulCount >= FULL_THRESHOLD) personalizationLevel = "full";
  else if (meaningfulCount >= LIGHT_THRESHOLD) personalizationLevel = "light";

  const empty = () => ({
    personalizationLevel,
    totalEvents: events.length,
    meaningfulEvents: meaningfulCount,
    topCuisines: [],
    ingredientsLoved: [],
    ingredientsDisliked: [],
    cuisinesIgnored: [],
    avgCookTime: null,
    preferredDifficulty: null,
    patternsObserved: [],
    rawProfileString: "",
    timeOfDayHints: detectTimeOfDayHints(events),
  });

  if (personalizationLevel === "none") return empty();

  const now = Date.now();
  const weightOf = (timestamp) => {
    const ms = new Date(timestamp).getTime();
    const daysOld = Math.max(0, (now - ms) / (1000 * 60 * 60 * 24));
    return Math.pow(0.5, daysOld / DECAY_HALF_LIFE_DAYS);
  };

  // ── Cuisine scoring ─────────────────────────────────────────────────────
  const cuisineScore = new Map();
  const generatedCuisineCount = new Map();
  const viewedCuisines = new Set();
  const negativeCuisineScore = new Map();

  for (const e of events) {
    const cuisine = (e.recipeData?.cuisine || "").toLowerCase().trim();
    if (!cuisine) {
      if (e.type === "recipe_viewed") {
        // Still record the view to help differentiate later.
      }
      continue;
    }
    switch (e.type) {
      case "recipe_cooked":
      case "recipe_hearted":
      case "cooking_completed":
        cuisineScore.set(cuisine, (cuisineScore.get(cuisine) || 0) + weightOf(e.timestamp) * 2);
        break;
      case "recipe_show_similar_clicked":
        // Stronger than a view, lighter than a cook. The user expressed
        // direct interest in this cuisine/style — bias future generations
        // toward it without claiming they actually made the dish.
        cuisineScore.set(
          cuisine,
          (cuisineScore.get(cuisine) || 0) + weightOf(e.timestamp) * 1.5,
        );
        break;
      case "recipe_rated":
        if (e.metadata?.rating === "loved") {
          cuisineScore.set(cuisine, (cuisineScore.get(cuisine) || 0) + weightOf(e.timestamp));
        } else if (e.metadata?.rating === "never_again") {
          negativeCuisineScore.set(cuisine, (negativeCuisineScore.get(cuisine) || 0) + weightOf(e.timestamp));
        }
        break;
      case "recipe_dont_suggest":
        negativeCuisineScore.set(cuisine, (negativeCuisineScore.get(cuisine) || 0) + weightOf(e.timestamp));
        break;
      case "recipe_generated":
        generatedCuisineCount.set(cuisine, (generatedCuisineCount.get(cuisine) || 0) + 1);
        break;
      case "recipe_viewed":
        viewedCuisines.add(cuisine);
        break;
    }
  }

  const topCuisines = Array.from(cuisineScore.entries())
    .map(([cuisine, score]) => ({ cuisine, score: Math.round(score * 10) / 10 }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const cuisinesIgnored = Array.from(generatedCuisineCount.entries())
    .filter(([cuisine, count]) => count >= 3 && !viewedCuisines.has(cuisine) && !cuisineScore.has(cuisine))
    .map(([cuisine]) => cuisine)
    .slice(0, 5);

  // ── Ingredient analysis ─────────────────────────────────────────────────
  const positive = new Map(); // count of cooked/hearted appearances
  const negative = new Map(); // count of skipped/blocked appearances
  const removed = new Map(); // confirm-screen removals
  for (const e of events) {
    const ings = collectIngredientNames(e.recipeData?.ingredients);
    if (e.type === "recipe_cooked" || e.type === "recipe_hearted" || e.type === "cooking_completed") {
      for (const name of ings) positive.set(name, (positive.get(name) || 0) + 1);
    } else if (e.type === "recipe_show_similar_clicked") {
      // Lighter positive — count the ingredients but at half the weight of
      // an actual cook by only counting if not already at +2 from this event.
      for (const name of ings)
        positive.set(name, (positive.get(name) || 0) + 0.5);
    } else if (e.type === "recipe_dont_suggest" || e.type === "recipe_skipped") {
      for (const name of ings) negative.set(name, (negative.get(name) || 0) + 1);
    }
    if (e.type === "ingredient_removed") {
      const name = (e.ingredient || "").toLowerCase().trim();
      if (name) removed.set(name, (removed.get(name) || 0) + 1);
    }
  }
  const ingredientsLoved = Array.from(positive.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 10);

  const dislikedSet = new Set();
  for (const [name, count] of negative.entries()) {
    if (count >= 3 && (positive.get(name) || 0) === 0) dislikedSet.add(name);
  }
  for (const [name, count] of removed.entries()) {
    if (count >= 3 && (positive.get(name) || 0) === 0) dislikedSet.add(name);
  }
  const ingredientsDisliked = Array.from(dislikedSet).slice(0, 10);

  // ── Time + difficulty ──────────────────────────────────────────────────
  const cooked = events.filter((e) => e.type === "recipe_cooked" || e.type === "cooking_completed");
  let avgCookTime = null;
  if (cooked.length > 0) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const e of cooked) {
      const t = e.recipeData?.totalTimeMinutes;
      if (typeof t === "number") {
        const w = weightOf(e.timestamp);
        weightedSum += t * w;
        totalWeight += w;
      }
    }
    if (totalWeight > 0) avgCookTime = Math.round(weightedSum / totalWeight);
  }

  let preferredDifficulty = null;
  const completed = events.filter((e) => e.type === "cooking_completed");
  const abandoned = events.filter((e) => e.type === "cooking_abandoned");
  const hardCompleted = completed.filter((e) => e.recipeData?.difficulty === "hard").length;
  const hardAbandoned = abandoned.filter((e) => e.recipeData?.difficulty === "hard").length;
  const easyMediumCompleted = completed.filter((e) =>
    ["easy", "medium"].includes(e.recipeData?.difficulty),
  ).length;
  if (hardCompleted >= 3 && hardCompleted > hardAbandoned) {
    preferredDifficulty = "advanced";
  } else if (hardAbandoned >= 2 && easyMediumCompleted >= 3) {
    preferredDifficulty = "easy";
  } else if (easyMediumCompleted >= 5) {
    preferredDifficulty = "intermediate";
  } else if (completed.length > 0) {
    preferredDifficulty = "easy";
  }

  // ── Patterns ───────────────────────────────────────────────────────────
  const patterns = [];
  if (avgCookTime != null) {
    if (avgCookTime < 20) patterns.push("prefers quick recipes under 20 minutes");
    else if (avgCookTime < 30) patterns.push("prefers recipes under 30 minutes");
    else if (avgCookTime > 45) patterns.push("comfortable spending 45+ minutes on cooking");
  }
  if (cooked.length >= 5) {
    const weekday = cooked.filter((e) => {
      const d = new Date(e.timestamp).getDay();
      return d >= 1 && d <= 5;
    }).length;
    const weekend = cooked.length - weekday;
    if (weekday > weekend * 2) patterns.push("cooks mostly on weeknights");
    else if (weekend > weekday) patterns.push("cooks more on weekends");
  }

  const timeOfDayHints = detectTimeOfDayHints(events);

  const rawProfileString = buildProfileString({
    totalEvents: events.length,
    meaningfulCount,
    topCuisines,
    ingredientsLoved,
    ingredientsDisliked,
    cuisinesIgnored,
    avgCookTime,
    preferredDifficulty,
    patterns,
    personalizationLevel,
  });

  return {
    personalizationLevel,
    totalEvents: events.length,
    meaningfulEvents: meaningfulCount,
    topCuisines,
    ingredientsLoved,
    ingredientsDisliked,
    cuisinesIgnored,
    avgCookTime,
    preferredDifficulty,
    patternsObserved: patterns,
    rawProfileString,
    timeOfDayHints,
  };
}

function collectIngredientNames(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  const out = [];
  for (const ing of ingredients) {
    const name = typeof ing === "string" ? ing : ing?.name;
    if (typeof name === "string") {
      const clean = name.toLowerCase().trim();
      if (clean) out.push(clean);
    }
  }
  return out;
}

function buildProfileString(p) {
  if (p.personalizationLevel === "light") {
    const parts = [
      `Behavioral profile from ${p.meaningfulCount} meaningful interactions (${p.totalEvents} total events).`,
    ];
    if (p.topCuisines.length > 0) {
      parts.push(`User leans toward: ${p.topCuisines.slice(0, 2).map((c) => c.cuisine).join(", ")}.`);
    }
    if (p.ingredientsLoved.length > 0) {
      parts.push(`Favorites the ingredients: ${p.ingredientsLoved.slice(0, 5).join(", ")}.`);
    }
    if (p.ingredientsDisliked.length > 0) {
      parts.push(`Has shown dislike for: ${p.ingredientsDisliked.slice(0, 5).join(", ")} — avoid unless central.`);
    }
    return parts.join(" ");
  }

  const parts = [
    `Behavioral profile from ${p.meaningfulCount} meaningful interactions (${p.totalEvents} total logged).`,
  ];
  if (p.topCuisines.length > 0) {
    parts.push(
      `Strongly favors ${p.topCuisines
        .slice(0, 3)
        .map((c) => `${c.cuisine} (score ${c.score})`)
        .join(", ")}.`,
    );
  }
  if (p.ingredientsLoved.length > 0) {
    parts.push(`Frequently uses ${p.ingredientsLoved.slice(0, 8).join(", ")} in successfully-cooked recipes.`);
  }
  if (p.ingredientsDisliked.length > 0) {
    parts.push(
      `Has consistently skipped, removed, or blocked: ${p.ingredientsDisliked.slice(0, 8).join(", ")} — treat as dislikes (only use if the user explicitly supplied them).`,
    );
  }
  if (p.avgCookTime != null) {
    parts.push(`Average successful cook time: ${p.avgCookTime} minutes.`);
  }
  if (p.preferredDifficulty) {
    parts.push(`Calibrated difficulty preference: ${p.preferredDifficulty}.`);
  }
  if (p.patterns.length > 0) {
    parts.push(`Patterns observed: ${p.patterns.join("; ")}.`);
  }
  if (p.cuisinesIgnored.length > 0) {
    parts.push(
      `Cuisines that have shown up in suggestions and been consistently ignored: ${p.cuisinesIgnored.join(", ")} — deprioritize unless the user's ingredients clearly call for them.`,
    );
  }
  return parts.join(" ");
}

function detectTimeOfDayHints(events) {
  // Look at when the user historically opens the app / cooks. We surface
  // a contextual suggestion on the home screen based on this + current hour.
  const cookByHour = new Array(24).fill(0);
  for (const e of events) {
    if (e.type !== "recipe_cooked" && e.type !== "cooking_completed") continue;
    const hour = new Date(e.timestamp).getHours();
    cookByHour[hour]++;
  }
  return {
    breakfastTotal: cookByHour.slice(6, 11).reduce((a, b) => a + b, 0),
    lunchTotal: cookByHour.slice(11, 14).reduce((a, b) => a + b, 0),
    weeknightDinnerTotal: cookByHour.slice(17, 20).reduce((a, b) => a + b, 0),
  };
}
