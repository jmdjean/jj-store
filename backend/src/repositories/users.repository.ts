import { runQuery } from '../config/database.js';
import type { UserRole } from '../common/roles.js';

type UserRecord = {
  id: string;
  role: UserRole;
  email: string | null;
  username: string | null;
  password_hash: string;
};

export type UserForLogin = {
  id: string;
  role: UserRole;
  email: string | null;
  username: string | null;
  passwordHash: string;
};

export class UsersRepository {
  async findByIdentifier(identifier: string): Promise<UserForLogin | null> {
    const rows = await runQuery<UserRecord>(
      `
        SELECT id, role, email, username, password_hash
        FROM users
        WHERE username = $1 OR email = $1
        LIMIT 1
      `,
      [identifier],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
      passwordHash: user.password_hash,
    };
  }
}
