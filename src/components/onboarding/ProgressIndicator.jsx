// Dot-row progress indicator. `current` is 1-indexed.
export default function ProgressIndicator({ current, total }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const klass =
          idx < current
            ? "progress-dot is-done"
            : idx === current
              ? "progress-dot is-active"
              : "progress-dot";
        return <span key={idx} className={klass} aria-hidden="true" />;
      })}
    </div>
  );
}
