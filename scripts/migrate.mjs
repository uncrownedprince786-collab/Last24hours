import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "..", "migrations", "schema.sql"), "utf8");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Run: node --env-file=.env.local scripts/migrate.mjs");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log("Connected. Running migration...");
  await client.query(sql);
  console.log("Migration complete.");
  await client.end();
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});