// Gradient Sunset — coral → golden vertical gradient, all white text,
// semi-transparent white chips, soft-glow circle behind the hero,
// modern Instagram-story energy.

import {
  CARD_W,
  CARD_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  CONTENT_W,
  wrapText,
  drawCenteredText,
  drawPillRow,
  extractCardContent,
  difficultyLabel,
  formatTagsForCard,
  drawLogoWatermark,
  buildChipPills,
} from "./shared.js";

const CORAL = "#FF6B6B";
const GOLD = "#FFD93D";
const WHITE = "#ffffff";
const WHITE_70 = "rgba(255,255,255,0.7)";
const WHITE_15 = "rgba(255,255,255,0.18)";

export function drawSunset(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Vertical gradient — coral → gold
  const bg = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  bg.addColorStop(0, CORAL);
  bg.addColorStop(1, GOLD);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // "I JUST COOKED…"
  ctx.fillStyle = WHITE_70;
  ctx.font = '700 36px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, "I JUST COOKED", CARD_W / 2, SAFE_TOP + 40);

  // White circle behind hero with soft glow
  const heroCY = CARD_H * 0.30;
  ctx.save();
  ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
  ctx.shadowBlur = 80;
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(CARD_W / 2, heroCY, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hero emoji
  ctx.font = '380px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  drawCenteredText(ctx, c.emoji, CARD_W / 2, heroCY - 190);

  // Title — bold white with text shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = WHITE;
  ctx.font = '900 100px "Inter", system-ui, sans-serif';
  const titleLines = wrapText(ctx, c.name, CONTENT_W, 2);
  let titleY = CARD_H * 0.50;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += 110;
  }
  ctx.restore();

  let cursorY = titleY + 8;
  if (c.tagline) {
    ctx.fillStyle = WHITE_70;
    ctx.font = '500 36px "Inter", system-ui, sans-serif';
    const lines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of lines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 48;
    }
  }
  const tagsDisplay = formatTagsForCard(c.tags, { separator: " · " });
  if (tagsDisplay) {
    cursorY += 12;
    ctx.fillStyle = WHITE;
    ctx.font = '700 30px "Inter", system-ui, sans-serif';
    drawCenteredText(ctx, `with ${tagsDisplay}`, CARD_W / 2, cursorY);
    cursorY += 44;
  }
  cursorY += 14;

  // Stats — clear white text, no pill
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} min`);
  stats.push(difficultyLabel(c.difficulty));
  if (c.servings != null) stats.push(`Serves ${c.servings}`);
  ctx.fillStyle = WHITE;
  ctx.font = '600 34px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, stats.join("  ·  "), CARD_W / 2, cursorY);
  cursorY += 64;

  // Ingredients — translucent white chips
  if (c.ingredients.length > 0) {
    cursorY += drawPillRow(ctx, buildChipPills(c, capitalize), CARD_W / 2, cursorY, CONTENT_W, {
      font: '600 30px "Inter", system-ui, sans-serif',
      leadingFont: '30px "Apple Color Emoji"',
      bg: WHITE_15,
      fg: WHITE,
      padX: 24,
      padY: 14,
      radius: 100,
      gap: 12,
      border: { color: "rgba(255,255,255,0.55)", width: 2 },
    });
  }

  if (c.rating) {
    cursorY += 32;
    ctx.fillStyle = WHITE;
    ctx.font = '800 44px "Inter", system-ui, sans-serif';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label}`,
      CARD_W / 2,
      cursorY,
    );
    cursorY += 56;
  }
  if (c.note) {
    cursorY += 20;
    ctx.fillStyle = WHITE;
    ctx.font = 'italic 500 32px "Inter", system-ui, sans-serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }

  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 70;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  ctx.fillStyle = WHITE;
  ctx.font = '700 28px "Inter", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "MADE WITH WHAT'S COOKIN", {
    logoSize: 50,
    gap: 14,
  });
  return watermarkY + 80;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
