import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  appName: "Fewchore Asset Disposal",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => sendEmail({
      to: user.email,
      subject: "Reset your Fewchore password",
      html: `<p>Use this secure link to reset your password: <a href="${url}">Reset password</a></p>`,
    }),
  },
  emailVerification: {
    sendOnSignUp: true,
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
      employmentStatus: { type: "string", defaultValue: "ACTIVE", input: false },
      inviteToken: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: { create: {
      before: async (newUser) => {
        if (newUser.email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()) return { data: newUser };
        const invite = await db.employeeInvitation.findUnique({ where: { email: newUser.email.toLowerCase() } });
        if (!invite || invite.usedAt || invite.token !== (newUser as any).inviteToken) throw new APIError("FORBIDDEN", { message: "A valid administrator invitation is required." });
        return { data: { ...newUser, name: invite.name, role: invite.role, employeeId: invite.employeeId, jobGrade: invite.jobGrade, department: invite.department, location: invite.location, employmentStatus: invite.employmentStatus } };
      },
      after: async (newUser) => {
        if (newUser.email.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL?.toLowerCase()) await db.employeeInvitation.updateMany({ where: { email: newUser.email.toLowerCase(), usedAt: null }, data: { usedAt: new Date() } });
      },
    } },
    session: { create: { before: async (newSession) => {
      const user = await db.user.findUnique({ where: { id: newSession.userId }, select: { status: true, employmentStatus: true } });
      if (user?.status !== "ACTIVE" || user.employmentStatus === "TERMINATED") throw new APIError("FORBIDDEN", { message: "This employee account is inactive." });
      return { data: newSession };
    } } },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  rateLimit: { enabled: true, window: 60, max: 10 },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  plugins: [nextCookies()],
});
