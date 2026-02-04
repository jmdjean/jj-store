import { AppError } from '../src/common/app-error.js';
import { ProductsService } from '../src/services/products.service.js';
import type {
  ProductDatabaseRecord,
  ProductListResult,
  ProductsRepository,
} from '../src/repositories/products.repository.js';

const productRecord: ProductDatabaseRecord = {
  id: 'produto-1',
  slug: 'cafeteira-espresso-prime',
  name: 'Cafeteira Espresso Prime',
  description: 'Descrição',
  category: 'Eletroportáteis',
  image_url: 'https://example.com/produto.jpg',
  price_cents: 79990,
  weight_grams: 3200,
  stock_quantity: 5,
};

describe('ProductsService', () => {
  it('retorna produtos com meta de paginacao', async () => {
    const repository: Pick<ProductsRepository, 'findMany' | 'findById'> = {
      findMany: async (): Promise<ProductListResult> => ({
        items: [productRecord],
        totalItems: 1,
      }),
      findById: async () => null,
    };

    const service = new ProductsService(repository as ProductsRepository);
    const response = await service.listProducts({});

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      id: 'produto-1',
      price: 799.9,
      available: true,
      stockQuantity: 5,
    });
    expect(response.meta).toEqual({
      page: 1,
      pageSize: 12,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('retorna erro quando minPrice e invalido', async () => {
    const repository: Pick<ProductsRepository, 'findMany' | 'findById'> = {
      findMany: async (): Promise<ProductListResult> => ({
        items: [],
        totalItems: 0,
      }),
      findById: async () => null,
    };

    const service = new ProductsService(repository as ProductsRepository);

    await expect(service.listProducts({ minPrice: '-1' })).rejects.toMatchObject<AppError>({
      statusCode: 400,
      mensagem: 'Informe um valor válido para o campo minPrice.',
    });
  });

  it('retorna erro 404 quando produto nao existe', async () => {
    const repository: Pick<ProductsRepository, 'findMany' | 'findById'> = {
      findMany: async (): Promise<ProductListResult> => ({
        items: [],
        totalItems: 0,
      }),
      findById: async () => null,
    };

    const service = new ProductsService(repository as ProductsRepository);

    await expect(service.getProductById('id-inexistente')).rejects.toMatchObject<AppError>({
      statusCode: 404,
      mensagem: 'Produto não encontrado.',
    });
  });
});
