import Anthropic from "@anthropic-ai/sdk";
import { prepareImageForUpload } from "./imagePrep.js";

// TODO: Move to backend before launch.
// Calling the Anthropic API directly from the browser exposes the API key
// to anyone who opens devtools. Acceptable for local v0.1 testing only —
// in Phase 2 this moves behind a Vercel serverless function and we drop
// `dangerouslyAllowBrowser`.
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

const client = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

// Haiku is roughly 3x faster and ~1/3 the cost of Sonnet for vision.
// For straightforward ingredient ID it's plenty — the user gets to edit
// the result on the confirm screen anyway. Sonnet is still used for
// recipe generation where quality matters more.
const VISION_MODEL = "claude-haiku-4-5";

const VALID_CATEGORIES = new Set([
  "produce", "meat", "seafood", "dairy", "eggs", "grains", "pasta", "bread",
  "condiments", "sauces", "herbs", "spices", "oils", "beverages", "snacks",
  "frozen", "canned", "baking", "other",
]);
const VALID_FRESHNESS = new Set([
  "fresh", "ripe", "unripe", "overripe", "frozen", "packaged", "unknown",
]);
const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);
const VALID_STATUS = new Set(["ok", "empty", "blurry", "non_food"]);

const SYSTEM_PROMPT = `You are a meticulous food-spotter helping a home cook take stock of what they have. Identify EVERY visible food ingredient in the photo with extreme precision.

BE EXHAUSTIVE
- Scan the entire image carefully: front, back, edges, behind other items, partially hidden, items in transparent containers (plastic bags, glass jars, Tupperware), items in cartons or packaging.
- Check the top of shelves, the bottoms of drawers, fridge door pockets, the side of every shelf.
- Don't skip small or partial items — if you can see any portion of it, identify it (half a lemon, a corner of a package, a barely-visible bunch of herbs).
- Read every visible label on packaged goods and identify the product (cereal boxes, condiment bottles, milk cartons, sauce jars, spice tins).
- Check for items on top of, beside, and behind the main subjects in the frame.

BE SPECIFIC
- Use the most specific name the photo justifies — but never invent details you can't see:
  • "Roma tomatoes" or "cherry tomatoes" not just "tomatoes"
  • "boneless skinless chicken thighs" not just "chicken"
  • "sharp cheddar" not just "cheese"
  • "Italian flat-leaf parsley" not just "herbs"
  • "russet potato" or "Yukon gold" not just "potato"
  • Distinguish dairy: whole milk vs. skim milk vs. oat milk vs. yogurt vs. sour cream vs. buttermilk
- Distinguish similar-looking items carefully:
  • green onions vs. leeks vs. chives
  • parsley vs. cilantro vs. dill
  • basil vs. mint vs. shiso
  • ground beef vs. ground turkey vs. ground pork
  • red onion vs. yellow onion vs. shallot
  • cheddar vs. American vs. mozzarella vs. provolone
- Use lowercase common-grocery names. Plural when the item is naturally plural.
- Note ripeness when visually meaningful: "ripe avocado", "green banana", "overripe tomato".

QUANTITY ESTIMATION
- Note approximate quantities when visible: "about 5 eggs", "half a head of romaine", "a small bunch of basil", "1 lb package of ground beef", "half-full jar of marinara".
- For packaged goods, note the package size when readable on the label.
- Use null only when there's genuinely no way to estimate.

COMMON MISSES TO AVOID
Walk through this checklist on every photo:
- Condiments and sauces in the fridge door (mustard, ketchup, soy sauce, hot sauce, dressings, mayo, salsa)
- Oils and vinegars on counters or pantry shelves
- Herbs and spices in jars or fresh sprigs
- Eggs (often in cartons that look generic — check egg-carton-shaped containers)
- Butter, sticks of butter, tub butter
- Leftovers or pre-prepared foods in containers (Tupperware, deli containers)
- Baking ingredients in pantry shots (flour, sugar, baking soda, baking powder, cocoa, vanilla)
- Pasta, rice, dried beans in bags or canisters
- Frozen items in a freezer shot
- Canned goods — read the labels

CATEGORY (pick exactly one)
produce, meat, seafood, dairy, eggs, grains, pasta, bread, condiments, sauces, herbs, spices, oils, beverages, snacks, frozen, canned, baking, other.

FRESHNESS
fresh, ripe, unripe, overripe, frozen, packaged, unknown.

CONFIDENCE
- "high"   : clearly visible and identifiable
- "medium" : visible but partially obscured, or you're sure of the category but not the variety
- "low"    : guessing from context, packaging shape, or partial cues

OUTPUT FORMAT
Return ONLY a single JSON object with this exact shape — no preamble, no markdown, no code fences:

{
  "status": "ok" | "empty" | "blurry" | "non_food",
  "note": "<short reason if status is not 'ok'; omit otherwise>",
  "ingredients": [
    {
      "name": "<lowercase specific name>",
      "quantity": "<rough quantity, or null>",
      "freshness": "fresh" | "ripe" | "unripe" | "overripe" | "frozen" | "packaged" | "unknown",
      "category": "<one of the categories>",
      "confidence": "high" | "medium" | "low"
    }
  ]
}

Status meanings:
- "ok"       → food is visible; populate ingredients[]
- "empty"    → clearly a fridge/pantry/shelf but with no identifiable food; ingredients = []
- "blurry"   → image is too blurry, dark, or low-res to identify items; ingredients = []
- "non_food" → photo is clearly not of food or a kitchen storage area; ingredients = []

Cap ingredients[] at 40 items, prioritizing the most useful for cooking.`;

