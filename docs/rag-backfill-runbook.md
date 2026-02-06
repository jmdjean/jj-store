# Runbook - Backfill e Reindexação RAG

## Objetivo
Este runbook descreve como executar o backfill do índice vetorial (`rag_documents`), como reprocessar falhas registradas durante a operação, e como validar a qualidade dos resultados semânticos.

---

## Pré-requisitos
- Banco de dados disponível e migrations aplicadas (incluindo `008_rag_backfill_failures.sql`).
- Variáveis de ambiente configuradas (exemplo: `DATABASE_URL`, `EMBEDDINGS_PROVIDER`).
- Para endpoints REST: servidor backend em execução com autenticação válida (role `ADMIN`).

---

## 1. Execução via CLI (staging/produção)

### 1.1 Simular volume (dry-run)
Estima a quantidade de registros que seriam indexados, sem gravar:
```bash
cd backend
npm run rag:backfill -- --dry-run
```
Para filtrar por tipo de entidade:
```bash
npm run rag:backfill -- --entity-type product --dry-run
```

### 1.2 Reindexar tudo (backfill completo)
```bash
npm run rag:backfill -- --batch-size 50
```

### 1.3 Reindexar por tipo de entidade
```bash
npm run rag:backfill -- --entity-type product,order
```
Tipos válidos: `product`, `customer`, `manager`, `order`, `order_item`.

### 1.4 Reindexar por intervalo de datas
```bash
npm run rag:backfill -- --from 2024-01-01T00:00:00Z --to 2024-01-31T23:59:59Z
```

### 1.5 Reindexar uma entidade específica
```bash
npm run rag:backfill -- --entity-type product --entity-id <uuid>
```
Requer exatamente um `entity-type`.

### 1.6 Opções adicionais do CLI
| Flag | Descrição | Padrão |
|------|-----------|--------|
| `--batch-size <n>` | Itens por lote | `50` (env: `RAG_BACKFILL_BATCH_SIZE`) |
| `--max-attempts <n>` | Tentativas por item | `3` (env: `RAG_BACKFILL_MAX_ATTEMPTS`) |
| `--failure-threshold <n>` | Limite de alerta de falhas (0-1) | `0.2` (env: `RAG_BACKFILL_FAILURE_ALERT_THRESHOLD`) |

---

## 2. Execução via REST API (admin)

Todos os endpoints exigem autenticação JWT com role `ADMIN`.

### 2.1 Executar backfill
```
POST /admin/rag/backfill
```
Body (todos os campos são opcionais):
```json
{
  "entityTypes": ["product", "customer"],
  "fromDate": "2024-01-01T00:00:00Z",
  "toDate": "2024-12-31T23:59:59Z",
  "entityId": "uuid-da-entidade",
  "dryRun": true,
  "batchSize": 50,
  "maxItemAttempts": 3,
  "failureAlertThreshold": 0.2
}
```
Resposta:
```json
{
  "mensagem": "Backfill concluído com sucesso.",
  "relatorio": {
    "dryRun": false,
    "total": 150,
    "sucesso": 148,
    "falhas": 2,
    "duracaoMs": 12340,
    "detalhes": {
      "product": { "total": 100, "success": 99, "failures": 1 },
      "customer": { "total": 50, "success": 49, "failures": 1 }
    }
  }
}
```

### 2.2 Reprocessar falhas
```
POST /admin/rag/reprocess-failures
```
Body (todos os campos são opcionais):
```json
{
  "entityType": "product",
  "includePermanent": false,
  "limit": 200,
  "maxItemAttempts": 3
}
```
Resposta:
```json
{
  "mensagem": "Reprocessamento de falhas concluído.",
  "relatorio": { "total": 5, "sucesso": 3, "falhas": 2 }
}
```

