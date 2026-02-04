# Etapa 06 — Admin/Manager: CRUD de Produtos + Estoque

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
Permitir que ADMIN/MANAGER cadastrem e editem produtos e estoque.

## Checklist de tarefas
### Backend
- [ ] Endpoints protegidos (ADMIN/MANAGER):
  - [ ] `GET /admin/products`
  - [ ] `POST /admin/products`
  - [ ] `PUT /admin/products/:id`
  - [ ] `DELETE /admin/products/:id` (opcional v1)
- [ ] Regras:
  - [ ] validar preços, peso, quantidade >= 0
  - [ ] imagem opcional
- [ ] Auditoria:
  - [ ] registrar criação/edição e usuário que executou
- [ ] Mensagens pt-BR nas respostas e erros.

### Frontend (Admin/Manager)
- [ ] Área admin com layout profissional (sidebar/topbar).
- [ ] Tela “Produtos”:
  - listagem com busca/filtro
  - botão “Novo produto”
- [ ] Tela “Cadastrar/Editar produto” com:
  - nome, descrição, categoria, quantidade, peso, preço compra, preço venda, imagem opcional
- [ ] Feedback pt-BR em sucesso/erro.

## Critérios de aceite
- [ ] CRUD funcional e protegido por RBAC.
- [ ] Dados persistidos corretamente (products + inventory).
- [ ] UI administrativa pronta para uso.

## Commit sugerido
- `feat(admin): CRUD de produtos e estoque (pt-BR)`
