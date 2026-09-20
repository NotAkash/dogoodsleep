import assert from "node:assert/strict";
import test from "node:test";

import { startInitialGallerySelection } from "./gallery-initial-selection.ts";

test("retains the initial folder index when the default-folder request fails", () => {
  const folders = [{
    id: "2026",
    label: "2026",
    imageCount: 2,
    children: [],
  }];
  let committedIndex;

  assert.throws(() => {
    startInitialGallerySelection(
      { folders, total: 2 },
      (index) => {
        committedIndex = index;
      },
      () => {
        throw new Error("Image worker request failed: 500");
      },
    );
  }, /Image worker request failed: 500/);

  assert.deepEqual(committedIndex, {
    archiveTotal: 2,
    folders,
  });
});
