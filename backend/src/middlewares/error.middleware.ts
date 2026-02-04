import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/app-error.js';

export type ApiErrorResponse = {
  mensagem: string;
  detalhes?: unknown;
};

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response<ApiErrorResponse>,
  next: NextFunction,
): void {
  void next;

  if (error instanceof AppError) {
    const payload: ApiErrorResponse = {
      mensagem: error.mensagem,
    };

    if (error.detalhes !== undefined) {
      payload.detalhes = error.detalhes;
    }

    response.status(error.statusCode).json(payload);
    return;
  }

  if (error instanceof SyntaxError) {
    response.status(400).json({
      mensagem: 'Corpo da requisição inválido.',
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    mensagem: 'Não foi possível concluir a operação.',
  });
}
