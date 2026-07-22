// Smart ingredient autocomplete + spell-check.
//
// Used in two places:
//   • TypeIngredients — live suggestion chips and a "Did you mean…" prompt
//   • GroceryList's AddItemModal — same chips as TypeIngredients
//
// All pure JS — no deps. Fuzzy matching uses Levenshtein for "off by a
// couple letters" and a small Soundex implementation for "really wild
// misspellings" as a last-resort phonetic fallback.

import { getEmojiForIngredient } from "./ingredientEmojis.js";

/* ── Dictionary ──────────────────────────────────────────────────────────
 * Around 500 common cooking ingredients. Kept as a flat lowercase list
 * because the emoji-lookup module already handles the name → emoji map,
 * and the matching code is name-driven.
 *
 * Names are written the way a home cook would type them. Where a
 * specific cut/variety is more common than the generic, both are
 * present (so "chicken" surfaces "chicken thighs" and "chicken breast"
 * as separate suggestions).
 */
export const INGREDIENT_DICTIONARY = [
  // Proteins — poultry / red meat
  "chicken", "chicken breast", "chicken thighs", "chicken wings",
  "chicken drumsticks", "boneless skinless chicken thighs",
  "ground chicken", "rotisserie chicken", "whole chicken",
  "turkey", "ground turkey", "turkey breast",
  "duck", "duck breast",
  "beef", "ground beef", "steak", "ribeye", "sirloin", "tenderloin",
  "filet mignon", "flank steak", "skirt steak", "brisket", "chuck roast",
  "short ribs", "stew meat", "veal",
  "pork", "ground pork", "pork chops", "pork tenderloin", "pork shoulder",
  "pork belly", "ham", "prosciutto", "bacon", "pancetta", "chorizo",
  "sausage", "italian sausage", "salami", "pepperoni", "hot dog",
  "lamb", "ground lamb", "lamb chops", "lamb shoulder",
  // Seafood
  "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "mackerel",
  "sardines", "anchovies", "sea bass", "snapper", "swordfish", "haddock",
  "sole", "flounder", "smoked salmon",
  "shrimp", "prawns", "lobster", "crab", "crab meat", "scallops",
  "clams", "mussels", "oysters", "squid", "calamari", "octopus",
  // Eggs
  "eggs", "egg whites", "egg yolks", "quail eggs",
  // Dairy
  "milk", "whole milk", "skim milk", "2% milk", "heavy cream",
  "half and half", "buttermilk", "evaporated milk", "condensed milk",
  "butter", "unsalted butter", "salted butter", "ghee",
  "cheese", "cheddar", "sharp cheddar", "mozzarella", "fresh mozzarella",
  "parmesan", "pecorino", "feta", "ricotta", "cottage cheese",
  "cream cheese", "brie", "gouda", "swiss cheese", "provolone",
  "goat cheese", "blue cheese", "gorgonzola", "manchego", "halloumi",
  "yogurt", "greek yogurt", "plain yogurt", "sour cream",
  "crème fraîche",
  // Plant milks
  "almond milk", "oat milk", "soy milk", "coconut milk", "cashew milk",
  // Produce — vegetables
  "tomatoes", "roma tomatoes", "cherry tomatoes", "grape tomatoes",
  "san marzano tomatoes",
  "onion", "yellow onion", "red onion", "white onion", "sweet onion",
  "shallot", "green onions", "scallions", "chives", "leeks",
  "garlic", "garlic cloves", "garlic powder", "minced garlic",
  "ginger", "fresh ginger",
  "lettuce", "romaine", "iceberg lettuce", "butter lettuce",
  "arugula", "spinach", "baby spinach", "kale", "swiss chard",
  "collard greens", "cabbage", "red cabbage", "napa cabbage",
  "bok choy", "brussels sprouts",
  "carrots", "baby carrots",
  "potatoes", "russet potatoes", "yukon gold potatoes",
  "red potatoes", "fingerling potatoes", "sweet potato", "yams",
  "broccoli", "broccolini", "cauliflower", "romanesco",
  "cucumber", "english cucumber", "persian cucumber",
  "zucchini", "yellow squash", "butternut squash", "acorn squash",
  "pumpkin", "delicata squash",
  "eggplant", "japanese eggplant",
  "bell pepper", "red bell pepper", "yellow bell pepper",
  "green bell pepper", "orange bell pepper",
  "jalapeño", "habanero", "serrano pepper", "poblano pepper",
  "thai chili", "anaheim pepper",
  "mushrooms", "button mushrooms", "cremini mushrooms",
  "portobello mushrooms", "shiitake mushrooms", "oyster mushrooms",
  "asparagus", "celery", "fennel", "radish", "watermelon radish",
  "beets", "turnip", "parsnip", "rutabaga", "okra", "artichoke",
  "corn", "fresh corn", "frozen corn",
  "green beans", "snow peas", "snap peas", "peas", "edamame",
  "bean sprouts", "watercress", "endive", "radicchio",
  // Produce — fruits
  "apple", "green apple", "red apple", "honeycrisp apple",
  "banana", "plantain",
  "orange", "blood orange", "mandarin", "tangerine",
  "lemon", "meyer lemon", "lime", "key lime", "grapefruit",
  "pear", "peach", "plum", "nectarine", "apricot",
  "cherries", "strawberries", "blueberries", "raspberries",
  "blackberries", "cranberries",
  "grapes", "watermelon", "cantaloupe", "honeydew",
  "pineapple", "mango", "papaya", "kiwi", "pomegranate",
  "figs", "dates", "raisins", "dried cranberries",
  "avocado", "coconut",
  // Herbs
  "basil", "fresh basil", "parsley", "italian parsley", "cilantro",
  "mint", "rosemary", "thyme", "sage", "oregano", "dill",
  "tarragon", "bay leaves", "chervil", "marjoram",
  // Spices
  "salt", "kosher salt", "sea salt", "flaky salt",
  "pepper", "black pepper", "white pepper",
  "paprika", "smoked paprika", "cumin", "ground cumin",
  "coriander", "turmeric", "curry powder", "garam masala",
  "cinnamon", "ground cinnamon", "cinnamon sticks",
  "nutmeg", "cloves", "cardamom", "allspice",
  "cayenne", "chili powder", "red pepper flakes", "crushed red pepper",
  "garlic powder", "onion powder", "italian seasoning",
  "herbes de provence", "chinese five spice", "old bay",
  "saffron", "star anise", "fennel seeds", "mustard seeds",
  "sumac", "za'atar",
  // Pantry — grains and starches
  "rice", "white rice", "brown rice", "jasmine rice", "basmati rice",
  "arborio rice", "sushi rice", "wild rice",
  "pasta", "spaghetti", "linguine", "fettuccine", "penne",
  "rigatoni", "macaroni", "lasagna noodles", "ravioli", "tortellini",
  "orzo", "ditalini", "bowtie pasta", "gnocchi",
  "noodles", "udon", "soba", "ramen", "rice noodles", "vermicelli",
  "egg noodles", "lo mein noodles",
  "quinoa", "couscous", "pearl couscous", "barley", "farro",
  "bulgur", "oats", "rolled oats", "steel cut oats", "oatmeal",
  "polenta", "cornmeal", "grits",
  // Pantry — bread and bakery
  "bread", "sourdough", "baguette", "ciabatta", "brioche",
  "whole wheat bread", "white bread", "rye bread",
  "tortilla", "flour tortillas", "corn tortillas",
  "pita", "naan", "bagel", "english muffin", "buns",
  "burger buns", "hot dog buns", "wrap", "crackers", "panko",
  "breadcrumbs",
  // Pantry — baking
  "flour", "all purpose flour", "bread flour", "cake flour",
  "whole wheat flour", "almond flour", "rice flour",
  "sugar", "brown sugar", "powdered sugar", "confectioners sugar",
  "honey", "maple syrup", "molasses", "agave",
  "yeast", "active dry yeast", "instant yeast", "baking soda",
  "baking powder", "cocoa powder", "chocolate chips", "dark chocolate",
  "milk chocolate", "white chocolate",
  "vanilla", "vanilla extract", "almond extract",
  // Pantry — oils and vinegars
  "olive oil", "extra virgin olive oil", "vegetable oil",
  "canola oil", "sesame oil", "coconut oil", "avocado oil",
  "peanut oil", "grapeseed oil",
  "vinegar", "white vinegar", "apple cider vinegar",
  "balsamic vinegar", "rice vinegar", "red wine vinegar",
  "white wine vinegar", "sherry vinegar",
  // Pantry — sauces and condiments
  "soy sauce", "tamari", "fish sauce", "oyster sauce",
  "hoisin sauce", "sriracha", "tabasco", "hot sauce",
  "ketchup", "mustard", "dijon mustard", "yellow mustard",
  "whole grain mustard", "mayonnaise", "mayo",
  "barbecue sauce", "worcestershire sauce", "salsa", "pesto",
  "tahini", "miso", "marinara sauce", "tomato sauce", "tomato paste",
  "pasta sauce", "alfredo sauce", "teriyaki sauce", "chimichurri",
  "harissa", "gochujang", "kimchi", "sauerkraut",
  "jam", "jelly", "preserves", "marmalade",
  "peanut butter", "almond butter", "cashew butter",
  // Pantry — canned & jarred
  "canned tomatoes", "diced tomatoes", "crushed tomatoes",
  "tomato sauce", "tomato paste", "canned tuna", "tinned sardines",
  "canned salmon", "canned chickpeas", "chickpeas", "garbanzo beans",
  "black beans", "kidney beans", "pinto beans", "white beans",
  "cannellini beans", "navy beans", "lentils", "red lentils",
  "green lentils", "yellow split peas",
  "olives", "kalamata olives", "green olives", "capers",
  "pickles", "dill pickles", "pickled jalapeños",
  "coconut milk", "coconut cream",
  "stock", "chicken stock", "beef stock", "vegetable stock",
  "chicken broth", "vegetable broth", "bouillon",
  // Pantry — nuts and seeds
  "almonds", "sliced almonds", "cashews", "walnuts", "pecans",
  "pistachios", "hazelnuts", "macadamia nuts", "peanuts",
  "pine nuts", "sesame seeds", "sunflower seeds",
  "pumpkin seeds", "chia seeds", "flax seeds", "hemp seeds",
  // Frozen
  "ice cream", "gelato", "sorbet", "frozen yogurt", "popsicles",
  "frozen pizza", "frozen vegetables", "frozen berries",
  "frozen peas", "frozen broccoli", "frozen spinach", "frozen corn",
  // Beverages
  "water", "sparkling water", "club soda",
  "juice", "orange juice", "apple juice", "lemonade",
  "soda", "coke", "ginger ale",
  "coffee", "espresso", "tea", "green tea", "black tea", "matcha",
  "wine", "red wine", "white wine", "rosé", "champagne",
  "beer", "ale", "ipa", "cider",
];

