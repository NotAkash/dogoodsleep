import assert from "node:assert/strict";
import test from "node:test";

import { parseHomeContent } from "./home.ts";

test("parses homepage status rows and external links while ignoring examples in comments", () => {
  const home = parseHomeContent(`---
right_now_label: "Right now"
updated: "Updated today"
headline: "A current thought."
links_label: "Elsewhere"
links_heading: "Worth a detour."
links_intro: "Things worth reading."
links_empty: "Nothing pinned."
---

## Current

- Building — Do Good Sleep
- Following — Leeds United

## Elsewhere

- [A real post](https://example.org/post) — Why it is worth reading

<!--
- [Example only](https://example.com) — This must not render
-->
`);

  assert.equal(home.headline, "A current thought.");
  assert.deepEqual(home.statusItems, [
    { label: "Building", value: "Do Good Sleep" },
    { label: "Following", value: "Leeds United" },
  ]);
  assert.deepEqual(home.externalLinks, [{
    title: "A real post",
    url: "https://example.org/post",
    note: "Why it is worth reading",
  }]);
});

test("rejects non-web link protocols", () => {
  const home = parseHomeContent(`## Elsewhere

- [Local file](file:///tmp/private.txt)
- [Email](mailto:person@example.com)
`);

  assert.deepEqual(home.externalLinks, []);
});
