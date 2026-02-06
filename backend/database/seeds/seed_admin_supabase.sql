-- Cadastro de usuário ADMIN para uso no Supabase
-- Email: admin@gmail.com | Usuário: admin@123 | Senha: admin@123
-- Execute este script no SQL Editor do Supabase (após rodar as migrations da tabela users).

INSERT INTO users (role, username, email, password_hash)
VALUES (
  'ADMIN',
  'admin@123',
  'admin@gmail.com',
  '$2a$10$5Gh/BOh4nGSg5I0Kd9IJkOBbTBQms.I39mjHQAGu8aa1xEZyVJk2W'
)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();
