export type AdminProductSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  purchasePrice: number;
  salePrice: number;
  weightGrams: number | null;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductsFiltersInput = {
  q?: string;
  category?: string;
  status?: string;
};

export type AdminProductPayloadInput = {
  name?: string;
  description?: string;
  category?: string;
  quantity?: unknown;
  weightGrams?: unknown;
  purchasePrice?: unknown;
  salePrice?: unknown;
  imageUrl?: unknown;
};

export type AdminProductsListResponse = {
  data: AdminProductSummary[];
};

export type AdminProductDetailResponse = {
  data: AdminProductSummary;
};

export type AdminProductMutationResponse = {
  mensagem: string;
  data: AdminProductSummary;
};

export type AdminProductDeleteResponse = {
  mensagem: string;
};

