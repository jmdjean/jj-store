# SKILL — Banco Vetorial com pgvector (Supabase) para RAG (indexação e busca)

## Objetivo
Implementar RAG usando **pgvector no PostgreSQL (Supabase)**, com **boas práticas de indexação**, **upserts consistentes**, **metadados úteis**, e consultas eficientes para busca semântica.

---

## Princípios obrigatórios
1. **Uma fonte de verdade**: PostgreSQL relacional é o dado oficial; o vetor é índice derivado.
2. **Sincronização confiável**:
   - Ao criar/atualizar produto: gerar Markdown + embedding + upsert vetorial.
   - Em falha: registrar e permitir reprocessamento (job posterior).
3. **Conteúdo bem estruturado (Markdown)** para melhorar recall.
4. **Metadados úteis**:
   - category, sale_price, weight, updated_at (para filtros)
5. **Índices vetoriais** corretos (IVFFLAT/HNSW conforme suporte/decisão).
6. **Consultas com topK** e limitação de custo.
7. **Segurança**: não indexar dados sensíveis (ex.: CPF nunca vai para RAG).

---

## Modelagem sugerida (tabela vetorial)
Tabela `rag_products`:
- `product_id uuid primary key`
- `content_markdown text not null`
- `embedding vector(<DIM>) not null`
- `category text`
- `sale_price numeric(12,2)`
- `weight numeric(12,3)`
- `updated_at timestamptz not null default now()`

> DIM depende do modelo de embedding escolhido (ex.: 384/768/1536). Definir no projeto e manter consistente.

---

## Geração do Markdown (qualidade do contexto)
Padrão recomendado:
- Título com nome do produto
- Bullet points com categoria, preço, peso, estoque (opcional)
- Descrição completa e objetiva
- Tags/keywords (opcional)
Exemplo (não incluir dados sensíveis):
```
# Wireless Headphones X1
- Categoria: Áudio
- Preço: R$ 199,90
- Peso: 0,35 kg

Descrição: Fone bluetooth com cancelamento de ruído...
```

---

## Indexação / Upsert (relacional → vetorial)
Regras:
- `product_id` deve ser o mesmo UUID do produto relacional.
- Sempre que editar produto (nome/descrição/categoria/preço/peso):
  - recomputar markdown
  - recomputar embedding
  - `UPSERT` (insert on conflict do update)

Estratégia de consistência (v1):
- Indexação síncrona após salvar no relacional.
- Se falhar, registrar `RAG_OUT_OF_SYNC` (log/auditoria) e retornar sucesso relacional.
- Criar endpoint/admin job futuro para “reindexar pendentes”.

---

## Busca semântica (query → embedding → topK)
Fluxo:
1. Receber `query` (texto) do admin/manager
2. Gerar embedding da query
3. Consultar topK por similaridade:
   - `cosine distance` ou `inner product`, conforme o padrão adotado
4. Retornar:
   - resultados: product_id, score, trecho do markdown (ou resumo), metadados
   - mensagem pt-BR ao usuário

### Boas práticas
- `topK` pequeno (ex.: 5–10).
- Filtros opcionais por metadata (categoria, faixa de preço) para melhorar precisão.
- Paginação na busca vetorial normalmente não é útil; preferir ajustar topK e filtros.

---

## Índices vetoriais (performance)
- Definir índice apropriado:
  - HNSW (se suportado) para melhor performance/recall
  - IVFFLAT (alternativa comum)
- Ajustar parâmetros conforme volume e perfil de consultas.
- Reindex quando houver grande volume de inserção.

---

## Segurança e privacidade
- Nunca indexar dados pessoais (CPF, e-mail, endereço).
- Indexar apenas conteúdo de produto e metadados não sensíveis.
- Logs sem query completa quando necessário (ou mascarar).

---

## Checklist de aceite
- [ ] Upsert vetorial acontece ao criar/editar produto
- [ ] Busca retorna topK coerente
- [ ] Índices vetoriais criados
- [ ] Não há dados sensíveis no markdown
- [ ] Mensagens ao usuário em pt-BR

---

## Referências de implementação (pasta /references)
Consulte `/references/pgvector/` para exemplos de:
- SQL de criação do pgvector + tabela `rag_products`
- query de similaridade com filtros por metadata
