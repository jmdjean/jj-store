# Etapa 08 — Admin/Manager: Controle de Vendas/Pedidos (workflow de status)

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
Permitir que ADMIN/MANAGER gerenciem pedidos e status de entrega.

## Checklist de tarefas
### Backend
- [ ] `GET /admin/orders` (ADMIN/MANAGER):
  - filtros por status, data, customer
- [ ] `PUT /admin/orders/:id/status` (ADMIN/MANAGER):
  - validar transições de status (definir regras simples v1)
  - registrar auditoria
  - mensagens pt-BR
- [ ] Garantir que `DELIVERED` bloqueia cancelamento do customer.

### Frontend
- [ ] Tela “Pedidos” (admin/manager):
  - listagem com filtros e busca
  - detalhes do pedido (itens, endereço snapshot)
  - alterar status via dropdown + salvar
- [ ] Feedback pt-BR.

## Critérios de aceite
- [ ] Admin/Manager lista e atualiza pedidos.
- [ ] Auditoria criada para mudanças.
- [ ] Customer não consegue cancelar entregue.

## Commit sugerido
- `feat(admin-pedidos): gestão de pedidos e status (pt-BR)`
