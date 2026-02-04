import { Pool, type QueryResultRow } from 'pg';
import { env } from './env.js';

const pool = new Pool({
  connectionString: env.databaseUrl,
});

export async function runQuery<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, values);
  return result.rows;
}
