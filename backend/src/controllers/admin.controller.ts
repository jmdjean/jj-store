import type { NextFunction, Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import type {
  AdminOrdersFiltersInput,
  AdminProductPayloadInput,
  AdminProductsFiltersInput,
  UpdateAdminOrderStatusInput,
} from '../services/admin.types.js';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Retrieves administrative panel data for dashboard display.
  getPainel(_request: Request, response: Response): void {
    response.status(200).json(this.adminService.getPainelData());
  }



  // Handles admin order listing with optional status/date/customer filters.
  async listOrders(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const filters: AdminOrdersFiltersInput = {
        status: this.readQueryValue(request.query.status),
        customer: this.readQueryValue(request.query.customer),
        fromDate: this.readQueryValue(request.query.fromDate),
        toDate: this.readQueryValue(request.query.toDate),
      };

      const result = await this.adminService.listOrders(filters);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Handles admin order status updates for the informed order ID.
  async updateOrderStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = request.authUser?.id ?? '';
      const orderId = this.readRouteParam(request.params.id);
      const payload = request.body as UpdateAdminOrderStatusInput;
      const result = await this.adminService.updateOrderStatus(actorUserId, orderId, payload);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }


  // Handles admin product listing with optional search filters.
  async listProducts(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const filters: AdminProductsFiltersInput = {
        q: this.readQueryValue(request.query.q),
        category: this.readQueryValue(request.query.category),
        status: this.readQueryValue(request.query.status),
      };

      const result = await this.adminService.listProducts(filters);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Handles admin product detail lookup by route identifier.
  async getProductById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const productId = this.readRouteParam(request.params.id);
      const result = await this.adminService.getProductById(productId);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Handles admin product creation requests from request body payload.
  async createProduct(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = request.authUser?.id ?? '';
      const payload = request.body as AdminProductPayloadInput;
      const result = await this.adminService.createProduct(actorUserId, payload);

      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Handles admin product update requests for the informed product ID.
  async updateProduct(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = request.authUser?.id ?? '';
      const productId = this.readRouteParam(request.params.id);
      const payload = request.body as AdminProductPayloadInput;
      const result = await this.adminService.updateProduct(actorUserId, productId, payload);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Handles admin product deactivation requests and returns confirmation.
  async deleteProduct(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = request.authUser?.id ?? '';
      const productId = this.readRouteParam(request.params.id);
      const result = await this.adminService.deleteProduct(actorUserId, productId);

      response.status(200).json(result);
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
