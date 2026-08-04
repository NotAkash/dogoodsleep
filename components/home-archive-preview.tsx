"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGalleryImages, type GalleryPage } from "@/data/remote-gallery";

type HomeArchivePreviewProps = {
  imageApiUrl: string;
};

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; page: GalleryPage }
  | { status: "error" };

const PREVIEW_LIMIT = 20;
const PREVIEW_COUNT = 3;

export function HomeArchivePreview({
  imageApiUrl,
}: HomeArchivePreviewProps) {
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      setState({ status: "loading" });

      try {
        const page = await getGalleryImages(
          imageApiUrl,
          "last",
          PREVIEW_LIMIT,
        );

        if (isMounted) {
          setState({ status: "ready", page });
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
        <p className="eyebrow">Archive connection</p>
        <p className="preview-state-title">The preview is off the light table.</p>
        <p>
          The archive is still here. Try the connection again or enter the full
          sequence.
        </p>
        <div className="preview-state-actions">
          <button type="button" onClick={() => setRequestKey((key) => key + 1)}>
            Try again
          </button>
          <Link href="/places-faces">Open archive</Link>
        </div>
      </div>
    );
  }

  const images = [...state.page.images].reverse().slice(0, PREVIEW_COUNT);

  if (images.length === 0) {
    return (
      <div className="preview-state preview-state-message">
        <p className="eyebrow">Latest sequence</p>
        <p className="preview-state-title">No frames in this set yet.</p>
        <Link className="text-link" href="/journal">
          Read the field notes
        </Link>
      </div>
    );
  }

  const pageEnd = state.page.hasPaginationMeta
    ? Math.min(state.page.page * PREVIEW_LIMIT, state.page.total)
    : images.length;

  return (
    <Link
      href="/places-faces"
      className="archive-preview"
      aria-label="Open the Places and Faces archive"
    >
      <div className="archive-preview-heading">
        <span>Latest sequence</span>
        <span>
          {state.page.hasPaginationMeta
            ? `${state.page.total} frames`
            : `${state.page.images.length} frames`}
        </span>
      </div>

      <div className="preview-grid">
        {images.map((image, index) => (
          <figure key={`${image.id}-${index}`} className="preview-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt} />
            <figcaption>
              <span>
                {state.page.hasPaginationMeta ? "Frame" : "Image"}{" "}
                {String(
                  state.page.hasPaginationMeta
                    ? Math.max(1, pageEnd - index)
                    : index + 1,
                ).padStart(state.page.hasPaginationMeta ? 3 : 2, "0")}
              </span>
              <span>{index === 0 ? "Recent" : "Archive"}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <span className="archive-preview-link">
        Enter the archive <span aria-hidden="true">↗</span>
      </span>
    </Link>
  );
}
