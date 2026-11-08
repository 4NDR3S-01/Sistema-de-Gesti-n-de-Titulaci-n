import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";

/** Punto de entrada: envía a cada persona a su espacio según su rol. */
export default function Index() {
  const { status, me } = useAuth();
  if (status === "loading") return null;
  if (status === "signedOut" || !me) return <Redirect href="/login" />;
  return <Redirect href={me.user.role === "STUDENT" ? "/(student)" : "/(staff)"} />;
}
