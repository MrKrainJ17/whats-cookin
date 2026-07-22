import { useEffect, useState } from "react";
import { MILESTONE_MESSAGES } from "../lib/streak.js";

// Global one-time celebration toast for streak milestones. Mounted once at the
// app root so it can appear over any page. A milestone is delivered either via
// the live `streak-milestone` event (fired the moment "I made this" is tapped)
// or via the `pendingMilestoneToast` localStorage key (so it still shows after
// the post-cook navigation). Appears ~3s, then fades. Shown once per milestone
// because streak.js only fires each milestone a single time.
export default function StreakMilestoneToast() {
  const [milestone, setMilestone] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let hideT;
    let clearT;

    const show = (n) => {
      if (n == null) return;
      setLeaving(false);
      setMilestone(n);
      try {
        localStorage.removeItem("pendingMilestoneToast");
      } catch {
        /* ignore */
      }
      window.clearTimeout(hideT);
      window.clearTimeout(clearT);
      hideT = window.setTimeout(() => setLeaving(true), 3000); // hold 3s
      clearT = window.setTimeout(() => setMilestone(null), 3450); // after fade
    };

    // Pick up a milestone that fired during a page that has since unmounted.
    try {
      const pending = localStorage.getItem("pendingMilestoneToast");
      if (pending) show(Number(pending));
    } catch {
      /* ignore */
    }

    const onMilestone = (e) => show(e.detail);
    window.addEventListener("streak-milestone", onMilestone);
    return () => {
      window.removeEventListener("streak-milestone", onMilestone);
      window.clearTimeout(hideT);
      window.clearTimeout(clearT);
    };
  }, []);

  if (milestone == null) return null;
  const message = MILESTONE_MESSAGES[milestone] || `🔥 ${milestone} day streak!`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 bottom-6 z-[100] -translate-x-1/2 ${
        leaving ? "streak-toast-leave" : "streak-toast-enter"
      }`}
    >
      <div className="brut-card px-4 py-3 max-w-[88vw]">
        <span className="font-serif font-bold text-ink text-sm text-center block">
          {message}
        </span>
      </div>
    </div>
  );
}
