export type CustomerAddress = {
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
};

export type CustomerProfile = {
  cpf: string;
  fullName: string;
  birthDate: string;
  email: string;
  phone: string | null;
  address: CustomerAddress;
};

export type RegisterCustomerPayload = {
  email: string;
  password: string;
  cpf: string;
  fullName: string;
  birthDate: string;
  phone?: string;
  address: {
    street: string;
    streetNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    complement?: string;
  };
};

export type UpdateCustomerProfilePayload = {
  email: string;
  fullName: string;
  birthDate: string;
  phone?: string;
  address: {
    street: string;
    streetNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    complement?: string;
  };
};

export type RegisterCustomerResponse = {
  mensagem: string;
  perfil: CustomerProfile;
};

export type UpdateCustomerProfileResponse = {
  mensagem: string;
  perfil: CustomerProfile;
};

export type ApiErrorResponse = {
  mensagem: string;
  detalhes?: unknown;
};
