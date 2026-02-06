import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { CartController } from '../controllers/cart.controller.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';
import { CartRepository } from '../repositories/cart.repository.js';
import { CartService } from '../services/cart.service.js';

const cartRepository = new CartRepository();
const cartService = new CartService(cartRepository);
const cartController = new CartController(cartService);

export const cartRouter = Router();

cartRouter.post('/cart/checkout', authGuard, roleGuard(['CUSTOMER']), (request: Request, response: Response, next: NextFunction) => {
  cartController.checkout(request, response, next);
});
