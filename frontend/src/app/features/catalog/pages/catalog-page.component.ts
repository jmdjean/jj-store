import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { StoreHeaderComponent } from '../components/store-header/store-header.component';
import { CatalogFacade } from '../facade/catalog.facade';
import { CartFacade } from '../../cart/facade/cart.facade';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ReactiveFormsModule, ProductCardComponent, StoreHeaderComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly facade = inject(CatalogFacade);
  protected readonly cartFacade = inject(CartFacade);

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
  });

  // Initializes search from query params and loads the catalog.
  ngOnInit(): void {
    const querySearch = this.route.snapshot.queryParamMap.get('q') ?? '';

    if (querySearch) {
      this.filtersForm.controls.q.setValue(querySearch);
    }

    this.loadCatalogWithCurrentFilters();
  }

  // Applies search text from the header and reloads results.
  protected onSearch(searchText: string): void {
    this.filtersForm.controls.q.setValue(searchText);
    this.submitFilters();
  }

  // Submits current search and resets pagination to the first page.
  protected submitFilters(): void {
    this.loadCatalogWithCurrentFilters(1);
  }

  // Navigates to a valid catalog page and reloads results.
  protected goToPage(page: number): void {
    const meta = this.facade.meta();

    if (page < 1 || (meta.totalPages > 0 && page > meta.totalPages)) {
      return;
    }

    this.loadCatalogWithCurrentFilters(page);
  }

  // Loads catalog data using current search text and page selection.
  private loadCatalogWithCurrentFilters(page = this.facade.meta().page): void {
    const { q } = this.filtersForm.getRawValue();

    void this.router.navigate([], {
      queryParams: q ? { q } : {},
      replaceUrl: true,
    });

    this.facade
      .loadCatalog({
        q,
        page,
      })
      .subscribe({
        error: (error: unknown) => {
          this.facade.listError.set(
            this.facade.getApiErrorMessage(error, 'Não foi possível carregar o catálogo.'),
          );
        },
      });
  }
}
