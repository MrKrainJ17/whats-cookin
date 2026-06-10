// A small line-art whisk that gently stirs side-to-side. Replaces the
// generic spinner on loading screens. Animation lives in index.css
// (`.whisk-stirring`).
export default function WhiskLoader({ size = 64, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={`text-ink whisk-stirring ${className}`}
      aria-hidden="true"
    >
      {/* Handle cap */}
      <line
        x1="32"
        y1="8"
        x2="48"
        y2="8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Handle */}
      <line
        x1="40"
        y1="8"
        x2="40"
        y2="34"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Whisk wires curving down */}
      <path
        d="M40 34 Q 22 42, 28 64"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 34 Q 40 50, 40 66"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 34 Q 58 42, 52 64"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bottom curve closing the whisk bulb */}
      <path
        d="M28 64 Q 40 70, 52 64"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
