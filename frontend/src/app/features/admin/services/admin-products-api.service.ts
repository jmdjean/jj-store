import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type {
  AdminProductDeleteResponse,
  AdminProductDetailResponse,
  AdminProductMutationResponse,
  AdminProductPayload,
  AdminProductsFilters,
  AdminProductsListResponse,
} from '../models/admin-products.models';

@Injectable({
  providedIn: 'root',
})
export class AdminProductsApiService {
  private readonly apiService = inject(ApiService);

  // Retrieves admin products applying optional text and status filters.
  getProducts(filters: AdminProductsFilters) {
    return this.apiService.get<AdminProductsListResponse>('/admin/products', filters);
  }

  // Retrieves one admin product by identifier for form editing.
  getProductById(productId: string) {
    return this.apiService.get<AdminProductDetailResponse>(`/admin/products/${productId}`);
  }

  // Creates a new admin product with inventory information.
  createProduct(payload: AdminProductPayload) {
    return this.apiService.post<AdminProductMutationResponse, AdminProductPayload>(
      '/admin/products',
      payload,
    );
  }

  // Updates an existing admin product and its inventory quantity.
  updateProduct(productId: string, payload: AdminProductPayload) {
    return this.apiService.put<AdminProductMutationResponse, AdminProductPayload>(
      `/admin/products/${productId}`,
      payload,
    );
  }

  // Deactivates an admin product by identifier.
  deleteProduct(productId: string) {
    return this.apiService.delete<AdminProductDeleteResponse>(`/admin/products/${productId}`);
  }
}
