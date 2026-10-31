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
    <main id="main-content" className="article-wrap">
      <Link href="/journal" className="back-link">← Journal index</Link>
      <header className="article-head">
        <p className="eyebrow">{entry.date} · Draft</p>
        <h1>{entry.title}</h1>
        <p className="article-summary">{entry.summary}</p>
      </header>
      <article className="journal-entry" dangerouslySetInnerHTML={{ __html: entry.html }} />
      <footer className="article-footer">
        <Link href="/journal" className="back-link">← All drafts.</Link>
      </footer>
    </main>
  );
}
