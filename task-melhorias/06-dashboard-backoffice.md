# Melhoria 06 — Dashboard no backoffice (vendas, categorias, gráfico)

## Origem (documento de negócio / solicitação)

> Deve existir uma página no backoffice que será um dashboard. Ao logar, abrir essa tela de dashboard mostrando cards de quantas vendas foram feitas, por categorias, e um gráfico comparando um mês de vendas com o mês anterior.

## Objetivo

Criar uma **página de dashboard** na área administrativa (backoffice) como **tela inicial** após login (ADMIN/MANAGER), com **cards de resumo** (total de vendas, vendas por categoria) e um **gráfico** comparando as vendas do mês atual com as do mês anterior.

## Convenções do projeto (aplicáveis)

- **Idioma:** todo texto voltado ao usuário em **pt-BR** (títulos dos cards, eixos do gráfico, legendas).
- **Código:** nomes em **inglês**.
- **Frontend:** Angular 21; Signals; rotas com guards (authGuard, roleGuard para ADMIN/MANAGER).
- **Backend:** endpoint(s) para agregar dados de vendas (total, por categoria, por mês); camadas controller → service → repository.

## Escopo

### 1. Roteamento e primeira tela

- **Rota do dashboard:** ex.: `admin` ou `admin/dashboard` como tela principal após login na área admin.
- **Redirect atual:** hoje `admin` redireciona para `admin/produtos`. Alterar para redirecionar para `admin/dashboard` (ou para `dashboard` como filho de `admin`).
- **Guards:** manter authGuard e roleGuard (ADMIN, MANAGER) para toda a área admin; o dashboard fica dentro dessa área.

### 2. Cards do dashboard

- **Card 1 — Total de vendas:** número total de pedidos (orders) concluídos/vendidos no período relevante (ex.: mês atual, ou “todos os tempos” conforme definição). Pode ser contagem de pedidos com status diferente de CANCELED, ou apenas PAID/DELIVERED conforme regra de negócio.
- **Card 2 — Vendas por categorias:** resumo com quantidade de vendas (ou valor) por categoria (ex.: top 5 categorias no mês, ou lista das categorias com contagem). Fonte: agregar `order_items` por `product_category` (ou por category_id se já existir na tarefa de categorias).
- **Outros cards (opcional):** valor total em R$, ticket médio, etc., conforme desejo do produto; pode ser deixado para uma segunda fase.

### 3. Gráfico mês atual vs mês anterior

- **Dado:** comparação de “vendas” do mês atual com as do mês anterior. “Vendas” pode ser: número de pedidos ou valor total (R$). Definir uma métrica (ex.: quantidade de pedidos ou receita em centavos).
- **Apresentação:** gráfico de barras (dois grupos: mês atual e mês anterior) ou de linhas (duas linhas), com legendas em pt-BR (ex.: “Mês atual”, “Mês anterior”) e eixos com rótulos claros.
- **Biblioteca:** usar uma biblioteca de gráficos compatível com Angular (ex.: Chart.js com ng2-charts, ou Angular Material com gráficos, ou outra já usada no projeto). Não inventar biblioteca; verificar dependências atuais.

### 4. Backend (API)

- **Endpoint(s) de resumo:** ex.: `GET /api/admin/dashboard/summary` (ou `/api/dashboard/summary`) retornando:
  - Total de vendas (contagem e/ou valor) no mês atual e no mês anterior (para o gráfico).
  - Total geral de vendas (para card).
  - Vendas por categoria (lista de categorias com contagem ou valor) para o card de categorias.
- **Definição de “venda”:** pedidos com status que indiquem venda efetiva (ex.: excluir CANCELED; incluir CREATED, PAID, PICKING, SHIPPED, DELIVERED — ou apenas PAID e DELIVERED, conforme regra).
- **Camada:** repository com consultas SQL de agregação (COUNT, SUM, GROUP BY); service que monta o DTO; controller protegido por role ADMIN/MANAGER.

### 5. Frontend (página e componentes)

- **Página:** `AdminDashboardPageComponent` (ou nome equivalente) com layout responsivo: cards no topo, gráfico abaixo (ou ao lado em desktop).
- **Dados:** chamar o(s) endpoint(s) ao carregar a página; usar Signals ou observables; tratar loading e erro com mensagem em pt-BR.
- **Texto:** títulos e legendas em pt-BR; valores monetários no formato R$ brasileiro.

## Checklist de tarefas

### Backend

- [ ] Repository: métodos para agregar vendas (total de pedidos no mês atual/anterior, total geral, por categoria).
- [ ] Service: montar DTO de resumo do dashboard (totais, por categoria, dados para gráfico).
- [ ] Controller + rota GET protegida por ADMIN/MANAGER; resposta em JSON.
- [ ] Definir claramente quais status de pedido contam como “venda” e documentar (ou constante no código).

### Frontend — Roteamento

- [ ] Criar rota `admin/dashboard` (ou `admin` com componente dashboard) com componente de dashboard.
- [ ] Alterar redirect da área admin de `produtos` para `dashboard`.
- [ ] Menu/layout admin: link ativo para “Dashboard” na primeira posição.

### Frontend — Dashboard

- [ ] Componente de página do dashboard (cards + gráfico).
- [ ] Card: total de vendas (número de pedidos e/ou valor em R$).
- [ ] Card: vendas por categorias (lista ou top N).
- [ ] Gráfico: mês atual vs mês anterior (barras ou linhas) com biblioteca escolhida.
- [ ] Serviço ou facade para chamar API do dashboard; tratamento de loading e erro.
- [ ] Textos e valores em pt-BR; formato R$ onde aplicável.

### Qualidade

- [ ] Build e lint (frontend e backend) passando.
- [ ] Testes unitários para service do dashboard (backend), se aplicável.
- [ ] Acessibilidade básica: labels e títulos claros; contraste adequado.

## Critérios de aceite

- [ ] Ao logar como ADMIN ou MANAGER, a primeira tela da área admin é o dashboard.
- [ ] Dashboard exibe pelo menos um card com total de vendas e um com vendas por categorias.
- [ ] Gráfico compara vendas do mês atual com as do mês anterior, com legendas em pt-BR.
- [ ] Dados vêm da API (orders/order_items); definição de “venda” consistente.
- [ ] Textos em pt-BR; valores em R$ quando for valor monetário.

## Referências

- `CLAUDE.md` / `AGENTS.md` — regras e arquitetura.
- `frontend/src/app/features/admin/routes.ts` — rotas atuais (redirect para `produtos`).
- `backend/database/migrations/004_create_orders_checkout.sql` — estrutura de `orders` e `order_items`.
- `backend/src/services/admin-orders.service.ts` e repositórios de pedidos — contexto de consultas a orders.

## Commit sugerido

- `feat(admin): dashboard com cards de vendas, por categoria e gráfico mês atual vs anterior`
