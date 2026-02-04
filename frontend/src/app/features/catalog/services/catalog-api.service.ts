import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type {
  CatalogDetailResponse,
  CatalogFilters,
  CatalogListResponse,
} from '../models/catalog.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogApiService {
  private readonly apiService = inject(ApiService);

  // Retrieves the product list using the provided catalog filters.
  getProducts(filters: CatalogFilters) {
    return this.apiService.get<CatalogListResponse>('/products', filters);
  }

  // Retrieves a single product by its unique identifier.
  getProductById(productId: string) {
    return this.apiService.get<CatalogDetailResponse>(`/products/${productId}`);
  }
}
