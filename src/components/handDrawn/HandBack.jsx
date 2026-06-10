// Handwritten "back" link with a small ink-stroke arrow. Used across the
// three input mode screens (Take a Photo / Type / Speak) so their headers
// feel like siblings.
export default function HandBack({ onClick, label = "back", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 font-script text-base text-mocha hover:text-ink leading-none ${className}`}
    >
      <svg
        viewBox="0 0 22 12"
        className="w-5 h-3"
        aria-hidden="true"
      >
        <path
          d="M 20 6 Q 10 5, 2 6"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 7 2 L 2 6 L 7 10"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
