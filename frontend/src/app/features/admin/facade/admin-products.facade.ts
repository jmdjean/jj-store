import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { AdminProductsApiService } from '../services/admin-products-api.service';
import type {
  AdminProduct,
  AdminProductPayload,
  AdminProductsFilters,
  ApiErrorResponse,
} from '../models/admin-products.models';

const DEFAULT_FILTERS: AdminProductsFilters = {
  status: 'active',
};

@Injectable({
  providedIn: 'root',
})
export class AdminProductsFacade {
  private readonly adminProductsApiService = inject(AdminProductsApiService);
  private readonly productsSignal = signal<AdminProduct[]>([]);
  private readonly selectedProductSignal = signal<AdminProduct | null>(null);
  private readonly filtersSignal = signal<AdminProductsFilters>(DEFAULT_FILTERS);

  readonly products = computed(() => this.productsSignal());
  readonly selectedProduct = computed(() => this.selectedProductSignal());
  readonly filters = computed(() => this.filtersSignal());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  // Loads products for admin listing and updates local state.
  loadProducts(partialFilters: AdminProductsFilters = {}) {
    const nextFilters = this.normalizeFilters({
      ...this.filtersSignal(),
      ...partialFilters,
    });

    this.filtersSignal.set(nextFilters);
    this.loading.set(true);
    this.error.set('');

    return this.adminProductsApiService.getProducts(nextFilters).pipe(
      tap((response) => {
        this.productsSignal.set(response.data);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  // Loads one product to support edit form prefill.
  loadProductById(productId: string) {
    this.loading.set(true);
    this.error.set('');
    this.selectedProductSignal.set(null);

    return this.adminProductsApiService.getProductById(productId).pipe(
      tap((response) => this.selectedProductSignal.set(response.data)),
      finalize(() => this.loading.set(false)),
    );
  }

  // Creates a new product and prepends the result in the current list.
  createProduct(payload: AdminProductPayload) {
    this.saving.set(true);
    this.error.set('');
    this.successMessage.set('');

    return this.adminProductsApiService.createProduct(payload).pipe(
      tap((response) => {
        this.successMessage.set(response.mensagem);
        this.productsSignal.set([response.data, ...this.productsSignal()]);
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  // Updates one product and keeps list/detail state in sync.
  updateProduct(productId: string, payload: AdminProductPayload) {
    this.saving.set(true);
    this.error.set('');
    this.successMessage.set('');

    return this.adminProductsApiService.updateProduct(productId, payload).pipe(
      tap((response) => {
        this.successMessage.set(response.mensagem);
        this.productsSignal.set(
          this.productsSignal().map((product) =>
            product.id === response.data.id ? response.data : product,
          ),
        );

        if (this.selectedProductSignal()?.id === response.data.id) {
          this.selectedProductSignal.set(response.data);
        }
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  // Deactivates one product and removes it from active listings.
  deleteProduct(productId: string) {
    this.saving.set(true);
    this.error.set('');
    this.successMessage.set('');

    return this.adminProductsApiService.deleteProduct(productId).pipe(
      tap((response) => {
        this.successMessage.set(response.mensagem);
        this.productsSignal.set(this.productsSignal().filter((product) => product.id !== productId));
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  // Formats API errors into a user-friendly pt-BR message.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }

  // Normalizes filter values and applies default active status.
  private normalizeFilters(filters: AdminProductsFilters): AdminProductsFilters {
    return {
      q: filters.q?.trim() || undefined,
      category: filters.category?.trim() || undefined,
      status: filters.status ?? 'active',
    };
  }
}
