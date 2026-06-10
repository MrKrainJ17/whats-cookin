// Categorizes a grocery ingredient name into one of seven shopping aisles.
// Strategy: lowercase + strip common modifiers, then check against an
// ordered list of category keyword sets. The order matters — "frozen
// peas" should resolve to "frozen", not "produce", so "frozen" is
// checked first via a special prefix rule.

export const CATEGORIES = [
  { id: "produce", label: "Produce", icon: "🥦" },
  { id: "meat-seafood", label: "Meat & Seafood", icon: "🥩" },
  { id: "dairy-eggs", label: "Dairy & Eggs", icon: "🥛" },
  { id: "pantry", label: "Pantry", icon: "🥫" },
  { id: "frozen", label: "Frozen", icon: "❄️" },
  { id: "beverages", label: "Beverages", icon: "🧃" },
  { id: "other", label: "Other", icon: "📦" },
];

export function getCategoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

// Modifiers stripped before matching so "fresh basil", "dried oregano",
// "organic spinach", "raw shrimp" all reduce to the core ingredient.
const STRIP_MODIFIERS = [
  "fresh",
  "dried",
  "organic",
  "raw",
  "cooked",
  "ground",
  "whole",
  "chopped",
  "minced",
  "sliced",
  "diced",
  "shredded",
  "grated",
  "ripe",
  "unripe",
  "boneless",
  "skinless",
  "lean",
  "low-fat",
  "low fat",
  "non-fat",
  "non fat",
  "fat-free",
  "fat free",
  "extra",
  "virgin",
  "large",
  "small",
  "medium",
  "baby",
  "free-range",
  "free range",
  "wild",
  "wild-caught",
  "wild caught",
];

const KEYWORDS = {
  produce: [
    // Vegetables
    "tomato", "tomatoes", "onion", "scallion", "shallot", "leek",
    "garlic", "ginger", "lettuce", "romaine", "arugula", "spinach",
    "kale", "chard", "collard", "cabbage", "bok choy", "carrot",
    "potato", "sweet potato", "yam", "broccoli", "broccolini",
    "cauliflower", "brussels", "cucumber", "zucchini", "squash",
    "pumpkin", "eggplant", "aubergine", "pepper", "bell pepper",
    "jalapeño", "jalapeno", "habanero", "serrano", "chili",
    "chile", "poblano", "mushroom", "shiitake", "portobello",
    "asparagus", "celery", "fennel", "radish", "beet", "turnip",
    "parsnip", "rutabaga", "okra", "artichoke", "corn",
    "green bean", "snow pea", "snap pea", "pea", "edamame",
    "sprouts", "watercress", "endive", "radicchio",
    // Herbs
    "basil", "parsley", "cilantro", "coriander", "mint", "rosemary",
    "thyme", "sage", "oregano", "dill", "chive", "tarragon", "bay leaf",
    // Fruits
    "apple", "banana", "orange", "lemon", "lime", "grapefruit",
    "pear", "peach", "plum", "nectarine", "apricot", "cherry",
    "cherries", "strawberry", "strawberries", "blueberry", "blueberries",
    "raspberry", "raspberries", "blackberry", "blackberries", "cranberry",
    "cranberries", "grape", "grapes", "watermelon", "cantaloupe",
    "melon", "honeydew", "pineapple", "mango", "papaya", "kiwi",
    "pomegranate", "fig", "figs", "date", "dates", "raisin",
    "avocado", "coconut",
  ],
  "meat-seafood": [
    "chicken", "drumstick", "thigh", "breast", "wing",
    "beef", "steak", "ribeye", "sirloin", "tenderloin", "brisket",
    "ground beef", "hamburger", "veal",
    "pork", "ham", "bacon", "pancetta", "prosciutto", "chorizo",
    "sausage", "salami", "pepperoni", "hot dog", "lamb", "mutton",
    "turkey", "duck", "goose", "quail",
    "fish", "salmon", "tuna", "cod", "halibut", "tilapia", "trout",
    "mackerel", "sardine", "anchovy", "anchovies", "bass", "snapper",
    "swordfish", "haddock", "sole", "flounder",
    "shrimp", "prawn", "lobster", "crab", "scallop", "clam",
    "mussel", "oyster", "squid", "calamari", "octopus",
  ],
  "dairy-eggs": [
    "milk", "cream", "half and half", "half-and-half", "buttermilk",
    "butter", "ghee", "margarine",
    "cheese", "cheddar", "mozzarella", "parmesan", "parmigiano",
    "feta", "ricotta", "cottage cheese", "cream cheese", "brie",
    "camembert", "gouda", "swiss", "provolone", "goat cheese",
    "blue cheese", "gorgonzola", "havarti", "manchego", "halloumi",
    "yogurt", "yoghurt", "sour cream", "crème fraîche", "creme fraiche",
    "egg", "eggs",
  ],
  pantry: [
    // Grains
    "rice", "pasta", "spaghetti", "linguine", "fettuccine", "penne",
    "rigatoni", "macaroni", "lasagna", "lasagne", "ravioli", "tortellini",
    "noodle", "udon", "soba", "ramen", "rice noodle", "vermicelli",
    "quinoa", "couscous", "barley", "oats", "oatmeal", "polenta",
    "cornmeal", "bread", "bagel", "tortilla", "pita", "naan", "bun",
    "wrap", "cracker", "panko", "breadcrumb",
    // Baking
    "flour", "sugar", "brown sugar", "powdered sugar", "honey",
    "maple syrup", "molasses", "agave", "yeast", "baking soda",
    "baking powder", "cocoa", "chocolate", "chocolate chip",
    "vanilla", "extract",
    // Oils & vinegars
    "oil", "olive oil", "vegetable oil", "canola oil", "sesame oil",
    "coconut oil", "vinegar", "balsamic", "rice vinegar", "wine vinegar",
    "apple cider vinegar",
    // Sauces & condiments
    "soy sauce", "tamari", "fish sauce", "oyster sauce", "hoisin",
    "sriracha", "tabasco", "hot sauce", "ketchup", "mustard",
    "mayonnaise", "mayo", "barbecue sauce", "bbq sauce", "worcestershire",
    "salsa", "pesto", "tahini", "miso", "marinara", "tomato sauce",
    "tomato paste", "pasta sauce",
    // Spices & seasonings
    "salt", "pepper", "paprika", "cumin", "coriander", "turmeric",
    "curry powder", "garam masala", "cinnamon", "nutmeg", "clove",
    "cardamom", "cayenne", "chili powder", "red pepper flake",
    "smoked paprika", "garlic powder", "onion powder", "italian seasoning",
    "herbes de provence", "five spice", "old bay", "bouillon",
    "stock", "broth", "soy",
    // Canned / jarred
    "canned", "can of", "jar of", "beans", "chickpea", "garbanzo",
    "black bean", "kidney bean", "pinto bean", "white bean",
    "cannellini", "lentil", "tuna", "tomatoes", "olive", "caper",
    "pickle", "jam", "jelly", "preserve", "peanut butter",
    "almond butter", "nutella",
    // Nuts & seeds
    "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut",
    "macadamia", "peanut", "sesame seed", "sunflower seed",
    "pumpkin seed", "chia", "flax",
  ],
  frozen: [
    "ice cream", "gelato", "sorbet", "frozen yogurt", "popsicle",
    "frozen pizza", "frozen meal", "frozen dinner", "ice",
  ],
  beverages: [
    "water", "sparkling water", "seltzer", "club soda",
    "juice", "orange juice", "apple juice", "cranberry juice",
    "lemonade", "soda", "cola", "coke", "pepsi", "sprite", "ginger ale",
    "coffee", "espresso", "tea", "matcha", "chai",
    "wine", "red wine", "white wine", "champagne", "prosecco",
    "beer", "ale", "lager", "ipa", "stout", "cider",
    "whiskey", "bourbon", "vodka", "gin", "rum", "tequila",
    "milk alternative", "almond milk", "oat milk", "soy milk",
    "coconut milk",
  ],
};

