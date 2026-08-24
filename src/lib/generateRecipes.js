import Anthropic from "@anthropic-ai/sdk";
import { buildUserProfile } from "./profileBuilder.js";
import { getBlocklist, isBlocked } from "./blocklist.js";
import {
  getPreferences,
  getAvoidList,
  DIET_LABELS,
  SPICE_LABELS,
  SKILL_LABELS,
  TIME_LABELS,
} from "./preferences.js";

// TODO: Move to backend before launch.
// Same browser-key tradeoff as claude.js — fine for v0.1 local testing,
// not safe to deploy. Phase 2 moves this behind a Vercel serverless function.
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

const client = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

const MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `⚠️ ABSOLUTE RULE #1 — NO EXCEPTIONS: You are FORBIDDEN from using any ingredient that is not in the user's provided list. The only exceptions are salt, pepper, black pepper, and cooking oil. If a recipe needs an ingredient not on the list, choose a completely different recipe. Do not add garlic if the user didn't list garlic. Do not add butter if the user didn't list butter. Do not add onion if the user didn't list onion. ONLY use what the user gave you. Check every single ingredient in every recipe against the user's list before returning your response. Remove any ingredient that wasn't provided.

You are a creative home cook helping someone make a meal from what they already have.

The user gives you a list of ingredients. Generate up to 5 distinct, original recipes that a real home cook would actually make and enjoy.

PANTRY ASSUMPTION
You may always assume the user has: salt, pepper, cooking oil, water. Don't list these as missing or required.

CRITICAL RULE: You may ONLY use ingredients from the list the user provided. Do not add ANY extra ingredients that the user did not mention. No exceptions.
- If a recipe requires an ingredient the user didn't provide, pick a different recipe that works with what they have.
- Basic pantry staples like salt, pepper, and oil are the ONLY exceptions allowed — everything else must come from the user's ingredient list.
- Do not suggest recipes that require buying additional ingredients.
- Every ingredient listed in the recipe must be from the user's provided list (except salt, pepper, oil).
- If you cannot make 5 recipes purely from the user's ingredients, make fewer recipes — do not invent ingredients to fill the list.
- Before finalizing each recipe, check every single ingredient against the user's list and remove anything that wasn't provided.

REALISM (HARD RULES)
- Every recipe must be something real cooks actually prepare — not invented fusion or strange combinations.
- Use authentic flavor pairings. Examples that work: basil + tomato + mozzarella; ginger + garlic + soy; lemon + olive oil + parsley; cumin + lime + cilantro. Examples that DO NOT work: basil + tuna + chocolate; soy sauce + cinnamon roll; kimchi + maple syrup as a main pairing. If a pairing wouldn't appear in a respected cookbook or restaurant, don't use it.
- Ingredient quantities must be realistic for the stated servings. No 3 tbsp of salt, no 1 garlic clove for 8 people, no 4 lbs of meat for 2 servings.
- Cooking times must be honest. Don't claim "carbonara in 8 minutes" or "braised short ribs in 25 minutes." If the dish actually takes 45 minutes, say 45.
- Difficulty ratings must be accurate. A recipe with 12 steps, multiple sauces, or fussy technique is NOT "easy". Calibrate honestly:
  - "easy"   : one pan or pot, ≤ 8 steps, no advanced technique, forgiving of small mistakes
  - "medium" : multiple components or pans, some timing coordination, basic technique (sear, reduce, emulsify)
  - "hard"   : multiple stages, advanced technique (laminating, tempering, complex sauces), requires experience

INSTRUCTION QUALITY (per step)
- Each step is ONE clear action with enough specificity that a beginner can follow it.
- Include explicit heat levels and temperatures. Use "medium-high heat", "low simmer", "375°F oven", "until oil shimmers". Do NOT use vague phrases like "cook until done" or "heat the pan".
- Include sensory cues so cooks know when to advance: "until golden brown", "when garlic smells fragrant", "until liquid reduces by half", "until edges pull from the pan", "until shrimp turn pink and curl".
- Mention specific tools when relevant: "whisk in a small bowl", "sear in a cast iron pan", "blitz in a food processor", "rest on a wire rack".
- Order steps logically: prep work (chopping, measuring, marinating) before active cooking; build flavor in sequence (aromatics → proteins → liquids → finishes).
- Steps stay CONCISE — 1–2 short sentences. The specificity comes from the right words, not extra words.
- Aim for 4–8 steps per recipe. Don't pad a simple recipe to 10 steps; don't compress a complex one into 3.

VARIETY (across the 5 recipes)
- The 5 recipes must each fall into a DIFFERENT category — one of each, no duplicates:
  - "fastest"     → total time under 15 minutes; quick assembly or one-pan
  - "healthiest"  → light, lean, vegetable-forward, minimal added fat
  - "popular"     → familiar classic that most home cooks would recognize
  - "creative"    → an unexpected (but still authentic) technique, combo, or twist
  - "hearty"     → filling, comforting, generous portion
- Vary cuisines, techniques, and main proteins across the 5. Don't return 5 pastas, 5 stir-fries, or 5 chicken dishes.
- Tag each recipe with a lowercase "cuisine" (e.g. "italian", "mexican", "japanese", "thai", "indian", "mediterranean", "american", "french", "korean", "vietnamese", "middle eastern", "other"). Use "other" only when nothing fits.

QUALITY BAR
- If a recipe wouldn't be served at a decent restaurant or impress at a casual dinner party, it's not good enough — replace it with something that would.
- Each recipe must include at least one technique or detail that elevates the dish: a finishing herb or acid (a squeeze of lemon, a scatter of basil), a flavor builder (deglaze the pan, bloom the spices, toast the nuts), or a textural contrast (crispy topping on a creamy base, crunch on something soft).
- Names must be evocative and specific. "Lemony Garlic Shrimp Pasta with Charred Tomatoes" beats "Shrimp Pasta". "Crispy Sage-Brown Butter Gnocchi" beats "Pan-Fried Gnocchi". Name what makes it craveable, not just the genre.
- Taglines must hook the reader on what's special — the technique, the flavor moment, the why-you'd-want-this — not just restate the ingredients. ≤ 80 characters, ideally under 60.
- Each recipe must use ONLY the user's provided ingredients (plus salt, pepper, and cooking oil). Do not add any extras — see the CRITICAL RULE above.
- Set "timerMinutes" to a number for steps where the cook is waiting (boiling, baking, simmering, resting). Use null for active steps.
- Use lowercase ingredient names. Be precise with amounts and units.
- Return 5 recipes when possible — but never invent ingredients to reach 5. If only fewer recipes are possible using ONLY the user's ingredients (plus salt, pepper, oil), return fewer. The CRITICAL RULE always wins over the count.
- Each recipe must be ORIGINAL — your own version, not a verbatim copy of a published recipe.

EMOJI SELECTION
For the "emoji" field, pick the single most visually accurate emoji that represents what's actually on the plate. Be very specific — never default to generic emojis like 🍴 🍽️ 🥄 🫕 unless absolutely nothing else fits. Follow these rules:

- Pasta dishes with tomato sauce → 🍝
- Ramen, pho, noodle soups → 🍜
- Sushi, sashimi → 🍣
- Rice bowls, donburi, fried rice → 🍱
- Curry over rice → 🍛
- Tacos → 🌮
- Burritos, wraps → 🌯
- Pizza → 🍕
- Burgers → 🍔
- Sandwiches, subs → 🥪
- Salads → 🥗
- Soups and stews → 🍲
- Dumplings, gyoza, potstickers → 🥟
- Steak, beef cuts → 🥩
- Ribs, bone-in meat → 🍖
- Chicken pieces, wings, drumsticks → 🍗
- Shrimp, prawns → 🍤
- Fish dishes → 🐟
- Salmon specifically → 🐟
- Eggs (fried, scrambled, omelette) → 🍳
- Pancakes, waffles → 🥞
- Waffles specifically → 🧇
- Bread, toast → 🍞
- Baguette, garlic bread → 🥖
- Flatbread, naan, pita → 🫓
- Avocado dishes → 🥑
- Corn dishes → 🌽
- Mushroom dishes → 🍄
- Broccoli or green veggie dishes → 🥦
- Stuffed peppers, pepper dishes → 🫑
- Potato dishes (mashed, roasted, fries) → 🥔
- Sweet potato dishes → 🍠
- Tomato-based dishes → 🍅
- Cheese-heavy dishes → 🧀
- Chocolate desserts → 🍫
- Cake → 🎂
- Cookies → 🍪
- Ice cream → 🍦
- Pie → 🥧
- Smoothies, cold drinks → 🥤
- Coffee drinks → ☕
- Lobster → 🦞
- Crab → 🦀
- Paella, risotto, jambalaya → 🥘
- Korean BBQ, grilled meat → 🥩
- Skewers, kebabs, yakitori → 🍢
- Hot dogs, sausages → 🌭
- Bacon-heavy dishes → 🥓
- Oatmeal, porridge, granola → 🥣
- Croissants, pastries → 🥐
- Bagels → 🥯
- Nachos, chips → 🌮
- Guacamole → 🥑
- Hummus → 🫛
- Poke bowls → 🍱
- Bibimbap → 🍱
- Pad thai → 🍜
- Butter chicken → 🍛
- Fish and chips → 🐟
- Mac and cheese → 🧀
- Grilled cheese → 🧀
- BLT → 🥪
- Club sandwich → 🥪
- Veggie stir fry → 🥦
- Fried chicken → 🍗
- Chicken soup → 🍲
- French onion soup → 🍲
- Minestrone → 🍲
- Chili → 🍲
- Beef stew → 🍲
- Lentil soup → 🍲
- Miso soup → 🍜
- Tom yum → 🍜

If the dish doesn't match any of the above, pick the emoji that most closely represents the MAIN PROTEIN or MAIN INGREDIENT in the dish. Never pick an emoji based on cooking method or serving vessel — pick based on what the food actually IS.

NUTRITION
For each recipe, estimate the nutrition per serving based on the ingredients and quantities. Be realistic — use standard nutrition databases as reference. Include: calories (kcal), protein (g), carbs (g), fat (g), fiber (g), sugar (g), sodium (mg), and serving size description. These are estimates, not exact values.

OUTPUT FORMAT
Stream the recipes as raw JSON objects, one after another. NO array brackets, NO commas between objects, NO prose, NO markdown, NO code fences. Your response must contain up to 5 top-level JSON objects (fewer if the CRITICAL RULE requires it), concatenated. Whitespace between objects is fine. The very first character of your response must be "{". Each object matches this schema:

{
  "id": "kebab-case-slug",
  "name": "Recipe Name",
  "tagline": "One-sentence hook (max ~80 chars)",
  "category": "fastest" | "healthiest" | "popular" | "creative" | "hearty" | "wildcard",
  "cuisine": "<lowercase cuisine, e.g. italian, thai, other>",
  "totalTimeMinutes": <integer>,
  "difficulty": "easy" | "medium" | "hard",
  "servings": <integer>,
  "emoji": "<one food emoji>",
  "ingredients": [{ "name": "<lowercase>", "amount": "<string>", "unit": "<string>" }],
  "steps": [{ "step": <integer>, "instruction": "<string>", "timerMinutes": <integer|null> }],
  "tips": "<optional one-line tip; omit the field entirely if not useful>",
  "nutrition": {
    "calories": <integer kcal per serving>,
    "protein": <integer grams per serving>,
    "carbs": <integer grams per serving>,
    "fat": <integer grams per serving>,
    "fiber": <integer grams per serving>,
    "sugar": <integer grams per serving>,
    "sodium": <integer milligrams per serving>,
    "servingSize": "<short description, e.g. 1 plate (approx. 400g)>"
  }
}`;

