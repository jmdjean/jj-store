import type { UserRole } from '../../common/roles.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        role: UserRole;
        nomeExibicao: string;
      };
    }
  }
}

export {};
