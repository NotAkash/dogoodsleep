import assert from "node:assert/strict";
import test from "node:test";

import { getGalleryImages } from "./remote-gallery.ts";

test("requests an exact folder and normalizes the nested folder tree", async (context) => {
  let requestedUrl = "";
  const originalFetch = globalThis.fetch;

  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      images: [{ id: "2026/Winter26/March/IMG_4666.jpg", src: "https://images.example/IMG_4666.jpg", alt: "March" }],
      page: 1,
      total: 8,
      totalPages: 1,
      folders: [
        {
          id: "2026",
          label: "2026",
          imageCount: 8,
          children: [
            {
              id: "2026/Winter26/March",
              label: "March",
              imageCount: 8,
              children: [],
            },
          ],
        },
      ],
    }), { status: 200 });
  };

  const page = await getGalleryImages(
    "https://api.example.test/",
    1,
    20,
    "2026/Winter26/March",
  );

  const url = new URL(requestedUrl);
  assert.equal(url.pathname, "/images");
  assert.equal(url.searchParams.get("folder"), "2026/Winter26/March");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(url.searchParams.get("limit"), "20");
  assert.deepEqual(page.folders[0].children[0], {
    id: "2026/Winter26/March",
    label: "March",
    imageCount: 8,
    children: [],
  });
});

test("leaves the homepage request unfiltered when no folder is provided", async (context) => {
  let requestedUrl = "";
  const originalFetch = globalThis.fetch;

  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ images: [] }), { status: 200 });
  };

  await getGalleryImages("https://api.example.test", "last", 3);

  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.has("folder"), false);
});
