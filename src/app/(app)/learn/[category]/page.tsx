import type { Metadata } from "next";
import { BookOpen, ClipboardCheck, FileText, Gamepad2, PlayCircle, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LanguageDashboard } from "@/components/language/dashboard/LanguageDashboard";
import { ButtonLink } from "@/components/ui/button";
import { RowLink, RowList } from "@/components/ui/row-link";
import { getCategory, isLanguageCategory } from "@/lib/categories";
import { KIND_INFO, KINDS } from "@/lib/groups";
import { BranchPanel } from "./BranchPanel";

export const metadata: Metadata = { title: "Learning dashboard" };

export default async function CategoryDashboard({ params }: PageProps<"/learn/[category]">) {
  const { category } = await params;
  if (isLanguageCategory(category)) return <LanguageDashboard />;
  const info = getCategory(category)!;
  const self = `/learn/${category}/self-learning`;
  const friends = `/learn/${category}/friends`;
  return (
    <>
      <PageHeader title={`${info.name} learning`} description={info.tagline}
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name }]} />
      <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        <BranchPanel icon={BookOpen} title="Self Learning" description="Learn at your own pace, any time."
          action={<ButtonLink href={`${self}/videos`} variant="accent"><PlayCircle size={16} aria-hidden="true" />Open video library</ButtonLink>}>
          <RowList className="border-y-0">
            <li><RowLink icon={PlayCircle} title="Videos" description="Browse and filter lessons by class, subject, chapter and topic." href={`${self}/videos`} /></li>
            <li><RowLink icon={FileText} title="Question papers" description="Previous year and practice papers." badge="Coming soon" /></li>
            <li><RowLink icon={ClipboardCheck} title="Tests" description="Timed tests to measure your progress." badge="Coming soon" /></li>
          </RowList>
        </BranchPanel>
        <BranchPanel icon={Users} title="Learn With Friends" description={`Study ${info.name} together: talk, chat and call.`}
          action={<ButtonLink href={friends} variant="secondary"><Users size={16} aria-hidden="true" />Open study groups</ButtonLink>}>
          <RowList className="border-y-0">
            {KINDS.map((k) => <li key={k}><RowLink icon={KIND_INFO[k].icon} title={KIND_INFO[k].title} description={KIND_INFO[k].blurb} href={`${friends}/${k}`} /></li>)}
            <li><RowLink icon={UserPlus} title="Friends" description="Find students by ID, add friends, call and study together." href={`${friends}/my-friends`} /></li>
            <li><RowLink icon={Gamepad2} title="Games" description="Multiplayer learning games." badge="Coming soon" /></li>
          </RowList>
        </BranchPanel>
      </div>
    </>
  );
}
