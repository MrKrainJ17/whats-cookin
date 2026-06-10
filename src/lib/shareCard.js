// Share-card generator. Produces a 1080×1920 PNG Blob via Canvas.
// Pure client-side, no deps. Watermark is mandatory on every template.

import { CARD_W, CARD_H } from "./shareCardTemplates/shared.js";
import { drawCozy } from "./shareCardTemplates/cozy.js";
import { drawBold } from "./shareCardTemplates/bold.js";
import { drawMinimal } from "./shareCardTemplates/minimal.js";
import { drawPlayful } from "./shareCardTemplates/playful.js";

export const TEMPLATES = {
  cozy: { label: "Warm & Cozy", draw: drawCozy },
  bold: { label: "Bold & Modern", draw: drawBold },
  minimal: { label: "Clean & Minimal", draw: drawMinimal },
  playful: { label: "Cute & Playful", draw: drawPlayful },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

// Fonts the templates rely on. Preload these before the first card draw
// or Canvas will silently fall back to system fonts (ugly).
const FONT_SPECS = [
  // Cozy + Minimal
  '400 36px "Inter"',
  '500 32px "Inter"',
  '600 36px "Inter"',
  '700 88px "Inter"',
  '900 88px "Inter"',
  'italic 400 32px "Playfair Display"',
  '700 96px "Playfair Display"',
  '900 96px "Playfair Display"',
  // Bold
  '500 36px "Space Grotesk"',
  '700 28px "Space Grotesk"',
  '800 32px "Space Grotesk"',
  '900 112px "Space Grotesk"',
  // Playful
  '500 32px "Fredoka"',
  '600 32px "Fredoka"',
  '700 92px "Fredoka"',
];

let fontsLoadedPromise = null;

export function ensureFontsLoaded() {
  if (fontsLoadedPromise) return fontsLoadedPromise;
  if (typeof document === "undefined" || !document.fonts) {
    fontsLoadedPromise = Promise.resolve();
    return fontsLoadedPromise;
  }
  fontsLoadedPromise = Promise.allSettled(
    FONT_SPECS.map((spec) => document.fonts.load(spec)),
  )
    .then(() => document.fonts.ready)
    .catch(() => {});
  return fontsLoadedPromise;
}

// Main entry. Returns a PNG Blob.
export async function generateShareCard(recipe, template = "cozy", userOptions = {}) {
  await ensureFontsLoaded();
  const def = TEMPLATES[template] || TEMPLATES.cozy;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "top";
  ctx.textAlign = "start";
  def.draw(ctx, recipe, userOptions);
  return canvasToBlob(canvas);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas toBlob failed"));
      },
      "image/png",
      0.95,
    );
  });
}

// Wraps Web Share API Level 2 (file-share). Returns:
//   { kind: 'shared' }       — system share sheet completed
//   { kind: 'cancelled' }    — user dismissed share sheet
//   { kind: 'unsupported' }  — browser can't share files; caller should fall back
//   { kind: 'error', error } — anything else
//
// `options.tags` is an optional array of "@handle" strings that get folded
// into the share text so platforms like iMessage / X surface "Just cooked
// X with @sarah @mike 🍳" automatically.
export async function shareCardBlob(blob, recipe, { tags } = {}) {
  const file = new File([blob], `whats-cookin-${recipe.id ?? "recipe"}.png`, {
    type: "image/png",
  });
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    const tagsText =
      Array.isArray(tags) && tags.length > 0 ? ` with ${tags.join(" ")}` : "";
    const dishText = recipe.name ? `Just cooked ${recipe.name}` : "Just cooked something";
    try {
      await navigator.share({
        files: [file],
        title: recipe.name ? `I cooked ${recipe.name}!` : "What's Cookin",
        text: `${dishText}${tagsText} 🍳`,
      });
      return { kind: "shared" };
    } catch (err) {
      if (err && err.name === "AbortError") return { kind: "cancelled" };
      return { kind: "error", error: err };
    }
  }
  return { kind: "unsupported" };
}

// Desktop fallback: trigger a PNG download.
export function downloadCardBlob(blob, recipe) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `whats-cookin-${slug(recipe.name ?? recipe.id ?? "card")}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Alt fallback: copy PNG to clipboard. Returns true on success.
export async function copyCardBlobToClipboard(blob) {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Default-template persistence — remember the user's last pick.
const LAST_TEMPLATE_KEY = "whats-cookin-last-share-template";

export function getDefaultTemplate() {
  try {
    const v = localStorage.getItem(LAST_TEMPLATE_KEY);
    if (v && TEMPLATES[v]) return v;
  } catch {
    /* ignore */
  }
  return "cozy";
}

export function rememberTemplate(id) {
  if (!TEMPLATES[id]) return;
  try {
    localStorage.setItem(LAST_TEMPLATE_KEY, id);
  } catch {
    /* ignore */
  }
}
