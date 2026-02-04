import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/app-error.js';
import { CustomerProfileService } from '../services/customer-profile.service.js';
import type { UpdateCustomerProfileInput } from '../services/customer-profile.types.js';

export class MeController {
  constructor(private readonly customerProfileService: CustomerProfileService) {}

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
}
