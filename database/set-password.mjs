/**
 * Asigna una contraseña (hash bcrypt) a un usuario existente.
 *
 * Uso: npm run db:password -- correo@dominio
 * La contraseña se pide por consola para que no quede en el historial.
 */
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(root);

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run db:password -- correo@dominio");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question(`Nueva contraseña para ${email}: `);
rl.close();

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "sistema_titulacion",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

await client.connect();
const { rowCount } = await client.query(
  "UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2",
  [await bcrypt.hash(password, 12), email],
);
await client.end();

if (!rowCount) {
  console.error(`No existe un usuario con el correo ${email}.`);
  process.exit(1);
}
console.log(`Contraseña actualizada para ${email}.`);
