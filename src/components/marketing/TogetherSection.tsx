import { Gamepad2, MessageSquare, Mic, UserPlus } from "lucide-react";

const ITEMS = [
  { icon: MessageSquare, title: "Group discussion and chat", body: "Real-time rooms for every category, plus private groups you create and share by invite link." },
  { icon: Mic, title: "Group voice", body: "Talk problems through live in a voice room, with your microphone only on while you are connected." },
  { icon: UserPlus, title: "Friends", body: "Find classmates by Student ID, send a request, and call each other once you are friends." },
  { icon: Gamepad2, title: "Games", body: "Multiplayer learning games are in development. They are labelled so you know what is live." },
];

export function TogetherSection() {
  return (
    <section id="together" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <h2 className="text-4xl sm:text-5xl">Hard chapters are easier with someone to ask</h2>
          <div className="foil mt-6" aria-hidden="true" />
          <p className="mt-5 max-w-sm text-muted-foreground">Everything stays inside your category, so School students talk to School students and JEE to JEE.</p>
        </div>
        <ul className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {ITEMS.map((it) => (
            <li key={it.title} className="border-t border-border py-7">
              <it.icon className="text-gold" size={24} strokeWidth={1.7} aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-muted-foreground">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
