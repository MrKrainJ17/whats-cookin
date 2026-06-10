import { useState } from "react";

// Multi-select chip used for allergies and cuisines. Pops on toggle.
export default function SelectableChip({
  icon,
  label,
  selected,
  onToggle,
  removable = false,
  onRemove,
}) {
  const [popping, setPopping] = useState(false);

  const handle = () => {
    setPopping(true);
    onToggle?.();
    window.setTimeout(() => setPopping(false), 160);
  };

  return (
    <button
      type="button"
      onClick={removable ? onRemove : handle}
      aria-pressed={selected}
      className={`select-chip ${selected ? "is-selected" : ""} ${popping ? "selection-pop" : ""}`}
    >
      {icon && (
        <span aria-hidden="true" className="text-base leading-none">
          {icon}
        </span>
      )}
      <span>{label}</span>
      {removable && (
        <span aria-hidden="true" className="ml-1 text-base leading-none">
          ×
        </span>
      )}
    </button>
  );
}
