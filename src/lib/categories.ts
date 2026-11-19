/**
 * Single source of truth for learning categories and route scoping.
 * Every category-scoped route lives under /learn/[category]/...
 */
export const ACTIVE_CATEGORIES = ["school", "jee", "neet"] as const;
export type CategorySlug = (typeof ACTIVE_CATEGORIES)[number];

/** Exam categories above carry the video library / papers / tests. "languages" is a community-only category. */
export const LANGUAGE_CATEGORY = "languages" as const;
export const LEARNING_CATEGORIES = [...ACTIVE_CATEGORIES, LANGUAGE_CATEGORY] as const;
export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];

export type CategoryInfo = {
  slug: string;
  name: string;
  tagline: string;
  available: boolean;
  /** key for the icon map used by UI components */
  icon: "school" | "atom" | "stethoscope" | "languages" | "code";
};

export const CATEGORIES: CategoryInfo[] = [
  { slug: "school", name: "School", tagline: "Classes 6–12 concepts, chapter by chapter.", available: true, icon: "school" },
  { slug: "jee", name: "JEE", tagline: "Physics, Chemistry and Maths for engineering entrances.", available: true, icon: "atom" },
  { slug: "neet", name: "NEET", tagline: "Physics, Chemistry and Biology for medical entrances.", available: true, icon: "stethoscope" },
  { slug: "languages", name: "Language Learning", tagline: "Practise speaking, chat in rooms and join the community.", available: true, icon: "languages" },
  { slug: "programming-ai", name: "Programming & AI", tagline: "Build real projects, from code to machine learning.", available: false, icon: "code" },
];

export function isActiveCategory(value: string): value is CategorySlug {
  return (ACTIVE_CATEGORIES as readonly string[]).includes(value);
}

/** Gate for every /learn/[category] route: exam categories plus languages. */
export function isLearningCategory(value: string): value is LearningCategory {
  return (LEARNING_CATEGORIES as readonly string[]).includes(value);
}
export const isLanguageCategory = (value: string) => value === LANGUAGE_CATEGORY;

export function getCategory(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
