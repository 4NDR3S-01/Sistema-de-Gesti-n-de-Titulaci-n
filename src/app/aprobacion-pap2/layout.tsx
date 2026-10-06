import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function PapApprovalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "SECRETARY" && role !== "ADMIN") redirect("/panel");
  return children;
}
