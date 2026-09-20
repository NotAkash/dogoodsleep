import assert from "node:assert/strict";
import test from "node:test";
import { archiveFolderUrl, archiveLocationMatches, readArchiveLocation } from "./archive-navigation.ts";

const base = "https://example.com/places-faces?source=friend#collection";

test("bare URLs mean All photos and full folder IDs round-trip literally", () => {
  assert.deepEqual(readArchiveLocation(base), { folder: null, error: null });
  for (const folder of ["2026/Summer26/MayKingston", "2026/Montréal & friends + 50%/#?", "2026/%2F"]) {
    const href = archiveFolderUrl(base, folder);
    assert.deepEqual(readArchiveLocation(href), { folder, error: null });
    assert.equal(new URL(href).searchParams.get("source"), "friend");
    assert.equal(new URL(href).hash, "#collection");
    assert.equal(archiveLocationMatches(href, folder), true);
    assert.equal(archiveLocationMatches(href, null), false);
  }
});

test("All photos removes folder values while retaining unrelated URL state", () => {
  const href = archiveFolderUrl(`${base.split("#")[0]}&folder=one&folder=two#collection`, null);
  assert.equal(href, base);
  assert.equal(archiveLocationMatches(href, null), true);
});

test("malformed paths and duplicate parameters never resolve as All photos", () => {
  for (const query of ["folder=", "folder=a&folder=b", "folder=%2Fa", "folder=a%2F", "folder=a%2F%2Fb", "folder=a%2F..", "folder=.", "folder=a%5Cb", "folder=%00", "folder=%20a"]) {
    const href = `https://example.com/places-faces?${query}`;
    assert.equal(readArchiveLocation(href).error, "Invalid folder path", query);
    assert.equal(archiveLocationMatches(href, null), false, query);
  }
});

test("setting a folder replaces duplicates and repeated destinations match", () => {
  const href = archiveFolderUrl("https://example.com/places-faces?folder=a&folder=b", "2026/May");
  assert.deepEqual(new URL(href).searchParams.getAll("folder"), ["2026/May"]);
  assert.equal(archiveLocationMatches(href.replace("%2F", "/"), "2026/May"), true);
});
