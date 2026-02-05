import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/app-error.js';
import { CustomerProfileService } from '../services/customer-profile.service.js';
import type { UpdateCustomerProfileInput } from '../services/customer-profile.types.js';
import { MyOrdersService } from '../services/my-orders.service.js';
import type {
  CancelMyOrderResponse,
  ListMyOrdersResponse,
  MyOrderDetail,
} from '../services/my-orders.types.js';

export class MeController {
  constructor(
    private readonly customerProfileService: CustomerProfileService,
    private readonly myOrdersService: MyOrdersService,
  ) {}

  // Retrieves authenticated user's customer profile.
  async getProfile(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.authUser?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado.');
      }

      const profile = await this.customerProfileService.getProfile(userId);
      response.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  // Updates authenticated user's customer profile with provided data.
  async updateProfile(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.authUser?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado.');
      }

      const payload = request.body as UpdateCustomerProfileInput;
      const profile = await this.customerProfileService.updateProfile(userId, payload);
      response.status(200).json({
        mensagem: 'Perfil atualizado com sucesso.',
        perfil: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lists authenticated customer orders with pagination.
  async getOrders(
    request: Request,
    response: Response<ListMyOrdersResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.authUser?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado.');
      }

      const page = Number(request.query.page);
      const pageSize = Number(request.query.pageSize);
      const orders = await this.myOrdersService.listOrders(userId, {
        page: Number.isNaN(page) ? undefined : page,
        pageSize: Number.isNaN(pageSize) ? undefined : pageSize,
      });

      response.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  // Retrieves one authenticated customer order by identifier.
  async getOrderById(
    request: Request,
    response: Response<MyOrderDetail>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.authUser?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado.');
      }

      const orderId = request.params.id ?? '';
      const order = await this.myOrdersService.getOrderById(userId, orderId);
      response.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  // Cancels one authenticated customer order when business rules allow it.
  async cancelOrder(
    request: Request,
    response: Response<CancelMyOrderResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.authUser?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado.');
      }

      const orderId = request.params.id ?? '';
      const cancelResponse = await this.myOrdersService.cancelOrder(userId, orderId);
      response.status(200).json(cancelResponse);
    } catch (error) {
      next(error);
    }
  }
}
