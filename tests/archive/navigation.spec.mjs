import { test, expect } from "@playwright/test";

const nested = "2026/Summer26/MayKingston";
const special = "2026/Montréal & friends + 50%";
const folder = (id, children = [], imageCount = 21) => ({ id, label: id.split("/").at(-1), children, imageCount });
const folders = [folder("2026", [folder("2026/Summer26", [folder(nested)]), folder(special)]), folder("2025"), folder("Empty", [], 0)];
const known = new Set(["2026", "2026/Summer26", nested, special, "2025", "Empty"]);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#d7d0bf"/><circle cx="400" cy="120" r="60" fill="#897b62"/></svg>';

async function archive(page) {
  const requests = [];
  const failures = new Map();
  const holds = new Map();
  await page.route("https://archive.test/images?**", async (route) => {
    const url = new URL(route.request().url());
    const selected = url.searchParams.get("folder");
    requests.push({ folder: selected, page: Number(url.searchParams.get("page")) });
    if (holds.has(selected)) await holds.get(selected);
    const status = failures.get(selected) ?? (selected && !known.has(selected) ? 404 : 200);
    if (status !== 200) return route.fulfill({ status, json: { error: "Folder unavailable" } });
    const empty = selected === "Empty";
    const currentPage = Number(url.searchParams.get("page"));
    await route.fulfill({ json: {
      images: empty ? [] : Array.from({ length: currentPage === 1 ? 20 : 1 }, (_, index) => ({
        id: `${selected ?? "All"}/${currentPage}-${index}.jpg`,
        src: `data:image/svg+xml,${encodeURIComponent(svg)}#${encodeURIComponent(selected ?? "All")}-${currentPage}-${index}`,
        alt: `${selected ?? "All"} image ${currentPage}-${index}`,
        width: 600, height: 400,
      })),
      folders, page: currentPage, total: empty ? 0 : 21, totalPages: empty ? 1 : 2,
    } });
  });
  return { requests, failures, hold(id) {
    let release;
    holds.set(id, new Promise((resolve) => { release = resolve; }));
    return () => { holds.delete(id); release(); };
  } };
}

const title = (page) => page.locator(".archive-collection-title");
const index = (page) => page.locator(".archive-desktop-index");
const choose = (page, name) => index(page).getByRole("button", { name, exact: true }).click();
const ready = async (page, name) => {
  await expect(title(page)).toHaveText(name);
  await expect(page.getByRole("button", { name: "Copy link", exact: true })).toBeEnabled();
};

test("direct links request only their folder; refresh, copying, and All photos round-trip", async ({ page, context }) => {
  const api = await archive(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`/places-faces?source=friend&folder=${encodeURIComponent(nested)}#collection`);
  await ready(page, "MayKingston");
  expect(api.requests.every((request) => request.folder === nested)).toBe(true);
  await expect(index(page).locator(".archive-folder-all")).toContainText("—");
  await expect(index(page).getByRole("button", { name: "2026", exact: true })).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  await page.reload();
  await ready(page, "MayKingston");
  expect(api.requests.every((request) => request.folder === nested)).toBe(true);
  await choose(page, "All photos");
  await ready(page, "All photos");
  expect(new URL(page.url()).searchParams.has("folder")).toBe(false);
  expect(new URL(page.url()).searchParams.get("source")).toBe("friend");
  expect(new URL(page.url()).hash).toBe("#collection");
  await page.reload();
  await ready(page, "All photos");
});

test("commits history once, keeps the document, and leaves pagination out of history", async ({ page }) => {
  await archive(page);
  await page.goto("/places-faces");
  await ready(page, "All photos");
  await page.evaluate(() => { window.archiveDocumentMarker = "mounted"; });
  const initialLength = await page.evaluate(() => history.length);
  await choose(page, "2026");
  await ready(page, "2026");
  await choose(page, "2026");
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 1);
  await page.getByRole("button", { name: "Older →" }).click();
  await expect(page.getByRole("navigation", { name: "Places & Faces pages" })).toContainText("02 / 02");
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 1);
  await choose(page, "2025");
  await ready(page, "2025");
  await page.goBack();
  await ready(page, "2026");
  await expect(page.getByRole("navigation", { name: "Places & Faces pages" })).toContainText("01 / 02");
  await page.goBack();
  await ready(page, "All photos");
  await page.goForward();
  await ready(page, "2026");
  expect(await page.evaluate(() => window.archiveDocumentMarker)).toBe("mounted");
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 2);
});

test("failed clicks retain content and URL, and Retry preserves push intent", async ({ page }) => {
  const api = await archive(page);
  await page.goto("/places-faces");
  await ready(page, "All photos");
  const initialLength = await page.evaluate(() => history.length);
  api.failures.set("2026", 503);
  await choose(page, "2026");
  await expect(page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert")).toContainText("Still showing All photos");
  expect(new URL(page.url()).searchParams.has("folder")).toBe(false);
  await expect(title(page)).toHaveText("All photos");
  api.failures.delete("2026");
  await page.getByRole("button", { name: "Retry 2026" }).click();
  await ready(page, "2026");
  expect(new URL(page.url()).searchParams.get("folder")).toBe("2026");
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 1);
});

