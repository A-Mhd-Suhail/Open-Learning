import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { StudentCard } from "@/components/app/StudentCard";
import { Avatar } from "@/components/ui/avatar";
import { SectionCard } from "@/components/ui/section-card";
import { getCategory } from "@/lib/categories";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { profile } = await requireSession();
  const joined = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(profile.created_at));
  const role = profile.role === "admin" ? "Administrator" : "Student";
  const rows: [string, string][] = [
    ["Google account", profile.email],
    ["Learning path", profile.category ? (getCategory(profile.category)?.name ?? profile.category) : "Not selected yet"],
    ["Member since", joined],
  ];
  return (
    <>
      <PageHeader title="Your profile" description="Your name is the only thing you can change. Your Student ID and email are permanent."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-6">
          <StudentCard name={profile.display_name} studentId={profile.student_id} role={role} />
          <dl className="divide-y divide-border border-y border-border text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="min-w-0 break-all text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={profile.display_name} src={profile.avatar_url} size="xl" />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-semibold">{profile.display_name}</p>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
          <SectionCard title="Edit profile" description="This is how you appear to friends and in study groups.">
            <ProfileForm initialName={profile.display_name} />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
