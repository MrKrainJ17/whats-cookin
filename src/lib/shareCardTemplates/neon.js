// Neon Night — almost-black background, neon green title + chips with
// glow effect via canvas shadow blur, bold condensed type, cyberpunk
// energy.

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
  buildChipPills,
} from "./shared.js";

const BG = "#0D0D0D";
const NEON = "#39FF14";
const NEON_DIM = "rgba(57, 255, 20, 0.5)";
const WHITE_60 = "rgba(255,255,255,0.55)";

export function drawNeon(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // Grid background — subtle perspective lines
  ctx.strokeStyle = "rgba(57, 255, 20, 0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CARD_W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }

  // Eyebrow with neon glow
  applyGlow(ctx, NEON);
  ctx.fillStyle = NEON;
  ctx.font = '900 36px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, "▸ I JUST COOKED ◂", CARD_W / 2, SAFE_TOP + 40);
  clearGlow(ctx);

  // Hero with glow halo
  ctx.save();
  ctx.shadowColor = NEON;
  ctx.shadowBlur = 80;
  drawHeroEmoji(ctx, c.emoji, CARD_W / 2, CARD_H * 0.30, 420);
  ctx.restore();

  // Title — neon green, condensed bold, glow
  applyGlow(ctx, NEON);
  ctx.fillStyle = NEON;
  ctx.font = '900 110px "Space Grotesk", system-ui, sans-serif';
  const titleLines = wrapText(ctx, c.name.toUpperCase(), CONTENT_W, 2);
  let titleY = CARD_H * 0.48;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += 118;
  }
  clearGlow(ctx);

  let cursorY = titleY + 12;
  if (c.tagline) {
    ctx.fillStyle = WHITE_60;
    ctx.font = '500 32px "Space Grotesk", system-ui, sans-serif';
    const lines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of lines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }
  const tagsDisplay = formatTagsForCard(c.tags, { separator: " · " });
  if (tagsDisplay) {
    cursorY += 12;
    ctx.fillStyle = NEON;
    ctx.font = '700 30px "Space Grotesk", system-ui, sans-serif';
    drawCenteredText(ctx, `WITH ${tagsDisplay.toUpperCase()}`, CARD_W / 2, cursorY);
    cursorY += 46;
  }
  cursorY += 18;

  // Stats — neon
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} MIN`);
  stats.push(difficultyLabel(c.difficulty).toUpperCase());
  if (c.servings != null) stats.push(`SERVES ${c.servings}`);
  ctx.fillStyle = NEON;
  ctx.font = '800 32px "Space Grotesk", system-ui, sans-serif';
  drawCenteredText(ctx, stats.join("  ◆  "), CARD_W / 2, cursorY);
  cursorY += 64;

  // Chips with neon glow border
  if (c.ingredients.length > 0) {
    ctx.save();
    ctx.shadowColor = NEON;
    ctx.shadowBlur = 16;
    cursorY += drawPillRow(ctx, buildChipPills(c, capitalize), CARD_W / 2, cursorY, CONTENT_W, {
      font: '700 28px "Space Grotesk", system-ui, sans-serif',
      leadingFont: '28px "Apple Color Emoji"',
      bg: null,
      fg: NEON,
      padX: 22,
      padY: 14,
      radius: 6,
      gap: 14,
      border: { color: NEON, width: 2 },
    });
    ctx.restore();
  }

  if (c.rating) {
    cursorY += 32;
    applyGlow(ctx, NEON);
    ctx.fillStyle = NEON;
    ctx.font = '900 44px "Space Grotesk", system-ui, sans-serif';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label.toUpperCase()}`,
      CARD_W / 2,
      cursorY,
    );
    clearGlow(ctx);
    cursorY += 56;
  }
  if (c.note) {
    cursorY += 20;
    ctx.fillStyle = WHITE_60;
    ctx.font = 'italic 500 30px "Space Grotesk", system-ui, sans-serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }

  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 70;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  // Footer with subtle neon underline
  ctx.fillStyle = NEON_DIM;
  ctx.fillRect(CARD_W / 2 - 80, watermarkY + 78, 160, 2);
  ctx.fillStyle = WHITE_60;
  ctx.font = '700 26px "Space Grotesk", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "MADE WITH WHAT'S COOKIN", {
    logoSize: 50,
    gap: 14,
  });
  return watermarkY + 90;
}

function applyGlow(ctx, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
}
function clearGlow(ctx) {
  ctx.restore();
}
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
