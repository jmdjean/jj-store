import dotenv from 'dotenv';

dotenv.config();

const embeddingDimensionValue = Number(process.env.EMBEDDING_DIM ?? 8);
const embeddingDimension =
  Number.isFinite(embeddingDimensionValue) && embeddingDimensionValue > 0 ? embeddingDimensionValue : 8;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.SUPABASE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    'postgresql://jj_store_user:jj_store_pass@localhost:5432/jj_store',
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  embeddingsProvider: process.env.EMBEDDINGS_PROVIDER ?? 'deterministic',
  embeddingDimension,
};
