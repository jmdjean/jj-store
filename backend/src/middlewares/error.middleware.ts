import type { NextFunction, Request, Response } from 'express';

export type ApiErrorResponse = {
  mensagem: string;
  detalhes?: Record<string, unknown>;
};

// Normalizes server errors to the required pt-BR response shape.
export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response<ApiErrorResponse>,
  next: NextFunction,
): void {
  void next;
  console.error(error);

  response.status(500).json({
    mensagem: 'Nao foi possivel concluir a operacao.',
  });
}