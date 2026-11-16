/** Wrong codes allowed per email within one code lifetime, summed across that email's codes. */
export const MAX_LOGIN_ATTEMPTS = 8;
/** Login codes one email may be sent within one code lifetime, and within 24 hours. */
export const MAX_CODES_PER_WINDOW = 5;
export const MAX_CODES_PER_DAY = 20;

/** `attempts` must already include the attempt being judged, so parallel guesses cannot all slip through. */
export function isLockedOut(attempts: number): boolean {
  return attempts > MAX_LOGIN_ATTEMPTS;
}

/** Counts are of codes already sent to this email, not including the one being requested. */
export function mayRequestCode(sentInWindow: number, sentInDay: number): boolean {
  return sentInWindow < MAX_CODES_PER_WINDOW && sentInDay < MAX_CODES_PER_DAY;
}
