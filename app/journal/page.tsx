import Link from "next/link";
import { getJournalEntries } from "@/data/journal";

export default function JournalPage() {
  const entries = getJournalEntries();
  return (
    <main id="main-content" className="page-wrap journal-page">
      <p className="eyebrow">Journal / {String(entries.length).padStart(2, "0")} entries</p>
      <h1 className="page-title">Drafts from my journal.</h1>
      <p className="journal-intro">
        What did Greg Heffley say? &quot;It&apos;s not a diary, it&apos;s a journal.&quot; This is a journal.
        It is not a blog, and it most definitely is not a substack. I don&apos;t actually know what this is.
      </p>
      <ol className="journal-index">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link href={`/journal/${entry.slug}`} className="journal-row">
              <span className="journal-date">{entry.date}</span>
              <div><h2>{entry.title}</h2><p>{entry.summary}</p></div>
              <span aria-hidden="true" className="journal-arrow">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
