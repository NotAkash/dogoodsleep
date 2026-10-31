import Link from "next/link";
import { HomeArchivePreview } from "@/components/home-archive-preview";
import { HomeNowActivity } from "@/components/home-now-activity";
import { getHomeContent } from "@/data/home";
import { getJournalEntries } from "@/data/journal";
import { normalizeGalleryBaseUrl } from "@/data/remote-gallery";

export default function HomePage() {
    const imageApiUrl = normalizeGalleryBaseUrl(
        process.env.IMAGES_API_URL ?? "https://api.dogoodsleep.com",
    );
    const homeContent = getHomeContent();
    const journalEntries = getJournalEntries();
    const latestDrafts = journalEntries.slice(0, 2);

    return (
        <main id="main-content" className="home-page">
            <section className="home-hero">
                <div className="home-intro">
                    <p className="eyebrow">Akash Singh -- Toronto, ON</p>
                    <h1>Pictures, notes, and things in progress.</h1>
                    <div className="home-actions">
                        <Link className="primary-link" href="/places-faces">
                            View Places &amp; Faces
                        </Link>
                        <Link className="text-link" href="/journal">
                            Read the drafts
                        </Link>
                    </div>

                    <div className="home-index" aria-label="Latest drafts">
                        {latestDrafts.map((entry) => (
                            <Link
                                key={entry.slug}
                                href={`/journal/${entry.slug}`}
                                aria-label={`${entry.title}: ${entry.summary}`}
                            >
                                <span className="home-draft-date">{entry.date}</span>
                                <h2>{entry.title}</h2>
                                <p>{entry.summary}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                <HomeArchivePreview imageApiUrl={imageApiUrl} />
            </section>

            <section className="home-now" aria-label="Reading, watching and building">
                <HomeNowActivity
                    activityApiUrl={process.env.NEXT_PUBLIC_ACTIVITY_API_URL ?? "https://api.dogoodsleep.com"}
                    statusItems={homeContent.statusItems}
                />
            </section>

            <section className="home-links" aria-labelledby="home-links-title">
                <h2 id="home-links-title">{homeContent.linksLabel}</h2>

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
