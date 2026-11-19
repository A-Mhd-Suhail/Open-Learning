import { LibraryPreview } from "./LibraryPreview";
import { SectionHead } from "./SectionHead";

export function LibrarySection() {
  return (
    <section id="library" className="scroll-mt-20 border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <SectionHead eyebrow="The video library" title="Find the exact lesson, not just a playlist">
          Search by words, or narrow step by step: class, subject, chapter, topic, year and language. Open any lesson on YouTube in a new tab.
        </SectionHead>
        <LibraryPreview />
      </div>
    </section>
  );
}
