"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGalleryImageLocation,
  getGalleryImages,
  type ArchiveFolder,
  type GalleryImage,
  type GalleryPageRequest,
} from "@/data/remote-gallery";

type PlacesFacesGalleryProps = {
  imageApiUrl: string;
};

const IMAGES_PER_PAGE = 20;

type ArchiveIndexProps = {
  archiveTotal: number;
  folders: ArchiveFolder[];
  loading: boolean;
  onSelect: (folder: string | null, hasChildren: boolean) => void;
  selectedFolder: string | null;
};

function ArchiveFolderItems({
  folders,
  onSelect,
  selectedFolder,
}: Pick<ArchiveIndexProps, "folders" | "onSelect" | "selectedFolder">) {
  return (
    <ul className="archive-folder-list">
      {folders.map((folder) => {
        const hasChildren = folder.children.length > 0;
        const isExpanded = hasChildren && (
          selectedFolder === folder.id
          || selectedFolder?.startsWith(`${folder.id}/`) === true
        );

        return (
          <li key={folder.id}>
            <button
              type="button"
              className="archive-folder-button"
              aria-current={selectedFolder === folder.id ? "page" : undefined}
              aria-expanded={hasChildren ? isExpanded : undefined}
              onClick={() => onSelect(folder.id, hasChildren)}
            >
              <span className="archive-folder-label">
                <span>{folder.label}</span>
                {hasChildren ? (
                  <span className="archive-folder-disclosure" aria-hidden="true">
                    {isExpanded ? "−" : "+"}
                  </span>
                ) : null}
              </span>
              <span className="archive-folder-count" aria-hidden="true">
                {folder.imageCount}
              </span>
            </button>
            {isExpanded ? (
              <ArchiveFolderItems
                folders={folder.children}
                onSelect={onSelect}
                selectedFolder={selectedFolder}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ArchiveIndex({
  archiveTotal,
  folders,
  loading,
  onSelect,
  selectedFolder,
}: ArchiveIndexProps) {
  return (
    <nav className="archive-index" aria-label="Places & Faces folders">
      <button
        type="button"
        className="archive-folder-button archive-folder-all"
        aria-current={selectedFolder === null ? "page" : undefined}
        onClick={() => onSelect(null, false)}
      >
        <span>All photos</span>
        <span className="archive-folder-count" aria-hidden="true">
          {loading && archiveTotal === 0 ? "—" : archiveTotal}
        </span>
      </button>
      {folders.length > 0 ? (
        <ArchiveFolderItems
          folders={folders}
          onSelect={onSelect}
          selectedFolder={selectedFolder}
        />
      ) : (
        <p className="archive-index-state">
          {loading ? "Reading folder index…" : "No folders returned."}
        </p>
      )}
    </nav>
  );
}

export function PlacesFacesGallery({
  imageApiUrl,
}: PlacesFacesGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [requestedPage, setRequestedPage] =
    useState<GalleryPageRequest>(1);
  const [total, setTotal] = useState(0);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPaginationMeta, setHasPaginationMeta] = useState(false);
  const [folders, setFolders] = useState<ArchiveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [mobileIndexOpen, setMobileIndexOpen] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const galleryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileSummaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      try {
        setLoading(true);
        setError(null);
        setImages([]);

        const nextPage = await getGalleryImages(
          imageApiUrl,
          requestedPage,
          IMAGES_PER_PAGE,
          selectedFolder ?? undefined,
        );

        if (isMounted) {
          setImages(nextPage.images);
          setPage(nextPage.page);
          setTotal(nextPage.total);
          setTotalPages(nextPage.totalPages);
          setHasPaginationMeta(nextPage.hasPaginationMeta);
          setFolders(nextPage.folders);
          if (selectedFolder === null) {
            setArchiveTotal(nextPage.total);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load gallery images",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      isMounted = false;
    };
  }, [imageApiUrl, requestedPage, selectedFolder, loadAttempt]);

  const isViewerOpen = activeIndex !== null;

  useEffect(() => {
    if (!isViewerOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const backgroundStates = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          !element.contains(dialogRef.current) &&
          !["SCRIPT", "STYLE"].includes(element.tagName),
      )
      .map((element) => ({
        element,
        ariaHidden: element.getAttribute("aria-hidden"),
        wasInert: element.hasAttribute("inert"),
      }));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight" && images.length > 1) {
        event.preventDefault();
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return (currentIndex + 1) % images.length;
        });
        return;
      }

      if (event.key === "ArrowLeft" && images.length > 1) {
        event.preventDefault();
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return (currentIndex - 1 + images.length) % images.length;
        });
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    backgroundStates.forEach(({ element }) => {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("inert", "");
    });
    window.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      backgroundStates.forEach(
        ({ element, ariaHidden, wasInert }) => {
          if (ariaHidden === null) {
            element.removeAttribute("aria-hidden");
          } else {
            element.setAttribute("aria-hidden", ariaHidden);
          }

          if (!wasInert) {
            element.removeAttribute("inert");
          }
        },
      );
      window.removeEventListener("keydown", handleKeyDown);
      const trigger = galleryTriggerRef.current;

      if (trigger?.isConnected) {
        window.requestAnimationFrame(() => trigger.focus());
      }
    };
  }, [isViewerOpen, images.length]);

  useEffect(() => {
    if (activeIndex === null || images.length < 2) {
      return;
    }

    const nextIndex = (activeIndex + 1) % images.length;
    const previousIndex = (activeIndex - 1 + images.length) % images.length;

    [images[nextIndex], images[previousIndex]].forEach((image) => {
      const preload = new Image();
      preload.src = image.src;
    });
  }, [activeIndex, images]);

  useEffect(() => {
    setActiveIndex(null);
  }, [requestedPage, selectedFolder]);

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const activeImageLocation = activeImage
    ? getGalleryImageLocation(activeImage.id)
    : null;
  const pageOffset = (page - 1) * IMAGES_PER_PAGE;
  const visibleFrameHigh = images.length === 0 ? 0 : total - pageOffset;
  const visibleFrameLow = images.length === 0
    ? 0
    : Math.max(1, visibleFrameHigh - images.length + 1);
  const frameDigits = Math.max(3, String(Math.max(total, images.length)).length);
  const loadingFrames = Array.from(
    { length: IMAGES_PER_PAGE },
    (_, index) => index,
  );

  const formatFrameNumber = (frameNumber: number) =>
    String(frameNumber).padStart(frameDigits, "0");

  const getFrameNumber = (index: number) =>
    hasPaginationMeta ? total - pageOffset - index : images.length - index;

  const getFrameLabel = (index: number) => {
    const frameNumber = formatFrameNumber(getFrameNumber(index));

    return hasPaginationMeta ? `Frame ${frameNumber}` : `Set frame ${frameNumber}`;
  };

  const errorDetail =
    error === "Missing IMAGES_API_URL"
      ? "The Places & Faces source is not connected in this environment."
      : error?.startsWith("Image worker request failed:")
        ? `The Places & Faces service returned ${error.replace("Image worker request failed: ", "status ")}.`
        : "The Places & Faces service did not return a usable response.";

  const handlePrevious = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return (currentIndex - 1 + images.length) % images.length;
    });
  };

  const handleNext = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return (currentIndex + 1) % images.length;
    });
  };

  const getImageKey = (image: GalleryImage, index: number) =>
    `${selectedFolder ?? "all"}-${page}-${image.id}-${index}`;

  const handleFolderSelect = (
    folder: string | null,
    hasChildren = false,
  ) => {
    if (mobileIndexOpen && !hasChildren) {
      setMobileIndexOpen(false);
      window.requestAnimationFrame(() => mobileSummaryRef.current?.focus());
    }

    if (folder === selectedFolder) {
      return;
    }

    galleryTriggerRef.current = null;
    setActiveIndex(null);
    setSelectedFolder(folder);
    setRequestedPage(1);
  };

  return (
    <section className="archive-sheet mx-auto w-full max-w-[1680px]" aria-labelledby="archive-title">
      <div
        className="archive-surface"
        aria-hidden={activeImage ? true : undefined}
        inert={activeImage ? true : undefined}
      >
        <header className="archive-folio mb-14 sm:mb-20 lg:mb-24">
          <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-16">
            <div>
              <p className="archive-kicker text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
                Places &amp; Faces · Newest first
              </p>
              <h1
                id="archive-title"
                className="archive-title mt-5 text-5xl leading-[0.84] text-[var(--ink)] sm:text-7xl lg:text-[8.5rem]"
              >
                Places &amp; Faces
              </h1>
            </div>

            <dl
              className="archive-folio-meta grid grid-cols-3 gap-x-8 gap-y-4 text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] sm:text-right sm:text-[10px]"
              aria-live="polite"
            >
              <div>
                <dt>Set</dt>
                <dd className="mt-1.5 font-medium text-[var(--ink)]">
                  {loading
                    ? "—"
                    : hasPaginationMeta
                      ? `${String(page).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
                      : "Current"}
                </dd>
              </div>
              <div>
                <dt>Frames</dt>
                <dd className="mt-1.5 font-medium text-[var(--ink)]">
                  {loading
                    ? "—"
                    : images.length === 0
                      ? "0"
                      : hasPaginationMeta
                        ? `${formatFrameNumber(visibleFrameLow)}–${formatFrameNumber(visibleFrameHigh)}`
                        : String(images.length)}
                </dd>
              </div>
              <div>
                <dt>Collection</dt>
                <dd className="mt-1.5 font-medium text-[var(--ink)]">
                  {loading
                    ? "Reading"
                    : hasPaginationMeta
                      ? `${total} in set`
                      : `${images.length} loaded`}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="archive-mobile-index lg:hidden">
          <button
            ref={mobileSummaryRef}
            type="button"
            className="archive-mobile-index-toggle"
            aria-expanded={mobileIndexOpen}
            aria-controls="archive-mobile-index-panel"
            onClick={() => setMobileIndexOpen((open) => !open)}
          >
            <span>
              <span className="archive-mobile-index-label">Browse Places &amp; Faces</span>
              <span className="archive-mobile-index-value">
                {selectedFolder ?? "All photos"}
              </span>
            </span>
            <span className="archive-mobile-index-mark" aria-hidden="true">+</span>
          </button>
          {mobileIndexOpen ? (
            <div id="archive-mobile-index-panel" className="archive-mobile-index-panel">
              <ArchiveIndex
                archiveTotal={archiveTotal}
                folders={folders}
                loading={loading}
                onSelect={handleFolderSelect}
                selectedFolder={selectedFolder}
              />
            </div>
          ) : null}
        </div>

        <div className="archive-browser">
          <aside className="archive-desktop-index hidden lg:block" aria-label="Places & Faces index">
            <div className="archive-index-sticky">
              <div className="archive-index-heading">
                <p>Places &amp; Faces index</p>
                <p>{selectedFolder ? "Filtered set" : "Complete set"}</p>
              </div>
              <ArchiveIndex
                archiveTotal={archiveTotal}
                folders={folders}
                loading={loading}
                onSelect={handleFolderSelect}
                selectedFolder={selectedFolder}
              />
            </div>
          </aside>

          <div className="archive-content" aria-busy={loading}>
        {error ? (
          <div
            className="archive-state border-y border-[var(--rule)] py-14 sm:py-20"
            role="alert"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--ink)]">
              Places &amp; Faces unavailable
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              The photographs could not be loaded.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {errorDetail}
            </p>
            <button
              type="button"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              className="archive-action mt-6 min-h-11 bg-[var(--ink)] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
            >
              Retry Places &amp; Faces
            </button>
          </div>
        ) : loading ? (
          <div
            className="archive-loading"
            role="status"
            aria-live="polite"
            aria-label="Loading twenty Places & Faces photographs"
          >
            <span className="sr-only">Loading twenty Places &amp; Faces photographs.</span>
            <div
              className="columns-2 gap-2.5 sm:columns-3 sm:gap-10 lg:gap-12"
              aria-hidden="true"
            >
              {loadingFrames.map((frame) => (
                <div
                  key={`archive-loading-frame-${frame}`}
                  className="mb-2.5 aspect-[4/5] break-inside-avoid bg-[var(--surface)] motion-safe:animate-pulse sm:mb-10 lg:mb-12 motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>
        ) : images.length === 0 ? (
          <div
            className="archive-state border-y border-[var(--rule)] py-14 sm:py-20"
            role="status"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Empty set
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              {selectedFolder
                ? `No photographs in ${selectedFolder}.`
                : "No photographs were returned."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {selectedFolder
                ? "Choose another folder or return to all of Places & Faces."
                : "Places & Faces is currently empty."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {selectedFolder ? (
                <button
                  type="button"
                  onClick={() => handleFolderSelect(null)}
                  className="archive-action min-h-11 bg-[var(--ink)] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
                >
                  All photos
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="archive-action min-h-11 border border-[var(--ink)] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
              >
                Check again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="archive-register mb-5 flex items-center justify-between gap-4 text-[9px] uppercase tracking-[0.22em] text-[var(--muted)] sm:mb-8 sm:text-[10px]">
              <p>
                {hasPaginationMeta
                  ? `${images.length} frames · ${formatFrameNumber(visibleFrameLow)}–${formatFrameNumber(visibleFrameHigh)}`
                  : `${images.length} frames in current set`}
              </p>
              <p className="hidden sm:block">
                {selectedFolder ?? "All photos"} · Select a frame to inspect
              </p>
            </div>

            <div
              className="archive-grid columns-2 gap-2.5 sm:columns-3 sm:gap-10 lg:gap-12"
              aria-label="Places & Faces photographs"
            >
              {images.map((image, index) => {
                const frameLabel = getFrameLabel(index);

                return (
                  <button
                    key={getImageKey(image, index)}
                    type="button"
                    onClick={(event) => {
                      galleryTriggerRef.current = event.currentTarget;
                      setActiveIndex(index);
                    }}
                    className="archive-frame group mb-2.5 block w-full break-inside-avoid text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] sm:mb-10 lg:mb-12"
                    aria-label={`${image.alt}. Open ${frameLabel.toLowerCase()}.`}
                  >
                    <span className="relative block overflow-hidden bg-[var(--surface)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt=""
                        className="block h-auto w-full motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:transition-none"
                        loading="lazy"
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <footer className="archive-pagination -mx-5 mt-16 flex flex-col gap-7 px-5 py-8 sm:-mx-10 sm:mt-24 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10 lg:-mx-12 lg:px-12">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[color:rgba(237,240,235,0.5)]">
                {hasPaginationMeta
                  ? `Frames ${formatFrameNumber(visibleFrameLow)}–${formatFrameNumber(visibleFrameHigh)} of ${total}`
                  : `${images.length} frames loaded · pagination unavailable`}
              </p>

              <nav
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3"
                aria-label="Places & Faces pages"
              >
                <button
                  type="button"
                  onClick={() =>
                    setRequestedPage(Math.max(1, page - 1))
                  }
                  disabled={
                    loading || page === 1 || !hasPaginationMeta
                  }
                  className="archive-page-control min-h-11 border border-[color:rgba(237,240,235,0.32)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
                >
                  ← Newer
                </button>
                <span className="min-w-20 text-center text-[9px] uppercase tracking-[0.2em] text-[color:rgba(237,240,235,0.5)] sm:min-w-24">
                  {hasPaginationMeta
                    ? `${String(page).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
                    : "One set"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRequestedPage(Math.min(totalPages, page + 1))
                  }
                  disabled={
                    loading || page === totalPages || !hasPaginationMeta
                  }
                  className="archive-page-control min-h-11 border border-[color:rgba(237,240,235,0.32)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
                >
                  Older →
                </button>
              </nav>
            </footer>
          </>
        )}
          </div>
        </div>
      </div>

      {activeImage ? (
        <div
          ref={dialogRef}
          className="archive-viewer fixed inset-0 z-50 grid h-[100dvh] max-h-[100dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-[var(--ink)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-[var(--paper)] sm:px-6 sm:pb-6 sm:pt-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-viewer-title"
          aria-describedby="archive-viewer-location archive-viewer-position"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="flex items-start justify-between gap-4 border-b border-[color:rgba(237,240,235,0.15)] pb-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0">
              <p
                id="archive-viewer-title"
                className="text-[10px] font-medium uppercase tracking-[0.26em] text-[var(--paper)]"
              >
                {getFrameLabel(activeIndex ?? 0)}
              </p>
              <p
                id="archive-viewer-location"
                className="mt-1 max-w-[70vw] text-xs leading-relaxed text-[color:rgba(237,240,235,0.45)] [overflow-wrap:anywhere]"
                aria-live="polite"
              >
                <span className="sr-only">
                  Archive location: {activeImageLocation?.label}
                </span>
                <span aria-hidden="true">
                  {activeImageLocation?.folderSegments.map((segment, index) => (
                    <span key={`${segment}-${index}`}>
                      {segment}/<wbr />
                    </span>
                  ))}
                  <span className="text-[color:rgba(237,240,235,0.7)]">
                    {activeImageLocation?.filename}
                  </span>
                </span>
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setActiveIndex(null)}
              className="archive-viewer-close min-h-11 border border-[color:rgba(237,240,235,0.25)] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[color:rgba(237,240,235,0.75)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--paper)]"
              aria-label="Close image viewer"
            >
              Close
            </button>
          </div>

          <figure
            className="flex min-h-0 items-center justify-center overflow-hidden py-3 sm:py-5"
            onClick={(event) => {
              if (event.target !== event.currentTarget) {
                event.stopPropagation();
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="block max-h-full max-w-full object-contain"
            />
          </figure>

          <div
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-[color:rgba(237,240,235,0.15)] pt-3 sm:gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handlePrevious}
              disabled={images.length < 2}
              className="archive-viewer-control min-h-11 justify-self-start border border-[color:rgba(237,240,235,0.2)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[color:rgba(237,240,235,0.7)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
              aria-label="View previous frame"
            >
              ← Prev
            </button>
            <p
              id="archive-viewer-position"
              className="text-center text-[9px] uppercase tracking-[0.2em] text-[color:rgba(237,240,235,0.45)]"
              aria-live="polite"
            >
              {String((activeIndex ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={handleNext}
              disabled={images.length < 2}
              className="archive-viewer-control min-h-11 justify-self-end border border-[color:rgba(237,240,235,0.2)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[color:rgba(237,240,235,0.7)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
              aria-label="View next frame"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
