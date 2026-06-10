// Variation 4 — Pot with Bubbling Contents
// V1's brown pot outline + three small terracotta bubbles peeking above
// the rim (something's boiling) + two steam squiggles rising past them.
// A little more playful than the other three; the bubbles do most of
// the storytelling so we drop from three steam wisps to two.
export default function LogoVariant4({ size = 64, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Pot — warm brown outline */}
      <g
        stroke="#2B2118"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 16 50 Q 50 47, 84 50" />
        <path d="M 22 56 C 12 57, 11 71, 23 72" />
        <path d="M 78 56 C 89 57, 90 70, 77 73" />
        <path d="M 20 50 C 19 66, 22 82, 24 86 C 32 89, 68 89, 76 86 C 79 82, 81 66, 80 50" />
      </g>

      {/* Bubbles — slightly oval, each different size for character */}
      <ellipse cx="36" cy="44" rx="4" ry="3.2" fill="#D2691E" />
      <ellipse cx="50" cy="41" rx="3" ry="2.4" fill="#D2691E" />
      <ellipse cx="63" cy="44.5" rx="3.7" ry="3" fill="#D2691E" />

      {/* Steam — two squiggles rising above the bubbles */}
      <g
        stroke="#D2691E"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 40 32 C 35 26, 45 22, 40 16 C 36 11, 43 8, 40 3" />
        <path d="M 60 33 C 65 27, 56 22, 61 16 C 65 11, 58 8, 61 4" />
      </g>
    </svg>
  );
}
