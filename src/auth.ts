import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { isAppRole } from "@/lib/auth-roles";
import { findUserByCedula, findUserByEmail, syncUserNames } from "@/lib/data/users";
import { syncStudentFromDirectory } from "@/lib/directory";
import { emailDomain, isInstitutionalEmail, isStudentEmail, parseLoginIdentifier } from "@/lib/institution";
import { clearSuccessfulLogin, loginIsRateLimited, recordFailedLogin } from "@/lib/login-rate-limit";

/** En desarrollo, explica en la consola del servidor por qué se rechazó un login. */
function logRejectedLogin(email: string, reason: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[login] ${email}: ${reason}`);
  }
}

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
      if (process.env.PASSWORD_AUTH_ENABLED !== "true") {
        logRejectedLogin("-", "PASSWORD_AUTH_ENABLED no está en true");
        return null;
      }

      const rawIdentifier = typeof credentials.identifier === "string" ? credentials.identifier : "";
      const password = typeof credentials.password === "string" ? credentials.password : "";
      const audience = credentials.audience;
      const identifier = parseLoginIdentifier(rawIdentifier);
      // Se usa una clave estable para contabilizar fallos sin almacenar el identificador en claro.
      const throttleId = rawIdentifier.trim().toLowerCase().slice(0, 256);
      if (loginIsRateLimited(throttleId, request)) return null;

      const reject = () => {
        recordFailedLogin(throttleId, request);
        return null;
      };

      if (!identifier || !password || (audience !== "student" && audience !== "staff")) {
        return reject();
      }
      const loginValue = identifier.value;

      if (identifier.kind === "email" && !isInstitutionalEmail(loginValue)) {
        return reject();
      }
      // La selección estudiante/personal se verifica también en el servidor.
      if (audience === "student") {
        if (identifier.kind === "email" && !isStudentEmail(loginValue)) return reject();
      } else if (identifier.kind !== "email" || emailDomain(loginValue) !== "uleam.edu.ec") {
        return reject();
      }

      const user = identifier.kind === "cedula"
        ? await findUserByCedula(loginValue)
        : await findUserByEmail(loginValue);
      if (!user || !user.is_active || !isAppRole(user.role)) return reject();
      if (audience === "student" && user.role !== "STUDENT") return reject();
      if (audience === "staff" && user.role !== "SECRETARY" && user.role !== "ADMIN") return reject();
      if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash)) {
        return reject();
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatches) return reject();

      clearSuccessfulLogin(throttleId);
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