### 2.3 Listar falhas registradas
```
GET /admin/rag/backfill/failures?entityType=product&includePermanent=false&limit=100
```
Resposta:
```json
{
  "mensagem": "Falhas de backfill recuperadas com sucesso.",
  "total": 2,
  "falhas": [
    {
      "entityType": "product",
      "entityId": "uuid",
      "failureCount": 3,
      "lastError": "Timeout na geração de embeddings.",
      "isPermanent": false,
      "lastAttemptAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

## 3. Reprocessar falhas (CLI)

### 3.1 Reprocessar falhas transitórias (padrão)
```bash
npm run rag:backfill -- --reprocess-failures
```

### 3.2 Incluir falhas permanentes
```bash
npm run rag:backfill -- --reprocess-failures --include-permanent
```

### 3.3 Limitar quantidade de falhas por execução
```bash
npm run rag:backfill -- --reprocess-failures --failure-limit 100
```

### 3.4 Reprocessar falhas de um tipo específico
```bash
npm run rag:backfill -- --reprocess-failures --entity-type product --max-attempts 5
```

---

## 4. Validação de qualidade semântica

### 4.1 Testar via API
Use o endpoint de busca semântica para avaliar os resultados:
```
POST /admin/rag/search
{
  "query": "cafeteira com cancelamento de ruído",
  "topK": 10,
  "entityTypes": ["product"]
}
```

### 4.2 Critérios de avaliação
- **Relevância:** os primeiros resultados devem corresponder à intenção da query.
- **Score:** resultados relevantes devem ter score acima de 0.7 (com embeddings reais).
- **Cobertura:** todos os produtos/entidades relevantes devem aparecer no top-K.
- **Dados sensíveis:** confirme que CPF, e-mail e dados pessoais não aparecem nos snippets.

### 4.3 Procedimento de validação
1. Execute dry-run para confirmar o volume esperado.
2. Execute o backfill completo.
3. Faça 5-10 buscas semânticas com queries reais do negócio.
4. Valide que os resultados estão coerentes com os dados relacionais.
5. Se necessário, ajuste o conteúdo markdown nos métodos `build*Markdown` do `RagSyncService`.

---

## 5. Limites e riscos

| Aspecto | Recomendação |
|---------|-------------|
| **Custo** | A geração de embeddings via API externa pode ter custo por chamada. Use `deterministic` para testes. |
| **Latência** | Lotes grandes podem pressionar o provedor de embeddings. Comece com batch-size 25-50. |
| **Batch size** | Valor recomendado para produção: 25-50. Ajuste conforme métricas de uso de memória e latência. |
| **Concorrência** | Não execute múltiplos backfills simultâneos para evitar contenção no banco. |
| **Falhas** | Taxa de falhas acima do limite configurado (`RAG_BACKFILL_FAILURE_ALERT_THRESHOLD`) gera alerta nos logs. |
| **Reprocessamento** | Falhas permanentes (4xx) indicam dados inconsistentes no relacional. Investigue antes de reprocessar. |
| **Disco/memória** | O tamanho do vetor é proporcional a `EMBEDDING_DIM`. Monitore espaço em disco após backfill completo. |

---

## 6. Observabilidade

### 6.1 Logs estruturados (JSON)
Todos os eventos são emitidos em JSON no stdout/stderr:

| Evento | Descrição |
|--------|-----------|
| `rag_backfill` | Relatório final do backfill (total, sucesso, falhas, duração) |
| `rag_backfill_reprocessamento` | Relatório final do reprocessamento de falhas |
| `rag_backfill_alerta` | Alerta quando taxa de falhas excede o limite |
| `rag_backfill_erro` | Erro fatal durante execução do CLI |
| `rag_index_success` | Indexação individual bem-sucedida (por entidade) |
| `rag_index_failure` | Falha individual de indexação (por entidade) |

### 6.2 Tabela de falhas
A tabela `rag_backfill_failures` armazena o histórico de falhas:
- `entity_type` + `entity_id`: identificação da entidade
- `failure_count`: número de tentativas falhas
- `last_error`: última mensagem de erro
- `is_permanent`: indica se a falha é permanente (4xx) ou transitória (5xx)
- `last_attempt_at`: timestamp da última tentativa

### 6.3 Consulta direta no banco
```sql
-- Total de falhas por tipo
SELECT entity_type, COUNT(*) AS total,
       SUM(CASE WHEN is_permanent THEN 1 ELSE 0 END) AS permanentes
FROM rag_backfill_failures
GROUP BY entity_type;

-- Falhas recentes
SELECT * FROM rag_backfill_failures
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 7. Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `EMBEDDINGS_PROVIDER` | Provedor de embeddings (`deterministic` ou `http`) | `deterministic` |
| `EMBEDDINGS_ENDPOINT` | URL do provedor HTTP de embeddings | — |
| `EMBEDDINGS_TIMEOUT_MS` | Timeout por chamada de embedding (ms) | `8000` |
| `EMBEDDINGS_RETRY_COUNT` | Tentativas de geração de embedding | `3` |
| `EMBEDDING_DIM` | Dimensão do vetor de embedding | `8` |
| `RAG_BACKFILL_BATCH_SIZE` | Tamanho do lote padrão | `50` |
| `RAG_BACKFILL_MAX_ATTEMPTS` | Tentativas por item | `3` |
| `RAG_BACKFILL_FAILURE_ALERT_THRESHOLD` | Limite de alerta de falhas (0-1) | `0.2` |
