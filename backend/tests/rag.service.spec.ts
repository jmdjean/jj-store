import { jest } from '@jest/globals';
import { RagService } from '../src/services/rag.service.js';
import type {
  CustomerRagSource,
  ManagerRagSource,
  OrderItemRagSource,
  OrderRagSource,
  ProductRagSource,
  RagRepository,
  RagSearchRow,
} from '../src/repositories/rag.repository.js';

type RagRepositoryMock = {
  upsertDocument: jest.Mock<Promise<void>, [unknown]>;
  searchDocuments: jest.Mock<Promise<RagSearchRow[]>, [unknown]>;
  listProductsForIndexing: jest.Mock<Promise<ProductRagSource[]>, []>;
  listCustomersForIndexing: jest.Mock<Promise<CustomerRagSource[]>, []>;
  listManagersForIndexing: jest.Mock<Promise<ManagerRagSource[]>, []>;
  listOrdersForIndexing: jest.Mock<Promise<OrderRagSource[]>, []>;
  listOrderItemsForIndexing: jest.Mock<Promise<OrderItemRagSource[]>, []>;
};

const createRepositoryMock = (): RagRepositoryMock => ({
  upsertDocument: jest.fn().mockResolvedValue(undefined),
  searchDocuments: jest.fn().mockResolvedValue([]),
  listProductsForIndexing: jest.fn().mockResolvedValue([]),
  listCustomersForIndexing: jest.fn().mockResolvedValue([]),
  listManagersForIndexing: jest.fn().mockResolvedValue([]),
  listOrdersForIndexing: jest.fn().mockResolvedValue([]),
  listOrderItemsForIndexing: jest.fn().mockResolvedValue([]),
});

describe('RagService', () => {
  it('retorna erro quando query estiver vazia', async () => {
    const repository = createRepositoryMock();
    const service = new RagService(repository as unknown as RagRepository);

    await expect(service.search({ query: '   ' })).rejects.toMatchObject({
      statusCode: 400,
      mensagem: 'Digite uma pergunta para pesquisar.',
    });
  });

  it('retorna resultados semânticos com score e snippet', async () => {
    const repository = createRepositoryMock();
    repository.searchDocuments.mockResolvedValue([
      {
        entity_type: 'product',
        entity_id: 'p-1',
        content_markdown: '# Produto\n- Nome: Teclado sem fio',
        metadata_json: { category: 'Periféricos' },
        score: 0.92341234,
      },
    ]);

    const service = new RagService(repository as unknown as RagRepository);
    const response = await service.search({ query: 'teclado para escritório', topK: 5 });

    expect(response.mensagem).toBe('Pesquisa RAG concluída com sucesso.');
    expect(response.resultados).toHaveLength(1);
    expect(response.resultados[0]).toEqual(
      expect.objectContaining({
        entityType: 'product',
        entityId: 'p-1',
        score: 0.923412,
      }),
    );
  });
});
