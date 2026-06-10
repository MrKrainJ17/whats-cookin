import { useEffect, useMemo, useState } from "react";
import { getSuggestions, didYouMean } from "../../lib/ingredientSuggestions.js";

// Live suggestion + did-you-mean strip rendered directly under an
// ingredient input. Used by the Type Ingredients page and the grocery
// list's add modal. Stateless beyond the small debounce window so the
// host owns the input value.
//
// Props:
//   input — current input value (host-owned)
//   onPick(name) — called when the user taps a chip or the "Did you mean" prompt
//   maxSuggestions — defaults to 5
//   debounceMs — defaults to 100ms (per spec)
export default function SuggestionRow({
  input,
  onPick,
  maxSuggestions = 5,
  debounceMs = 100,
}) {
  const [debounced, setDebounced] = useState(input);

  // ~100ms debounce so we don't re-rank on every keystroke. Small enough
  // that the user perceives suggestions as live.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input), debounceMs);
    return () => window.clearTimeout(t);
  }, [input, debounceMs]);

  const trimmed = (debounced || "").trim();
  const suggestions = useMemo(
    () => (trimmed ? getSuggestions(trimmed, maxSuggestions) : []),
    [trimmed, maxSuggestions],
  );
  const dym = useMemo(
    () => (trimmed && suggestions.length === 0 ? null : didYouMean(trimmed)),
    [trimmed, suggestions.length],
  );

  if (!trimmed) return null;
  if (suggestions.length === 0 && !dym) return null;

  return (
    <div className="mt-2">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((sug) => (
            <button
              key={sug.name}
              type="button"
              onClick={() => onPick(sug.name)}
              className="select-chip !py-1 !px-2.5 !text-[14px]"
              aria-label={`Add ${sug.name}`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {sug.emoji}
              </span>
              <span>{sug.name}</span>
            </button>
          ))}
        </div>
      )}
      {dym && (
        <p className="font-script text-base text-mocha/85 leading-snug mt-2">
          Did you mean{" "}
          <button
            type="button"
            onClick={() => onPick(dym.name)}
            className="font-script font-bold text-terracotta underline underline-offset-2"
          >
            {dym.name}
          </button>
          ? Tap to use, or keep typing to add as-is.
        </p>
      )}
    </div>
  );
}
