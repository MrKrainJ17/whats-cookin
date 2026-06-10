// Small uppercase letter-spaced label used as a corner tag on each recipe
// card. Single color (ink for default, terracotta for the wildcard slot)
// with a tiny ink-stroke underline beneath. Replaces the previous
// color-coded pill style — this reads as a hand-set headline rather than
// a UI chip.

const LABELS = {
  fastest:    "Fastest",
  healthiest: "Healthiest",
  popular:    "Popular",
  creative:   "Creative",
  hearty:     "Hearty",
  wildcard:   "Try something new",
};

export default function CategoryBadge({ category }) {
  const label = LABELS[category] ?? category;
  const isWild = category === "wildcard";
  const color = isWild ? "text-terracotta" : "text-ink";
  return (
    <span className={`relative inline-block ${color}`}>
      <span className="font-body text-[10px] font-bold uppercase tracking-[0.15em] leading-none">
        {label}
      </span>
      <svg
        className="absolute left-0 right-0 -bottom-1 w-full h-1 opacity-70"
        viewBox="0 0 60 4"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M1 2 Q 15 1, 30 2 T 59 2"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
