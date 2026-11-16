import nextEnv from "@next/env";
import { SignJWT } from "jose";

nextEnv.loadEnvConfig(process.cwd());

const secret = new TextEncoder().encode(`${process.env.AUTH_SECRET}:mobile-api`);
const token = await new SignJWT({})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("4")
  .setAudience("uleam-titulacion-mobile")
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(secret);
console.log(token);
