import { useState } from "react";
import { createPortal } from "react-dom";
import ShareCardPreview from "./ShareCardPreview.jsx";
import ShareIcon from "./ShareIcon.jsx";

// Reusable share entry-point. Renders a button; clicking it opens the
// preview screen as a full-screen modal. Used from RecipeDetail (and
// anywhere else a non-celebration share entry is needed).
//
// The modal is mounted via createPortal to document.body so it escapes
// any stacking context the host page creates (e.g. RecipeDetail wraps
// its content in `relative z-10`, which would otherwise cap the modal
// at that layer and let RecipeDetail's `fixed bottom-0 z-20` sticky
// "Start cooking" CTA bleed through on top of the share buttons).
//
// Props:
//   recipe — Recipe object
//   variant — 'icon' | 'inline'  (visual style)

export default function ShareButton({ recipe, variant = "icon" }) {
  const [open, setOpen] = useState(false);

  const modal = open
    ? createPortal(
        <div className="fixed inset-0 z-[100] bg-cream overflow-y-auto">
          <div className="min-h-full flex flex-col items-center px-5 py-6">
            <div className="w-full max-w-md flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-charcoal/60 hover:text-charcoal text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-charcoal/10 hover:bg-charcoal/15 text-charcoal text-xl flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <ShareCardPreview
              recipe={recipe}
              initialRating={null}
              onShared={() => setOpen(false)}
              onSkip={() => setOpen(false)}
            />
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Share this recipe"
          className="w-10 h-10 rounded-full hover:bg-charcoal/10 text-charcoal flex items-center justify-center"
        >
          <ShareIcon size={22} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-tomato hover:bg-tomato-deep text-white font-semibold px-5 py-2.5 text-sm"
        >
          <ShareIcon size={16} strokeWidth={2.4} />
          <span>Share this cook</span>
        </button>
      )}
      {modal}
    </>
  );
}
