import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { UsersRepository } from '../repositories/users.repository.js';

const usersRepository = new UsersRepository();
const authService = new AuthService(usersRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post('/auth/login', (request, response, next) => {
  authController.login(request, response, next);
});
