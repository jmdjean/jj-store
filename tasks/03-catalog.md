# Etapa 03 — Catálogo público + Detalhe do Produto

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
Exibir listagem pública de produtos e página de detalhes.

## Checklist de tarefas
### Banco/Seed
- [ ] Criar tabelas `products` e `inventory` (se ainda não existirem).
- [ ] Seed com alguns produtos para desenvolvimento.

### Backend
- [ ] `GET /products` (public):
  - filtros: `q` (texto), `category`, `minPrice`, `maxPrice`
  - paginação: `page`, `pageSize`
- [ ] `GET /products/:id` (public)
- [ ] Respostas pt-BR quando necessário (ex.: “Produto não encontrado”).

### Frontend (UI profissional)
- [ ] Página de catálogo:
  - cards de produto (imagem, nome, preço, categoria)
  - busca e filtros
  - responsivo
- [ ] Página de detalhes:
  - imagem (se houver)
  - descrição, peso, preço, disponibilidade
  - botão “Adicionar ao carrinho”
- [ ] Mensagens pt-BR (ex.: “Sem resultados”).

## Critérios de aceite
- [ ] Catálogo lista produtos e aplica filtros.
- [ ] Detalhe abre corretamente.
- [ ] UI com aparência de loja (header com busca e carrinho).

## Commit sugerido
- `feat(catalogo): listagem pública e detalhes de produto (pt-BR)`