const VALID_CATEGORIES = new Set([
  "fastest",
  "healthiest",
  "popular",
  "creative",
  "hearty",
  "wildcard",
]);

const cache = new Map();
// Separate cache namespace for "show similar" results, keyed by reference
// recipe id. In-memory only — clears between sessions.
const similarCache = new Map();
// entry shape: { promise, recipes: Recipe[], subscribers: Set<(r, i) => void> }
const inflight = new Map();

export class RecipeGenerationError extends Error {
  constructor(message, { kind, raw, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.kind = kind ?? "unknown";
    this.raw = raw;
  }
}

// generateRecipes(ings, prefs, { onRecipe }) — onRecipe fires for each recipe
// as it streams in. Late subscribers (e.g. a Recipes page that mounts after
// Confirm prefetched) get a synchronous replay of already-received recipes
// via queueMicrotask, then live updates for the rest.
export function generateRecipes(ingredients, preferences, options = {}) {
  if (!client) {
    return Promise.reject(
      new RecipeGenerationError(
        "Missing VITE_ANTHROPIC_API_KEY. Add it to .env.local and restart `npm run dev`.",
        { kind: "no-key" },
      ),
    );
  }
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return Promise.reject(
      new RecipeGenerationError("Need at least one ingredient.", {
        kind: "bad-input",
      }),
    );
  }

