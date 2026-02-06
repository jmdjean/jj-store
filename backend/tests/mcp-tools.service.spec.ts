import { jest } from '@jest/globals';
import { McpToolsService } from '../src/services/mcp-tools.service.js';
import type { RagRepository } from '../src/repositories/rag.repository.js';
import type { SqlAnalyticsRepository } from '../src/repositories/sql-analytics.repository.js';
import type { RagSyncService, RagSearchResponse } from '../src/services/rag-sync.service.js';
import type { McpCorrelationContext } from '../src/services/mcp.types.js';

type SqlAnalyticsRepositoryMock = {
  getSalesMetrics: jest.Mock;
  getTopProducts: jest.Mock;
  getOrderStatusCounts: jest.Mock;
  getCustomerMetrics: jest.Mock;
  getLowStockProducts: jest.Mock;
  getDailyRevenue: jest.Mock;
};

type RagSyncServiceMock = {
  search: jest.Mock;
};

const createSqlMock = (): SqlAnalyticsRepositoryMock => ({
  getSalesMetrics: jest.fn().mockResolvedValue([
    { total_orders: '42', total_revenue_cents: '500000', avg_order_value_cents: '11905', canceled_orders: '3' },
  ]),
  getTopProducts: jest.fn().mockResolvedValue([]),
  getOrderStatusCounts: jest.fn().mockResolvedValue([]),
  getCustomerMetrics: jest.fn().mockResolvedValue([]),
  getLowStockProducts: jest.fn().mockResolvedValue([]),
  getDailyRevenue: jest.fn().mockResolvedValue([]),
});

const createRagSyncMock = (): RagSyncServiceMock => ({
  search: jest.fn().mockResolvedValue({
    mensagem: 'Pesquisa RAG concluída com sucesso.',
    resultados: [],
  } satisfies RagSearchResponse),
});

const createRagRepoMock = () => ({});

const createContext = (): McpCorrelationContext => ({
  correlationId: 'test-corr-001',
  actorUserId: 'user-123',
  actorRole: 'ADMIN',
  startedAt: Date.now(),
});

describe('McpToolsService', () => {
  describe('validateSqlAnalyticsInput', () => {
    it('rejeita pergunta vazia', () => {
      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      expect(() => service.validateSqlAnalyticsInput({ question: '' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('rejeita dateRange com formato inválido', () => {
      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      expect(() =>
        service.validateSqlAnalyticsInput({
          question: 'vendas',
          dateRange: { from: '01-01-2025' },
        }),
      ).toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('aceita input válido com dateRange correto', () => {
      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      expect(() =>
        service.validateSqlAnalyticsInput({
          question: 'total de vendas',
          dateRange: { from: '2025-01-01', to: '2025-01-31' },
        }),
      ).not.toThrow();
    });
  });

  describe('validateRagOperationalInput', () => {
    it('rejeita query vazia', () => {
      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      expect(() => service.validateRagOperationalInput({ query: '   ' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('rejeita topK fora do limite', () => {
      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      expect(() =>
        service.validateRagOperationalInput({ query: 'produto', topK: 50 }),
      ).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('validateRagStrategicInput', () => {
    it('rejeita query vazia', () => {
      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      expect(() => service.validateRagStrategicInput({ query: '' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });
  });

  describe('executeSqlAnalytics', () => {
    it('retorna resultado SQL com métricas de vendas', async () => {
      const sqlMock = createSqlMock();
      const service = new McpToolsService(
        sqlMock as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      const result = await service.executeSqlAnalytics(
        { question: 'total de vendas' },
        createContext(),
      );

      expect(result.tool).toBe('sql_analytics_query');
      expect(result.rowCount).toBe(1);
      expect(result.rows[0]).toHaveProperty('total_orders');
      expect(sqlMock.getSalesMetrics).toHaveBeenCalled();
    });

    it('direciona para top products quando pergunta sobre ranking', async () => {
      const sqlMock = createSqlMock();
      sqlMock.getTopProducts.mockResolvedValue([
        { product_id: 'p1', product_name: 'Café', total_sold: '100' },
      ]);

      const service = new McpToolsService(
        sqlMock as unknown as SqlAnalyticsRepository,
        createRagSyncMock() as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      const result = await service.executeSqlAnalytics(
        { question: 'produto mais vendido' },
        createContext(),
      );

      expect(result.rowCount).toBe(1);
      expect(sqlMock.getTopProducts).toHaveBeenCalled();
    });
  });

  describe('executeRagOperational', () => {
    it('retorna resultados da pesquisa semântica operacional', async () => {
      const ragMock = createRagSyncMock();
      ragMock.search.mockResolvedValue({
        mensagem: 'Pesquisa RAG concluída com sucesso.',
        resultados: [
          {
            entityType: 'product',
            entityId: 'p-1',
            score: 0.92,
            snippet: 'Cafeteira Premium',
            metadata: { category: 'Eletroportáteis' },
          },
        ],
      });

      const service = new McpToolsService(
        createSqlMock() as unknown as SqlAnalyticsRepository,
        ragMock as unknown as RagSyncService,
        createRagRepoMock() as unknown as RagRepository,
      );

      const result = await service.executeRagOperational(
        { query: 'cafeteira premium' },
        createContext(),
      );

      expect(result.tool).toBe('rag_operational_search');
      expect(result.totalFound).toBe(1);
      expect(result.results[0].entityType).toBe('product');
    });
  });
});
