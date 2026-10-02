import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canUseOperations } from "@/lib/permissions";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function requireOperationsUser() {
  const session = await requireUser();
  if (!canUseOperations(session.user.role)) redirect("/employee/dashboard");
  return session;
}
