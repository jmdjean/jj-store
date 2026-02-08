import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { AdminProductCategoriesResponse } from '../models/admin-product-categories.models';

@Injectable({
  providedIn: 'root',
})
export class AdminProductCategoriesApiService {
  private readonly apiService = inject(ApiService);

  // Retrieves product categories for admin selection combos.
  getCategories() {
    return this.apiService.get<AdminProductCategoriesResponse>('/admin/product-categories');
  }
}
