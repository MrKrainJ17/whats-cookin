import { useState } from "react";

// Big tappable answer card used for diet, skill, and time questions.
// Pops on click via the `selection-pop` keyframe; the parent owns the
// selected state and re-renders with `selected` set.
export default function SelectableCard({
  icon,
  title,
  subtitle,
  selected,
  onSelect,
}) {
  const [popping, setPopping] = useState(false);

  const handle = () => {
    setPopping(true);
    onSelect();
    window.setTimeout(() => setPopping(false), 160);
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={selected}
      className={`select-card ${selected ? "is-selected" : ""} ${popping ? "selection-pop" : ""}`}
    >
      <span className="text-3xl shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="font-serif text-lg font-bold text-ink leading-tight">
          {title}
        </span>
        {subtitle && (
          <span className="font-body text-sm text-mocha mt-0.5 leading-snug">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}
