import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createUploadUrl } from "@/lib/storage";

const bodySchema = z.object({ filename: z.string().min(1).max(180), contentType: z.enum(["image/jpeg", "image/png", "application/pdf"]) });

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Unsupported upload" }, { status: 400 });
  const safeFilename = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `uploads/${session.user.id}/${crypto.randomUUID()}-${safeFilename}`;
  const url = await createUploadUrl(key, parsed.data.contentType);
  return Response.json({ key, url, expiresIn: 300 });
}
