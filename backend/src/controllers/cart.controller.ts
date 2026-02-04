import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/app-error.js';
import { CartService } from '../services/cart.service.js';
import type { CheckoutInput, CheckoutResponse } from '../services/cart.types.js';

export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Creates a new order from cart payload for the authenticated customer.
  async checkout(
    request: Request,
    response: Response<CheckoutResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const customerId = request.authUser?.id;

      if (!customerId) {
        throw new AppError(401, 'Usuário não autenticado.');
      }

      const payload = this.readCheckoutPayload(request.body);
      const checkoutResponse = await this.cartService.checkout(customerId, payload);

      response.status(201).json(checkoutResponse);
    } catch (error) {
      next(error);
    }
  }

  // Safely parses and returns checkout payload from request body.
  private readCheckoutPayload(payload: unknown): CheckoutInput {
    if (payload && typeof payload === 'object') {
      return payload as CheckoutInput;
    }

    return {};
  }
}
