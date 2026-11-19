import { notFound } from "next/navigation";
import { isLanguageCategory } from "@/lib/categories";

/** Videos, papers and tests exist only for the exam categories; Language Learning has no self-learning library. */
export default async function SelfLearningLayout({ children, params }: { children: React.ReactNode; params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (isLanguageCategory(category)) notFound();
  return <>{children}</>;
}
