import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminProductsFacade } from './admin-products.facade';
import { AdminProductsApiService } from '../services/admin-products-api.service';
import type {
  AdminProductMutationResponse,
  AdminProductsListResponse,
} from '../models/admin-products.models';

describe('AdminProductsFacade', () => {
  const listResponse: AdminProductsListResponse = {
    data: [
      {
        id: 'produto-1',
        slug: 'cafeteira-prime',
        name: 'Cafeteira Prime',
        description: 'Descrição',
        categoryId: 'cat-1',
        imageUrl: null,
        purchasePrice: 350,
        salePrice: 799.9,
        weightGrams: 3000,
        stockQuantity: 7,
        isActive: true,
        createdAt: '2025-01-01T10:00:00.000Z',
        updatedAt: '2025-01-01T10:00:00.000Z',
      },
    ],
  };

  const mutationResponse: AdminProductMutationResponse = {
    mensagem: 'Produto cadastrado com sucesso.',
    data: listResponse.data[0],
  };

  it('carrega produtos e atualiza estado', () => {
    const apiServiceMock = {
      getProducts: vi.fn().mockReturnValue(of(listResponse)),
      getProductById: vi.fn(),
      createProduct: vi.fn().mockReturnValue(of(mutationResponse)),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AdminProductsFacade,
        {
          provide: AdminProductsApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    const facade = TestBed.inject(AdminProductsFacade);

    facade.loadProducts().subscribe();

    expect(apiServiceMock.getProducts).toHaveBeenCalled();
    expect(facade.products()).toEqual(listResponse.data);
    expect(facade.loading()).toBeFalsy();
  });

  it('marca saving false quando criacao falha', async () => {
    const apiServiceMock = {
      getProducts: vi.fn().mockReturnValue(of(listResponse)),
      getProductById: vi.fn(),
      createProduct: vi.fn().mockReturnValue(throwError(() => new Error('erro'))),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AdminProductsFacade,
        {
          provide: AdminProductsApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    const facade = TestBed.inject(AdminProductsFacade);

    await expect(
      firstValueFrom(
        facade.createProduct({
          name: 'Cafeteira Prime',
          description: 'Descrição',
          categoryId: 'cat-1',
          quantity: 7,
          weightGrams: 3000,
          purchasePrice: 350,
          salePrice: 799.9,
          imageUrl: null,
        }),
      ),
    ).rejects.toThrow();

    expect(facade.saving()).toBeFalsy();
  });
});
