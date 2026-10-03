import { WorkspaceShell } from "@/components/workspace-shell";
import { requireOperationsUser } from "@/lib/require-user";

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOperationsUser();
  return <WorkspaceShell user={{ name: session.user.name, role: session.user.role }} operations>{children}</WorkspaceShell>;
}
