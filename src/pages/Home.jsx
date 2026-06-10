import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import ContextualSuggestion from "../components/home/ContextualSuggestion.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import PenStroke from "../components/handDrawn/PenStroke.jsx";
import LogoVariant2 from "../components/branding/LogoVariant2.jsx";
import { buildUserProfile } from "../lib/profileBuilder.js";
import { generateRecipes } from "../lib/generateRecipes.js";
import {
  wasOnboardingSkipped,
  getAppOpenCount,
  isNudgeDismissed,
  dismissNudge,
} from "../lib/preferences.js";
import {
  getItemCount as getGroceryItemCount,
  subscribe as subscribeGrocery,
} from "../lib/groceryList.js";
import { useSession } from "../lib/sessionContext.js";

const LIGHT_TOOLTIP_KEY = "whatscookin:lightPersonalizationShown";

export default function Home() {
  const navigate = useNavigate();

  // Always render Home in its centered state. If the user navigated away,
  // scrolled on the next page, and came back, the browser would otherwise
  // restore that scroll position and the pot/title would render above the
  // viewport. useLayoutEffect fires synchronously before paint so the
  // user never sees a mid-page flash.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Rebuilt on every Home mount so freshly logged events feed the profile.
  const profile = useMemo(() => buildUserProfile(), []);

  const [tooltipVisible, setTooltipVisible] = useState(() => {
    if (profile.personalizationLevel !== "light") return false;
    try {
      if (localStorage.getItem(LIGHT_TOOLTIP_KEY)) return false;
      localStorage.setItem(LIGHT_TOOLTIP_KEY, "1");
    } catch {
      return false;
    }
    return true;
  });

  // Soft nudge: skippers who've opened the app 3+ times get a one-time
  // banner asking them to come back and fill in the survey. Dismissing
  // (either button) sets the persistent flag so we never show again.
  const [nudgeVisible, setNudgeVisible] = useState(
    () =>
      wasOnboardingSkipped() && getAppOpenCount() >= 3 && !isNudgeDismissed(),
  );
  const dismissNudgeAnd = (cb) => {
    dismissNudge();
    setNudgeVisible(false);
    cb?.();
  };

  const onSuggestionTap = ({ ingredients, suggestion }) => {
    generateRecipes(ingredients, {
      context: suggestion.context,
      maxTimeMinutes: suggestion.maxTimeMinutes ?? undefined,
    }).catch(() => {});
    navigate("/recipes", {
      state: {
        ingredients,
        preferences: {
          context: suggestion.context,
          maxTimeMinutes: suggestion.maxTimeMinutes ?? undefined,
        },
      },
    });
  };

  return (
    <>
      <PaperBackdrop />

      <PageShell compact>
        <div className="relative z-10 flex flex-col flex-1">
          <AuthCorner />
          <Title />

          <p className="mt-8 text-center text-sm sm:text-base text-mocha font-body px-4 leading-snug">
            Tell us what you have. We'll tell you what to make.
          </p>

          <PenStroke className="mt-4" width={112} />

          {tooltipVisible && (
            <LightTooltip
              navigate={navigate}
              onClose={() => setTooltipVisible(false)}
            />
          )}

          {nudgeVisible && (
            <SurveyNudge
              onAccept={() =>
                dismissNudgeAnd(() => navigate("/onboarding"))
              }
              onDismiss={() => dismissNudgeAnd()}
            />
          )}

          {profile.personalizationLevel !== "none" && (
            <div className="mt-2">
              <ContextualSuggestion
                profile={profile}
                onTap={onSuggestionTap}
              />
            </div>
          )}

          <div className="mt-3 flex-1 flex flex-col gap-2 justify-center">
            <BrutButton
              emoji="📸"
              tilt="-4deg"
              label="Take a Photo"
              sub="Snap your fridge"
              onClick={() => navigate("/photo")}
            />
            <BrutButton
              emoji="⌨️"
              tilt="3deg"
              label="Type Ingredients"
              sub="Type what you've got"
              onClick={() => navigate("/type")}
            />
            <BrutButton
              emoji="🎤"
              tilt="-2deg"
              label="Speak Ingredients"
              sub="Tap and talk"
              onClick={() => navigate("/speak")}
            />
            <GroceryListButton onClick={() => navigate("/grocery")} />
          </div>

          <footer className="mt-3 flex flex-col items-center gap-1.5">
            <PenStroke width={72} />
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="settings-link items-center gap-1.5 text-sm text-mocha hover:text-ink font-body lowercase tracking-wide"
              >
                <ProfileIcon className="w-[14px] h-[14px]" />
                <span>profile</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="settings-link items-center gap-1.5 text-sm text-mocha hover:text-ink font-body lowercase tracking-wide"
              >
                <GearIcon className="settings-gear w-[14px] h-[14px]" />
                <span>settings</span>
              </button>
            </div>
            <p className="font-script text-base text-mocha/85 leading-none mt-0.5">
              made with love · cook something good today
            </p>
          </footer>
        </div>
      </PageShell>
    </>
  );
}

/* ── Title ──────────────────────────────────────────────────────────────── */

function Title() {
  // Centering via flex-col + items-center on the h1 instead of
  // text-align inheritance through mixed block / inline-block spans —
  // guarantees each line's box is centered identically regardless of
  // italic skew or sub-pixel rendering quirks across browsers.
  return (
    <header className="mt-1 flex flex-col items-center">
      <LogoVariant2 size={40} className="mb-1.5 block" />
      <h1 className="font-serif font-extrabold leading-[0.92] tracking-[-0.02em] text-ink select-none flex flex-col items-center text-center">
        <span className="text-[44px] sm:text-[48px] leading-none">
          What's
        </span>
        <span className="relative inline-block text-[44px] sm:text-[48px] italic font-bold text-terracotta leading-none mt-1">
          Cookin
          <SquigglyUnderline />
        </span>
      </h1>
    </header>
  );
}

