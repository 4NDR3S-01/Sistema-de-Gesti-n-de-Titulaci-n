import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { isAppRole } from "@/lib/auth-roles";
import { verifyCredentials } from "@/lib/auth-credentials";
import { findUserByEmail, syncUserNames } from "@/lib/data/users";
import { syncStudentFromDirectory } from "@/lib/directory";
import { isInstitutionalEmail } from "@/lib/institution";

/** Tenant de Microsoft 365 de la ULEAM (live.uleam.edu.ec y uleam.edu.ec). */
const ULEAM_ISSUER = "https://login.microsoftonline.com/31a17900-7589-4cfc-b11a-f4e83c27b8ed/v2.0";

export const microsoftConfigured = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
);

const providers = [
  Credentials({
    id: "credentials",
    name: "Correo institucional o cédula",
    credentials: {
      identifier: { label: "Correo institucional o cédula", type: "text" },
      password: { label: "Contraseña", type: "password" },
      audience: { label: "Tipo de cuenta", type: "text" },
    },
    async authorize(credentials, request) {
      // Reglas compartidas con la app móvil: límite de intentos y tipo de cuenta según el rol.
      const user = await verifyCredentials(credentials.identifier, credentials.password, credentials.audience, request);
      if (!user) return null;
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
          issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER || ULEAM_ISSUER,
          authorization: {
            params: {
              scope: "openid profile email User.Read",
              prompt: "select_account",
              domain_hint: "uleam.edu.ec",
            },
          },
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
      if (!email || !isInstitutionalEmail(email)) return false;
      const dbUser = await findUserByEmail(email);
      return Boolean(dbUser?.is_active && isAppRole(dbUser.role));
    },
    async jwt({ token, user, account, profile }) {
      if (!user) return token;

      if (account?.provider === "microsoft-entra-id") {
        const email = user.email?.trim().toLowerCase();
        const dbUser = email ? await findUserByEmail(email) : null;
        if (dbUser && isAppRole(dbUser.role)) {
          // El directorio de la universidad es la fuente oficial del nombre.
          const givenName = typeof profile?.given_name === "string" ? profile.given_name.trim() : "";
          const familyName = typeof profile?.family_name === "string" ? profile.family_name.trim() : "";
          if (givenName && familyName) await syncUserNames(dbUser.id, givenName, familyName);
          // Completa la ficha del estudiante con su perfil del directorio (Microsoft Graph).
          if (dbUser.role === "STUDENT" && account.access_token) {
            await syncStudentFromDirectory(dbUser.id, account.access_token);
          }
          token.sub = String(dbUser.id);
          token.role = dbUser.role;
          token.name = givenName && familyName
            ? `${givenName} ${familyName}`
            : `${dbUser.name} ${dbUser.lastname}`;
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