export async function identifyIngredients(files, { onProgress } = {}) {
  if (!client) {
    throw new Error(
      "Missing VITE_ANTHROPIC_API_KEY. Add it to .env.local and restart `npm run dev`.",
    );
  }
  const fileArray = Array.isArray(files) ? files : [files];
  if (fileArray.length === 0) {
    throw new Error("Need at least one photo.");
  }

  onProgress?.("Looking at your photo…");

  const prepared = await Promise.all(
    fileArray.map((f) => prepareImageForUpload(f)),
  );
  const imageBlocks = prepared.map(({ base64, mediaType }) => ({
    type: "image",
    source: { type: "base64", media_type: mediaType, data: base64 },
  }));

  // Pass 1 — exhaustive first scan.
  const rawFirst = await callClaude(imageBlocks, framingFor(fileArray.length));
  let firstPass;
  try {
    firstPass = parseResponse(rawFirst);
  } catch (err) {
    console.error("[identifyIngredients] first pass parse failed:\n", rawFirst, "\nError:", err);
    throw new Error("Got a weird answer back from the model. Try a different photo?", { cause: err });
  }

  // Skip pass 2 when there's nothing to refine: image was blurry / empty /
  // non-food, or pass 1 already returned a meaningful list and we just
  // need to ship it. We still run pass 2 on lists with very few items —
  // those are exactly where refinement helps most.
  if (firstPass.status !== "ok") {
    onProgress?.("Almost ready…");
    return firstPass;
  }

  onProgress?.("Double-checking…");

  // Pass 2 — refinement. Hand the same images back along with the first
  // pass's list and ask the model to look again for anything missed and
  // tighten any vague labels. Tolerant of failure: if pass 2 errors or
  // parses poorly, we fall back to pass 1 instead of failing the user.
  let merged = firstPass;
  try {
    const rawSecond = await callClaude(
      imageBlocks,
      refinementFraming(firstPass.ingredients, fileArray.length),
    );
    const secondPass = parseResponse(rawSecond);
    if (secondPass.status === "ok" && secondPass.ingredients.length > 0) {
      merged = mergePasses(firstPass, secondPass);
    }
  } catch (err) {
    console.warn("[identifyIngredients] refinement pass failed, using first pass:", err);
  }

  onProgress?.("Almost ready…");
  return merged;
}

function framingFor(count) {
  return count === 1
    ? "Identify all visible food ingredients in this photo. Return the JSON object per the system instructions."
    : `Identify all visible food ingredients across these ${count} photos, combining them into one list. Return the JSON object per the system instructions.`;
}

