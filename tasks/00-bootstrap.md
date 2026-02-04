# Etapa 00 — Bootstrap do repositório (monorepo) e infraestrutura

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
Criar a base do projeto com:
- `frontend/` em Angular 21
- `backend/` em Node.js
- Docker Compose com PostgreSQL
- Padronização (lint/format), scripts de execução e variáveis de ambiente.

## Checklist de tarefas
### Repositório
- [ ] Criar estrutura:
  - [ ] `frontend/` (Angular 21)
  - [ ] `backend/` (Node.js)
  - [ ] `tasks/` (esta pasta)
  - [ ] `docs/` (opcional, para diagramas e decisões)
- [ ] Definir `.editorconfig`, `.gitignore`, `.prettierrc` (ou equivalente) e `eslint` (front/back).

### Docker / Banco
- [ ] Criar `docker-compose.yml` com:
  - [ ] Postgres (porta padrão interna, map externo configurável)
  - [ ] Volume para persistência
- [ ] Adicionar `.env.example` (sem segredos) com:
  - `DATABASE_URL=` (string de conexão)
  - `JWT_SECRET=`
  - `JWT_EXPIRES_IN=`
  - `NODE_ENV=`

### Backend (esqueleto)
- [ ] Criar projeto Node com estrutura mínima:
  - `src/`
    - `routes/`
    - `controllers/`
    - `services/`
    - `repositories/`
    - `middlewares/`
    - `config/`
- [ ] Endpoint health-check `GET /health` retornando JSON pt-BR:
  - `{ "status": "ok", "mensagem": "Serviço online" }`

### Frontend (esqueleto)
- [ ] Criar Angular 21 com:
  - [ ] Rotas básicas (home)
  - [ ] Layout inicial (header, container)
  - [ ] Serviço de API (baseUrl em env)
- [ ] Exibir mensagens de erro/sucesso pt-BR (placeholder).

## Critérios de aceite
- [ ] `docker compose up` sobe o Postgres sem erro.
- [ ] `GET /health` responde corretamente.
- [ ] `frontend` inicia e exibe a tela base.
- [ ] Estrutura de pastas conforme especificado.

## Commit sugerido
- `chore: bootstrap do projeto (frontend+backend+postgres)`
