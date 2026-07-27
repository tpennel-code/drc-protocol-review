/**
 * The default password assigned to a reviewer, derived from their surname.
 * Format: "<Surname>123", padded with "0" to meet the 6-character minimum
 * (e.g. surname "Ng" -> "Ng1230"). Returns null when no surname is available.
 */
export function defaultReviewerPassword(surname?: string | null): string | null {
  if (!surname) return null
  return (surname + '123').padEnd(6, '0')
}
