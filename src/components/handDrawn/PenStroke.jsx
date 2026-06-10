// Small wobbly horizontal pen-stroke. Used as a confident flourish
// between major sections without being a structural rule.
//
// width — pixel width of the stroke (default 128)
// className — extra utility classes (margin, color override, etc.)
export default function PenStroke({ width = 128, className = "" }) {
  return (
    <svg
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      style={{ width: `${width}px`, height: "8px" }}
      className={`mx-auto block text-ink/35 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M3 4 Q 25 1, 50 4 T 100 4 T 150 4 T 197 4"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
