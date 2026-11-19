import { requireSession } from "@/lib/auth";
import { IncomingCalls } from "./IncomingCalls";

export default async function FriendsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ category: string }> }) {
  const { user } = await requireSession();
  const { category } = await params;
  return <>{children}<IncomingCalls userId={user.id} category={category} /></>;
}
