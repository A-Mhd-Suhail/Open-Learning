import { Atom, Code2, Languages, School, Stethoscope, type LucideIcon } from "lucide-react";
import type { CategoryInfo } from "@/lib/categories";

export const CATEGORY_ICONS: Record<CategoryInfo["icon"], LucideIcon> = {
  school: School,
  atom: Atom,
  stethoscope: Stethoscope,
  languages: Languages,
  code: Code2,
};
