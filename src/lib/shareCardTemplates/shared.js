// Shared utilities for share-card templates. Pure canvas — no deps.

export const CARD_W = 1080;
export const CARD_H = 1920;
// Instagram Stories crops slightly at top/bottom; keep crucial content inside.
export const SAFE_TOP = Math.round(CARD_H * 0.06);
export const SAFE_BOTTOM = Math.round(CARD_H * 0.06);
export const CONTENT_LEFT = 96;
export const CONTENT_RIGHT = CARD_W - 96;
export const CONTENT_W = CONTENT_RIGHT - CONTENT_LEFT;

// Ingredient → emoji lookup lives in src/lib/ingredientEmojis.js (the
// canonical, much-larger mapping). Re-exported here so existing share-card
// template imports keep working.
import { emojiForIngredient } from "../ingredientEmojis.js";
export { emojiForIngredient };

// Word-wrap text into up to `maxLines` lines that fit `maxWidth`. Truncates
// the last line with an ellipsis when more text would overflow.
export function wrapText(ctx, text, maxWidth, maxLines = 2) {
  if (!text) return [];
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (lines.length >= maxLines) break;

    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
      continue;
    }

    // The word won't fit on the current line — flush what we have.
    if (current) {
      lines.push(current);
      current = "";
      if (lines.length >= maxLines) break;
    }

    // A word that fits on its own line simply starts the next one.
    if (ctx.measureText(word).width <= maxWidth) {
      current = word;
      continue;
    }

    // The word is wider than an entire line. Break it character by
    // character (overflow-wrap: break-word) so a long unbroken string can
    // never run off the sides of the card.
    let chunk = "";
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width <= maxWidth) {
        chunk += ch;
        continue;
      }
      if (lines.length >= maxLines) {
        chunk = "";
        break;
      }
      if (chunk) lines.push(chunk);
      chunk = ch;
    }
    current = chunk;
  }
  if (current && lines.length < maxLines) lines.push(current);
  // If we still have leftover text, truncate the last line with an ellipsis.
  if (lines.length === maxLines) {
    const consumed = lines.join(" ").length;
    if (consumed < String(text).length) {
      let last = lines[lines.length - 1];
      while (last.length > 1 && ctx.measureText(last + "…").width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[lines.length - 1] = last + "…";
    }
  }
  return lines;
}

// Pretty rounded rectangle path (no fill/stroke — caller decides).
export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawCenteredText(ctx, text, cx, y) {
  const w = ctx.measureText(text).width;
  ctx.fillText(text, cx - w / 2, y);
}

// Pill chip with label + optional leading emoji. Returns drawn width so the
// caller can lay multiple pills out in a row.
export function drawPill(ctx, x, y, label, { font, padX = 28, padY = 16, bg, fg, radius = 100, leading = null, leadingFont = null, border = null, shadow = null }) {
  ctx.font = font;
  const leadingW = leading ? measureLeadingWidth(ctx, leading, leadingFont) : 0;
  const labelW = ctx.measureText(label).width;
  const gap = leading ? 14 : 0;
  const innerW = leadingW + gap + labelW;
  const totalW = innerW + padX * 2;
  const fontHeight = pxFromFont(font);
  const totalH = fontHeight + padY * 2;

  if (shadow) {
    ctx.save();
    ctx.shadowColor = shadow.color || "rgba(0,0,0,0.2)";
    ctx.shadowBlur = shadow.blur || 16;
  }
  if (bg) {
    ctx.fillStyle = bg;
    roundRectPath(ctx, x, y, totalW, totalH, radius);
    ctx.fill();
  }
  if (shadow) ctx.restore();
  if (border) {
    ctx.strokeStyle = border.color;
    ctx.lineWidth = border.width ?? 2;
    roundRectPath(ctx, x, y, totalW, totalH, radius);
    ctx.stroke();
  }

  ctx.fillStyle = fg;
  const textBaselineY = y + padY;
  let cursor = x + padX;
  if (leading) {
    const lf = leadingFont || font;
    ctx.font = lf;
    ctx.fillText(leading, cursor, textBaselineY);
    cursor += leadingW + gap;
    ctx.font = font;
  }
  ctx.fillText(label, cursor, textBaselineY);

  return { width: totalW, height: totalH };
}

