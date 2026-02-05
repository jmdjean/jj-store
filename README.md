# JJ Store

Monorepo da loja online com backend em Node.js + TypeScript e frontend Angular 21.

## Estrutura

- `backend`: API REST (Express + TypeScript + PostgreSQL)
- `frontend`: aplicação web Angular 21
- `tasks`: roadmap por etapas

## Pré-requisitos

- Node.js 22+
- npm 10+
- PostgreSQL 16+

## Rodar localmente

1. Instale as dependências:

```bash
npm --prefix backend ci
npm --prefix frontend ci
```

2. Configure variáveis de ambiente no backend (`.env`), usando `.env.example` como base.

3. Rode backend e frontend em terminais separados:

```bash
npm --prefix backend run dev
npm --prefix frontend run start
```

4. Acesse:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

## Checks de qualidade

```bash
npm run lint
npm run test
npm run build
```

## Deploy no Render (monorepo)

Este repositório já inclui `render.yaml` para provisionar:

- `jj-store-db` (PostgreSQL)
- `jj-store-backend` (Web Service)
- `jj-store-frontend` (Static Site)

### Como publicar

1. No Render, selecione **Blueprint** e conecte o repositório.
2. Faça o deploy usando o arquivo `render.yaml` da raiz.
3. Após o banco subir, execute as migrations SQL do backend no banco provisionado (arquivos em `backend/database/migrations`).

### Observações importantes

- O frontend em produção recebe a URL da API via variável `API_BASE_URL` definida no `render.yaml`.
- O backend usa `DATABASE_URL` do banco provisionado automaticamente no Render.
