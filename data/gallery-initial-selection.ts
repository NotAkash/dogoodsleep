import type { ArchiveFolder, GalleryPage } from "@/data/remote-gallery";

type InitialGalleryIndex = {
  archiveTotal: number;
  folders: ArchiveFolder[];
};

/**
 * Commits the folder index from the unfiltered response before loading its
 * default folder. This leaves the index available if that follow-up fails.
 */
export function startInitialGallerySelection(
  page: Pick<GalleryPage, "folders" | "total">,
  commitIndex: (index: InitialGalleryIndex) => void,
  requestDefaultFolder: (folder: ArchiveFolder) => void,
): boolean {
  commitIndex({
    archiveTotal: page.total,
    folders: page.folders,
  });

  const defaultFolder = page.folders[0];

  if (!defaultFolder) {
    return false;
  }

  requestDefaultFolder(defaultFolder);

  return true;
}
