# placeYface

Minimal Next.js portfolio starter.

## Routes

- `/` home page
- `/places-faces` minimal two-panel starter layout

## Run locally

```bash
npm install
npm run dev
```

## Notes

- `IMAGES_API_URL` is the protected base URL for the deployed image service used by `/places-faces`.
- Set it in Cloudflare for production and in `.env.local` for local development so the page can fetch the single worker image in both environments.
- The app is intentionally kept small so you can build features back up from a clean base.
