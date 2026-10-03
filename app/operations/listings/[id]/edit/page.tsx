import { listingOptions } from "@/lib/listing-options";
import ListingForm from "../../listing-form";
import { requireOperationsUser } from "@/lib/require-user";
import { canPerform } from "@/lib/permissions";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "AUCTION_ADMIN")) redirect("/operations");
  const { id } = await params;
  const auction = await db.auction.findUnique({ where: { id } });
  if (!auction || auction.state !== "DRAFT") notFound();
  const settings = await db.systemSetting.findUnique({ where: { id: "main" } });
  const categories = await db.assetCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return <ListingForm options={await listingOptions()} categories={categories.map((item) => item.name)} defaults={{ paymentHours: settings?.defaultPaymentHours ?? 48, pickupDays: settings?.defaultPickupDays ?? 7, highValueThreshold: settings?.highValueThreshold ?? 1000000 }} initial={{ ...auction, startsAt: auction.startsAt.toISOString(), endsAt: auction.endsAt.toISOString(), paymentDeadline: auction.paymentDeadline.toISOString(), pickupDeadline: auction.pickupDeadline.toISOString(), eligibilityRules: auction.eligibilityRules }} />;
}
