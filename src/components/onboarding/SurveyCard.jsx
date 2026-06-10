import ProgressIndicator from "./ProgressIndicator.jsx";

// Shared layout for every onboarding step:
// - top: progress dots + Skip link
// - middle: scrollable body (children)
// - bottom: Back link + Next/Continue button
//
// Slide direction is forwarded from the parent so the page re-mounts with
// the correct directional animation when stepping forward/back.
export default function SurveyCard({
  step,
  totalSteps,
  direction = "forward",
  onSkip,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  disabledHint = "pick at least one to continue",
  hideProgress = false,
  hideSkip = false,
  hideBack = false,
  hideNext = false,
  skipPrompt = "Skip",
  children,
}) {
  const animClass =
    direction === "back" ? "survey-slide-back" : "survey-slide-forward";

  return (
    <div className={`flex flex-col flex-1 ${animClass}`}>
      <div className="flex items-center justify-between min-h-[24px]">
        {hideProgress ? (
          <span />
        ) : (
          <ProgressIndicator current={step} total={totalSteps} />
        )}
        {hideSkip ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={onSkip}
            className="font-script text-lg text-mocha/80 hover:text-ink leading-none"
          >
            {skipPrompt}
          </button>
        )}
      </div>

      <div className="flex-1 mt-6 flex flex-col">{children}</div>

      <div className="mt-6 flex flex-col items-end gap-1.5">
        <div className="w-full flex items-center gap-3">
          {hideBack ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="font-body text-sm text-mocha hover:text-ink"
            >
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {!hideNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="brut-button !w-auto !py-3 !px-5 justify-center gap-2"
            >
              <span className="font-serif text-lg font-bold">{nextLabel}</span>
              <HandArrow />
            </button>
          )}
        </div>
        {!hideNext && nextDisabled && disabledHint && (
          <p
            aria-live="polite"
            className="font-script text-base text-mocha/80 leading-none"
          >
            {disabledHint}
          </p>
        )}
      </div>
    </div>
  );
}

function HandArrow() {
  return (
    <svg viewBox="0 0 28 16" className="w-6 h-4" aria-hidden="true">
      <path
        d="M1 8 Q 12 6, 24 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M19 3 L 26 8 L 19 13"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
