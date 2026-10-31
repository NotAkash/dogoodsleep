# Do Good Sleep: visual research and initiative brief

30 October 2026 · Initiative Shaper / Shape · Planning only

> The original recommendation below is superseded by the user's feedback and [the revised full-site delivery brief](2026-10-30-site-redesign-ready.md). Preserve this file as reference research; use [the latest Figma draft](https://www.figma.com/design/ArIyQvIgGy4XdKLjMovYzP?node-id=14-29) for implementation planning.

## Scope and evidence

Confirmed target: improve placeYface / Do Good Sleep. Fred Rivett's site is a reference, not a template to copy.

Reviewed the live reference homepage at wide and narrow browser widths, its `/now` and `/shelf` content, and the live Do Good Sleep homepage, archive, journal index and About page at a desktop width of approximately 1265px. Inspected the corresponding local pages, global CSS, navigation, font configuration, homepage content and preview/activity components. This is a visual/content review, not a mobile, accessibility or performance certification. No product implementation changes were made.

Sources:
- [Fred's homepage](https://www.fredrivett.com/)
- [Fred's now page](https://www.fredrivett.com/now/)
- [Fred's shelf](https://www.fredrivett.com/shelf/)
- [Do Good Sleep](https://dogoodsleep.com/)
- [Places & Faces](https://dogoodsleep.com/places-faces)
- [Journal](https://dogoodsleep.com/journal)
- [About](https://dogoodsleep.com/resume)

## What the reference does well

These are observations and design judgments. Appearance cannot establish whether AI was used to build a website.

1. **The introduction is proportionate.** A small greeting and a few direct sentences leave room for the work. Identity is clear without a full-screen brand statement.
2. **Typography has distinct jobs.** Serif headings and writing titles contrast with monospaced body copy and metadata. Blue underlined links make navigation legible. The character comes from this consistent relationship, not a large collection of effects.
3. **The page supports browsing.** Projects and writing sit beside each other on desktop. Compact rows let visitors scan multiple items without traversing repeated oversized sections.
4. **The record feels accumulated.** Project states such as building, live, idle and sold, plus launch/update dates and an optional archive, show an uneven history. Those differences give each item meaning.
5. **Personality comes from selection.** The writing archive, current interests and shelf form a particular set of choices. The shelf includes short opinions about why items matter, rather than neutral descriptions alone.
6. **Small distinctive details repeat.** The compact initial mark, inline portrait/name treatment, slash-prefixed navigation and date treatment belong to the same personal-web vocabulary.
7. **Interaction is mostly familiar.** Text links and lists do most of the work. The interface does not require a tour before the visitor can explore.

The resulting impression of authorship comes from specificity, editorial decisions, continuity over time and restraint. Lowercase text, dark mode, serif type or deliberate imperfection alone would not create that impression.

Not every reference choice should transfer. Its long writing list can become tiring; its newsletter interrupts the path to projects; its developer-like typography is suited to its own author. Its now page is explicitly dated April 2026, illustrating why freshness needs honest context. Do Good Sleep has photographs worth giving more space than this reference does.

## What Do Good Sleep should preserve

- The name and short existing tagline have character. Add context around them before replacing them.
- Actual photographs, their varied aspect ratios and the asymmetric preview are stronger identity assets than decorative graphics.
- The pale green-grey paper and dark ink are a coherent base. A dark-mode copy of Fred's site would discard this existing identity.
- The journal introduction has a particular voice and humour. Keep that voice through editing.
- Film ratings, personal interests, the transit project and opinionated external links are useful evidence of taste.
- Folder browsing, fullscreen viewing and shareable archive links are functional assets to preserve.

## Current diagnosis

Subjective scores describe the reviewed desktop views, not measured usability results.

| Dimension | Score | Evidence |
| --- | --- | --- |
| Purpose fit | 4/5 | Real photography and journal content support a personal portfolio/notebook. |
| Hierarchy | 2/5 | Archive and activity headings dominate the material they introduce. |
| Clarity | 3/5 | Routes are visible, but the opening tagline does not explain what is collected here. |
| Specificity | 4/5 | Original photos, personal notes and ratings are present, although captions and project descriptions under-explain them. |
| Coherence | 4/5 | Paper, ink, rules and spacing repeat consistently; type roles are overly uniform. |
| Restraint | 3/5 | Decoration is limited, but display scale and repeated metadata styling receive too much emphasis. |

Top three issues:

1. **Section labels compete with the work.** On the archive, a very large title and collection header leave photos below the initial desktop viewport. On the homepage, the large activity heading and broad empty area outweigh the compact activity list.
2. **Content lacks useful context in prominent places.** Homepage journal links show summaries such as “Reflections” instead of the entry titles and dates. Photo captions show frame numbers rather than meaningful context. The transit project appears as a raw URL.
3. **The personal identity is unevenly expressed.** The strongest personal writing is deeper in the site, while About exposes lorem ipsum. Headings, reading text and metadata largely share one type voice: local `sans`, `serif` and `mono` utilities all resolve to the same sans-serif font.

## Initiative: a photographic notebook with an inhabited front page

### The bet

If visitors encounter a photograph, a clear personal introduction and specific recent entries sooner, they can understand whose site this is and find something worth exploring with less scanning.

Assumption: the primary audience is people exploring Akash's photography, writing and interests. A recruitment-first portfolio would need a different opening and evidence order.

### Directions

| Direction | Approach | Upside | Tradeoff |
| --- | --- | --- | --- |
| Personal index | Short introduction, compact lists, small photo strip | Fast browsing and easy maintenance | Gives photography less presence |
| Editorial notebook — recommended | Modest masthead, strong photograph/sequence, journal list, compact current interests | Builds on the existing site and balances images with writing | Requires careful selection and captions |
| Photographic field journal | Image-led opening, place/date captions, occasional short notes | Strongest photographic identity | Writing and engineering projects become secondary |

### Recommended visual language

Purpose: a home for Akash's photographs, writing, small projects and interests.

Sequence: introduction → selected photographs → recent journal → current interests → elsewhere.

Visual language: quiet, photographic, personal.

Signature device: a photograph or small sequence accompanied by a consistent, compact caption line. Use verified place/date/title where available; otherwise retain a neutral label or omit unavailable fields. Frame numbers may remain secondary archive metadata.

Typography: explore a restrained serif for journal titles and reading, with a clear sans-serif for navigation and controls. Use monospaced metadata only where it earns its place. Compare using actual long titles and body text before choosing fonts. Avoid introducing several new typefaces at once.

Colour: retain paper and ink; explore one muted link colour drawn from an actual photograph. Underlining and focus treatment must identify links independently of colour.

## Suggested changes, in order

1. **Finish the visible content.** Remove or replace About's placeholder Focus list with user-provided specifics. Preserve the journal's voice. Review age, job and current-status copy before carrying it into a redesign; existing copy is not confirmation that those facts remain current.
2. **Make the opening more informative.** Keep Do Good Sleep as the masthead, reduce its dominance and add one plain sentence explaining the site. Place a strong photograph near the introduction. Choose that image intentionally rather than assuming the latest upload is the best introduction.
3. **Expose the actual journal.** Show entry title, date and a short excerpt in a compact list. Retain the full journal link. The homepage should help a reader choose a piece.
4. **Bring archive photographs higher.** Reduce the archive masthead, retain clear collection context and keep the folder index subordinate to the photos. Preserve natural image proportions and the current viewer/navigation behaviour.
5. **Turn Right now into a small useful module.** Reduce the headline; bring the films, reading link, current thought and project together. Give the transit link a descriptive name and a user-approved sentence about it. Distinguish manually updated notes from live activity so the August date does not imply everything shares one freshness timestamp.
6. **Give photographs context.** Explore an explicit homepage selection and captions. The current preview is chosen programmatically; editorial selection is a new content decision, not a capability to assume already exists.
7. **Keep Elsewhere opinionated and readable.** Preserve the selected links and short notes. Let long titles wrap naturally; reduce the visual importance of sequence numbers and arrows.
8. **Use direct state copy.** Where the preview currently uses a metaphor for connection failure, prefer a short explanation of what failed plus Retry and the archive link. Keep the quiet visual language in loading, empty and error views.

## Initial impact map

| Capability | Likely change | Confidence | Open question |
| --- | --- | --- | --- |
| Personal front page | Reorder material; compact introduction, journal and activity | Confirmed current content; proposed arrangement | How much should photography lead? |
| Interface and typography | Adjust page scale, text roles, link treatments and captions | Confirmed local styling and font mapping | Which pairing works with actual content? |
| Archive experience | Smaller masthead; photos earlier; preserve folders/viewer/sharing | Confirmed current routes and controls | How should the collection header compose on mobile? |
| Content and curation | Finish About; choose opening photographs; approve contextual copy | Confirmed placeholders; proposed selection | Which images and details should represent the site? |
| Service and data | No new backend expected for layout changes; discover caption/selection support if adopted | Assumption based on current markdown and image-service setup | Can an existing stable image identifier support a small local selection manifest? |
| Quality and release | Review desktop/mobile, keyboard/focus, contrast, reduced motion, image proportions and remote-data failure states | Required future validation | Resolve existing repository conflicts before implementation checks |

## Smallest first milestone

An editable homepage design at desktop and mobile sizes using real existing content, with a compact archive-header companion study. Compare the recommended editorial notebook against the more compact personal-index direction before deciding. Include a photo-loading/error example and one long journal/link title so the design can be judged beyond its easiest state.

Review for these observable outcomes:
- A first-time visitor can identify Akash and the site's material from the opening screen.
- A real photograph appears in the initial desktop and mobile composition.
- Journal titles and dates provide useful browsing choices.
- Activity content receives more attention than its label.
- The archive study brings photographs into the initial desktop view.
- No fabricated biography, captions, dates, testimonials or project claims.

These are design review criteria, not implementation-ready stories. Direction and content choices remain open.

## Tooling and next step

Figma account access was successfully verified during this review. Use it for editable desktop/mobile layouts, reusable caption/type treatments and comparison with the current site. The design brief above should guide that work; connecting a design tool by itself will not supply the editorial decisions. The follow-up design pass created [editable Figma studies](https://www.figma.com/design/ArIyQvIgGy4XdKLjMovYzP?node-id=5-22): the editorial homepage at 1440px and 390px, a compact index alternative at 1120px, an archive-header study, and photo loading/error states. The designs use original archive photographs, editable Inter/Lora text, auto-layout containers and local journal-row components. All five views were rendered and visually reviewed; text sizing issues found during review were corrected. These are static design explorations, not working prototypes.

Recommended next action: compare the editorial notebook and compact-index studies in Figma, confirm the preferred direction and opening photograph, then use Initiative Shaper Map/Ready for the chosen direction.

Implementation prerequisite discovered: the local working tree contains unresolved merge conflicts in `package.json` and `components/places-faces-gallery.tsx`. They were left untouched. This review used the live site and read-only source inspection; no local build or test pass is claimed.
