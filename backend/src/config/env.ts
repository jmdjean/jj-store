import dotenv from 'dotenv';

dotenv.config();

const embeddingDimensionValue = Number(process.env.EMBEDDING_DIM ?? 8);
const embeddingDimension =
  Number.isFinite(embeddingDimensionValue) && embeddingDimensionValue > 0 ? embeddingDimensionValue : 8;
const embeddingsTimeoutValue = Number(process.env.EMBEDDINGS_TIMEOUT_MS ?? 8000);
const embeddingsTimeoutMs =
  Number.isFinite(embeddingsTimeoutValue) && embeddingsTimeoutValue > 0 ? embeddingsTimeoutValue : 8000;
const embeddingsRetryValue = Number(process.env.EMBEDDINGS_RETRY_COUNT ?? 3);
const embeddingsRetryCount =
  Number.isFinite(embeddingsRetryValue) && embeddingsRetryValue > 0 ? embeddingsRetryValue : 3;
const ragBackfillBatchSizeValue = Number(process.env.RAG_BACKFILL_BATCH_SIZE ?? 50);
const ragBackfillBatchSize =
  Number.isFinite(ragBackfillBatchSizeValue) && ragBackfillBatchSizeValue > 0
    ? ragBackfillBatchSizeValue
    : 50;
const ragBackfillMaxAttemptsValue = Number(process.env.RAG_BACKFILL_MAX_ATTEMPTS ?? 3);
const ragBackfillMaxAttempts =
  Number.isFinite(ragBackfillMaxAttemptsValue) && ragBackfillMaxAttemptsValue > 0
    ? ragBackfillMaxAttemptsValue
    : 3;
const ragBackfillFailureAlertThresholdValue = Number(
  process.env.RAG_BACKFILL_FAILURE_ALERT_THRESHOLD ?? 0.2,
);
const ragBackfillFailureAlertThreshold =
  Number.isFinite(ragBackfillFailureAlertThresholdValue) && ragBackfillFailureAlertThresholdValue >= 0
    ? ragBackfillFailureAlertThresholdValue
    : 0.2;

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
  embeddingsEndpoint: process.env.EMBEDDINGS_ENDPOINT ?? '',
  embeddingsTimeoutMs,
  embeddingsRetryCount,
  embeddingDimension,
  ragBackfillBatchSize,
  ragBackfillMaxAttempts,
  ragBackfillFailureAlertThreshold,
};
