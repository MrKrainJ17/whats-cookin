// Cute & Playful — pastel gradient, rounded type, slight tilts, sticker
// shadows. Gen-Z TikTok energy.

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
  roundRectPath,
  formatTagsForCard,
  drawLogoWatermark,
} from "./shared.js";

const TEXT_PRIMARY = "#3b2f4a";
const TEXT_MUTED = "#7d6b91";
const ACCENT = "#ec4899"; // hot pink

export function drawPlayful(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Pastel gradient background — peach → lavender
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#ffe5d9");
  bg.addColorStop(0.5, "#fde7f3");
  bg.addColorStop(1, "#e0d5ff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Scatter a few decorative dots
  ctx.fillStyle = "rgba(236, 72, 153, 0.10)";
  drawCircle(ctx, 120, 240, 50);
  drawCircle(ctx, CARD_W - 100, 360, 70);
  drawCircle(ctx, 90, CARD_H - 300, 40);
  drawCircle(ctx, CARD_W - 180, CARD_H - 200, 90);

  // Eyebrow with hand-drawn underline
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '600 38px "Fredoka", system-ui, sans-serif';
  const eyebrow = "i just cooked ✨";
  drawCenteredText(ctx, eyebrow, CARD_W / 2, SAFE_TOP + 30);

  // Hero emoji on a sticker-style rounded square with shadow + tilt
  const heroCY = CARD_H * 0.30;
  const stickerSize = 460;
  ctx.save();
  ctx.translate(CARD_W / 2, heroCY);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, -stickerSize / 2, -stickerSize / 2, stickerSize, stickerSize, 80);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.font = '380px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(c.emoji, 0, 20);
  ctx.restore();
  ctx.textAlign = "start";
  ctx.textBaseline = "top";

  // Title with playful slight rotation
  ctx.save();
  ctx.translate(CARD_W / 2, CARD_H * 0.55);
  ctx.rotate((2 * Math.PI) / 180);
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = '700 92px "Fredoka", system-ui, sans-serif';
  const titleLines = wrapText(ctx, c.name, CONTENT_W, 2);
  let titleY = 0;
  for (const line of titleLines) {
    const w = ctx.measureText(line).width;
    ctx.fillText(line, -w / 2, titleY);
    titleY += 104;
  }
  ctx.restore();

  let cursorY = CARD_H * 0.55 + titleLines.length * 104 + 30;
  if (c.tagline) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = '500 36px "Fredoka", system-ui, sans-serif';
    const tagLines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of tagLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 50;
    }
    cursorY += 8;
  }

  // Tagged people — playful Fredoka with the 🥂 cheers prefix
  const tagsDisplay = formatTagsForCard(c.tags, { separator: ", " });
  if (tagsDisplay) {
    ctx.fillStyle = ACCENT;
    ctx.font = '600 32px "Fredoka", system-ui, sans-serif';
    drawCenteredText(ctx, `🥂 with ${tagsDisplay}`, CARD_W / 2, cursorY);
    cursorY += 50;
  }
  cursorY += 8;

  // Stat pills — bright, rounded, slightly varied colors
  const statColors = ["#ff7a59", "#fbbf24", "#34d399"];
  const statPills = [];
  if (c.totalTimeMinutes != null)
    statPills.push({ label: `${c.totalTimeMinutes} min`, leading: "⏱️", bg: statColors[0], fg: "#ffffff" });
  statPills.push({ label: difficultyLabel(c.difficulty), leading: "👨‍🍳", bg: statColors[1], fg: "#3b2f4a" });
  if (c.servings != null)
    statPills.push({ label: `Serves ${c.servings}`, leading: "🍽️", bg: statColors[2], fg: "#ffffff" });
  cursorY += drawPillRow(ctx, statPills, CARD_W / 2, cursorY, CONTENT_W, {
    font: '600 32px "Fredoka", system-ui, sans-serif',
    leadingFont: '32px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
    bg: "#ffffff",
    fg: TEXT_PRIMARY,
    padX: 28,
    padY: 16,
    radius: 100,
    gap: 14,
  });

  // Ingredient chips — white sticker style
  if (c.ingredients.length > 0) {
    cursorY += 26;
    const ingPills = c.ingredients.map((i) => ({
      label: capitalize(i.name),
      leading: i.emoji,
    }));
    drawPillRow(ctx, ingPills, CARD_W / 2, cursorY, CONTENT_W, {
      font: '500 30px "Fredoka", system-ui, sans-serif',
      leadingFont: '30px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
      bg: "#ffffff",
      fg: TEXT_PRIMARY,
      padX: 22,
      padY: 14,
      radius: 100,
      gap: 12,
    });
  }

  // Rating + note
  const watermarkY = CARD_H - SAFE_BOTTOM - 70;
  let extrasBottom = watermarkY - 30;
  if (c.note) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = '500 32px "Fredoka", system-ui, sans-serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    let ny = extrasBottom - (noteLines.length - 1) * 44 - 20;
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, ny);
      ny += 44;
    }
    extrasBottom -= noteLines.length * 44 + 30;
  }
  if (c.rating) {
    ctx.fillStyle = ACCENT;
    ctx.font = '700 44px "Fredoka", system-ui, sans-serif';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label}`,
      CARD_W / 2,
      extrasBottom - 50,
    );
  }

  // Watermark — logo + text
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '600 30px "Fredoka", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "Made with What's Cookin", {
    logoSize: 54,
    gap: 16,
  });
}

function drawCircle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
