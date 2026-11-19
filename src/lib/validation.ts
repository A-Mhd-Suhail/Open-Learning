export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Shared by client forms and server actions. Returns an error message or null. */
export function validateName(raw: string): string | null {
  const name = normalizeName(raw);
  if (name.length < 2) return "Please enter at least 2 characters.";
  if (name.length > 50) return "Please keep your name under 50 characters.";
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) return "Use letters, spaces, dots, hyphens or apostrophes only.";
  return null;
}
