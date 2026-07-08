# placeYface

Minimal Next.js portfolio starter.

## Routes

- `/` home page
- `/places-faces` VSCO-style random image gallery

## Run locally

```bash
npm install
npm run dev
```

## Notes

- `IMAGES_API_URL` is the protected base URL for the deployed image service used by `/places-faces`.
- Set it in Cloudflare for production and in `.env.local` for local development so the page can fetch 10 random images from the worker on each refresh.
- The app is intentionally kept small so you can build features back up from a clean base.
