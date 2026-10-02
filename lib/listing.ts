import { z } from "zod";
import { eligibilitySchema, defaultRules } from "@/lib/eligibility";

export const listingSchema = z.object({
  title: z.string().min(3).max(140), category: z.string().min(2).max(50),
  description: z.string().min(10).max(4000), condition: z.string().min(2).max(50), conditionNotes: z.string().max(2000).nullable().optional(), knownDefects: z.string().max(2000).nullable().optional(),
  isLot: z.boolean().default(false), lotItems: z.string().max(2000).nullable().optional(), lotQuantity: z.number().int().positive().nullable().optional(), lotExclusions: z.string().max(2000).nullable().optional(),
  location: z.string().min(2).max(120), assetTag: z.string().max(100).nullable().optional(), tagMissingReason: z.string().max(500).nullable().optional(),
  photoKeys: z.array(z.string().max(400)).max(15).default([]), pickupRules: z.string().min(5).max(2000), paymentRules: z.string().min(5).max(2000),
  startingPrice: z.number().int().positive(), reservePrice: z.number().int().positive().nullable().optional(), bidIncrement: z.number().int().positive(),
  startsAt: z.string().datetime(), endsAt: z.string().datetime(), paymentDeadline: z.string().datetime(), pickupDeadline: z.string().datetime(),
  antiSniping: z.boolean().default(true), antiSnipingMinutes: z.number().int().min(1).max(30).default(5), sensitive: z.boolean().default(false),
  itWipeConfirmed: z.boolean().default(false), wipeProofUrl: z.string().max(400).nullable().optional(), eligibilityRules: eligibilitySchema.default(defaultRules),
});

function isOwnedUpload(key: string, userId: string) {
  return key.startsWith(`uploads/${userId}/`) && !key.includes("..") && key.length < 400;
}

export function validateListing(values: z.infer<typeof listingSchema>, userId: string, existingKeys: string[] = []) {
  const start = new Date(values.startsAt), end = new Date(values.endsAt), payment = new Date(values.paymentDeadline), pickup = new Date(values.pickupDeadline);
  if (end <= start || payment <= end || pickup <= payment) return "Auction, payment, and pickup deadlines must be in chronological order.";
  if (values.reservePrice && values.reservePrice < values.startingPrice) return "Reserve must be at least the starting price.";
  if (!values.assetTag && !values.tagMissingReason) return "Provide an asset tag or a reason for using the generated auction reference.";
  if (values.isLot && (!["Inventory", "Scrap"].includes(values.category) || !values.lotItems || !values.lotQuantity || !values.conditionNotes || !values.lotExclusions)) return "Inventory or scrap lots need item list, quantity estimate, condition notes, and exclusions.";
  if (values.photoKeys.some((key) => !isOwnedUpload(key, userId) && !existingKeys.includes(key)) || (values.wipeProofUrl && !isOwnedUpload(values.wipeProofUrl, userId) && !existingKeys.includes(values.wipeProofUrl))) return "Upload keys must belong to your account.";
  return null;
}
