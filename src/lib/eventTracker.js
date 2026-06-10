// Append-only event log persisted to localStorage. Capped at MAX_EVENTS
// most-recent entries — older entries fall off the tail to keep the
// payload bounded.

const KEY = "whats-cookin-events";
const MAX_EVENTS = 1000;

export function logEvent(type, context = {}) {
  if (!type) return;
  const events = readEvents();
  const entry = {
    type,
    timestamp: new Date().toISOString(),
    ...context,
  };
  events.push(entry);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  writeEvents(events);
}

export function getEvents(filter = {}) {
  let events = readEvents();
  if (filter.type) {
    const types = Array.isArray(filter.type) ? new Set(filter.type) : new Set([filter.type]);
    events = events.filter((e) => types.has(e.type));
  }
  if (filter.since) {
    const cutoff = new Date(filter.since).getTime();
    events = events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  }
  return events;
}

export function clearEvents() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage disabled — fine */
  }
}

export function getEventCount() {
  return readEvents().length;
}

export function exportAllAppData() {
  // Pull every namespaced localStorage key for the export feature.
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("whats-cookin") || key.startsWith("whatscookin:")) {
        try {
          out[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          out[key] = localStorage.getItem(key);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

function readEvents() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return Array.isArray(parsed?.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

function writeEvents(events) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ events }));
  } catch {
    /* quota or disabled — ignore */
  }
}
