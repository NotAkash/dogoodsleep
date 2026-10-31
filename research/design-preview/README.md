# Revised Do Good Sleep design preview

30 October 2026. Design and planning artifacts only; no production implementation.

Branch preparation update, 31 October: shared folders was merged into `master` through [Add shareable photo archive folders](https://github.com/NotAkash/dogoodsleep/pull/7). This design preparation belongs to `redesign-redo`, separately from that feature.

- [Latest full-site Figma draft v2](https://www.figma.com/design/ArIyQvIgGy4XdKLjMovYzP?node-id=14-29)
- [Delivery map, story cards and handoffs](../2026-10-30-site-redesign-ready.md)
- `index.html`: clickable review controls for screen and width.
- `site.html`: individual responsive views and demonstrable interactions.
- `book.html`: desktop 1440px/mobile 390px full-site sheet used for the Figma import.

The final v2 sheet supersedes the first serif studies and the intermediate imported sheet at `12:29`. Use the `14:29` link above. Earlier material remains in the file because direct Figma edit/inspection tools hit the Starter quota. The documented HTML import path succeeded and the import's photos/layout were confirmed through the Figma browser view. It produces editable frame/text layers, not published components; a detailed layer/token audit remains limited by quota.

## Open locally

Serve the `research` directory, then open `design-preview/index.html`. The review was served at [the local preview](http://localhost:3918/design-preview/index.html). If that local server is no longer running, it can be restarted with any static file server, for example:

```sh
python3 -m http.server 3918 --directory /Users/akashmain/Documents/Projects/placeYface/research
```

Downloaded media is deliberately excluded from Git. Restore the nine public media files on a fresh checkout before viewing:

```sh
python3 research/design-preview/fetch-assets.py
```

The source URLs are recorded in `source-provenance.json`; their future availability is not guaranteed. Existing local copies are retained. The existing Inter font is loaded from Google Fonts. Use this as a design reference, not as production application code. A file-only browser opening also supports basic viewing, although browser clipboard/frame behaviour can differ from HTTP.

## Inventory

1. Home: pale/dark split, smaller heading, three movie posters with title/year/rating, Reading/Building, full Elsewhere list.
2. Places & Faces: compact masthead, nested collection index, natural-ratio photographs, share-link control and pagination location.
3. Fullscreen dark photo viewer: contain sizing, close, path, previous/next with wrapping and position.
4. Journal index: date/title/summary list and existing introduction.
5. Journal entry: existing My Ideal Day content and constrained reading width.
6. About: existing personal biography without placeholder Focus, age or employment metadata.
7. State sheet: loading, image error, empty/unavailable collection, activity fallback, empty links, missing poster and copy feedback.

Each appears at 1440 and 390px in the sheet. Review controls also allow a 768px view. Individual state variants: `site.html?page=home&state=loading|photo-error|activity-error|missing-poster|empty-links`; `site.html?page=archive&state=empty|archive-error`.

## What was checked

- All fourteen source layouts inspected for missing image loads and horizontal overflow at their designed widths.
- Screenshots inspected for desktop/mobile text, movie artwork/ratings, full long Elsewhere comment, image containment and primary reading order.
- Prototype archive photo opens; previous from the first photograph wraps to the last; Escape closes and restores focus to the original photo button.
- Prototype journal item opens the corresponding real entry.
- Mobile collection disclosure expands and exposes its nested links.
- Figma import completed successfully; the browser displayed the imported full-site sheet and discrete photography/poster assets. Automated Figma screenshot/layer inspection remains rate-limited.

Screenshots are stored outside the repository at `/Users/akashmain/.codex/visualizations/2026/10/30/01a18b2e-6406-73b1-86f9-073543e12c7a/revised-site/`.

## Boundaries and readiness

This prototype has six sample photos, a partial demonstration folder tree and disabled sample pagination. Production must preserve its full dataset, path IDs, history, filtered pagination, live movie data and existing accessibility logic. Snapshot counts and films are not new hardcoded requirements. `source-provenance.json` identifies media sources. All journal/link content came from the repository.

Story S0 was completed on 31 October: the rebase was aborted after a backup, published shared-folder history was merged without dropping the local regression checks, and the feature pull request was merged into `master`. The verified feature passed 33 unit tests, 10 archive browser tests, type checking and a production static export. S1–S4 have bounded scope, exclusions, constraints, acceptance criteria, dependencies, validation and single-thread handoffs. Website redesign implementation remains pending design review and a separate request; these prototype files do not change the product routes.
