import { createApp } from './app.js';
import { getRagEmbeddingDimension } from './config/database.js';
import { env } from './config/env.js';

const app = createApp();

// Validates that the database vector dimension matches the configured embedding dimension.
async function validateEmbeddingDimension(): Promise<void> {
  const databaseDimension = await getRagEmbeddingDimension();

  if (!databaseDimension) {
    throw new Error('Não foi possível validar a dimensão do embedding no banco de dados.');
  }

  if (databaseDimension !== env.embeddingDimension) {
    throw new Error(
      `Dimensão de embedding incompatível (configurada ${env.embeddingDimension}, banco ${databaseDimension}).`,
    );
  }
}

// Boots the HTTP server after validating dependencies.
async function startServer(): Promise<void> {
  await validateEmbeddingDimension();

  app.listen(env.port, () => {
    console.log(`Backend online na porta ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
