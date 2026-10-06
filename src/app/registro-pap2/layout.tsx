import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAppRole } from "@/lib/auth-roles";

export default async function PapRegistrationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user || !isAppRole(role)) redirect("/");
  if (role !== "STUDENT" && role !== "ADMIN") redirect("/panel");
  return children;
}
