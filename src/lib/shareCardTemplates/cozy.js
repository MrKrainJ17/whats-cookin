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
  buildChipPills,
} from "./shared.js";

const BG = "#fbf6ec";
const ACCENT = "#c8421b";
const TEXT_PRIMARY = "#2d2a26";
const TEXT_MUTED = "#7a6f64";
const PILL_BG = "rgba(200, 66, 27, 0.10)";

export function drawCozy(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Background — fill the entire scratch canvas so the final crop
  // never reveals transparent pixels at the bottom.
  const canvasH = ctx.canvas.height;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, canvasH);

  // Subtle radial wash for warmth
  const wash = ctx.createRadialGradient(
    CARD_W / 2, CARD_H * 0.35, 100,
    CARD_W / 2, CARD_H * 0.35, CARD_W * 0.8,
  );
  wash.addColorStop(0, "rgba(255, 220, 180, 0.35)");
  wash.addColorStop(1, "rgba(255, 220, 180, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, CARD_W, canvasH);

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

  // Ingredient chips — capture the height drawPillRow consumed so the
  // rating + note below cannot creep up and overlap them.
  if (c.ingredients.length > 0) {
    cursorY += 30;
    const ingPills = buildChipPills(c, capitalize);
    cursorY += drawPillRow(ctx, ingPills, CARD_W / 2, cursorY, CONTENT_W, {
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

  // Rating → note → watermark, all top-down. Every element gets a
  // guaranteed gap from the one above it. Watermark sits at least
  // (default safe-area position) but flows further down if the note
  // pushed past it.
  if (c.rating) {
    cursorY += 32;
    ctx.fillStyle = ACCENT;
    ctx.font = '700 44px "Inter", system-ui, sans-serif';
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
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = 'italic 400 32px "Playfair Display", Georgia, serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 100, 2);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }

  // Watermark — at least the default y, but always at least 60px below
  // whatever content ended the bottom stack. Tracks the canvas growing
  // taller when chips/note are long.
  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 70;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  drawWatermark(ctx, watermarkY);

  // Return Y of the bottommost pixel so generateShareCard can crop.
  // Watermark label sits ~75px tall (logo + text).
  return watermarkY + 80;
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
