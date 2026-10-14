import { requireUser } from "@/lib/current-user";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser(["ADMIN"]);
  return children;
}
