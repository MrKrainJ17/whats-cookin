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
    // Full-height column: header pinned top, options in the middle (internally
    // scrollable if they overflow), Next button pinned to the bottom — always
    // visible without scrolling the page. `min-h-0` lets the middle shrink so
    // the button never gets pushed below the fold.
    <div className={`flex flex-col flex-1 min-h-0 ${animClass}`}>
      <div className="shrink-0 flex items-center justify-between min-h-[24px]">
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

      {/* Middle: options scroll here if too tall. The -mx-2/px-2 gutter gives
          the cards' hard offset shadows room so the scroll box can't clip them. */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain mt-6 -mx-2 px-2 flex flex-col">
        {children}
      </div>

      <div className="shrink-0 mt-6 pb-5 flex flex-col items-end gap-1.5">
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
