import { Gamepad2, MessageSquare, Mic, UserPlus } from "lucide-react";

const ITEMS = [
  { icon: MessageSquare, title: "Group discussion and chat", body: "Real-time rooms for every category, plus private groups you create and share by invite link." },
  { icon: Mic, title: "Group voice", body: "Talk problems through live in a voice room, with your microphone only on while you are connected." },
  { icon: UserPlus, title: "My friends", body: "Find classmates by Student ID, send a request, and call each other once you are friends." },
  { icon: Gamepad2, title: "Games", body: "Multiplayer learning games are in development. They are labelled so you know what is live." },
];

export function TogetherSection() {
  return (
    <section id="together" className="scroll-mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="text-3xl sm:text-4xl">Hard chapters are easier with someone to ask</h2>
          <p className="mt-4 max-w-sm text-muted-foreground">Everything stays inside your category, so School students talk to School students and JEE to JEE.</p>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {ITEMS.map((it) => (
            <li key={it.title} className="bg-card p-6">
              <it.icon className="text-primary" size={22} strokeWidth={1.7} aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
