import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { CatalogApiService } from '../services/catalog-api.service';
import type {
  ApiErrorResponse,
  CatalogFilters,
  CatalogMeta,
  CatalogProduct,
} from '../models/catalog.models';

const DEFAULT_META: CatalogMeta = {
  page: 1,
  pageSize: 8,
  totalItems: 0,
  totalPages: 0,
};

@Injectable({
  providedIn: 'root',
})
export class CatalogFacade {
  private readonly catalogApiService = inject(CatalogApiService);
  private readonly currentFiltersSignal = signal<CatalogFilters>({
    page: DEFAULT_META.page,
    pageSize: DEFAULT_META.pageSize,
  });

  readonly products = signal<CatalogProduct[]>([]);
  readonly listLoading = signal(false);
  readonly listError = signal('');
  readonly meta = signal<CatalogMeta>(DEFAULT_META);
  readonly selectedProduct = signal<CatalogProduct | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');

  // Loads catalog data with merged filters and updates list state.
  loadCatalog(partialFilters: CatalogFilters = {}) {
    const mergedFilters = this.normalizeFilters({
      ...this.currentFiltersSignal(),
      ...partialFilters,
    });

    this.currentFiltersSignal.set(mergedFilters);
    this.listLoading.set(true);
    this.listError.set('');

    return this.catalogApiService.getProducts(mergedFilters).pipe(
      tap((response) => {
        this.products.set(response.data);
        this.meta.set(response.meta);
      }),
      finalize(() => this.listLoading.set(false)),
    );
  }

  // Loads product details and updates the selected product state.
  loadProductDetail(productId: string) {
    this.detailLoading.set(true);
    this.detailError.set('');
    this.selectedProduct.set(null);

    return this.catalogApiService.getProductById(productId).pipe(
      tap((response) => {
        this.selectedProduct.set(response.data);
      }),
      finalize(() => this.detailLoading.set(false)),
    );
  }

  // Returns the current normalized catalog filters.
  getCurrentFilters(): CatalogFilters {
    return this.currentFiltersSignal();
  }

  // Extracts a friendly API error message or returns the fallback.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }

  // Normalizes optional filters and applies default paging values.
  private normalizeFilters(filters: CatalogFilters): CatalogFilters {
    return {
      q: filters.q?.trim() || undefined,
      category: filters.category?.trim() || undefined,
      minPrice: filters.minPrice?.trim() || undefined,
      maxPrice: filters.maxPrice?.trim() || undefined,
      page: filters.page ?? DEFAULT_META.page,
      pageSize: filters.pageSize ?? DEFAULT_META.pageSize,
    };
  }
}
