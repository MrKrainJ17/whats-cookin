// Big circular-ring countdown for the current step's timer.
// Controlled — all state lives in CookingMode; we just render + dispatch.

const RING_RADIUS = 64;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export default function StepTimer({
  timer, // { totalSeconds, remaining, running, finished, acknowledged } | null
  totalMinutes,
  onStart,
  onPause,
  onResume,
  onReset,
  onAdvance,
  onStopAlarm,
  isLastStep,
}) {
  const total = timer?.totalSeconds ?? totalMinutes * 60;
  const remaining = timer ? timer.remaining : total;
  const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const dashOffset = RING_CIRC * (1 - fraction);

  const ringingDown = timer?.finished && !timer?.acknowledged;
  const stateLabel = !timer
    ? "ready"
    : timer.finished
    ? "done"
    : timer.running
    ? "running"
    : "paused";

  return (
    <div
      className={`mt-6 mx-auto w-full max-w-sm rounded-3xl p-5 shadow-md transition
        ${
          ringingDown
            ? "bg-emerald-50 ring-2 ring-emerald-400 animate-pulse"
            : "bg-stone-50 border border-stone-200"
        }`}
    >
      <div className="flex items-center justify-center gap-2 text-stone-600 text-sm font-medium">
        <span aria-hidden="true">⏱️</span>
        <span>
          Timer · {totalMinutes} min
          {timer?.running && " · running"}
          {timer?.finished && " · time's up"}
        </span>
      </div>

      <div className="my-4 flex items-center justify-center">
        <div className="relative w-44 h-44">
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 160 160"
            aria-hidden="true"
          >
            <circle
              cx="80"
              cy="80"
              r={RING_RADIUS}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="10"
            />
            <circle
              cx="80"
              cy="80"
              r={RING_RADIUS}
              fill="none"
              stroke={timer?.finished ? "#10b981" : "#ff5a3c"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums text-stone-900 text-4xl"
            aria-live="polite"
            aria-atomic="true"
          >
            {timer?.finished ? "0:00" : formatTime(remaining)}
          </div>
        </div>
      </div>

      {ringingDown ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-emerald-700 font-semibold text-lg">Time's up!</p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onAdvance}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5"
            >
              {isLastStep ? "Finish 🎉" : "Next step →"}
            </button>
            <button
              type="button"
              onClick={onStopAlarm}
              className="rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-5 py-2.5"
            >
              Stop alarm
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          {stateLabel === "ready" && (
            <button
              type="button"
              onClick={onStart}
              className="rounded-full bg-tomato hover:bg-tomato-deep text-white font-semibold px-6 py-2.5"
            >
              Start timer
            </button>
          )}
          {stateLabel === "running" && (
            <>
              <button
                type="button"
                onClick={onPause}
                className="rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-5 py-2.5"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-5 py-2.5"
              >
                Reset
              </button>
            </>
          )}
          {stateLabel === "paused" && (
            <>
              <button
                type="button"
                onClick={onResume}
                className="rounded-full bg-tomato hover:bg-tomato-deep text-white font-semibold px-5 py-2.5"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-5 py-2.5"
              >
                Reset
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(sec) {
  const safe = Math.max(0, sec);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
