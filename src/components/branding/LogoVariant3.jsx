// Variation 3 — Filled Pot, Outlined Steam
// Pot body is a closed shape filled with cream (#F8F1E4) and outlined in
// warm brown. Steam stays terracotta. The fill gives the pot a touch
// more visual weight so it reads as a real object, not just lines.
export default function LogoVariant3({ size = 64, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Pot — closed shape: rim → right side → bottom → left side. */}
      <path
        d="M 16 50 Q 50 47, 84 50 C 81 66, 79 82, 76 86 C 68 89, 32 89, 24 86 C 21 82, 19 66, 16 50 Z"
        fill="#F8F1E4"
        stroke="#2B2118"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Handles — drawn on top so they overlap the pot edge cleanly. */}
      <g
        stroke="#2B2118"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 22 56 C 12 57, 11 71, 23 72" />
        <path d="M 78 56 C 89 57, 90 70, 77 73" />
      </g>

      {/* Steam — terracotta strokes */}
      <g
        stroke="#D2691E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 36 47 C 31 41, 40 36, 35 30 C 30 24, 41 18, 36 11" />
        <path d="M 50 45 C 55 39, 45 33, 51 26 C 56 19, 45 13, 51 5" />
        <path d="M 64 47 C 69 41, 60 36, 65 30 C 70 24, 60 19, 65 12" />
      </g>
    </svg>
  );
}
