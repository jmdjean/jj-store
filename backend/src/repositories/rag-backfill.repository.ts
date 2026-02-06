import { runQuery } from '../config/database.js';
import type { RagEntityType } from './rag.repository.js';

export type RagBackfillFailureRow = {
  entity_type: RagEntityType;
  entity_id: string;
  failure_count: number;
  last_error: string;
  is_permanent: boolean;
  last_attempt_at: string;
};

export class RagBackfillRepository {
  // Records or updates a failure entry for an entity backfill attempt.
  async upsertFailure(
    entityType: RagEntityType,
    entityId: string,
    errorMessage: string,
    isPermanent: boolean,
  ): Promise<void> {
    await runQuery(
      `
        INSERT INTO rag_backfill_failures (
          entity_type,
          entity_id,
          failure_count,
          last_error,
          is_permanent,
          last_attempt_at,
          updated_at
        )
        VALUES ($1, $2, 1, $3, $4, NOW(), NOW())
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE
        SET
          failure_count = rag_backfill_failures.failure_count + 1,
          last_error = EXCLUDED.last_error,
          is_permanent = rag_backfill_failures.is_permanent OR EXCLUDED.is_permanent,
          last_attempt_at = NOW(),
          updated_at = NOW()
      `,
      [entityType, entityId, errorMessage, isPermanent],
    );
  }

  // Lists failure entries available for reprocessing.
  async listFailures(input: {
    entityType?: RagEntityType;
    includePermanent?: boolean;
    limit?: number;
  }): Promise<RagBackfillFailureRow[]> {
    const { entityType, includePermanent, limit } = input;
    const normalizedLimit = Math.min(Math.max(limit ?? 200, 1), 1000);

    return runQuery<RagBackfillFailureRow>(
      `
        SELECT
          entity_type,
          entity_id,
          failure_count,
          last_error,
          is_permanent,
          last_attempt_at::text
        FROM rag_backfill_failures
        WHERE ($1::text IS NULL OR entity_type = $1)
          AND ($2::boolean IS TRUE OR is_permanent = FALSE)
        ORDER BY updated_at DESC
        LIMIT $3
      `,
      [entityType ?? null, includePermanent ?? false, normalizedLimit],
    );
  }

  // Removes a failure entry after successful reprocessing.
  async deleteFailure(entityType: RagEntityType, entityId: string): Promise<void> {
    await runQuery(
      `
        DELETE FROM rag_backfill_failures
        WHERE entity_type = $1
          AND entity_id = $2
      `,
      [entityType, entityId],
    );
  }
}
