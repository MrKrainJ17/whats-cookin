import { useNavigate } from "react-router-dom";
import PageShell from "../PageShell.jsx";
import PaperBackdrop from "../handDrawn/PaperBackdrop.jsx";

// Shared layout for every auth page: paper backdrop, back link in the
// top-left, content centered in a comfortable column. The back link
// defaults to history-back; pass `back` for an explicit destination.
export default function AuthShell({
  back = -1,
  backLabel = "Back",
  hideBack = false,
  children,
}) {
  const navigate = useNavigate();
  return (
    <>
      <PaperBackdrop />
      <PageShell fitToViewport>
        <div className="relative z-10 flex flex-col flex-1">
          {!hideBack && (
            <button
              type="button"
              onClick={() => navigate(back)}
              className="self-start font-body text-sm text-mocha hover:text-ink mb-3"
            >
              ← {backLabel}
            </button>
          )}
          {children}
        </div>
      </PageShell>
    </>
  );
}
