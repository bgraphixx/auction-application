import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/permissions";
import { listingSchema, validateListing } from "@/lib/listing";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canPerform(session.user.role, "AUCTION_ADMIN")) return Response.json({ error: "Auction Admin access required." }, { status: 403 });
  const { id } = await params;
  const existing = await db.auction.findUnique({ where: { id } });
  if (!existing || existing.state !== "DRAFT") return Response.json({ error: "Only draft listings can be edited." }, { status: 409 });
  const parsed = listingSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid listing details.", issues: parsed.error.flatten() }, { status: 400 });
  const problem = validateListing(parsed.data, session.user.id, [...existing.photoKeys, ...(existing.wipeProofUrl ? [existing.wipeProofUrl] : [])]);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  const values = parsed.data;
  const category = await db.assetCategory.findUnique({ where: { name: values.category } });
  if (!category?.active) return Response.json({ error: "Select an active asset category." }, { status: 400 });
  await db.$transaction([
    db.auction.update({ where: { id }, data: { ...values, startsAt: new Date(values.startsAt), endsAt: new Date(values.endsAt), paymentDeadline: new Date(values.paymentDeadline), pickupDeadline: new Date(values.pickupDeadline) } }),
    db.auditEvent.create({ data: { auctionId: id, actorId: session.user.id, actorRole: session.user.role, action: "LISTING_EDITED", before: { title: existing.title, startsAt: existing.startsAt, endsAt: existing.endsAt }, after: { title: values.title, startsAt: values.startsAt, endsAt: values.endsAt } } }),
  ]);
  return Response.json({ ok: true });
}
