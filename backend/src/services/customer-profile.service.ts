import bcrypt from 'bcryptjs';
import { AppError } from '../common/app-error.js';
import {
  CustomerProfileRepository,
  type CustomerProfile,
  type UpdateCustomerProfileInput as RepositoryUpdateCustomerProfileInput,
} from '../repositories/customer-profile.repository.js';
import type {
  CustomerProfileResponse,
  RegisterCustomerInput,
  RegisterCustomerResponse,
  UpdateCustomerProfileInput,
} from './customer-profile.types.js';

type DatabaseErrorLike = {
  code?: string;
  constraint?: string;
};

type NormalizedAddress = {
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
};

type NormalizedRegisterInput = {
  email: string;
  password: string;
  cpf: string;
  fullName: string;
  birthDate: string;
  phone: string | null;
  address: NormalizedAddress;
};

export class CustomerProfileService {
  constructor(private readonly customerProfileRepository: CustomerProfileRepository) {}

  // Creates a new customer account with validated input and hashed password.
  async registerCustomer(input: RegisterCustomerInput): Promise<RegisterCustomerResponse> {
    const normalizedInput = this.validateAndNormalizeRegisterInput(input);
    const passwordHash = await bcrypt.hash(normalizedInput.password, 10);

    try {
      const profile = await this.customerProfileRepository.createCustomerAccount({
        email: normalizedInput.email,
        passwordHash,
        phone: normalizedInput.phone,
        cpf: normalizedInput.cpf,
        fullName: normalizedInput.fullName,
        birthDate: normalizedInput.birthDate,
        street: normalizedInput.address.street,
        streetNumber: normalizedInput.address.streetNumber,
        neighborhood: normalizedInput.address.neighborhood,
        city: normalizedInput.address.city,
        state: normalizedInput.address.state,
        postalCode: normalizedInput.address.postalCode,
        complement: normalizedInput.address.complement,
      });

      return {
        mensagem: 'Cadastro realizado com sucesso.',
        perfil: this.toCustomerProfileResponse(profile),
      };
    } catch (error) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  // Retrieves customer profile by user ID and throws error if not found.
  async getProfile(userId: string): Promise<CustomerProfileResponse> {
    const profile = await this.customerProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new AppError(404, 'Perfil não encontrado.');
    }

    return this.toCustomerProfileResponse(profile);
  }

