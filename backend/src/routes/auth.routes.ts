import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { CustomerProfileRepository } from '../repositories/customer-profile.repository.js';
import { CustomerProfileService } from '../services/customer-profile.service.js';

const usersRepository = new UsersRepository();
const customerProfileRepository = new CustomerProfileRepository();
const authService = new AuthService(usersRepository);
const customerProfileService = new CustomerProfileService(customerProfileRepository);
const authController = new AuthController(authService, customerProfileService);

export const authRouter = Router();

authRouter.post('/auth/login', (request, response, next) => {
  authController.login(request, response, next);
});

authRouter.post('/auth/register-customer', (request, response, next) => {
  authController.registerCustomer(request, response, next);
});
