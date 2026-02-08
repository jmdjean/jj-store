export type ProductCategorySummary = {
  id: string;
  name: string;
  slug: string | null;
};

export type ProductCategoriesListResponse = {
  data: ProductCategorySummary[];
};
