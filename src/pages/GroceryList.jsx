import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import PenStroke from "../components/handDrawn/PenStroke.jsx";
import EmptyState from "../components/grocery/EmptyState.jsx";
import CategoryGroup from "../components/grocery/CategoryGroup.jsx";
import AddItemModal from "../components/grocery/AddItemModal.jsx";
import {
  addItem,
  clearAll,
  clearChecked,
  formatForShare,
  groupByCategory,
  loadList,
  notify,
  removeItem,
  shouldShowFirstPopulatedNote,
  subscribe,
  toggleChecked,
} from "../lib/groceryList.js";

export default function GroceryList() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => loadList());
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);
  const [shareText, setShareText] = useState(null);
  // Lazy init so we only consult the "already shown once" flag a single
  // time, on mount. Side effect (the localStorage write) happens during
  // initialization rather than in a useEffect.
  const [happyNote, setHappyNote] = useState(() => shouldShowFirstPopulatedNote());

  // Re-read from storage whenever another component (recipe detail, quick
  // add on results) writes to the list.
  useEffect(() => {
    const unsub = subscribe(() => setState(loadList()));
    return () => unsub();
  }, []);

  // Auto-clear the one-time "happy shopping" flourish after a moment.
  useEffect(() => {
    if (!happyNote) return undefined;
    const t = window.setTimeout(() => setHappyNote(false), 4500);
    return () => window.clearTimeout(t);
  }, [happyNote]);

  const allItems = state.items;
  const totalCount = allItems.length;
  const checkedCount = allItems.filter((i) => i.checked).length;

  const visibleItems = hideChecked
    ? allItems.filter((i) => !i.checked)
    : allItems;
  const groups = groupByCategory(visibleItems);

  const handleAdd = ({ name, quantity }) => {
    const result = addItem({ name, quantity, source: "manual" });
    setState(result.state);
    notify();
  };

  const handleToggle = (id) => {
    setState(toggleChecked(id));
    notify();
  };

  const handleRemove = (id) => {
    setState(removeItem(id));
    notify();
  };

  const handleClearChecked = () => {
    setState(clearChecked());
    setMenuOpen(false);
    notify();
  };

  const handleClearAll = () => {
    setState(clearAll());
    setConfirmClear(false);
    setMenuOpen(false);
    notify();
  };

  const handleShare = async () => {
    setMenuOpen(false);
    const text = formatForShare(state);
    // Try the native share sheet first; fall back to clipboard + a
    // preview modal so the user can paste anywhere themselves.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Grocery List", text });
        return;
      } catch {
        /* user cancelled or share failed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard blocked — modal still shows the text */
    }
    setShareText(text);
  };

  return (
    <>
      <PaperBackdrop />
      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="font-body text-sm text-mocha hover:text-ink"
            >
              ← Back
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More actions"
                aria-expanded={menuOpen}
                className="w-9 h-9 rounded-full hover:bg-ink/5 flex items-center justify-center text-xl text-ink"
              >
                ⋯
              </button>
              {menuOpen && (
                <BulkMenu
                  hasChecked={checkedCount > 0}
                  hasAny={totalCount > 0}
                  onClearChecked={handleClearChecked}
                  onClearAll={() => setConfirmClear(true)}
                  onShare={handleShare}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Header */}
          <header>
            <h1 className="font-serif text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
              Grocery <span className="italic text-terracotta">List</span>
            </h1>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p className="font-script text-lg text-mocha leading-none">
                everything you need
              </p>
              {totalCount > 0 && (
                <p className="font-body text-xs text-mocha leading-none">
                  {totalCount} {totalCount === 1 ? "item" : "items"} ·{" "}
                  {checkedCount} checked off
                </p>
              )}
            </div>
            <PenStroke className="mt-4" width={128} />
          </header>

          {happyNote && totalCount > 0 && (
            <p className="mt-3 font-script text-xl text-sage text-center leading-none">
              happy shopping 🛒
            </p>
          )}

          {totalCount === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div>
                {groups.map(({ category, items }) => (
                  <CategoryGroup
                    key={category.id}
                    category={category}
                    items={items}
                    onToggle={handleToggle}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              {checkedCount > 0 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setHideChecked((v) => !v)}
                    className="font-script text-base text-mocha/85 hover:text-ink leading-none"
                  >
                    {hideChecked ? "show checked items" : "hide checked items"}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="h-28" />
        </div>
      </PageShell>

      {/* Sticky add button — hidden while the modal is open so it
       * doesn't sit on top of the bottom-sheet's submit area. */}
      {!adding && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-5 pb-5 pt-3 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="brut-button justify-center"
              style={{ background: "var(--color-terracotta)", color: "var(--color-paper-warm)" }}
            >
              <span className="font-serif text-xl font-bold">+ Add item</span>
            </button>
          </div>
        </div>
      )}

      {adding && (
        <AddItemModal onClose={() => setAdding(false)} onAdd={handleAdd} />
      )}

      {confirmClear && (
        <ConfirmClearModal
          onCancel={() => setConfirmClear(false)}
          onConfirm={handleClearAll}
        />
      )}

      {shareText && (
        <ShareTextModal text={shareText} onClose={() => setShareText(null)} />
      )}
    </>
  );
}

function BulkMenu({ hasChecked, hasAny, onClearChecked, onClearAll, onShare, onClose }) {
  // Close on outside click. The transparent overlay covers the rest of the
  // viewport but sits below the menu itself so the menu remains clickable.
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-10 z-30 min-w-[200px] brut-card p-1 animate-fadeIn"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onClearChecked}
        disabled={!hasChecked}
        className="block w-full text-left px-3 py-2 rounded-md font-body text-sm text-ink hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Clear checked items
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onClearAll}
        disabled={!hasAny}
        className="block w-full text-left px-3 py-2 rounded-md font-body text-sm text-ink hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Clear entire list
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onShare}
        disabled={!hasAny}
        className="block w-full text-left px-3 py-2 rounded-md font-body text-sm text-ink hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Share list
      </button>
    </div>
  );
}

function ConfirmClearModal({ onCancel, onConfirm }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-sm brut-card p-6 animate-slideUp">
        <h3 className="font-serif text-2xl font-extrabold text-ink leading-tight">
          Clear the whole list?
        </h3>
        <p className="font-body text-sm text-mocha mt-2 leading-snug">
          Removes every item — checked and unchecked. There's no undo.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg py-2.5 shadow-[3px_3px_0_0_var(--color-ink)]"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 font-serif font-bold text-paper-warm bg-ink border-2 border-ink rounded-lg py-2.5 shadow-[3px_3px_0_0_var(--color-terracotta)]"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareTextModal({ text, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-md brut-card p-5 animate-slideUp">
        <header className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-xl font-extrabold text-ink leading-none">
            Share your list
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="font-script text-lg text-mocha/85 hover:text-ink leading-none"
          >
            Done
          </button>
        </header>
        <p className="font-body text-xs text-mocha mb-2">
          Copy this text and paste it anywhere — iMessage, Notes, WhatsApp.
        </p>
        <pre className="font-body text-xs whitespace-pre-wrap bg-paper-warm border-2 border-ink rounded-lg p-3 max-h-64 overflow-auto text-ink leading-relaxed">
          {text}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="brut-button mt-4 justify-center"
        >
          <span className="font-serif text-lg font-bold">
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </span>
        </button>
      </div>
    </div>
  );
}
