export type RagEntityType = 'product' | 'customer' | 'manager' | 'order' | 'order_item';

export type RagSearchRequest = {
  query: string;
  topK: number;
  entityTypes: RagEntityType[];
};

export type RagSearchResult = {
  entityType: RagEntityType;
  entityId: string;
  score: number;
  snippet: string;
  metadata: Record<string, unknown>;
};

export type RagSearchResponse = {
  mensagem: string;
  resultados: RagSearchResult[];
};
