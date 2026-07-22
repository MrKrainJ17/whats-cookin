// Cooking streak — how many consecutive days the user has cooked something.
//
// Persisted in localStorage under `streakData`:
//   { currentStreak, lastCookedDate, longestStreak, milestonesSeen }
// (and mirrored best-effort into Supabase user metadata when signed in).
//
// Rules:
//   • Completing any recipe records today's date.
//   • +1 for each consecutive day with at least one cook.
//   • Cooking multiple times in one day still counts as one day.
//   • Miss a full day and the streak resets.

import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const KEY = "streakData";
export const MILESTONES = [3, 7, 14, 30];

export const MILESTONE_MESSAGES = {
  3: "🔥 3 day streak! You're on a roll",
  7: "🔥 One week strong! Incredible",
  14: "🔥 Two weeks! You're basically a chef",
  30: "🔥 30 days! Absolute legend 👨‍🍳",
};

const DEFAULT = {
  currentStreak: 0,
  lastCookedDate: null,
  longestStreak: 0,
  milestonesSeen: [],
};

function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Whole days between two YYYY-MM-DD strings (a − b).
function dayDiff(a, b) {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}

export function getStreakData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      currentStreak: Number(parsed.currentStreak) || 0,
      lastCookedDate:
        typeof parsed.lastCookedDate === "string" ? parsed.lastCookedDate : null,
      longestStreak: Number(parsed.longestStreak) || 0,
      milestonesSeen: Array.isArray(parsed.milestonesSeen)
        ? parsed.milestonesSeen
        : [],
    };
  } catch {
    return { ...DEFAULT };
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage disabled — streak just won't persist */
  }
  if (isSupabaseConfigured && supabase) {
    supabase.auth.updateUser({ data: { streakData: data } }).catch(() => {});
  }
}

// Record a completed cook for "today". Returns { data, newMilestone } where
// newMilestone is the milestone number just reached (once only), or null.
export function recordCookToday(now = new Date()) {
  const today = localDateStr(now);
  const data = getStreakData();

  // Already cooked today — day already counted, nothing changes.
  if (data.lastCookedDate === today) {
    return { data, newMilestone: null };
  }

  const streak =
    data.lastCookedDate && dayDiff(today, data.lastCookedDate) === 1
      ? data.currentStreak + 1
      : 1;

  const milestonesSeen = [...data.milestonesSeen];
  let newMilestone = null;
  if (MILESTONES.includes(streak) && !milestonesSeen.includes(streak)) {
    newMilestone = streak;
    milestonesSeen.push(streak);
  }

  const next = {
    currentStreak: streak,
    lastCookedDate: today,
    longestStreak: Math.max(data.longestStreak, streak),
    milestonesSeen,
  };
  save(next);

  if (newMilestone != null) {
    // Persist a pending toast so it survives the navigation that happens
    // right after "I made this", then notify any live listener immediately.
    try {
      localStorage.setItem("pendingMilestoneToast", String(newMilestone));
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(
        new CustomEvent("streak-milestone", { detail: newMilestone }),
      );
    } catch {
      /* non-browser env */
    }
  }

  return { data: next, newMilestone };
}

// Live status for the home-page badge. Returns the *effective* streak, which
// is 0 once a day has been missed (last cook is neither today nor yesterday).
export function getStreakStatus(now = new Date()) {
  const data = getStreakData();
  const today = localDateStr(now);

  let streak = 0;
  let cookedToday = false;

  if (data.lastCookedDate === today) {
    cookedToday = true;
    streak = data.currentStreak;
  } else if (
    data.lastCookedDate &&
    dayDiff(today, data.lastCookedDate) === 1
  ) {
    // Cooked yesterday — streak still alive but at risk today.
    streak = data.currentStreak;
  }

  const hour = now.getHours();
  const atRisk = !cookedToday && streak >= 1;

  return {
    streak,
    cookedToday,
    // Hourglass appears when the streak is at risk and it's getting late.
    showHourglass: atRisk && hour >= 18, // after 6pm
    urgent: atRisk && hour >= 21, // after 9pm → animate
  };
}
