import Anthropic from "@anthropic-ai/sdk";

// Beginner cooking tips for a specific recipe. Generated once per recipe
// via Haiku and cached in localStorage. Fire-and-forget when the user
// enters cooking mode with beginner difficulty preference — the tips slide
// in beneath each step as soon as they arrive.
//
// TODO: Move to backend before launch (same browser-key tradeoff as the
// other Claude calls).

const CACHE_KEY_PREFIX = "whats-cookin-tips-cache:";
const MODEL = "claude-haiku-4-5";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
const client = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

const inflight = new Map();

export function getCachedTips(recipeId) {
  if (!recipeId) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + recipeId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchTipsForRecipe(recipe) {
  if (!recipe?.id || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    return null;
  }
  const cached = getCachedTips(recipe.id);
  if (cached) return cached;
  if (!client) return null;

  if (inflight.has(recipe.id)) return inflight.get(recipe.id);

  const promise = (async () => {
    try {
      const stepsBlock = recipe.steps
        .map((s) => `${s.step}. ${s.instruction}`)
        .join("\n");
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        system:
          "You are a kind cooking coach giving one-sentence tips to beginner home cooks. Tips should be concrete and beginner-friendly — temperatures, timing, visual cues, common mistakes.",
        messages: [
          {
            role: "user",
            content: `Recipe: ${recipe.name}\n\nSteps:\n${stepsBlock}\n\nFor each step that benefits from a beginner tip, provide a single short sentence. For steps where no tip is needed, use null.\n\nReturn ONLY a JSON array with EXACTLY ${recipe.steps.length} entries in step order. Each entry is either a short string tip OR null. No prose, no markdown, no code fences.`,
          },
        ],
      });
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      const tips = parseTipsArray(text, recipe.steps.length);
      if (tips) {
        try {
          localStorage.setItem(
            CACHE_KEY_PREFIX + recipe.id,
            JSON.stringify(tips),
          );
        } catch {
          /* ignore */
        }
      }
      return tips;
    } catch (err) {
      console.warn("[cookingTips] failed:", err);
      return null;
    } finally {
      inflight.delete(recipe.id);
    }
  })();

  inflight.set(recipe.id, promise);
  return promise;
}

function parseTipsArray(text, expectedLength) {
  let cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;
    const out = new Array(expectedLength).fill(null);
    for (let i = 0; i < expectedLength; i++) {
      const v = parsed[i];
      if (typeof v === "string" && v.trim()) out[i] = v.trim();
    }
    return out;
  } catch {
    return null;
  }
}
