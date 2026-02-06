# Runbook - Backfill e Reindexação RAG

## Objetivo
Este runbook descreve como executar o backfill do índice vetorial (`rag_documents`) e como reprocessar falhas registradas durante a operação.

## Pré-requisitos
- Banco de dados disponível e migrations aplicadas (incluindo `008_rag_backfill_failures.sql`).
- Variáveis de ambiente configuradas (exemplo: `DATABASE_URL`, `EMBEDDINGS_PROVIDER`).

## Execução de backfill (staging/produção)
1. **Simular volume (dry-run):**
   ```bash
   cd backend
   npm run rag:backfill -- --dry-run
   ```
2. **Reindexar tudo com lote padrão:**
   ```bash
   npm run rag:backfill -- --batch-size 50
   ```
3. **Reindexar por tipo de entidade:**
   ```bash
   npm run rag:backfill -- --entity-type product,order
   ```
4. **Reindexar por intervalo de datas:**
   ```bash
   npm run rag:backfill -- --from 2024-01-01T00:00:00Z --to 2024-01-31T23:59:59Z
   ```
5. **Reindexar uma entidade específica:**
   ```bash
   npm run rag:backfill -- --entity-type product --entity-id <uuid>
   ```

## Reprocessar falhas
1. **Reprocessar falhas transitórias (padrão):**
   ```bash
   npm run rag:backfill -- --reprocess-failures
   ```
2. **Incluir falhas permanentes:**
   ```bash
   npm run rag:backfill -- --reprocess-failures --include-permanent
   ```
3. **Limitar quantidade de falhas por execução:**
   ```bash
   npm run rag:backfill -- --reprocess-failures --failure-limit 100
   ```

## Validação de qualidade semântica
- Use consultas reais do time de negócio e verifique se os resultados são relevantes.
- Avalie top-5 e top-10 para garantir que o score esteja coerente.
- Ajuste conteúdo/markdown dos documentos se houver baixa precisão.

## Limites e riscos
- **Custo:** a geração de embeddings pode aumentar custos em grandes volumes.
- **Latência:** lotes grandes podem pressionar o provedor de embeddings.
- **Batch size:** comece com 25–50 em produção e ajuste conforme métricas.
- **Falhas:** taxa de falhas acima do limite configurado (`RAG_BACKFILL_FAILURE_ALERT_THRESHOLD`) gera alerta nos logs.

## Observabilidade
Os logs de backfill e reprocessamento são emitidos em JSON, contendo:
- `evento` (ex: `rag_backfill`, `rag_backfill_reprocessamento`)
- `mensagem` (pt-BR)
- contadores de sucesso/falha
- duração total da execução