// Pre-computed structures for fast lookup at typing speed. Both raw and
// phonetically-normalized Soundex codes are stored so we can catch
// "kwinoah" → quinoa and "kahbij" → cabbage even though the first
// letters differ (kw ≈ qu, k(vowel) ≈ c(vowel) in casual phonetics).
const DICT_LOWER = INGREDIENT_DICTIONARY.map((s) => s.toLowerCase());
const DICT_SET = new Set(DICT_LOWER);
const DICT_SOUNDEX = DICT_LOWER.map((s) => soundex(phoneticNormalize(firstWord(s))));

/* ── Public API ──────────────────────────────────────────────────────── */

/**
 * Returns up to `limit` suggestions ranked by how well they match the
 * user's input. Empty/whitespace input returns []. Exact matches return
 * an empty array too — there's nothing to suggest if the user already
 * typed a valid ingredient verbatim.
 *
 * Scoring tiers (highest first):
 *   1. exact prefix match           — score: 100 + (length-of-input × 2)
 *   2. word-start prefix match      — score: 80
 *   3. substring match              — score: 60
 *   4. levenshtein within 2 edits   — score: 50 - (distance × 10)
 *   5. soundex phonetic match       — score: 20 (last-resort)
 */
export function getSuggestions(input, limit = 5) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw || raw.length < 1) return [];
  // Already an exact ingredient — no suggestions needed.
  if (DICT_SET.has(raw)) return [];

  const scores = new Map(); // name → score
  const inputSoundex = soundex(phoneticNormalize(raw));

  for (let i = 0; i < DICT_LOWER.length; i++) {
    const name = DICT_LOWER[i];
    let score = 0;
    if (name.startsWith(raw)) {
      score = 100 + raw.length * 2;
    } else if (matchesWordStart(name, raw)) {
      score = 80;
    } else if (name.includes(raw)) {
      score = 60;
    } else if (raw.length >= 3) {
      // Compare against the shortest matchable form — for multi-word
      // ingredients ("chicken thighs") we also test against the first
      // word so "chiken" → "chicken thighs" via the chicken stem.
      const targetWord = firstWord(name);
      const dist = levenshtein(raw, targetWord);
      if (dist <= 2 && dist < targetWord.length) {
        score = 50 - dist * 10;
      } else if (DICT_SOUNDEX[i] && DICT_SOUNDEX[i] === inputSoundex) {
        score = 20;
      }
    }
    if (score > 0) {
      const existing = scores.get(name) || 0;
      if (score > existing) scores.set(name, score);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      // Stable tiebreaker: shorter names first so "tomato" wins over
      // "tomato paste" when both score equally on a prefix match.
      return a[0].length - b[0].length;
    })
    .slice(0, limit)
    .map(([name]) => ({ name, emoji: getEmojiForIngredient(name) }));
}

