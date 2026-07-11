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

  return (
    <main className="mx-auto min-h-[calc(100vh-84px)] w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="border-b border-white/10 pb-8">
        <Link
          href="/journal"
          className="text-[11px] uppercase tracking-[0.28em] text-white/45 transition hover:text-white/70"
        >
          Back to journal
        </Link>
        <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-white/38">
          {entry.date}
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.04em] text-white sm:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
          {entry.summary}
        </p>
      </div>

      <article
        className="journal-entry prose prose-invert max-w-none py-8 text-white/75"
        dangerouslySetInnerHTML={{ __html: entry.html }}
      />
    </main>
  );
}
