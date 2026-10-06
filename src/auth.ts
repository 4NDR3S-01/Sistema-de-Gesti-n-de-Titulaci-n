import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { isAppRole, type AppRole } from "@/lib/auth-roles";

type DemoAccount = {
  email: string;
  name: string;
  role: AppRole;
  passwordHash: string;
};

function getDemoAccounts(): DemoAccount[] {
  return [
    {
      email: process.env.DEMO_STUDENT_EMAIL?.trim().toLowerCase() ?? "",
      name: "Estudiante de prueba",
      role: "STUDENT",
      passwordHash: process.env.DEMO_STUDENT_PASSWORD_HASH_B64 ?? "",
    },
    {
      email: process.env.DEMO_SECRETARY_EMAIL?.trim().toLowerCase() ?? "",
      name: "Secretaría de prueba",
      role: "SECRETARY",
      passwordHash: process.env.DEMO_SECRETARY_PASSWORD_HASH_B64 ?? "",
    },
    {
      email: process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase() ?? "",
      name: "Administración de prueba",
      role: "ADMIN",
      passwordHash: process.env.DEMO_ADMIN_PASSWORD_HASH_B64 ?? "",
    },
  ];
}

function getMicrosoftRoleMap(): Record<string, AppRole> {
  const value = process.env.MICROSOFT_ROLE_MAP;
  if (!value) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("MICROSOFT_ROLE_MAP debe ser un objeto JSON válido.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MICROSOFT_ROLE_MAP debe ser un objeto de correos y roles.");
  }

  const entries = Object.entries(parsed);
  if (
    entries.some(
      ([email, role]) =>
        !email.includes("@") || !isAppRole(role),
    )
  ) {
    throw new Error(
      "MICROSOFT_ROLE_MAP contiene un correo o rol inválido. Roles: STUDENT, SECRETARY, ADMIN.",
    );
  }

  return Object.fromEntries(
    entries.map(([email, role]) => [email.trim().toLowerCase(), role]),
  ) as Record<string, AppRole>;
}

const microsoftRoleMap = getMicrosoftRoleMap();
const microsoftConfigured = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
);

const providers = [
  Credentials({
    id: "credentials",
    name: "Cuenta de prueba",
    credentials: {
      email: { label: "Correo de prueba", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      if (
        process.env.NODE_ENV !== "development" ||
        process.env.DEMO_AUTH_ENABLED !== "true"
      ) {
        return null;
      }

      const email =
        typeof credentials.email === "string"
          ? credentials.email.trim().toLowerCase()
          : "";
      const password =
        typeof credentials.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const account = getDemoAccounts().find((item) => item.email === email);
      if (!account) return null;

      const passwordHash = Buffer.from(account.passwordHash, "base64").toString(
        "utf8",
      );
      if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
        return null;
      }

      const passwordMatches = await bcrypt.compare(password, passwordHash);
      if (!passwordMatches) return null;

      return {
        id: account.email,
        email: account.email,
        name: account.name,
        role: account.role,
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
    signIn({ user, account }) {
      if (account?.provider !== "microsoft-entra-id") return true;

      const email = user.email?.trim().toLowerCase();
      const role = email ? microsoftRoleMap[email] : undefined;
      if (!role) return false;
      user.role = role;
      return true;
    },
    jwt({ token, user }) {
      const email = token.email?.trim().toLowerCase();
      if (user && isAppRole(user.role)) token.role = user.role;
      if (email && microsoftRoleMap[email]) token.role = microsoftRoleMap[email];
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
