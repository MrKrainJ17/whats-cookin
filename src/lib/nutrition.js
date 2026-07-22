// Shared helpers for displaying a recipe's AI-estimated nutrition.
//
// The `nutrition` object is produced by generateRecipes.js (normalizeNutrition)
// and looks like:
//   { calories, protein, carbs, fat, fiber, sugar, sodium, servingSize }
// Any field may be null; components should guard accordingly.

// Standout badges shown below a recipe title on the results page. Thresholds:
//   • High Protein 💪 — protein ≥ 30g
//   • Light Meal 🥗   — calories < 400
//   • High Fiber 🌾   — fiber ≥ 8g
// Each badge carries its own on-brand tint (greens for protein/light, warm
// wheat for fiber) via Tailwind classes.
export function getNutritionBadges(nutrition) {
  if (!nutrition) return [];
  const badges = [];

  if (typeof nutrition.protein === "number" && nutrition.protein >= 30) {
    badges.push({
      key: "high-protein",
      label: "High Protein",
      emoji: "💪",
      className: "bg-[#E4F0DD] text-[#3B6B2E] border-[#3B6B2E]",
    });
  }

  if (typeof nutrition.calories === "number" && nutrition.calories < 400) {
    badges.push({
      key: "light-meal",
      label: "Light Meal",
      emoji: "🥗",
      className: "bg-[#E8F1E0] text-[#4A7A33] border-[#4A7A33]",
    });
  }

  if (typeof nutrition.fiber === "number" && nutrition.fiber >= 8) {
    badges.push({
      key: "high-fiber",
      label: "High Fiber",
      emoji: "🌾",
      className: "bg-[#F3E7C9] text-[#7A5A1E] border-[#7A5A1E]",
    });
  }

  return badges;
}
