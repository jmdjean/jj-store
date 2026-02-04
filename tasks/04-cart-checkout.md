# Etapa 04 — Carrinho + Checkout (criação de pedido e baixa de estoque)

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
Implementar carrinho no frontend e checkout no backend (sem gateway de pagamento na v1).

## Checklist de tarefas
### Frontend
- [ ] `CartService` com persistência (localStorage).
- [ ] Tela `/carrinho`:
  - listar itens, alterar quantidade, remover
  - subtotal
- [ ] Tela `/checkout`:
  - exigir login (redirecionar para login e voltar)
  - confirmar endereço (do perfil) e finalizar compra
- [ ] Mensagens pt-BR (ex.: “Quantidade indisponível em estoque”).

### Backend
- [ ] Criar tabelas `orders` e `order_items`.
- [ ] `POST /cart/checkout` (CUSTOMER):
  - entrada: itens `{ productId, quantity }` + endereço (opcional; usar snapshot do perfil)
  - valida estoque e preços
  - cria pedido + itens
  - baixa estoque (transação)
  - retorna confirmação pt-BR com `orderId`
- [ ] Erros pt-BR:
  - “Estoque insuficiente para o produto X”
  - “Produto não encontrado”

## Critérios de aceite
- [ ] Checkout cria pedido e atualiza estoque corretamente.
- [ ] Carrinho funciona e persiste.
- [ ] Erros/sucesso em pt-BR.

## Commit sugerido
- `feat(pedidos): carrinho e checkout com baixa de estoque (pt-BR)`
