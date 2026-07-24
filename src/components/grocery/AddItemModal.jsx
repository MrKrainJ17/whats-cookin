import { useEffect, useRef, useState } from "react";
import SuggestionRow from "../ingredients/SuggestionRow.jsx";

// Bottom-sheet add modal. Stays open after an item is added so the user
// can keep typing — input clears, focus returns. A small "Done" link in
// the header closes the sheet.
export default function AddItemModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [justAdded, setJustAdded] = useState(null);
  // The visible area (viewport minus the on-screen keyboard). The app body is
  // position:fixed, so iOS won't scroll a focused input above the keyboard on
  // its own — instead we size and offset this sheet's container to the exact
  // visible region (visualViewport top + height) so the bottom-anchored sheet
  // lands right above the keyboard.
  const [visible, setVisible] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () =>
      setVisible({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // Close on Escape — small ergonomics win, matches every other modal
  // pattern in the app.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, quantity: quantity.trim() });
    setJustAdded(trimmed);
    setName("");
    setQuantity("");
    // Clear the just-added flash after a beat so it doesn't linger.
    window.setTimeout(() => setJustAdded(null), 1400);
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add grocery item"
      className="fixed left-0 w-full z-50 flex items-start sm:items-center justify-center px-3 sm:px-4"
      style={{
        // Pin to the TOP of the visible area. A fixed top-anchored sheet always
        // sits above the keyboard (which opens at the bottom), so the input is
        // never covered — no reliance on iOS scrolling a focused field up.
        top: visible ? `${visible.top}px` : 0,
        height: visible ? `${visible.height}px` : "100dvh",
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-md max-h-full overflow-y-auto brut-card p-5 rounded-2xl mt-3 sm:mt-0 animate-slideUp">
        <header className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl font-extrabold text-ink leading-none">
            Add to list
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="font-script text-lg text-mocha/85 hover:text-ink leading-none"
          >
            Done
          </button>
        </header>

        <label className="block font-serif font-semibold text-[15px] text-ink mb-1.5">
          Item
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="e.g. avocados, paper towels, dish soap…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          className="ink-input"
        />

        <SuggestionRow input={name} onPick={(suggested) => setName(suggested)} />

        <label className="block font-serif font-semibold text-[15px] text-ink mt-4 mb-1.5">
          Quantity <span className="font-body text-xs text-mocha">(optional)</span>
        </label>
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder='"2 lbs", "a dozen", "1 pack"'
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          className="ink-input"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim()}
          className="brut-button mt-5 justify-center"
        >
          <span className="font-serif text-lg font-bold">Add to list</span>
        </button>

        {justAdded && (
          <p
            aria-live="polite"
            className="mt-3 font-script text-base text-sage leading-none text-center"
          >
            added "{justAdded}" — keep going
          </p>
        )}
      </div>
    </div>
  );
}
