import { runQuery } from '../config/database.js';

type CustomerProfileRecord = {
  user_id: string;
  cpf: string;
  full_name: string;
  birth_date: string;
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  complement: string | null;
  email: string;
  phone: string | null;
};

export type CustomerProfile = {
  userId: string;
  cpf: string;
  fullName: string;
  birthDate: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
  email: string;
  phone: string | null;
};

export type CreateCustomerProfileInput = {
  userId: string;
  cpf: string;
  fullName: string;
  birthDate: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
};

export type CreateCustomerAccountInput = {
  email: string;
  passwordHash: string;
  phone: string | null;
  cpf: string;
  fullName: string;
  birthDate: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
};

export type UpdateCustomerProfileInput = {
  email: string;
  phone: string | null;
  fullName: string;
  birthDate: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
};

function mapCustomerProfile(record: CustomerProfileRecord): CustomerProfile {
  return {
    userId: record.user_id,
    cpf: record.cpf,
    fullName: record.full_name,
    birthDate: record.birth_date,
    street: record.street,
    streetNumber: record.street_number,
    neighborhood: record.neighborhood,
    city: record.city,
    state: record.state,
    postalCode: record.postal_code,
    complement: record.complement,
    email: record.email,
    phone: record.phone,
  };
}

export class CustomerProfileRepository {
  async createCustomerAccount(input: CreateCustomerAccountInput): Promise<CustomerProfile> {
    const rows = await runQuery<CustomerProfileRecord>(
      `
        WITH inserted_user AS (
          INSERT INTO users (role, email, password_hash, phone)
          VALUES ('CUSTOMER', $1, $2, $3)
          RETURNING id, email, phone
        ),
        inserted_profile AS (
          INSERT INTO customers_profile (
            user_id,
            cpf,
            full_name,
            birth_date,
            street,
            street_number,
            neighborhood,
            city,
            state,
            postal_code,
            complement
          )
          SELECT
            inserted_user.id,
            $4,
            $5,
            $6::date,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13
          FROM inserted_user
          RETURNING
            user_id,
            cpf,
            full_name,
            birth_date::text,
            street,
            street_number,
            neighborhood,
            city,
            state,
            postal_code,
            complement
        )
        SELECT
          inserted_profile.user_id,
          inserted_profile.cpf,
          inserted_profile.full_name,
          inserted_profile.birth_date,
          inserted_profile.street,
          inserted_profile.street_number,
          inserted_profile.neighborhood,
          inserted_profile.city,
          inserted_profile.state,
          inserted_profile.postal_code,
          inserted_profile.complement,
          inserted_user.email,
          inserted_user.phone
        FROM inserted_profile
        INNER JOIN inserted_user ON inserted_user.id = inserted_profile.user_id
      `,
      [
        input.email,
        input.passwordHash,
        input.phone,
        input.cpf,
        input.fullName,
        input.birthDate,
        input.street,
        input.streetNumber,
        input.neighborhood,
        input.city,
        input.state,
        input.postalCode,
        input.complement,
      ],
    );

    return mapCustomerProfile(rows[0]);
  }

  async createProfile(input: CreateCustomerProfileInput): Promise<CustomerProfile> {
    const rows = await runQuery<CustomerProfileRecord>(
      `
        INSERT INTO customers_profile (
          user_id,
          cpf,
          full_name,
          birth_date,
          street,
          street_number,
          neighborhood,
          city,
          state,
          postal_code,
          complement
        )
        VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
          user_id,
          cpf,
          full_name,
          birth_date::text,
          street,
          street_number,
          neighborhood,
          city,
          state,
          postal_code,
          complement,
          (
            SELECT email
            FROM users
            WHERE users.id = customers_profile.user_id
          ) AS email,
          (
            SELECT phone
            FROM users
            WHERE users.id = customers_profile.user_id
          ) AS phone
      `,
      [
        input.userId,
        input.cpf,
        input.fullName,
        input.birthDate,
        input.street,
        input.streetNumber,
        input.neighborhood,
        input.city,
        input.state,
        input.postalCode,
        input.complement,
      ],
    );

    return mapCustomerProfile(rows[0]);
  }

  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    const rows = await runQuery<CustomerProfileRecord>(
      `
        SELECT
          cp.user_id,
          cp.cpf,
          cp.full_name,
          cp.birth_date::text,
          cp.street,
          cp.street_number,
          cp.neighborhood,
          cp.city,
          cp.state,
          cp.postal_code,
          cp.complement,
          u.email,
          u.phone
        FROM customers_profile cp
        INNER JOIN users u ON u.id = cp.user_id
        WHERE cp.user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    const profile = rows[0];

    if (!profile) {
      return null;
    }

    return mapCustomerProfile(profile);
  }

  async updateProfile(userId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfile | null> {
    const rows = await runQuery<CustomerProfileRecord>(
      `
        WITH updated_user AS (
          UPDATE users
          SET email = $2, phone = $3, updated_at = NOW()
          WHERE id = $1 AND role = 'CUSTOMER'
          RETURNING id, email, phone
        ),
        updated_profile AS (
          UPDATE customers_profile
          SET
            full_name = $4,
            birth_date = $5::date,
            street = $6,
            street_number = $7,
            neighborhood = $8,
            city = $9,
            state = $10,
            postal_code = $11,
            complement = $12,
            updated_at = NOW()
          WHERE user_id = $1
          RETURNING
            user_id,
            cpf,
            full_name,
            birth_date::text,
            street,
            street_number,
            neighborhood,
            city,
            state,
            postal_code,
            complement
        )
        SELECT
          updated_profile.user_id,
          updated_profile.cpf,
          updated_profile.full_name,
          updated_profile.birth_date,
          updated_profile.street,
          updated_profile.street_number,
          updated_profile.neighborhood,
          updated_profile.city,
          updated_profile.state,
          updated_profile.postal_code,
          updated_profile.complement,
          updated_user.email,
          updated_user.phone
        FROM updated_profile
        INNER JOIN updated_user ON updated_user.id = updated_profile.user_id
      `,
      [
        userId,
        input.email,
        input.phone,
        input.fullName,
        input.birthDate,
        input.street,
        input.streetNumber,
        input.neighborhood,
        input.city,
        input.state,
        input.postalCode,
        input.complement,
      ],
    );

    const updatedProfile = rows[0];

    if (!updatedProfile) {
      return null;
    }

    return mapCustomerProfile(updatedProfile);
  }
}
