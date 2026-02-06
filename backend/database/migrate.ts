import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

const databaseUrl =
  process.env.SUPABASE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://jj_store_user:jj_store_pass@localhost:5432/jj_store';

async function runMigrations(): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Track which migrations have already run
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: executed } = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations ORDER BY filename',
    );
    const executedSet = new Set(executed.map((r) => r.filename));

    // Read and sort migration files
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let applied = 0;

    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`[migrate] skip (already applied): ${file}`);
        continue;
      }

      let sql = await readFile(join(migrationsDir, file), 'utf-8');
      if (sql.charCodeAt(0) === 0xfeff) sql = sql.slice(1);

      console.log(`[migrate] applying: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied++;
        console.log(`[migrate] applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] FAILED: ${file}`, err);
        throw err;
      }
    }

    console.log(`[migrate] done. ${applied} migration(s) applied, ${files.length - applied} skipped.`);
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error('[migrate] fatal error:', err);
  process.exit(1);
});
