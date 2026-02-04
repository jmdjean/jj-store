import type { UserRole } from '../common/roles.js';

export type LoginInput = {
  identificador?: string;
  username?: string;
  email?: string;
  senha?: string;
};

export type AuthUser = {
  id: string;
  role: UserRole;
  nomeExibicao: string;
};

export type LoginResponse = {
  token: string;
  usuario: AuthUser;
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  nomeExibicao: string;
  iat?: number;
  exp?: number;
};