function measureLeadingWidth(ctx, leading, leadingFont) {
  if (!leadingFont) return ctx.measureText(leading).width;
  const prev = ctx.font;
  ctx.font = leadingFont;
  const w = ctx.measureText(leading).width;
  ctx.font = prev;
  return w;
}

function pxFromFont(font) {
  const match = /(\d+)px/.exec(font);
  return match ? parseInt(match[1], 10) : 32;
}

export function drawHeroEmoji(ctx, emoji, cx, cy, size, { shadow = true } = {}) {
  ctx.save();
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
  }
  ctx.fillText(emoji, cx, cy);
  ctx.restore();
  ctx.textBaseline = "top";
  ctx.textAlign = "start";
}

// Lay out a horizontal row of pills, centered horizontally. Wraps to a
// second row if total width exceeds maxWidth.
export function drawPillRow(ctx, pills, cx, y, maxWidth, opts) {
  const gap = opts.gap ?? 16;
  // First pass: measure widths
  const widths = pills.map((p) => {
    ctx.font = opts.font;
    const leadingW = p.leading
      ? measureLeadingWidth(ctx, p.leading, opts.leadingFont || opts.font)
      : 0;
    const labelW = ctx.measureText(p.label).width;
    return (opts.padX ?? 28) * 2 + leadingW + (p.leading ? 14 : 0) + labelW;
  });
  // Group into rows
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

  const rowH = pxFromFont(opts.font) + (opts.padY ?? 16) * 2;
  let cy = y;
  for (const r of rows) {
    let cursor = cx - r.totalW / 2;
    for (const { pill } of r.items) {
      const drawn = drawPill(ctx, cursor, cy, pill.label, {
        font: opts.font,
        padX: opts.padX,
        padY: opts.padY,
        bg: pill.bg ?? opts.bg,
        fg: pill.fg ?? opts.fg,
        radius: opts.radius,
        leading: pill.leading,
        leadingFont: opts.leadingFont,
        border: opts.border,
        shadow: opts.shadow,
      });
      cursor += drawn.width + gap;
    }
    cy += rowH + gap;
  }
  return cy - y; // total height consumed
}

// Common content extracted from a recipe + user options used by every template.
export const MAX_INGREDIENT_CHIPS = 6;

// Helper: build the chip-row payload including a "+N more" tail chip
// when the recipe has more ingredients than fit. Templates choose their
// own visual styling via opts on drawPillRow.
export function buildChipPills(c, capitalizeFn = (s) => s) {
  const pills = c.ingredients.map((i) => ({
    label: capitalizeFn(i.name),
    leading: i.emoji,
  }));
  if (c.ingredientOverflow > 0) {
    pills.push({ label: `+${c.ingredientOverflow} more`, leading: "" });
  }
  return pills;
}

export function extractCardContent(recipe, userOptions = {}) {
  const allIngs = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const ings = allIngs.slice(0, MAX_INGREDIENT_CHIPS).map((i) => ({
    name: i.name,
    emoji: emojiForIngredient(i.name),
  }));
  const overflow = Math.max(0, allIngs.length - MAX_INGREDIENT_CHIPS);

  const ratingMap = {
    loved: { emoji: "⭐", label: "My new favorite!" },
    really_good: { emoji: "😋", label: "Really good" },
    solid: { emoji: "👍", label: "Pretty solid" },
    okay: { emoji: "🤷", label: "It was okay" },
    again: { emoji: "🔁", label: "Would make again" },
    // Legacy ids kept so previously-saved drafts still render.
    fine: { emoji: "🤷", label: "It was okay" },
    never_again: { emoji: "👎", label: "Never again" },
  };

  const tags = Array.isArray(userOptions.tags)
    ? userOptions.tags.filter(
        (t) => typeof t === "string" && t.startsWith("@") && t.length > 1,
      )
    : [];

  return {
    name: recipe.name || "Untitled Recipe",
    tagline: recipe.tagline || "",
    emoji: recipe.emoji || "🍽️",
    totalTimeMinutes: recipe.totalTimeMinutes,
    difficulty: recipe.difficulty || "easy",
    servings: recipe.servings,
    ingredients: ings,
    ingredientOverflow: overflow,
    rating: userOptions.rating ? ratingMap[userOptions.rating] : null,
    note: typeof userOptions.note === "string" ? userOptions.note.trim().slice(0, 80) : "",
    tags,
  };
}

