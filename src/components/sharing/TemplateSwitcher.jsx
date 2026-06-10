import { TEMPLATE_IDS, TEMPLATES } from "../../lib/shareCard.js";

// Tiny thumbnail picker. The actual preview is rendered by the parent;
// this just emits the selected template id.

const THUMBS = {
  cozy: {
    bg: "linear-gradient(180deg, #fbf6ec 0%, #fbe5d0 100%)",
    fg: "#c8421b",
    accent: "Aa",
  },
  bold: {
    bg: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    fg: "#fbbf24",
    accent: "Aa",
  },
  minimal: {
    bg: "#ffffff",
    fg: "#0a0a0a",
    accent: "Aa",
    border: "1px solid #e5e5e5",
  },
  playful: {
    bg: "linear-gradient(135deg, #ffe5d9, #fde7f3, #e0d5ff)",
    fg: "#ec4899",
    accent: "Aa",
  },
};

export default function TemplateSwitcher({ value, onChange }) {
  return (
    <div className="flex justify-center gap-2 mt-3">
      {TEMPLATE_IDS.map((id) => {
        const isActive = id === value;
        const t = THUMBS[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            aria-label={TEMPLATES[id].label}
            className={`flex flex-col items-center gap-1.5 p-1 rounded-xl transition ${
              isActive ? "ring-2 ring-tomato ring-offset-2 ring-offset-cream" : ""
            }`}
          >
            <div
              className="w-12 h-20 rounded-md flex items-center justify-center font-bold text-base shadow-sm"
              style={{
                background: t.bg,
                color: t.fg,
                border: t.border ?? "none",
              }}
            >
              {t.accent}
            </div>
            <span className="text-[10px] text-charcoal/60 max-w-[60px] text-center leading-tight">
              {TEMPLATES[id].label.split(" & ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
