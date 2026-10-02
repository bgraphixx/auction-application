import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

export const auth = betterAuth({
  appName: "Fewchore Asset Disposal",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => sendEmail({
      to: user.email,
      subject: "Reset your Fewchore password",
      html: `<p>Use this secure link to reset your password: <a href="${url}">Reset password</a></p>`,
    }),
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => sendEmail({
      to: user.email,
      subject: "Verify your Fewchore account",
      html: `<p>Verify your company account: <a href="${url}">Verify email</a></p>`,
    }),
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "EMPLOYEE", input: false },
      employeeId: { type: "string", required: false, input: false },
      jobGrade: { type: "string", required: false, input: false },
      department: { type: "string", required: false, input: false },
      location: { type: "string", required: false, input: false },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  rateLimit: { enabled: true, window: 60, max: 10 },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  plugins: [nextCookies()],
});
