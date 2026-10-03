import { z } from "zod";

export const eligibilitySchema = z.object({
  minimumGrade: z.string().max(30).optional(),
  departments: z.array(z.string().max(80)).default([]),
  locations: z.array(z.string().max(80)).default([]),
  employmentStatuses: z.array(z.string().max(40)).default(["ACTIVE"]),
  blockUnpaidWins: z.boolean().default(true),
  maximumWins: z.number().int().min(0).nullable().default(null),
  maximumCategoryWins: z.number().int().min(0).nullable().default(null),
});
export type EligibilityRules = z.infer<typeof eligibilitySchema>;
export const defaultRules: EligibilityRules = eligibilitySchema.parse({});
export function rulesFor(value: unknown): EligibilityRules {
  const result = eligibilitySchema.safeParse(value ?? {});
  return result.success ? result.data : defaultRules;
}

function gradeValue(value: string) {
  if (["EXCO", "EXECUTIVE"].includes(value.toUpperCase())) return Number.MAX_SAFE_INTEGER;
  const match = value.trim().toUpperCase().match(/^([A-Z]+)[ -]?(\d+)$/);
  if (!match) return null;
  return match[1].split("").reduce((score, char) => score * 27 + char.charCodeAt(0) - 64, 0) * 1000 + Number(match[2]);
}

export function profileEligibility(rules: EligibilityRules, employee: { employeeId: string | null; status: string; employmentStatus: string; jobGrade: string | null; department: string | null; location: string | null }) {
  if (employee.status !== "ACTIVE") return { eligible: false, reason: "Your employee account is not active." };
  if (!employee.employeeId || !employee.jobGrade || !employee.department || !employee.location) return { eligible: false, reason: "Your employee profile is incomplete. Contact Super Admin." };
  if (!rules.employmentStatuses.includes(employee.employmentStatus)) return { eligible: false, reason: "Your employment status is not eligible for this auction." };
  if (rules.departments.length && !rules.departments.includes(employee.department)) return { eligible: false, reason: `Limited to: ${rules.departments.join(", ")}.` };
  if (rules.locations.length && !rules.locations.includes(employee.location)) return { eligible: false, reason: `Limited to: ${rules.locations.join(", ")}.` };
  if (rules.minimumGrade) {
    const minimum = gradeValue(rules.minimumGrade);
    const actual = gradeValue(employee.jobGrade);
    if (minimum === null || actual === null || actual < minimum) return { eligible: false, reason: `Limited to Grade ${rules.minimumGrade} and above. Contact an administrator if your grade is missing.` };
  }
  return { eligible: true, reason: "You are eligible to bid." };
}
