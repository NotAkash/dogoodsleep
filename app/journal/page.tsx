import Link from "next/link";
import { getJournalEntries } from "@/data/journal";

export default function JournalPage() {
  const entries = getJournalEntries();

  return (
    <main className="paper-page min-h-[calc(100vh-65px)] bg-[var(--paper)] text-[var(--ink)]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="journal-masthead grid gap-6 border-b border-[var(--rule)] pb-10 sm:pb-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
              Journal / {String(entries.length).padStart(2, "0")} notes
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Field notes from Places &amp; Faces.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-[var(--muted)] sm:text-base">
            On sequence, memory, and the small details that pull a camera back
            to a place.
          </p>
        </div>

        <ol className="journal-index border-t border-[var(--rule)]">
          {entries.map((entry, index) => (
            <li key={entry.slug} className="border-b border-[var(--rule)]">
              <Link
                href={`/journal/${entry.slug}`}
                className="group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-x-3 gap-y-4 py-6 transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:grid-cols-[4rem_9rem_minmax(0,1fr)_auto] sm:items-start sm:gap-x-5 sm:py-8"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] tracking-[0.16em] text-[var(--accent)]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[11px]">
                  {entry.date}
                </span>
                <div className="col-span-2 col-start-2 sm:col-span-1 sm:col-start-auto">
                  <h2 className="font-serif text-2xl leading-tight tracking-[-0.025em] text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:text-3xl">
                    {entry.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:leading-7">
                    {entry.summary}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="text-lg leading-none text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
