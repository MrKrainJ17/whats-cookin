import { useEffect, useState } from "react";
import { getColorMode, setColorMode, subscribeColorMode } from "../lib/theme.js";

// On-brand neobrutalist segmented switch: ☀️ Light | 🌙 Dark. The active side
// is filled terracotta. Tapping either side switches the theme instantly and
// persists it. Stays in sync if another ThemeToggle (or code) changes the mode.
export default function ThemeToggle() {
  const [mode, setMode] = useState(getColorMode());

  useEffect(() => subscribeColorMode(setMode), []);

  const choose = (next) => {
    if (next !== mode) setColorMode(next);
  };

  return (
    <div
      role="group"
      aria-label="Appearance"
      className="inline-flex overflow-hidden rounded-full border-2 border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
    >
      <button
        type="button"
        onClick={() => choose("light")}
        aria-pressed={mode === "light"}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 font-serif text-sm font-bold leading-none transition-colors ${
          mode === "light"
            ? "bg-terracotta text-white"
            : "bg-paper-warm text-ink"
        }`}
      >
        <span aria-hidden="true">☀️</span> Light
      </button>
      <span aria-hidden="true" className="w-[2px] self-stretch bg-ink" />
      <button
        type="button"
        onClick={() => choose("dark")}
        aria-pressed={mode === "dark"}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 font-serif text-sm font-bold leading-none transition-colors ${
          mode === "dark" ? "bg-terracotta text-white" : "bg-paper-warm text-ink"
        }`}
      >
        <span aria-hidden="true">🌙</span> Dark
      </button>
    </div>
  );
}
