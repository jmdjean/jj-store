# Etapa 07 — RAG v1: Indexação de Produto (Markdown → Vetor) + Pesquisa Semântica

# Convenções gerais (aplicáveis a todas as etapas)

> **Padrão de idioma (obrigatório):** toda a linguagem do sistema deve ser **Português (Brasil) – pt-BR**,
> incluindo: mensagens de erro/sucesso, validações, respostas da API, textos de UI, labels, placeholders,
> logs voltados ao usuário (quando aplicável) e documentação de telas.

## Regras de entrega
- Implementar **somente** o escopo desta etapa.
- Manter a arquitetura em camadas no backend (routes/controllers → services → repositories).
- No frontend (Angular 21), manter áreas/módulos e **guards** por autenticação e role.
- Garantir **build/test** passando (quando existir).
- Ao finalizar, realizar **1 commit** com mensagem clara (pt-BR ou padrão conventional commits).

## Definições de roles
- `ADMIN`
- `MANAGER`
- `CUSTOMER`

## Padrão de status do pedido (v1)
- `CREATED`, `PAID`, `PICKING`, `SHIPPED`, `DELIVERED`, `CANCELED`


## Objetivo
Sincronizar produtos do PostgreSQL para uma base vetorial (RAG) e permitir pesquisa semântica para ADMIN/MANAGER.

## Decisão técnica (v1 recomendada)
- Implementar RAG com **pgvector** dentro do PostgreSQL, para simplificar infraestrutura.
- Criar tabela `rag_products` (ou equivalente) com:
  - `product_id`, `content_markdown`, `embedding vector`, `updated_at`

> Se optar por serviço externo, criar um adapter com interface comum e implementar o client.

## Checklist de tarefas
### Backend
- [ ] Implementar geração de Markdown do produto (padrão definido no plano).
- [ ] Ao criar/editar produto:
  - [ ] salvar relacional
  - [ ] gerar markdown
  - [ ] gerar embedding
  - [ ] upsert no índice vetorial
- [ ] `POST /admin/rag/search` (ADMIN/MANAGER):
  - input: `{ "query": "texto..." }`
  - gerar embedding da query
  - buscar topK similares
  - retornar resultados com:
    - lista de produtos relacionados (id, nome, score, trecho)
    - mensagem pt-BR
- [ ] Padronizar erros pt-BR.

### Frontend
- [ ] Tela “Pesquisar RAG” (admin/manager):
  - textarea + botão pesquisar
  - loading state
  - exibir resposta/resultados e “fontes” (produtos sugeridos)
- [ ] Mensagens pt-BR (ex.: “Digite uma pergunta para pesquisar”).

## Critérios de aceite
- [ ] Produto cadastrado atualiza índice vetorial.
- [ ] Pesquisa retorna topK resultados coerentes.
- [ ] UI exibe resultados de forma clara.

## Commit sugerido
- `feat(rag): indexação vetorial e pesquisa semântica (pt-BR)`
