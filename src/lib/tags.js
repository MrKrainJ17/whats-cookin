// "Eating with?" tag helpers. Cosmetic Instagram-handle-style mentions —
// not linked to any real network, just text for the share card.

const RECENT_KEY = "whats-cookin-recent-tags";
const RECENT_CAP = 10;

// Sanitize free-form input into "@handle" form. Strips leading @s, removes
// anything that isn't a letter / digit / "." / "_". Returns null if nothing
// usable remains.
export function formatTag(input) {
  if (typeof input !== "string") return null;
  let s = input.trim().toLowerCase();
  s = s.replace(/^@+/, "");
  s = s.replace(/[^a-z0-9._]/g, "");
  if (!s) return null;
  return "@" + s;
}

// Card display string. Up to 4 tags shows them all; 5+ collapses to
// "first three names and N others".
export function formatTagsForCard(tags, { separator = ", " } = {}) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  if (tags.length <= 4) return tags.join(separator);
  return `${tags.slice(0, 3).join(separator)} and ${tags.length - 3} others`;
}

export function getRecentTags() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t) => typeof t === "string" && t.startsWith("@"))
      : [];
  } catch {
    return [];
  }
}

// Bump tags to the front of the recent list, dedupe, cap at RECENT_CAP.
export function pushRecentTags(newTags) {
  if (!Array.isArray(newTags) || newTags.length === 0) return;
  const existing = getRecentTags();
  const merged = [];
  for (const t of newTags) {
    if (typeof t !== "string" || !t.startsWith("@")) continue;
    if (!merged.includes(t)) merged.push(t);
  }
  for (const t of existing) {
    if (!merged.includes(t)) merged.push(t);
  }
  const capped = merged.slice(0, RECENT_CAP);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(capped));
  } catch {
    /* ignore */
  }
}
