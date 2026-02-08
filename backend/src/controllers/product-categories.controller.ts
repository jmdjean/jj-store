import type { NextFunction, Request, Response } from 'express';
import { ProductCategoriesService } from '../services/product-categories.service.js';

export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  // Handles category listing for admin combo population.
  async listCategories(_request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.productCategoriesService.listCategories();
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
