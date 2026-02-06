import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/app-error.js';
import type { RagEntityType } from '../repositories/rag.repository.js';
import type { RagBackfillService } from '../services/rag-backfill.service.js';
import type { RagBackfillRepository } from '../repositories/rag-backfill.repository.js';
import { defaultRagBackfillInput } from '../services/rag-backfill.service.js';

type BackfillRequestBody = {
  entityTypes?: string[];
  fromDate?: string;
  toDate?: string;
  entityId?: string;
  dryRun?: boolean;
  batchSize?: number;
  maxItemAttempts?: number;
  failureAlertThreshold?: number;
};

type ReprocessRequestBody = {
  entityType?: string;
  includePermanent?: boolean;
  limit?: number;
  maxItemAttempts?: number;
};

type ListFailuresQuery = {
  entityType?: string;
  includePermanent?: string;
  limit?: string;
};

const ALLOWED_ENTITY_TYPES: RagEntityType[] = ['product', 'customer', 'manager', 'order', 'order_item'];

export class RagBackfillController {
  constructor(
    private readonly ragBackfillService: RagBackfillService,
    private readonly ragBackfillRepository: RagBackfillRepository,
  ) {}

  // Triggers a backfill or dry-run operation for the selected entity types.
  async runBackfill(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const body = request.body as BackfillRequestBody;
      const defaults = defaultRagBackfillInput();
      const entityTypes = this.parseEntityTypes(body.entityTypes);

      if (body.entityId && entityTypes.length !== 1) {
        throw new AppError(400, 'Informe apenas um entity_type ao usar entityId.');
      }

      if (body.fromDate) {
        this.validateIsoDate(body.fromDate);
      }

      if (body.toDate) {
        this.validateIsoDate(body.toDate);
      }

      const report = await this.ragBackfillService.runBackfill({
        entityTypes,
        fromDate: body.fromDate,
        toDate: body.toDate,
        entityId: body.entityId,
        dryRun: body.dryRun ?? false,
        batchSize: this.normalizePositiveInt(body.batchSize, defaults.batchSize),
        maxItemAttempts: this.normalizePositiveInt(body.maxItemAttempts, defaults.maxItemAttempts),
        failureAlertThreshold: this.normalizePositiveFloat(
          body.failureAlertThreshold,
          defaults.failureAlertThreshold,
        ),
      });

      response.status(200).json({
        mensagem: report.dryRun
          ? 'Simulação de backfill concluída com sucesso.'
          : 'Backfill concluído com sucesso.',
        relatorio: {
          dryRun: report.dryRun,
          total: report.total,
          sucesso: report.success,
          falhas: report.failures,
          duracaoMs: report.elapsedMs,
          detalhes: report.perEntity,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Reprocesses recorded failures from the dead-letter table.
  async reprocessFailures(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const body = request.body as ReprocessRequestBody;
      const defaults = defaultRagBackfillInput();
      const entityType = body.entityType ? this.parseSingleEntityType(body.entityType) : undefined;

      const report = await this.ragBackfillService.reprocessFailures({
        entityType,
        includePermanent: body.includePermanent ?? false,
        limit: this.normalizePositiveInt(body.limit, 200),
        maxItemAttempts: this.normalizePositiveInt(body.maxItemAttempts, defaults.maxItemAttempts),
      });

      response.status(200).json({
        mensagem: 'Reprocessamento de falhas concluído.',
        relatorio: {
          total: report.total,
          sucesso: report.success,
          falhas: report.failures,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Lists recorded backfill failures with optional filtering.
  async listFailures(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const query = request.query as ListFailuresQuery;
      const entityType = query.entityType ? this.parseSingleEntityType(query.entityType) : undefined;
      const includePermanent = query.includePermanent === 'true';
      const limit = this.normalizePositiveInt(
        query.limit ? Number(query.limit) : undefined,
        200,
      );

      const failures = await this.ragBackfillRepository.listFailures({
        entityType,
        includePermanent,
        limit,
      });

      response.status(200).json({
        mensagem: failures.length > 0
          ? 'Falhas de backfill recuperadas com sucesso.'
          : 'Nenhuma falha de backfill registrada.',
        total: failures.length,
        falhas: failures.map((row) => ({
          entityType: row.entity_type,
          entityId: row.entity_id,
          failureCount: row.failure_count,
          lastError: row.last_error,
          isPermanent: row.is_permanent,
          lastAttemptAt: row.last_attempt_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Validates and normalizes entity type list from request body.
  private parseEntityTypes(entityTypes: string[] | undefined): RagEntityType[] {
    if (!entityTypes || entityTypes.length === 0) {
      return ALLOWED_ENTITY_TYPES;
    }

    const normalized = entityTypes
      .map((item) => item.trim().toLowerCase())
      .filter((item): item is RagEntityType => ALLOWED_ENTITY_TYPES.includes(item as RagEntityType));

    if (normalized.length === 0) {
      throw new AppError(400, 'Informe pelo menos um entity_type válido.');
    }

    return normalized;
  }

  // Validates and normalizes a single entity type string.
  private parseSingleEntityType(value: string): RagEntityType {
    const normalized = value.trim().toLowerCase();

    if (!ALLOWED_ENTITY_TYPES.includes(normalized as RagEntityType)) {
      throw new AppError(400, 'Informe um entity_type válido.');
    }

    return normalized as RagEntityType;
  }

  // Validates an ISO date string.
  private validateIsoDate(value: string): void {
    if (Number.isNaN(Date.parse(value))) {
      throw new AppError(400, 'Data informada é inválida.');
    }
  }

  // Normalizes a positive integer with a default fallback.
  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined || value === null) {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  // Normalizes a non-negative float with a default fallback.
  private normalizePositiveFloat(value: number | undefined, fallback: number): number {
    if (value === undefined || value === null) {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    return parsed;
  }
}
