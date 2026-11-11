import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "sistema_titulacion",
    user: process.env.DB_USER || "postgres",
    // La contraseña "postgres" solo se asume en desarrollo; en producción debe configurarse.
    password: process.env.DB_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "postgres"),
    // Con SSL se verifica el certificado del servidor. Solo para servidores con
    // certificado autofirmado: DB_SSL_ALLOW_SELF_SIGNED=true.
    ssl:
      process.env.DB_SSL === "true"
        ? { rejectUnauthorized: process.env.DB_SSL_ALLOW_SELF_SIGNED !== "true" }
        : false,
    max: 10,
  });

// En desarrollo, el recargado en caliente volvería a crear el pool en cada cambio.
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Código de error de PostgreSQL (p. ej. 23505 = valor único duplicado). */
export function pgErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

/** Nombre de la restricción violada, si PostgreSQL lo informa. */
export function pgConstraint(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "constraint" in error
    ? String((error as { constraint: unknown }).constraint)
    : undefined;
}
