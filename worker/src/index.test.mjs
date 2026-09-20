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
    etag: `etag-${key}`,
    key,
    size: 200_000,
    customMetadata: mtime ? { mtime } : undefined,
  };
}

function jpeg(width, height) {
  return Uint8Array.from([
    0xff, 0xd8,
    0xff, 0xc0,
    0x00, 0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01, 0x11, 0x00,
    0x02, 0x11, 0x00,
    0x03, 0x11, 0x00,
  ]);
}

function mockEnv(listedObjects = objects, objectBodies = new Map()) {
  const listCalls = [];
  const getCalls = [];

  return {
    getCalls,
    listCalls,
    env: {
      ARCHIVE_BUCKET: {
        async get(key, options) {
          getCalls.push({ key, options });
          const bytes = objectBodies.get(key);

          return bytes ? { async bytes() { return bytes; } } : null;
        },
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

async function request(path, listedObjects = objects, origin, objectBodies) {
  const { env, getCalls, listCalls } = mockEnv(listedObjects, objectBodies);
  const response = await worker.fetch(new Request(`https://api.example.test${path}`, {
    headers: origin ? { origin } : undefined,
  }), env);
  return { response, body: await response.json(), getCalls, listCalls };
}

async function activityRequest(env, feedResponse, origin = "https://dogoodsleep.com") {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => feedResponse;
  try {
    const response = await worker.fetch(new Request("https://api.example.test/activity", {
      headers: { origin },
    }), env);
    return { response, body: await response.json() };
  } finally {
    globalThis.fetch = originalFetch;
  }
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

test("allows the production site and this Worker's branch preview origins", async () => {
  const production = await request("/images?limit=1", objects, "https://dogoodsleep.com");
  const preview = await request(
    "/images?limit=1",
    objects,
    "https://gallery-filter-dogoodsleep.dogoodsleep.workers.dev",
  );
  const unrelated = await request("/images?limit=1", objects, "https://example.com");

  assert.equal(
    production.response.headers.get("access-control-allow-origin"),
    "https://dogoodsleep.com",
  );
  assert.equal(
    preview.response.headers.get("access-control-allow-origin"),
    "https://gallery-filter-dogoodsleep.dogoodsleep.workers.dev",
  );
  assert.equal(unrelated.response.headers.get("access-control-allow-origin"), null);
  assert.match(production.response.headers.get("vary"), /Origin/);
});

test("returns intrinsic JPEG dimensions only when the client requests them", async () => {
  const key = "2026/Winter26/March/IMG_4666.jpg";
  const listedObjects = [object(key, "2026-03-10T12:00:00Z")];
  const objectBodies = new Map([[key, jpeg(2048, 1365)]]);
  const withoutDimensions = await request("/images?limit=1", listedObjects);
  const withDimensions = await request(
    "/images?limit=1&dimensions=1",
    listedObjects,
    undefined,
    objectBodies,
  );

  assert.equal(withoutDimensions.getCalls.length, 0);
  assert.deepEqual(withDimensions.getCalls, [{
    key,
    options: { range: { offset: 0, length: 96 * 1024 } },
  }]);
  assert.deepEqual(withDimensions.body.images[0], {
    id: key,
    src: `https://images.dogoodsleep.com/${key}`,
    alt: "IMG 4666",
    width: 2048,
    height: 1365,
  });
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

test("returns the latest three Letterboxd diary items with a cacheable response", async () => {
  const rss = `<?xml version="1.0"?>
    <rss><channel><item>
      <title>Reality Bites, 1994 - ★★</title>
      <link>https://letterboxd.com/akash/film/reality-bites/</link>
      <letterboxd:filmTitle>Reality Bites</letterboxd:filmTitle>
      <letterboxd:filmYear>1994</letterboxd:filmYear>
      <letterboxd:memberRating>2.0</letterboxd:memberRating>
      <description><![CDATA[<p><img src="https://a.ltrbxd.com/resized/film-poster/reality-bites.jpg" /></p>]]></description>
    </item><item>
      <title>Paris, Texas, 1984 - ★★★★½</title>
      <link>https://letterboxd.com/akash/film/paris-texas/</link>
      <letterboxd:filmTitle>Paris, Texas</letterboxd:filmTitle>
      <letterboxd:filmYear>1984</letterboxd:filmYear>
      <letterboxd:memberRating>4.5</letterboxd:memberRating>
    </item><item>
      <title>Chungking Express, 1994 - ★★★★★</title>
      <link>https://letterboxd.com/akash/film/chungking-express/</link>
      <letterboxd:filmTitle>Chungking Express</letterboxd:filmTitle>
      <letterboxd:filmYear>1994</letterboxd:filmYear>
      <letterboxd:memberRating>5.0</letterboxd:memberRating>
      <description><![CDATA[<p><img src="https://a.ltrbxd.com/resized/film-poster/chungking-express.jpg" /></p>]]></description>
    </item><item>
      <title>Ignored fourth film, 2000 - ★</title>
      <link>https://letterboxd.com/akash/film/ignored-fourth-film/</link>
      <letterboxd:filmTitle>Ignored fourth film</letterboxd:filmTitle>
    </item></channel></rss>`;
  const { response, body } = await activityRequest({
    STORYGRAPH_PROFILE_URL: "https://app.thestorygraph.com/profile/akash",
    LETTERBOXD_RSS_URL: "https://letterboxd.com/akash/rss/",
  }, new Response(rss, { headers: { "content-type": "application/rss+xml" } }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=1800");
  assert.equal(response.headers.get("access-control-allow-origin"), "https://dogoodsleep.com");
  assert.deepEqual(body, {
    reading: { profileUrl: "https://app.thestorygraph.com/profile/akash" },
    watching: {
      profileUrl: "https://letterboxd.com/akash/",
      title: "Reality Bites",
      url: "https://letterboxd.com/akash/film/reality-bites/",
      entries: [
        {
          title: "Reality Bites",
          url: "https://letterboxd.com/akash/film/reality-bites/",
          year: "1994",
          rating: 2,
          posterUrl: "https://a.ltrbxd.com/resized/film-poster/reality-bites.jpg",
        },
        {
          title: "Paris, Texas",
          url: "https://letterboxd.com/akash/film/paris-texas/",
          year: "1984",
          rating: 4.5,
        },
        {
          title: "Chungking Express",
          url: "https://letterboxd.com/akash/film/chungking-express/",
          year: "1994",
          rating: 5,
          posterUrl: "https://a.ltrbxd.com/resized/film-poster/chungking-express.jpg",
        },
      ],
    },
  });
});

test("skips incomplete diary items and omits unsafe optional RSS values", async () => {
  const rss = `<rss><channel><item>
      <title>Broken item</title>
      <link>https://example.com/not-a-letterboxd-entry</link>
    </item><item>
      <title>Only valid item</title>
      <link>https://letterboxd.com/akash/film/only-valid-item/</link>
      <letterboxd:filmYear>not a year</letterboxd:filmYear>
      <letterboxd:memberRating>9</letterboxd:memberRating>
      <description><![CDATA[<img src="https://example.com/untrusted-poster.jpg" />]]></description>
    </item></channel></rss>`;
  const { body } = await activityRequest({
    STORYGRAPH_PROFILE_URL: "https://app.thestorygraph.com/profile/akash",
    LETTERBOXD_RSS_URL: "https://letterboxd.com/akash/rss/",
  }, new Response(rss));

  assert.deepEqual(body.watching, {
    profileUrl: "https://letterboxd.com/akash/",
    title: "Only valid item",
    url: "https://letterboxd.com/akash/film/only-valid-item/",
    entries: [
      {
        title: "Only valid item",
        url: "https://letterboxd.com/akash/film/only-valid-item/",
      },
    ],
  });
});

test("falls back to configured profiles when Letterboxd has no usable diary item", async () => {
  const { response, body } = await activityRequest({
    STORYGRAPH_PROFILE_URL: "https://app.thestorygraph.com/profile/akash",
    LETTERBOXD_RSS_URL: "https://letterboxd.com/akash/rss/",
  }, new Response("<rss><channel /></rss>"));

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    reading: { profileUrl: "https://app.thestorygraph.com/profile/akash" },
    watching: { profileUrl: "https://letterboxd.com/akash/" },
  });
});

test("does not make a request when no Letterboxd feed is configured", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("The missing RSS feed should not be fetched");
  };

  try {
    const response = await worker.fetch(new Request("https://api.example.test/activity"), {
      STORYGRAPH_PROFILE_URL: "https://app.thestorygraph.com/profile/akash",
      LETTERBOXD_RSS_URL: "",
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      reading: { profileUrl: "https://app.thestorygraph.com/profile/akash" },
      watching: { profileUrl: "https://letterboxd.com/" },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
