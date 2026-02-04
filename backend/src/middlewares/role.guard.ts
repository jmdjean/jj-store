import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/app-error.js';
import type { UserRole } from '../common/roles.js';

export function roleGuard(allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const userRole = request.authUser?.role;

    if (!userRole) {
      next(new AppError(401, 'Usuário não autenticado.'));
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      next(new AppError(403, 'Você não tem permissão para acessar este recurso.'));
      return;
    }

    next();
  };
}
