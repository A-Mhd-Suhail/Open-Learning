const STEPS = [
  { title: "Sign in with Google", body: "Tell us your name, continue with Google, and you get a permanent Student ID." },
  { title: "Pick your path", body: "Choose School, JEE or NEET. Each opens its own learning space." },
  { title: "Find the lesson", body: "Filter by class, subject, chapter, topic, year and language, then watch it on YouTube." },
  { title: "Study with friends", body: "Join discussions, chats and voice rooms, or add classmates by their Student ID." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="text-3xl sm:text-4xl">From first visit to first lesson in a minute</h2>
          <p className="mt-4 max-w-sm text-muted-foreground">No forms to fill and nothing to install.</p>
        </div>
        <ol className="divide-y divide-border border-y border-border">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 py-6">
              <span className="num font-display text-2xl font-semibold text-muted-foreground">{i + 1}</span>
              <div>
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-1.5 max-w-md text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
