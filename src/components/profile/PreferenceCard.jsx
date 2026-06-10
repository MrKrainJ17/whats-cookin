// One row in the "Your Taste" menu on Profile.
// Layout: emoji icon · category name (bold serif) · current value
// (handwritten Caveat, muted) · right arrow.
// Behavior: tappable like a brut-button.
export default function PreferenceCard({
  icon,
  label,
  value,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="brut-button !py-3.5 !px-4 !gap-3 text-left"
    >
      <span className="text-2xl shrink-0 leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-serif text-[17px] font-bold text-ink leading-tight">
          {label}
        </span>
      </span>
      <span className="font-script text-base text-mocha/85 leading-none text-right shrink-0 max-w-[42%] truncate">
        {value}
      </span>
      <span aria-hidden="true" className="font-serif text-lg text-ink/55 shrink-0 ml-1">
        →
      </span>
    </button>
  );
}
