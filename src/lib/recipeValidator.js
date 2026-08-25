// Recipe safety + accuracy validator. Scans every AI-generated recipe for
// food-safety red flags BEFORE it's shown to the user. Anything that trips a
// rule is dropped (and, where possible, regenerated) rather than displayed —
// undercooked chicken/pork, unsafe oven temps, water-into-hot-oil, etc.
//
// NOTE ON PATTERNS: the naive form `/medium.*chicken/` would match the
// extremely common, perfectly safe phrase "medium heat ... chicken", so the
// doneness checks below deliberately match doneness words ("medium-rare",
// "pink", "undercooked") adjacent to the meat, NOT cooking-heat words.

// Pull all the human-readable text out of a normalized recipe into one
// lowercased string (newlines flattened so windowed regexes work).
function recipeText(recipe) {
  const parts = [];
  if (recipe?.name) parts.push(recipe.name);
  if (recipe?.tagline) parts.push(recipe.tagline);
  if (Array.isArray(recipe?.steps)) {
    for (const s of recipe.steps) {
      if (s?.instruction) parts.push(s.instruction);
    }
  }
  if (recipe?.tips) parts.push(recipe.tips);
  return parts.join(" \n ").replace(/\s+/g, " ").toLowerCase();
}

// Each rule: a regex plus either a `check(captured)` predicate (flags when the
// captured number is unsafe) or no check (any match flags). `warning` is the
// human-readable reason logged to the console.
export const dangerousPatterns = [
  {
    id: "oven-temp-too-high",
    // Any Fahrenheit temp above a safe home-oven ceiling.
    pattern: /(\d{3,4})\s*°?\s*f\b/gi,
    check: (temp) => temp > 550,
    warning: "Oven temperature too high for home cooking (>550°F)",
  },
  {
    id: "chicken-time-too-short",
    // A chicken-cooking verb followed closely by a short minute count.
    pattern:
      /chicken[^.]{0,60}?\b(\d{1,3})\s*(?:min|minute)/gi,
    check: (mins) => mins < 15,
    // "per side"/"each side" doubles the real time — don't flag those.
    skipIf: (text) => /per side|each side|both sides/.test(text),
    warning: "Chicken cooking time may be too short to reach 165°F",
  },
  {
    id: "water-into-hot-oil",
    pattern: /(?:add|adding|pour|pouring)[^.]{0,30}water[^.]{0,30}(?:hot oil|frying oil|fry oil)|water[^.]{0,20}(?:hot oil|frying oil)/gi,
    warning: "Dangerous — water added to hot oil (splatter/fire risk)",
  },
  {
    id: "undercooked-chicken",
    // Doneness words next to chicken — NOT "medium heat".
    pattern:
      /(?:medium[- ]rare|rare|pink|undercooked|raw|translucent)\s+chicken|chicken[^.]{0,25}(?:is\s+)?(?:still\s+)?(?:medium[- ]rare|pink|slightly pink|undercooked|raw|translucent)|serve[^.]{0,25}chicken[^.]{0,15}pink/gi,
    warning: "Chicken must be fully cooked to 165°F — no rare/pink chicken",
  },
  {
    id: "undercooked-pork",
    pattern:
      /(?:rare|pink center|undercooked|raw)\s+pork|pork[^.]{0,25}(?:is\s+)?(?:still\s+)?(?:rare|pink|undercooked|raw)|serve[^.]{0,25}pork[^.]{0,15}pink/gi,
    warning: "Pork must reach 145°F internal temperature — no rare/pink pork",
  },
];

// Validate a single (normalized) recipe. Returns { safe, warnings } where
// warnings is an array of { id, warning } for every rule that tripped.
export function validateRecipe(recipe) {
  const text = recipeText(recipe);
  const warnings = [];

  for (const rule of dangerousPatterns) {
    if (rule.skipIf && rule.skipIf(text)) continue;
    // Fresh lastIndex each rule since the regexes are global.
    rule.pattern.lastIndex = 0;
    let match;
    let tripped = false;
    while ((match = rule.pattern.exec(text)) !== null) {
      if (rule.check) {
        const num = parseInt(match[1], 10);
        if (Number.isFinite(num) && rule.check(num)) {
          tripped = true;
          break;
        }
      } else {
        tripped = true;
        break;
      }
      if (match.index === rule.pattern.lastIndex) rule.pattern.lastIndex++;
    }
    if (tripped) warnings.push({ id: rule.id, warning: rule.warning });
  }

  return { safe: warnings.length === 0, warnings };
}