/**
 * Best single suggestion for "did you mean…" prompts. Returns `null`
 * unless we have strong evidence the user meant something other than
 * what they typed — close fuzzy match (≤ 2 edits) AND the suggestion
 * is meaningfully different from what they typed.
 */
export function didYouMean(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw || raw.length < 3) return null;
  if (DICT_SET.has(raw)) return null;
  if (SAFE_FILLER_WORDS.has(raw)) return null;

  // Don't propose a correction when the input is plausibly a prefix or
  // substring of a real ingredient — the user might just be mid-typing.
  // "mato" shouldn't surface "mayo" because "tomato" contains it.
  for (const name of DICT_LOWER) {
    if (name.includes(raw)) return null;
  }

  let best = null;
  let bestDist = Infinity;
  for (const name of DICT_LOWER) {
    const target = firstWord(name);
    if (target === raw) continue;
    const dist = levenshtein(raw, target);
    if (dist < bestDist && dist <= 2 && dist < target.length) {
      best = name;
      bestDist = dist;
    }
  }
  if (!best) return null;
  return { name: best, distance: bestDist, emoji: getEmojiForIngredient(best) };
}

// Common English fillers we never want to auto-correct against the
// ingredient dictionary. "I have broccoli" must not become "I heavy
// broccoli" via a Soundex / Levenshtein collision.
const SAFE_FILLER_WORDS = new Set([
  "i", "a", "an", "the", "and", "or", "but", "of", "for", "in", "on",
  "at", "by", "to", "from", "with", "without", "into", "onto", "is",
  "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may",
  "might", "can", "got", "get", "some", "any", "lots", "lot", "few",
  "many", "much", "more", "most", "less", "least", "this", "that",
  "these", "those", "my", "your", "our", "their", "his", "her", "its",
  "also", "too", "very", "really", "just", "only", "still", "yet",
  "ok", "okay", "yes", "no", "please", "thanks", "thank",
]);

