import assert from "node:assert/strict";
import test from "node:test";

import {
  getGalleryImageLocation,
  getGalleryImages,
  getHomeGalleryPreview,
} from "./remote-gallery.ts";

test("formats nested archive keys literally and root keys without extensions", () => {
  assert.deepEqual(getGalleryImageLocation("2025/IMG_4930.jpg"), {
    folderSegments: ["2025"],
    filename: "IMG_4930.jpg",
    label: "2025/IMG_4930.jpg",
  });
  assert.deepEqual(
    getGalleryImageLocation("2026/Winter26/March/IMG_4666.jpg"),
    {
      folderSegments: ["2026", "Winter26", "March"],
      filename: "IMG_4666.jpg",
      label: "2026/Winter26/March/IMG_4666.jpg",
    },
  );
  assert.deepEqual(getGalleryImageLocation("IMG_4930.jpg"), {
    folderSegments: [],
    filename: "IMG_4930",
    label: "IMG_4930",
  });
});

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

test("leaves the newest-first homepage request unfiltered", async (context) => {
  let requestedUrl = "";
  const originalFetch = globalThis.fetch;

  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ images: [] }), { status: 200 });
  };

  await getGalleryImages("https://api.example.test", 1, 3);

  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.has("folder"), false);
  assert.equal(url.searchParams.get("page"), "1");
});

test("builds the homepage sampler from two distinct historical frames and the latest frame", async (context) => {
  const requestedPages = [];
  const originalFetch = globalThis.fetch;

  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const page = Number(url.searchParams.get("page"));
    requestedPages.push(page);

    return new Response(JSON.stringify({
      images: [{
        id: `frame-${6 - page}`,
        src: `https://images.example/frame-${6 - page}.jpg`,
        alt: `Frame ${6 - page}`,
      }],
      page,
      total: 5,
      totalPages: 5,
      folders: [],
    }), { status: 200 });
  };

  const randomValues = [0, 0];
  const preview = await getHomeGalleryPreview(
    "https://api.example.test",
    () => randomValues.shift() ?? 0,
  );

  assert.deepEqual(requestedPages, [1, 5, 4]);
  assert.deepEqual(
    preview.frames.map(({ image, frameNumber }) => ({
      id: image.id,
      frameNumber,
    })),
    [
      { id: "frame-5", frameNumber: 5 },
      { id: "frame-1", frameNumber: 1 },
      { id: "frame-2", frameNumber: 2 },
    ],
  );
});
