import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { env } from './env.js';

const pool = new Pool({
  connectionString: env.databaseUrl,
});

export type QueryExecutor = <T extends QueryResultRow>(
  text: string,
  values?: unknown[],
) => Promise<T[]>;

// Executes a SQL query using the shared pool connection.
export async function runQuery<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, values);
  return result.rows;
}

// Loads the embedding dimension configured in the rag_documents table.
export async function getRagEmbeddingDimension(): Promise<number | null> {
  const rows = await runQuery<{ dimension: number | null }>(`
    SELECT NULLIF(atttypmod, -1) - 4 AS dimension
    FROM pg_attribute
    WHERE attrelid = 'rag_documents'::regclass
      AND attname = 'embedding'
  `);
  const dimension = rows[0]?.dimension ?? null;

  if (!dimension || dimension <= 0) {
    return null;
  }

  return dimension;
}

// Runs a callback inside a database transaction using a dedicated client.
export async function runInTransaction<T>(callback: (query: QueryExecutor) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = buildClientQuery(client);
    const result = await callback(query);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Creates a typed query executor bound to a transactional client.
function buildClientQuery(client: PoolClient): QueryExecutor {
  return async <T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> => {
    const result = await client.query<T>(text, values);
    return result.rows;
  };
}
