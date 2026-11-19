import { notFound, redirect } from "next/navigation";
import { getCategory, isLearningCategory } from "@/lib/categories";
import { LanguageNav } from "@/components/language/LanguageNav";
import { CategoryBeacon } from "./CategoryBeacon";

/** Single gate for every category-scoped route. Unknown → 404; coming-soon → back to selection. */
export default async function CategoryLayout({ children, params }: LayoutProps<"/learn/[category]">) {
  const { category } = await params;
  if (!isLearningCategory(category)) {
    if (getCategory(category)) redirect("/learn");
    notFound();
  }
  return <>{category === "languages" && <LanguageNav />}{children}<CategoryBeacon category={category} /></>;
}
