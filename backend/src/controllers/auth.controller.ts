import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { LoginInput } from '../services/auth.types.js';
import { CustomerProfileService } from '../services/customer-profile.service.js';
import type { RegisterCustomerInput } from '../services/customer-profile.types.js';

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customerProfileService: CustomerProfileService,
  ) {}

  async login(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = request.body as LoginInput;
      const authResponse = await this.authService.login(payload);
      response.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }

  async registerCustomer(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = request.body as RegisterCustomerInput;
      const registerResponse = await this.customerProfileService.registerCustomer(payload);
      response.status(201).json(registerResponse);
    } catch (error) {
      next(error);
    }
  }
}
