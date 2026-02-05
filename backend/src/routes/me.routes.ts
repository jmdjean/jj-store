import { Router } from 'express';
import { MeController } from '../controllers/me.controller.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';
import { CustomerProfileRepository } from '../repositories/customer-profile.repository.js';
import { MyOrdersRepository } from '../repositories/my-orders.repository.js';
import { CustomerProfileService } from '../services/customer-profile.service.js';
import { MyOrdersService } from '../services/my-orders.service.js';

const customerProfileRepository = new CustomerProfileRepository();
const customerProfileService = new CustomerProfileService(customerProfileRepository);
const myOrdersRepository = new MyOrdersRepository();
const myOrdersService = new MyOrdersService(myOrdersRepository);
const meController = new MeController(customerProfileService, myOrdersService);

export const meRouter = Router();

meRouter.get('/me/profile', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.getProfile(request, response, next);
});

meRouter.put('/me/profile', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.updateProfile(request, response, next);
});

meRouter.get('/me/orders', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.getOrders(request, response, next);
});

meRouter.get('/me/orders/:id', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.getOrderById(request, response, next);
});

meRouter.post('/me/orders/:id/cancel', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.cancelOrder(request, response, next);
});