  // Updates customer profile with validated input and returns updated data.
  async updateProfile(userId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfileResponse> {
    const normalizedInput = this.validateAndNormalizeUpdateInput(input);

    try {
      const updatedProfile = await this.customerProfileRepository.updateProfile(userId, {
        email: normalizedInput.email,
        phone: normalizedInput.phone,
        fullName: normalizedInput.fullName,
        birthDate: normalizedInput.birthDate,
        street: normalizedInput.street,
        streetNumber: normalizedInput.streetNumber,
        neighborhood: normalizedInput.neighborhood,
        city: normalizedInput.city,
        state: normalizedInput.state,
        postalCode: normalizedInput.postalCode,
        complement: normalizedInput.complement,
      });

      if (!updatedProfile) {
        throw new AppError(404, 'Perfil não encontrado.');
      }

      return this.toCustomerProfileResponse(updatedProfile);
    } catch (error) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  // Validates and normalizes all registration input fields including email, password, CPF, and address.
  private validateAndNormalizeRegisterInput(input: RegisterCustomerInput): NormalizedRegisterInput {
    const email = this.validateEmail(input.email);
    const password = this.validatePassword(input.password);
    const cpf = this.validateCpf(input.cpf);
    const fullName = this.requireText(input.fullName, 'Informe o nome completo.');
    const birthDate = this.validateBirthDate(input.birthDate);
    const phone = this.normalizeOptionalPhone(input.phone);
    const address = this.validateAddress(input.address);

    return {
      email,
      password,
      cpf,
      fullName,
      birthDate,
      phone,
      address,
    };
  }

  // Validates and normalizes all profile update input fields excluding CPF and password.
  private validateAndNormalizeUpdateInput(
    input: UpdateCustomerProfileInput,
  ): RepositoryUpdateCustomerProfileInput {
    const email = this.validateEmail(input.email);
    const fullName = this.requireText(input.fullName, 'Informe o nome completo.');
    const birthDate = this.validateBirthDate(input.birthDate);
    const phone = this.normalizeOptionalPhone(input.phone);
    const address = this.validateAddress(input.address);

    return {
      email,
      phone,
      fullName,
      birthDate,
      street: address.street,
      streetNumber: address.streetNumber,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      complement: address.complement,
    };
  }

  // Validates email format and returns normalized lowercase version.
  private validateEmail(email: string | undefined): string {
    const normalizedEmail = this.requireText(email, 'Informe um e-mail válido.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError(400, 'Informe um e-mail válido.');
    }

    return normalizedEmail.toLowerCase();
  }

  // Validates password length (minimum 6 characters) and returns trimmed value.
  private validatePassword(password: string | undefined): string {
    const normalizedPassword = this.requireText(password, 'Informe a senha para continuar.');

    if (normalizedPassword.length < 6) {
      throw new AppError(400, 'A senha deve ter no mínimo 6 caracteres.');
    }

    return normalizedPassword;
  }

  // Validates CPF format and checksum algorithm, returns only digits.
  private validateCpf(cpf: string | undefined): string {
    const digits = (cpf ?? '').replace(/\D/g, '');

    if (digits.length !== 11 || !this.isCpfValid(digits)) {
      throw new AppError(400, 'Informe um CPF válido.');
    }

    return digits;
  }

  // Validates birth date format (YYYY-MM-DD) and ensures it's not in the future.
  private validateBirthDate(birthDate: string | undefined): string {
    const value = this.requireText(birthDate, 'Informe a data de nascimento.');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new AppError(400, 'Informe uma data de nascimento válida.');
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError(400, 'Informe uma data de nascimento válida.');
    }

    const currentDate = new Date();

    if (parsedDate > currentDate) {
      throw new AppError(400, 'A data de nascimento não pode ser futura.');
    }

    return value;
  }

  // Validates all address fields including street, number, neighborhood, city, state (UF), and postal code (CEP).
  private validateAddress(
    address: RegisterCustomerInput['address'] | UpdateCustomerProfileInput['address'],
  ): NormalizedAddress {
    const street = this.requireText(address?.street, 'Informe a rua do endereço.');
    const streetNumber = this.requireText(address?.streetNumber, 'Informe o número do endereço.');
    const neighborhood = this.requireText(address?.neighborhood, 'Informe o bairro do endereço.');
    const city = this.requireText(address?.city, 'Informe a cidade do endereço.');
    const state = this.requireText(address?.state, 'Informe a UF do endereço.').toUpperCase();
    const postalCodeDigits = (address?.postalCode ?? '').replace(/\D/g, '');
    const complement = this.normalizeOptionalText(address?.complement);

    if (state.length !== 2) {
      throw new AppError(400, 'Informe uma UF válida.');
    }

    if (postalCodeDigits.length !== 8) {
      throw new AppError(400, 'Informe um CEP válido.');
    }

    return {
      street,
      streetNumber,
      neighborhood,
      city,
      state,
      postalCode: postalCodeDigits,
      complement,
    };
  }

  // Normalizes optional phone number to digits only and validates length (10-11 digits).
  private normalizeOptionalPhone(phone: string | undefined): string | null {
    const normalizedPhone = this.normalizeOptionalText(phone);

    if (!normalizedPhone) {
      return null;
    }

    const digits = normalizedPhone.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 11) {
      throw new AppError(400, 'Informe um telefone válido.');
    }

    return digits;
  }

  // Requires non-empty text value and throws error with custom message if missing.
  private requireText(value: string | undefined, message: string): string {
    const normalizedValue = value?.trim() ?? '';

    if (!normalizedValue) {
      throw new AppError(400, message);
    }

    return normalizedValue;
  }

  // Normalizes optional text by trimming and returns null if empty.
  private normalizeOptionalText(value: string | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue ? normalizedValue : null;
  }

  // Maps database customer profile to API response format.
  private toCustomerProfileResponse(profile: CustomerProfile): CustomerProfileResponse {
    return {
      cpf: profile.cpf,
      fullName: profile.fullName,
      birthDate: profile.birthDate,
      email: profile.email,
      phone: profile.phone,
      address: {
        street: profile.street,
        streetNumber: profile.streetNumber,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        postalCode: profile.postalCode,
        complement: profile.complement,
      },
    };
  }

  // Validates CPF using Brazilian algorithm including check digits verification.
  private isCpfValid(cpf: string): boolean {
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    const digits = cpf.split('').map((value) => Number(value));
    const firstDigit = this.calculateCpfDigit(digits, 10);
    const secondDigit = this.calculateCpfDigit(digits, 11);

    return digits[9] === firstDigit && digits[10] === secondDigit;
  }

  // Calculates CPF check digit using weighted sum algorithm.
  private calculateCpfDigit(digits: number[], startWeight: number): number {
    let sum = 0;

    for (let index = 0; index < startWeight - 1; index += 1) {
      sum += digits[index] * (startWeight - index);
    }

    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  }

  // Handles database unique constraint violations and throws appropriate user-facing errors.
  private handleDatabaseError(error: unknown): void {
    const databaseError = error as DatabaseErrorLike;

    if (databaseError.code !== '23505') {
      return;
    }

    if (databaseError.constraint === 'customers_profile_cpf_key') {
      throw new AppError(409, 'CPF já cadastrado.');
    }

    if (databaseError.constraint === 'users_email_unique') {
      throw new AppError(409, 'E-mail já cadastrado.');
    }
  }
}
