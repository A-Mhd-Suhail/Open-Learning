import { BookOpen, Languages, MessageSquare, Mic, Newspaper, UserPlus } from "lucide-react";
import { SectionHead } from "./SectionHead";

const ITEMS = [
  { icon: BookOpen, title: "Video library", body: "Lessons for School, JEE and NEET. Search, then narrow by class, subject, chapter, topic, year and language. Each lesson opens on YouTube." },
  { icon: MessageSquare, title: "Study groups", body: "Discussion and chat for every path, plus private groups you create and share with an invite link." },
  { icon: Languages, title: "Language Learning", body: "A space to practise a language with other learners, with rooms and a community of its own." },
  { icon: UserPlus, title: "Friends", body: "Find classmates by Student ID, send a request, then chat and call once they accept." },
  { icon: Mic, title: "Voice and chat rooms", body: "Talk a problem through live. Your microphone is only on while you are connected to a room." },
  { icon: Newspaper, title: "Community feed and stories", body: "Post, like and comment in the language community, and share stories." },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
        <SectionHead eyebrow="What you can do" title="Everything a student needs to learn with others">
          Lessons to learn from, and people to learn with. Everything below is live today.
        </SectionHead>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {ITEMS.map((it) => (
            <li key={it.title} className="border-t border-border py-7 first:border-t-0 sm:first:border-t sm:[&:nth-child(2)]:border-t">
              <it.icon className="text-gold" size={24} strokeWidth={1.7} aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl font-semibold leading-snug">{it.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
