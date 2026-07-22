// Clean & Minimal — pure white, black type, thin lines, no shadows.
// Apple-marketing energy. Truly minimal: no decorative flourishes.

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
  extractCardContent,
  difficultyLabel,
  roundRectPath,
  formatTagsForCard,
  drawLogoWatermark,
  buildChipPills,
} from "./shared.js";

const BG = "#ffffff";
const SAGE = "#7B9E7B";
const TEXT_PRIMARY = "#0a0a0a";
const TEXT_MUTED = "#737373";
const LINE = "#e5e5e5";
const CHIP_CORNER_RADIUS = 100; // soft rounded pills

export function drawMinimal(ctx, recipe, userOptions = {}) {
  const c = extractCardContent(recipe, userOptions);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, ctx.canvas.height);

  // Top hairline + eyebrow with sage leaf accent
  ctx.fillStyle = LINE;
  ctx.fillRect(CONTENT_LEFT, SAFE_TOP + 70, CONTENT_W, 1);
  ctx.fillStyle = SAGE;
  ctx.font = '500 30px "Inter", system-ui, sans-serif';
  ctx.fillText("🌿  I just cooked", CONTENT_LEFT, SAFE_TOP + 25);
  // Right-aligned date stamp
  const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const dw = ctx.measureText(dateLabel).width;
  ctx.fillText(dateLabel, CARD_W - CONTENT_LEFT - dw, SAFE_TOP + 25);

  // Hero emoji — no shadow, generous space
  drawHeroEmoji(ctx, c.emoji, CARD_W / 2, CARD_H * 0.32, 440, { shadow: false });

  // Title — Inter heavy, centered, tight
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = '700 88px "Inter", system-ui, sans-serif';
  const titleLines = wrapText(ctx, c.name, CONTENT_W, 2);
  let titleY = CARD_H * 0.51;
  for (const line of titleLines) {
    drawCenteredText(ctx, line, CARD_W / 2, titleY);
    titleY += 98;
  }

  // Tagline
  let cursorY = titleY + 10;
  if (c.tagline) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = '400 34px "Inter", system-ui, sans-serif';
    const tagLines = wrapText(ctx, c.tagline, CONTENT_W - 80, 2);
    for (const line of tagLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 46;
    }
    cursorY += 20;
  }

  // Hairline separator — 40px wide, centered, single thin line
  cursorY += 10;
  ctx.fillStyle = LINE;
  ctx.fillRect(CARD_W / 2 - 20, cursorY, 40, 1);
  cursorY += 22;

  // Tagged people — very subtle, light gray italic, below the divider
  const tagsDisplay = formatTagsForCard(c.tags, { separator: ", " });
  if (tagsDisplay) {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = 'italic 400 28px "Inter", system-ui, sans-serif';
    drawCenteredText(ctx, `with ${tagsDisplay}`, CARD_W / 2, cursorY);
    cursorY += 42;
  }
  cursorY += 8;

  // Stats — plain text, dot-separated. No borders, no curves, just clean text.
  const stats = [];
  if (c.totalTimeMinutes != null) stats.push(`${c.totalTimeMinutes} min`);
  stats.push(difficultyLabel(c.difficulty));
  if (c.servings != null) stats.push(`Serves ${c.servings}`);
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = '500 32px "Inter", system-ui, sans-serif';
  drawCenteredText(ctx, stats.join("  ·  "), CARD_W / 2, cursorY);
  cursorY += 60;

  // Ingredient chips — outlined, capture height so rating + note flow below.
  if (c.ingredients.length > 0) {
    const ingPills = buildChipPills(c, capitalize);
    cursorY += drawPillRowOutlined(ctx, ingPills, CARD_W / 2, cursorY, CONTENT_W);
  }

  // Rating in sage green.
  if (c.rating) {
    cursorY += 32;
    ctx.fillStyle = SAGE;
    ctx.font = '600 38px "Inter", system-ui, sans-serif';
    drawCenteredText(
      ctx,
      `${c.rating.emoji}  ${c.rating.label}`,
      CARD_W / 2,
      cursorY,
    );
    cursorY += 50;
  }
  if (c.note) {
    cursorY += 20;
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = 'italic 400 32px "Inter", system-ui, sans-serif';
    const noteLines = wrapText(ctx, `"${c.note}"`, CONTENT_W - 80, 2);
    for (const line of noteLines) {
      drawCenteredText(ctx, line, CARD_W / 2, cursorY);
      cursorY += 44;
    }
  }

  // Watermark — bottom hairline + logo + text. Dynamic Y so it never
  // overlaps the note even with multi-row chips above.
  const defaultWatermarkY = CARD_H - SAFE_BOTTOM - 70;
  const watermarkY = Math.max(defaultWatermarkY, cursorY + 60);
  ctx.fillStyle = LINE;
  ctx.fillRect(CONTENT_LEFT, watermarkY - 20, CONTENT_W, 1);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '500 28px "Inter", system-ui, sans-serif';
  drawLogoWatermark(ctx, watermarkY + 5, "Made with What's Cookin", {
    logoSize: 52,
    gap: 16,
  });
  return watermarkY + 80;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function drawPillRowOutlined(ctx, pills, cx, y, maxWidth) {
  ctx.font = '500 28px "Inter", system-ui, sans-serif';
  const gap = 14;
  const padX = 22;
  const padY = 12;
  const lineH = 28 + padY * 2; // 52

  const widths = pills.map((p) => {
    const lead = ctx.measureText(p.leading).width;
    const lab = ctx.measureText(p.label).width;
    return padX * 2 + lead + 12 + lab;
  });
  const rows = [];
  let row = [];
  let rowW = 0;
  for (let i = 0; i < pills.length; i++) {
    const w = widths[i];
    const projected = rowW + (row.length ? gap : 0) + w;
    if (projected > maxWidth && row.length) {
      rows.push({ items: row, totalW: rowW });
      row = [{ pill: pills[i], width: w }];
      rowW = w;
    } else {
      row.push({ pill: pills[i], width: w });
      rowW = projected;
    }
  }
  if (row.length) rows.push({ items: row, totalW: rowW });

  let cy = y;
  for (const r of rows) {
    let cursor = cx - r.totalW / 2;
    for (const { pill, width } of r.items) {
      // Outline in sage green — clamped radius via roundRectPath.
      ctx.strokeStyle = SAGE;
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, cursor, cy, width, lineH, CHIP_CORNER_RADIUS);
      ctx.stroke();
      // Text content
      ctx.fillStyle = TEXT_PRIMARY;
      if (pill.leading) {
        ctx.fillText(pill.leading, cursor + padX, cy + padY);
      }
      const leadW = pill.leading ? ctx.measureText(pill.leading).width + 12 : 0;
      ctx.fillText(pill.label, cursor + padX + leadW, cy + padY);
      cursor += width + gap;
    }
    cy += lineH + gap;
  }
  // Subtract one trailing gap (no row after the last one).
  return rows.length > 0 ? cy - y - gap : 0;
}
