import { jest } from '@jest/globals';
import { RagBackfillController } from '../src/controllers/rag-backfill.controller.js';
import { AppError } from '../src/common/app-error.js';
import type { RagBackfillService, RagBackfillReport, RagReprocessReport } from '../src/services/rag-backfill.service.js';
import type { RagBackfillRepository, RagBackfillFailureRow } from '../src/repositories/rag-backfill.repository.js';
import type { Request, Response, NextFunction } from 'express';

const buildMockReport = (overrides?: Partial<RagBackfillReport>): RagBackfillReport => ({
  dryRun: false,
  total: 10,
  success: 8,
  failures: 2,
  startedAt: new Date('2025-01-01T00:00:00Z'),
  finishedAt: new Date('2025-01-01T00:01:00Z'),
  elapsedMs: 60000,
  perEntity: {
    product: { total: 5, success: 4, failures: 1 },
    customer: { total: 3, success: 2, failures: 1 },
    manager: { total: 2, success: 2, failures: 0 },
    order: { total: 0, success: 0, failures: 0 },
    order_item: { total: 0, success: 0, failures: 0 },
  },
  ...overrides,
});

const buildMockReprocessReport = (overrides?: Partial<RagReprocessReport>): RagReprocessReport => ({
  total: 5,
  success: 3,
  failures: 2,
  ...overrides,
});

const buildDeps = () => {
  const ragBackfillService = {
    runBackfill: jest.fn(async () => buildMockReport()),
    reprocessFailures: jest.fn(async () => buildMockReprocessReport()),
  } as unknown as RagBackfillService;

  const ragBackfillRepository = {
    listFailures: jest.fn(async () => [] as RagBackfillFailureRow[]),
    upsertFailure: jest.fn(async () => undefined),
    deleteFailure: jest.fn(async () => undefined),
  } as unknown as RagBackfillRepository;

  return {
    controller: new RagBackfillController(ragBackfillService, ragBackfillRepository),
    ragBackfillService,
    ragBackfillRepository,
  };
};

const mockRequest = (body?: Record<string, unknown>, query?: Record<string, string>): Request =>
  ({ body: body ?? {}, query: query ?? {} }) as unknown as Request;

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const mockNext: NextFunction = jest.fn() as unknown as NextFunction;

describe('RagBackfillController | unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- runBackfill ---

  it('returns backfill report with default entity types', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({});
    const res = mockResponse();

    await controller.runBackfill(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: 'Backfill concluído com sucesso.',
        relatorio: expect.objectContaining({ total: 10, sucesso: 8, falhas: 2 }),
      }),
    );
  });

  it('returns dry run message when dryRun is true', async () => {
    const { controller, ragBackfillService } = buildDeps();
    (ragBackfillService.runBackfill as jest.Mock).mockResolvedValue(
      buildMockReport({ dryRun: true }),
    );
    const req = mockRequest({ dryRun: true, entityTypes: ['product'] });
    const res = mockResponse();

    await controller.runBackfill(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: 'Simulação de backfill concluída com sucesso.',
      }),
    );
  });

  it('forwards error to next when entityId used with multiple types', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({ entityTypes: ['product', 'customer'], entityId: 'abc' });
    const res = mockResponse();

    await controller.runBackfill(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('forwards error to next when invalid entity type is provided', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({ entityTypes: ['invalid_type'] });
    const res = mockResponse();

    await controller.runBackfill(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('forwards error to next when invalid fromDate is provided', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({ fromDate: 'not-a-date' });
    const res = mockResponse();

    await controller.runBackfill(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  // --- reprocessFailures ---

  it('returns reprocess report with defaults', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({});
    const res = mockResponse();

    await controller.reprocessFailures(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: 'Reprocessamento de falhas concluído.',
        relatorio: expect.objectContaining({ total: 5, sucesso: 3, falhas: 2 }),
      }),
    );
  });

  it('passes entityType filter to reprocess service', async () => {
    const { controller, ragBackfillService } = buildDeps();
    const req = mockRequest({ entityType: 'order' });
    const res = mockResponse();

    await controller.reprocessFailures(req, res, mockNext);

    expect(ragBackfillService.reprocessFailures).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'order' }),
    );
  });

  it('forwards error to next when invalid entityType provided for reprocess', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({ entityType: 'invalid' });
    const res = mockResponse();

    await controller.reprocessFailures(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  // --- listFailures ---

  it('returns empty list when no failures exist', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({}, {});
    const res = mockResponse();

    await controller.listFailures(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: 'Nenhuma falha de backfill registrada.',
        total: 0,
        falhas: [],
      }),
    );
  });

  it('returns formatted failure list', async () => {
    const { controller, ragBackfillRepository } = buildDeps();
    (ragBackfillRepository.listFailures as jest.Mock).mockResolvedValue([
      {
        entity_type: 'product',
        entity_id: 'p-1',
        failure_count: 3,
        last_error: 'Timeout na geração de embeddings.',
        is_permanent: false,
        last_attempt_at: '2025-01-01T12:00:00Z',
      },
    ]);
    const req = mockRequest({}, { entityType: 'product', includePermanent: 'false' });
    const res = mockResponse();

    await controller.listFailures(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: 'Falhas de backfill recuperadas com sucesso.',
        total: 1,
        falhas: [
          expect.objectContaining({
            entityType: 'product',
            entityId: 'p-1',
            failureCount: 3,
            lastError: 'Timeout na geração de embeddings.',
            isPermanent: false,
          }),
        ],
      }),
    );
  });

  it('forwards error to next on invalid entityType query param', async () => {
    const { controller } = buildDeps();
    const req = mockRequest({}, { entityType: 'wrong' });
    const res = mockResponse();

    await controller.listFailures(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });
});
