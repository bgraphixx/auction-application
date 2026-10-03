import assert from "node:assert/strict";
import test from "node:test";
import { createUploadUrl, createDownloadUrl } from "../lib/storage";

test("Spaces signing accepts regional and bucket-qualified endpoints without duplicating the bucket", async () => {
  const keys = ["DO_SPACES_ENDPOINT", "DO_SPACES_REGION", "DO_SPACES_BUCKET", "DO_SPACES_KEY", "DO_SPACES_SECRET"];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { DO_SPACES_REGION: "sfo3", DO_SPACES_BUCKET: "test-assets", DO_SPACES_KEY: "test-access", DO_SPACES_SECRET: "test-secret" });
  try {
    for (const endpoint of ["https://sfo3.digitaloceanspaces.com", "https://test-assets.sfo3.digitaloceanspaces.com"]) {
      process.env.DO_SPACES_ENDPOINT = endpoint;
      for (const signed of [await createUploadUrl("uploads/test/photo.png", "image/png"), await createDownloadUrl("uploads/test/photo.png")]) {
        const url = new URL(signed);
        assert.equal(url.hostname, "test-assets.sfo3.digitaloceanspaces.com");
        assert.equal(url.pathname, "/uploads/test/photo.png");
      }
    }
  } finally {
    for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key]; }
  }
});
