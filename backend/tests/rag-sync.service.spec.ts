import { jest } from '@jest/globals';
import { RagSyncService } from '../src/services/rag-sync.service.js';
import type { RagRepository, RagSearchRow } from '../src/repositories/rag.repository.js';

type RagRepositoryMock = {
  upsertDocument: jest.Mock<Promise<void>, [unknown, unknown?]>;
  deleteDocument: jest.Mock<Promise<void>, [unknown, unknown?]>;
  searchDocuments: jest.Mock<Promise<RagSearchRow[]>, [unknown]>;
};

const createRepositoryMock = (): RagRepositoryMock => ({
  upsertDocument: jest.fn().mockResolvedValue(undefined),
  deleteDocument: jest.fn().mockResolvedValue(undefined),
  searchDocuments: jest.fn().mockResolvedValue([]),
});

describe('RagSyncService', () => {
  it('gera markdown de produto com nome e categoria', () => {
    const repository = createRepositoryMock();
    const service = new RagSyncService(repository as unknown as RagRepository);

    const markdown = service.buildProductMarkdown({
      id: 'produto-1',
      name: 'Cafeteira Prime',
      description: 'Cafeteira para espresso',
      category: 'Eletroportáteis',
      salePriceCents: 79990,
      weightGrams: 3200,
      stockQuantity: 10,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

    expect(markdown).toContain('Nome: Cafeteira Prime');
    expect(markdown).toContain('Categoria: Eletroportáteis');
  });

  it('gera markdown de cliente sem dados sensíveis', () => {
    const repository = createRepositoryMock();
    const service = new RagSyncService(repository as unknown as RagRepository);

    const markdown = service.buildCustomerMarkdown({
      userId: 'cliente-1',
      city: 'Porto Alegre',
      state: 'RS',
      updatedAt: new Date().toISOString(),
    });

    expect(markdown).toContain('ID usuário: cliente-1');
    expect(markdown).toContain('Cidade: Porto Alegre');
    expect(markdown).not.toContain('CPF');
    expect(markdown).not.toContain('E-mail');
  });

  it('sincroniza produto e chama upsert no repositório', async () => {
    const repository = createRepositoryMock();
    const service = new RagSyncService(repository as unknown as RagRepository);

    await service.syncProduct({
      id: 'produto-1',
      name: 'Cafeteira Prime',
      description: 'Cafeteira para espresso',
      category: 'Eletroportáteis',
      salePriceCents: 79990,
      weightGrams: 3200,
      stockQuantity: 10,
      isActive: true,
      updatedAt: '2025-01-10T10:00:00.000Z',
    });

    expect(repository.upsertDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'product',
        entityId: 'produto-1',
      }),
      undefined,
    );
  });

  it('retorna erro quando query estiver vazia', async () => {
    const repository = createRepositoryMock();
    const service = new RagSyncService(repository as unknown as RagRepository);

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

    const service = new RagSyncService(repository as unknown as RagRepository);
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
