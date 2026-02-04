# Etapa 01 — Autenticação (JWT) + RBAC (roles)

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
Implementar autenticação com JWT e controle de acesso por role (Admin/Manager/Customer).

## Checklist de tarefas
### Banco e modelagem
- [ ] Criar migrations para tabela `users`:
  - `id (uuid)`, `role`, `email (opcional)`, `username (opcional)`, `password_hash`, `phone (opcional)`, timestamps
- [ ] Criar seed para um usuário ADMIN inicial (ex.: username `admin`).
- [ ] Implementar hash de senha com bcrypt/argon2.

### Backend
- [ ] `POST /auth/login`:
  - aceita `username` **ou** `email` + `senha`
  - retorna `{ token, usuario: { id, role, nomeExibicao } }`
  - mensagens pt-BR em erros (ex.: “Credenciais inválidas”)
- [ ] Middleware `authGuard` (JWT) e `roleGuard`:
  - Ex.: `ADMIN` e `MANAGER` acessam rotas `/admin/*`
- [ ] Padronizar respostas de erro:
  - `{ "mensagem": "...", "detalhes": ... }`

### Frontend
- [ ] Tela `/login` com formulário (usuário/e-mail + senha).
- [ ] `AuthService` para armazenar token (localStorage) e role.
- [ ] Guards:
  - `authGuard`
  - `roleGuard` (ADMIN/MANAGER)
- [ ] Interceptor HTTP para adicionar `Authorization: Bearer <token>`.
- [ ] Mensagens pt-BR em validação do formulário e erros de login.

## Critérios de aceite
- [ ] Login funciona e protege rotas.
- [ ] Usuários sem permissão recebem erro pt-BR (`403` com mensagem adequada).
- [ ] Frontend redireciona corretamente (ex.: tentar acessar admin sem role).

## Commit sugerido
- `feat(auth): login JWT e RBAC por perfis (pt-BR)`
