import assert from "node:assert/strict";
import test from "node:test";

import worker from "./index.ts";

const objects = [
  object("root.jpg", "2025-01-01T12:00:00Z"),
  object("2023/Fall/IMG_2786.jpg", "2023-12-20T12:40:54.82Z"),
  object("2023/Fall/portrait.jpg", "2023-12-21T12:00:00Z"),
  object("2023/Fall/Deep/hidden.jpg", "2024-01-01T12:00:00Z"),
  object("2023/Fallout/unrelated.jpg", "2026-01-01T12:00:00Z"),
  object("2026/Winter26/direct.jpg", "2026-02-01T12:00:00Z"),
  object("2026/Winter26/March/IMG_4666.jpg", "2026-03-10T12:00:00Z"),
  object("2026/Summer26/MayKingston/no-mtime-b.jpg"),
  object("2026/Summer26/MayKingston/no-mtime-a.jpg"),
  object("empty-folder/", "2026-08-01T12:00:00Z"),
];

function object(key, mtime) {
  return {
    key,
    customMetadata: mtime ? { mtime } : undefined,
  };
}

function mockEnv(listedObjects = objects) {
  const listCalls = [];

  return {
    listCalls,
    env: {
      ARCHIVE_BUCKET: {
        async list(options) {
          listCalls.push(options);
          return {
            objects: listedObjects,
            truncated: false,
          };
        },
      },
    },
  };
}

async function request(path, listedObjects = objects) {
  const { env, listCalls } = mockEnv(listedObjects);
  const response = await worker.fetch(new Request(`https://api.example.test${path}`), env);
  return { response, body: await response.json(), listCalls };
}

test("returns every nested folder with descendant-inclusive image counts", async () => {
  const { response, body, listCalls } = await request("/images?limit=48");

  assert.equal(response.status, 200);
  assert.deepEqual(listCalls, [{ limit: 1000, cursor: undefined, include: ["customMetadata"] }]);
  assert.deepEqual(body.folders, [
    {
      id: "2023",
      label: "2023",
      imageCount: 4,
      children: [
        {
          id: "2023/Fall",
          label: "Fall",
          imageCount: 3,
          children: [
            {
              id: "2023/Fall/Deep",
              label: "Deep",
              imageCount: 1,
              children: [],
            },
          ],
        },
        {
          id: "2023/Fallout",
          label: "Fallout",
          imageCount: 1,
          children: [],
        },
      ],
    },
    {
      id: "2026",
      label: "2026",
      imageCount: 4,
      children: [
        {
          id: "2026/Summer26",
          label: "Summer26",
          imageCount: 2,
          children: [
            {
              id: "2026/Summer26/MayKingston",
              label: "MayKingston",
              imageCount: 2,
              children: [],
            },
          ],
        },
        {
          id: "2026/Winter26",
          label: "Winter26",
          imageCount: 2,
          children: [
            {
              id: "2026/Winter26/March",
              label: "March",
              imageCount: 1,
              children: [],
            },
          ],
        },
      ],
    },
  ]);
});

test("unfiltered results include every image newest first by mtime", async () => {
  const { body } = await request("/images?limit=48");

  assert.equal(body.total, 9);
  assert.equal(body.totalPages, 1);
  assert.deepEqual(body.images.map((image) => image.id), [
    "2026/Winter26/March/IMG_4666.jpg",
    "2026/Winter26/direct.jpg",
    "2023/Fallout/unrelated.jpg",
    "root.jpg",
    "2023/Fall/Deep/hidden.jpg",
    "2023/Fall/portrait.jpg",
    "2023/Fall/IMG_2786.jpg",
    "2026/Summer26/MayKingston/no-mtime-a.jpg",
    "2026/Summer26/MayKingston/no-mtime-b.jpg",
  ]);
  assert.deepEqual(body.images[0], {
    id: "2026/Winter26/March/IMG_4666.jpg",
    src: "https://images.dogoodsleep.com/2026/Winter26/March/IMG_4666.jpg",
    alt: "IMG 4666",
  });
});

