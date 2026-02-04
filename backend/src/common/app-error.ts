export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly mensagem: string,
    public readonly detalhes?: Record<string, unknown>,
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}
