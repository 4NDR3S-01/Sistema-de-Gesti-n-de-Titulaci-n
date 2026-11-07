import { DashboardShell } from "@/components/dashboard-shell";
import { getRoleLabel } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";
import { getNotifications } from "@/lib/data/notifications";
import { countRegistrationsByStatus } from "@/lib/data/pat";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const [pendingReviews, notifications] = await Promise.all([
    user.role === "STUDENT" ? 0 : countRegistrationsByStatus().then((counts) => counts.PENDING),
    getNotifications(user),
  ]);

  return (
    <DashboardShell
      role={user.role}
      userName={`${user.name} ${user.lastname}`}
      userEmail={user.email}
      roleLabel={getRoleLabel(user.role)}
      notifications={notifications}
      pendingReviews={pendingReviews}
    >
      {children}
    </DashboardShell>
  );
}
