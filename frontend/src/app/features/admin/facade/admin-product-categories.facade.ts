import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { AdminProductCategoriesApiService } from '../services/admin-product-categories-api.service';
import type { AdminProductCategory } from '../models/admin-product-categories.models';
import type { ApiErrorResponse } from '../models/admin-products.models';

@Injectable({
  providedIn: 'root',
})
export class AdminProductCategoriesFacade {
  private readonly categoriesApiService = inject(AdminProductCategoriesApiService);
  private readonly categoriesSignal = signal<AdminProductCategory[]>([]);

  readonly categories = this.categoriesSignal.asReadonly();
  readonly loading = signal(false);
  readonly error = signal('');

  // Loads all available product categories for admin forms.
  loadCategories() {
    this.loading.set(true);
    this.error.set('');

    return this.categoriesApiService.getCategories().pipe(
      tap((response) => this.categoriesSignal.set(response.data)),
      finalize(() => this.loading.set(false)),
    );
  }

  // Formats API errors into a friendly pt-BR message.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }
}
