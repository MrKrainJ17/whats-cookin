// Grocery list storage + CRUD. Backed by localStorage under
// `whats-cookin-grocery-list`. Mutating helpers all return the freshly
// persisted list so callers can update React state in one shot.

import {
  categorizeIngredient,
  CATEGORIES,
  normalizeIngredientName,
} from "./groceryCategories.js";

const STORAGE_KEY = "whats-cookin-grocery-list";

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return parsed;
  } catch {
    return { items: [] };
  }
}

function safeWrite(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  return state;
}

export function loadList() {
  return safeRead();
}

export function getItemCount() {
  return safeRead().items.length;
}

export function getCheckedCount() {
  return safeRead().items.filter((i) => i.checked).length;
}

function makeId() {
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Merge logic ──────────────────────────────────────────────────────────
//
// Smart dedupe rules:
//   - Same normalized name → merge into the existing item.
//   - If the existing has a quantity and the new also has one, append
//     " + <new>" to keep both visible ("3 cloves + 1 head").
//   - If only one side has a quantity, keep that one.
//   - If neither has a quantity, bump a hidden `mergeCount` so the UI
//     can render "(x2)".
//   - When merging from a recipe source, prepend the recipe name to the
//     `sourceRecipeName` field so the item knows which recipes feed it.
function mergeQuantities(existing, incoming) {
  const a = (existing.quantity || "").trim();
  const b = (incoming.quantity || "").trim();
  if (a && b) return `${a} + ${b}`;
  return a || b || "";
}

function mergeRecipeSource(existing, incoming) {
  const a = existing.sourceRecipeName || "";
  const b = incoming.sourceRecipeName || "";
  if (!a) return b;
  if (!b) return a;
  if (a === b) return a;
  // Track multiple contributing recipes, comma-separated, deduped.
  const names = new Set(a.split(",").map((s) => s.trim()).filter(Boolean));
  names.add(b);
  return [...names].join(", ");
}

function makeItem({ name, quantity = "", source = "manual", sourceRecipeName }) {
  const trimmedName = String(name || "").trim().toLowerCase();
  return {
    id: makeId(),
    name: trimmedName,
    quantity: quantity ? String(quantity).trim() : "",
    category: categorizeIngredient(trimmedName),
    checked: false,
    addedAt: new Date().toISOString(),
    source,
    sourceRecipeName: sourceRecipeName || null,
    mergeCount: 1,
  };
}

// addItem(input) — adds or merges. Returns { state, added: bool,
// mergedItemId: string | null } so the caller can show different toasts
// for "new item" vs "bumped existing".
export function addItem(input) {
  const state = safeRead();
  const incoming = makeItem(input);
  if (!incoming.name) return { state, added: false, mergedItemId: null };

  const key = normalizeIngredientName(incoming.name);
  const existing = state.items.find(
    (i) => normalizeIngredientName(i.name) === key,
  );

  if (existing) {
    existing.quantity = mergeQuantities(existing, incoming);
    existing.sourceRecipeName = mergeRecipeSource(existing, incoming);
    existing.mergeCount = (existing.mergeCount || 1) + 1;
    // Bumping a previously-checked item un-checks it so the user knows
    // there's something new to grab.
    if (existing.checked) existing.checked = false;
    safeWrite(state);
    return { state, added: false, mergedItemId: existing.id };
  }

  state.items.push(incoming);
  safeWrite(state);
  return { state, added: true, mergedItemId: null };
}

// addRecipeIngredients(recipe) — bulk add. Returns { state, addedCount,
// mergedCount } for the toast.
export function addRecipeIngredients(recipe) {
  if (!recipe || !Array.isArray(recipe.ingredients)) {
    return { state: safeRead(), addedCount: 0, mergedCount: 0 };
  }
  let addedCount = 0;
  let mergedCount = 0;
  let state = safeRead();
  for (const ing of recipe.ingredients) {
    if (!ing || !ing.name) continue;
    const qty = [ing.amount, ing.unit].filter(Boolean).join(" ").trim();
    const result = addItem({
      name: ing.name,
      quantity: qty,
      source: "recipe",
      sourceRecipeName: recipe.name,
    });
    state = result.state;
    if (result.added) addedCount++;
    else if (result.mergedItemId) mergedCount++;
  }
  return { state, addedCount, mergedCount };
}

export function toggleChecked(id) {
  const state = safeRead();
  const item = state.items.find((i) => i.id === id);
  if (!item) return state;
  item.checked = !item.checked;
  return safeWrite(state);
}

export function removeItem(id) {
  const state = safeRead();
  state.items = state.items.filter((i) => i.id !== id);
  return safeWrite(state);
}

export function updateItem(id, patch) {
  const state = safeRead();
  const item = state.items.find((i) => i.id === id);
  if (!item) return state;
  Object.assign(item, patch);
  if (patch.name) {
    item.name = String(patch.name).trim().toLowerCase();
    item.category = categorizeIngredient(item.name);
  }
  return safeWrite(state);
}

export function clearChecked() {
  const state = safeRead();
  state.items = state.items.filter((i) => !i.checked);
  return safeWrite(state);
}

export function clearAll() {
  return safeWrite({ items: [] });
}

// groupByCategory(items) → ordered array of { category, items[] } using
// the canonical CATEGORIES order. Empty categories are omitted.
export function groupByCategory(items) {
  const groups = new Map();
  for (const cat of CATEGORIES) groups.set(cat.id, []);
  for (const item of items) {
    const id = groups.has(item.category) ? item.category : "other";
    groups.get(id).push(item);
  }
  const out = [];
  for (const cat of CATEGORIES) {
    const list = groups.get(cat.id);
    if (list && list.length > 0) {
      out.push({ category: cat, items: list });
    }
  }
  return out;
}

// formatForShare(state) → plain-text export the user can paste into
// iMessage / WhatsApp / Notes. Checked items are crossed-out with ✓.
export function formatForShare(state = safeRead()) {
  const groups = groupByCategory(state.items);
  if (groups.length === 0) return "Grocery list is empty.";
  const lines = ["🛒 Grocery List", ""];
  for (const { category, items } of groups) {
    lines.push(`${category.icon} ${category.label}`);
    for (const item of items) {
      const qty = item.quantity ? ` — ${item.quantity}` : "";
      const x2 = item.mergeCount > 1 ? ` (x${item.mergeCount})` : "";
      const prefix = item.checked ? "✓ " : "• ";
      lines.push(`  ${prefix}${item.name}${qty}${x2}`);
    }
    lines.push("");
  }
  lines.push("— What's Cookin");
  return lines.join("\n");
}

// hasFirstPopulationHappened() / markFirstPopulation() — used by the UI
// to show the one-time "happy shopping" handwritten note the first time
// items appear on the list.
const FIRST_POPULATED_KEY = "whats-cookin-grocery-first-shown";
export function shouldShowFirstPopulatedNote() {
  try {
    if (localStorage.getItem(FIRST_POPULATED_KEY)) return false;
    if (getItemCount() === 0) return false;
    localStorage.setItem(FIRST_POPULATED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

// Tiny global event bus so the Home page badge and the grocery page can
// update reactively when items are added from a recipe in another tab
// or component without bouncing through localStorage events.
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notify() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
