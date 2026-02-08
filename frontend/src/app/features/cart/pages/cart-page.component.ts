import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StoreHeaderComponent } from '../../catalog/components/store-header/store-header.component';
import { AuthService } from '../../../core/services/auth.service';
import { CartFacade } from '../facade/cart.facade';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [StoreHeaderComponent],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly cartFacade = inject(CartFacade);

  // Redirects search requests to catalog query route.
  protected onSearch(searchText: string): void {
    void this.router.navigate(['/'], {
      queryParams: searchText ? { q: searchText } : {},
    });
  }

  // Increases quantity for a cart line by one unit.
  protected increaseQuantity(productId: string, currentQuantity: number): void {
    this.cartFacade.updateQuantity(productId, currentQuantity + 1);
  }

  // Decreases quantity for a cart line by one unit.
  protected decreaseQuantity(productId: string, currentQuantity: number): void {
    this.cartFacade.updateQuantity(productId, currentQuantity - 1);
  }

  // Removes a cart line by product identifier.
  protected removeItem(productId: string): void {
    this.cartFacade.removeItem(productId);
  }

  // Navigates user to checkout or customer login when required.
  protected goToCheckout(): void {
    if (!this.authService.autenticado()) {
      void this.router.navigate(['/login-cliente'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }

    void this.router.navigateByUrl('/checkout');
  }

  // Navigates user back to catalog browsing.
  protected goToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  // Formats price values using BRL currency conventions.
  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
