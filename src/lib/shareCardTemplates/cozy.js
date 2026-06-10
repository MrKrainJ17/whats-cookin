// Warm & Cozy — cream background, warm orange/red accent, serif typography.
// Magazine-spread feel.

import {
  CARD_W,
  CARD_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  CONTENT_LEFT,
  CONTENT_W,
  wrapText,
  drawCenteredText,
  drawHeroEmoji,
  drawPillRow,
  extractCardContent,
  difficultyLabel,
  formatTagsForCard,
  drawLogoWatermark,
} from "./shared.js";

const BG = "#fbf6ec";
const ACCENT = "#c8421b";
const TEXT_PRIMARY = "#2d2a26";
const TEXT_MUTED = "#7a6f64";
const PILL_BG = "rgba(200, 66, 27, 0.10)";

export function drawCozy(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle radial wash for warmth
  const wash = ctx.createRadialGradient(
    CARD_W / 2, CARD_H * 0.35, 100,
    CARD_W / 2, CARD_H * 0.35, CARD_W * 0.8,
  );
  wash.addColorStop(0, "rgba(255, 220, 180, 0.35)");
  wash.addColorStop(1, "rgba(255, 220, 180, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // "I JUST COOKED..."
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '600 36px "Inter", system-ui, sans-serif';
  const eyebrow = "I JUST COOKED…";
  ctx.fillText(eyebrow, CONTENT_LEFT, SAFE_TOP + 30);
  // Letter-spaced effect: redraw with manual tracking
  ctx.clearRect(CONTENT_LEFT - 4, SAFE_TOP + 28, ctx.measureText(eyebrow).width + 200, 50);
  ctx.fillStyle = BG;
  ctx.fillRect(CONTENT_LEFT - 4, SAFE_TOP + 28, ctx.measureText(eyebrow).width + 200, 50);
  // Redraw bg wash over the cleared spot
  ctx.fillStyle = wash;
  ctx.fillRect(CONTENT_LEFT - 4, SAFE_TOP + 28, ctx.measureText(eyebrow).width + 200, 50);

  ctx.fillStyle = TEXT_MUTED;
  drawLetterSpaced(ctx, eyebrow, CONTENT_LEFT, SAFE_TOP + 30, 6);

  // A short orange accent rule under the eyebrow
  ctx.fillStyle = ACCENT;
  ctx.fillRect(CONTENT_LEFT, SAFE_TOP + 95, 90, 4);

  // Hero emoji
  drawHeroEmoji(ctx, c.emoji, CARD_W / 2, CARD_H * 0.32, 420);

  // Title (Playfair Display)
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = '900 96px "Playfair Display", Georgia, serif';
  const titleLines = wrapText(ctx, c.name, CONTENT_W, 2);
  let titleY = CARD_H * 0.50;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += 108;
  }

  // Tagline
  let cursorY = titleY + 20;
  if (c.tagline) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = 'italic 400 38px "Playfair Display", Georgia, serif';
    const tagLines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of tagLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 50;
    }
    cursorY += 12;
  }

  // Tagged people — italic serif, warm muted color, "with @sarah, @mike"
  const tagsDisplay = formatTagsForCard(c.tags, { separator: ", " });
  if (tagsDisplay) {
    ctx.fillStyle = ACCENT;
    ctx.font = 'italic 500 30px "Playfair Display", Georgia, serif';
    drawCenteredText(ctx, `with ${tagsDisplay}`, CARD_W / 2, cursorY);
    cursorY += 50;
  }
  cursorY += 8;

  // Stat pills
  const statPills = [];
  if (c.totalTimeMinutes != null) statPills.push({ label: `${c.totalTimeMinutes} min`, leading: "⏱️" });
  statPills.push({ label: difficultyLabel(c.difficulty), leading: "👨‍🍳" });
  if (c.servings != null) statPills.push({ label: `Serves ${c.servings}`, leading: "🍽️" });
  cursorY += 10;
  cursorY += drawPillRow(ctx, statPills, CARD_W / 2, cursorY, CONTENT_W, {
    font: '600 32px "Inter", system-ui, sans-serif',
    leadingFont: '32px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
    bg: PILL_BG,
    fg: ACCENT,
    padX: 28,
    padY: 16,
    radius: 100,
    gap: 16,
  });

  // Ingredient chips
  if (c.ingredients.length > 0) {
    cursorY += 30;
    const ingPills = c.ingredients.map((i) => ({
      label: capitalize(i.name),
      leading: i.emoji,
    }));
    drawPillRow(ctx, ingPills, CARD_W / 2, cursorY, CONTENT_W, {
      font: '500 30px "Inter", system-ui, sans-serif',
      leadingFont: '30px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
      bg: "#ffffff",
      fg: TEXT_PRIMARY,
      padX: 22,
      padY: 14,
      radius: 100,
      gap: 14,
    });
  }

  // Rating + note (positioned above watermark)
  const watermarkY = CARD_H - SAFE_BOTTOM - 70;
  let extrasBottom = watermarkY - 30;
  if (c.note) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = 'italic 400 32px "Playfair Display", Georgia, serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 100, 2);
    let ny = extrasBottom - (noteLines.length - 1) * 44 - 20;
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, ny);
      ny += 44;
    }
    extrasBottom -= noteLines.length * 44 + 30;
  }
  if (c.rating) {
    ctx.fillStyle = ACCENT;
    ctx.font = '700 44px "Inter", system-ui, sans-serif';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label}`,
      CARD_W / 2,
      extrasBottom - 50,
    );
  }

  // Watermark
  drawWatermark(ctx, watermarkY);
}

function drawLetterSpaced(ctx, text, x, y, spacing) {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function drawWatermark(ctx, y) {
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '600 30px "Inter", system-ui, sans-serif';
  drawLogoWatermark(ctx, y, "Made with What's Cookin", { logoSize: 56, gap: 18 });
}
