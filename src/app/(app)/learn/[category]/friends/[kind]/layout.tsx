import { notFound } from "next/navigation";
import { isKind } from "@/lib/groups";

export default async function KindLayout({ children, params }: { children: React.ReactNode; params: Promise<{ kind: string }> }) {
  if (!isKind((await params).kind)) notFound();
  return children;
}
