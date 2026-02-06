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

## Deploy no Render (um único serviço)

O `render.yaml` na raiz provisiona:

- `jj-store-db` (PostgreSQL)
- `jj-store` (Web Service: API + frontend Angular no mesmo servidor)

### Como publicar

1. No Render, use **Blueprint** e conecte o repositório.
2. Faça o deploy usando o `render.yaml` da raiz.
3. As migrations rodam automaticamente no preDeploy.

### Observações

- Tudo roda em uma única URL: a API em rotas como `/health`, `/auth/login`, etc., e o site Angular em qualquer outra rota.
- O backend usa `DATABASE_URL` do banco provisionado pelo Render.
