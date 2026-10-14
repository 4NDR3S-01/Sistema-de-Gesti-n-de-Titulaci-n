import { requireUser } from "@/lib/current-user";

export default async function PatRegistrationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser(["STUDENT", "ADMIN"]);
  return children;
}
