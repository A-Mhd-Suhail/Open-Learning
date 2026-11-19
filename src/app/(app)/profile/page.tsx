import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton } from "@/components/app/CopyButton";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { profile } = await requireSession();
  const joined = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(profile.created_at));
  const rows: [string, React.ReactNode][] = [
    ["Student ID", <span key="id" className="inline-flex items-center gap-1 font-mono">{profile.student_id}<CopyButton value={profile.student_id} label="Copy Student ID" /></span>],
    ["Google account", profile.email],
    ["Learning category", profile.category ? (profile.category === "school" ? "School" : profile.category.toUpperCase()) : "Not selected yet"],
    ["Member since", joined],
  ];
  return (
    <>
      <PageHeader title="Your profile" crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <section>
          <div className="mb-6 flex items-center gap-4">
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt="" width={64} height={64} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full border border-border object-cover" />
              : <span aria-hidden="true" className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-on-primary">{profile.display_name[0]?.toUpperCase()}</span>}
            <div><p className="font-display text-xl font-semibold">{profile.display_name}</p><p className="text-sm text-muted-foreground">{profile.role === "admin" ? "Administrator" : "Student"}</p></div>
          </div>
          <dl className="divide-y divide-border border-y border-border text-sm">
            {rows.map(([k, v]) => (<div key={k} className="flex justify-between gap-4 py-3.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>))}
          </dl>
        </section>
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl">Edit profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your Student ID and email are permanent and cannot be changed.</p>
          <ProfileForm initialName={profile.display_name} />
        </section>
      </div>
    </>
  );
}
