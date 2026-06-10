export default function AllStepsSheet({
  steps,
  currentStep,
  onJump,
  onClose,
}) {
  return (
    <Sheet onClose={onClose} title="All steps">
      <ol className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const isCurrent = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <li key={s.step}>
              <button
                type="button"
                onClick={() => onJump(i)}
                className={`w-full flex items-start gap-3 text-left rounded-xl px-3 py-3 transition
                  ${
                    isCurrent
                      ? "bg-tomato/10 border-2 border-tomato"
                      : "bg-stone-50 hover:bg-stone-100 border-2 border-transparent"
                  }`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                    ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-tomato text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                >
                  {isCompleted ? "✓" : s.step}
                </span>
                <span
                  className={`flex-1 ${
                    isCompleted
                      ? "text-stone-500"
                      : "text-stone-900"
                  }`}
                >
                  {s.instruction}
                  {s.timerMinutes != null && (
                    <span className="block text-xs text-stone-500 mt-0.5">
                      ⏱ {s.timerMinutes} min
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full sm:max-w-lg max-h-[80vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slideUp">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="font-bold text-lg text-stone-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xl leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
