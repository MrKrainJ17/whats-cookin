import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import {
  clearEvents,
  exportAllAppData,
  getEventCount,
} from "../lib/eventTracker.js";
import { clearBlocklist } from "../lib/blocklist.js";
import { clearFavorites } from "../lib/favorites.js";
import ThemeToggle from "../components/ThemeToggle.jsx";

// Settings now covers app-level controls only — anything taste / account
// related lives on the Profile page (/profile). This file used to host
// the Account section and TasteSettings; both moved.
const APP_DATA_KEYS = [
  "whats-cookin-events",
  "whats-cookin-blocklist",
  "whats-cookin-favorites",
  "whats-cookin-tips-cache",
  "whats-cookin-preferences",
  "whats-cookin-app-opens",
  "whats-cookin-nudge-dismissed",
  "whatscookin:cooking",
  "whatscookin:cookedHistory",
  "whatscookin:voiceEnabled",
  "whatscookin:voiceAutoRead",
  "whatscookin:voicePrivacyShown",
  "whatscookin:lightPersonalizationShown",
];

export default function Settings() {
  const navigate = useNavigate();
  const [, forceRefresh] = useState(0);
  const refresh = useCallback(() => forceRefresh((n) => n + 1), []);

  const eventCount = useMemo(() => getEventCount(), []);
  const [confirming, setConfirming] = useState(null); // 'learnings' | 'all' | null

  const resetLearnings = () => {
    clearEvents();
    clearBlocklist();
    setConfirming(null);
    refresh();
    navigate("/", { replace: true });
  };

  const resetAll = () => {
    clearEvents();
    clearBlocklist();
    clearFavorites();
    try {
      for (const key of APP_DATA_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
    setConfirming(null);
    refresh();
    navigate("/", { replace: true });
  };

  const exportData = () => {
    const data = exportAllAppData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `whats-cookin-data-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <PageShell>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-charcoal/60 hover:text-charcoal text-base mb-2"
      >
        ← Back
      </button>

      <header className="mt-2 mb-6">
        <h1 className="text-3xl font-bold text-charcoal">Settings</h1>
        <p className="text-charcoal/60 text-sm mt-1">
          {eventCount} interactions logged on this device
        </p>
      </header>

      {/* Pointer to Profile for taste / account stuff */}
      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="brut-button mb-6 justify-between !py-3.5 !px-4"
      >
        <span className="flex items-center gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">
            👤
          </span>
          <span className="flex flex-col items-start">
            <span className="font-serif text-lg font-bold text-ink leading-tight">
              Profile & Taste
            </span>
            <span className="font-body text-xs text-mocha">
              account, diet, allergies, cuisines…
            </span>
          </span>
        </span>
        <span aria-hidden="true" className="font-serif text-lg text-ink/55">
          →
        </span>
      </button>

      <section className="mt-6 rounded-2xl bg-white shadow-sm border border-charcoal/10 p-5">
        <h3 className="text-lg font-bold text-charcoal mb-3">Appearance</h3>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-charcoal/70">
            Light or dark theme for the whole app
          </span>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white shadow-sm border border-charcoal/10 p-5">
        <h3 className="text-lg font-bold text-charcoal mb-3">
          Reset and export
        </h3>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setConfirming("learnings")}
            className="w-full text-left rounded-xl bg-charcoal/5 hover:bg-charcoal/10 px-4 py-3 text-sm font-medium"
          >
            Reset learnings only
            <span className="block text-xs text-charcoal/55 mt-0.5">
              Clears events + blocklist. Keeps favorites and cooking history.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setConfirming("all")}
            className="w-full text-left rounded-xl bg-charcoal/5 hover:bg-charcoal/10 px-4 py-3 text-sm font-medium"
          >
            Reset all app data
            <span className="block text-xs text-charcoal/55 mt-0.5">
              Wipes everything stored on this device. Cannot be undone.
            </span>
          </button>
          <button
            type="button"
            onClick={exportData}
            className="w-full text-left rounded-xl bg-charcoal/5 hover:bg-charcoal/10 px-4 py-3 text-sm font-medium"
          >
            Export your data
            <span className="block text-xs text-charcoal/55 mt-0.5">
              Downloads a JSON file with all your events, favorites, and history.
            </span>
          </button>
        </div>
      </section>

      <p className="mt-6 text-xs text-charcoal/40 text-center">
        Everything stays on your device. Nothing is sent to any server.
      </p>

      {confirming && (
        <ConfirmModal
          mode={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={confirming === "all" ? resetAll : resetLearnings}
        />
      )}
    </PageShell>
  );
}

function ConfirmModal({ mode, onCancel, onConfirm }) {
  const heavy = mode === "all";
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
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-slideUp">
        <h3 className="text-xl font-bold text-charcoal">
          {heavy ? "Wipe everything?" : "Reset learnings?"}
        </h3>
        <p className="text-charcoal/70 mt-2 text-sm">
          {heavy
            ? "This deletes every event, favorite, cooking-history entry, and preference stored on this device. There's no undo."
            : "This clears your event log and blocklist. Favorites and cooking history stay. There's no undo."}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full font-semibold py-3 text-white ${
              heavy ? "bg-rose-600 hover:bg-rose-700" : "bg-tomato hover:bg-tomato-deep"
            }`}
          >
            {heavy ? "Wipe everything" : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
