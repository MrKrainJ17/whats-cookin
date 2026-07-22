// Chef's Table — pure black, all-white type, single thin gold rule, no
// chips (ingredients become an italic centered list separated by dots),
// extremely minimal. Reads like a fine-dining menu.

import {
  CARD_W,
  CARD_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  CONTENT_W,
  wrapText,
  drawCenteredText,
  extractCardContent,
  difficultyLabel,
  formatTagsForCard,
} from "./shared.js";

const BG = "#000000";
const GOLD = "#C9A968";
const WHITE = "#ffffff";
const WHITE_60 = "rgba(255,255,255,0.6)";

export function drawChefs(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // Spaced eyebrow
  ctx.fillStyle = GOLD;
  ctx.font = '500 28px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, "T O   N I G H T ' S   C O U R S E", CARD_W / 2, SAFE_TOP + 40);

  // Gold rule under eyebrow
  ctx.fillStyle = GOLD;
  ctx.fillRect(CARD_W / 2 - 50, SAFE_TOP + 100, 100, 1);

  // Hero
  ctx.font = '380px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  drawCenteredText(ctx, c.emoji, CARD_W / 2, CARD_H * 0.18);

  // Title
  ctx.fillStyle = WHITE;
  ctx.font = '300 110px "Playfair Display", Georgia, serif';
  const titleLines = wrapText(ctx, c.name, CONTENT_W, 2);
  let titleY = CARD_H * 0.46;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += 120;
  }

  let cursorY = titleY + 8;
  if (c.tagline) {
    ctx.fillStyle = WHITE_60;
    ctx.font = 'italic 400 36px "Playfair Display", Georgia, serif';
    const lines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of lines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 48;
    }
  }
  const tagsDisplay = formatTagsForCard(c.tags, { separator: " · " });
  if (tagsDisplay) {
    cursorY += 16;
    ctx.fillStyle = GOLD;
    ctx.font = 'italic 500 30px "Playfair Display", Georgia, serif';
    drawCenteredText(ctx, `with ${tagsDisplay}`, CARD_W / 2, cursorY);
    cursorY += 50;
  }

  // Single gold rule
  cursorY += 12;
  ctx.fillStyle = GOLD;
  ctx.fillRect(CARD_W / 2 - 50, cursorY, 100, 1);
  cursorY += 36;

  // Stats centered, spaced caps
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} MIN`);
  stats.push(difficultyLabel(c.difficulty).toUpperCase());
  if (c.servings != null) stats.push(`SERVES ${c.servings}`);
  ctx.fillStyle = WHITE_60;
  ctx.font = '500 26px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, stats.join("   ·   "), CARD_W / 2, cursorY);
  cursorY += 58;

  // Ingredients as italic text list (no chips)
  if (c.ingredients.length > 0) {
    const names = c.ingredients.map((i) => capitalize(i.name));
    if (c.ingredientOverflow > 0) {
      names.push(`+${c.ingredientOverflow} more`);
    }
    ctx.fillStyle = WHITE;
    ctx.font = 'italic 400 32px "Playfair Display", Georgia, serif';
    const lines = wrapText(ctx, names.join("  ·  "), CONTENT_W - 60, 3);
    for (const line of lines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 46;
    }
  }

  if (c.rating) {
    cursorY += 36;
    ctx.fillStyle = GOLD;
    ctx.font = '500 30px "Inter", system-ui, sans-serif';
    const text = `${c.rating.emoji}   ${c.rating.label.toUpperCase()}`;
    drawCenteredText(ctx, text, CARD_W / 2, cursorY);
    cursorY += 50;
  }
  if (c.note) {
    cursorY += 18;
    ctx.fillStyle = WHITE_60;
    ctx.font = 'italic 400 30px "Playfair Display", Georgia, serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 100, 2);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }

  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 70;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 70);
  // Bottom gold rule above the footer
  ctx.fillStyle = GOLD;
  ctx.fillRect(CARD_W / 2 - 30, watermarkY - 20, 60, 1);
  ctx.fillStyle = WHITE_60;
  ctx.font = '500 22px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, "M A D E   W I T H   W H A T ' S   C O O K I N", CARD_W / 2, watermarkY + 20);
  return watermarkY + 60;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