test("equal or absent mtime metadata uses a deterministic key fallback", async () => {
  const fallbackObjects = [
    object("Album/no-mtime-b.jpg"),
    object("Album/same-time-b.jpg", "2026-01-01T00:00:00Z"),
    object("Album/invalid-mtime.jpg", "not-a-date"),
    object("Album/same-time-a.jpg", "2026-01-01T00:00:00Z"),
    object("Album/no-mtime-a.jpg"),
  ];
  const { body } = await request("/images?limit=48", fallbackObjects);

  assert.deepEqual(body.images.map((image) => image.id), [
    "Album/same-time-a.jpg",
    "Album/same-time-b.jpg",
    "Album/invalid-mtime.jpg",
    "Album/no-mtime-a.jpg",
    "Album/no-mtime-b.jpg",
  ]);
});

test("sorts rclone Unix-second mtime metadata returned by the R2 Workers binding", async () => {
  const r2Objects = [
    object("2023/Fall/older.jpg", "1703151654.82"),
    object("2026/Summer26/HousewarmingJuly/IMG_9166.jpg", "1785389286.45"),
    object("2026/Winter26/March/middle.jpg", "1773133200"),
  ];
  const { body } = await request("/images?limit=48", r2Objects);

  assert.deepEqual(body.images.map((image) => image.id), [
    "2026/Summer26/HousewarmingJuly/IMG_9166.jpg",
    "2026/Winter26/March/middle.jpg",
    "2023/Fall/older.jpg",
  ]);
});

test("reads every truncated R2 page with custom metadata included", async () => {
  const listCalls = [];
  const env = {
    ARCHIVE_BUCKET: {
      async list(options) {
        listCalls.push(options);

        if (options.cursor === undefined) {
          return {
            objects: [object("2025/older.jpg", "2025-01-01T00:00:00Z")],
            truncated: true,
            cursor: "next-page",
          };
        }

        return {
          objects: [object("2026/newer.jpg", "2026-01-01T00:00:00Z")],
          truncated: false,
        };
      },
    },
  };
  const response = await worker.fetch(new Request("https://api.example.test/images"), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(listCalls, [
    { limit: 1000, cursor: undefined, include: ["customMetadata"] },
    { limit: 1000, cursor: "next-page", include: ["customMetadata"] },
  ]);
  assert.deepEqual(body.images.map((image) => image.id), [
    "2026/newer.jpg",
    "2025/older.jpg",
  ]);
});

test("a folder includes descendant images with filtered pagination", async () => {
  const { body } = await request("/images?folder=2023%2FFall&limit=1&page=last");

  assert.equal(body.total, 3);
  assert.equal(body.totalPages, 3);
  assert.equal(body.page, 3);
  assert.deepEqual(body.images.map((image) => image.id), ["2023/Fall/IMG_2786.jpg"]);
});

test("a parent includes images from all descendant folders", async () => {
  const { body } = await request("/images?folder=2026%2FWinter26&limit=48");

  assert.equal(body.total, 2);
  assert.deepEqual(body.images.map((image) => image.id), [
    "2026/Winter26/March/IMG_4666.jpg",
    "2026/Winter26/direct.jpg",
  ]);
});

test("a parent with no direct images still returns descendant images", async () => {
  const { body } = await request("/images?folder=2023&limit=48");

  assert.equal(body.total, 4);
  assert.equal(body.totalPages, 1);
  assert.equal(body.page, 1);
  assert.deepEqual(body.images.map((image) => image.id), [
    "2023/Fallout/unrelated.jpg",
    "2023/Fall/Deep/hidden.jpg",
    "2023/Fall/portrait.jpg",
    "2023/Fall/IMG_2786.jpg",
  ]);
});

test("complete path segments keep similarly named folders separate", async () => {
  const { body } = await request("/images?folder=2023%2FFallout&limit=48");

  assert.equal(body.total, 1);
  assert.deepEqual(body.images.map((image) => image.id), ["2023/Fallout/unrelated.jpg"]);
});

test("unknown and malformed folder paths fail without returning images", async () => {
  const unknown = await request("/images?folder=2023%2FMissing");
  assert.equal(unknown.response.status, 404);
  assert.deepEqual(unknown.body, { error: "Folder not found" });

  for (const path of [
    "/images?folder=",
    "/images?folder=%2F2023",
    "/images?folder=2023%2F%2FFall",
    "/images?folder=2023%2F..",
    "/images?folder=2023&folder=Fall",
  ]) {
    const invalid = await request(path);
    assert.equal(invalid.response.status, 400);
    assert.deepEqual(invalid.body, { error: "Invalid folder path" });
  }
});
