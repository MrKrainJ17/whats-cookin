import { TEMPLATE_IDS, TEMPLATES } from "../../lib/shareCard.js";

// Style-picker thumbnails. Each is a tiny DOM-rendered mock of the
// actual share-card visual identity — colors, accent stripes, and a
// representative "Aa" sample — so the user can pick a vibe at a glance
// without waiting for a full canvas render per option. The currently
// selected style gets a terracotta border highlight.

const STYLES = {
  cozy: {
    bg: "#F8F1E4",
    fg: "#2B2118",
    accent: "#D2691E",
    pattern: "paper",
    sample: "Aa",
  },
  bold: {
    bg: "#0F1923",
    fg: "#FFFFFF",
    accent: "#E8B14C",
    sample: "Aa",
  },
  minimal: {
    bg: "#FFFFFF",
    fg: "#0a0a0a",
    accent: "#7B9E7B",
    border: "1px solid #e5e5e5",
    sample: "Aa",
  },
  diner: {
    bg: "#FFF8DC",
    fg: "#CC0000",
    accent: "#CC0000",
    pattern: "checker",
    sample: "Aa",
  },
  sunset: {
    bg: "linear-gradient(180deg, #FF6B6B 0%, #FFD93D 100%)",
    fg: "#FFFFFF",
    accent: "rgba(255,255,255,0.8)",
    sample: "Aa",
  },
  chefs: {
    bg: "#000000",
    fg: "#FFFFFF",
    accent: "#C9A968",
    pattern: "rule",
    sample: "Aa",
  },
  neon: {
    bg: "#0D0D0D",
    fg: "#39FF14",
    accent: "#39FF14",
    glow: true,
    sample: "Aa",
  },
  playful: {
    bg: "#FFFFFF",
    fg: "#1f1812",
    accent: "#c8421b",
    pattern: "polaroid",
    sample: "Aa",
    font: "var(--font-script)",
  },
};

export default function TemplateSwitcher({ value, onChange }) {
  return (
    <div className="w-full max-w-sm mt-3">
      <p className="font-script text-lg text-mocha leading-none text-center mb-2">
        Pick a vibe
      </p>
      <div
        className="flex gap-2.5 overflow-x-auto overflow-y-visible pt-2 pb-2 px-2 snap-x snap-mandatory"
        // Padding on every side (≥4px) gives the active card's terracotta
        // ring + offset + scale room to render without being clipped —
        // the top especially, since horizontal scrolling otherwise clips
        // the vertical overflow.
      >
        {TEMPLATE_IDS.map((id) => {
          const isActive = id === value;
          const s = STYLES[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={isActive}
              aria-label={TEMPLATES[id].label}
              className="snap-start shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <Thumb style={s} active={isActive} />
              <span
                className={`text-[11px] leading-tight text-center w-[80px] truncate ${
                  isActive ? "text-terracotta font-semibold" : "text-charcoal/65"
                }`}
              >
                {TEMPLATES[id].short || TEMPLATES[id].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Thumb({ style, active }) {
  return (
    <div
      className={`w-[80px] h-[120px] rounded-xl overflow-hidden relative transition-transform ${
        active ? "ring-2 ring-terracotta ring-offset-2 ring-offset-cream scale-[1.04]" : "ring-1 ring-charcoal/10"
      }`}
      style={{
        background: style.bg,
        border: style.border ?? "none",
      }}
    >
      {/* Top accent */}
      {style.pattern === "checker" && <CheckerTop />}
      {style.pattern === "polaroid" && <PolaroidBorder />}
      {style.pattern === "rule" && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-3 w-6 h-px"
          style={{ background: style.accent }}
        />
      )}
      {style.pattern === "paper" && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(196,82,26,0.15), transparent 60%)",
          }}
        />
      )}

      {/* Centered Aa sample, big and the template's accent color */}
      <div
        className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold"
        style={{
          color: style.fg,
          fontFamily: style.font,
          textShadow: style.glow ? `0 0 8px ${style.accent}, 0 0 14px ${style.accent}` : undefined,
        }}
      >
        {style.sample}
      </div>

      {/* Bottom accent stripe */}
      {style.pattern !== "checker" && style.pattern !== "polaroid" && (
        <div
          className="absolute left-3 right-3 bottom-3 h-px"
          style={{
            background:
              style.pattern === "rule" ? style.accent : `${style.accent}55`,
          }}
        />
      )}
    </div>
  );
}

function CheckerTop() {
  // Eight red+white squares across the top
  return (
    <div className="absolute top-0 inset-x-0 h-3 flex">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-full"
          style={{ background: i % 2 === 0 ? "#CC0000" : "#fff" }}
        />
      ))}
    </div>
  );
}

function PolaroidBorder() {
  return (
    <div className="absolute inset-1 rounded-md bg-[#F4EFE3]" />
  );
}
