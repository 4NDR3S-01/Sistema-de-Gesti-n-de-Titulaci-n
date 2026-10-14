import { DashboardShell } from "@/components/dashboard-shell";
import { getRoleLabel } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <DashboardShell
      role={user.role}
      userName={`${user.name} ${user.lastname}`}
      roleLabel={getRoleLabel(user.role)}
    >
      {children}
    </DashboardShell>
  );
}
