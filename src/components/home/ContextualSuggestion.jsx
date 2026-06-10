// Surfaces a single time-of-day-aware prompt when we have enough profile
// signal to do so. The user can tap it to generate recipes pre-seeded with
// a context theme + their commonly-loved ingredients.

function pickSuggestion({ profile, now = new Date() }) {
  if (!profile || profile.personalizationLevel === "none") return null;
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const hints = profile.timeOfDayHints || {};

  if (hour >= 6 && hour < 11 && hints.breakfastTotal >= 2) {
    return {
      label: "Good morning — quick breakfast ideas?",
      context: "breakfast, ready in under 15 minutes",
      maxTimeMinutes: 15,
    };
  }
  if (hour >= 11 && hour < 14 && hints.lunchTotal >= 2) {
    return {
      label: "Quick lunch?",
      context: "lunch, light and quick",
      maxTimeMinutes: 20,
    };
  }
  if (!isWeekend && hour >= 17 && hour < 20) {
    return {
      label: "Looking for a fast weeknight dinner?",
      context: "weeknight dinner, ready in under 30 minutes",
      maxTimeMinutes: 30,
    };
  }
  if (isWeekend && hour >= 13 && hour < 17) {
    return {
      label: "Got time for something fun? Try a project recipe.",
      context: "weekend project — willing to spend 45+ minutes",
      maxTimeMinutes: null,
    };
  }
  if (isWeekend && hour >= 17 && hour < 21) {
    return {
      label: "Weekend dinner — try something a little ambitious?",
      context: "weekend dinner, more involved is fine",
      maxTimeMinutes: null,
    };
  }
  return null;
}

const FALLBACK_PANTRY = [
  "eggs",
  "pasta",
  "garlic",
  "onion",
  "olive oil",
  "tomatoes",
];

export default function ContextualSuggestion({ profile, onTap }) {
  const suggestion = pickSuggestion({ profile });
  if (!suggestion) return null;

  const ingredients =
    profile.ingredientsLoved.length >= 4
      ? profile.ingredientsLoved.slice(0, 8)
      : [...profile.ingredientsLoved, ...FALLBACK_PANTRY].slice(0, 8);

  return (
    <button
      type="button"
      onClick={() => onTap?.({ ingredients, suggestion })}
      className="w-full text-left rounded-xl bg-tomato/10 border border-tomato/20 hover:bg-tomato/15 transition px-3 py-2 leading-tight"
    >
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-tomato-deep">
        Suggestion for you
      </span>
      <span className="block text-charcoal font-medium text-sm mt-0.5">
        {suggestion.label}
      </span>
      <span className="block text-[11px] text-charcoal/55 mt-0.5 leading-snug">
        with: {ingredients.slice(0, 4).join(", ")}
        {ingredients.length > 4 ? "…" : ""}
      </span>
    </button>
  );
}
