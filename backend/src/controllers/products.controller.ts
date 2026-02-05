import type { NextFunction, Request, Response } from 'express';
import { ProductsService } from '../services/products.service.js';
import type { ProductFiltersInput } from '../services/products.types.js';

export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Handles product listing requests with optional query filters and pagination.
  async listProducts(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ProductFiltersInput = {
        q: this.readQueryValue(request.query.q),
        category: this.readQueryValue(request.query.category),
        minPrice: this.readQueryValue(request.query.minPrice),
        maxPrice: this.readQueryValue(request.query.maxPrice),
        page: this.readQueryValue(request.query.page),
        pageSize: this.readQueryValue(request.query.pageSize),
      };

      const products = await this.productsService.listProducts(filters);
      response.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  // Handles product detail retrieval by ID from route parameters.
  async getProductById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const productId = this.readRouteParam(request.params.id);
      const product = await this.productsService.getProductById(productId);
      response.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  // Extracts string value from query parameter handling both single values and arrays.
  private readQueryValue(queryValue: unknown): string | undefined {
    if (typeof queryValue === 'string') {
      return queryValue;
    }

    if (Array.isArray(queryValue)) {
      const [firstValue] = queryValue;
      return typeof firstValue === 'string' ? firstValue : undefined;
    }

    return undefined;
  }

  // Extracts string value from route parameter handling both single values and arrays.
  private readRouteParam(routeParam: unknown): string {
    if (typeof routeParam === 'string') {
      return routeParam;
    }

    if (Array.isArray(routeParam)) {
      const [firstValue] = routeParam;
      return typeof firstValue === 'string' ? firstValue : '';
    }

    return '';
  }
}
