// Bold & Modern — deep navy background, mustard/coral accent, heavy
// sans-serif. Sneaker-drop energy.

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
} from "./shared.js";

const BG = "#0f172a";
const ACCENT = "#fbbf24"; // mustard
const ACCENT_2 = "#ff7a59"; // coral
const TEXT_PRIMARY = "#f8fafc";
const TEXT_MUTED = "#94a3b8";

export function drawBold(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

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

  // Ingredient chips
  if (c.ingredients.length > 0) {
    const ingPills = c.ingredients.map((i) => ({
      label: i.name.toUpperCase(),
      leading: i.emoji,
    }));
    drawPillRow(ctx, ingPills, CARD_W / 2, cursorY, CONTENT_W, {
      font: '700 28px "Space Grotesk", system-ui, sans-serif',
      leadingFont: '28px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
      bg: "#1e293b",
      fg: TEXT_PRIMARY,
      padX: 24,
      padY: 14,
      radius: 8,
      gap: 14,
    });
  }

  // Rating + note above watermark
  const watermarkY = CARD_H - SAFE_BOTTOM - 70;
  let extrasBottom = watermarkY - 40;
  if (c.note) {
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = '500 30px "Space Grotesk", system-ui, sans-serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    let ny = extrasBottom - (noteLines.length - 1) * 42 - 30;
    for (const line of noteLines) {
      const w = ctx.measureText(line).width;
      ctx.fillText(line, (CARD_W - w) / 2, ny);
      ny += 42;
    }
    extrasBottom -= noteLines.length * 42 + 30;
  }
  if (c.rating) {
    ctx.fillStyle = ACCENT_2;
    ctx.font = '800 44px "Space Grotesk", system-ui, sans-serif';
    const label = `${c.rating.emoji}  ${c.rating.label.toUpperCase()}`;
    const w = ctx.measureText(label).width;
    ctx.fillText(label, (CARD_W - w) / 2, extrasBottom - 60);
  }

  // Watermark — accent bar + logo + text
  ctx.fillStyle = ACCENT;
  ctx.fillRect(CARD_W / 2 - 70, watermarkY + 70, 140, 4);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '700 30px "Space Grotesk", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "MADE WITH WHAT'S COOKIN", {
    logoSize: 52,
    gap: 18,
  });
}
