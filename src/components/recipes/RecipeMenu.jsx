import { useEffect, useRef, useState } from "react";

// 3-dot menu attached to a recipe card or detail header. Stops click
// propagation so it doesn't trigger the parent card's navigation.
export default function RecipeMenu({
  onDontSuggest,
  onShowSimilar,
  onShare,
  size = "sm",
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const stop = (handler) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    handler?.();
  };

  const sizeClass = size === "lg" ? "w-10 h-10 text-2xl" : "w-8 h-8 text-xl";

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Recipe options"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${sizeClass} rounded-full hover:bg-charcoal/10 text-charcoal/60 hover:text-charcoal leading-none flex items-center justify-center`}
      >
        ⋮
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-56 rounded-xl bg-white shadow-xl border border-stone-200 overflow-hidden animate-fadeIn"
        >
          {onDontSuggest && (
            <MenuItem onClick={stop(onDontSuggest)}>
              🚫 Don't suggest this again
            </MenuItem>
          )}
          {onShowSimilar && (
            <MenuItem onClick={stop(onShowSimilar)}>
              🔍 Show similar
            </MenuItem>
          )}
          {onShare && <MenuItem onClick={stop(onShare)}>📤 Share</MenuItem>}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, muted, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-stone-50 ${
        muted ? "text-charcoal/50" : "text-charcoal"
      }`}
    >
      {children}
    </button>
  );
}
