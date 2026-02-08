import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartFacade } from '../../../cart/facade/cart.facade';

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './store-header.component.html',
  styleUrl: './store-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly cartFacade = inject(CartFacade);

  @Input({ required: true }) searchValue = '';
  @Input() showSearchAction = true;
  @Input() showCustomerMenu = false;

  @Output() readonly searchChange = new EventEmitter<string>();

  protected readonly isSearchOpen = signal(false);
  protected readonly isCartOpen = signal(false);
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly isAuthenticated = computed(() => this.authService.autenticado());
  protected readonly displayName = computed(() => this.authService.usuario()?.nomeExibicao ?? '');

  // Handles search form submission and emits the current search text.
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.searchChange.emit(this.searchValue);
  }

  // Toggles the expanded search bar visibility.
  protected toggleSearch(): void {
    this.isSearchOpen.update((value) => !value);
  }

  // Closes the expanded search bar and clears focus state.
  protected closeSearch(): void {
    this.isSearchOpen.set(false);
  }

  // Toggles the cart drawer visibility.
  protected toggleCart(): void {
    this.isCartOpen.update((value) => !value);
  }

  // Toggles the profile dropdown menu visibility.
  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
  }

  // Hides the profile menu after an action is selected.
  protected closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  // Navigates the user to the customer login screen.
  protected goToCustomerLogin(): void {
    void this.router.navigate(['/login-cliente']);
  }

  // Navigates to the customer profile page.
  protected goToProfile(): void {
    this.closeProfileMenu();
    void this.router.navigate(['/minha-conta/perfil']);
  }

  // Navigates to the customer orders page.
  protected goToOrders(): void {
    this.closeProfileMenu();
    void this.router.navigate(['/minhas-compras']);
  }

  // Clears the session and returns to the store catalog.
  protected logout(): void {
    this.closeProfileMenu();
    this.authService.logout();
    void this.router.navigate(['/']);
  }

  // Decreases quantity for a cart line by one unit.
  protected decreaseQuantity(productId: string, currentQuantity: number): void {
    this.cartFacade.updateQuantity(productId, currentQuantity - 1);
  }

  // Increases quantity for a cart line by one unit.
  protected increaseQuantity(productId: string, currentQuantity: number): void {
    this.cartFacade.updateQuantity(productId, currentQuantity + 1);
  }

  // Removes an item from the cart drawer.
  protected removeItem(productId: string): void {
    this.cartFacade.removeItem(productId);
  }

  // Navigates user to checkout, redirecting to login when unauthenticated.
  protected goToCheckout(): void {
    if (!this.authService.autenticado()) {
      void this.router.navigate(['/login-cliente'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }

    void this.router.navigate(['/checkout']);
    this.isCartOpen.set(false);
  }

  // Keeps users browsing the catalog and closes the cart drawer.
  protected continueShopping(): void {
    this.isCartOpen.set(false);
    void this.router.navigate(['/']);
  }

  // Formats price values using BRL currency conventions.
  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
