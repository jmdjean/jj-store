import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminProductsFacade } from '../facade/admin-products.facade';
import type { AdminProduct } from '../models/admin-products.models';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly adminProductsFacade = inject(AdminProductsFacade);
  protected readonly deletingProductId = signal<string | null>(null);

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    q: '',
    category: '',
    status: 'active' as 'active' | 'inactive' | 'all',
  });

  // Loads the first products page when component initializes.
  ngOnInit(): void {
    this.loadProducts();
  }

  // Reloads products using the currently typed filter values.
  protected applyFilters(): void {
    const filters = this.filtersForm.getRawValue();

    this.loadProducts({
      q: filters.q,
      category: filters.category,
      status: filters.status,
    });
  }

  // Clears all filters and reloads the default active products list.
  protected clearFilters(): void {
    this.filtersForm.setValue({
      q: '',
      category: '',
      status: 'active',
    });

    this.loadProducts();
  }

  // Deletes one product after user confirmation and refreshes listing state.
  protected deleteProduct(product: AdminProduct): void {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o produto "${product.name}"? Esta ação deixará o item inativo.`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingProductId.set(product.id);

    this.adminProductsFacade
      .deleteProduct(product.id)
      .pipe(finalize(() => this.deletingProductId.set(null)))
      .subscribe({
        error: (error) => {
          this.adminProductsFacade.error.set(
            this.adminProductsFacade.getApiErrorMessage(
              error,
              'Não foi possível remover o produto. Tente novamente.',
            ),
          );
        },
      });
  }

  // Navigates to edit route preserving the selected product ID.
  protected editProduct(product: AdminProduct): void {
    this.router.navigate(['/admin/produtos', product.id, 'editar']);
  }

  // Returns whether a specific product is currently being deleted.
  protected isDeleting(productId: string): boolean {
    return this.deletingProductId() === productId;
  }

  // Formats numeric price values into pt-BR currency strings.
  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Loads admin products and centralizes API error handling.
  private loadProducts(filters: { q?: string; category?: string; status?: 'active' | 'inactive' | 'all' } = {}): void {
    this.adminProductsFacade.loadProducts(filters).subscribe({
      error: (error) => {
        this.adminProductsFacade.error.set(
          this.adminProductsFacade.getApiErrorMessage(
            error,
            'Não foi possível carregar os produtos. Tente novamente.',
          ),
        );
      },
    });
  }
}
