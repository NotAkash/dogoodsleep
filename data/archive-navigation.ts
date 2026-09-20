export type ArchiveLocation = {
  folder: string | null;
  error: string | null;
};

export function readArchiveLocation(href: string): ArchiveLocation {
  const values = new URL(href).searchParams.getAll("folder");
  if (values.length === 0) return { folder: null, error: null };
  const folder = values[0];
  const invalid = values.length !== 1
    || !folder
    || folder !== folder.trim()
    || folder.split("/").some((segment) => !segment
      || segment === "." || segment === ".."
      || segment.includes("\\") || /[\u0000-\u001f\u007f]/.test(segment));
  return { folder, error: invalid ? "Invalid folder path" : null };
}

export function archiveLocationMatches(href: string, folder: string | null): boolean {
  const location = readArchiveLocation(href);
  return location.error === null && location.folder === folder;
}

export function archiveFolderUrl(href: string, folder: string | null): string {
  const url = new URL(href);
  if (folder === null) url.searchParams.delete("folder");
  else url.searchParams.set("folder", folder);
  return url.href;
}

export function archiveErrorDetail(message: string | null): string {
  if (message === "Invalid folder path" || message === "Image worker request failed: 400") {
    return "This folder link is invalid. Choose All photos to browse the archive.";
  }
  if (message === "Image worker request failed: 404") {
    return "This folder could not be found. It may have been renamed or removed.";
  }
  if (message === "Missing IMAGES_API_URL") {
    return "The Places & Faces source is not connected in this environment.";
  }
  return "The Places & Faces service could not load the photographs. Please try again.";
}
