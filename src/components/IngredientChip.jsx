import { getEmojiForIngredient } from "../lib/ingredientEmojis.js";

// Tag-style chip used across Confirm / Type / Speak ingredient pages.
// Brut treatment: thin ink border, hard 2px shadow, ink-stroke X to remove.
// confidence === "medium" gets a dashed terracotta border so uncertain
// items read visually as "double-check me."
export default function IngredientChip({
  name,
  quantity,
  confidence = "high",
  onRemove,
  showEmoji = true,
}) {
  const uncertain = confidence === "medium";
  const emoji = showEmoji ? getEmojiForIngredient(name) : null;
  return (
    <span className={`brut-chip ${uncertain ? "brut-chip-uncertain" : ""}`}>
      {emoji && (
        <span className="text-base leading-none" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span className="capitalize">{name}</span>
      {quantity && (
        <span className="text-xs text-mocha">· {quantity}</span>
      )}
      {uncertain && (
        <span className="text-terracotta text-sm leading-none" aria-label="uncertain">
          ?
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="ml-0.5 inline-flex items-center justify-center w-4 h-4 text-ink/55 hover:text-ink"
        >
          <InkX />
        </button>
      )}
    </span>
  );
}

function InkX() {
  return (
    <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
      <path
        d="M3 3 L 9 9 M 9 3 L 3 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
