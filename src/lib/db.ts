import pg from "pg";

const globalForPg = globalThis as unknown as { pool?: pg.Pool };

function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
  pool.on("error", () => {
    // keep the pool alive through transient network errors
  });
  return pool;
}

export const db = globalForPg.pool ?? (globalForPg.pool = createPool());

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return db.query<T>(text, params as never);
}

export async function closeDb(): Promise<void> {
  if (globalForPg.pool) {
    await globalForPg.pool.end();
    globalForPg.pool = undefined;
  }
}