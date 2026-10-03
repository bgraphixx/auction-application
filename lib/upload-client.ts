class DirectUploadUnavailable extends Error {}

function transfer(file: File, url: string, method: "PUT" | "POST", onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.setRequestHeader("Content-Type", file.type);
    request.timeout = 120_000;
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
    request.onerror = () => reject(method === "PUT" ? new DirectUploadUnavailable() : new Error("Could not reach the server. Check your connection and retry the upload."));
    request.ontimeout = () => reject(new Error("The upload timed out. Retry this file."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) return resolve();
      let message = "File storage did not accept the upload. Retry this file.";
      if (method === "POST") { try { message = JSON.parse(request.responseText).error ?? message; } catch {} }
      reject(new Error(message));
    };
    request.send(file);
  });
}
export async function uploadFile(file: File, onProgress?: (percent: number) => void) {
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) throw new Error("Only JPG, PNG, or PDF files are supported.");
  if (!file.size) throw new Error("Choose a non-empty file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Each file must be under 10 MB.");
  let signature: Response;
  try { signature = await fetch("/api/uploads/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }) }); }
  catch { throw new Error("Could not prepare the upload. Check your connection and retry."); }
  const signed = await signature.json().catch(() => null);
  if (!signature.ok || !signed?.key || !signed?.url) throw new Error(signed?.error ?? "Could not prepare upload. Please retry.");
  try { await transfer(file, signed.url, "PUT", onProgress); }
  catch (error) {
    if (!(error instanceof DirectUploadUnavailable)) throw error;
    // Reuse the same object key if storage CORS prevents direct browser transfer.
    onProgress?.(0);
    await transfer(file, `/api/uploads/transfer?key=${encodeURIComponent(signed.key)}`, "POST", onProgress);
  }
  return signed.key as string;
}
