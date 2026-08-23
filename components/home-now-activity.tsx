"use client";

import { useEffect, useState } from "react";

const DEFAULT_STORYGRAPH_URL = "https://app.thestorygraph.com/";
const DEFAULT_LETTERBOXD_URL = "https://letterboxd.com/";

type Activity = {
  reading: {
    profileUrl: string;
  };
  watching: {
    profileUrl: string;
    title?: string;
    url?: string;
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

function normalizeActivity(value: unknown): Activity {
  if (!value || typeof value !== "object") {
    return fallbackActivity;
  }

  const activity = value as {
    reading?: { profileUrl?: unknown };
    watching?: { profileUrl?: unknown; title?: unknown; url?: unknown };
  };

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
    },
  };
}

export function HomeNowActivity({ activityApiUrl }: { activityApiUrl: string }) {
  const [activity, setActivity] = useState<Activity>(fallbackActivity);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/activity", activityApiUrl).toString();

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
      <div>
        <dt>Watching</dt>
        <dd aria-live="polite">
          <a
            href={watchingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Recently Watched: ${watchingTitle} (opens in a new tab)`}
          >
            {watchingTitle} <span aria-hidden="true">↗</span>
          </a>
        </dd>
      </div>
    </>
  );
}
