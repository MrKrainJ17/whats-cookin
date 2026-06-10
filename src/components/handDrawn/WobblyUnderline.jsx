// Hand-drawn-ish underline that stretches to fit the parent's width.
// Drop into a `relative` container (typically a section heading) and the
// underline anchors to the bottom.
//
// color — Tailwind color utility for the stroke (e.g. "text-terracotta")
// offsetClass — vertical position (default "-bottom-2")
export default function WobblyUnderline({
  color = "text-ink",
  offsetClass = "-bottom-2",
  height = 10,
}) {
  return (
    <svg
      viewBox="0 0 240 12"
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
      className={`absolute left-0 right-0 ${offsetClass} w-full ${color}`}
      aria-hidden="true"
    >
      <path
        d="M4 6 Q 28 1, 58 5 T 118 5 T 178 6 T 236 5"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
