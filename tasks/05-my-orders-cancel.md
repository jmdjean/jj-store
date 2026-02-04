# Etapa 05 — Minhas compras + Cancelamento (<= 3 dias e não entregue)

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
Customer visualiza pedidos e pode cancelar quando permitido.

## Checklist de tarefas
### Backend
- [ ] `GET /me/orders` (CUSTOMER):
  - listagem paginada e ordenada por data
- [ ] `GET /me/orders/:id` (CUSTOMER) (opcional)
- [ ] `POST /me/orders/:id/cancel` (CUSTOMER):
  - permitir se `status != DELIVERED` e `created_at` <= 3 dias
  - mudar status para `CANCELED`
  - devolver estoque (transação)
  - registrar auditoria
  - mensagens pt-BR

### Frontend
- [ ] Tela `/minhas-compras`:
  - listar pedidos com status (badge)
  - botão “Cancelar” apenas quando permitido
- [ ] Tela de detalhes (opcional v1) para itens do pedido.
- [ ] Mensagens pt-BR (ex.: “Pedido cancelado com sucesso”, “Prazo de cancelamento expirado”).

## Critérios de aceite
- [ ] Regras de cancelamento respeitadas.
- [ ] Estoque devolvido em cancelamento.
- [ ] UI mostra status e permite cancelar quando aplicável.

## Commit sugerido
- `feat(minhas-compras): listagem e cancelamento com regra de 3 dias (pt-BR)`
