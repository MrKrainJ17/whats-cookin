import { useNavigate } from "react-router-dom";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import LogoVariant1 from "../components/branding/LogoVariant1.jsx";
import LogoVariant2 from "../components/branding/LogoVariant2.jsx";
import LogoVariant3 from "../components/branding/LogoVariant3.jsx";
import LogoVariant4 from "../components/branding/LogoVariant4.jsx";

const VARIANTS = [
  { id: 1, name: "Minimal & Confident", Component: LogoVariant1 },
  { id: 2, name: "Two-tone Terracotta", Component: LogoVariant2 },
  { id: 3, name: "Filled Pot, Outlined Steam", Component: LogoVariant3 },
  { id: 4, name: "Pot with Bubbling Contents", Component: LogoVariant4 },
];

const SIZES = [32, 96, 256];

export default function LogoPreview() {
  const navigate = useNavigate();
  return (
    <>
      <PaperBackdrop />
      <div className="relative z-10 min-h-screen px-5 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-body text-sm text-mocha hover:text-ink mb-4"
          >
            ← Home
          </button>

          <header className="mb-2">
            <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
              Logo{" "}
              <span className="italic text-terracotta font-bold">
                variations
              </span>
            </h1>
            <p className="font-script text-lg text-mocha mt-1 leading-none">
              pick a favorite — preview only, not linked from anywhere
            </p>
          </header>

          <div className="mt-8 flex flex-col gap-8">
            {VARIANTS.map(({ id, name, Component }) => (
              <section key={id} className="brut-card p-6 sm:p-7">
                <header className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="font-body text-xs font-bold uppercase tracking-[0.18em] text-mocha">
                    Variation {id}
                  </span>
                  <h2 className="font-serif text-2xl font-extrabold text-ink leading-none">
                    {name}
                  </h2>
                </header>

                {/* Three reference sizes */}
                <div className="mt-6">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-mocha mb-3">
                    Sizes
                  </p>
                  <div className="flex flex-wrap items-end gap-8 sm:gap-10">
                    {SIZES.map((size) => (
                      <SizeSwatch
                        key={size}
                        size={size}
                        Component={Component}
                      />
                    ))}
                  </div>
                </div>

                {/* Logo paired with wordmark */}
                <div className="mt-7 pt-5 border-t border-ink/15">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-mocha mb-3">
                    With wordmark
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Component size={56} />
                    <span className="font-serif font-extrabold text-[40px] sm:text-5xl text-ink leading-none tracking-[-0.02em]">
                      What's{" "}
                      <span className="italic text-terracotta">Cookin</span>
                    </span>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <p className="font-body text-xs text-mocha/70 text-center mt-10">
            Pick a winner and let me know — next prompt deploys it to the
            favicon, app header, share card watermark, etc.
          </p>
        </div>
      </div>
    </>
  );
}

function SizeSwatch({ size, Component }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center bg-paper-warm border border-ink/15 rounded-md"
        style={{
          // Fixed-size frame so the 32/96/256 marks visually compare in
          // the same cell width as each other (32px frame is small, the
          // bigger ones grow naturally).
          padding: "8px",
        }}
      >
        <Component size={size} />
      </div>
      <span className="font-body text-xs text-mocha tabular-nums">
        {size}px
      </span>
    </div>
  );
}