  const cacheKey = makeCacheKey(ingredients, preferences);
  const { onRecipe } = options;

  if (cache.has(cacheKey)) {
    const arr = cache.get(cacheKey);
    if (onRecipe) {
      const snapshot = arr.slice();
      queueMicrotask(() => snapshot.forEach((r, i) => onRecipe(r, i + 1)));
    }
    return Promise.resolve(arr);
  }

  if (inflight.has(cacheKey)) {
    const entry = inflight.get(cacheKey);
    if (onRecipe) {
      const snapshot = entry.recipes.slice();
      queueMicrotask(() => snapshot.forEach((r, i) => onRecipe(r, i + 1)));
      entry.subscribers.add(onRecipe);
    }
    return entry.promise;
  }

  const entry = { recipes: [], subscribers: new Set() };
  if (onRecipe) entry.subscribers.add(onRecipe);

  entry.promise = streamRecipes(ingredients, preferences, (recipe) => {
    entry.recipes.push(recipe);
    for (const sub of entry.subscribers) {
      try {
        sub(recipe, entry.recipes.length);
      } catch (err) {
        console.error("[generateRecipes] subscriber threw:", err);
      }
    }
  })
    .then((finalRecipes) => {
      cache.set(cacheKey, finalRecipes);
      return finalRecipes;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, entry);
  return entry.promise;
}

// generateSimilarRecipes(referenceRecipe, currentIngredients, preferences, { onRecipe })
// — generate 5 recipes that match the reference dish's cuisine, cooking style,
// time range, and flavor profile. currentIngredients can be empty/null; when
// it is, the model is told there's no ingredient constraint. Cached in
// memory for the session keyed by reference recipe id.
export function generateSimilarRecipes(
  referenceRecipe,
  currentIngredients,
  preferences,
  options = {},
) {
  if (!client) {
    return Promise.reject(
      new RecipeGenerationError(
        "Missing VITE_ANTHROPIC_API_KEY. Add it to .env.local and restart `npm run dev`.",
        { kind: "no-key" },
      ),
    );
  }
  if (!referenceRecipe || typeof referenceRecipe.name !== "string") {
    return Promise.reject(
      new RecipeGenerationError("Missing reference recipe.", {
        kind: "bad-input",
      }),
    );
  }

  const refKey = referenceRecipe.id || referenceRecipe.name.toLowerCase().trim();
  const cacheKey = `similar:${refKey}`;
  const { onRecipe } = options;

  if (similarCache.has(cacheKey)) {
    const arr = similarCache.get(cacheKey);
    if (onRecipe) {
      const snapshot = arr.slice();
      queueMicrotask(() => snapshot.forEach((r, i) => onRecipe(r, i + 1)));
    }
    return Promise.resolve(arr);
  }

  if (inflight.has(cacheKey)) {
    const entry = inflight.get(cacheKey);
    if (onRecipe) {
      const snapshot = entry.recipes.slice();
      queueMicrotask(() => snapshot.forEach((r, i) => onRecipe(r, i + 1)));
      entry.subscribers.add(onRecipe);
    }
    return entry.promise;
  }

  const entry = { recipes: [], subscribers: new Set() };
  if (onRecipe) entry.subscribers.add(onRecipe);

  const ings = Array.isArray(currentIngredients) ? currentIngredients : [];

  entry.promise = streamRecipes(
    ings,
    preferences,
    (recipe) => {
      // Drop duplicates of the reference itself — Claude sometimes ignores
      // the "different from the reference" rule on the first slot.
      if (
        recipe.name.toLowerCase().trim() ===
        referenceRecipe.name.toLowerCase().trim()
      ) {
        return;
      }
      entry.recipes.push(recipe);
      for (const sub of entry.subscribers) {
        try {
          sub(recipe, entry.recipes.length);
        } catch (err) {
          console.error("[generateSimilarRecipes] subscriber threw:", err);
        }
      }
    },
    { similarTo: referenceRecipe },
  )
    .then((finalRecipes) => {
      const dedupedFinal = finalRecipes.filter(
        (r) =>
          r.name.toLowerCase().trim() !==
          referenceRecipe.name.toLowerCase().trim(),
      );
      similarCache.set(cacheKey, dedupedFinal);
      return dedupedFinal;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, entry);
  return entry.promise;
}

async function streamRecipes(ingredients, preferences, emit, opts = {}) {
  const profile = buildUserProfile();
  const blocklist = getBlocklist();
  const userPrefs = getPreferences();
  const { similarTo = null } = opts;
  const recipes = [];
  const tracker = createObjectStreamTracker((obj) => {
    const r = normalizeRecipe(obj, recipes.length);
    if (!r) return;
    // Drop any model output whose name matches the user's blocklist.
    if (isBlocked(r.name)) {
      console.info("[generateRecipes] dropping blocked recipe:", r.name);
      return;
    }
    recipes.push(r);
    emit(r);
  });

  // System prompt is split into a static cacheable prefix and a dynamic
  // suffix that varies per call (profile + blocklist + wildcard rules).
  // The dynamic block is small (<200 tokens) so per-call cost stays low
  // even though only the static prefix actually hits the cache.
  const systemBlocks = [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];
  const dynamicSection = buildDynamicSystemBlock(
    profile,
    blocklist,
    similarTo,
    userPrefs,
  );
  if (dynamicSection) {
    systemBlocks.push({ type: "text", text: dynamicSection });
  }

  const userMessage = similarTo
    ? buildSimilarUserMessage(similarTo, ingredients, preferences)
    : buildUserMessage(ingredients, preferences);

  let stream;
  try {
    stream = client.messages.stream({
      model: MODEL,
      // Tight token budget keeps generation snappy. 5 concise recipes fit
      // well under this; if a recipe truncates, the streaming parser drops
      // the malformed tail and we serve whatever did complete.
      max_tokens: 2500,
      system: systemBlocks,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    throw new RecipeGenerationError(
      "Couldn't reach Claude. Check your connection or API key.",
      { kind: "network", cause: err },
    );
  }

  stream.on("text", (textDelta) => {
    if (typeof textDelta === "string" && textDelta.length > 0) {
      tracker.consume(textDelta);
    }
  });

  let finalText;
  try {
    const finalMessage = await stream.finalMessage();
    finalText = finalMessage.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    if (recipes.length > 0) {
      // Partial success — return what we got
      return recipes;
    }
    throw new RecipeGenerationError(
      "Couldn't reach Claude. Check your connection or API key.",
      { kind: "network", cause: err },
    );
  }

  // Fallback: if streaming yielded fewer than expected, try parsing the
  // full text for any objects the streaming tracker missed.
  if (recipes.length < 5 && finalText) {
    const all = extractAllObjects(finalText);
    for (let i = recipes.length; i < all.length; i++) {
      const r = normalizeRecipe(all[i], recipes.length);
      if (r) {
        recipes.push(r);
        emit(r);
      }
    }
  }

  if (recipes.length === 0) {
    console.error("[generateRecipes] no recipes parsed. Raw:\n", finalText);
    throw new RecipeGenerationError("Got a weird answer back. Try again?", {
      kind: "parse",
      raw: finalText,
    });
  }

  return recipes;
}

// String-aware brace-depth tracker. Calls `onObject` with the JSON-parsed
// object every time a top-level {...} closes. Tolerant of malformed
// objects — bad ones are skipped silently.
function createObjectStreamTracker(onObject) {
  let buffer = "";
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escape = false;

  return {
    consume(text) {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        buffer += ch;
        const idx = buffer.length - 1;
        if (escape) {
          escape = false;
          continue;
        }
        if (inString) {
          if (ch === "\\") {
            escape = true;
            continue;
          }
          if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === "{") {
          if (depth === 0) objStart = idx;
          depth++;
        } else if (ch === "}") {
          depth--;
          if (depth === 0 && objStart !== -1) {
            const candidate = buffer.slice(objStart, idx + 1);
            try {
              onObject(JSON.parse(candidate));
            } catch {
              /* skip malformed */
            }
            objStart = -1;
          } else if (depth < 0) {
            depth = 0;
          }
        }
      }
    },
  };
}

// One-shot variant of the tracker used as a fallback if streaming failed
// to produce all the recipes we expected.
function extractAllObjects(text) {
  const out = [];
  const tracker = createObjectStreamTracker((obj) => out.push(obj));
  tracker.consume(text);
  return out;
}

function buildSimilarUserMessage(referenceRecipe, ingredients, preferences) {
  const lines = [
    "I just saw a recipe I liked and I want more like it.",
    "",
    "REFERENCE RECIPE:",
    `- Name: ${referenceRecipe.name}`,
  ];
  if (referenceRecipe.cuisine) lines.push(`- Cuisine: ${referenceRecipe.cuisine}`);
  if (referenceRecipe.category) lines.push(`- Category: ${referenceRecipe.category}`);
  if (referenceRecipe.totalTimeMinutes != null) {
    lines.push(`- Total time: ${referenceRecipe.totalTimeMinutes} minutes`);
  }
  if (referenceRecipe.difficulty) {
    lines.push(`- Difficulty: ${referenceRecipe.difficulty}`);
  }
  if (referenceRecipe.tagline) lines.push(`- Vibe: ${referenceRecipe.tagline}`);
  const refIngs = Array.isArray(referenceRecipe.ingredients)
    ? referenceRecipe.ingredients
        .map((i) => i?.name)
        .filter(Boolean)
        .slice(0, 8)
    : [];
  if (refIngs.length > 0) {
    lines.push(`- Key ingredients: ${refIngs.join(", ")}`);
  }
  lines.push("");

  if (Array.isArray(ingredients) && ingredients.length > 0) {
    lines.push(`What I have on hand: ${ingredients.join(", ")}.`);
  } else {
    lines.push(
      "I'm exploring, not strictly cooking right now — no ingredient constraint. Suggest based on the reference's signature.",
    );
  }

  if (preferences) {
    if (preferences.diet) lines.push(`Diet: ${preferences.diet}.`);
    if (Array.isArray(preferences.allergies) && preferences.allergies.length) {
      lines.push(`Avoid (allergies): ${preferences.allergies.join(", ")}.`);
    }
  }

  lines.push("");
  lines.push(
    "Generate the 5 similar-mode recipes per the system rules, streaming them out as you go.",
  );
  return lines.join("\n");
}

function buildUserMessage(ingredients, preferences) {
  const ingredientLines = ingredients.map((i) => `- ${i}`).join("\n");
  const lines = [
    "USER'S AVAILABLE INGREDIENTS (use ONLY these):",
    ingredientLines,
    "",
    "You have NOTHING else available. Work only with the above.",
    "Do not add anything not on this list except salt, pepper, and cooking oil.",
  ];
  if (preferences) {
    if (preferences.diet) lines.push(`Diet: ${preferences.diet}.`);
    if (Array.isArray(preferences.allergies) && preferences.allergies.length) {
      lines.push(`Avoid (allergies): ${preferences.allergies.join(", ")}.`);
    }
    if (preferences.cuisine)
      lines.push(`Cuisine preference: ${preferences.cuisine}.`);
    if (preferences.maxTimeMinutes) {
      lines.push(
        `Keep total time under ${preferences.maxTimeMinutes} minutes when possible.`,
      );
    }
    if (preferences.skillLevel) {
      lines.push(`Cook skill level: ${preferences.skillLevel}.`);
    }
    if (preferences.context) {
      lines.push(`Context for this request: ${preferences.context}.`);
    }
  }
  lines.push(
    "Generate up to 5 recipes per the system rules (fewer if needed to avoid adding ingredients I don't have), streaming them out as you go.",
  );
  return lines.join("\n");
}

function buildDynamicSystemBlock(profile, blocklist, similarTo, userPrefs) {
  const sections = [];

  const prefSection = buildPreferenceSection(userPrefs);
  if (prefSection) sections.push(prefSection);

  if (similarTo) {
    sections.push(
      `SIMILAR-RECIPE MODE\n` +
        `The user just saw a recipe they liked and wants more like it. Generate 5 recipes that ` +
        `are similar in spirit to the reference dish — variations on the theme, not exact copies.\n\n` +
        `MATCH THE REFERENCE ON:\n` +
        `- Cuisine and general style\n` +
        `- Cooking technique (e.g. if the reference is a one-pan dish, suggestions should also be one-pan; if it's grilled, lean grilled)\n` +
        `- Flavor profile (e.g. if the reference is creamy and comforting, stay creamy and comforting; if it's bright and acidic, stay bright)\n` +
        `- Total time within ±15 minutes of the reference\n` +
        `- Same difficulty level\n\n` +
        `STILL VARY:\n` +
        `- Each of the 5 recipes must be DIFFERENT from the reference dish (no exact reproductions or name-clones) and DIFFERENT from each other.\n` +
        `- Try to vary specific dishes, hero ingredients, or small techniques while keeping the cuisine/style anchor.\n\n` +
        `RULES THAT ARE RELAXED IN THIS MODE:\n` +
        `- The "one of each category" requirement does NOT apply. Categories can repeat across the 5 recipes since the goal is variations on a single theme rather than maximizing breadth.\n` +
        `- The wildcard slot rule is DISABLED. Do not mark any recipe as "wildcard". Stay on the theme.\n\n` +
        `INGREDIENT HANDLING:\n` +
        `- If the user provided "what I have on hand", lean on those ingredients but minor additions or substitutions are fine (the user is exploring, not strictly cooking right now).\n` +
        `- If the user has no ingredient constraint, generate freely based on the reference's signature.`,
    );
  }

  if (profile && profile.personalizationLevel !== "none" && profile.rawProfileString) {
    if (similarTo) {
      // In similar mode, the profile is background context only — we don't
      // re-impose the wildcard / one-of-each-category rules because the
      // similar-mode section above already overrode them.
      sections.push(
        `User behavioral profile (background context — subtle bias only):\n${profile.rawProfileString}\n\n` +
          `Lean toward the user's preferences when picking specific dishes, but the SIMILAR-RECIPE MODE rules above take precedence over everything in this profile. Never mention the profile.`,
      );
    } else {
      sections.push(
        `User behavioral profile (use to subtly tune recipe selection):\n${profile.rawProfileString}\n\n` +
          `INSTRUCTIONS:\n` +
          `- Use this profile to subtly bias recipe selection. Do NOT force every recipe to match the profile — variety still matters.\n` +
          `- Reserve EXACTLY 1 of the 5 recipes as a "wildcard" that intentionally explores OUTSIDE the user's usual patterns. Mark its category as "wildcard" (replacing one of the default categories — typically "creative" — when you do so). The wildcard exists to prevent a filter bubble; it should be appetizing but stylistically different from what the user usually picks.\n` +
          `- The other 4 recipes should each fall into a different default category (fastest / healthiest / popular / hearty / creative — pick any four), tilted toward the user's preferences.\n` +
          `- If the user has supplied an ingredient that appears in their dislike list, still suggest exactly 1 recipe that uses it well — tastes shift, and occasional exposure either validates the dislike or surfaces a hidden preference.\n` +
          `- NEVER explicitly mention the profile, the personalization, or that you have learned anything about the user. The tuning is invisible.`,
      );
    }
  }

  if (Array.isArray(blocklist) && blocklist.length > 0) {
    const names = blocklist.slice(0, 40).map((b) => `- ${b.name}`).join("\n");
    sections.push(
      `The user has previously asked never to suggest these recipes again. Generate completely different recipes — do not name, paraphrase, or closely resemble any of these:\n${names}`,
    );
  }

  return sections.join("\n\n");
}

function normalizeRecipe(r, idx) {
  if (!r || typeof r !== "object") return null;

  const id =
    typeof r.id === "string" && r.id.trim() ? r.id.trim() : `recipe-${idx + 1}`;

  const category = VALID_CATEGORIES.has(r.category) ? r.category : "popular";

  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients
        .filter((i) => i && typeof i.name === "string")
        .map((i) => ({
          name: String(i.name).trim().toLowerCase(),
          amount: i.amount != null ? String(i.amount) : "",
          unit: i.unit != null ? String(i.unit) : "",
        }))
    : [];

  const steps = Array.isArray(r.steps)
    ? r.steps
        .filter((s) => s && typeof s.instruction === "string")
        .map((s, i) => ({
          step: typeof s.step === "number" ? s.step : i + 1,
          instruction: String(s.instruction).trim(),
          timerMinutes:
            typeof s.timerMinutes === "number" && s.timerMinutes > 0
              ? Math.round(s.timerMinutes)
              : null,
        }))
    : [];

  return {
    id,
    name: String(r.name ?? "Untitled Recipe").trim(),
    tagline: typeof r.tagline === "string" ? r.tagline.trim() : "",
    category,
    cuisine:
      typeof r.cuisine === "string" && r.cuisine.trim()
        ? r.cuisine.trim().toLowerCase()
        : null,
    totalTimeMinutes:
      typeof r.totalTimeMinutes === "number" ? r.totalTimeMinutes : null,
    difficulty: ["easy", "medium", "hard"].includes(r.difficulty)
      ? r.difficulty
      : "easy",
    servings: typeof r.servings === "number" ? r.servings : 2,
    emoji: typeof r.emoji === "string" && r.emoji ? r.emoji : "🍽️",
    ingredients,
    steps,
    tips: typeof r.tips === "string" && r.tips.trim() ? r.tips.trim() : null,
    nutrition: normalizeNutrition(r.nutrition),
  };
}

// Validate the AI's per-serving nutrition estimate. Returns null if the object
// is missing or has none of the core macros, so the UI can cleanly skip it.
function normalizeNutrition(n) {
  if (!n || typeof n !== "object") return null;
  const num = (v) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;

  const calories = num(n.calories);
  const protein = num(n.protein);
  const carbs = num(n.carbs);
  const fat = num(n.fat);

  // Need at least one core macro to be worth showing.
  if (calories == null && protein == null && carbs == null && fat == null) {
    return null;
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber: num(n.fiber),
    sugar: num(n.sugar),
    sodium: num(n.sodium),
    servingSize:
      typeof n.servingSize === "string" && n.servingSize.trim()
        ? n.servingSize.trim()
        : null,
  };
}

function makeCacheKey(ingredients, preferences) {
  const ing = [...ingredients]
    .map((s) => String(s).trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(",");
  const pref = preferences ? JSON.stringify(sortKeys(preferences)) : "";
  // Include the persisted onboarding-survey preferences in the cache key
  // so changing diet/spice/etc in Settings invalidates stale recipes for
  // the same ingredients.
  const userPrefs = getPreferences();
  const userPrefKey = userPrefs
    ? JSON.stringify(
        sortKeys({
          diet: userPrefs.diet,
          allergies: userPrefs.allergies,
          customAvoidList: userPrefs.customAvoidList,
          spiceLevel: userPrefs.spiceLevel,
          favoriteCuisines: userPrefs.favoriteCuisines,
          skillLevel: userPrefs.skillLevel,
          timePreference: userPrefs.timePreference,
          ingredientDislikes: userPrefs.ingredientDislikes,
        }),
      )
    : "";
  return `${ing}|${pref}|${userPrefKey}`;
}

function sortKeys(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
  return out;
}

// Builds the "User preferences" block injected into every system prompt.
// Sourced from the onboarding survey answers in localStorage. Returns
// null if the user has no preferences saved (skipped onboarding fully
// without answering anything) so we don't waste tokens.
function buildPreferenceSection(prefs) {
  if (!prefs) return null;

  const lines = [];
  const diet =
    prefs.diet && prefs.diet !== "none"
      ? DIET_LABELS[prefs.diet] || prefs.diet
      : null;
  if (diet) lines.push(`- Diet: ${diet} — every recipe must strictly fit this diet.`);
  else lines.push(`- Diet: no restrictions.`);

  const avoid = getAvoidList(prefs);
  if (avoid.length > 0) {
    lines.push(
      `- NEVER use these ingredients (allergies + avoid-list + dislikes): ${avoid.join(", ")}. Treat this as an absolute exclusion — no recipe may contain any of these, including as a minor ingredient, garnish, or substitution.`,
    );
  }

  // "any" (the default — user opted out of specifying) means: no spice
  // constraint at all. Skip the line entirely so the model is free to
  // mix heat levels naturally.
  if (prefs.spiceLevel && prefs.spiceLevel !== "any") {
    const spice = SPICE_LABELS[prefs.spiceLevel] || prefs.spiceLevel;
    lines.push(
      `- Spice tolerance: ${spice} — calibrate chili / pepper / heat to this level. "No spice" means avoid spicy ingredients entirely; "Bring the heat" means lean into them.`,
    );
  }

  if (Array.isArray(prefs.favoriteCuisines) && prefs.favoriteCuisines.length > 0) {
    lines.push(
      `- Favorite cuisines (lean toward these but don't force every recipe to match): ${prefs.favoriteCuisines.join(", ")}.`,
    );
  }

  const skill = prefs.skillLevel
    ? SKILL_LABELS[prefs.skillLevel] || prefs.skillLevel
    : null;
  if (skill) {
    lines.push(
      `- Skill level: ${skill} — adjust technique complexity accordingly. Beginner = basic techniques and forgiving recipes; Advanced = freely use more involved technique.`,
    );
  }

  const time = prefs.timePreference
    ? TIME_LABELS[prefs.timePreference] || prefs.timePreference
    : null;
  if (time) {
    lines.push(
      `- Time preference: ${time} — most suggestions should fit this window, though variety still matters.`,
    );
  }

  if (lines.length === 0) return null;

  return (
    `User preferences (from onboarding survey — these are hard signals about the user's taste):\n` +
    lines.join("\n") +
    `\n\nUse this information to subtly tune your 5 recipe suggestions. Vary the cuisines while leaning toward favorites. Strictly avoid ingredients in the never-use list. Match spice levels to tolerance. Calibrate difficulty and time to skill and time preference. Never mention these preferences to the user — the tuning is invisible.`
  );
}
