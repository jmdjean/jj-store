import { Injectable, computed, signal } from '@angular/core';
import type { CartItem, CartItemCheckoutInput, CartProduct } from '../models/cart.models';

const CART_STORAGE_KEY = 'jj_store_cart_items';

export type CartActionResult = {
  success: boolean;
  mensagem?: string;
};

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.readStoredItems());

  readonly items = computed(() => this.itemsSignal());
  readonly totalItems = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.price * item.quantity, 0),
  );
  readonly hasItems = computed(() => this.itemsSignal().length > 0);

  // Adds one unit for a product and persists the updated cart state.
  addProduct(product: CartProduct): CartActionResult {
    const currentItems = this.itemsSignal();
    const itemIndex = currentItems.findIndex((item) => item.id === product.id);

    if (itemIndex >= 0) {
      const currentItem = currentItems[itemIndex];
      const nextQuantity = currentItem.quantity + 1;

      if (nextQuantity > currentItem.stockQuantity) {
        return {
          success: false,
          mensagem: 'Quantidade indisponível em estoque.',
        };
      }

      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...currentItem,
        quantity: nextQuantity,
      };

      this.persistItems(updatedItems);
      return { success: true };
    }

    if (product.stockQuantity < 1) {
      return {
        success: false,
        mensagem: 'Quantidade indisponível em estoque.',
      };
    }

    const updatedItems = [...currentItems, { ...product, quantity: 1 }];
    this.persistItems(updatedItems);

    return { success: true };
  }

  // Updates item quantity and validates available stock before persisting.
  updateQuantity(productId: string, quantity: number): CartActionResult {
    const currentItems = this.itemsSignal();
    const itemIndex = currentItems.findIndex((item) => item.id === productId);

    if (itemIndex < 0) {
      return {
        success: false,
        mensagem: 'Item do carrinho não encontrado.',
      };
    }

    const item = currentItems[itemIndex];

    if (quantity < 1) {
      this.removeItem(productId);
      return { success: true };
    }

    if (!Number.isInteger(quantity) || quantity > item.stockQuantity) {
      return {
        success: false,
        mensagem: 'Quantidade indisponível em estoque.',
      };
    }

    const updatedItems = [...currentItems];
    updatedItems[itemIndex] = {
      ...item,
      quantity,
    };

    this.persistItems(updatedItems);
    return { success: true };
  }

  // Removes an item from cart and persists the reduced collection.
  removeItem(productId: string): void {
    const updatedItems = this.itemsSignal().filter((item) => item.id !== productId);
    this.persistItems(updatedItems);
  }

  // Clears all cart items and removes persisted storage data.
  clear(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
    this.itemsSignal.set([]);
  }

  // Converts cart items to checkout payload format.
  toCheckoutItems(): CartItemCheckoutInput[] {
    return this.itemsSignal().map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));
  }

  // Reads persisted cart JSON and normalizes invalid values.
  private readStoredItems(): CartItem[] {
    const rawItems = localStorage.getItem(CART_STORAGE_KEY);

    if (!rawItems) {
      return [];
    }

    try {
      const parsedItems = JSON.parse(rawItems) as CartItem[];
      return parsedItems.filter(
        (item) =>
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.price === 'number' &&
          typeof item.quantity === 'number' &&
          typeof item.stockQuantity === 'number' &&
          item.quantity > 0,
      );
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }

  // Persists cart items and updates the reactive state signal.
  private persistItems(items: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    this.itemsSignal.set(items);
  }
}
