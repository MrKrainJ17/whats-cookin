// Dark & Moody — deep navy background, gold accent, heavy sans-serif.
// Sneaker-drop energy with magazine restraint.

import {
  CARD_W,
  CARD_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  CONTENT_LEFT,
  CONTENT_W,
  wrapText,
  drawHeroEmoji,
  drawPillRow,
  extractCardContent,
  difficultyLabel,
  formatTagsForCard,
  drawLogoWatermark,
  buildChipPills,
} from "./shared.js";

const BG = "#0F1923";
const ACCENT = "#E8B14C"; // gold
const ACCENT_2 = "#E8B14C"; // also gold for the rating label
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_MUTED = "#94a3b8";

export function drawBold(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // Bold accent block at top-left
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, SAFE_TOP, 12, 220);

  // Eyebrow
  ctx.fillStyle = ACCENT;
  ctx.font = '800 42px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText("I JUST COOKED.", CONTENT_LEFT, SAFE_TOP + 40);

  // Hero emoji on a subtle disc
  const heroCY = CARD_H * 0.34;
  ctx.save();
  ctx.fillStyle = "rgba(251, 191, 36, 0.10)";
  ctx.beginPath();
  ctx.arc(CARD_W / 2, heroCY, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawHeroEmoji(ctx, c.emoji, CARD_W / 2, heroCY, 420, { shadow: false });

  // Title — huge, left-aligned, heavy
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = '900 112px "Space Grotesk", system-ui, sans-serif';
  const titleLines = wrapText(ctx, c.name.toUpperCase(), CONTENT_W, 2);
  let titleY = CARD_H * 0.55;
  for (const line of titleLines) {
    ctx.fillText(line, CONTENT_LEFT, titleY);
    titleY += 124;
  }

  // Tagline
  let cursorY = titleY + 10;
  if (c.tagline) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = '500 36px "Space Grotesk", system-ui, sans-serif';
    const tagLines = wrapText(ctx, c.tagline, CONTENT_W, 2);
    for (const line of tagLines) {
      ctx.fillText(line, CONTENT_LEFT, cursorY);
      cursorY += 50;
    }
    cursorY += 14;
  }

  // Tagged people — heavy all-caps, mustard accent, space-separated
  const tagsDisplay = formatTagsForCard(c.tags, { separator: " " });
  if (tagsDisplay) {
    ctx.fillStyle = ACCENT;
    ctx.font = '800 28px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText(`WITH ${tagsDisplay.toUpperCase()}`, CONTENT_LEFT, cursorY);
    cursorY += 46;
  }
  cursorY += 6;

  // Stat row — slab style, no rounding
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} MIN`);
  stats.push(difficultyLabel(c.difficulty).toUpperCase());
  if (c.servings != null) stats.push(`${c.servings} SERVES`);
  cursorY += 10;
  ctx.fillStyle = ACCENT;
  ctx.font = '800 32px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(stats.join("  ·  "), CONTENT_LEFT, cursorY);
  cursorY += 60;

  // Ingredient chips — dark border + gold text, with "+N more" overflow.
  if (c.ingredients.length > 0) {
    const ingPills = buildChipPills(c, (s) => s.toUpperCase());
    cursorY += drawPillRow(ctx, ingPills, CARD_W / 2, cursorY, CONTENT_W, {
      font: '700 28px "Space Grotesk", system-ui, sans-serif',
      leadingFont: '28px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
      bg: "#1A2533",
      fg: ACCENT,
      padX: 24,
      padY: 14,
      radius: 8,
      gap: 14,
      border: { color: ACCENT, width: 1.5 },
    });
  }

  // Rating → note → watermark, top-down with guaranteed gaps.
  if (c.rating) {
    cursorY += 32;
    ctx.fillStyle = ACCENT_2;
    ctx.font = '800 44px "Space Grotesk", system-ui, sans-serif';
    const label = `${c.rating.emoji}  ${c.rating.label.toUpperCase()}`;
    const w = ctx.measureText(label).width;
    ctx.fillText(label, (CARD_W - w) / 2, cursorY);
    cursorY += 56;
  }
  if (c.note) {
    cursorY += 20;
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = '500 30px "Space Grotesk", system-ui, sans-serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    for (const line of noteLines) {
      const w = ctx.measureText(line).width;
      ctx.fillText(line, (CARD_W - w) / 2, cursorY);
      cursorY += 42;
    }
  }

  // Watermark — accent bar + logo + text. Always at least 60px below
  // the note (or 60px below the default safe position, whichever's
  // lower on the card).
  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 70;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(CARD_W / 2 - 70, watermarkY + 70, 140, 4);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '700 30px "Space Grotesk", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "MADE WITH WHAT'S COOKIN", {
    logoSize: 52,
    gap: 18,
  });
  return watermarkY + 90;
}
