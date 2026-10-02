import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// A placeholder keeps static compilation independent from deployment secrets.
// Runtime database access still requires a real DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL || "postgresql://invalid:invalid@127.0.0.1:5432/fewchore";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const adapter = new PrismaPg({ connectionString: databaseUrl });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
