import { AppError } from '../common/app-error.js';
import {
  ProductsRepository,
  type ProductDatabaseRecord,
  type ProductQueryInput,
} from '../repositories/products.repository.js';
import type {
  ProductDetailResponse,
  ProductFiltersInput,
  ProductListResponse,
  ProductSummary,
} from './products.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  // Retrieves paginated product list with optional filters for search, category, and price range.
  async listProducts(input: ProductFiltersInput): Promise<ProductListResponse> {
    const filters = this.validateAndNormalizeFilters(input);
    const result = await this.productsRepository.findMany(filters);

    return {
      data: result.items.map((item) => this.toProductSummary(item)),
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.totalItems,
        totalPages: this.calculateTotalPages(result.totalItems, filters.pageSize),
      },
    };
  }

  // Retrieves product details by ID and throws error if not found.
  async getProductById(productId: string): Promise<ProductDetailResponse> {
    const normalizedProductId = productId.trim();

    if (!normalizedProductId) {
      throw new AppError(400, 'Informe o identificador do produto.');
    }

    const product = await this.productsRepository.findById(normalizedProductId);

    if (!product) {
      throw new AppError(404, 'Produto não encontrado.');
    }

    return {
      data: this.toProductSummary(product),
    };
  }

  // Validates and normalizes product filter inputs including pagination and price range constraints.
  private validateAndNormalizeFilters(input: ProductFiltersInput): ProductQueryInput {
    const q = this.normalizeOptionalText(input.q);
    const category = this.normalizeOptionalText(input.category);
    const minPriceCents = this.parseOptionalPrice(input.minPrice, 'minPrice');
    const maxPriceCents = this.parseOptionalPrice(input.maxPrice, 'maxPrice');
    const page = this.parsePositiveInteger(input.page, DEFAULT_PAGE, 'page');
    const pageSize = this.parsePositiveInteger(input.pageSize, DEFAULT_PAGE_SIZE, 'pageSize');

    if (pageSize > MAX_PAGE_SIZE) {
      throw new AppError(400, `O campo pageSize deve ser menor ou igual a ${MAX_PAGE_SIZE}.`);
    }

    if (minPriceCents !== null && maxPriceCents !== null && minPriceCents > maxPriceCents) {
      throw new AppError(400, 'O valor de minPrice não pode ser maior que maxPrice.');
    }

    return {
      q,
      category,
      minPriceCents,
      maxPriceCents,
      page,
      pageSize,
    };
  }

  // Parses string to positive integer with fallback and validates it's greater than zero.
  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    fieldName: string,
  ): number {
    if (!value?.trim()) {
      return fallback;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      throw new AppError(400, `Informe um valor válido para o campo ${fieldName}.`);
    }

    return parsedValue;
  }

  // Parses optional price string to cents and validates it's a non-negative number.
  private parseOptionalPrice(value: string | undefined, fieldName: string): number | null {
    const normalizedValue = value?.trim() ?? '';

    if (!normalizedValue) {
      return null;
    }

    const parsedValue = Number(normalizedValue.replace(',', '.'));

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new AppError(400, `Informe um valor válido para o campo ${fieldName}.`);
    }

    return Math.round(parsedValue * 100);
  }

  // Normalizes optional text by trimming and returns null if empty.
  private normalizeOptionalText(value: string | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue || null;
  }

  // Maps database product record to API product summary format with calculated availability.
  private toProductSummary(product: ProductDatabaseRecord): ProductSummary {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      imageUrl: product.image_url,
      price: product.price_cents / 100,
      weightGrams: product.weight_grams,
      available: product.stock_quantity > 0,
      stockQuantity: product.stock_quantity,
    };
  }

  // Calculates total number of pages for pagination based on items and page size.
  private calculateTotalPages(totalItems: number, pageSize: number): number {
    if (totalItems === 0) {
      return 0;
    }

    return Math.ceil(totalItems / pageSize);
  }
}
