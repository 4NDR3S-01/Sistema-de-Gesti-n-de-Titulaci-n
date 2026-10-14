"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="sign-out-button"
      type="button"
      onClick={() => signOut({ redirectTo: "/" })}
    >
      Cerrar sesión
    </button>
  );
}
