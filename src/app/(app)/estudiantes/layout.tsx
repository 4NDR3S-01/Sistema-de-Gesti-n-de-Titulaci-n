import { staffRoles } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";

export default async function StudentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser(staffRoles);
  return children;
}
