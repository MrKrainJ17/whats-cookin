// Horizontal 5-stop spice slider. Visual representation: as the user
// drags or taps right, the terracotta fill bar grows to cover all
// stops at or below the current position, and the active stop swells
// with a hard ink shadow. The labels below the track show each level's
// emoji + name in the same bold Fraunces used by chip labels.
//
// Stops, in order:
//   0  any     🤷      (default — no preference)
//   1  none    🥛
//   2  mild    🌶️
//   3  medium  🌶️🌶️
//   4  hot     🌶️🌶️🌶️
const STOPS = [
  { value: "any", emoji: "🤷", label: "I'm easy" },
  { value: "none", emoji: "🥛", label: "No spice" },
  { value: "mild", emoji: "🌶️", label: "Mild" },
  { value: "medium", emoji: "🌶️🌶️", label: "Medium" },
  { value: "hot", emoji: "🌶️🌶️🌶️", label: "Bring the heat" },
];

export default function SpiceSlider({ value, onChange }) {
  // -1 means no selection yet — fill bar stays at width 0 and no stop
  // renders the larger/highlighted "active" state.
  const activeIndex = value
    ? STOPS.findIndex((s) => s.value === value)
    : -1;
  const fillWidthPct =
    activeIndex <= 0 ? 0 : (activeIndex / (STOPS.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="relative h-12 flex items-center px-2">
        <div className="spice-track flex-1 relative">
          <div
            className="spice-fill"
            style={{ width: `calc(${fillWidthPct}% + ${fillWidthPct === 0 ? 0 : 4}px)` }}
          />
          {STOPS.map((stop, i) => {
            const leftPct = (i / (STOPS.length - 1)) * 100;
            const isActive = i === activeIndex;
            const isPassed = i < activeIndex;
            return (
              <button
                key={stop.value}
                type="button"
                onClick={() => onChange(stop.value)}
                aria-label={stop.label}
                aria-pressed={isActive}
                style={{ left: `${leftPct}%` }}
                className={`spice-stop ${isActive ? "is-active" : ""} ${isPassed ? "is-passed" : ""}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-0.5">
        {STOPS.map((stop, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={stop.value}
              type="button"
              onClick={() => onChange(stop.value)}
              className="flex flex-col items-center gap-1 px-0.5 leading-tight"
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {stop.emoji}
              </span>
              <span
                className={`font-serif text-[13px] font-semibold text-center leading-tight tracking-[-0.01em] ${
                  isActive ? "text-ink" : "text-ink/70"
                }`}
              >
                {stop.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
