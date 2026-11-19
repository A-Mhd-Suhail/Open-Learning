import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { RowLink, RowList } from "@/components/ui/row-link";
import { StudentCard } from "@/components/app/StudentCard";
import { ACTIVE_CATEGORIES, CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile } = await requireSession();
  const first = profile.display_name.split(" ")[0];
  return (
    <div className="space-y-16">
      <section className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl">Welcome, {first}</h1>
          <div className="foil mt-6" aria-hidden="true" />
          <p className="mt-5 max-w-md text-muted-foreground">Pick a path, find a lesson, or open a study group.</p>
          <ButtonLink href="/learn" size="lg" className="mt-8">Start learning</ButtonLink>
        </div>
        <StudentCard name={profile.display_name} studentId={profile.student_id} role={profile.role === "admin" ? "Administrator" : "Student"} />
      </section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-14">
        <section aria-labelledby="cats">
          <h2 id="cats" className="mb-4 text-2xl">Learning paths</h2>
          <RowList>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <RowLink icon={CATEGORY_ICONS[c.icon]} title={c.name} description={c.tagline}
                  href={c.available ? `/learn/${c.slug}` : undefined} badge={c.available ? undefined : "Coming soon"} />
              </li>
            ))}
          </RowList>
        </section>

        <section aria-labelledby="friends">
          <h2 id="friends" className="mb-4 text-2xl">Study with friends</h2>
          <RowList>
            {ACTIVE_CATEGORIES.map((slug) => (
              <li key={slug}>
                <RowLink icon={Users} title={`${slug === "school" ? "School" : slug.toUpperCase()} study groups`}
                  description="Discussion, chat, voice and friends." href={`/learn/${slug}/friends`} />
              </li>
            ))}
          </RowList>
        </section>
      </div>
    </div>
  );
}
