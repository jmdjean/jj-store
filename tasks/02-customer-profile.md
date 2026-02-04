# Etapa 02 — Cadastro de Customer + Perfil (CPF, dados pessoais, endereço)

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
Permitir cadastro de Customer com dados completos, além de consultar/atualizar perfil.

## Checklist de tarefas
### Banco
- [ ] Criar tabela `customers_profile`:
  - `user_id (fk users.id)`
  - `cpf (unique)`, `full_name`, `birth_date` (preferível a idade)
  - endereço (rua, número, bairro, cidade, UF, CEP, complemento)
  - timestamps

### Backend
- [ ] `POST /auth/register-customer`:
  - valida CPF, e-mail e senha
  - cria usuário `CUSTOMER` + profile
  - retorna sucesso pt-BR
- [ ] `GET /me/profile` (CUSTOMER)
- [ ] `PUT /me/profile` (CUSTOMER) com validações:
  - e-mail válido, CEP, etc.
- [ ] Erros pt-BR (ex.: “CPF já cadastrado”, “E-mail já cadastrado”).

### Frontend
- [ ] Tela `/cadastro` (customer) com formulário completo.
- [ ] Tela `/minha-conta/perfil`:
  - editar nome, telefone, e-mail e endereço
- [ ] Feedback pt-BR em toasts/snackbars.

## Critérios de aceite
- [ ] Customer consegue se cadastrar e logar.
- [ ] Customer consegue ver e atualizar perfil.
- [ ] Validações e mensagens em pt-BR.

## Commit sugerido
- `feat(customer): cadastro e perfil do cliente (pt-BR)`
