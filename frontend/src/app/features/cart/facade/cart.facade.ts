import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { CustomerProfileApiService } from '../../customer/services/customer-profile-api.service';
import type { CustomerAddress } from '../../customer/models/customer-profile.models';
import type { CatalogProduct } from '../../catalog/models/catalog.models';
import type { ApiErrorResponse, CheckoutResponse } from '../models/cart.models';
import { CartApiService } from '../services/cart-api.service';
import { CartService, type CartActionResult } from '../services/cart.service';

@Injectable({
  providedIn: 'root',
})
export class CartFacade {
  private readonly cartService = inject(CartService);
  private readonly cartApiService = inject(CartApiService);
  private readonly customerProfileApiService = inject(CustomerProfileApiService);

  readonly items = this.cartService.items;
  readonly totalItems = this.cartService.totalItems;
  readonly subtotal = this.cartService.subtotal;
  readonly hasItems = this.cartService.hasItems;

  readonly cartFeedback = signal('');
  readonly checkoutLoading = signal(false);
  readonly checkoutError = signal('');
  readonly checkoutMessage = signal('');
  readonly checkoutOrderId = signal('');
  readonly addressLoading = signal(false);
  readonly addressError = signal('');
  readonly profileAddress = signal<CustomerAddress | null>(null);
  readonly hasCheckoutSuccess = computed(() => Boolean(this.checkoutOrderId()));

  // Adds a product to cart and updates contextual feedback for the UI.
  addCatalogProduct(product: CatalogProduct): void {
    const result = this.cartService.addProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
    });

    this.applyCartActionFeedback(result, 'Produto adicionado ao carrinho.');
  }

  // Updates cart quantity for a product and reports validation errors.
  updateQuantity(productId: string, quantity: number): void {
    const result = this.cartService.updateQuantity(productId, quantity);
    this.applyCartActionFeedback(result);
  }

  // Removes a product from cart and clears any stale feedback message.
  removeItem(productId: string): void {
    this.cartService.removeItem(productId);
    this.cartFeedback.set('Item removido do carrinho.');
  }

  // Clears cart content and resets checkout state after successful order creation.
  clearCart(): void {
    this.cartService.clear();
  }

  // Loads authenticated profile address to confirm checkout destination.
  loadProfileAddress() {
    this.addressLoading.set(true);
    this.addressError.set('');

    return this.customerProfileApiService.getProfile().pipe(
      tap((profile) => {
        this.profileAddress.set(profile.address);
      }),
      finalize(() => this.addressLoading.set(false)),
    );
  }

  // Sends checkout request using current cart items and selected address snapshot.
  checkout() {
    this.checkoutLoading.set(true);
    this.checkoutError.set('');
    this.checkoutMessage.set('');
    this.checkoutOrderId.set('');

    return this.cartApiService
      .checkout({
        items: this.cartService.toCheckoutItems(),
      })
      .pipe(
        tap((response: CheckoutResponse) => {
          this.checkoutMessage.set(response.mensagem);
          this.checkoutOrderId.set(response.orderId);
          this.cartService.clear();
        }),
        finalize(() => this.checkoutLoading.set(false)),
      );
  }

  // Resolves backend API errors to user-friendly pt-BR fallback messages.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }

  // Updates feedback message according to cart action result state.
  private applyCartActionFeedback(result: CartActionResult, successMessage?: string): void {
    if (!result.success) {
      this.cartFeedback.set(result.mensagem ?? 'Não foi possível atualizar o carrinho.');
      return;
    }

    this.cartFeedback.set(successMessage ?? 'Carrinho atualizado com sucesso.');
  }
}
