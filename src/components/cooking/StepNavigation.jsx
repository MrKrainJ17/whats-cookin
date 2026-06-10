export default function StepNavigation({
  currentStep, // 0-indexed
  totalSteps,
  onPrev,
  onNext,
}) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="w-full px-4 pb-5 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1 rounded-2xl bg-white border-2 border-stone-200 hover:border-stone-300 disabled:opacity-30 disabled:hover:border-stone-200 text-stone-800 font-bold text-lg py-5 active:scale-[0.98] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-tomato/40"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-2xl bg-tomato hover:bg-tomato-deep text-white font-bold text-lg py-5 shadow-lg active:scale-[0.98] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-tomato/40"
        >
          {isLast ? "Done! 🎉" : "Next →"}
        </button>
      </div>
      <div
        className="mt-4 h-1.5 w-full rounded-full bg-stone-200 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep + 1}
        aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
      >
        <div
          className="h-full bg-tomato transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
