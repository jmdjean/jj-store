import { Router } from 'express';
import { MeController } from '../controllers/me.controller.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';
import { CustomerProfileRepository } from '../repositories/customer-profile.repository.js';
import { CustomerProfileService } from '../services/customer-profile.service.js';

const customerProfileRepository = new CustomerProfileRepository();
const customerProfileService = new CustomerProfileService(customerProfileRepository);
const meController = new MeController(customerProfileService);

export const meRouter = Router();

meRouter.get('/me/profile', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.getProfile(request, response, next);
});

meRouter.put('/me/profile', authGuard, roleGuard(['CUSTOMER']), (request, response, next) => {
  meController.updateProfile(request, response, next);
});
