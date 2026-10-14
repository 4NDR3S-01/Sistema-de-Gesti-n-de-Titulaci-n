"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { getRoleLabel } from "@/lib/auth-roles";
import { SignOutButton } from "@/components/sign-out-button";

export function WorkflowNavigation() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  if (status !== "authenticated" || !role) return null;

  return (
    <div className="workflow-header-actions">
      <nav className="workflow-nav" aria-label="Secciones disponibles">
        {role !== "SECRETARY" && <Link href="/registro-pat-2">Registro PAT 2</Link>}
        {(role === "SECRETARY" || role === "ADMIN") && (
          <Link href="/aprobacion-pat-2">Aprobación PAT 2</Link>
        )}
        {(role === "SECRETARY" || role === "ADMIN") && (
          <Link href="/tribunales">Tribunales</Link>
        )}
      </nav>
      <span className="workflow-role">{getRoleLabel(role)}</span>
      <SignOutButton />
    </div>
  );
}
