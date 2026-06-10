import { useState } from "react";
import { getEmojiForIngredient } from "../../lib/ingredientEmojis.js";

// One row in the grocery list. Checkbox on the left, name + quantity in
// the middle, small dismiss "×" on the right (revealed on hover, always
// visible on touch via the swipe-on-mobile approach being too heavy for
// v1 — keep it a tap target instead).
export default function GroceryItem({ item, onToggle, onRemove }) {
  const [pressed, setPressed] = useState(false);

  const handleToggle = () => {
    setPressed(true);
    onToggle(item.id);
    // Lightweight haptic on supported devices.
    try {
      if (navigator.vibrate) navigator.vibrate(8);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setPressed(false), 180);
  };

  const quantityText = item.quantity || "";
  const x2 = item.mergeCount > 1 ? `x${item.mergeCount}` : "";
  const emoji = getEmojiForIngredient(item.name);

  return (
    <li className="grocery-item-enter">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-ink/[0.025]">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={handleToggle}
            className={`ink-checkbox ${pressed ? "selection-pop" : ""}`}
            aria-label={`Toggle ${item.name}`}
          />
        </label>
        <span
          className={`text-base leading-none shrink-0 ${item.checked ? "opacity-60" : ""}`}
          aria-hidden="true"
        >
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`font-body text-base leading-snug ${
              item.checked ? "text-mocha/70 line-through" : "text-ink"
            }`}
          >
            <span className="capitalize">{item.name}</span>
            {x2 && (
              <span className="ml-2 font-serif text-sm font-bold text-terracotta">
                {x2}
              </span>
            )}
          </p>
          {quantityText && (
            <p
              className={`font-body text-xs leading-snug mt-0.5 ${
                item.checked ? "text-mocha/55" : "text-mocha"
              }`}
            >
              {quantityText}
              {item.sourceRecipeName && (
                <span className="ml-1 text-mocha/70">
                  · from {item.sourceRecipeName}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          className="text-ink/40 hover:text-terracotta w-7 h-7 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </li>
  );
}
