"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getHomeGalleryPreview,
  type HomeGalleryPreview,
} from "@/data/remote-gallery";

type HomeArchivePreviewProps = {
  imageApiUrl: string;
};

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; preview: HomeGalleryPreview }
  | { status: "error" };

export function HomeArchivePreview({
  imageApiUrl,
}: HomeArchivePreviewProps) {
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [portraitImageIds, setPortraitImageIds] = useState<Set<string>>(
    () => new Set(),
  );

  function recordImageOrientation(
    imageId: string,
    image: HTMLImageElement,
  ) {
    const isPortrait = image.naturalHeight > image.naturalWidth;

    setPortraitImageIds((current) => {
      if (current.has(imageId) === isPortrait) {
        return current;
      }

      const next = new Set(current);

      if (isPortrait) {
        next.add(imageId);
      } else {
        next.delete(imageId);
      }

      return next;
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      setState({ status: "loading" });

      try {
        const preview = await getHomeGalleryPreview(imageApiUrl);

        if (isMounted) {
          setState({ status: "ready", preview });
        }
      } catch {
        if (isMounted) {
          setState({ status: "error" });
        }
      }
    }

    void loadPreview();

    return () => {
      isMounted = false;
    };
  }, [imageApiUrl, requestKey]);

  if (state.status === "loading") {
    return (
      <div
        className="preview-state preview-state-loading"
        aria-label="Loading recent photographs"
        aria-live="polite"
      >
        <span className="preview-placeholder preview-placeholder-primary" />
        <span className="preview-placeholder" />
        <span className="preview-placeholder" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="preview-state preview-state-message" role="status">
        <p className="eyebrow">Places &amp; Faces connection</p>
        <p className="preview-state-title">The preview is off the light table.</p>
        <p>
          Places &amp; Faces is still here. Try the connection again or enter the full
          sequence.
        </p>
        <div className="preview-state-actions">
          <button type="button" onClick={() => setRequestKey((key) => key + 1)}>
            Try again
          </button>
          <Link href="/places-faces">View Places &amp; Faces</Link>
        </div>
      </div>
    );
  }

  const { frames, hasPaginationMeta, total } = state.preview;

  if (frames.length === 0) {
    return (
      <div className="preview-state preview-state-message">
        <p className="eyebrow">Archive sampler</p>
        <p className="preview-state-title">No frames in this set yet.</p>
        <Link className="text-link" href="/journal">
          Read the drafts
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/places-faces"
      className="archive-preview"
      aria-label="View Places & Faces"
    >
      <div className="archive-preview-heading">
        <span>Archive sampler</span>
        <span>
          {hasPaginationMeta
            ? `${total} frames`
            : `${frames.length} frames`}
        </span>
      </div>

      <div className="preview-grid">
        {frames.map(({ image, frameNumber }, index) => (
          <figure
            key={`${image.id}-${index}`}
            className={`preview-frame${
              portraitImageIds.has(image.id) ? " preview-frame-portrait" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              onLoad={(event) => {
                recordImageOrientation(image.id, event.currentTarget);
              }}
            />
            <figcaption>
              <span>
                {hasPaginationMeta ? "Frame" : "Image"}{" "}
                {String(frameNumber).padStart(hasPaginationMeta ? 3 : 2, "0")}
              </span>
              <span>{frameNumber === total ? "Latest" : "Places & Faces"}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <span className="archive-preview-link">
        View Places &amp; Faces <span aria-hidden="true">↗</span>
      </span>
    </Link>
  );
}
