import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { isAppRole } from "@/lib/auth-roles";
import { findUserByEmail } from "@/lib/data/users";

const microsoftConfigured = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
);

const providers = [
  Credentials({
    id: "credentials",
    name: "Correo y contraseña",
    credentials: {
      email: { label: "Correo", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      if (process.env.PASSWORD_AUTH_ENABLED !== "true") return null;

      const email =
        typeof credentials.email === "string"
          ? credentials.email.trim().toLowerCase()
          : "";
      const password =
        typeof credentials.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const user = await findUserByEmail(email);
      if (!user || !user.is_active || !isAppRole(user.role)) return null;
      if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash)) {
        return null;
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatches) return null;

      return {
        id: String(user.id),
        email: user.email,
        name: `${user.name} ${user.lastname}`,
        role: user.role,
      };
    },
  }),
  ...(microsoftConfigured
    ? [
        MicrosoftEntraID({
          clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
          clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
          issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email:
                profile.email ??
                ("preferred_username" in profile &&
                typeof profile.preferred_username === "string"
                  ? profile.preferred_username
                  : null),
              image: null,
            };
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  jwt: { maxAge: 60 * 60 * 8 },
  pages: { signIn: "/" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "microsoft-entra-id") return true;

      // Solo cuentas institucionales registradas y activas en la base.
      const email = user.email?.trim().toLowerCase();
      const dbUser = email ? await findUserByEmail(email) : null;
      return Boolean(dbUser?.is_active && isAppRole(dbUser.role));
    },
    async jwt({ token, user, account }) {
      if (!user) return token;

      if (account?.provider === "microsoft-entra-id") {
        const email = user.email?.trim().toLowerCase();
        const dbUser = email ? await findUserByEmail(email) : null;
        if (dbUser && isAppRole(dbUser.role)) {
          token.sub = String(dbUser.id);
          token.role = dbUser.role;
          token.name = `${dbUser.name} ${dbUser.lastname}`;
        }
      } else if (isAppRole(user.role)) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && isAppRole(token.role)) {
        session.user.role = token.role;
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
});
