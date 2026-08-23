# placeYface

Minimal Next.js portfolio starter.

## Routes

- `/` home page
- `/places-faces` paginated photo archive and fullscreen viewer
- `/journal` markdown-backed notes and photo essays

## Run locally

```bash
npm install
npm run dev
```

## Notes

- `IMAGES_API_URL` is the protected base URL for the deployed image service used by `/places-faces`.
- Set it in Cloudflare for production and in `.env.local` for local development so the page can fetch ordered image pages from the worker.
- Journal entries live in `content/journal/*.md` with simple frontmatter: `title`, `date`, and `summary`.
- The app is intentionally kept small so you can build features back up from a clean base.

## Creating web-sized JPEG copies

On macOS, `create_medium_copies.py` moves JPEGs larger than 7 MiB into a
nested `<folder-name>.large` directory, then places a 3200px-long-edge,
quality-92 JPEG back at each original path. Existing smaller JPEGs are left
untouched.
Run it from your photo folder, or pass that folder as an argument:

```bash
python3 /path/to/placeYface/create_medium_copies.py
python3 /path/to/placeYface/create_medium_copies.py /path/to/2026
```

For example, `2026/IMG_001.jpg` becomes `2026/2026.large/IMG_001.jpg`, while
the new medium image is saved as `2026/IMG_001.jpg`. The script skips both
`.medium` folders left by older runs and its `.large` folders, so rerunning it
does not process the same original twice. It refuses to overwrite a file that
already exists in a `.large` folder.

## Syncing the photo archive to R2

The archive sync script adds new JPEGs from `/Volumes/LaCie/FinalEdits` to the
`placesyfaces` R2 bucket while preserving their relative folder tree. It
excludes generated `.large`/`.medium` folders, hidden folders, macOS `._*`
metadata, and non-JPEG files.

Run a non-mutating preview first:

```bash
./scripts/sync-placesyfaces.sh /Volumes/LaCie/FinalEdits
```

After reviewing that output, apply mode requires both the flag and an exact
interactive confirmation:

```bash
./scripts/sync-placesyfaces.sh --apply /Volumes/LaCie/FinalEdits
```

Apply mode uses `rclone copy --ignore-existing`. It uploads a file only when
its relative path does not already exist in R2; it never replaces or deletes
an existing R2 object, even when the local file changed or was removed. It
does not target the `thumbs` bucket.
