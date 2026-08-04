import Link from "next/link";
import { notFound } from "next/navigation";
import { getJournalEntries, getJournalEntry } from "@/data/journal";

type JournalEntryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getJournalEntries().map((entry) => ({
    slug: entry.slug,
  }));
}

export default async function JournalEntryPage({
  params,
}: JournalEntryPageProps) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);

  if (!entry) {
    notFound();
  }

  const entries = getJournalEntries();
  const entryIndex = entries.findIndex((candidate) => candidate.slug === slug);
  const entryNumber = String(entryIndex + 1).padStart(2, "0");
  const entryCount = String(entries.length).padStart(2, "0");

  return (
    <main className="paper-page min-h-[calc(100vh-65px)] bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <span aria-hidden="true">←</span>
          Journal index
        </Link>

        <header className="mt-8 grid gap-5 border-y border-[var(--rule)] py-8 sm:mt-12 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6 sm:py-12 lg:py-16">
          <p className="font-mono text-[11px] tracking-[0.16em] text-[var(--accent)]">
            {entryNumber} / {entryCount}
          </p>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)] sm:text-[11px]">
              {entry.date}
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              {entry.title}
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              {entry.summary}
            </p>
          </div>
        </header>

        <div className="grid gap-8 py-10 sm:grid-cols-[4rem_minmax(0,44rem)] sm:gap-6 sm:py-14 lg:py-16">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
            Field note
          </p>
          <article
            className="journal-entry max-w-[44rem]"
            dangerouslySetInnerHTML={{ __html: entry.html }}
          />
        </div>

        <footer className="border-t border-[var(--rule)] pt-6">
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <span aria-hidden="true">←</span>
            All field notes
          </Link>
        </footer>
      </div>
    </main>
  );
}