/**
 * Quietly auto-correct a single transcribed word or short phrase. Used
 * by the voice pipeline — if the user said "brocolli", we change it
 * to "broccoli" without asking. Conservative: only fires when the
 * match is genuinely close.
 *
 * Returns the corrected word, or the original word if no confident
 * match exists. Multi-token strings are corrected token-by-token.
 */
export function autoCorrect(text) {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return text;
  if (DICT_SET.has(trimmed)) return trimmed;
  if (trimmed.length < 4) return text;

  // Whole-string fuzzy match wins outright when one exists.
  const whole = closestMatch(trimmed, trimmed.length > 5 ? 2 : 1);
  if (whole) return whole;

  // Per-token correction. Useful for phrases like "tomahto sauce"
  // → "tomato sauce".
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) return trimmed;
  const corrected = tokens.map((tok) => correctOneToken(tok) || tok);
  return corrected.join(" ");
}

/**
 * Same as autoCorrect but applied across a whole sentence — used by the
 * voice pipeline before parsing into individual ingredients. Preserves
 * punctuation and original casing.
 */
export function autoCorrectSentence(text) {
  if (!text || typeof text !== "string") return text;
  return text.replace(/[a-zA-Z']+/g, (word) => {
    const head = correctOneToken(word.toLowerCase());
    if (!head) return word;
    return word[0] === word[0].toUpperCase()
      ? head[0].toUpperCase() + head.slice(1)
      : head;
  });
}

