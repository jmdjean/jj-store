import bcrypt from 'bcryptjs';
import { AuthService } from '../src/services/auth.service.js';
import { AppError } from '../src/common/app-error.js';
import type { UserForLogin } from '../src/repositories/users.repository.js';

describe('AuthService', () => {
  const mockUser: UserForLogin = {
    id: 'usuario-1',
    role: 'ADMIN',
    username: 'admin',
    email: 'admin@jjstore.local',
    passwordHash: bcrypt.hashSync('admin123', 10),
  };

  const createService = (user: UserForLogin | null) =>
    new AuthService({
      findByIdentifier: async () => user,
    });

  it('retorna token e usuario quando credenciais sao validas', async () => {
    const service = createService(mockUser);

    const response = await service.login({
      identificador: 'admin',
      senha: 'admin123',
    });

    expect(response.token).toBeTruthy();
    expect(response.usuario).toEqual({
      id: 'usuario-1',
      role: 'ADMIN',
      nomeExibicao: 'admin',
    });
  });

  it('retorna erro 401 quando credenciais sao invalidas', async () => {
    const service = createService(mockUser);

    await expect(
      service.login({
        identificador: 'admin',
        senha: 'senha-errada',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 401,
      mensagem: 'Credenciais inválidas.',
    });
  });

  it('retorna erro 400 quando identificador nao for informado', async () => {
    const service = createService(mockUser);

    await expect(
      service.login({
        senha: 'admin123',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      mensagem: 'Informe usuário ou e-mail para entrar.',
    });
  });
});
