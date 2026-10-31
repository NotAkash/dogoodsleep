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
- Using -- https://transit-tracker.dogoodsleep.com/

## Elsewhere On The Internet

- [A real post](https://example.org/post) -- Why it is worth reading

<!--
- [Example only](https://example.com) — This must not render
-->
`);

  assert.equal(home.headline, "A current thought.");
  assert.deepEqual(home.statusItems, [
    { label: "Building", value: "Do Good Sleep" },
    { label: "Following", value: "Leeds United" },
    {
      label: "Using",
      value: "https://transit-tracker.dogoodsleep.com/",
      url: "https://transit-tracker.dogoodsleep.com/",
    },
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

test("named status links retain editable labels alongside raw URLs and plain text", () => {
  const home = parseHomeContent(`## Current
- Building — [Transit tracker](https://transit-tracker.dogoodsleep.com/)
- Reading — A book
- Using — https://example.org/
`);
  assert.deepEqual(home.statusItems, [
    { label: "Building", value: "Transit tracker", url: "https://transit-tracker.dogoodsleep.com/" },
    { label: "Reading", value: "A book" },
    { label: "Using", value: "https://example.org/", url: "https://example.org/" },
  ]);
});

test("named status links never turn unsafe protocols into clickable URLs", () => {
  const home = parseHomeContent(`## Current
- Local — [File](file:///tmp/private.txt)
- Script — [Run](javascript:alert)
- Inline — [Data](data:text/html,hello)
`);
  assert.deepEqual(home.statusItems, [
    { label: "Local", value: "File" },
    { label: "Script", value: "Run" },
    { label: "Inline", value: "Data" },
  ]);
});