function SquigglyUnderline() {
  // Hand-drawn-ish wobble underline. preserveAspectRatio=none lets it
  // stretch to fit the parent's width.
  return (
    <svg
      viewBox="0 0 240 14"
      preserveAspectRatio="none"
      className="absolute left-0 right-0 -bottom-3 w-full h-3 text-terracotta"
      aria-hidden="true"
    >
      <path
        d="M4 8 Q 28 1, 56 7 T 116 6 T 178 8 T 236 5"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Neobrutalist input button ──────────────────────────────────────────── */

function BrutButton({ emoji, tilt, label, sub, onClick, ariaLabel }) {
  // Slimmer than the shared .brut-button so all four buttons + the
  // surrounding chrome fit in one screen. Vertical padding drops from
  // 20px → 12px; horizontal stays generous for tap comfort.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="brut-button"
      style={{ padding: "0.6rem 1.1rem", gap: "0.85rem" }}
    >
      <span
        className="text-[36px] shrink-0 inline-block leading-none"
        style={{ transform: `rotate(${tilt})` }}
        aria-hidden="true"
      >
        {emoji}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="font-serif text-xl font-bold text-ink leading-tight">
          {label}
        </span>
        <span className="font-body text-[12px] text-mocha mt-0.5 leading-snug">
          {sub}
        </span>
      </span>
    </button>
  );
}

/* ── Top-right Sign In link / avatar ───────────────────────────────────── */

function AuthCorner() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  if (loading) return <div className="h-7" />;
  // Signed-in users have the footer "profile" link as their entry point;
  // the top-right avatar circle was redundant, so we don't render it.
  if (session) return null;
  return (
    <div className="absolute right-0 top-0 z-20">
      <button
        type="button"
        onClick={() => navigate("/welcome")}
        className="font-script text-lg text-mocha hover:text-ink leading-none"
      >
        sign in
      </button>
    </div>
  );
}

/* ── Grocery List action button (4th main entry point) ─────────────────── */

// Same shape and weight as the three input BrutButtons above so all four
// reads as siblings. Wraps the BrutButton render to attach a live item
// count badge to the top-right corner of the button.
function GroceryListButton({ onClick }) {
  const [count, setCount] = useState(() => getGroceryItemCount());
  const prevCountRef = useRef(count);
  const badgeRef = useRef(null);
  const seenPulseKey = "whats-cookin-grocery-first-add-shown";

  useEffect(() => {
    const unsub = subscribeGrocery(() => setCount(getGroceryItemCount()));
    const onFocus = () => setCount(getGroceryItemCount());
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // First-ever 0 → >0 transition fires a one-time celebratory pulse on
  // the badge. DOM-imperative so we don't trigger a setState in effect.
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (prev !== 0 || count === 0) return undefined;
    try {
      if (localStorage.getItem(seenPulseKey)) return undefined;
      localStorage.setItem(seenPulseKey, "1");
    } catch {
      return undefined;
    }
    const el = badgeRef.current;
    if (!el) return undefined;
    el.classList.add("badge-pulse");
    const t = window.setTimeout(
      () => el.classList.remove("badge-pulse"),
      400,
    );
    return () => window.clearTimeout(t);
  }, [count]);

  const label = `Grocery List${count > 0 ? `, ${count} ${count === 1 ? "item" : "items"}` : ""}`;

  return (
    <div className="relative">
      <BrutButton
        emoji="🛒"
        tilt="4deg"
        label="Grocery List"
        sub="What you need to buy"
        onClick={onClick}
        ariaLabel={label}
      />
      {count > 0 && (
        <span
          ref={badgeRef}
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-terracotta text-paper-warm font-serif text-xs font-bold flex items-center justify-center leading-none border-2 border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

/* ── Profile silhouette icon (real icon, not emoji) ─────────────────────── */

function ProfileIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 Q 12 14, 20 21" />
    </svg>
  );
}

/* ── Settings gear (real icon, not emoji) ───────────────────────────────── */

function GearIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ── Survey nudge for skippers ─────────────────────────────────────────── */

function SurveyNudge({ onAccept, onDismiss }) {
  return (
    <div className="mt-6 brut-card p-4 flex items-start gap-3">
      <span aria-hidden="true" className="text-lg leading-none mt-0.5">
        👋
      </span>
      <div className="flex-1">
        <p className="font-body text-sm text-ink leading-snug">
          Hey — taking 60 seconds to set your preferences will make our recipes
          way better. Wanna do it now?
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-3 py-1.5 text-sm shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] transition-transform"
          >
            Yes, let's do it
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="font-script text-base text-mocha/80 hover:text-ink leading-none"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Light-personalization tooltip (restyled to match the new palette) ──── */

function LightTooltip({ navigate, onClose }) {
  return (
    <div className="mt-6 rounded-md border-2 border-ink bg-paper-warm p-3 text-sm flex items-start gap-2 font-body shadow-[3px_3px_0_0_var(--color-ink)]">
      <span aria-hidden="true">💡</span>
      <span className="flex-1 text-ink leading-snug">
        I'm starting to learn your taste. Edit what I've picked up in{" "}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="font-semibold text-terracotta underline-offset-2 underline"
        >
          settings
        </button>
        .
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="text-ink/45 hover:text-ink w-6 h-6 leading-none"
      >
        ×
      </button>
    </div>
  );
}
