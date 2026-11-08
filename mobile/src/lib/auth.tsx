import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, setUnauthorizedHandler, tokenStore } from "@/lib/api";
import type { Me, User } from "@/lib/types";

type AuthState = {
  status: "loading" | "signedOut" | "signedIn";
  me: Me | null;
  signIn: (identifier: string, password: string, audience: "student" | "staff") => Promise<void>;
  signOut: () => Promise<void>;
  /** Vuelve a leer el usuario, su ficha y sus notificaciones. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [me, setMe] = useState<Me | null>(null);

  const signOut = useCallback(async () => {
    await tokenStore.clear();
    setMe(null);
    setStatus("signedOut");
  }, []);

  const refresh = useCallback(async () => {
    const data = await api.get<Me>("/api/v1/me");
    setMe(data);
    setStatus("signedIn");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      const saved = await tokenStore.load();
      if (!saved) return setStatus("signedOut");
      try {
        await refresh();
      } catch (error) {
        // Sin conexión: se conserva el token y se reintenta en el siguiente inicio.
        if (error instanceof ApiError && error.status === 401) await signOut();
        else setStatus("signedOut");
      }
    })();
  }, [refresh, signOut]);

  const signIn = useCallback(
    async (identifier: string, password: string, audience: "student" | "staff") => {
      const data = await api.post<{ token: string; user: User }>("/api/v1/auth/login", { identifier, password, audience });
      await tokenStore.save(data.token);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(() => ({ status, me, signIn, signOut, refresh }), [status, me, signIn, signOut, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
