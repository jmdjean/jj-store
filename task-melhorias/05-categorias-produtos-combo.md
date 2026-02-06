# Melhoria 05 — Categorias de produtos: tabela, seed e combo no cadastro

## Origem (documento de negócio / solicitação)

> Criar uma tabela de categorias de produtos, fazer insert com uma lista de categorias, e no cadastro de produto usar um combo em que o usuário escolhe uma categoria pré-existente. O campo deve ter texto para filtrar e achar a opção mais fácil.

## Objetivo

Substituir o campo livre de categoria no cadastro de produtos por uma **lista pré-definida de categorias**: tabela no banco, seed com categorias iniciais, e no frontend um **combo (autocomplete/select com busca)** para escolher uma categoria existente, com filtro por texto.

## Convenções do projeto (aplicáveis)

- **Idioma:** todo texto voltado ao usuário em **pt-BR**.
- **Código:** nomes em **inglês** (tabelas, colunas, endpoints, variáveis).
- **Backend:** camadas routes → controllers → services → repositories; regras de negócio nos services.
- **Frontend:** Angular 21; Signals; formulários tipados; combo com filtro (ex.: mat-autocomplete ou select pesquisável).

## Escopo

### 1. Banco de dados

- **Nova tabela:** `product_categories` com pelo menos: `id` (UUID PK), `name` (VARCHAR único, ex.: 80 caracteres), `slug` (opcional), `created_at` (opcional).
- **Tabela `products`:** adicionar `category_id UUID REFERENCES product_categories(id)`; manter `category` (VARCHAR) temporariamente para migração ou preencher a partir de `product_categories.name` e depois remover a coluna `category` se o projeto padronizar apenas `category_id`. Decisão: criar migration que adiciona `category_id`, preenche a partir do texto atual de `category` (criando categorias inexistentes no seed ou em migration), e depois pode-se marcar `category` como deprecated e remover em outra migration.
- **Tabela `order_items`:** hoje tem `product_category VARCHAR(80)`; pode permanecer como snapshot textual da categoria no momento da venda; não é obrigatório mudar para FK.

### 2. Seed de categorias

- **Arquivo de seed:** inserir lista fixa de categorias em pt-BR (ex.: Eletrônicos, Roupas, Alimentos, Casa e Cozinha, Esportes, Livros, Brinquedos, Beleza, etc.). Executar após a migration que cria `product_categories` e, se necessário, após preencher `category_id` em `products` a partir do nome.
- **Ordem sugerida:** migration 010 cria `product_categories` e adiciona `category_id` em `products`; seed 003 ou script único insere as categorias; opcionalmente uma migration ou script que preenche `products.category_id` a partir de `products.category` (criando categorias que faltem ou mapeando para existentes) e depois pode-se remover a coluna `category` em migration futura ou mantê-la como cópia desnormalizada.

### 3. Backend (API)

- **Listar categorias:** endpoint GET (ex.: `GET /api/categories` ou `GET /api/product-categories`) retornando lista de categorias (id, name, slug se houver) para preencher o combo.
- **Produtos:** criar/atualizar produto passando `categoryId` (UUID) em vez de ou além de `category` (string); o serviço deve obter o nome da categoria a partir do id para gravar em `order_items.product_category` no checkout e para exibição onde for necessário.
- **Camada:** repository de categorias; service de categorias (list); products service e repository passam a usar `category_id` e nome da categoria quando necessário.

### 4. Frontend (cadastro de produto)

- **Combo com filtro:** no formulário de produto (admin), substituir o input de texto de categoria por um componente de seleção com busca (ex.: Angular Material Autocomplete ou select com filtro), que carrega as categorias do endpoint e permite filtrar por texto para achar a opção mais fácil.
- **Formulário:** campo `categoryId` (ou `category`) preenchido com o id da categoria selecionada; ao editar, pré-selecionar a categoria do produto.
- **Mensagens:** labels e placeholders em pt-BR (ex.: "Categoria", "Buscar categoria...").

### 5. Catálogo e listagem

- Se o catálogo filtrar por categoria, manter filtro por nome ou slug usando a tabela `product_categories`; ajustar backend para filtrar por `category_id` ou nome conforme definição do projeto.

## Checklist de tarefas

### Banco e seed

- [ ] Migration: criar tabela `product_categories` (id, name, slug opcional, created_at).
- [ ] Migration: adicionar `category_id` em `products` (FK para `product_categories`); estratégia para preencher a partir de `category` (string) existente (criar categorias ou mapear).
- [ ] Seed: script ou arquivo SQL com insert de lista de categorias em pt-BR (ex.: 8–15 categorias comuns).
- [ ] (Opcional) Migration ou script: remover coluna `category` de `products` após migração completa; ou mantê-la sincronizada a partir de `category_id` conforme política do projeto.

### Backend

- [ ] Repository: listar categorias (findAll ou list).
- [ ] Service: listar categorias (sem regras pesadas; pode ser só repassar do repository).
- [ ] Controller + rota: GET para listar categorias (protegida por role ADMIN/MANAGER se for só backoffice).
- [ ] Products: criar/atualizar produto recebendo `categoryId`; obter nome da categoria para snapshot em `order_items` e para respostas da API.
- [ ] Respostas de produto: incluir `categoryId` e `categoryName` (ou só `category` como nome) conforme contrato do frontend.

### Frontend

- [ ] Serviço ou facade: chamar API de categorias e expor lista (ex.: signal ou observable).
- [ ] Formulário de produto: substituir input de texto por combo com filtro (autocomplete/select pesquisável).
- [ ] Carregar categorias ao abrir o formulário (novo/editar); ao editar, pré-selecionar a categoria do produto.
- [ ] Labels e placeholders em pt-BR.

### Consistência

- [ ] Build e lint (frontend e backend) passando.
- [ ] Testes unitários atualizados (services de categorias e de produtos), se houver.
- [ ] Catálogo e checkout continuam exibindo nome da categoria corretamente (snapshot em order_items).

## Critérios de aceite

- [ ] Existe tabela `product_categories` com seed de categorias pré-definidas.
- [ ] Cadastro/edição de produto usa combo com categorias pré-existentes e filtro por texto.
- [ ] Usuário consegue buscar/filtrar a categoria pelo nome e escolher facilmente.
- [ ] Pedidos continuam gravando o nome da categoria no item (order_items) para histórico.
- [ ] Textos em pt-BR; código em inglês.

## Referências

- `CLAUDE.md` / `AGENTS.md` — regras e arquitetura.
- `backend/database/migrations/003_create_products_inventory.sql` — estrutura atual de `products`.
- `backend/database/migrations/004_create_orders_checkout.sql` — `order_items.product_category`.
- `frontend/src/app/features/admin/pages/admin-product-form-page.component.ts` — formulário de produto.
- `backend/src/repositories/products.repository.ts` e `backend/src/services/products.service.ts`.

## Commit sugerido

- `feat(products): tabela product_categories, seed e combo com filtro no cadastro de produto`
