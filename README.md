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

## Live "Right now" activity

The homepage always links Reading to `STORYGRAPH_PROFILE_URL` and shows the three
latest Letterboxd diary entries when `LETTERBOXD_RSS_URL` is configured. Both are
public, non-secret Worker variables in `worker/wrangler.jsonc`:

```json
{
  "LETTERBOXD_RSS_URL": "https://letterboxd.com/dogoodsleep/rss/",
  "STORYGRAPH_PROFILE_URL": "https://app.thestorygraph.com/profile/dogoodsleep"
}
```

Replace the empty defaults before deploying the image Worker. The endpoint caches
the normalized activity for 30 minutes and falls back to the respective public
profile when the Letterboxd feed is unavailable or empty. Set
`NEXT_PUBLIC_ACTIVITY_API_URL` only when a preview uses an activity Worker at a
different origin; production defaults to `https://api.dogoodsleep.com`.

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

The archive sync script makes the eligible JPEG objects in the `placesyfaces`
R2 bucket mirror `/Volumes/LaCie/FinalEdits` while preserving their relative
folder tree. It detects additions, changed files, folder/file moves, and local
deletions. Generated `.large`/`.medium` and thumbnail folders/files, hidden
folders, macOS `._*` metadata, and non-JPEG files are excluded from both the
comparison and remote deletion scope.

Run a non-mutating preview first:

```bash
./scripts/sync-placesyfaces.sh /Volumes/LaCie/FinalEdits
```

Apply mode always repeats the dry run before it can change R2. After reviewing
the full additions, updates, moves, and removals, it requires both the flag and
an exact interactive confirmation:

```bash
./scripts/sync-placesyfaces.sh --apply /Volumes/LaCie/FinalEdits
```

Before syncing, the script compares source and R2 checksums. When exactly one
new source path matches exactly one old R2-only path, it uses an R2-side move
instead of uploading the photo again. Same-path content changes are explicitly
replaced. The final `rclone sync --delete-after` uploads the remaining changes
before removing R2-only eligible JPEGs; rclone suppresses deletion if the sync
encounters errors. The source drive is read only throughout.