// Public API: returns a category id (one of the CATEGORIES `id`s).
// Falls back to "other" when nothing matches.
export function categorizeIngredient(rawName) {
  if (!rawName || typeof rawName !== "string") return "other";
  let name = rawName.toLowerCase().trim();
  if (!name) return "other";

  // "frozen X" is always frozen, regardless of what X is.
  if (/^frozen\b/.test(name)) return "frozen";

  // Strip modifiers (word-boundary aware) so "fresh basil" → "basil".
  for (const mod of STRIP_MODIFIERS) {
    name = name.replace(new RegExp(`\\b${escapeRegex(mod)}\\b`, "g"), "");
  }
  name = name.replace(/\s+/g, " ").trim();
  // De-pluralize each token so "avocados", "tomatoes", "carrots" reduce
  // to their singular form before keyword matching. Keep multi-syllable
  // words ending in "es" intact only when stripping would be obviously
  // wrong (already handled by the false-plural guard in normalizeIngredientName).
  name = name
    .split(" ")
    .map((tok) => {
      if (tok.length <= 3) return tok;
      if (tok.endsWith("ies") && tok.length > 4) return tok.slice(0, -3) + "y";
      if (tok.endsWith("oes")) return tok.slice(0, -2);
      if (tok.endsWith("s") && !tok.endsWith("ss") && !tok.endsWith("us")) {
        return tok.slice(0, -1);
      }
      return tok;
    })
    .join(" ");

  // Specific-before-generic check order: dairy-eggs has "milk" which also
  // appears in beverages ("almond milk") — but the dairy entry "milk" is
  // a single word so we explicitly handle alt-milks before plain dairy.
  if (/\b(almond|oat|soy|coconut|rice|cashew)\s+milk\b/.test(name)) {
    return "beverages";
  }

  for (const categoryId of [
    "frozen",
    "meat-seafood",
    "produce",
    "dairy-eggs",
    "beverages",
    "pantry",
  ]) {
    if (matchesCategory(name, KEYWORDS[categoryId])) return categoryId;
  }
  return "other";
}

function matchesCategory(name, keywords) {
  for (const kw of keywords) {
    if (!kw) continue;
    // Multi-word keyword → substring check; single-word → word boundary
    // so "pea" doesn't catch "peanut".
    if (kw.includes(" ") || kw.includes("-")) {
      if (name.includes(kw)) return true;
    } else if (new RegExp(`\\b${escapeRegex(kw)}\\b`).test(name)) {
      return true;
    }
  }
  return false;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Normalized lookup name for dedupe matching — lowercase, strip
// modifiers, drop trailing 's' for singular form. Two ingredients
// normalize to the same key iff they should be treated as duplicates.
export function normalizeIngredientName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";
  let name = rawName.toLowerCase().trim();
  for (const mod of STRIP_MODIFIERS) {
    name = name.replace(new RegExp(`\\b${escapeRegex(mod)}\\b`, "g"), "");
  }
  name = name.replace(/\s+/g, " ").trim();
  // Naive de-pluralize: trim a trailing "s" if it leaves >2 chars and the
  // result isn't itself a common false-positive (e.g. "molasses").
  const FALSE_PLURALS = new Set(["molasses", "hummus", "couscous", "asparagus"]);
  if (!FALSE_PLURALS.has(name) && name.length > 3 && name.endsWith("s")) {
    name = name.slice(0, -1);
  }
  return name;
}
