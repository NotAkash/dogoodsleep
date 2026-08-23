import Link from "next/link";
import { HomeArchivePreview } from "@/components/home-archive-preview";
import { HomeNowActivity } from "@/components/home-now-activity";
import { getHomeContent } from "@/data/home";
import { getJournalEntries } from "@/data/journal";
import { normalizeGalleryBaseUrl } from "@/data/remote-gallery";

export default function HomePage() {
    const imageApiUrl = normalizeGalleryBaseUrl(process.env.IMAGES_API_URL);
    const homeContent = getHomeContent();
    const journalEntries = getJournalEntries();
    const latestDrafts = journalEntries.slice(0, 2);

    return (
        <main className="home-page">
            <section className="home-hero">
                <div className="home-intro">
                    <p className="eyebrow">Akash · Toronto · Portfolio & Projects</p>
                    <h1>Do Good Sleep</h1>
                    <p className="home-deck">
                        Streets, rooms, passing faces, and late light—held in sequence
                        instead of left to disappear into a camera roll.
                    </p>
                    <div className="home-actions">
                        <Link className="primary-link" href="/places-faces">
                            View Places &amp; Faces
                        </Link>
                        <Link className="text-link" href="/journal">
                            Read the drafts
                        </Link>
                    </div>

                    <div className="home-index" aria-label="Latest drafts">
                        {latestDrafts.map((entry, index) => (
                            <Link
                                key={entry.slug}
                                href={`/journal/${entry.slug}`}
                                aria-label={`${entry.title}: ${entry.summary}`}
                            >
                                <span>
                                    {String(journalEntries.length - index).padStart(2, "0")}
                                </span>
                                <p>{entry.summary}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                <HomeArchivePreview imageApiUrl={imageApiUrl} />
            </section>

            <section className="home-now" aria-labelledby="home-now-title">
                <div className="home-now-meta">
                    <p className="eyebrow">{homeContent.rightNowLabel}</p>
                    {homeContent.updated ? <p>{homeContent.updated}</p> : null}
                </div>
                <h2 id="home-now-title">{homeContent.headline}</h2>
                <dl className="home-now-list">
                    <HomeNowActivity
                        activityApiUrl={
                            process.env.NEXT_PUBLIC_ACTIVITY_API_URL
                            ?? "https://api.dogoodsleep.com"
                        }
                    />
                    {homeContent.statusItems.map((item) => (
                        <div key={item.label}>
                            <dt>{item.label}</dt>
                            <dd>
                                {item.url ? (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${item.label}: ${item.value} (opens in a new tab)`}
                                    >
                                        {item.value} <span aria-hidden="true">↗</span>
                                    </a>
                                ) : item.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section className="home-links" aria-labelledby="home-links-title">
                <header className="home-links-header">
                    <p className="eyebrow">{homeContent.linksLabel}</p>
                    <h2 id="home-links-title">{homeContent.linksHeading}</h2>
                    <p>{homeContent.linksIntro}</p>
                </header>

                {homeContent.externalLinks.length > 0 ? (
                    <ol className="home-links-list">
                        {homeContent.externalLinks.map((link, index) => (
                            <li key={link.url}>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${link.title} (opens in a new tab)`}
                                >
                                    <span aria-hidden="true">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <strong>{link.title}</strong>
                                    <span>{link.note}</span>
                                    <span aria-hidden="true">↗</span>
                                </a>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="home-links-empty">{homeContent.linksEmpty}</p>
                )}
            </section>
        </main>
    );
}
