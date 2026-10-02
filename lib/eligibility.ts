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