// Refinement-pass framing. The model sees the same images plus the first
// pass's findings and is asked to look harder for missed items, refine
// vague labels, and return a combined complete list.
function refinementFraming(firstPassIngredients, count) {
  const summary = firstPassIngredients
    .map((i) => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
    .join("\n");
  const photos =
    count === 1
      ? "the photo"
      : `the ${count} photos`;
  return `Here is your first-pass list of ingredients from ${photos}:

${summary || "(no ingredients found yet)"}

Did you miss anything? Look more carefully at:
- Corners and edges of the frame
- Items inside transparent containers, jars, and Tupperware
- Items partially behind or stacked on top of other items
- Small items: garlic cloves, individual herbs, single eggs, sticks of butter
- Fridge door pockets and shelves of the door
- Labels on packages you may have skipped
- Anything you marked vaguely — can you be more specific now (e.g. "tomatoes" → "Roma tomatoes")?

Return ONE combined refined JSON list that includes BOTH the items you already found AND anything new you spot on this closer look, with refined names where applicable. Same JSON object shape as before — no preamble, no markdown.`;
}

// Merge first + second pass results. Second pass is authoritative for
// items that appear in both (it has the refined name + better confidence).
// Items only in the first pass are kept verbatim so we never lose data.
function mergePasses(first, second) {
  const byKey = new Map();
  const keyFor = (i) => {
    // Two ingredients dedupe iff their names share the same head noun.
    // "tomatoes" and "Roma tomatoes" → both key on "tomato". This lets
    // pass 2's refinements supersede pass 1's vague labels.
    const tokens = i.name.split(/\s+/).filter(Boolean);
    const head = tokens[tokens.length - 1] || i.name;
    const stem = head.endsWith("s") && head.length > 3 ? head.slice(0, -1) : head;
    return stem;
  };

  // Seed with first pass, then let second pass overwrite (refinement wins).
  for (const item of first.ingredients) byKey.set(keyFor(item), item);
  for (const item of second.ingredients) {
    const key = keyFor(item);
    const prior = byKey.get(key);
    if (!prior) {
      byKey.set(key, item);
      continue;
    }
    // Prefer the more specific name (longer wins as a proxy), keep the
    // best available quantity, and take the higher confidence.
    const longer = item.name.length > prior.name.length ? item : prior;
    byKey.set(key, {
      name: longer.name,
      quantity: prior.quantity || item.quantity,
      freshness: item.freshness || prior.freshness,
      category: item.category || prior.category,
      confidence:
        confidenceRank(item.confidence) >= confidenceRank(prior.confidence)
          ? item.confidence
          : prior.confidence,
    });
  }

  return {
    status: second.status || first.status,
    note: second.note || first.note,
    ingredients: [...byKey.values()],
  };
}

function confidenceRank(c) {
  if (c === "high") return 2;
  if (c === "medium") return 1;
  return 0;
}

async function callClaude(imageBlocks, instructionText) {
  const response = await client.messages.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    // Cache the system prompt — it's identical across every photo call.
    // If the prompt is under the model's cache threshold the API silently
    // skips caching and we pay the normal rate; no downside.
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [...imageBlocks, { type: "text", text: instructionText }],
      },
    ],
  });
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

function parseResponse(text) {
  let cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }

  const status = VALID_STATUS.has(parsed.status) ? parsed.status : "ok";
  const note = typeof parsed.note === "string" ? parsed.note.trim() : null;
  const rawIngredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
    : [];

  const ingredients = [];
  const seen = new Set();
  for (const item of rawIngredients) {
    const norm = normalizeIngredient(item);
    if (!norm) continue;
    if (seen.has(norm.name)) continue;
    seen.add(norm.name);
    ingredients.push(norm);
  }

  return { status, note, ingredients };
}

function normalizeIngredient(item) {
  if (!item || typeof item !== "object") return null;
  const name = typeof item.name === "string" ? item.name.trim().toLowerCase() : "";
  if (!name) return null;
  return {
    name,
    quantity:
      typeof item.quantity === "string" && item.quantity.trim()
        ? item.quantity.trim()
        : null,
    freshness: VALID_FRESHNESS.has(item.freshness) ? item.freshness : "unknown",
    category: VALID_CATEGORIES.has(item.category) ? item.category : "other",
    confidence: VALID_CONFIDENCE.has(item.confidence) ? item.confidence : "medium",
  };
}
