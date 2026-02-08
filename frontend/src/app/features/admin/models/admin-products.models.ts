export type ApiErrorResponse = {
  mensagem: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  purchasePrice: number;
  salePrice: number;
  weightGrams: number | null;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductsFilters = {
  q?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'all';
};

export type AdminProductsListResponse = {
  data: AdminProduct[];
};

export type AdminProductDetailResponse = {
  data: AdminProduct;
};

export type AdminProductPayload = {
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  weightGrams: number | null;
  purchasePrice: number;
  salePrice: number;
  imageUrl: string | null;
};

export type AdminProductMutationResponse = {
  mensagem: string;
  data: AdminProduct;
};

export type AdminProductDeleteResponse = {
  mensagem: string;
};
