# Do Good Sleep — revised full-site design and delivery plan

30 October 2026 · Initiative Shaper / Map → Ready

Execution update, 31 October: S0 is complete. [Add shareable photo archive folders](https://github.com/NotAkash/dogoodsleep/pull/7) is merged into `master`. The design preparation is isolated on `redesign-redo`. Website redesign implementation has not started.

## Decision record

This brief supersedes the recommended editorial-notebook direction in `2026-10-30-visual-direction.md` and the first Figma studies. The user's feedback is the design authority:

- Keep the existing split pale/dark landing and the light/dark rhythm down the page.
- Keep Inter and the current photographic character. Reduce title dominance; do not turn the site into a serif notebook.
- Preserve Letterboxd posters, film titles, release years, ratings and working diary links. Text-only Watching links are a fallback, not the normal design.
- Remove Thinking about and homepage last-updated timestamps. No new recurring manual-status obligation.
- Give Building a descriptive project link rather than a raw URL.
- Keep Elsewhere's actual links and full comments. Replace the oversized multi-column introduction with one modest heading, one consistent title style and predictable row spacing.
- Scope confirmed by the user: the complete homepage, archive, viewer, journal index, journal entries and About, including desktop and mobile.
- This turn authorizes design and implementation preparation. Production implementation and deployment have not been started.

## Review artifacts and evidence

- `design-preview/index.html`: clickable review surface with 1440, 768 and 390px width choices.
- `design-preview/site.html`: isolated responsive prototype; query `page=home|archive|viewer|journal|entry|about|states`.
- `design-preview/book.html`: all seven views at desktop 1440 and mobile 390, fourteen designed screens, prepared as an editable Figma import.
- [Figma file](https://www.figma.com/design/ArIyQvIgGy4XdKLjMovYzP): use the revised full-site sheet, not the earlier serif homepage studies. Exact final sheet URL is recorded in `design-preview/README.md`.
- Original image and movie snapshot provenance is in `design-preview/source-provenance.json`. Journal bodies and link comments came from the current repository. No generated photographs or movie artwork.

The prototype demonstrates composition, navigation, viewing, mobile disclosure and recovery examples. It is not replacement production code. It uses six sample archive photographs and snapshot movie data; sample pagination is disabled. Production must retain all collections, live activity and existing navigation behaviour. The review controls and state sheet are design documentation, not new public product routes.

Figma direct editing/inspection tools reached the Starter quota. The page-import route remained available. The resulting import uses editable HTML-derived text/frames and discrete content images rather than a flattened screenshot, but is not a finished component library. Browser screenshots and DOM checks validate the source layouts; a comprehensive Figma layer/token audit is still limited by quota. Do not describe the import as a fully bound design system.

## Confirmed architecture and constraints

- Next.js 15 / React 19, static export in `next.config.js`; existing Inter font through `app/layout.tsx`.
- Homepage composition: `app/page.tsx`, `components/home-archive-preview.tsx`, `components/home-now-activity.tsx`, `app/globals.css`.
- Homepage editable content: `content/home.md`, parsed by `data/home.ts`; tests in `data/home.test.mjs`.
- Letterboxd activity is normalized by the existing Worker and consumed by `HomeNowActivity`. The current renderer already handles three movies, half-star ratings, optional year/poster/rating, empty feed and profile fallback. Preserve this contract.
- Archive service and navigation utilities already exist. Folder URLs, Back/Forward, copy link, loading races, filtered pagination and unavailable-folder recovery have meaningful browser coverage in `tests/archive/navigation.spec.mjs`.
- Viewer already traps/restores focus, handles Escape and arrow keys, marks background inert and cycles at the first/last image. Preserve those behaviours; do not implement the simplified prototype as a new viewer.
- Journal is local Markdown. Routes and slug generation already exist. The redesign does not require a CMS or schema migration.
- About is currently `app/resume/page.tsx`; keep that URL. Its Focus section contains lorem ipsum.
- The initial design inspection found an interactive rebase with conflicts in `package.json` and `components/places-faces-gallery.tsx`. On 31 October, a separate authorized branch-cleanup pass backed up the work, aborted that rebase, reconciled the local/published shared-folder commits and merged the verified feature into `master`. The repository is no longer in a rebase. Design work remains on its own branch.

Assumption: the site remains a personal home for photographs, writing and projects, rather than a recruitment-first portfolio. No new backend is expected. An image-specific editorial curation system is excluded: preserve the existing latest-plus-sampled preview logic for this pass.

## Design specification

### Shared system

Use the current `--paper` #edf0eb and `--ink` #111411. Proposed readable secondary colours: light text #596157, dark text #aab1a6; light rules #c5cbc1, dark rules #41483e. Check actual rendered contrast before release. Inter remains the sole family. No new font dependency, gradient, glass treatment, rounded-card system or decorative motion.

Spacing rhythm: 8 / 12 / 16 / 24 / 32 / 48 / 64px. Desktop outer gutter 48px, tablet 32px, mobile 24px. Main reading/navigation surfaces align to the same container. Use content-driven row height: uniform padding does not mean truncating long comments to fit a fixed height.

Header: 64px desktop / 60px mobile, existing four destinations. Keep the current active-route indication and visible keyboard focus. Add a skip link if needed. Footer repeats the site's name and About, with quiet dark treatment.

Body: 16px desktop, 16–17px mobile reading; metadata generally 12px, never used for primary reading. Page titles 48px desktop / 36px mobile. Entry title 42 / 34px. Controls retain at least 44px touch targets even when visual text is small. Body text line-height 1.65–1.8. Scope styles by surface to avoid accidental changes to archive dialogs and Markdown.

### Homepage

Desktop: pale introduction left, dark sampler right, approximately 47:53 split. Preserve tagline and two actions. Set the title near 72px rather than the current larger display scale; 52px on mobile. At intermediate widths reduce it gradually rather than preserving a rigid text size. Two journal teasers use real titles, dates and existing short summaries instead of ordinal-only labels. Keep their destinations unchanged.

The sampler retains uncropped aspect ratios, one larger frame with two supporting frames and frame labels. The design's photographs are samples, not a new fixed selection requirement. Keep the production sampler's current source and selection logic. Loading preserves space; error text directly explains failure with Retry and archive access.

Below: a dark activity band continues the sampler's dark side. Reading and the named Building link occupy a narrow desktop column; Watching gets the wider column, three posters with readable titles, years and ratings. On mobile, Reading/Building form a short row above three poster columns. Long movie titles wrap without pushing ratings outside their card. Preserve the profile fallback for missing feed data and a same-ratio reserved poster area when artwork is absent.

Elsewhere returns to pale paper. One 24px desktop / 22px mobile heading. Desktop rows: number, title, comment, arrow. All titles share the same type treatment. Mobile: number and title on the first line, the full comment below the title, arrow at the edge. Every row uses the same vertical padding and divider treatment. Preserve the complete current comment, including the long final item; do not add an expander or truncate it without a separate decision.

No Thinking about, giant activity headline or update timestamp. Historical journal dates and movie years remain meaningful content.

### Archive and viewer

Reduce the archive masthead to the common page-title scale, retain selected collection/context and Copy link, bring the first photo row into the desktop opening view. Keep the existing nested folder tree on desktop and a disclosure on mobile. Three photo columns on a wide layout, two at narrower widths, with original image ratios. Do not replace full paths with ambiguous leaf IDs or introduce routes shown only by the prototype.

The viewer covers the viewport in dark ink, without the site header. Photo uses contain sizing, never crops. Small collection/path information sits above it; Close is always reachable; previous/position/next sit below it with mobile safe-area padding. Preserve wraparound navigation, Escape, focus trapping, restoration to the clicked photo and background inertness. Single-image controls retain their existing disabled behaviour.

Preserve folder-loading status, last-successful-content error messaging, unknown-folder recovery, link-copy fallback and pagination semantics. The design sheet shows representative states, not all archive logic.

### Journal

Keep the existing personal introduction, entries, chronological order and slugs. Replace oversized masthead composition with the common page title and a readable intro. Desktop list: date / title and summary / arrow; mobile date above title. Use common rules and row padding. Journal body remains content-driven with a maximum reading width around 680–704px. Retain Markdown headings, emphasis, lists, links and return-to-index controls. Do not rewrite the author's prose.

### About

Use the existing biography and a compact heading, “Hobbyist and engineer.” Remove the placeholder Focus block entirely. The design omits age and employment metadata so the layout does not require regular updates; whether to retain those facts in the final copy is an open content choice. Default implementation can omit them without inventing alternatives. Keep Toronto and existing biography details as existing copy, not freshly verified personal facts. Preserve `/resume` and About navigation.

## Delivery map

| Workstream | Mandate | Confirmed changes | Dependencies | Stories |
| --- | --- | --- | --- | --- |
| Reviewable baseline | Preserve both archive changes and restore a buildable checkout | Rebase/conflicts exist; final merge intent must be inspected | Existing in-progress rebase | S0 |
| Personal homepage | Retain contrast, restore strong movie presentation, simplify personal content | Current components/content/parser inspected | S0, revised design review | S1 |
| Photo archive experience | Compact hierarchy with existing folder/viewer behaviour | Current archive and browser tests inspected | S0; shared tokens from S1 | S2 |
| Journal and biography | Apply consistent reading hierarchy; remove placeholder biography sections | Local Markdown and About source inspected | S0; shared tokens from S1 | S3 |
| Whole-site verification | Confirm layouts, states and contracts together | Static export and existing test commands known | S1–S3 | S4 |

Service/data: no new workstream. S1 owns the small homepage parser extension if chosen; existing image/activity Worker contracts remain unchanged. Content choices stay with the affected experience, not an invented content team.

Sequence: S0 → S1 → S2/S3 → S4. S2 and S3 have mostly distinct route files but share global CSS; integrate sequentially unless style ownership is explicitly separated. No implementation agents or external issues are created by this plan.

Smallest first milestone: S1, a complete homepage slice with the split hero, real live movies and the full Elsewhere list at desktop and mobile sizes. Review this slice before spreading styles across the archive and reading pages.

## Story S0: restore a reviewable archive baseline

**Primary workstream:** Reviewable baseline

**Outcome:** the current branch can build and both the initial-folder-index and shareable-folder work survive the rebase.

**Scope:** inspect the rebase state, conflict sides, staged files, next commit and tests; propose a resolution preserving both user-visible behaviours; complete it only within a separately authorized implementation task.

**Not in scope:** visual redesign, resetting/aborting/skipping the rebase by default, dropping one behaviour to clear conflicts, unrelated cleanup.

**Constraints:** existing untracked research artifacts and staged files belong to the user. Preserve them. Do not use broad restore/reset commands. No assumed merge intent where the two sides conflict semantically.

**Dependencies:** implementation authorization; discovery of the actual rebase/patch context.

**Acceptance criteria:** no conflict markers in app sources or package JSON; initial index retention and shareable folder links both work; remaining rebase commit handled explicitly; package scripts include all applicable archive unit suites.

**Validation:** inspect resulting diff and history, run home/archive/Worker unit suites, archive browser suite, typecheck and static build on the resolved branch; report pre-existing failures separately.

**Readiness:** Completed on 31 October. The published history was merged while preserving the extra folder-index regression checks. All 33 unit tests, all 10 archive browser tests, type checking and the static build passed; the feature pull request is merged.

## Story S1: refine the full homepage while preserving its character

**Primary workstream:** Personal homepage

**Outcome:** visitors see the familiar light/dark landing, real journal choices, prominent film posters/ratings and a readable annotated link list, without manually maintained thought/date sections.

**Scope:** `app/page.tsx`, scoped homepage CSS, `HomeNowActivity` presentation, direct preview error copy and `content/home.md`. Add a bounded homepage content parser extension for named status links, e.g. `- Building — [Transit tracker](https://transit-tracker.dogoodsleep.com/)`, if needed to keep the project title editable. Continue accepting existing text and raw-URL status rows. Remove the Thinking About content row and rendering of the updated/headline fields; do not remove parser support merely for cleanup.

**Not in scope:** Worker/API/schema changes, hardcoded movie snapshots/posters, new integrations, new editorial image database, journal prose edits, other routes.

**Constraints:** retain Inter, current paper/ink, existing hrefs, sampler algorithm and true image ratios. Existing movie normalization, missing optional fields, half-stars and fallback profiles continue working. Use real feed data in production, not `design-preview/content.js`.

**Dependencies:** S0 complete; review of the revised homepage design. This specification is ready to hand off, but the plan itself does not authorize product implementation.

**Acceptance criteria:**
- At 1440px the opening remains a pale/dark split; at 390px it deliberately stacks pale introduction then dark sampler/activity then pale Elsewhere.
- Title is visibly smaller than the current baseline; real journal titles/dates and both existing actions remain available.
- Watching renders the latest three available diary items, each with its existing available artwork, title, year and rating; missing metadata is omitted rather than invented. The fallback remains a meaningful Letterboxd link.
- Thinking About, “What I'm Thinking About,” homepage last-updated text and “Worth a detour” are absent. Journal dates and movie years remain.
- Building shows “Transit tracker” at the existing URL; StoryGraph retains its configured profile.
- All three current Elsewhere links and complete comments render in consistent ruled rows; the long comment wraps cleanly on mobile.
- Photo loading/error, empty links, missing poster and unavailable activity preserve usable navigation and readable content.
- Keyboard focus is visible; no horizontal overflow at 390, 768 and 1440px; important controls have 44px touch targets.

**Validation:** add meaningful parser tests only for new named-link syntax, backwards compatibility and unsafe protocols; run `test:home`. Browser-check real and controlled empty/error activity, optional metadata, long movie titles, sampler errors and the full long Elsewhere comment. Run typecheck/build after integration. No CSS-mirroring unit tests.

**Readiness:** Ready, subject to the explicit dependencies above.

**Single-thread handoff:** Implement S1 from this document after S0 and design review. Keep the current split-contrast character and actual movie artwork/ratings. Limit work to the named homepage files and any necessary parser tests. Preserve URLs, live data and sampler behaviour; exclude Worker changes and all other routes. Verify each S1 acceptance criterion and provide matched before/after desktop/mobile screenshots and check results. Do not deploy.

## Story S2: make the archive easier to enter without changing navigation

**Primary workstream:** Photo archive experience

**Outcome:** visitors reach photographs sooner and can browse, share and inspect them confidently on desktop and mobile.

**Scope:** compact archive title/context, folder index spacing, responsive image grid and viewer visual controls. Preserve the existing request/navigation state machine. Integrate fullscreen viewer styling with safe-area spacing and readable path/position labels.

**Not in scope:** image storage/service changes, reordering archives, replacing folder IDs/query semantics, adding photo descriptions, copying the prototype's reduced folders or disabled pagination, replacing modal logic.

**Constraints:** all production folders and shared URLs remain valid. Preserve loading races, Back/Forward, reset/scoped pagination, error recovery, copy fallback and all existing accessibility behaviours. Viewer arrows wrap as they do today; controls disable only when existing logic requires it.

**Dependencies:** S0 complete, S1 shared visual rules established, revised archive/viewer review.

**Acceptance criteria:** first row of photographs is visible within a 1440×900 opening view; selected collection and Copy link are clear; mobile disclosure exposes nested folders without horizontal overflow; aspect ratios remain intact; unavailable/empty/loading states remain distinct; direct folder links and browser history retain meaning; viewer covers header, contains full image, keeps controls onscreen at 390×844 and 1440×900, traps/restores focus and handles Escape/arrow keys with wraparound.

**Validation:** run `test:archive`, `test:archive:browser` and relevant Worker tests. Exercise all existing browser coverage, plus portrait/landscape/single-image viewer and keyboard focus at both sizes. Retain known accessibility/data attributes unless a justified change updates their consumers. Do not rewrite tests merely to match a broken implementation.

**Readiness:** Ready, subject to dependencies.

**Single-thread handoff:** Implement S2 after the resolved archive baseline and S1. Apply the compact hierarchy and dark fullscreen viewer from the revised design. Modify presentation only unless a proven bug requires a separately explained fix. Preserve all folder/query/history/pagination and modal accessibility behaviours; use the existing archive browser suite as the contract. Validate desktop/mobile, failure states and portrait/landscape containment. Report screenshots and results; do not deploy.

## Story S3: unify journal and About presentation

**Primary workstream:** Journal and biography

**Outcome:** journal entries are easy to scan/read and About contains useful personal copy without template filler.

**Scope:** journal index and entry spacing/type scales, constrained reading width, consistent date/title/summary rows, About layout and removal of placeholder Focus rows. Default About heading omits age; omit existing employment metadata unless the user elects to retain it. Preserve biography wording apart from existing obvious typographical cleanup that is shown in review.

**Not in scope:** new posts, invented personal facts, CMS migration, changed slugs or `/resume` redirect, rewritten journal voice, new projects or contacts.

**Constraints:** existing markdown renderer and static params continue working. Preserve chronological order, inline links, emphasis, heading hierarchy, lists and return navigation. Inter stays the reading font.

**Dependencies:** S0, S1 shared visual rules, revised Journal/About review. Optional copy choice: retain age/employment; safe default is omission, so it does not block layout work.

**Acceptance criteria:** all three current entries remain reachable from homepage/index and direct URLs; title/date/summary hierarchy matches the designs; body text stays within the documented reading width and wraps at 390px; no lorem ipsum remains in About; `/resume` still serves About; no personal fact is invented or silently updated; active navigation works for nested journal routes.

**Validation:** static export includes all existing routes; visit all three entry slugs and return to index; inspect short and longer entry bodies at desktop/mobile; use keyboard navigation and verify existing Markdown formatting. No new unit tests for purely visual rearrangement.

**Readiness:** Ready, subject to dependencies.

**Single-thread handoff:** Implement S3 from this brief after S1. Update journal index/entry and About presentation only; remove placeholder Focus content, use the safe About copy defaults and retain every existing route/slug. Do not rewrite prose or add facts. Verify all entries, Markdown formatting, keyboard navigation, body wrapping and static export, with desktop/mobile screenshots. Do not deploy.

## Story S4: verify the coherent full-site result

**Primary workstream:** Whole-site verification

**Outcome:** the shipped candidate matches the revised direction across surfaces and has no known interaction, content or data regression.

**Scope:** compare current and redesigned views at 390×844, 768×1024 and 1440×900; inspect homepage/live/failure states, full archive navigation, viewer, journal and About; fix demonstrated regressions within affected stories.

**Not in scope:** new product features, redesign alternatives, publishing without a separate request.

**Constraints:** design preview snapshots must not enter production data paths. A successful mock preview does not prove the production data flow. Preserve static export and the existing deployment approach.

**Dependencies:** S1–S3 complete.

**Acceptance criteria:** no horizontal overflow, clipped controls, hidden long comments or missing media without fallback; correct primary/secondary text contrast; visible keyboard focus; reduced-motion preferences respected; all historical routes and archive share links work; production uses live activity data; static build and applicable checks pass, with any genuine pre-existing tooling issue clearly separated.

**Validation:** `npm run test:home`, `npm run test:archive`, `npm run test:worker`, `npm run test:archive:browser`, `npx tsc --noEmit`, `npm run build`. The current lint script invokes `next lint`; confirm a supported invocation/configuration after S0 before treating lint as a passing check. Inspect final matched screenshots and primary flows; record actual results, not planned ones.

**Readiness:** Ready, subject to dependencies.

**Single-thread handoff:** Verify the integrated S1–S3 changes against this document and the revised full-site design. Run the applicable existing checks, exercise real and failure flows, and inspect all routes at the three listed widths. Fix only evidenced regressions. Report before/after screenshots, check results and unresolved limitations. Do not publish or deploy.

## Review and implementation gate

The design work and scoped handoffs are prepared, and S0 is complete. Next: review the revised homepage/full-site sheet, then authorize the implementation phase beginning with the complete S1 homepage slice on `redesign-redo`. No design choice requires new infrastructure or paid integration.
