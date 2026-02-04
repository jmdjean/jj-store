import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { LoginInput } from '../services/auth.types.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = request.body as LoginInput;
      const authResponse = await this.authService.login(payload);
      response.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }
}
