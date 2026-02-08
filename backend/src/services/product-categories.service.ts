import {
  ProductCategoriesRepository,
  type ProductCategorySnapshot,
} from '../repositories/product-categories.repository.js';
import type { ProductCategoriesListResponse, ProductCategorySummary } from './product-categories.types.js';

export class ProductCategoriesService {
  constructor(private readonly productCategoriesRepository: ProductCategoriesRepository) {}

  // Retrieves the full list of available product categories for selection.
  async listCategories(): Promise<ProductCategoriesListResponse> {
    const categories = await this.productCategoriesRepository.listCategories();

    return {
      data: categories.map((category) => this.toCategorySummary(category)),
    };
  }

  // Maps repository category snapshot into API response shape.
  private toCategorySummary(category: ProductCategorySnapshot): ProductCategorySummary {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
  }
}
