// C8 — PIN rules and the scanner's wrong-PIN rate limit.
//
// Honest scope: this limiter lives in the scanner page, so it is COSMETIC. Anyone who
// copies the QR text can try every 6-digit PIN offline with their own code; the limiter
// only slows a person tapping on this screen. See docs/qr-envelope.md.
//
// The free-attempt count and the wait schedule are UI design parameters chosen by C8,
// not sourced facts, so they are never shown as a claim in the UI (only a live countdown).

export const PIN_LENGTH = 6;

/** A PIN is exactly six ASCII digits. */
export function isValidPin(pin) {
  return typeof pin === 'string' && /^[0-9]{6}$/.test(pin);
}

/** Convert Arabic-Indic or Eastern Arabic-Indic digits to ASCII so both keyboards work. */
export function normalizeDigits(str) {
  return String(str ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

const FREE_ATTEMPTS = 3;
const WAIT_SCHEDULE_MS = [30_000, 60_000, 120_000, 300_000];

/**
 * In-memory limiter (never persisted, never stores the PIN).
 * `now` is injectable so tests do not wait in real time.
 */
export function createPinLimiter({ now = () => Date.now() } = {}) {
  let failures = 0;
  let lockedUntil = 0;

  return {
    /** Milliseconds left before another attempt is allowed (0 = allowed). */
    remainingMs() {
      return Math.max(0, lockedUntil - now());
    },
    canTry() {
      return this.remainingMs() === 0;
    },
    recordFailure() {
      failures += 1;
      if (failures >= FREE_ATTEMPTS) {
        const step = Math.min(failures - FREE_ATTEMPTS, WAIT_SCHEDULE_MS.length - 1);
        lockedUntil = now() + WAIT_SCHEDULE_MS[step];
      }
      return this.remainingMs();
    },
    recordSuccess() {
      failures = 0;
      lockedUntil = 0;
    },
    get failures() {
      return failures;
    },
  };
}
