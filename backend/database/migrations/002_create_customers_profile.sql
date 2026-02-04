CREATE TABLE IF NOT EXISTS customers_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  birth_date DATE NOT NULL,
  street VARCHAR(160) NOT NULL,
  street_number VARCHAR(20) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code VARCHAR(8) NOT NULL,
  complement VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_profile_cpf_digits CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT customers_profile_postal_code_digits CHECK (postal_code ~ '^[0-9]{8}$'),
  CONSTRAINT customers_profile_state_length CHECK (char_length(state) = 2)
);

CREATE INDEX IF NOT EXISTS idx_customers_profile_city_state
  ON customers_profile (city, state);
