import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // server-side role gate for every /admin page (RLS and API checks back this up)
  return children;
}
