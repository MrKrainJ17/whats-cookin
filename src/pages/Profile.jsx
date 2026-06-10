import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import PenStroke from "../components/handDrawn/PenStroke.jsx";
import LearningsPanel from "../components/settings/LearningsPanel.jsx";
import PreferenceCard from "../components/profile/PreferenceCard.jsx";
import {
  DEFAULT_PREFERENCES,
  DIET_LABELS,
  SKILL_LABELS,
  SPICE_LABELS,
  TIME_LABELS,
  clearPreferences,
  getPreferences,
} from "../lib/preferences.js";
import { buildUserProfile } from "../lib/profileBuilder.js";
import { useSession } from "../lib/sessionContext.js";
import { signOut } from "../lib/auth.js";

// Main profile / account page. Replaces the single-form taste editor
// that used to live in Settings. Each preference is now its own card
// that opens a dedicated editor page.
export default function Profile() {
  const navigate = useNavigate();
  const { session } = useSession();

  // Bump on focus so we re-read localStorage whenever the user returns
  // from an editor (or another tab writes to it).
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const onFocus = () => setBump((b) => b + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const prefs = useMemo(
    () => getPreferences() || { ...DEFAULT_PREFERENCES },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bump],
  );

  // Behavioral profile drives the "What I've learned" panel — only
  // rendered when there's enough signal.
  const profile = useMemo(() => buildUserProfile(), [bump]);

  const [confirmReset, setConfirmReset] = useState(false);

  const cards = [
    {
      route: "diet",
      icon: "🥗",
      label: "Diet",
      value: prefs.diet ? DIET_LABELS[prefs.diet] || prefs.diet : "—",
    },
    {
      route: "allergies",
      icon: "🚫",
      label: "Allergies & Avoids",
      value: allergyDisplay(prefs),
    },
    {
      route: "spice",
      icon: "🌶️",
      label: "Spice Tolerance",
      value: spiceDisplay(prefs.spiceLevel),
    },
    {
      route: "cuisines",
      icon: "🍝",
      label: "Favorite Cuisines",
      value: cuisinesDisplay(prefs.favoriteCuisines),
    },
    {
      route: "skill",
      icon: "👨‍🍳",
      label: "Skill Level",
      value: prefs.skillLevel
        ? SKILL_LABELS[prefs.skillLevel] || prefs.skillLevel
        : "—",
    },
    {
      route: "time",
      icon: "⏱️",
      label: "Time Preference",
      value: prefs.timePreference
        ? TIME_LABELS[prefs.timePreference] || prefs.timePreference
        : "—",
    },
    {
      route: "dislikes",
      icon: "👎",
      label: "Ingredient Dislikes",
      value: dislikeDisplay(prefs.ingredientDislikes),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <PaperBackdrop />
      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="self-start font-body text-sm text-mocha hover:text-ink mb-3"
          >
            ← Back
          </button>

          {/* Top — account row */}
          <section className="mb-6">
            {session ? (
              <>
                <div className="flex items-start gap-2">
                  <h2 className="font-serif font-extrabold text-ink text-[28px] sm:text-[32px] leading-tight tracking-tight break-words">
                    {session.user?.user_metadata?.full_name || "Add your name"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/profile/name")}
                    aria-label="Edit your name"
                    className="mt-1 text-mocha hover:text-ink shrink-0"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-body text-sm text-mocha mt-1 leading-tight break-all">
                  {session.user?.email}
                </p>
                <p className="font-body text-[11px] uppercase tracking-[0.18em] text-mocha mt-3">
                  Account
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password")}
                    className="font-script text-lg text-terracotta hover:text-ink leading-none"
                  >
                    Change password
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="font-script text-lg text-terracotta hover:text-ink leading-none"
                  >
                    Sign out
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset("delete-account")}
                    className="font-script text-lg text-terracotta hover:text-ink leading-none"
                  >
                    Delete account
                  </button>
                </div>
              </>
            ) : (
              <div className="brut-card p-4">
                <p className="font-serif font-bold text-ink text-base leading-tight">
                  Cooking as a guest
                </p>
                <p className="font-body text-sm text-mocha mt-1 leading-snug">
                  Sign up to keep your taste preferences in sync across
                  devices.
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="font-serif font-bold text-paper-warm bg-terracotta border-2 border-ink rounded-lg px-4 py-2 text-sm shadow-[3px_3px_0_0_var(--color-ink)]"
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-4 py-2 text-sm shadow-[3px_3px_0_0_var(--color-ink)]"
                  >
                    Log in
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Middle — Your Taste menu */}
          <header className="mb-4 mt-12">
            <h1 className="font-serif font-extrabold text-ink text-4xl leading-tight tracking-tight">
              Your <span className="italic text-terracotta">Taste</span>
            </h1>
            <p className="font-script text-lg text-mocha mt-1 leading-none">
              tap any to update
            </p>
          </header>

          <div className="flex flex-col gap-2.5">
            {cards.map((card) => (
              <PreferenceCard
                key={card.route}
                icon={card.icon}
                label={card.label}
                value={card.value}
                onClick={() => navigate(`/profile/${card.route}`)}
              />
            ))}
          </div>

          {/* Learnings panel (only if there's behavioral signal) */}
          {profile.personalizationLevel !== "none" && (
            <section className="mt-8">
              <h2 className="font-serif text-2xl font-extrabold text-ink leading-tight">
                What I've learned about you
              </h2>
              <p className="font-script text-base text-mocha mt-1 leading-none mb-3">
                shaped by what you've actually cooked
              </p>
              <LearningsPanel profile={profile} onRefresh={() => setBump((b) => b + 1)} />
            </section>
          )}

          {/* Bottom — meta actions */}
          <section className="mt-10 mb-2 flex flex-col items-center gap-3">
            <PenStroke width={64} />
            <button
              type="button"
              onClick={() => {
                clearPreferences();
                navigate("/onboarding");
              }}
              className="font-script text-lg text-terracotta hover:text-ink leading-none"
            >
              Redo full survey
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset("preferences")}
              className="font-script text-base text-mocha/85 hover:text-ink leading-none"
            >
              Reset all preferences
            </button>
          </section>
        </div>
      </PageShell>

      {confirmReset && (
        <ConfirmResetModal
          mode={confirmReset}
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => {
            if (confirmReset === "preferences") {
              clearPreferences();
              setConfirmReset(false);
              setBump((b) => b + 1);
            } else if (confirmReset === "delete-account") {
              // Hard-delete from Supabase isn't reachable from the
              // browser without admin keys — closest we can do is sign
              // out + wipe local data. Real deletion needs a backend.
              await signOut();
              clearPreferences();
              setConfirmReset(false);
              navigate("/", { replace: true });
            }
          }}
        />
      )}
    </>
  );
}

