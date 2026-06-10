import { useEffect } from "react";

// One-shot toast shown after ingredients are added to the grocery list
// from a recipe. Auto-dismisses ~2.6s later (matches the toast-in /
// toast-out CSS keyframes). Includes a "View list →" action that
// nudges the user to check their growing list.
export default function AddedToast({
  addedCount,
  mergedCount = 0,
  onView,
  onClose,
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 2900);
    return () => window.clearTimeout(t);
  }, [onClose]);

  const total = addedCount + mergedCount;
  // Body copy adapts to whether anything was new vs. all merged.
  const message =
    addedCount === 0
      ? `Updated ${mergedCount} item${mergedCount === 1 ? "" : "s"} on your list`
      : `Added ${addedCount} ingredient${addedCount === 1 ? "" : "s"} to your list`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="grocery-toast fixed z-[60] bottom-24 left-1/2 max-w-[92vw] w-[360px]"
      style={{ transform: "translateX(-50%)" }}
    >
      <div className="brut-card px-4 py-3 flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-sage text-paper-warm flex items-center justify-center text-base shrink-0" aria-hidden="true">
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink leading-snug">
            {message} <span aria-hidden="true">🛒</span>
          </p>
          {mergedCount > 0 && addedCount > 0 && (
            <p className="font-body text-xs text-mocha mt-0.5">
              ({mergedCount} merged with existing)
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onView}
          className="font-serif font-bold text-terracotta text-sm leading-none shrink-0 underline underline-offset-2"
        >
          View list →
        </button>
      </div>
      <p className="sr-only">{total} item updates</p>
    </div>
  );
}
