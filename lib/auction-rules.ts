import { db } from "@/lib/db";
import { rulesFor } from "@/lib/eligibility";

function gradeValue(value: string | null) {
  if (!value) return -1;
  const match = value.trim().toUpperCase().match(/^([A-Z]+)[ -]?(\d+)$/);
  if (!match) return null;
  return match[1].split("").reduce((score, char) => score * 27 + char.charCodeAt(0) - 64, 0) * 1000 + Number(match[2]);
}

export async function checkEligibility(auction: { id: string; category: string; eligibilityRules: unknown }, employee: { id: string; employeeId: string | null; status: string; jobGrade: string | null; department: string | null; location: string | null }) {
  const rules = rulesFor(auction.eligibilityRules);
  if (!employee.employeeId || !employee.jobGrade || !employee.department || !employee.location) return { eligible: false, reason: "Your employee profile is incomplete. Contact Super Admin." };
  if (!rules.employmentStatuses.includes(employee.status)) return { eligible: false, reason: "Your employment status is not eligible for this auction." };
  if (rules.departments.length && !rules.departments.includes(employee.department ?? "")) return { eligible: false, reason: `Limited to: ${rules.departments.join(", ")}.` };
  if (rules.locations.length && !rules.locations.includes(employee.location ?? "")) return { eligible: false, reason: `Limited to: ${rules.locations.join(", ")}.` };
  if (rules.minimumGrade) {
    const minimum = gradeValue(rules.minimumGrade);
    const actual = gradeValue(employee.jobGrade);
    if (minimum === null || actual === null || actual < minimum) return { eligible: false, reason: `Limited to Grade ${rules.minimumGrade} and above. Contact an administrator if your grade is missing.` };
  }
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