/* ── Pencil icon for "edit name" affordance ──────────────────────────── */

function PencilIcon({ className }) {
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
      <path d="M3 21 L 8 20 L 19 9 L 15 5 L 4 16 Z" />
      <path d="M14 6 L 18 10" />
    </svg>
  );
}

/* ── Display helpers ─────────────────────────────────────────────────── */

function allergyDisplay(prefs) {
  const count =
    (prefs.allergies?.length || 0) + (prefs.customAvoidList?.length || 0);
  if (prefs.noAllergies && count === 0) return "None";
  if (count === 0) return "—";
  return `${count} thing${count === 1 ? "" : "s"}`;
}

function spiceDisplay(level) {
  if (!level) return "—";
  const emoji = {
    any: "🤷",
    none: "🥛",
    mild: "🌶️",
    medium: "🌶️🌶️",
    hot: "🌶️🌶️🌶️",
  }[level];
  const label = SPICE_LABELS[level] || level;
  return `${label} ${emoji}`;
}

function cuisinesDisplay(list) {
  if (!Array.isArray(list) || list.length === 0) return "—";
  if (list.length === 1) return capitalize(list[0]);
  if (list.length === 2) return list.map(capitalize).join(", ");
  return `${capitalize(list[0])}, ${capitalize(list[1])} +${list.length - 2}`;
}

function dislikeDisplay(list) {
  if (!Array.isArray(list) || list.length === 0) return "None";
  return `${list.length} thing${list.length === 1 ? "" : "s"}`;
}

function capitalize(s) {
  if (!s) return "";
  return String(s).split(/[\s-]+/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

/* ── Confirm reset modal ─────────────────────────────────────────────── */

function ConfirmResetModal({ mode, onCancel, onConfirm }) {
  const isDeleteAccount = mode === "delete-account";
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
          {isDeleteAccount ? "Delete account?" : "Reset all preferences?"}
        </h3>
        <p className="font-body text-sm text-mocha mt-2 leading-snug">
          {isDeleteAccount
            ? "We'll sign you out and wipe this device's local data. Server-side deletion isn't available from the browser yet — email support if you want everything purged."
            : "Clears your diet, allergies, spice level, cuisines, skill, time, and dislikes. There's no undo."}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg py-2.5 shadow-[3px_3px_0_0_var(--color-ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 font-serif font-bold text-paper-warm bg-ink border-2 border-ink rounded-lg py-2.5 shadow-[3px_3px_0_0_var(--color-terracotta)]"
          >
            {isDeleteAccount ? "Delete" : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
