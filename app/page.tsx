import Link from "next/link";
import { HomeArchivePreview } from "@/components/home-archive-preview";
import { normalizeGalleryBaseUrl } from "@/data/remote-gallery";

export default function HomePage() {
    const imageApiUrl = normalizeGalleryBaseUrl(process.env.IMAGES_API_URL);

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
                            Read the field notes
                        </Link>
                    </div>

                    <div className="home-index" aria-label="Site index">
                        <div>
                            <span>01</span>
                            <p>Photographs ordered twenty frames at a time.</p>
                        </div>
                        <div>
                            <span>02</span>
                            <p>Short notes on looking, places, and process.</p>
                        </div>
                    </div>
                </div>

                <HomeArchivePreview imageApiUrl={imageApiUrl} />
            </section>

            <section className="home-note">
                <p className="eyebrow">From the notebook</p>
                <blockquote>
                    “Places &amp; Faces works better when each frame can echo the one before it.”
                </blockquote>
                <div>
                    <p>
                        From <cite>Building the contact sheet</cite>, a note on giving each
                        sequence more room to breathe.
                    </p>
                    <Link className="text-link" href="/journal/contact-sheets">
                        Read the entry
                    </Link>
                </div>
            </section>
        </main>
    );
}
