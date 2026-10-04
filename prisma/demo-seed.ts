import "dotenv/config";
import { db } from "../lib/db";

async function seedDemo() {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const nextMonth = new Date(); nextMonth.setDate(nextMonth.getDate() + 30);

  console.log("Creating demo assets...");

  const exco1 = await db.user.upsert({
    where: { email: "j.doe@fewchorefinance.com" },
    update: {},
    create: { id: "exco-1", email: "j.doe@fewchorefinance.com", name: "John Doe", role: "EMPLOYEE", employeeId: "FFCL-EMP-101", jobGrade: "EXCO", department: "Finance", location: "Lagos", emailVerified: true }
  });

  await db.auction.createMany({
    data: [
      {
        reference: "FFCL-VEH-001",
        title: "2019 Toyota Corolla - Executive Pool",
        description: "Well maintained executive pool vehicle. Full service history available at authorized dealer.",
        category: "Vehicles", location: "Lagos Head Office", condition: "Good", conditionNotes: "Minor scratch on rear bumper. AC works perfectly.", knownDefects: "None",
        startingPrice: 3500000, currentBid: 0, bidIncrement: 50000,
        startsAt: new Date(), endsAt: nextWeek,
        paymentRules: "Bank transfer to Fewchore Corporate Account within 48 hours of approval.", pickupRules: "Must be picked up from Lagos Head Office with valid ID and release form.",
        paymentDeadline: nextMonth, pickupDeadline: nextMonth,
        state: "LIVE", eligibilityRules: ["EXCO", "SENIOR_MANAGEMENT", "MANAGEMENT"]
      },
      {
        reference: "FFCL-IT-042",
        title: "Apple MacBook Pro M1 2020",
        description: "13-inch MacBook Pro M1, 16GB RAM, 512GB SSD. Used by engineering team.",
        category: "IT assets", location: "Abuja Branch", condition: "Excellent", conditionNotes: "Battery health at 89%. Includes original charger.", knownDefects: "None",
        startingPrice: 200000, currentBid: 350000, bidIncrement: 10000,
        startsAt: yesterday, endsAt: tomorrow,
        paymentRules: "Salary deduction option available for IT assets.", pickupRules: "Pickup from IT Helpdesk.",
        paymentDeadline: nextMonth, pickupDeadline: nextMonth,
        state: "LIVE", eligibilityRules: []
      },
      {
        reference: "FFCL-FUR-019",
        title: "Ergonomic Office Chair & Standing Desk Combo",
        description: "Herman Miller Aeron chair (Size B) and motorized standing desk (120x60cm).",
        category: "Furniture", location: "Lagos Head Office", condition: "Fair", conditionNotes: "Desk motor is slightly noisy. Chair mesh is perfect.", knownDefects: "Desk height display occasionally flickers.",
        startingPrice: 50000, currentBid: 50000, bidIncrement: 5000,
        startsAt: yesterday, endsAt: yesterday,
        paymentRules: "Direct transfer.", pickupRules: "Requires 2 people for pickup.",
        paymentDeadline: nextMonth, pickupDeadline: nextMonth,
        state: "HIGHEST_BID_PENDING_APPROVAL", eligibilityRules: []
      },
      {
        reference: "FFCL-IT-088",
        title: "Lot of 5x Dell Latitude 7400 Laptops",
        description: "Bundle of 5 retired laptops. All boot to BIOS. No storage drives included.",
        category: "IT assets", location: "Lagos Head Office", condition: "Poor", conditionNotes: "Heavy wear and tear. Missing keycaps on two units.", knownDefects: "No SSDs. Sold as-is for parts or repair.",
        startingPrice: 100000, currentBid: 0, bidIncrement: 20000,
        startsAt: nextWeek, endsAt: nextMonth,
        paymentRules: "Direct transfer.", pickupRules: "Must pick up entire lot.",
        paymentDeadline: nextMonth, pickupDeadline: nextMonth,
        state: "PENDING_APPROVAL", eligibilityRules: ["EXCO"]
      },
      {
        reference: "FFCL-GEN-002",
        title: "Mikano 100kVA Generator (2018)",
        description: "Retired branch generator. Maintained by Mikano. 14,000 hours.",
        category: "Machinery", location: "Port Harcourt Branch", condition: "Good", conditionNotes: "Fully functional when decommissioned.", knownDefects: "Requires new battery.",
        startingPrice: 1500000, currentBid: 2100000, bidIncrement: 100000,
        startsAt: yesterday, endsAt: yesterday,
        paymentRules: "Bank transfer.", pickupRules: "Buyer must arrange flatbed transport.",
        paymentDeadline: tomorrow, pickupDeadline: nextWeek,
        state: "PAYMENT_PENDING", eligibilityRules: []
      }
    ]
  });

  console.log("Demo assets seeded.");
}

seedDemo().finally(() => db.$disconnect());
