import ListingForm from "../listing-form";
import { requireOperationsUser } from "@/lib/require-user";
import { canPerform } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function NewListingPage() {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "AUCTION_ADMIN")) redirect("/operations");
  const [categories, settings] = await Promise.all([db.assetCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } }), db.systemSetting.findUnique({ where: { id: "main" } })]);
  return <ListingForm categories={categories.map((item) => item.name)} defaults={{ paymentHours: settings?.defaultPaymentHours ?? 48, pickupDays: settings?.defaultPickupDays ?? 7 }} />;
}
