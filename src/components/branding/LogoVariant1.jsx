// Variation 1 — Minimal & Confident
// Single warm-brown stroke. Three wobbly steam squiggles, pot with two
// ear-loop handles, slightly arched rim. No fill — reads as a quick
// pen sketch.
export default function LogoVariant1({ size = 64, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="#2B2118"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Steam squiggles — each curls slightly differently */}
        <path d="M 36 47 C 31 41, 40 36, 35 30 C 30 24, 41 18, 36 11" />
        <path d="M 50 45 C 55 39, 45 33, 51 26 C 56 19, 45 13, 51 5" />
        <path d="M 64 47 C 69 41, 60 36, 65 30 C 70 24, 60 19, 65 12" />

        {/* Pot rim — wobbly horizontal lip */}
        <path d="M 16 50 Q 50 47, 84 50" />

        {/* Left handle (slightly tighter than right for hand-drawn asymmetry) */}
        <path d="M 22 56 C 12 57, 11 71, 23 72" />

        {/* Right handle (intentionally not a perfect mirror) */}
        <path d="M 78 56 C 89 57, 90 70, 77 73" />

        {/* Pot body — sides curve out + flatter bottom */}
        <path d="M 20 50 C 19 66, 22 82, 24 86 C 32 89, 68 89, 76 86 C 79 82, 81 66, 80 50" />
      </g>
    </svg>
  );
}
