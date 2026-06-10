// Inline SVG of the classic iOS share glyph: an open-topped box with an
// arrow pushing up through it. Stroke uses currentColor so it inherits
// from the surrounding button's text color in both light + dark contexts.

export default function ShareIcon({ size = 22, strokeWidth = 2, className = "", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d="M12 2v13" />
      <path d="m7 7 5-5 5 5" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
    </svg>
  );
}
