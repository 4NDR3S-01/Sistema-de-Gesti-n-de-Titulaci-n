/**
 * Prepara la base de datos local:
 *  1. Crea la base DB_NAME si no existe.
 *  2. Si está vacía, carga schema.sql y seed.sql.
 *  3. Aplica las migraciones de database/migrations que falten.
 *
 * Uso: npm run db:setup  (lee las variables DB_* de .env.local)
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(root);

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};
const database = process.env.DB_NAME || "sistema_titulacion";
const sqlDir = join(root, "database");

async function ensureDatabase() {
  const admin = new pg.Client({ ...config, database: "postgres" });
  await admin.connect();
  const { rowCount } = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [database],
  );
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${database.replaceAll('"', '""')}"`);
    console.log(`Base de datos "${database}" creada.`);
  }
  await admin.end();
}

async function main() {
  await ensureDatabase();
  const client = new pg.Client({ ...config, database });
  await client.connect();

  try {
    const { rows } = await client.query(
      "SELECT to_regclass('public.users') IS NOT NULL AS ready",
    );
    if (!rows[0].ready) {
      await client.query(readFileSync(join(sqlDir, "schema.sql"), "utf8"));
      await client.query(readFileSync(join(sqlDir, "seed.sql"), "utf8"));
      console.log("Esquema y datos iniciales cargados.");
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const applied = new Set(
      (await client.query("SELECT name FROM schema_migrations")).rows.map(
        (row) => row.name,
      ),
    );
    const migrations = readdirSync(join(sqlDir, "migrations"))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrations) {
      if (applied.has(file)) continue;
      await client.query(readFileSync(join(sqlDir, "migrations", file), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      console.log(`Migración aplicada: ${file}`);
    }
    console.log("Base de datos lista.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("No se pudo preparar la base de datos:", error.message);
  process.exit(1);
});
