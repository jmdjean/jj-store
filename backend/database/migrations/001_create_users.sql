CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'CUSTOMER');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  email VARCHAR(320),
  username VARCHAR(60),
  password_hash TEXT NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_contact_required CHECK (email IS NOT NULL OR username IS NOT NULL)
);
