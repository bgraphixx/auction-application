import { WorkspaceShell } from "@/components/workspace-shell";
import { requireUser } from "@/lib/require-user";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  return <WorkspaceShell user={{ name: session.user.name, role: session.user.role }}>{children}</WorkspaceShell>;
}