// Card display string for a tag list. Up to 4 tags shows them all; 5+
// collapses to "first three names and N others". Used by every template
// with its own separator (comma vs. space).
export function formatTagsForCard(tags, { separator = ", " } = {}) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  if (tags.length <= 4) return tags.join(separator);
  return `${tags.slice(0, 3).join(separator)} and ${tags.length - 3} others`;
}

export function difficultyLabel(d) {
  if (d === "easy") return "Easy";
  if (d === "medium") return "Medium";
  if (d === "hard") return "Hard";
  return String(d || "").replace(/^\w/, (c) => c.toUpperCase());
}

// Draws the What's Cookin pot logo (Variation 2 — brown pot, terracotta
// steam) onto a 2D canvas context. Same exact paths as LogoVariant2.jsx
// and public/favicon.svg, just rendered through Path2D so it composites
// onto the share-card canvas. Stroke width scales with size.
//
// (x, y) is the top-left of a square `size`×`size` logo box.
export function drawLogo(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 100;
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 5;

  // Steam — terracotta
  ctx.strokeStyle = "#D2691E";
  strokePath(ctx, "M 36 47 C 31 41, 40 36, 35 30 C 30 24, 41 18, 36 11");
  strokePath(ctx, "M 50 45 C 55 39, 45 33, 51 26 C 56 19, 45 13, 51 5");
  strokePath(ctx, "M 64 47 C 69 41, 60 36, 65 30 C 70 24, 60 19, 65 12");

  // Pot — warm brown
  ctx.strokeStyle = "#2B2118";
  strokePath(ctx, "M 16 50 Q 50 47, 84 50");
  strokePath(ctx, "M 22 56 C 12 57, 11 71, 23 72");
  strokePath(ctx, "M 78 56 C 89 57, 90 70, 77 73");
  strokePath(
    ctx,
    "M 20 50 C 19 66, 22 82, 24 86 C 32 89, 68 89, 76 86 C 79 82, 81 66, 80 50",
  );

  ctx.restore();
}

function strokePath(ctx, d) {
  ctx.stroke(new Path2D(d));
}

// Centered "logo + text" watermark used by every share-card template.
// The caller sets `ctx.font` and `ctx.fillStyle` before calling so the
// text styling matches the template's typography. textTopY is where the
// text's TOP edge sits (assumes ctx.textBaseline = "top", which shareCard.js
// already configures globally).
export function drawLogoWatermark(
  ctx,
  textTopY,
  text,
  { logoSize = 56, gap = 16 } = {},
) {
  const textWidth = ctx.measureText(text).width;
  // Use a representative text height roughly matching the font size — the
  // logo is bigger than the text on purpose so the watermark reads as
  // "brand mark + tagline" rather than "icon next to text."
  const textPx = pxFromFont(ctx.font);
  const textCenterY = textTopY + textPx / 2;
  const totalWidth = logoSize + gap + textWidth;
  const startX = (CARD_W - totalWidth) / 2;
  drawLogo(ctx, startX, textCenterY - logoSize / 2, logoSize);
  ctx.fillText(text, startX + logoSize + gap, textTopY);
}

