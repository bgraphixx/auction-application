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
  await db.auction.upsert({
    where: { reference: "FFCL-IT-001" },
    update: {},
    create: {
      reference: "FFCL-IT-001", title: "Dell Latitude 7420", category: "IT assets", description: "Company-approved laptop with IT wipe evidence.", condition: "Good", location: "Victoria Island", startingPrice: 350000, currentBid: 485000, bidCount: 18, bidIncrement: 15000, startsAt: new Date(Date.now() - 86_400_000), endsAt: new Date(Date.now() + 13_200_000), paymentDeadline: new Date(Date.now() + 5 * 86_400_000), pickupDeadline: new Date(Date.now() + 10 * 86_400_000), sensitive: true, state: "LIVE",
    },
  });
  console.log(`Super-admin seeded: ${email}`);
}

seed().finally(() => db.$disconnect());