// Per-token correction shared by autoCorrect and autoCorrectSentence.
// Returns the corrected head word, or null if no high-confidence match.
function correctOneToken(tok) {
  if (!tok || tok.length < 4) return null;
  if (SAFE_FILLER_WORDS.has(tok)) return null;
  if (DICT_SET.has(tok)) return tok;
  const close = closestMatch(tok, tok.length > 5 ? 2 : 1);
  if (!close) return null;
  const head = firstWord(close);
  if (!head || head === tok) return null;
  return head;
}

/* ── Internal helpers ────────────────────────────────────────────────── */

function firstWord(s) {
  return String(s).split(/\s+/)[0] || s;
}

function matchesWordStart(name, prefix) {
  const tokens = name.split(/\s+/);
  for (const t of tokens) if (t.startsWith(prefix)) return true;
  return false;
}

// closestMatch(word, maxEdits) — best single ingredient whose first
// word is within `maxEdits` Levenshtein of the given word. Returns the
// full ingredient name (e.g. "chicken thighs") or null. Used by the
// silent auto-correct path; intentionally does NOT fall back to Soundex
// — phonetic guessing belongs only in the explicit getSuggestions /
// didYouMean paths where the user can see what we're proposing.
function closestMatch(word, maxEdits) {
  if (!word || word.length < 4) return null;
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < DICT_LOWER.length; i++) {
    const name = DICT_LOWER[i];
    const target = firstWord(name);
    if (target === word) return name;
    // Length-similarity guard: don't correct "to" → "lo mein" or
    // "have" → "heavy cream" just because the head shares letters.
    if (Math.abs(target.length - word.length) > 1) continue;
    const dist = levenshtein(word, target);
    if (dist < bestDist && dist <= maxEdits && dist < target.length) {
      best = name;
      bestDist = dist;
    }
  }
  return best;
}

// Standard Levenshtein, two-row variant. Good enough for words up to
// ~20 chars (which is every ingredient in the dictionary).
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return Math.abs(m - n); // early exit
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Small phonetic pre-normalization for Soundex. Standard Soundex keys
// off the first letter, so "kwinoah" (K) never collides with "quinoa"
// (Q) and "kahbij" (K) never collides with "cabbage" (C). These
// substitutions paper over the small set of phonetic equivalences
// English speakers commonly mis-spell across — letting wild-misspell
// inputs land on their intended dictionary entries.
function phoneticNormalize(s) {
  if (!s) return s;
  let out = String(s).toLowerCase();
  out = out.replace(/^kw/, "qu");           // kwinoah → quinoah
  out = out.replace(/^k([aeiou])/, "c$1");  // kahbij → cahbij, kabbage → cabbage
  out = out.replace(/^kn/, "n");            // knife → nife
  out = out.replace(/^gn/, "n");            // gnocchi → nocchi
  out = out.replace(/ph/g, "f");            // pharsley etc.
  out = out.replace(/(.)\1+/g, "$1");       // collapse doubled letters
  return out;
}

// Classic 4-character Soundex. Good enough to catch wild misspellings
// like "kwinoah" → quinoa (Q500 vs K500 — Soundex collapses Q/K to 2).
// Returns null for empty input.
function soundex(s) {
  if (!s) return null;
  const str = s.toUpperCase().replace(/[^A-Z]/g, "");
  if (!str) return null;
  const firstLetter = str[0];
  const codeOf = (c) => {
    if ("BFPV".includes(c)) return "1";
    if ("CGJKQSXZ".includes(c)) return "2";
    if ("DT".includes(c)) return "3";
    if ("L".includes(c)) return "4";
    if ("MN".includes(c)) return "5";
    if ("R".includes(c)) return "6";
    return "";
  };
  let out = firstLetter;
  let prev = codeOf(firstLetter);
  for (let i = 1; i < str.length && out.length < 4; i++) {
    const c = codeOf(str[i]);
    if (c && c !== prev) out += c;
    prev = c || prev;
  }
  return out.padEnd(4, "0");
}
