import { db } from "@/lib/db";

export async function listingOptions() {
  const profiles = await db.user.findMany({ select: { jobGrade: true, department: true, location: true, employmentStatus: true } });
  const values = (key: keyof typeof profiles[number]) => [...new Set(profiles.flatMap(profile => profile[key] ? [profile[key]!] : []))].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
  return { grades: values("jobGrade"), departments: values("department"), locations: values("location"), employmentStatuses: [...new Set(["ACTIVE", ...values("employmentStatus")])] };
}
