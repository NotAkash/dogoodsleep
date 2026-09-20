import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/archive",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/places-faces",
    env: { IMAGES_API_URL: "https://archive.test" },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
