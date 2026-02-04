import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CatalogFacade } from './catalog.facade';
import { CatalogApiService } from '../services/catalog-api.service';
import type { CatalogListResponse } from '../models/catalog.models';

describe('CatalogFacade', () => {
  const catalogResponse: CatalogListResponse = {
    data: [
      {
        id: 'produto-1',
        slug: 'cafeteira-espresso-prime',
        name: 'Cafeteira Espresso Prime',
        description: 'Descrição',
        category: 'Eletroportáteis',
        imageUrl: null,
        price: 799.9,
        weightGrams: 3200,
        available: true,
        stockQuantity: 5,
      },
    ],
    meta: {
      page: 1,
      pageSize: 8,
      totalItems: 1,
      totalPages: 1,
    },
  };

  it('carrega o catalogo e atualiza os sinais', () => {
    const apiServiceMock = {
      getProducts: vi.fn().mockReturnValue(of(catalogResponse)),
      getProductById: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CatalogFacade,
        {
          provide: CatalogApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    const facade = TestBed.inject(CatalogFacade);

    facade.loadCatalog().subscribe();

    expect(apiServiceMock.getProducts).toHaveBeenCalled();
    expect(facade.products()).toEqual(catalogResponse.data);
    expect(facade.meta()).toEqual(catalogResponse.meta);
    expect(facade.listLoading()).toBeFalsy();
  });

  it('mantem listLoading false quando a API falha', async () => {
    const apiServiceMock = {
      getProducts: vi.fn().mockReturnValue(throwError(() => new Error('erro'))),
      getProductById: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CatalogFacade,
        {
          provide: CatalogApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    const facade = TestBed.inject(CatalogFacade);

    await expect(firstValueFrom(facade.loadCatalog())).rejects.toThrow();
    expect(facade.listLoading()).toBeFalsy();
  });
});
