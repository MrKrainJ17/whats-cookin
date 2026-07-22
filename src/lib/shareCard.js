// Share-card generator. Produces a 1080×1920 PNG Blob via Canvas.
// Pure client-side, no deps. Watermark is mandatory on every template.

import { CARD_W, CARD_H } from "./shareCardTemplates/shared.js";
import { drawCozy } from "./shareCardTemplates/cozy.js";
import { drawBold } from "./shareCardTemplates/bold.js";
import { drawMinimal } from "./shareCardTemplates/minimal.js";
import { drawPlayful } from "./shareCardTemplates/playful.js";
import { drawDiner } from "./shareCardTemplates/diner.js";
import { drawSunset } from "./shareCardTemplates/sunset.js";
import { drawChefs } from "./shareCardTemplates/chefs.js";
import { drawNeon } from "./shareCardTemplates/neon.js";

export const TEMPLATES = {
  cozy: { label: "Warm & Rustic", short: "Rustic", draw: drawCozy },
  bold: { label: "Dark & Moody", short: "Moody", draw: drawBold },
  minimal: { label: "Fresh & Minimal", short: "Fresh", draw: drawMinimal },
  diner: { label: "Retro Diner", short: "Diner", draw: drawDiner },
  sunset: { label: "Gradient Sunset", short: "Sunset", draw: drawSunset },
  chefs: { label: "Chef's Table", short: "Chef's", draw: drawChefs },
  neon: { label: "Neon Night", short: "Neon", draw: drawNeon },
  playful: { label: "Polaroid", short: "Polaroid", draw: drawPlayful },
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
//
// Each template draws to a generously-tall scratch canvas and returns
// `contentBottom` — the Y coordinate of the last pixel it drew (including
// the watermark). We then crop the result to that height. That's how the
// card "grows taller" to fit content: ingredient chips, rating, note,
// and watermark always have room and can never overlap each other.
const SCRATCH_HEIGHT_HEADROOM = 1200;
const FINAL_PADDING = 40; // breathing room below the watermark

export async function generateShareCard(recipe, template = "cozy", userOptions = {}) {
  await ensureFontsLoaded();
  const def = TEMPLATES[template] || TEMPLATES.cozy;

  // Draw into a tall scratch canvas. Background fills the full scratch
  // area — anything below the actual content end gets cropped off later
  // so the user never sees the extra blank space.
  const scratch = document.createElement("canvas");
  scratch.width = CARD_W;
  scratch.height = CARD_H + SCRATCH_HEIGHT_HEADROOM;
  const ctx = scratch.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "top";
  ctx.textAlign = "start";

  const contentBottom = def.draw(ctx, recipe, userOptions) ?? CARD_H;
  const finalH = Math.max(CARD_H, Math.ceil(contentBottom + FINAL_PADDING));

  // Crop by copying the top `finalH` pixels of the scratch canvas into
  // a correctly-sized final canvas. drawImage handles the source-size
  // sub-rect crop cleanly.
  const final = document.createElement("canvas");
  final.width = CARD_W;
  final.height = finalH;
  const fctx = final.getContext("2d");
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(
    scratch,
    0, 0, CARD_W, finalH,
    0, 0, CARD_W, finalH,
  );
  return canvasToBlob(final);
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
