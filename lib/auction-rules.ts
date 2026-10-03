import { db } from "@/lib/db";
import { rulesFor, profileEligibility } from "@/lib/eligibility";

export async function checkEligibility(auction: { id: string; category: string; eligibilityRules: unknown }, employee: { id: string; employeeId: string | null; status: string; employmentStatus: string; jobGrade: string | null; department: string | null; location: string | null }) {
  const rules = rulesFor(auction.eligibilityRules);
  const profile = profileEligibility(rules, employee);
  if (!profile.eligible) return profile;
  if (rules.maximumCategoryWins !== null) {
    const categoryWins = await db.winnerApproval.count({ where: { bidderId: employee.id, approved: true, auction: { category: auction.category, state: { in: ["PAID", "PICKUP_SCHEDULED", "PICKED_UP", "CLOSED"] } } } });
    if (categoryWins >= rules.maximumCategoryWins) return { eligible: false, reason: `Maximum wins in ${auction.category} reached.` };
  }
  if (rules.blockUnpaidWins) {
    const unpaid = await db.winnerApproval.count({ where: { bidderId: employee.id, approved: true, auction: { state: { in: ["PAYMENT_PENDING", "APPROVED_WINNER"] }, paymentDeadline: { lt: new Date() } } } });
    if (unpaid) return { eligible: false, reason: "You have an overdue unpaid auction win." };
  }
  if (rules.maximumWins !== null) {
    const wins = await db.winnerApproval.count({ where: { bidderId: employee.id, approved: true, auction: { state: { in: ["PAID", "PICKUP_SCHEDULED", "PICKED_UP", "CLOSED"] } } } });
    if (wins >= rules.maximumWins) return { eligible: false, reason: `Maximum of ${rules.maximumWins} previous wins reached.` };
  }
  return { eligible: true, reason: "You are eligible to bid." };
}

export function isOwnedUpload(key: string, userId: string) {
  return key.startsWith(`uploads/${userId}/`) && !key.includes("..") && key.length < 400;
}
