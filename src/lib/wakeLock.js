// Screen wake lock helpers. Browsers without Wake Lock API silently no-op.

let sentinel = null;

export async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return false;
  if (sentinel) return true;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener?.("release", () => {
      // Browser auto-released (e.g. tab hidden). Clear so we can re-acquire.
      sentinel = null;
    });
    return true;
  } catch {
    sentinel = null;
    return false;
  }
}

export async function releaseWakeLock() {
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
}

export function hasWakeLock() {
  return sentinel !== null;
}
