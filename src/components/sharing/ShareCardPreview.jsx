import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TemplateSwitcher from "./TemplateSwitcher.jsx";
import ShareIcon from "./ShareIcon.jsx";
import {
  generateShareCard,
  ensureFontsLoaded,
  shareCardBlob,
  downloadCardBlob,
  copyCardBlobToClipboard,
  getDefaultTemplate,
  rememberTemplate,
} from "../../lib/shareCard.js";
import { logEvent } from "../../lib/eventTracker.js";
import { formatTag, getRecentTags, pushRecentTags } from "../../lib/tags.js";

const REGEN_DEBOUNCE_MS = 120;

// Preview screen for the share-card flow. Renders the generated card at
// preview size (~360px wide), with template switcher, rating + tags + note
// inputs, and Share / Skip CTAs. Web Share API Level 2 with file sharing,
// download/copy fallback for unsupported browsers.
//
// Props:
//   recipe — Recipe object
//   initialRating — 'loved' | 'fine' | 'never_again' | null
//   onShared — called after a successful share (or download/copy). Receives
//              { template, rating, tags, note, method } so the caller can
//              log "I made this" with the final state.
//   onSkip   — called when the user dismisses without sharing. Receives the
//              same shape minus the share-specific fields.
export default function ShareCardPreview({
  recipe,
  initialRating = null,
  onShared,
  onSkip,
}) {
  const [template, setTemplate] = useState(getDefaultTemplate());
  const [rating, setRating] = useState(initialRating);
  const [note, setNote] = useState("");
  const noteRef = useRef(null);

  // Auto-expand the note textarea to fit its content so text never gets
  // clipped — reset to auto first to allow it to shrink when text is removed.
  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note]);
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState("");
  const [recentTags] = useState(() => getRecentTags());
  const [previewUrl, setPreviewUrl] = useState(null);
  const [completedKey, setCompletedKey] = useState(null);
  const [shareState, setShareState] = useState(null); // 'sharing' | 'fallback' | 'shared' | 'error' | null
  const [fallbackMessage, setFallbackMessage] = useState(null);
  const blobRef = useRef(null);
  const lastUrlRef = useRef(null);

  // Anything that affects what gets drawn on the card.
  const userOptions = useMemo(
    () => ({ rating, note: note.trim(), tags }),
    [rating, note, tags],
  );

  // Key-mismatch derives `generating` without a synchronous setState-in-effect.
  const requestKey = `${template}|${rating ?? ""}|${userOptions.note}|${tags.join(",")}`;
  const generating = requestKey !== completedKey;

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Regenerate the preview on any input change. Debounced so rapid template
  // switching or tag typing doesn't stack render jobs.
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const blob = await generateShareCard(recipe, template, userOptions);
        if (cancelled) return;
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = url;
        setPreviewUrl(url);
        setCompletedKey(requestKey);
      } catch (err) {
        console.error("[shareCard] preview generation failed:", err);
      }
    }, REGEN_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [recipe, template, userOptions, requestKey]);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, []);

  const onTemplateChange = useCallback((id) => {
    setTemplate(id);
    rememberTemplate(id);
  }, []);

  // ── Tag entry ───────────────────────────────────────────────────────────
  const commitTagDraft = useCallback(() => {
    const formatted = formatTag(tagDraft);
    if (!formatted) {
      setTagDraft("");
      return;
    }
    setTags((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
    setTagDraft("");
  }, [tagDraft]);

  const onTagKeyDown = (e) => {
    if (
      (e.key === "Enter" || e.key === "," || e.key === "@") &&
      tagDraft.trim().length > 0
    ) {
      e.preventDefault();
      commitTagDraft();
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      // Friendly: backspace on empty removes the last chip.
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const applySuggestion = (t) => {
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };

  // ── Share lifecycle ─────────────────────────────────────────────────────
  const stateForCaller = (extra = {}) => ({
    template,
    rating,
    tags,
    note: note.trim(),
    ...extra,
  });

  const handleShare = async () => {
    if (!blobRef.current) return;
    setShareState("sharing");
    const result = await shareCardBlob(blobRef.current, recipe, { tags });
    if (result.kind === "shared") {
      pushRecentTags(tags);
      logEvent("recipe_shared", {
        recipeId: recipe.id,
        recipeData: { name: recipe.name, cuisine: recipe.cuisine },
        metadata: { template, tagCount: tags.length },
      });
      setShareState("shared");
      onShared?.(stateForCaller({ method: "native" }));
      return;
    }
    if (result.kind === "cancelled") {
      setShareState(null);
      return;
    }
    setShareState("fallback");
    setFallbackMessage(
      result.kind === "unsupported"
        ? "Your browser can't open a share sheet. Save the image or copy it instead, then upload to Instagram/Snap manually."
        : "Couldn't open share sheet. Save the image or copy it instead.",
    );
  };

  const handleDownload = () => {
    if (!blobRef.current) return;
    downloadCardBlob(blobRef.current, recipe);
    pushRecentTags(tags);
    logEvent("recipe_shared", {
      recipeId: recipe.id,
      recipeData: { name: recipe.name, cuisine: recipe.cuisine },
      metadata: { template, method: "download", tagCount: tags.length },
    });
    onShared?.(stateForCaller({ method: "download" }));
  };

  const handleCopy = async () => {
    if (!blobRef.current) return;
    const ok = await copyCardBlobToClipboard(blobRef.current);
    if (ok) {
      pushRecentTags(tags);
      logEvent("recipe_shared", {
        recipeId: recipe.id,
        recipeData: { name: recipe.name, cuisine: recipe.cuisine },
        metadata: { template, method: "clipboard", tagCount: tags.length },
      });
      onShared?.(stateForCaller({ method: "clipboard" }));
    } else {
      setFallbackMessage("Couldn't copy to clipboard. Try saving the image.");
    }
  };

  const handleSkip = () => {
    // Tags entered but not shared still get remembered — the user "tagged"
    // their dinner crew even if they didn't post.
    pushRecentTags(tags);
    onSkip?.(stateForCaller({ shared: false }));
  };

  // Suggestion list: recent tags not yet in the current list. Surface up to
  // 6 — keeps the row from overflowing on phone widths.
  const suggestions = recentTags
    .filter((t) => !tags.includes(t))
    .slice(0, 6);

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-bold text-charcoal mb-1">
        Share your cook?
      </h2>
      <p className="text-sm text-charcoal/60 mb-4">
        Pick a style. Tag your crew. Add a rating or note if you want.
      </p>

      {/* Image section — flex-shrink-0 so the note textarea below can
       * never grow upward into the image. */}
      <div className="relative flex-shrink-0">
        <div className="w-[260px] sm:w-[300px] aspect-[9/16] rounded-2xl bg-white shadow-xl overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Share card preview"
              className={`w-full h-full object-cover transition-opacity ${
                generating ? "opacity-60" : "opacity-100"
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal/40 text-sm">
              Building preview…
            </div>
          )}
        </div>
        {generating && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-charcoal/80 text-white text-[10px] font-semibold">
            Rendering…
          </div>
        )}
      </div>

      <TemplateSwitcher value={template} onChange={onTemplateChange} />

      {/* Inputs section — explicit mt-5 enforces ≥20px gap between the
       * image group above and the first field per the spec, even on
       * small viewports. */}
      <div className="mt-5 w-full max-w-sm flex flex-col gap-4">
        <RatingSelector value={rating} onChange={setRating} />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60 mb-1.5">
            Eating with?
          </label>
          <input
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={() => {
              if (tagDraft.trim().length > 0) commitTagDraft();
            }}
            placeholder="Tag your dinner crew…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            className="w-full rounded-full bg-white border border-charcoal/15 px-4 py-2.5 text-sm focus:outline-none focus:border-tomato"
          />
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <TagChip key={t} label={t} onRemove={() => removeTag(t)} />
              ))}
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wide text-charcoal/40 mb-1">
                Recent
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="rounded-full bg-charcoal/5 hover:bg-charcoal/10 text-charcoal/70 px-2.5 py-1 text-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60 mb-1.5">
            Add a note (optional)
          </label>
          <textarea
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 80))}
            placeholder="Made it for date night…"
            rows={2}
            // Text wraps and stays centered; the field grows downward as
            // the user types (auto-expand effect below) and never scrolls
            // sideways or cuts text off.
            className="block rounded-2xl bg-white border border-charcoal/15 text-sm focus:outline-none focus:border-tomato"
            style={{
              whiteSpace: "normal",
              textAlign: "center",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 20px",
              resize: "none",
            }}
          />
          <p className="text-[10px] text-charcoal/40 mt-1 text-right">
            {note.length}/80
          </p>
        </div>
      </div>

      {shareState !== "fallback" ? (
        <div className="mt-5 w-full max-w-sm flex flex-col gap-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={generating || shareState === "sharing"}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-tomato hover:bg-tomato-deep disabled:bg-tomato/50 text-white font-bold text-lg py-4 shadow-lg active:scale-[0.98] transition"
          >
            <ShareIcon size={20} strokeWidth={2.4} />
            <span>{shareState === "sharing" ? "Opening…" : "Share"}</span>
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-charcoal/60 hover:text-charcoal text-sm font-medium py-2"
          >
            Skip
          </button>
        </div>
      ) : (
        <div className="mt-5 w-full max-w-sm flex flex-col gap-2">
          {fallbackMessage && (
            <p className="text-sm text-charcoal/70 text-center mb-1">
              {fallbackMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={generating}
            className="w-full rounded-full bg-tomato hover:bg-tomato-deep text-white font-bold py-3"
          >
            Save image
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={generating}
            className="w-full rounded-full bg-white border border-charcoal/20 hover:border-charcoal/40 text-charcoal font-bold py-3"
          >
            Copy to clipboard
          </button>
          <p className="text-xs text-charcoal/50 text-center mt-1">
            Save the image, then upload to Instagram/Snap manually.
          </p>
          <button
            type="button"
            onClick={handleSkip}
            className="text-charcoal/60 hover:text-charcoal text-sm font-medium py-2"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}

function TagChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-700 px-2.5 py-1 text-xs font-semibold">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full text-sky-700/60 hover:text-sky-900 w-4 h-4 inline-flex items-center justify-center text-sm leading-none"
      >
        ×
      </button>
    </span>
  );
}

function RatingSelector({ value, onChange }) {
  // Five-level rating per the redesign spec. The same id strings drive
  // the icon/label that lands inside every share-card template.
  const options = [
    { id: "loved", emoji: "⭐", label: "New favorite" },
    { id: "really_good", emoji: "😋", label: "Really good" },
    { id: "solid", emoji: "👍", label: "Pretty solid" },
    { id: "okay", emoji: "🤷", label: "It was okay" },
    { id: "again", emoji: "🔁", label: "Would make again" },
  ];
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60 mb-1.5">
        Rate this dish
      </label>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(active ? null : o.id)}
              aria-pressed={active}
              className={`rounded-xl px-1 py-1.5 text-[10px] font-semibold transition border leading-tight ${
                active
                  ? "bg-tomato/10 border-tomato text-tomato-deep"
                  : "bg-white border-charcoal/15 text-charcoal/70 hover:border-charcoal/30"
              }`}
            >
              <span className="block text-base">{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
