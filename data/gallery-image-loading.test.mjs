import assert from "node:assert/strict";
import test from "node:test";

import {
  criticalGalleryImageIndexes,
  prepareCriticalGalleryImages,
} from "./gallery-image-loading.ts";

function galleryImage(id, width = 2048, height = 1365) {
  return {
    id,
    src: `https://images.example/${id}.jpg`,
    alt: id,
    width,
    height,
  };
}

test("selects the beginnings of balanced columns before loading down the page", () => {
  const images = Array.from({ length: 20 }, (_, index) => galleryImage(String(index)));
  images[13] = galleryImage("13", 1365, 2048);
  images[15] = galleryImage("15", 1365, 2048);

  assert.deepEqual(criticalGalleryImageIndexes(images, 3), [0, 8, 14, 1]);
  assert.deepEqual(criticalGalleryImageIndexes(images, 2), [0, 11, 1, 12]);
});

test("prepares only the critical batch and settles failed decodes", async () => {
  const created = [];
  const controller = new AbortController();

  function createImage() {
    let source = "";
    const image = {
      complete: false,
      decoding: "auto",
      fetchPriority: "auto",
      naturalWidth: 0,
      onerror: null,
      onload: null,
      async decode() {
        if (source.endsWith("14.jpg")) {
          throw new Error("decode failed");
        }
      },
      get src() {
        return source;
      },
      set src(value) {
        source = value;
        created.push(image);
        queueMicrotask(() => {
          image.complete = true;
          image.naturalWidth = 100;
          image.onload?.();
        });
      },
    };

    return image;
  }

  const images = Array.from({ length: 20 }, (_, index) => galleryImage(String(index)));
  images[13] = galleryImage("13", 1365, 2048);
  images[15] = galleryImage("15", 1365, 2048);

  const prepared = await prepareCriticalGalleryImages(images, {
    columnCount: 3,
    createImage,
    signal: controller.signal,
    timeoutMs: 100,
  });

  assert.deepEqual([...prepared], ["0", "8", "14", "1"]);
  assert.deepEqual(
    created.map((image) => image.src),
    [
      "https://images.example/0.jpg",
      "https://images.example/8.jpg",
      "https://images.example/14.jpg",
      "https://images.example/1.jpg",
    ],
  );
  assert.ok(created.every((image) => image.decoding === "async"));
  assert.ok(created.every((image) => image.fetchPriority === "high"));
});

test("does not start image work after the request is aborted", async () => {
  const controller = new AbortController();
  let creations = 0;
  controller.abort();

  await prepareCriticalGalleryImages([galleryImage("0")], {
    columnCount: 1,
    createImage() {
      creations += 1;
      throw new Error("should not create an image");
    },
    signal: controller.signal,
  });

  assert.equal(creations, 0);
});

test("stops an in-flight preload when a newer gallery request supersedes it", async () => {
  const controller = new AbortController();
  let source = "";
  const image = {
    complete: false,
    decoding: "auto",
    fetchPriority: "auto",
    naturalWidth: 0,
    onerror: null,
    onload: null,
    get src() {
      return source;
    },
    set src(value) {
      source = value;
    },
  };

  const preparation = prepareCriticalGalleryImages([galleryImage("0")], {
    columnCount: 1,
    createImage: () => image,
    signal: controller.signal,
  });

  controller.abort();
  const prepared = await preparation;

  assert.equal(source, "");
  assert.deepEqual([...prepared], ["0"]);
});
