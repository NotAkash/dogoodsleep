"use client";

import { useEffect, useState } from "react";

const DEFAULT_STORYGRAPH_URL = "https://app.thestorygraph.com/";
const DEFAULT_LETTERBOXD_URL = "https://letterboxd.com/";
const LETTERBOXD_ORIGINS = new Set(["letterboxd.com", "www.letterboxd.com"]);
const ACTIVITY_API_VERSION = "2";

type DiaryEntry = {
  title: string;
  url: string;
  year?: string;
  rating?: number;
  posterUrl?: string;
};

type Activity = {
  reading: {
    profileUrl: string;
  };
  watching: {
    profileUrl: string;
    title?: string;
    url?: string;
    entries?: DiaryEntry[];
  };
};

const fallbackActivity: Activity = {
  reading: { profileUrl: DEFAULT_STORYGRAPH_URL },
  watching: { profileUrl: DEFAULT_LETTERBOXD_URL },
};

function isExternalUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isLetterboxdUrl(value: unknown): value is string {
  if (!isExternalUrl(value)) {
    return false;
  }

  const url = new URL(value);
  return url.protocol === "https:" && LETTERBOXD_ORIGINS.has(url.hostname);
}

function isLetterboxdPosterUrl(value: unknown): value is string {
  if (!isExternalUrl(value)) {
    return false;
  }

  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "a.ltrbxd.com"
    && url.pathname.startsWith("/resized/");
}

function normalizeDiaryEntries(value: unknown): DiaryEntry[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const candidate = entry as {
      title?: unknown;
      url?: unknown;
      year?: unknown;
      rating?: unknown;
      posterUrl?: unknown;
    };
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";

    if (!title || !isLetterboxdUrl(candidate.url)) {
      return [];
    }

    return [{
      title,
      url: candidate.url,
      ...(typeof candidate.year === "string" && /^\d{4}$/.test(candidate.year)
        ? { year: candidate.year }
        : {}),
      ...(typeof candidate.rating === "number"
        && Number.isFinite(candidate.rating)
        && candidate.rating >= 0
        && candidate.rating <= 5
        ? { rating: candidate.rating }
        : {}),
      ...(isLetterboxdPosterUrl(candidate.posterUrl) ? { posterUrl: candidate.posterUrl } : {}),
    }];
  }).slice(0, 3);

  return entries.length > 0 ? entries : undefined;
}

function starRating(rating: number): string {
  const halfSteps = Math.round(rating * 2);
  return `${"★".repeat(Math.floor(halfSteps / 2))}${halfSteps % 2 ? "½" : ""}`;
}

function entryLabel(entry: DiaryEntry): string {
  const year = entry.year ? `, ${entry.year}` : "";
  const rating = entry.rating === undefined ? "" : `, rated ${entry.rating} out of 5 stars`;
  return `Recently watched: ${entry.title}${year}${rating} on Letterboxd (opens in a new tab)`;
}

function normalizeActivity(value: unknown): Activity {
  if (!value || typeof value !== "object") {
    return fallbackActivity;
  }

  const activity = value as {
    reading?: { profileUrl?: unknown };
    watching?: {
      profileUrl?: unknown;
      title?: unknown;
      url?: unknown;
      entries?: unknown;
    };
  };
  const entries = normalizeDiaryEntries(activity.watching?.entries);

  return {
    reading: {
      profileUrl: isExternalUrl(activity.reading?.profileUrl)
        ? activity.reading.profileUrl
        : DEFAULT_STORYGRAPH_URL,
    },
    watching: {
      profileUrl: isExternalUrl(activity.watching?.profileUrl)
        ? activity.watching.profileUrl
        : DEFAULT_LETTERBOXD_URL,
      ...(typeof activity.watching?.title === "string" && activity.watching.title.trim()
        ? { title: activity.watching.title.trim() }
        : {}),
      ...(isExternalUrl(activity.watching?.url) ? { url: activity.watching.url } : {}),
      ...(entries ? { entries } : {}),
    },
  };
}

export function HomeNowActivity({ activityApiUrl }: { activityApiUrl: string }) {
  const [activity, setActivity] = useState<Activity>(fallbackActivity);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/activity", activityApiUrl);
    url.searchParams.set("version", ACTIVITY_API_VERSION);

    async function loadActivity() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          return;
        }

        setActivity(normalizeActivity(await response.json()));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Unable to load current activity", error);
        }
      }
    }

    void loadActivity();
    return () => controller.abort();
  }, [activityApiUrl]);

  const watchingUrl = activity.watching.url ?? activity.watching.profileUrl;
  const watchingTitle = activity.watching.title ?? "Letterboxd";
  const entries = activity.watching.entries;

  return (
    <>
      <div>
        <dt>Reading</dt>
        <dd>
          <a
            href={activity.reading.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Reading on StoryGraph (opens in a new tab)"
          >
            StoryGraph <span aria-hidden="true">↗</span>
          </a>
        </dd>
      </div>
      <div className="home-now-watching">
        <dt>Watching</dt>
        <dd aria-live="polite">
          {entries ? (
            <ul className="letterboxd-entries" aria-label="Recent Letterboxd watches">
              {entries.map((entry) => (
                <li key={entry.url}>
                  <a
                    className="letterboxd-card"
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={entryLabel(entry)}
                  >
                    {entry.posterUrl ? (
                      // Letterboxd supplies the public poster URL in its RSS feed.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="letterboxd-card-poster"
                        src={entry.posterUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="letterboxd-card-poster letterboxd-card-poster--missing" aria-hidden="true" />
                    )}
                    <span className="letterboxd-card-title">{entry.title}</span>
                    {entry.year || entry.rating !== undefined ? (
                      <span className="letterboxd-card-meta">
                        {entry.year ? entry.year : null}
                        {entry.year && entry.rating !== undefined ? " · " : null}
                        {entry.rating !== undefined ? starRating(entry.rating) : null}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <a
              href={watchingUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watching: ${watchingTitle} (opens in a new tab)`}
            >
              {watchingTitle} <span aria-hidden="true">↗</span>
            </a>
          )}
        </dd>
      </div>
    </>
  );
}
