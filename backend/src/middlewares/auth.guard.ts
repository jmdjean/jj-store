import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import { isUserRole } from '../common/roles.js';
import type { AuthTokenPayload } from '../services/auth.types.js';

type JwtPayloadLike = Partial<AuthTokenPayload> & Record<string, unknown>;

function isValidTokenPayload(payload: JwtPayloadLike): payload is AuthTokenPayload {
  return (
    typeof payload.sub === 'string' &&
    typeof payload.role === 'string' &&
    typeof payload.nomeExibicao === 'string' &&
    isUserRole(payload.role)
  );
}

export function authGuard(request: Request, _response: Response, next: NextFunction): void {
  const authorizationHeader = request.header('authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Token de autenticação não informado.'));
    return;
  }

  const token = authorizationHeader.replace('Bearer ', '').trim();

  if (!token) {
    next(new AppError(401, 'Token de autenticação não informado.'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded !== 'object' || !decoded) {
      throw new AppError(401, 'Token de autenticação inválido.');
    }

    const payload = decoded as JwtPayloadLike;

    if (!isValidTokenPayload(payload)) {
      throw new AppError(401, 'Token de autenticação inválido.');
    }

    request.authUser = {
      id: payload.sub,
      role: payload.role,
      nomeExibicao: payload.nomeExibicao,
    };

    next();
  } catch {
    next(new AppError(401, 'Token de autenticação inválido.'));
  }
}
