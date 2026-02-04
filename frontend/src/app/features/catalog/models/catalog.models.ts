export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  price: number;
  weightGrams: number | null;
  available: boolean;
  stockQuantity: number;
};

export type CatalogMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CatalogListResponse = {
  data: CatalogProduct[];
  meta: CatalogMeta;
};

export type CatalogDetailResponse = {
  data: CatalogProduct;
};

export type CatalogFilters = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  pageSize?: number;
};

export type ApiErrorResponse = {
  mensagem: string;
  detalhes?: unknown;
};
