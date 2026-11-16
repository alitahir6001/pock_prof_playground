/** Wrong codes allowed per email within one code lifetime, summed across that email's codes. */
export const MAX_LOGIN_ATTEMPTS = 8;
/** `attempts` must already include the attempt being judged, so parallel guesses cannot all slip through. */
export function isLockedOut(attempts: number): boolean {
  return attempts > MAX_LOGIN_ATTEMPTS;
}
