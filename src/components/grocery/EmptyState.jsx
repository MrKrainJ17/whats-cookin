// Empty grocery list illustration + copy.
export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-6 py-12">
      <PaperListSketch />
      <h2 className="font-serif text-3xl font-extrabold text-ink leading-tight">
        Nothing on your list yet
      </h2>
      <p className="font-script text-xl text-mocha leading-snug max-w-xs">
        tap recipes to add ingredients, or add manually below
      </p>
    </div>
  );
}

function PaperListSketch() {
  return (
    <svg
      viewBox="0 0 80 100"
      className="w-24 h-32 text-ink/55"
      aria-hidden="true"
    >
      {/* paper sheet outline with slight wobble */}
      <path
        d="M12 8 Q 11 6, 14 6 L 64 6 Q 68 6, 68 10 L 68 92 Q 68 96, 64 96 L 14 96 Q 11 96, 11 93 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="#fcf6e8"
        strokeLinejoin="round"
      />
      {/* fold corner */}
      <path
        d="M58 6 L 68 18 L 58 18 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="#f3e9d4"
        strokeLinejoin="round"
      />
      {/* checkbox + line rows */}
      {[28, 42, 56, 70, 84].map((y, i) => (
        <g key={y}>
          <rect
            x="18"
            y={y - 5}
            width="9"
            height="9"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            rx="1"
          />
          <path
            d={`M32 ${y} Q 45 ${y - 1}, ${60 - i * 4} ${y}`}
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            opacity={1 - i * 0.12}
          />
        </g>
      ))}
    </svg>
  );
}
