import assert from "node:assert/strict";
import test from "node:test";
import { uploadFile } from "../lib/upload-client";

test("blocked direct uploads retry through the app with the same key; normal storage errors do not retry", async () => {
  const originalFetch = globalThis.fetch;
  const originalXHR = globalThis.XMLHttpRequest;
  const requests: { method: string; url: string; file?: unknown }[] = [];
  let failWithNetwork = true;
  class FakeXHR {
    method = ""; url = ""; status = 0; timeout = 0; responseText = "";
    upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
    onerror?: () => void; onload?: () => void;
    open(method: string, url: string) { this.method = method; this.url = url; }
    setRequestHeader() {}
    send(file: unknown) {
      requests.push({ method: this.method, url: this.url, file });
      queueMicrotask(() => {
        if (this.method === "PUT" && failWithNetwork) return this.onerror?.();
        this.status = this.method === "POST" ? 200 : 403;
        this.upload.onprogress?.({ lengthComputable: true, loaded: 10, total: 10 });
        this.onload?.();
      });
    }
  }
  globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
  globalThis.fetch = async () => Response.json({ key: "uploads/test/photo.png", url: "https://storage.invalid/photo" });
  try {
    const file = new File(["test image"], "photo.png", { type: "image/png" });
    const progress: number[] = [];
    assert.equal(await uploadFile(file, value => progress.push(value)), "uploads/test/photo.png");
    assert.deepEqual(requests.map(({ method, url }) => ({ method, url })), [{ method: "PUT", url: "https://storage.invalid/photo" }, { method: "POST", url: "/api/uploads/transfer?key=uploads%2Ftest%2Fphoto.png" }]);
    assert.ok(requests.every(request => request.file === file));
    assert.deepEqual(progress, [0, 100]);
    requests.length = 0; failWithNetwork = false;
    await assert.rejects(uploadFile(file), /did not accept/);
    assert.equal(requests.length, 1);
    requests.length = 0;
    await assert.rejects(uploadFile(new File([], "empty.png", { type: "image/png" })), /non-empty/);
    assert.equal(requests.length, 0);
  } finally { globalThis.fetch = originalFetch; globalThis.XMLHttpRequest = originalXHR; }
});
