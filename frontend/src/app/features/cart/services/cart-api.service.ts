import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { CheckoutPayload, CheckoutResponse } from '../models/cart.models';

@Injectable({
  providedIn: 'root',
})
export class CartApiService {
  private readonly apiService = inject(ApiService);

  // Sends checkout payload and returns created order metadata.
  checkout(payload: CheckoutPayload) {
    return this.apiService.post<CheckoutResponse, CheckoutPayload>('/cart/checkout', payload);
  }
}
