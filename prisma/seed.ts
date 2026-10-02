import "dotenv/config";
import { auth } from "../lib/auth";
import { db } from "../lib/db";

const email = process.env.SUPER_ADMIN_EMAIL ?? "";
const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
const name = process.env.SUPER_ADMIN_NAME ?? "Fewchore Super Admin";

if (email.length === 0 || password.length === 0) {
  throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before running the seed.");
}

async function seed() {
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    await auth.api.signUpEmail({ body: { name, email, password } });
  }
  await db.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN", emailVerified: true, employeeId: "FFCL-ADMIN-001", jobGrade: "EXCO", department: "Technology", location: "Lagos" },
  });
  for (const [category, bundleAllowed] of [["IT assets", false], ["Furniture", false], ["Vehicles", false], ["Machinery", false], ["Inventory", true], ["Scrap", true]] as const) {
    await db.assetCategory.upsert({ where: { name: category }, update: {}, create: { name: category, bundleAllowed } });
  }
  await db.systemSetting.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
  console.log(`Super-admin seeded: ${email}`);
}

seed().finally(() => db.$disconnect());
