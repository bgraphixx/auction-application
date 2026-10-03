import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { storeUpload } from "@/lib/storage";

const limit = 10 * 1024 * 1024;
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [new URL(request.url).origin, process.env.BETTER_AUTH_URL && new URL(process.env.BETTER_AUTH_URL).origin];
  if (!origin || !allowedOrigins.includes(origin)) return Response.json({ error: "Upload origin is not allowed." }, { status: 403 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Please sign in again before uploading." }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const prefix = `uploads/${session.user.id}/`;
  const contentType = request.headers.get("content-type") ?? "";
  if (!key.startsWith(prefix) || !/^[a-zA-Z0-9._-]{1,220}$/.test(key.slice(prefix.length)) || !["image/jpeg", "image/png", "application/pdf"].includes(contentType)) return Response.json({ error: "Unsupported upload." }, { status: 400 });
  if (Number(request.headers.get("content-length")) > limit) return Response.json({ error: "Each file must be under 10 MB." }, { status: 413 });
  if (!request.body) return Response.json({ error: "Choose a non-empty file." }, { status: 400 });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return Response.json({ error: "Each file must be under 10 MB." }, { status: 413 }); }
      chunks.push(value);
    }
    if (!size) return Response.json({ error: "Choose a non-empty file." }, { status: 400 });
    await storeUpload(key, contentType, Buffer.concat(chunks));
    return Response.json({ key });
  } catch {
    return Response.json({ error: "File storage could not accept this upload. Your entries are unchanged; retry the file." }, { status: 502 });
  } finally { reader.releaseLock(); }
}
