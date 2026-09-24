import { db } from "../db";

export async function getJob(name: string): Promise<{ last_run: Date | null; last_status: string | null } | null> {
  const { rows } = await db.query(`SELECT last_run, last_status FROM jobs WHERE name = $1`, [name]);
  return rows[0] ?? null;
}

export async function recordJobRun(name: string, ok: boolean, detail: string): Promise<void> {
  const durationMs = 0;
  await db.query(
    `INSERT INTO jobs (name, last_run, last_status, last_duration_ms, last_detail)
     VALUES ($1, now(), $2, $3, $4)
     ON CONFLICT (name) DO UPDATE SET last_run = now(), last_status = EXCLUDED.last_status, last_duration_ms = EXCLUDED.last_duration_ms, last_detail = EXCLUDED.last_detail`,
    [name, ok ? "ok" : "failed", durationMs, detail]
  );
}

export async function updateJobSettings(): Promise<void> {
  await db.query(
    `INSERT INTO system_settings (key, value) VALUES ('last_ingest', to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );
}

export async function logJobRun(
  name: string,
  status: string,
  detail: string,
  durationMs: number
): Promise<void> {
  await db.query(
    `INSERT INTO job_runs (name, started_at, finished_at, status, detail, duration_ms)
     VALUES ($1, now() - ($4::int * interval '1 millisecond'), now(), $2, $3, $4)`,
    [name, status, detail, Math.round(durationMs)]
  );
}