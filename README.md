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
