// Retro Diner — cream/yellow background, checkered red+white border,
// chunky retro serif title, vintage-tag style ingredient chips, stamped
// "MADE WITH WHAT'S COOKIN" footer.

import {
  CARD_W,
  CARD_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  CONTENT_W,
  wrapText,
  fitTitleLines,
  drawCenteredText,
  drawHeroEmoji,
  drawPillRow,
  extractCardContent,
  difficultyLabel,
  formatTagsForCard,
  drawLogoWatermark,
  buildChipPills,
} from "./shared.js";

const BG = "#FFF8DC";
const RED = "#CC0000";
const DEEP = "#3A1A0F";
const MUTED = "#7a4a3a";
const CHECKER = 36; // checker square size in card pixels

export function drawDiner(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // Checkered border — top & bottom rows
  drawCheckerRow(ctx, 0);
  drawCheckerRow(ctx, CHECKER);

  // "I JUST COOKED" label
  ctx.fillStyle = RED;
  ctx.font = '800 38px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, "★ I JUST COOKED ★", CARD_W / 2, SAFE_TOP + CHECKER * 2 + 20);

  // Hero
  drawHeroEmoji(ctx, c.emoji, CARD_W / 2, CARD_H * 0.30, 420);

  // Title — chunky retro serif
  ctx.fillStyle = DEEP;
  const { lines: titleLines, lineHeight: titleLH } = fitTitleLines(ctx, c.name, {
    maxWidth: CONTENT_W,
    baseSize: 102,
    minSize: 56,
    lineHeightRatio: 110 / 102,
    fontFor: (s) => `900 ${s}px "Playfair Display", Georgia, serif`,
  });
  let titleY = CARD_H * 0.48;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += titleLH;
  }

  let cursorY = titleY + 14;

  // Tagline
  if (c.tagline) {
    ctx.fillStyle = MUTED;
    ctx.font = 'italic 400 36px "Playfair Display", Georgia, serif';
    const lines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of lines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 48;
    }
    cursorY += 8;
  }

  // Tags
  const tagsDisplay = formatTagsForCard(c.tags, { separator: " · " });
  if (tagsDisplay) {
    ctx.fillStyle = RED;
    ctx.font = '700 30px "Inter", system-ui, sans-serif';
    drawCenteredText(ctx, `WITH ${tagsDisplay.toUpperCase()}`, CARD_W / 2, cursorY);
    cursorY += 46;
  }

  cursorY += 18;

  // Stats — retro badges in a row
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} MIN`);
  stats.push(difficultyLabel(c.difficulty).toUpperCase());
  if (c.servings != null) stats.push(`SERVES ${c.servings}`);
  cursorY += drawPillRow(ctx, stats.map((s) => ({ label: s, leading: "" })), CARD_W / 2, cursorY, CONTENT_W, {
    font: '900 30px "Inter", system-ui, sans-serif',
    leadingFont: '30px "Apple Color Emoji"',
    bg: RED,
    fg: "#FFF8DC",
    padX: 26,
    padY: 14,
    radius: 4,
    gap: 16,
  });

  // Ingredient chips — vintage price-tag look
  if (c.ingredients.length > 0) {
    cursorY += 26;
    cursorY += drawPillRow(ctx, buildChipPills(c, capitalize), CARD_W / 2, cursorY, CONTENT_W, {
      font: '700 28px "Inter", system-ui, sans-serif',
      leadingFont: '28px "Apple Color Emoji"',
      bg: "#fff",
      fg: DEEP,
      padX: 22,
      padY: 14,
      radius: 6,
      gap: 12,
      border: { color: RED, width: 2 },
    });
  }

  // Rating
  if (c.rating) {
    cursorY += 32;
    ctx.fillStyle = RED;
    ctx.font = '900 44px "Inter", system-ui, sans-serif';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label.toUpperCase()}`,
      CARD_W / 2,
      cursorY,
    );
    cursorY += 56;
  }
  // Note
  if (c.note) {
    cursorY += 20;
    ctx.fillStyle = DEEP;
    ctx.font = 'italic 500 32px "Playfair Display", Georgia, serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }

  // Footer — stamp style with checker tail
  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 110;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  ctx.fillStyle = MUTED;
  ctx.font = '900 28px "Inter", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "MADE WITH WHAT'S COOKIN", {
    logoSize: 48,
    gap: 14,
  });

  // Bottom checker rows
  const checkerBottom = watermarkY + 75;
  drawCheckerRow(ctx, checkerBottom);
  drawCheckerRow(ctx, checkerBottom + CHECKER);

  return checkerBottom + CHECKER * 2;
}

function drawCheckerRow(ctx, y) {
  const cols = Math.ceil(CARD_W / CHECKER);
  for (let i = 0; i < cols; i++) {
    ctx.fillStyle = i % 2 === 0 ? RED : "#fff";
    ctx.fillRect(i * CHECKER, y, CHECKER, CHECKER);
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
