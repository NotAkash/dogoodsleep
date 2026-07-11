import Link from "next/link";
import { getJournalEntries } from "@/data/journal";

export default function JournalPage() {
  const entries = getJournalEntries();

  return (
    <main className="mx-auto min-h-[calc(100vh-84px)] w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="border-b border-white/10 pb-8 sm:pb-10">
        <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">
          Journal
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-[-0.04em] text-white sm:text-5xl">
          Notes around images, places, and the moments between projects.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
          Entries now live as markdown files in `content/journal`, so writing is
          as simple as adding a new file with a title, date, summary, and body.
        </p>
      </section>

      <section className="grid gap-6 py-8 sm:py-10 lg:grid-cols-3">
        {entries.map((entry) => (
          <article
            key={entry.slug}
            className="flex h-full flex-col justify-between border border-white/10 bg-white/[0.03] p-6"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                {entry.date}
              </p>
              <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-white">
                {entry.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                {entry.summary}
              </p>
            </div>

            <Link
              href={`/journal/${entry.slug}`}
              className="mt-8 inline-flex w-fit border border-white/12 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/68 transition hover:border-white/28 hover:text-white"
            >
              Read entry
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
