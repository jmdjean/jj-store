import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import { isUserRole } from '../common/roles.js';
import type { UserForLogin } from '../repositories/users.repository.js';
import type { LoginInput, LoginResponse } from './auth.types.js';

type UsersRepositoryLike = {
  findByIdentifier(identifier: string): Promise<UserForLogin | null>;
};

export class AuthService {
  constructor(private readonly usersRepository: UsersRepositoryLike) {}

  // Authenticates user credentials and returns a JWT token with user information.
  async login(input: LoginInput): Promise<LoginResponse> {
    const identifier = this.resolveIdentifier(input);
    const senha = this.resolvePassword(input);
    const user = await this.usersRepository.findByIdentifier(identifier);

    if (!user) {
      throw new AppError(401, 'Credenciais inválidas.');
    }

    if (!isUserRole(user.role)) {
      throw new AppError(500, 'Perfil de usuário inválido.');
    }

    const isPasswordValid = await bcrypt.compare(senha, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciais inválidas.');
    }

    const nomeExibicao = user.username ?? user.email ?? 'Usuário';

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        nomeExibicao,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
    );

    return {
      token,
      usuario: {
        id: user.id,
        role: user.role,
        nomeExibicao,
      },
    };
  }

  // Extracts and validates the user identifier (username or email) from login input.
  private resolveIdentifier(input: LoginInput): string {
    const identifier = input.identificador ?? input.username ?? input.email ?? '';

    if (!identifier.trim()) {
      throw new AppError(400, 'Informe usuário ou e-mail para entrar.');
    }

    return identifier.trim();
  }

  // Extracts and validates the password from login input.
  private resolvePassword(input: LoginInput): string {
    const senha = input.senha ?? '';

    if (!senha.trim()) {
      throw new AppError(400, 'Informe a senha para entrar.');
    }

    return senha;
  }
}
