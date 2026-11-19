/** Shared language catalogue + proficiency levels for onboarding, rooms and posts. Values are stored as the label text. */
export const LANGUAGES = ["English", "Tamil", "Hindi", "Malayalam", "Telugu", "Kannada", "French", "German", "Japanese", "Spanish"] as const;
/** Extra languages offered under "Other languages". Students may also type their own (2–40 chars). */
export const OTHER_LANGUAGES = ["Arabic", "Bengali", "Chinese (Mandarin)", "Gujarati", "Italian", "Korean", "Marathi", "Portuguese", "Punjabi", "Russian", "Urdu"] as const;
export const ALL_LANGUAGES: readonly string[] = [...LANGUAGES, ...OTHER_LANGUAGES];

export const PROFICIENCY = ["beginner", "elementary", "intermediate", "advanced"] as const;
export type Proficiency = (typeof PROFICIENCY)[number];
export const PROFICIENCY_LABEL: Record<Proficiency, string> = { beginner: "Beginner", elementary: "Elementary", intermediate: "Intermediate", advanced: "Advanced" };

export const MAX_KNOWN = 12;
export const isProficiency = (v: string): v is Proficiency => (PROFICIENCY as readonly string[]).includes(v);
/** A language label we accept: 2–40 printable chars, no control characters. */
export const isLanguageLabel = (v: string) => v.trim().length >= 2 && v.trim().length <= 40 && !/[\u0000-\u001f<>]/.test(v);
