export type UserRole = 'ADMIN' | 'MANAGER' | 'CUSTOMER';

export type AuthUser = {
  id: string;
  role: UserRole;
  nomeExibicao: string;
};

export type LoginResponse = {
  token: string;
  usuario: AuthUser;
};

export type ApiErrorResponse = {
  mensagem: string;
  detalhes?: unknown;
};