test("failed history keeps destination, retries without pushing, and recovers to an already displayed All photos", async ({ page }) => {
  const api = await archive(page);
  await page.goto("/places-faces?folder=2026");
  await ready(page, "2026");
  await choose(page, "All photos");
  await ready(page, "All photos");
  const length = await page.evaluate(() => history.length);
  api.failures.set("2026", 404);
  await page.goBack();
  await expect(page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert")).toContainText("Still showing All photos");
  await expect(page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert")).toContainText("renamed or removed");
  expect(new URL(page.url()).searchParams.get("folder")).toBe("2026");
  await expect(page.getByRole("button", { name: "Copy link" })).toBeDisabled();
  api.failures.delete("2026");
  await page.getByRole("button", { name: "Retry 2026" }).click();
  await ready(page, "2026");
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.goForward();
  await ready(page, "All photos");
  api.failures.set("2026", 404);
  await page.goBack();
  await expect(page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert")).toBeVisible();
  await page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert").getByRole("button", { name: "All photos", exact: true }).click();
  await ready(page, "All photos");
  expect(new URL(page.url()).searchParams.has("folder")).toBe(false);
});

test("rapid clicks and Back during loading cancel stale content and history commits", async ({ page }) => {
  const api = await archive(page);
  await page.goto("/places-faces");
  await ready(page, "All photos");
  const length = await page.evaluate(() => history.length);
  const release = api.hold("2026");
  await choose(page, "2026");
  await expect(page.locator(".archive-collection-status")).toHaveText("Loading 2026…");
  await expect(title(page)).toHaveText("All photos");
  await expect(page.getByRole("button", { name: "Copy link" })).toBeDisabled();
  expect(new URL(page.url()).searchParams.has("folder")).toBe(false);
  await choose(page, "2025");
  await ready(page, "2025");
  release();
  const releaseSecond = api.hold("2026");
  await choose(page, "2026");
  await expect(page.locator(".archive-collection-status")).toHaveText("Loading 2026…");
  await page.goBack();
  await ready(page, "All photos");
  releaseSecond();
  await page.goForward();
  await ready(page, "2025");
  expect(await page.evaluate(() => history.length)).toBe(length + 1);
});

test("malformed and unknown initial links recover without silently showing another collection", async ({ page }) => {
  const api = await archive(page);
  for (const query of ["folder=", "folder=2026&folder=2025", "folder=2026%2F..", "folder=Missing"]) {
    await page.goto(`/places-faces?${query}`);
    await expect(page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert")).toBeVisible();
    await expect(page.locator(".archive-grid")).toHaveCount(0);
    expect(new URL(page.url()).search).toBe(`?${query}`);
    await page.getByRole("region", { name: "Places & Faces", exact: true }).getByRole("alert").getByRole("button", { name: "All photos", exact: true }).click();
    await ready(page, "All photos");
  }
  expect(api.requests.filter((request) => request.folder && request.folder !== "Missing")).toEqual([]);
});

test("mobile parent navigation, leaf focus, special characters, empty collections, and clipboard fallback", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await archive(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("Denied"); } } });
  });
  await page.goto("/places-faces");
  await ready(page, "All photos");
  const toggle = page.getByRole("button", { name: /Browse Places & Faces/ });
  await toggle.click();
  const mobile = page.locator("#archive-mobile-index-panel");
  await mobile.getByRole("button", { name: "2026", exact: true }).click();
  await ready(page, "2026");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await mobile.getByRole("button", { name: special.split("/").at(-1), exact: true }).click();
  await ready(page, special.split("/").at(-1));
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  expect(new URL(page.url()).searchParams.get("folder")).toBe(special);
  const copy = page.getByRole("button", { name: "Copy link" });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Could not copy" })).toBeVisible();
  await expect(page.getByLabel("Collection link")).toHaveValue(page.url());
  await page.getByLabel("Collection link").focus();
  expect(await page.getByLabel("Collection link").evaluate((input) => input.selectionEnd - input.selectionStart)).toBe(page.url().length);
  await page.screenshot({ path: testInfo.outputPath("mobile-copy-fallback.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await toggle.click();
  await mobile.getByRole("button", { name: "Empty", exact: true }).click();
  await ready(page, "Empty");
  await expect(page.getByText("No photographs in Empty.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Collection link")).toHaveCount(0);
});

test("history navigation closes the viewer and desktop sharing fits the layout", async ({ page }, testInfo) => {
  await archive(page);
  await page.goto("/places-faces");
  await ready(page, "All photos");
  await choose(page, "2026");
  await ready(page, "2026");
  await page.locator(".archive-frame").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await ready(page, "All photos");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("desktop-sharing.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a failed initial request retries the same folder without adding history", async ({ page }) => {
  const api = await archive(page);
  api.failures.set(nested, 503);
  await page.goto(`/places-faces?folder=${encodeURIComponent(nested)}`);
  await expect(page.locator(".archive-content").getByRole("alert")).toBeVisible();
  const length = await page.evaluate(() => history.length);
  api.failures.delete(nested);
  await page.getByRole("button", { name: "Retry Places & Faces" }).click();
  await ready(page, "MayKingston");
  expect(api.requests.every((request) => request.folder === nested)).toBe(true);
  expect(await page.evaluate(() => history.length)).toBe(length);
});

test("navigation during image preparation cannot commit the superseded folder", async ({ page }) => {
  await archive(page);
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    window.archiveHeldDecodes = [];
    HTMLImageElement.prototype.decode = function () {
      if (this.src.includes("#2026-")) {
        return new Promise((resolve) => window.archiveHeldDecodes.push(resolve));
      }
      return decode.call(this);
    };
  });
  await page.goto("/places-faces");
  await ready(page, "All photos");
  const length = await page.evaluate(() => history.length);
  await choose(page, "2026");
  await expect.poll(() => page.evaluate(() => window.archiveHeldDecodes.length)).toBeGreaterThan(0);
  await expect(title(page)).toHaveText("All photos");
  await choose(page, "2025");
  await ready(page, "2025");
  await page.evaluate(async () => {
    window.archiveHeldDecodes.forEach((resolve) => resolve());
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await ready(page, "2025");
  expect(new URL(page.url()).searchParams.get("folder")).toBe("2025");
  expect(await page.evaluate(() => history.length)).toBe(length + 1);
});
