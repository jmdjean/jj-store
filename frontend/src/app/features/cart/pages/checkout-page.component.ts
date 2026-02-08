import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StoreHeaderComponent } from '../../catalog/components/store-header/store-header.component';
import { CartFacade } from '../facade/cart.facade';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [StoreHeaderComponent],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly cartFacade = inject(CartFacade);

  // Loads customer profile address to confirm checkout destination.
  ngOnInit(): void {
    this.cartFacade.loadProfileAddress().subscribe({
      error: (error: unknown) => {
        this.cartFacade.addressError.set(
          this.cartFacade.getApiErrorMessage(error, 'Não foi possível carregar o endereço do perfil.'),
        );
      },
    });
  }

  // Redirects search requests to catalog query route.
  protected onSearch(searchText: string): void {
    void this.router.navigate(['/'], {
      queryParams: searchText ? { q: searchText } : {},
    });
  }

  // Sends checkout request and persists success or failure feedback.
  protected finalizeCheckout(): void {
    if (!this.cartFacade.hasItems()) {
      this.cartFacade.checkoutError.set('Seu carrinho está vazio para finalizar a compra.');
      return;
    }

    this.cartFacade.checkout().subscribe({
      next: () => {
        this.cartFacade.setCartFeedback('Compra finalizada com sucesso.');
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.cartFacade.checkoutError.set(
          this.cartFacade.getApiErrorMessage(error, 'Não foi possível concluir a compra agora.'),
        );
      },
    });
  }

  // Navigates back to cart page for quantity adjustments.
  protected backToCart(): void {
    void this.router.navigateByUrl('/carrinho');
  }

  // Formats price values using BRL currency conventions.
  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
