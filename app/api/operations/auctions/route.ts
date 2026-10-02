import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/permissions";
import { listingSchema, validateListing } from "@/lib/listing";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canPerform(session.user.role, "AUCTION_ADMIN")) return Response.json({ error: "Auction Admin access required." }, { status: 403 });
  const parsed = listingSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Please complete the listing fields correctly.", issues: parsed.error.flatten() }, { status: 400 });
  const values = parsed.data;
  const category = await db.assetCategory.findUnique({ where: { name: values.category } });
  if (!category?.active) return Response.json({ error: "Select an active asset category." }, { status: 400 });
  const problem = validateListing(values, session.user.id);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  const reference = `FFCL-${values.category.slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const auction = await db.auction.create({ data: { ...values, reference, startsAt: new Date(values.startsAt), endsAt: new Date(values.endsAt), paymentDeadline: new Date(values.paymentDeadline), pickupDeadline: new Date(values.pickupDeadline), state: "DRAFT" } });
  await db.auditEvent.create({ data: { auctionId: auction.id, actorId: session.user.id, actorRole: session.user.role, action: "LISTING_CREATED", after: { reference, state: "DRAFT" } } });
  return Response.json({ id: auction.id, reference }, { status: 201 });
}
