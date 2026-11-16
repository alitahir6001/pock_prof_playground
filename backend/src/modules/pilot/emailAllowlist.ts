/**
 * Who may log in. An empty list leaves signup open (local dev); the admin
 * address is always allowed. All three arguments are expected lowercased.
 */
export function isEmailAllowed(email: string, allowlist: string[], adminEmail: string): boolean {
  if (allowlist.length === 0) return true;
  return (adminEmail.length > 0 && email === adminEmail) || allowlist.includes(email);
}
