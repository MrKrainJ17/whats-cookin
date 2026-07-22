// Polaroid — white card with a thick white border around a soft-paper
// inner panel. Big hero image up top, handwritten Caveat title below,
// handwritten note in the bottom polaroid strip. Authentic snapshot vibe.

import {
  CARD_W,
  CARD_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  CONTENT_W,
  wrapText,
  drawCenteredText,
  drawHeroEmoji,
  drawPillRow,
  extractCardContent,
  difficultyLabel,
  formatTagsForCard,
  drawLogoWatermark,
  roundRectPath,
  buildChipPills,
} from "./shared.js";

const OUTER_BG = "#E5DCC9";    // photo-album cardstock peek
const FRAME = "#FFFFFF";        // polaroid border
const INNER = "#F4EFE3";        // warm soft paper
const TEXT_PRIMARY = "#1f1812";
const TEXT_MUTED = "#7a6f64";
const ACCENT = "#c8421b";
const BORDER = 60;              // polaroid white border thickness

export function drawPlayful(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  ctx.fillStyle = OUTER_BG;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // Drop shadow under the polaroid frame
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = FRAME;
  const frameTop = SAFE_TOP - 20;
  const frameH = ctx.canvas.height - frameTop - SAFE_BOTTOM + 20;
  roundRectPath(ctx, 40, frameTop, CARD_W - 80, frameH, 14);
  ctx.fill();
  ctx.restore();

  // Inner warm-paper panel
  ctx.fillStyle = INNER;
  roundRectPath(
    ctx,
    40 + BORDER,
    frameTop + BORDER,
    CARD_W - 80 - BORDER * 2,
    frameH - BORDER * 2,
    6,
  );
  ctx.fill();

  // Top date stamp
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '500 28px "Inter", system-ui, sans-serif';
  const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  drawCenteredText(ctx, `· ${dateLabel} ·`, CARD_W / 2, frameTop + BORDER + 30);

  // Hero
  drawHeroEmoji(ctx, c.emoji, CARD_W / 2, CARD_H * 0.30, 460);

  // Handwritten title
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = '700 110px "Caveat", "Patrick Hand", cursive';
  const titleLines = wrapText(ctx, c.name, CONTENT_W - 80, 2);
  let titleY = CARD_H * 0.50;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += 104;
  }

  let cursorY = titleY + 6;
  if (c.tagline) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = '500 36px "Caveat", "Patrick Hand", cursive';
    const lines = wrapText(ctx, c.tagline, CONTENT_W - 120, 2);
    for (const line of lines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }
  const tagsDisplay = formatTagsForCard(c.tags, { separator: ", " });
  if (tagsDisplay) {
    cursorY += 8;
    ctx.fillStyle = ACCENT;
    ctx.font = '600 38px "Caveat", "Patrick Hand", cursive';
    drawCenteredText(ctx, `with ${tagsDisplay}`, CARD_W / 2, cursorY);
    cursorY += 50;
  }
  cursorY += 14;

  // Tiny stats line — handwritten too
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} min`);
  stats.push(difficultyLabel(c.difficulty));
  if (c.servings != null) stats.push(`serves ${c.servings}`);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '500 32px "Caveat", "Patrick Hand", cursive';
  drawCenteredText(ctx, stats.join("  ·  "), CARD_W / 2, cursorY);
  cursorY += 56;

  // Ingredients chips — soft cream pills
  if (c.ingredients.length > 0) {
    cursorY += drawPillRow(ctx, buildChipPills(c, capitalize), CARD_W / 2, cursorY, CONTENT_W - BORDER * 2, {
      font: '500 28px "Inter", system-ui, sans-serif',
      leadingFont: '28px "Apple Color Emoji"',
      bg: "#fff",
      fg: TEXT_PRIMARY,
      padX: 20,
      padY: 12,
      radius: 100,
      gap: 12,
      border: { color: "#d8cfbf", width: 1.5 },
    });
  }

  if (c.rating) {
    cursorY += 28;
    ctx.fillStyle = ACCENT;
    ctx.font = '700 48px "Caveat", "Patrick Hand", cursive';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label}`,
      CARD_W / 2,
      cursorY,
    );
    cursorY += 60;
  }
  // Handwritten note
  if (c.note) {
    cursorY += 18;
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = '500 42px "Caveat", "Patrick Hand", cursive';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 140, 3);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 50;
    }
  }

  // Watermark
  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 110;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '600 30px "Caveat", "Patrick Hand", cursive';
  drawLogoWatermark(ctx, watermarkY + 5, "made with What's Cookin", {
    logoSize: 52,
    gap: 14,
  });
  return watermarkY + 100;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
