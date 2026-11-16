import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd());

const option = process.argv[2];
if (!option) throw new Error("Falta la opción de aprobación");

const client = new pg.Client({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "sistema_titulacion",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

await client.connect();
await client.query("UPDATE pat_registrations SET approval_option = $1 WHERE id = 5", [option]);
const { rows } = await client.query(
  "SELECT id, approval_option, modality, participation_type, title FROM pat_registrations WHERE id = 5",
);
console.log(rows[0]);
await client.end();
