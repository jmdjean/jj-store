export type RegisterCustomerInput = {
  email?: string;
  password?: string;
  cpf?: string;
  fullName?: string;
  birthDate?: string;
  phone?: string;
  address?: {
    street?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
  };
};

export type UpdateCustomerProfileInput = {
  email?: string;
  fullName?: string;
  birthDate?: string;
  phone?: string;
  address?: {
    street?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
  };
};

export type CustomerProfileResponse = {
  cpf: string;
  fullName: string;
  birthDate: string;
  email: string;
  phone: string | null;
  address: {
    street: string;
    streetNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    complement: string | null;
  };
};

export type RegisterCustomerResponse = {
  mensagem: string;
  perfil: CustomerProfileResponse;
};
