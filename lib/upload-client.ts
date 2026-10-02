export async function uploadFile(file: File) {
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) throw new Error("Only JPG, PNG, or PDF files are supported.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Each file must be under 10 MB.");
  const signature = await fetch("/api/uploads/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }) });
  const signed = await signature.json();
  if (!signature.ok) throw new Error(signed.error ?? "Could not prepare upload.");
  const uploaded = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploaded.ok) throw new Error("File upload failed.");
  return signed.key as string;
}
