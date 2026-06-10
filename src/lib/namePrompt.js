// Tiny helper for the "ask for full name" gate. Lives outside the
// NameRequired page so the App-level gate can import it without
// pulling a component file (and tripping React Fast Refresh).

const SKIP_KEY = "whats-cookin-name-prompt-skipped";

export function wasNameSkipped() {
  try {
    return localStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function markNameSkipped() {
  try {
    localStorage.setItem(SKIP_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearNameSkipped() {
  try {
    localStorage.removeItem(SKIP_KEY);
  } catch {
    /* ignore */
  }
}
