"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

const EMPTY_PREVIEW_FRAMES: HomeGalleryPreview["frames"] = [];

export function HomeArchivePreview({
  imageApiUrl,
}: HomeArchivePreviewProps) {
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [portraitImageIds, setPortraitImageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [supportingFrameWidth, setSupportingFrameWidth] = useState<number | null>(
    null,
  );
  const previewGridRef = useRef<HTMLDivElement>(null);
  const measureSupportingFramesRef = useRef<() => void>(() => {});

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

  const readyPreview = state.status === "ready" ? state.preview : null;
  const frames = readyPreview?.frames ?? EMPTY_PREVIEW_FRAMES;
  const hasPortraitSupportingFrame =
    frames.length >= 3 &&
    !portraitImageIds.has(frames[0].image.id) &&
    (
      portraitImageIds.has(frames[1].image.id) ||
      portraitImageIds.has(frames[2].image.id)
    );

  useEffect(() => {
    const grid = previewGridRef.current;

    if (!grid || frames.length < 3) {
      setSupportingFrameWidth(null);
      return;
    }

    const activeGrid = grid;

    let animationFrame = 0;

    function measureSupportingFrames() {
      if (window.innerWidth <= 560) {
        setSupportingFrameWidth(null);
        return;
      }

      const figures = Array.from(
        activeGrid.querySelectorAll<HTMLElement>(".preview-frame"),
      );
      const images = figures.map((figure) => figure.querySelector("img"));

      if (
        figures.length < 3 ||
        images.some((image) => !image?.complete || !image.naturalWidth)
      ) {
        return;
      }

      const gridStyles = window.getComputedStyle(activeGrid);
      const columnWidths = gridStyles.gridTemplateColumns
        .match(/(?:\d*\.)?\d+px/g)
        ?.map(Number.parseFloat);
      const supportingColumnWidth = columnWidths?.at(-1);

      if (!supportingColumnWidth) {
        return;
      }

      const leadHeight = figures[0].getBoundingClientRect().height;
      const rowGap = Number.parseFloat(gridStyles.rowGap) || 0;
      const captionHeight = figures.slice(1, 3).reduce((total, figure) => {
        return total + (figure.querySelector("figcaption")?.getBoundingClientRect().height ?? 0);
      }, 0);
      const fullSupportingImageHeight = images.slice(1, 3).reduce(
        (total, image) => {
          return total + supportingColumnWidth * (image!.naturalHeight / image!.naturalWidth);
        },
        0,
      );
      const availableImageHeight = Math.max(
        0,
        leadHeight - rowGap - captionHeight,
      );
      const scale = Math.min(
        1,
        availableImageHeight / fullSupportingImageHeight,
      );
      const nextWidth = scale < 0.995
        ? Math.max(1, Math.round(supportingColumnWidth * scale * 100) / 100)
        : null;

      setSupportingFrameWidth((current) => {
        if (
          current === nextWidth ||
          (current !== null && nextWidth !== null && Math.abs(current - nextWidth) < 0.5)
        ) {
          return current;
        }

        return nextWidth;
      });
    }

    function scheduleMeasurement() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measureSupportingFrames);
    }

    const resizeObserver = new ResizeObserver(scheduleMeasurement);
    measureSupportingFramesRef.current = scheduleMeasurement;
    resizeObserver.observe(activeGrid);
    scheduleMeasurement();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      measureSupportingFramesRef.current = () => {};
    };
  }, [frames, hasPortraitSupportingFrame]);

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

  const { hasPaginationMeta, total } = state.preview;

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

      <div
        ref={previewGridRef}
        className={`preview-grid${
          hasPortraitSupportingFrame ? " preview-grid-portrait-support" : ""
        }${supportingFrameWidth ? " preview-grid-support-balanced" : ""}`}
      >
        {frames.map(({ image, frameNumber }, index) => (
          <figure
            key={`${image.id}-${index}`}
            className={`preview-frame${
              portraitImageIds.has(image.id) ? " preview-frame-portrait" : ""
            }`}
            style={
              index > 0 && supportingFrameWidth
                ? { width: `${supportingFrameWidth}px` }
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              onLoad={(event) => {
                recordImageOrientation(image.id, event.currentTarget);
                measureSupportingFramesRef.current();
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
